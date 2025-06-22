interface CanvasToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

export function CanvasToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
}: CanvasToolbarProps) {
  return (
    <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
        <button className="p-2 hover:bg-gray-50 rounded-md transition-colors">
          <i className="fas fa-mouse-pointer text-gray-600"></i>
        </button>
        <button className="p-2 hover:bg-gray-50 rounded-md transition-colors">
          <i className="fas fa-hand-paper text-gray-600"></i>
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
