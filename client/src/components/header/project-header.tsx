interface ProjectHeaderProps {
  projectName: string;
  lastSaved: Date | string;
  onAutoLayout: () => void;
  onFitToScreen: () => void;
  orientation: 'horizontal' | 'vertical';
  onOrientationToggle: () => void;
}

export function ProjectHeader({ 
  projectName, 
  lastSaved, 
  onAutoLayout, 
  onFitToScreen,
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
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <i className="fas fa-project-diagram text-white text-sm"></i>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{projectName}</h1>
            <p className="text-xs text-gray-500">Last saved {formatLastSaved(lastSaved)}</p>
          </div>
        </div>
        <div className="h-6 w-px bg-gray-200"></div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={onOrientationToggle}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            title={`Switch to ${orientation === 'horizontal' ? 'vertical' : 'horizontal'} layout`}
          >
            <i className={`fas ${orientation === 'horizontal' ? 'fa-arrows-alt-h' : 'fa-arrows-alt-v'} mr-1`}></i>
            {orientation === 'horizontal' ? 'Horizontal' : 'Vertical'}
          </button>
          <button 
            onClick={onAutoLayout}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            <i className="fas fa-magic mr-1"></i>
            Auto Layout
          </button>
          <button 
            onClick={onFitToScreen}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            <i className="fas fa-expand-arrows-alt mr-1"></i>
            Fit to Screen
          </button>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-xs font-medium text-white">JD</span>
            </div>
            <div className="w-8 h-8 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-xs font-medium text-white">AS</span>
            </div>
          </div>
          <button className="w-8 h-8 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center hover:border-indigo-600 transition-colors">
            <i className="fas fa-plus text-gray-400 text-xs"></i>
          </button>
        </div>
        <div className="h-6 w-px bg-gray-200"></div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
          <i className="fas fa-share mr-2"></i>
          Share
        </button>
      </div>
    </header>
  );
}
