import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sprout, Bell, Plus, TriangleAlert, Settings } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import StatsCards from "@/components/stats-cards";
import CropCard from "@/components/crop-card";
import EventModal from "@/components/event-modal";
import QRModal from "@/components/qr-modal";
import AddCropModal from "@/components/add-crop-modal";
import type { Crop } from "@shared/schema";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [currentView, setCurrentView] = useState("overview");
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isAddCropModalOpen, setIsAddCropModalOpen] = useState(false);
  const [selectedGrowArea, setSelectedGrowArea] = useState<any>(null);
  const [growAreas, setGrowAreas] = useState<any[]>([]);
  const [subareas, setSubareas] = useState<any[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(true);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: crops = [], isLoading } = useQuery<Crop[]>({
    queryKey: ["/api/crops"],
  });

  // Fetch grow areas and subareas
  useEffect(() => {
    const fetchGrowAreas = async () => {
      setLoadingAreas(true);
      try {
        const res = await apiRequest("GET", "/api/grow-areas");
        const areas = await res.json();
        setGrowAreas(areas);
        setLoadingAreas(false);
      } catch (err) {
        setGrowAreas([]);
        setLoadingAreas(false);
      }
    };
    fetchGrowAreas();
  }, []);

  // Fetch subareas for all grow areas (for filtering)
  useEffect(() => {
    const fetchAllSubareas = async () => {
      if (!growAreas.length) return setSubareas([]);
      let allSubs: any[] = [];
      for (const area of growAreas) {
        try {
          const res = await apiRequest("GET", `/api/grow-areas/${area.id}/subareas`);
          const subs = await res.json();
          allSubs = allSubs.concat(subs.map((s: any) => ({ ...s, growAreaId: area.id })));
        } catch {}
      }
      setSubareas(allSubs);
    };
    fetchAllSubareas();
  }, [growAreas]);

  const harvestMutation = useMutation({
    mutationFn: async (cropId: string) => {
      const response = await apiRequest("PATCH", `/api/crops/${cropId}`, {
        status: "harvested",
        actualHarvestDate: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
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

  const handleHarvest = (crop: Crop) => {
    harvestMutation.mutate(crop.id);
  };

  const handleLogEvent = (crop: Crop) => {
    setSelectedCrop(crop);
    setIsEventModalOpen(true);
  };

  const handleShowQR = (crop: Crop) => {
    setSelectedCrop(crop);
    setIsQRModalOpen(true);
  };

  const handleViewDetails = (crop: Crop) => {
    setLocation(`/crop/${crop.id}`);
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      localStorage.removeItem('smartharvest_session');
      setLocation('/login');
      toast({
        title: "Logged Out",
        description: "Successfully logged out",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Dynamic filtering
  const filteredCrops = currentView === "overview"
    ? crops
    : crops.filter(crop => {
        // Show crops that either:
        // 1. Have a subarea that belongs to the selected grow area
        // 2. Are directly assigned to the selected grow area
        const sub = subareas.find(s => s.id === crop.subareaId);
        return (sub && sub.growAreaId === currentView) || crop.areaId === currentView;
      });

  const urgentTasks = crops.filter(crop => {
    const now = new Date();
    const harvestDate = new Date(crop.expectedHarvestDate);
    return harvestDate <= now && crop.status !== "harvested";
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Sprout className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your farm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Sprout className="text-primary text-2xl mr-3 h-8 w-8" />
              <h1 className="text-xl font-bold text-gray-900">SmartHarvest</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                {urgentTasks.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
                    {urgentTasks.length}
                  </Badge>
                )}
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48">
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        setLocation("/grow-areas");
                      }}
                    >
                      Grow Areas
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                className="bg-primary text-white hover:bg-green-600"
                onClick={() => setIsAddCropModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Crop
              </Button>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              key="overview"
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === "overview"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setCurrentView("overview")}
            >
              All
            </button>
            {growAreas.map((area) => (
              <button
                key={area.id}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  currentView === area.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setCurrentView(area.id)}
              >
                {area.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <StatsCards crops={crops} />

        {/* Today's Tasks */}
        {urgentTasks.length > 0 && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TriangleAlert className="text-red-500 mr-2 h-5 w-5" />
                Today's Tasks
              </h3>
              <div className="space-y-3">
                {urgentTasks.map((crop) => (
                  <div key={crop.id} className="flex items-center justify-between p-4 bg-red-100 rounded-lg border border-red-200">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Harvest {crop.name}
                          {(() => {
                            const sub = subareas.find(s => s.id === crop.subareaId);
                            if (!sub) return "";
                            const area = growAreas.find(a => a.id === sub.growAreaId);
                            return ` (${area ? area.name + ' / ' : ''}${sub.name})`;
                          })()}
                        </p>
                        <p className="text-sm text-gray-600">Overdue</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-red-500 hover:bg-red-600 text-white"
                      onClick={() => handleHarvest(crop)}
                    >
                      Complete
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Crop Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCrops.map((crop) => (
            <CropCard
              key={crop.id}
              crop={crop}
              onHarvest={handleHarvest}
              onLogEvent={handleLogEvent}
              onShowQR={handleShowQR}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>

        {filteredCrops.length === 0 && (
          <div className="text-center py-12">
            <Sprout className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No crops found</h3>
            <p className="text-gray-600 mb-4">Start by adding your first crop to begin tracking.</p>
            <Button
              className="bg-primary text-white hover:bg-green-600"
              onClick={() => setIsAddCropModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Crop
            </Button>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <Button
        className="fixed bottom-6 right-6 bg-primary text-white w-14 h-14 rounded-full shadow-lg hover:bg-green-600 hover:shadow-xl transition-all duration-200 p-0"
        onClick={() => setIsAddCropModalOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Modals */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        crop={selectedCrop}
      />

      <QRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        crop={selectedCrop}
      />

      <AddCropModal
        isOpen={isAddCropModalOpen}
        onClose={() => setIsAddCropModalOpen(false)}
      />
    </div>
  );
}
