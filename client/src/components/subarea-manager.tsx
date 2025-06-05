import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";

interface Subarea {
  id: string;
  name: string;
  growAreaId: string;
  createdAt: string;
}

interface SubareaManagerProps {
  growArea: { id: string; name: string } | null;
}

export default function SubareaManager({ growArea }: SubareaManagerProps) {
  const [subareas, setSubareas] = useState<Subarea[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    if (growArea) fetchSubareas();
    // eslint-disable-next-line
  }, [growArea]);

  const fetchSubareas = async () => {
    if (!growArea) return;
    setLoading(true);
    const res = await apiRequest("GET", `/api/grow-areas/${growArea.id}/subareas`);
    const data = await res.json();
    setSubareas(data);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !growArea) return;
    await apiRequest("POST", `/api/grow-areas/${growArea.id}/subareas`, { name: newName });
    setNewName("");
    fetchSubareas();
  };

  const handleEdit = (sub: Subarea) => {
    setEditingId(sub.id);
    setEditingName(sub.name);
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return;
    await apiRequest("PATCH", `/api/subareas/${id}`, { name: editingName });
    setEditingId(null);
    setEditingName("");
    fetchSubareas();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this subarea?")) return;
    await apiRequest("DELETE", `/api/subareas/${id}`);
    if (editingId === id) setEditingId(null);
    fetchSubareas();
  };

  if (!growArea) return <div>Select a grow area to manage subareas.</div>;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Subareas for {growArea.name}</h2>
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <Input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Add new subarea"
        />
        <Button type="submit" disabled={loading || !newName.trim()}>Add</Button>
      </form>
      <ul className="space-y-2">
        {subareas.map(sub => (
          <li key={sub.id} className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="flex-1 text-left"
              disabled
            >
              {editingId === sub.id ? (
                <Input
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  onBlur={() => handleUpdate(sub.id)}
                  onKeyDown={e => {
                    if (e.key === "Enter") handleUpdate(sub.id);
                  }}
                  autoFocus
                />
              ) : (
                sub.name
              )}
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleEdit(sub)} disabled={editingId === sub.id}>Edit</Button>
            <Button size="sm" variant="destructive" onClick={() => handleDelete(sub.id)}>Delete</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
