import { type NodeType, type TestCategory } from "@shared/schema";

interface NodePaletteProps {
  onNodeCreate: (type: NodeType, testCategory?: TestCategory) => void;
}

const nodeTypes = [
  {
    type: 'objective' as NodeType,
    color: 'var(--primary-blue)',
    borderColor: 'border-blue-500',
    hoverColor: 'hover:border-blue-600',
    title: 'Objective',
    description: 'Define strategic objectives',
    icon: 'fas fa-flag',
  },
  {
    type: 'outcome' as NodeType,
    color: 'var(--primary-indigo)',
    borderColor: 'border-indigo-500',
    hoverColor: 'hover:border-indigo-600',
    title: 'Outcome',
    description: 'Define desired business outcomes',
    icon: 'fas fa-bullseye',
  },
  {
    type: 'opportunity' as NodeType,
    color: 'var(--secondary-purple)',
    borderColor: 'border-purple-500',
    hoverColor: 'hover:border-purple-600',
    title: 'Opportunity',
    description: 'Identify market opportunities',
    icon: 'fas fa-lightbulb',
  },
  {
    type: 'solution' as NodeType,
    color: 'var(--accent-emerald)',
    borderColor: 'border-emerald-500',
    hoverColor: 'hover:border-emerald-600',
    title: 'Solution',
    description: 'Design solution approaches',
    icon: 'fas fa-cog',
  },
  {
    type: 'assumption' as NodeType,
    color: 'var(--orange-test)',
    borderColor: 'border-orange-500',
    hoverColor: 'hover:border-orange-600',
    title: 'Assumption Test',
    description: 'Test key assumptions',
    icon: 'fas fa-flask',
  },
  {
    type: 'metric' as NodeType,
    color: 'var(--kpi-color)',
    borderColor: 'border-yellow-500',
    hoverColor: 'hover:border-yellow-600',
    title: 'Metric',
    description: 'Track key performance indicators',
    icon: 'fas fa-chart-line',
  },
];

const testCategories: { type: TestCategory; color: string; label: string; icon: string }[] = [
  { type: 'viability', color: 'var(--viability-color)', label: 'Viability', icon: 'fas fa-seedling' },
  { type: 'value', color: 'var(--value-color)', label: 'Value', icon: 'fas fa-gem' },
  { type: 'feasibility', color: 'var(--feasibility-color)', label: 'Feasibility', icon: 'fas fa-wrench' },
  { type: 'usability', color: 'var(--usability-color)', label: 'Usability', icon: 'fas fa-user-check' },
];

export function NodePalette({ onNodeCreate }: NodePaletteProps) {
  const handleNodeCreate = (type: NodeType) => {
    onNodeCreate(type);
  };

  return (
    <div className="space-y-6">
      {/* Node Types Section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Card Types</h3>
        <div className="space-y-3">
          {nodeTypes.map((nodeType) => (
            <div
              key={nodeType.type}
              className={`p-4 border border-gray-200 rounded-lg cursor-pointer transition-all group ${nodeType.hoverColor}`}
              onClick={() => handleNodeCreate(nodeType.type)}
            >
              <div className="flex items-center space-x-3">
                <i 
                  className={`${nodeType.icon} text-lg`}
                  style={{ color: nodeType.color }}
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
              <i 
                className={`${category.icon} text-lg mx-auto mb-2 block`}
                style={{ color: category.color }}
              />
              <span className="text-xs font-medium text-gray-700">{category.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
