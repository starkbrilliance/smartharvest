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
import type { Crop } from "@shared/schema";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  crop: Crop | null;
}

// Helper to get local datetime string in "YYYY-MM-DDTHH:mm" format
function getLocalDateTimeString() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export default function EventModal({ isOpen, onClose, crop }: EventModalProps) {
  const [eventType, setEventType] = useState("watering");
  const [notes, setNotes] = useState("");
  const [eventDate, setEventDate] = useState(getLocalDateTimeString());

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await apiRequest("POST", `/api/crops/${crop?.id}/events`, eventData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crops"] });
      if (crop) {
        queryClient.invalidateQueries({ queryKey: ["/api/crops", crop.id] });
      }
      toast({
        title: "Event Logged",
        description: "Event has been successfully recorded",
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to log event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!crop) return;

    createEventMutation.mutate({
      type: eventType,
      notes,
      eventDate: new Date(eventDate).toISOString(),
    });
  };

  const handleClose = () => {
    setEventType("watering");
    setNotes("");
    setEventDate(getLocalDateTimeString());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="eventType">Event Type</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="watering">Watering</SelectItem>
                <SelectItem value="fertilizing">Fertilizing</SelectItem>
                <SelectItem value="pruning">Pruning</SelectItem>
                <SelectItem value="inspection">Inspection</SelectItem>
                <SelectItem value="treatment">Pest Treatment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add detailed notes about this event..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="eventDate">Date & Time</Label>
            <Input
              id="eventDate"
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-green-600 text-white"
              disabled={createEventMutation.isPending}
            >
              {createEventMutation.isPending ? "Saving..." : "Save Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
