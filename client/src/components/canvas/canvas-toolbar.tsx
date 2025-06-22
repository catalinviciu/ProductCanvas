interface CanvasToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  isPanMode: boolean;
  onTogglePanMode: () => void;
}

export function CanvasToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
  isPanMode,
  onTogglePanMode,
}: CanvasToolbarProps) {
  return (
    <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
        <button 
          className={`p-2 rounded-md transition-colors ${!isPanMode ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-50 text-gray-600'}`}
          onClick={() => onTogglePanMode()}
          title="Select Tool"
        >
          <i className="fas fa-mouse-pointer"></i>
        </button>
        <button 
          className={`p-2 rounded-md transition-colors ${isPanMode ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-50 text-gray-600'}`}
          onClick={onTogglePanMode}
          title="Pan Tool"
        >
          <i className="fas fa-hand-paper"></i>
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-2">
        <span className="text-xs text-gray-500">
          Zoom: {Math.round(zoom * 100)}%
        </span>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
        <button 
          onClick={onResetView}
          className="p-2 hover:bg-gray-50 rounded-md transition-colors"
          title="Reset View"
        >
          <i className="fas fa-home text-gray-600"></i>
        </button>
      </div>
    </div>
  );
}
