interface ProjectHeaderProps {
  projectName: string;
  lastSaved: Date | string;
  onFitToScreen: () => void;
  onAutoLayout: () => void;
  orientation: 'horizontal' | 'vertical';
  onOrientationToggle: () => void;
}

export function ProjectHeader({ 
  projectName, 
  lastSaved, 
  onFitToScreen,
  onAutoLayout,
  orientation,
  onOrientationToggle
}: ProjectHeaderProps) {
  const formatLastSaved = (date: Date | string) => {
    if (!date) return 'Never saved';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Invalid date';
    
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return dateObj.toLocaleDateString();
  };

  return (
    <header className="modern-project-header">
      <div className="project-header-content">
        <div className="project-info">
          <h1 className="project-title">{projectName}</h1>
          <div className="project-meta">
            <span className="last-saved">
              <i className="fas fa-clock"></i>
              Last saved {formatLastSaved(lastSaved)}
            </span>
          </div>
        </div>
        
        <div className="project-controls">
          <div className="control-group">
            <button
              onClick={onOrientationToggle}
              className="control-btn control-btn-secondary"
              title={`Switch to ${orientation === 'horizontal' ? 'vertical' : 'horizontal'} layout`}
            >
              <i className={`fas ${orientation === 'horizontal' ? 'fa-arrows-alt-v' : 'fa-arrows-alt-h'}`}></i>
              <span className="control-label">{orientation === 'horizontal' ? 'Vertical' : 'Horizontal'}</span>
            </button>
            
            <button
              onClick={onAutoLayout}
              className="control-btn control-btn-primary"
              title="Auto-arrange nodes"
            >
              <i className="fas fa-magic"></i>
              <span className="control-label">Auto Layout</span>
            </button>
            
            <button
              onClick={onFitToScreen}
              className="control-btn control-btn-secondary"
              title="Fit all nodes to screen"
            >
              <i className="fas fa-expand-arrows-alt"></i>
              <span className="control-label">Fit to Screen</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
