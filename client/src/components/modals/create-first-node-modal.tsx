import { type NodeType, type TestCategory } from "@shared/schema";

interface CreateFirstNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNodeCreate: (type: NodeType, testCategory?: TestCategory) => void;
}

export function CreateFirstNodeModal({
  isOpen,
  onClose,
  onNodeCreate,
}: CreateFirstNodeModalProps) {
  if (!isOpen) return null;

  const handleNodeCreate = (type: NodeType, testCategory?: TestCategory) => {
    onNodeCreate(type, testCategory);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Create Node</h2>
          <p className="text-sm text-gray-600">Choose a node type to get started with your impact tree</p>
        </div>
        
        <div className="space-y-3">
          <button 
            onClick={() => handleNodeCreate('objective')}
            className="w-full px-4 py-3 text-left hover:bg-blue-50 rounded-lg flex items-center transition-colors border border-transparent hover:border-blue-200"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <i className="fas fa-flag text-sm" style={{ color: 'var(--primary-blue)' }}></i>
            </div>
            <div>
              <div className="font-medium text-gray-900">Objective</div>
              <div className="text-xs text-gray-500">Strategic objective or goal</div>
            </div>
          </button>
          
          <button 
            onClick={() => handleNodeCreate('outcome')}
            className="w-full px-4 py-3 text-left hover:bg-muted rounded-lg flex items-center transition-colors border border-transparent hover:border-border"
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-3">
              <i className="fas fa-bullseye text-sm" style={{ color: 'var(--primary-indigo)' }}></i>
            </div>
            <div>
              <div className="font-medium text-gray-900">Outcome</div>
              <div className="text-xs text-gray-500">Business or product result</div>
            </div>
          </button>
          
          <button 
            onClick={() => handleNodeCreate('opportunity')}
            className="w-full px-4 py-3 text-left hover:bg-purple-50 rounded-lg flex items-center transition-colors border border-transparent hover:border-purple-200"
          >
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
              <i className="fas fa-lightbulb text-sm" style={{ color: 'var(--secondary-purple)' }}></i>
            </div>
            <div>
              <div className="font-medium text-gray-900">Opportunity</div>
              <div className="text-xs text-gray-500">Market or user opportunity</div>
            </div>
          </button>
          
          <button 
            onClick={() => handleNodeCreate('solution')}
            className="w-full px-4 py-3 text-left hover:bg-emerald-50 rounded-lg flex items-center transition-colors border border-transparent hover:border-emerald-200"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
              <i className="fas fa-cog text-sm" style={{ color: 'var(--accent-emerald)' }}></i>
            </div>
            <div>
              <div className="font-medium text-gray-900">Solution</div>
              <div className="text-xs text-gray-500">Product or feature approach</div>
            </div>
          </button>
          
          <button 
            onClick={() => handleNodeCreate('assumption', 'viability')}
            className="w-full px-4 py-3 text-left hover:bg-orange-50 rounded-lg flex items-center transition-colors border border-transparent hover:border-orange-200"
          >
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mr-3">
              <i className="fas fa-flask text-sm" style={{ color: 'var(--orange-test)' }}></i>
            </div>
            <div>
              <div className="font-medium text-gray-900">Assumption Test</div>
              <div className="text-xs text-gray-500">Hypothesis to be tested</div>
            </div>
          </button>
          
          <button 
            onClick={() => handleNodeCreate('metric')}
            className="w-full px-4 py-3 text-left hover:bg-yellow-50 rounded-lg flex items-center transition-colors border border-transparent hover:border-yellow-200"
          >
            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
              <i className="fas fa-chart-line text-sm" style={{ color: 'var(--kpi-color)' }}></i>
            </div>
            <div>
              <div className="font-medium text-gray-900">Metric</div>
              <div className="text-xs text-gray-500">Quantifiable measure</div>
            </div>
          </button>
          
          <button 
            onClick={() => handleNodeCreate('research')}
            className="w-full px-4 py-3 text-left hover:bg-teal-50 rounded-lg flex items-center transition-colors border border-transparent hover:border-teal-200"
          >
            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center mr-3">
              <i className="fas fa-search text-sm" style={{ color: 'var(--research-color)' }}></i>
            </div>
            <div>
              <div className="font-medium text-gray-900">Research</div>
              <div className="text-xs text-gray-500">Research and discovery activities</div>
            </div>
          </button>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}