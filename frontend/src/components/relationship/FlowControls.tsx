import React from 'react';
import { useReactFlow } from 'reactflow';
import { ZoomIn, ZoomOut, Maximize, RotateCcw } from 'lucide-react';

export default function FlowControls() {
  const { zoomIn, zoomOut, fitView, setCenter } = useReactFlow();

  const handleReset = () => {
    setCenter(0, 0, { zoom: 1, duration: 800 });
  };

  return (
    <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-10">
      <div className="bg-white rounded-lg shadow-md border border-neutral-200 overflow-hidden flex flex-col">
        <button
          onClick={() => zoomIn({ duration: 300 })}
          className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 border-b border-neutral-100 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={() => zoomOut({ duration: 300 })}
          className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-neutral-200 overflow-hidden flex flex-col">
        <button
          onClick={() => fitView({ duration: 600, padding: 0.2 })}
          className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 border-b border-neutral-100 transition-colors"
          title="Fit View"
        >
          <Maximize className="w-5 h-5" />
        </button>
        <button
          onClick={handleReset}
          className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
          title="Reset View"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
