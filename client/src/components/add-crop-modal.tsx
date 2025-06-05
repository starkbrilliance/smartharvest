import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCropSchema } from "@shared/schema";
import { z } from "zod";

const addCropSchema = insertCropSchema.extend({
  plantedDate: z.string().min(1, "Planted date is required"),
  expectedHarvestDate: z.string().min(1, "Expected harvest date is required"),
});

type AddCropFormData = z.infer<typeof addCropSchema>;

interface AddCropModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddCropModal({ isOpen, onClose }: AddCropModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddCropFormData>({
    resolver: zodResolver(addCropSchema),
    defaultValues: {
      status: "growing",
      plantedDate: new Date().toISOString().split('T')[0],
      expectedHarvestDate: "",
    },
  });

  const createCropMutation = useMutation({
    mutationFn: async (cropData: AddCropFormData) => {
      const formattedData = {
        ...cropData,
        plantedDate: new Date(cropData.plantedDate + 'T00:00:00Z').toISOString(),
        expectedHarvestDate: new Date(cropData.expectedHarvestDate + 'T00:00:00Z').toISOString(),
      };

      const response = await apiRequest("POST", "/api/crops", formattedData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crops"] });
      toast({
        title: "Crop Added",
        description: "New crop has been successfully added to your farm",
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Error adding crop:', error);
      toast({
        title: "Error",
        description: "Failed to add crop. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddCropFormData) => {
    createCropMutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const location = watch("location");

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-screen overflow-y-auto" aria-describedby="add-crop-description">
        <DialogHeader>
          <DialogTitle>Add New Crop</DialogTitle>
          <p id="add-crop-description" className="text-sm text-muted-foreground">
            Fill in the details below to add a new crop to your farm.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Crop Name *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., Sweet Basil"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="variety">Variety</Label>
            <Input
              id="variety"
              {...register("variety")}
              placeholder="e.g., Genovese"
            />
          </div>

          <div>
            <Label htmlFor="location">Location *</Label>
            <Select value={location} onValueChange={(value) => setValue("location", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tent 1, Shelf 1">Tent 1, Shelf 1</SelectItem>
                <SelectItem value="Tent 1, Shelf 2">Tent 1, Shelf 2</SelectItem>
                <SelectItem value="Tent 1, Shelf 3">Tent 1, Shelf 3</SelectItem>
                <SelectItem value="Tent 2, Floor">Tent 2, Floor</SelectItem>
              </SelectContent>
            </Select>
            {errors.location && (
              <p className="text-sm text-red-600 mt-1">{errors.location.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="plantedDate">Planted Date *</Label>
            <Input
              id="plantedDate"
              type="date"
              {...register("plantedDate")}
            />
            {errors.plantedDate && (
              <p className="text-sm text-red-600 mt-1">{errors.plantedDate.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="expectedHarvestDate">Expected Harvest Date *</Label>
            <Input
              id="expectedHarvestDate"
              type="date"
              {...register("expectedHarvestDate")}
            />
            {errors.expectedHarvestDate && (
              <p className="text-sm text-red-600 mt-1">{errors.expectedHarvestDate.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Any additional notes about this crop..."
              rows={3}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-green-600 text-white"
              disabled={createCropMutation.isPending}
            >
              {createCropMutation.isPending ? "Adding..." : "Add Crop"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
