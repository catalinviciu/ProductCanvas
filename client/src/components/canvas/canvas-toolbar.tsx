interface CanvasToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  isPanMode: boolean;
  onTogglePanMode: () => void;
  onFitToScreen: () => void;
  orientation: 'horizontal' | 'vertical';
  onOrientationToggle: () => void;
}

import { useEffect } from "react";

export function CanvasToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  isPanMode,
  onTogglePanMode,
  onFitToScreen,
  orientation,
  onOrientationToggle,
}: CanvasToolbarProps) {
  // Handle space key for pan mode toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle space key if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }
      
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        if (!isPanMode) {
          onTogglePanMode();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Don't handle space key if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }
      
      if (e.code === 'Space') {
        e.preventDefault();
        if (isPanMode) {
          onTogglePanMode();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPanMode, onTogglePanMode]);
  return (
    <div className="modern-toolbar">
      {/* Tool Selection Group */}
      <div className="toolbar-group">
        <div className="toolbar-section">
          <button 
            className={`toolbar-btn ${!isPanMode ? 'toolbar-btn-active' : ''}`}
            onClick={() => onTogglePanMode()}
            title="Select Tool - Click and drag nodes"
          >
            <i className="fas fa-mouse-pointer"></i>
          </button>
          <button 
            className={`toolbar-btn ${isPanMode ? 'toolbar-btn-active' : ''}`}
            onClick={onTogglePanMode}
            title="Pan Tool - Click and drag canvas (Space)"
          >
            <i className="fas fa-hand-paper"></i>
          </button>
        </div>
      </div>

      {/* View Controls Group */}
      <div className="toolbar-group">
        <div className="toolbar-section">
          <button 
            onClick={onOrientationToggle}
            className="toolbar-btn"
            title={`Switch to ${orientation === 'horizontal' ? 'vertical' : 'horizontal'} layout`}
          >
            <i className={`fas ${orientation === 'horizontal' ? 'fa-arrows-alt-v' : 'fa-arrows-alt-h'}`}></i>
          </button>
          <button 
            onClick={onFitToScreen}
            className="toolbar-btn toolbar-btn-primary"
            title="Fit to screen"
          >
            <i className="fas fa-expand-arrows-alt"></i>
          </button>
        </div>
      </div>

    </div>
  );
}
