import { type CanvasState } from "@shared/schema";

interface CanvasControlsProps {
  canvasState: CanvasState;
  onCanvasUpdate: (updates: Partial<CanvasState>) => void;
}

export function CanvasControls({ canvasState, onCanvasUpdate }: CanvasControlsProps) {
  const handleZoomIn = () => {
    onCanvasUpdate({ zoom: Math.min(3, canvasState.zoom + 0.1) });
  };

  const handleZoomOut = () => {
    onCanvasUpdate({ zoom: Math.max(0.1, canvasState.zoom - 0.1) });
  };

  const handleResetView = () => {
    onCanvasUpdate({ zoom: 1, pan: { x: 0, y: 0 } });
  };

  return (
    <div className="space-y-6">
      {/* Canvas Controls */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Canvas</h3>
        <div className="space-y-2">
          <button 
            onClick={handleZoomIn}
            className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-md transition-colors flex items-center"
          >
            <i className="fas fa-search-plus mr-2 text-gray-400"></i>
            Zoom In
          </button>
          <button 
            onClick={handleZoomOut}
            className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-md transition-colors flex items-center"
          >
            <i className="fas fa-search-minus mr-2 text-gray-400"></i>
            Zoom Out
          </button>
          <button 
            onClick={handleResetView}
            className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-md transition-colors flex items-center"
          >
            <i className="fas fa-home mr-2 text-gray-400"></i>
            Reset View
          </button>
          <div className="h-px bg-gray-200 my-2"></div>
          <button className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-md transition-colors flex items-center">
            <i className="fas fa-download mr-2 text-gray-400"></i>
            Export as Image
          </button>
        </div>
      </div>

      {/* Project History */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">History</h3>
        <div className="space-y-2">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-900">Added Solution Node</span>
              <span className="text-xs text-gray-500">2m ago</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Mobile app redesign</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-900">Created Opportunity</span>
              <span className="text-xs text-gray-500">5m ago</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">User retention improvement</p>
          </div>
        </div>
      </div>
    </div>
  );
}
