import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Calendar, MapPin, Scissors, Clipboard, QrCode, Trash2 } from "lucide-react";
import EventModal from "@/components/event-modal";
import QRModal from "@/components/qr-modal";
import { useState } from "react";
import type { Crop, Event } from "@shared/schema";
import { getDaysUntilHarvest, getDaysSincePlanted, getGrowthProgress, getStatusColor, formatDateTime } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function CropDetail() {
  const [, params] = useRoute("/crop/:id");
  const [, setLocation] = useLocation();
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cropData, isLoading } = useQuery<Crop & { events: Event[] }>({
    queryKey: ["/api/crops", params?.id],
    queryFn: () => apiRequest("GET", `/api/crops/${params?.id}`).then(res => res.json()),
    enabled: !!params?.id,
  });

  const { data: subareaData } = useQuery({
    queryKey: ["/api/grow-areas/subarea", cropData?.subareaId],
    queryFn: async () => {
      if (!cropData?.subareaId) return null;
      const res = await apiRequest("GET", `/api/grow-areas/subareas/${cropData.subareaId}`);
      return res.json();
    },
    enabled: !!cropData?.subareaId,
  });

  const { data: growAreaData } = useQuery({
    queryKey: ["/api/grow-areas/area", cropData?.areaId],
    queryFn: async () => {
      if (!cropData?.areaId) return null;
      const res = await apiRequest("GET", `/api/grow-areas/${cropData.areaId}`);
      return res.json();
    },
    enabled: !!cropData?.areaId && !cropData?.subareaId,
  });

  const harvestMutation = useMutation({
    mutationFn: async (cropId: string) => {
      const response = await apiRequest("PATCH", `/api/crops/${cropId}`, {
        status: "harvested",
        actualHarvestDate: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crops", params?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/crops"] });
      toast({
        title: "Crop Harvested",
        description: "Crop has been marked as harvested successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to harvest crop. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (cropId: string) => {
      const response = await apiRequest("DELETE", `/api/crops/${cropId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crops"] });
      toast({
        title: "Crop Deleted",
        description: "Crop has been successfully deleted",
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete crop. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (!cropData) return;
    deleteMutation.mutate(cropData.id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-gray-200 rounded mb-4 mx-auto"></div>
            <div className="h-4 w-48 bg-gray-200 rounded mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!cropData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Crop Not Found</h1>
            <p className="text-gray-600 mb-4">The crop you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation('/')}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const crop = cropData;
  const events = cropData.events || [];

  const daysUntilHarvest = cropData ? getDaysUntilHarvest(cropData.expectedHarvestDate) : 0;
  const daysSincePlanted = cropData ? getDaysSincePlanted(cropData.plantedDate) : 0;
  const growthProgress = cropData ? getGrowthProgress(cropData.plantedDate, cropData.expectedHarvestDate) : 0;
  const statusColor = cropData ? getStatusColor(cropData.status) : "";

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "watering": return "bg-blue-100 text-blue-700";
      case "fertilizing": return "bg-green-100 text-green-700";
      case "pruning": return "bg-purple-100 text-purple-700";
      case "treatment": return "bg-red-100 text-red-700";
      case "harvest": return "bg-orange-100 text-orange-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            className="mr-2"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{cropData?.name}</h1>
          {cropData?.variety && (
            <span className="ml-2 text-gray-500">({cropData.variety})</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Crop Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Location</Label>
                    <p className="text-sm text-gray-600">
                      {subareaData
                        ? `${subareaData.name}`
                        : growAreaData
                        ? `${growAreaData.name}`
                        : "No location specified"}
                    </p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge className={statusColor}>
                      {cropData?.status.charAt(0).toUpperCase() + cropData?.status.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <Label>Planted Date</Label>
                    <p className="text-sm text-gray-600">
                      {cropData?.plantedDate ? formatDateTime(cropData.plantedDate) : "Not specified"}
                    </p>
                  </div>
                  <div>
                    <Label>Expected Harvest</Label>
                    <p className="text-sm text-gray-600">
                      {cropData?.expectedHarvestDate ? formatDateTime(cropData.expectedHarvestDate) : "Not specified"}
                    </p>
                  </div>
                </div>

                {cropData?.notes && (
                  <div>
                    <Label>Notes</Label>
                    <p className="text-sm text-gray-600 mt-1">{cropData.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Events History */}
            <Card>
              <CardHeader>
                <CardTitle>Event History</CardTitle>
              </CardHeader>
              <CardContent>
                {events.length > 0 ? (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div key={event.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Badge className={`mt-1 ${getEventTypeColor(event.type)}`}>
                          {event.type}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{formatDateTime(event.eventDate)}</p>
                          {event.notes && (
                            <p className="text-sm text-gray-600 mt-1">{event.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No events recorded yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cropData?.status === "ready" || daysUntilHarvest <= 0 ? (
                  <Button
                    className="w-full bg-primary text-white hover:bg-green-600"
                    onClick={() => harvestMutation.mutate(cropData.id)}
                    disabled={harvestMutation.isPending}
                  >
                    <Scissors className="h-4 w-4 mr-2" />
                    {harvestMutation.isPending ? "Harvesting..." : "Harvest Now"}
                  </Button>
                ) : null}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsEventModalOpen(true)}
                >
                  <Clipboard className="h-4 w-4 mr-2" />
                  Log Event
                </Button>

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteMutation.isPending ? "Deleting..." : "Delete Crop"}
                </Button>
              </CardContent>
            </Card>

            {cropData?.imageUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>Photo</CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={cropData.imageUrl}
                    alt={cropData.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        crop={crop}
      />

      <QRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        crop={crop}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Crop</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this crop? This action cannot be undone.</p>
          </div>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
