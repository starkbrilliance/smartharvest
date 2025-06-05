import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Calendar, MapPin, Scissors, Clipboard, QrCode } from "lucide-react";
import EventModal from "@/components/event-modal";
import QRModal from "@/components/qr-modal";
import { useState } from "react";
import type { Crop, Event } from "@shared/schema";
import { getDaysUntilHarvest, getDaysSincePlanted, getGrowthProgress, getStatusColor, formatDateTime } from "@/lib/utils";

export default function CropDetail() {
  const [, params] = useRoute("/crop/:id");
  const [, setLocation] = useLocation();
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cropData, isLoading } = useQuery<Crop & { events: Event[] }>({
    queryKey: ["/api/crops", params?.id],
    queryFn: () => apiRequest("GET", `/api/crops/${params?.id}`).then(res => res.json()),
    enabled: !!params?.id,
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

  const daysUntilHarvest = getDaysUntilHarvest(crop.expectedHarvestDate);
  const daysSincePlanted = getDaysSincePlanted(crop.plantedDate);
  const growthProgress = getGrowthProgress(crop.plantedDate, crop.expectedHarvestDate);
  const statusColor = getStatusColor(crop.status);

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
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{crop.name}</h1>
                <p className="text-gray-600">{crop.variety || "No variety specified"}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={`${statusColor}`}>
                {crop.status
                  ? crop.status.charAt(0).toUpperCase() + crop.status.slice(1)
                  : "Unknown"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsQRModalOpen(true)}
              >
                <QrCode className="h-4 w-4 mr-2" />
                QR Code
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Crop Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {crop.location}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Days Since Planted</p>
                    <p className="font-medium">{daysSincePlanted} days</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Days Until Harvest</p>
                    <p className={`font-medium ${
                      daysUntilHarvest <= 0 ? "text-red-600" :
                      daysUntilHarvest <= 7 ? "text-blue-600" : "text-green-600"
                    }`}>
                      {daysUntilHarvest <= 0 ? "Overdue" : `${daysUntilHarvest} days`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Growth Progress</p>
                    <div className="flex items-center space-x-2">
                      <Progress value={growthProgress} className="flex-1 h-2" />
                      <span className="text-sm font-medium">{growthProgress}%</span>
                    </div>
                  </div>
                </div>

                {crop.notes && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Notes</p>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg">{crop.notes}</p>
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
                {crop.status === "ready" || daysUntilHarvest <= 0 ? (
                  <Button
                    className="w-full bg-primary text-white hover:bg-green-600"
                    onClick={() => harvestMutation.mutate(crop.id)}
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
              </CardContent>
            </Card>

            {crop.imageUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>Photo</CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={crop.imageUrl}
                    alt={crop.name}
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
    </div>
  );
}
