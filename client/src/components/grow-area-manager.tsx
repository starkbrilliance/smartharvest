import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface GrowArea {
  id: string;
  name: string;
  createdAt: string;
}

interface GrowAreaManagerProps {
  onSelectArea: (area: GrowArea | null) => void;
}

export default function GrowAreaManager({ onSelectArea }: GrowAreaManagerProps) {
  const [areas, setAreas] = useState<GrowArea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const { toast } = useToast();

  const fetchAreas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest("GET", "/api/grow-areas");
      const data = await res.json();
      if (!Array.isArray(data)) {
        setError("Unexpected response from server.");
        setAreas([]);
        return;
      }
      setAreas(data);
    } catch (err) {
      setError("Failed to fetch grow areas. Please log in again.");
      setAreas([]);
      toast({
        title: "Error",
        description: "Failed to fetch grow areas. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const res = await apiRequest("POST", "/api/grow-areas", { name: newName });
      const area = await res.json();
      setNewName("");
      fetchAreas();
      toast({
        title: "Success",
        description: "Grow area created successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create grow area. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (area: GrowArea) => {
    setEditingId(area.id);
    setEditingName(area.name);
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      const res = await apiRequest("PATCH", `/api/grow-areas/${id}`, { name: editingName });
      const area = await res.json();
      setEditingId(null);
      setEditingName("");
      fetchAreas();
      toast({
        title: "Success",
        description: "Grow area updated successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update grow area. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this grow area?")) return;
    try {
      await apiRequest("DELETE", `/api/grow-areas/${id}`);
      if (editingId === id) setEditingId(null);
      fetchAreas();
      onSelectArea(null);
      toast({
        title: "Success",
        description: "Grow area deleted successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete grow area. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="text-red-600 p-4 border border-red-200 rounded bg-red-50">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Grow Areas</h2>
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <Input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Add new grow area"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !newName.trim()}>
          {loading ? "Adding..." : "Add"}
        </Button>
      </form>
      {loading ? (
        <div className="text-gray-500">Loading grow areas...</div>
      ) : (
        <ul className="space-y-2">
          {areas.map(area => (
            <li key={area.id} className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="flex-1 text-left"
                onClick={() => onSelectArea(area)}
                disabled={loading}
              >
                {editingId === area.id ? (
                  <Input
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onBlur={() => handleUpdate(area.id)}
                    onKeyDown={e => {
                      if (e.key === "Enter") handleUpdate(area.id);
                    }}
                    autoFocus
                    disabled={loading}
                  />
                ) : (
                  area.name
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit(area)}
                disabled={loading || editingId === area.id}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(area.id)}
                disabled={loading}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
