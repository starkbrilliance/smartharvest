import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Scissors, Droplets, Clipboard, QrCode, ChevronRight, Sprout } from "lucide-react";
import type { Crop } from "@shared/schema";
import { getDaysUntilHarvest, getDaysSincePlanted, getGrowthProgress, getStatusColor, getProgressColor } from "@/lib/utils";

interface CropCardProps {
  crop: Crop;
  onHarvest: (crop: Crop) => void;
  onLogEvent: (crop: Crop) => void;
  onShowQR: (crop: Crop) => void;
  onViewDetails: (crop: Crop) => void;
}

export default function CropCard({ crop, onHarvest, onLogEvent, onShowQR, onViewDetails }: CropCardProps) {
  const daysUntilHarvest = getDaysUntilHarvest(crop.expectedHarvestDate);
  const daysSincePlanted = getDaysSincePlanted(crop.plantedDate);
  const growthProgress = getGrowthProgress(crop.plantedDate, crop.expectedHarvestDate);
  const statusColor = getStatusColor(crop.status);
  const progressColor = getProgressColor(growthProgress, crop.status);

  const getHarvestText = () => {
    if (crop.status === "ready") return "Ready now";
    if (daysUntilHarvest <= 0) return "Overdue";
    return `In ${daysUntilHarvest} days`;
  };

  const getHarvestTextColor = () => {
    if (crop.status === "ready") return "text-green-600";
    if (daysUntilHarvest <= 0) return "text-red-600";
    return "text-blue-600";
  };

  return (
    <Card className="border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-lg bg-gray-100 mr-3 flex items-center justify-center">
              {crop.imageUrl ? (
                <img src={crop.imageUrl} alt={crop.name} className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <Sprout className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{crop.name}</h4>
              <p className="text-sm text-gray-600">{crop.variety || "No variety specified"}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={`text-xs font-medium px-2 py-1 ${statusColor}`}>
              {crop.status.charAt(0).toUpperCase() + crop.status.slice(1)}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-600 p-1"
              onClick={() => onShowQR(crop)}
            >
              <QrCode className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Location:</span>
            <span className="font-medium">{crop.location}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Planted:</span>
            <span className="font-medium">{daysSincePlanted} days ago</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Harvest:</span>
            <span className={`font-medium ${getHarvestTextColor()}`}>
              {getHarvestText()}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Growth Progress</span>
            <span>{growthProgress}%</span>
          </div>
          <Progress value={growthProgress} className="h-2" />
        </div>

        <div className="flex space-x-2">
          {crop.status === "ready" ? (
            <Button
              className="flex-1 bg-primary text-white hover:bg-green-600"
              size="sm"
              onClick={() => onHarvest(crop)}
            >
              <Scissors className="h-4 w-4 mr-1" />
              Harvest
            </Button>
          ) : (
            <Button
              variant="outline"
              className="flex-1"
              size="sm"
              onClick={() => onLogEvent(crop)}
            >
              <Droplets className="h-4 w-4 mr-1" />
              Water
            </Button>
          )}
          <Button
            variant="outline"
            className="flex-1"
            size="sm"
            onClick={() => onLogEvent(crop)}
          >
            <Clipboard className="h-4 w-4 mr-1" />
            Log Event
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="px-3"
            onClick={() => onViewDetails(crop)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
