import { Card, CardContent } from "@/components/ui/card";
import { Sprout, Calendar, Clock, TrendingUp } from "lucide-react";
import type { Crop } from "@shared/schema";

interface StatsCardsProps {
  crops: Crop[];
}

export default function StatsCards({ crops }: StatsCardsProps) {
  const activeCrops = crops.filter(crop => crop.status !== "harvested").length;
  const readyToHarvest = crops.filter(crop => crop.status === "ready").length;
  const needsAttention = crops.filter(crop => {
    const daysSinceLastTreatment = 7; // This would be calculated based on last event
    return daysSinceLastTreatment > 3;
  }).length;
  const monthlyHarvest = crops.filter(crop => {
    if (!crop.actualHarvestDate) return false;
    const harvestDate = new Date(crop.actualHarvestDate);
    const now = new Date();
    return harvestDate.getMonth() === now.getMonth() && harvestDate.getFullYear() === now.getFullYear();
  }).length;

  const stats = [
    {
      title: "Active Crops",
      value: activeCrops,
      icon: Sprout,
      bgColor: "bg-white-100",
      iconColor: "text-primary",
    },
    {
      title: "Ready to Harvest",
      value: readyToHarvest,
      icon: Calendar,
      bgColor: "bg-green-100",
      iconColor: "text-success",
    },
    {
      title: "Needs Attention",
      value: needsAttention,
      icon: Clock,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "This Month",
      value: monthlyHarvest,
      icon: TrendingUp,
      bgColor: "bg-slate-100",
      iconColor: "text-secondary",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`text-xl h-6 w-6 ${stat.iconColor}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
