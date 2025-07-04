import { useState, useCallback, useMemo } from "react";
import { type NodeType, type TestCategory } from "@shared/schema";

interface FloatingSideMenuProps {
  onNodeCreate: (type: NodeType, testCategory?: TestCategory) => void;
  onFitToScreen: () => void;
  orientation: 'horizontal' | 'vertical';
  onOrientationToggle: () => void;
}

export function FloatingSideMenu({
  onNodeCreate,
  onFitToScreen,
  orientation,
  onOrientationToggle
}: FloatingSideMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // Node creation options
  const nodeOptions = useMemo(() => [
    {
      type: 'objective' as NodeType,
      icon: 'fas fa-flag',
      title: 'Objective',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100'
    },
    {
      type: 'outcome' as NodeType,
      icon: 'fas fa-bullseye',
      title: 'Outcome',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      hoverColor: 'hover:bg-indigo-100'
    },
    {
      type: 'opportunity' as NodeType,
      icon: 'fas fa-lightbulb',
      title: 'Opportunity',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100'
    },
    {
      type: 'solution' as NodeType,
      icon: 'fas fa-cog',
      title: 'Solution',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      hoverColor: 'hover:bg-emerald-100'
    },
    {
      type: 'assumption' as NodeType,
      testCategory: 'viability' as TestCategory,
      icon: 'fas fa-flask',
      title: 'Test',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      hoverColor: 'hover:bg-orange-100'
    },
    {
      type: 'metric' as NodeType,
      icon: 'fas fa-chart-line',
      title: 'Metric',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      hoverColor: 'hover:bg-yellow-100'
    },
    {
      type: 'research' as NodeType,
      icon: 'fas fa-search',
      title: 'Research',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      hoverColor: 'hover:bg-teal-100'
    }
  ], []);

  const handleNodeCreate = useCallback((type: NodeType, testCategory?: TestCategory) => {
    onNodeCreate(type, testCategory);
    setIsExpanded(false); // Close menu after creating a node
  }, [onNodeCreate]);

  return (
    <div className="fixed top-4 left-4 z-50 flex flex-col">
      {/* Main menu button */}
      <button
        onClick={toggleExpanded}
        className="w-12 h-12 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        title="Menu"
      >
        <i className={`fas ${isExpanded ? 'fa-times' : 'fa-bars'} text-gray-700`}></i>
      </button>

      {/* Expanded menu */}
      {isExpanded && (
        <div className="mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 min-w-48">
          {/* Control buttons */}
          <div className="flex gap-2 mb-3 pb-3 border-b border-gray-100">
            <button
              onClick={onOrientationToggle}
              className="flex-1 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-md text-sm flex items-center justify-center gap-2 transition-colors"
              title={`Switch to ${orientation === 'horizontal' ? 'vertical' : 'horizontal'} layout`}
            >
              <i className={`fas ${orientation === 'horizontal' ? 'fa-arrows-alt-v' : 'fa-arrows-alt-h'} text-gray-600`}></i>
              <span className="text-gray-700">{orientation === 'horizontal' ? 'Vertical' : 'Horizontal'}</span>
            </button>
            
            <button
              onClick={onFitToScreen}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-md text-sm flex items-center justify-center gap-2 transition-colors"
              title="Fit to screen"
            >
              <i className="fas fa-expand-arrows-alt text-blue-600"></i>
              <span className="text-blue-700">Fit</span>
            </button>
          </div>

          {/* Node creation options */}
          <div className="space-y-1">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Add Node</h3>
            {nodeOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => handleNodeCreate(option.type, option.testCategory)}
                className={`w-full px-3 py-2 rounded-md text-sm flex items-center gap-3 transition-colors ${option.bgColor} ${option.hoverColor}`}
              >
                <i className={`${option.icon} ${option.color}`}></i>
                <span className="text-gray-700">{option.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}