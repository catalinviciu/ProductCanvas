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
            <span className="toolbar-btn-label">Select</span>
          </button>
          <button 
            className={`toolbar-btn ${isPanMode ? 'toolbar-btn-active' : ''}`}
            onClick={onTogglePanMode}
            title="Pan Tool - Click and drag canvas"
          >
            <i className="fas fa-hand-paper"></i>
            <span className="toolbar-btn-label">Pan</span>
          </button>
        </div>
      </div>

      

      {/* Navigation Group */}
      <div className="toolbar-group">
        <div className="toolbar-section">
          <button 
            onClick={onResetView}
            className="toolbar-btn toolbar-btn-primary"
            title="Reset View - Fit all nodes to screen"
          >
            <i className="fas fa-home"></i>
            <span className="toolbar-btn-label">Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}
