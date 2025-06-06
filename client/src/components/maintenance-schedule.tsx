import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, Clock, Droplets, Scissors, Clipboard } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface MaintenanceEvent {
  eventType: string;
  frequency: string;
  notes?: string;
  startDate: string;
  endDate: string;
}

interface MaintenanceScheduleProps {
  events: MaintenanceEvent[];
  onCompleteEvent: (event: MaintenanceEvent) => void;
}

const getEventIcon = (type: string) => {
  switch (type) {
    case "watering":
      return <Droplets className="h-4 w-4" />;
    case "fertilizing":
      return <Scissors className="h-4 w-4" />;
    case "inspection":
      return <Clipboard className="h-4 w-4" />;
    default:
      return <Calendar className="h-4 w-4" />;
  }
};

const getEventColor = (type: string) => {
  switch (type) {
    case "watering":
      return "bg-blue-100 text-blue-700";
    case "fertilizing":
      return "bg-green-100 text-green-700";
    case "inspection":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getCadenceBadgeColor = (frequency: string) => {
  switch (frequency.toLowerCase()) {
    case "daily":
      return "bg-green-500 text-white";
    case "weekly":
      return "bg-blue-500 text-white";
    case "every 2 days":
      return "bg-orange-500 text-white";
    case "every 3 days":
      return "bg-purple-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export default function MaintenanceSchedule({ events, onCompleteEvent }: MaintenanceScheduleProps) {
  const [completedEvents, setCompletedEvents] = useState<Set<string>>(new Set());

  const handleComplete = (event: MaintenanceEvent) => {
    const eventKey = `${event.eventType}-${event.startDate}`;
    setCompletedEvents(prev => new Set([...Array.from(prev), eventKey]));
    onCompleteEvent(event);
  };

  const getNextOccurrence = (event: MaintenanceEvent) => {
    const now = new Date();
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);

    if (now > end) return null;
    if (now < start) return start;

    // Calculate next occurrence based on frequency
    const frequency = event.frequency.toLowerCase();
    let nextDate = new Date(start);

    while (nextDate <= now) {
      if (frequency === "daily") {
        nextDate.setDate(nextDate.getDate() + 1);
      } else if (frequency === "weekly") {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (frequency === "every_3_days") {
        nextDate.setDate(nextDate.getDate() + 3);
      } else if (frequency === "every_2_days") {
        nextDate.setDate(nextDate.getDate() + 2);
      }
    }

    return nextDate <= end ? nextDate : null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event, index) => {
            const eventKey = `${event.eventType}-${event.startDate}`;
            const isCompleted = completedEvents.has(eventKey);
            const nextOccurrence = getNextOccurrence(event);

            return (
              <div key={index} className="flex flex-col p-3 bg-gray-50 rounded-lg space-y-3">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full ${getEventColor(event.eventType)}`}>
                    {getEventIcon(event.eventType)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium capitalize">{event.eventType}</h4>
                      <Badge className={`text-xs pointer-events-none ml-2 ${getCadenceBadgeColor(event.frequency.replace(/_/g, ' '))}`}>
                        {event.frequency.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    {event.notes && (
                      <p className="text-sm text-gray-600 mt-1">{event.notes}</p>
                    )}
                    {nextOccurrence && (
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        Next: {formatDate(nextOccurrence)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleComplete(event)}
                    disabled={isCompleted}
                    className={`w-full font-semibold transition-colors ${!isCompleted ? 'border-green-500 text-green-700 hover:bg-green-500 hover:text-white' : ''}`}
                  >
                    {isCompleted ? (
                      "Completed"
                    ) : (
                      "Complete"
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
