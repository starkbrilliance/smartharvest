import { useState } from "react";
import GrowAreaManager from "@/components/grow-area-manager";
import SubareaManager from "@/components/subarea-manager";
import { useLocation } from "wouter";

export default function GrowAreasPage() {
  const [selectedArea, setSelectedArea] = useState<any>(null);
  const [, navigate] = useLocation();

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manage Grow Areas</h1>
        <button
          className="text-primary underline hover:text-green-700 font-medium"
          onClick={() => navigate("/")}
        >
          ← Back to Dashboard
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <GrowAreaManager onSelectArea={setSelectedArea} />
        </div>
        <div>
          <SubareaManager growArea={selectedArea} />
        </div>
      </div>
    </div>
  );
}
