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

      {/* Zoom Controls Group */}
      <div className="toolbar-group">
        <div className="toolbar-section">
          <button 
            onClick={onZoomOut}
            className="toolbar-btn toolbar-btn-icon"
            title="Zoom Out"
            disabled={zoom <= 0.1}
          >
            <i className="fas fa-minus"></i>
          </button>
          <div className="zoom-display">
            <span className="zoom-percentage">{Math.round(zoom * 100)}%</span>
            <div className="zoom-slider-container">
              <div 
                className="zoom-slider-fill" 
                style={{ width: `${Math.min(zoom * 100, 200)}%` }}
              />
            </div>
          </div>
          <button 
            onClick={onZoomIn}
            className="toolbar-btn toolbar-btn-icon"
            title="Zoom In"
            disabled={zoom >= 3}
          >
            <i className="fas fa-plus"></i>
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
