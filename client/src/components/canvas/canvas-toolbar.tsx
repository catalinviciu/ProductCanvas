import { memo, useCallback } from 'react';

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
  // Memoized handlers for better performance
  const handleZoomIn = useCallback(() => onZoomIn(), [onZoomIn]);
  const handleZoomOut = useCallback(() => onZoomOut(), [onZoomOut]);
  const handleResetView = useCallback(() => onResetView(), [onResetView]);
  const handleTogglePanMode = useCallback(() => onTogglePanMode(), [onTogglePanMode]);

  const zoomPercentage = Math.round(zoom * 100);

  return (
    <div className="absolute top-4 left-4 z-20 flex items-center space-x-3">
      {/* Tool Selection Group */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-1 flex items-center">
        <button 
          className={`p-3 rounded-lg transition-all duration-200 flex items-center justify-center ${
            !isPanMode 
              ? 'bg-blue-500 text-white shadow-md scale-105' 
              : 'hover:bg-gray-100 text-gray-600 hover:scale-102'
          }`}
          onClick={handleTogglePanMode}
          title="Select Tool (V) - Click and drag nodes"
        >
          <i className="fas fa-mouse-pointer text-sm"></i>
        </button>
        <button 
          className={`p-3 rounded-lg transition-all duration-200 flex items-center justify-center ${
            isPanMode 
              ? 'bg-blue-500 text-white shadow-md scale-105' 
              : 'hover:bg-gray-100 text-gray-600 hover:scale-102'
          }`}
          onClick={handleTogglePanMode}
          title="Pan Tool (H) - Click and drag canvas"
        >
          <i className="fas fa-hand-paper text-sm"></i>
        </button>
      </div>

      {/* Zoom Controls Group */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-1 flex items-center space-x-1">
        <button 
          onClick={handleZoomOut}
          disabled={zoom <= 0.1}
          className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
          title="Zoom Out (-)"
        >
          <i className="fas fa-minus text-gray-600 text-sm"></i>
        </button>
        
        <div className="px-3 py-2 min-w-[80px] text-center">
          <span className="text-sm font-medium text-gray-700">
            {zoomPercentage}%
          </span>
        </div>
        
        <button 
          onClick={handleZoomIn}
          disabled={zoom >= 3}
          className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
          title="Zoom In (+)"
        >
          <i className="fas fa-plus text-gray-600 text-sm"></i>
        </button>
      </div>

      {/* Navigation Controls Group */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-1">
        <button 
          onClick={handleResetView}
          className="p-3 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105 group"
          title="Fit to Screen (F) - Center and fit all nodes"
        >
          <i className="fas fa-expand-arrows-alt text-gray-600 group-hover:text-blue-600 text-sm transition-colors"></i>
        </button>
      </div>

      {/* Keyboard Shortcuts Indicator */}
      <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-xs font-medium opacity-75 hover:opacity-100 transition-opacity">
        <div className="flex items-center space-x-2">
          <span>V</span>
          <span className="text-gray-400">|</span>
          <span>H</span>
          <span className="text-gray-400">|</span>
          <span>F</span>
        </div>
      </div>
    </div>
  );
});
