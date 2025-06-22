import { type NodeType, type TestCategory } from "@shared/schema";

interface NodePaletteProps {
  onNodeCreate: (type: NodeType, testCategory?: TestCategory) => void;
}

const nodeTypes = [
  {
    type: 'outcome' as NodeType,
    color: 'var(--primary-indigo)',
    borderColor: 'border-indigo-500',
    hoverColor: 'hover:border-indigo-600',
    title: 'Outcome',
    description: 'Define desired business outcomes',
  },
  {
    type: 'opportunity' as NodeType,
    color: 'var(--secondary-purple)',
    borderColor: 'border-purple-500',
    hoverColor: 'hover:border-purple-600',
    title: 'Opportunity',
    description: 'Identify market opportunities',
  },
  {
    type: 'solution' as NodeType,
    color: 'var(--accent-emerald)',
    borderColor: 'border-emerald-500',
    hoverColor: 'hover:border-emerald-600',
    title: 'Solution',
    description: 'Design solution approaches',
  },
  {
    type: 'assumption' as NodeType,
    color: 'var(--orange-test)',
    borderColor: 'border-orange-500',
    hoverColor: 'hover:border-orange-600',
    title: 'Assumption Test',
    description: 'Test key assumptions',
  },
];

const testCategories: { type: TestCategory; color: string; label: string }[] = [
  { type: 'viability', color: 'bg-blue-500', label: 'Viability' },
  { type: 'value', color: 'bg-green-500', label: 'Value' },
  { type: 'feasibility', color: 'bg-purple-500', label: 'Feasibility' },
  { type: 'usability', color: 'bg-pink-500', label: 'Usability' },
];

export function NodePalette({ onNodeCreate }: NodePaletteProps) {
  const handleNodeCreate = (type: NodeType) => {
    onNodeCreate(type);
  };

  return (
    <div className="space-y-6">
      {/* Node Types Section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Node Types</h3>
        <div className="space-y-3">
          {nodeTypes.map((nodeType) => (
            <div
              key={nodeType.type}
              className={`p-4 border border-gray-200 rounded-lg cursor-pointer transition-all group ${nodeType.hoverColor}`}
              onClick={() => handleNodeCreate(nodeType.type)}
            >
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: nodeType.color }}
                />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{nodeType.title}</h4>
                  <p className="text-xs text-gray-500">{nodeType.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Test Categories */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Test Categories</h3>
        <div className="grid grid-cols-2 gap-2">
          {testCategories.map((category) => (
            <div
              key={category.type}
              className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => onNodeCreate('assumption', category.type)}
            >
              <div className={`w-6 h-6 ${category.color} rounded-full mx-auto mb-2`}></div>
              <span className="text-xs font-medium text-gray-700">{category.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
