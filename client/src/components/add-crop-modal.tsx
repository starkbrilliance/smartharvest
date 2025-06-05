import { useState, useEffect } from "react";
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
import { useLocation } from "wouter";

const addCropSchema = insertCropSchema.extend({
  cropName: z.string().min(1, "Crop name is required"),
  plantedDate: z.string().min(1, "Planted date is required"),
  expectedHarvestDate: z.string().min(1, "Expected harvest date is required"),
  subareaId: z.string().optional().or(z.literal("")),
});

type AddCropFormData = z.infer<typeof addCropSchema>;

interface AddCropModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddCropModal({ isOpen, onClose }: AddCropModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

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
      cropName: "",
      plantedDate: new Date().toISOString().split('T')[0],
      expectedHarvestDate: "",
      subareaId: "",
    },
  });

  // Grow area and subarea state
  const [areas, setAreas] = useState<any[]>([]);
  const [areasError, setAreasError] = useState<string | null>(null);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [subareas, setSubareas] = useState<any[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [selectedSubareaId, setSelectedSubareaId] = useState<string>("");
  const [addingArea, setAddingArea] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [addingSubarea, setAddingSubarea] = useState(false);
  const [newSubareaName, setNewSubareaName] = useState("");

  // Fetch grow areas on open
  useEffect(() => {
    if (isOpen) {
      setLoadingAreas(true);
      fetchAreas();
    }
  }, [isOpen]);

  // If no grow areas, redirect to grow areas page
  useEffect(() => {
    // Debugging: log effect dependencies
    console.log('Redirect effect:', { isOpen, loadingAreas, areas, areasError });
    if (
      isOpen &&
      loadingAreas === false &&
      Array.isArray(areas) &&
      areas.length === 0 &&
      !areasError
    ) {
      // Defensive: only redirect if modal is still open
      if (isOpen) {
        handleClose();
        toast({
          title: "Add a Grow Area First",
          description: "You need to add a grow area before adding a crop.",
          variant: "destructive",
        });
        navigate("/grow-areas");
      }
    }
  }, [isOpen, loadingAreas, areas, areasError]);

  const fetchAreas = async () => {
    setLoadingAreas(true);
    try {
      const res = await apiRequest("GET", "/api/grow-areas");
      if (!res.ok) {
        if (res.status === 401) {
          setAreasError("You are not logged in or your session has expired. Please log in again.");
        } else {
          setAreasError("Failed to fetch grow areas.");
        }
        setAreas([]);
        setLoadingAreas(false);
        return;
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        setAreasError("Unexpected response from server.");
        setAreas([]);
        setLoadingAreas(false);
        return;
      }
      setAreasError(null);
      setAreas(data);
      console.log('Areas set:', data);
      if (data.length > 0) setSelectedAreaId(data[0].id);
      setLoadingAreas(false);
    } catch (err) {
      setAreasError("Failed to fetch grow areas (network error).");
      setAreas([]);
      setLoadingAreas(false);
    }
  };

  // Fetch subareas when area changes
  useEffect(() => {
    if (selectedAreaId) fetchSubareas(selectedAreaId);
  }, [selectedAreaId]);

  const fetchSubareas = async (areaId: string) => {
    const res = await apiRequest("GET", `/api/grow-areas/${areaId}/subareas`);
    const data = await res.json();
    setSubareas(data);
    if (data.length > 0) setSelectedSubareaId(data[0].id);
    else setSelectedSubareaId("");
  };

  // Add new grow area
  const handleAddArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaName.trim()) return;
    const res = await apiRequest("POST", "/api/grow-areas", { name: newAreaName });
    const area = await res.json();
    setNewAreaName("");
    setAddingArea(false);
    fetchAreas();
    setSelectedAreaId(area.id);
  };

  // Add new subarea
  const handleAddSubarea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubareaName.trim() || !selectedAreaId) return;
    const res = await apiRequest("POST", `/api/grow-areas/${selectedAreaId}/subareas`, { name: newSubareaName });
    const sub = await res.json();
    setNewSubareaName("");
    setAddingSubarea(false);
    fetchSubareas(selectedAreaId);
    setSelectedSubareaId(sub.id);
  };

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
    // Map cropName to name for backend compatibility
    console.log("Submitting crop:", data);
    createCropMutation.mutate({
      ...data,
      name: data.cropName,
      subareaId: selectedSubareaId || undefined,
    });
  };

  // Debug: log form errors
  console.log("Form errors:", errors);

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-screen overflow-y-auto" aria-describedby="add-crop-description">
        <DialogHeader>
          <DialogTitle>Add New Crop</DialogTitle>
          <p id="add-crop-description" className="text-sm text-muted-foreground">
            Fill in the details below to add a new crop to your farm.
          </p>
        </DialogHeader>

        {areasError && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-center">
            {areasError}
          </div>
        )}

        {/* Add Grow Area Form (top level, not inline) */}
        {addingArea && (
          <form onSubmit={handleAddArea} className="flex gap-2 mb-4">
            <Input
              value={newAreaName}
              onChange={e => setNewAreaName(e.target.value)}
              placeholder="New area name"
              autoFocus
            />
            <Button type="submit">Save</Button>
            <Button type="button" variant="outline" onClick={() => setAddingArea(false)}>Cancel</Button>
          </form>
        )}

        {/* Add Subarea Form (top level, not inline) */}
        {addingSubarea && (
          <form onSubmit={handleAddSubarea} className="flex gap-2 mb-4">
            <Input
              value={newSubareaName}
              onChange={e => setNewSubareaName(e.target.value)}
              placeholder="New subarea name"
              autoFocus
            />
            <Button type="submit">Save</Button>
            <Button type="button" variant="outline" onClick={() => setAddingSubarea(false)}>Cancel</Button>
          </form>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Hidden field to sync cropName to name for Zod validation */}
          <input type="hidden" {...register("name")} value={watch("cropName")} />
          <div>
            <Label htmlFor="cropName">Crop Name *</Label>
            <Input
              id="cropName"
              autoComplete="off"
              {...register("cropName")}
              placeholder="e.g., Sweet Basil"
            />
            {errors.cropName && (
              <p className="text-sm text-red-600 mt-1">{errors.cropName.message}</p>
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
            <Label>Grow Area *</Label>
            <div className="flex gap-2">
              <select
                className="flex-1 border rounded p-2"
                value={selectedAreaId}
                onChange={e => setSelectedAreaId(e.target.value)}
                disabled={!!areasError || areas.length === 0}
              >
                {areas.map(area => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>Subarea</Label>
            <div className="flex gap-2">
              <select
                className="flex-1 border rounded p-2"
                value={selectedSubareaId}
                onChange={e => setSelectedSubareaId(e.target.value)}
                disabled={!selectedAreaId}
              >
                <option value="">None</option>
                {subareas.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
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
