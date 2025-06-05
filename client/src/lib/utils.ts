import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDaysUntilHarvest(harvestDate: string | Date): number {
  const harvest = new Date(harvestDate);
  const now = new Date();
  const diffTime = harvest.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getDaysSincePlanted(plantedDate: string | Date): number {
  const planted = new Date(plantedDate);
  const now = new Date();
  const diffTime = now.getTime() - planted.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function getGrowthProgress(plantedDate: string | Date, harvestDate: string | Date): number {
  const planted = new Date(plantedDate);
  const harvest = new Date(harvestDate);
  const now = new Date();
  
  const totalGrowthTime = harvest.getTime() - planted.getTime();
  const elapsedTime = now.getTime() - planted.getTime();
  
  const progress = Math.max(0, Math.min(100, (elapsedTime / totalGrowthTime) * 100));
  return Math.round(progress);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString();
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString();
}

export function getProgressColor(progress: number, status: string): string {
  if (status === "ready" || status === "harvested") return "progress-success";
  if (progress >= 80) return "progress-blue";
  return "progress-blue";
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "ready":
      return "bg-green-100 text-green-700";
    case "flowering":
      return "bg-purple-100 text-purple-700";
    case "growing":
      return "bg-blue-100 text-blue-700";
    case "harvested":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export function generateCropUrl(cropId: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/crop/${cropId}`;
}
