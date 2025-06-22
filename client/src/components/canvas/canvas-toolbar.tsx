import { memo, useCallback } from "react";

interface CanvasToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  isPanMode: boolean;
  onTogglePanMode: () => void;
}

export const CanvasToolbar = memo(function CanvasToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
  isPanMode,
  onTogglePanMode,
}: CanvasToolbarProps) {
  // Memoized handlers to prevent unnecessary re-renders
  const handleZoomIn = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onZoomIn();
  }, [onZoomIn]);

  const handleZoomOut = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onZoomOut();
  }, [onZoomOut]);

  const handleResetView = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onResetView();
  }, [onResetView]);

  const handleTogglePanMode = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePanMode();
  }, [onTogglePanMode]);

  const zoomPercentage = Math.round(zoom * 100);

  return (
    <div className="absolute top-4 left-4 z-20 flex items-center space-x-3">
      {/* Tool Selection Group */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-1.5 flex items-center space-x-1">
        <button 
          className={`p-2.5 rounded-lg transition-all duration-200 group relative ${
            !isPanMode 
              ? 'bg-blue-500 text-white shadow-md scale-105' 
              : 'hover:bg-gray-100 text-gray-600 hover:scale-105'
          }`}
          onClick={handleTogglePanMode}
          title="Select & Edit Tool (S)"
        >
          <i className="fas fa-mouse-pointer text-sm"></i>
          {!isPanMode && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          )}
        </button>
        <button 
          className={`p-2.5 rounded-lg transition-all duration-200 group relative ${
            isPanMode 
              ? 'bg-emerald-500 text-white shadow-md scale-105' 
              : 'hover:bg-gray-100 text-gray-600 hover:scale-105'
          }`}
          onClick={handleTogglePanMode}
          title="Pan Tool (P)"
        >
          <i className="fas fa-hand-paper text-sm"></i>
          {isPanMode && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          )}
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-1.5 flex items-center space-x-1">
        <button 
          onClick={handleZoomOut}
          disabled={zoom <= 0.1}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 text-gray-600"
          title="Zoom Out (-)"
        >
          <i className="fas fa-minus text-sm"></i>
        </button>
        
        <div className="px-3 py-1.5 bg-gray-50 rounded-lg min-w-[80px] text-center">
          <span className="text-sm font-medium text-gray-700">
            {zoomPercentage}%
          </span>
        </div>
        
        <button 
          onClick={handleZoomIn}
          disabled={zoom >= 3}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 text-gray-600"
          title="Zoom In (+)"
        >
          <i className="fas fa-plus text-sm"></i>
        </button>
      </div>

      {/* Navigation Controls */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-1.5">
        <button 
          onClick={handleResetView}
          className="p-2.5 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105 group text-gray-600"
          title="Reset to Home View (H)"
        >
          <i className="fas fa-home text-sm group-hover:text-blue-500 transition-colors"></i>
        </button>
      </div>

      {/* Status Indicator */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 px-3 py-2">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isPanMode ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400 animate-pulse'}`}></div>
          <span className="text-xs font-medium text-gray-600">
            {isPanMode ? 'Pan Mode' : 'Select Mode'}
          </span>
        </div>
      </div>
    </div>
  );
});
