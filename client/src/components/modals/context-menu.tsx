import { useEffect, useRef, useState, memo, useCallback, useMemo } from "react";
import { type TreeNode, type NodeType, type TestCategory } from "@shared/schema";

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  node: TreeNode | null;
  onClose: () => void;
  onEdit: (node: TreeNode) => void;
  onDelete: (nodeId: string) => void;
  onAddChild: (type: NodeType, testCategory?: TestCategory) => void;
  onToggleCollapse?: (nodeId: string) => void;
  menuType?: 'full' | 'addChild' | 'nodeActions';
}

const ContextMenuComponent = memo(function ContextMenu({
  isOpen,
  position,
  node,
  onClose,
  onEdit,
  onDelete,
  onAddChild,
  onToggleCollapse,
  menuType = 'full',
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showTestCategories, setShowTestCategories] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      onClose();
    }
  }, [onClose]);

  const handleEdit = useCallback(() => {
    if (node) {
      onEdit(node);
      onClose();
    }
  }, [node, onEdit, onClose]);

  const handleDelete = useCallback(() => {
    if (node) {
      onDelete(node.id);
      onClose();
    }
  }, [node, onDelete, onClose]);

  const handleAddChild = useCallback((type: NodeType, testCategory?: TestCategory) => {
    onAddChild(type, testCategory);
    onClose();
  }, [onAddChild, onClose]);

  const handleToggleCollapse = useCallback(() => {
    if (node && onToggleCollapse) {
      onToggleCollapse(node.id);
      onClose();
    }
  }, [node, onToggleCollapse, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  useEffect(() => {
    if (isOpen) {
      setAdjustedPosition(position);
      setShowTestCategories(false);
    }
  }, [isOpen, position]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (!menuRef.current) return;

      const menuElement = menuRef.current;
      const menuRect = menuElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newX = position.x;
      let newY = position.y;

      if (position.x + menuRect.width > viewportWidth) {
        newX = viewportWidth - menuRect.width - 10;
      }

      if (newX < 10) {
        newX = 10;
      }

      if (position.y + menuRect.height > viewportHeight) {
        newY = viewportHeight - menuRect.height - 10;
      }

      if (newY < 10) {
        newY = 10;
      }

      setAdjustedPosition({ x: newX, y: newY });
    }, 0);

    return () => clearTimeout(timer);
  }, [isOpen, position, showTestCategories]);

  // Memoize menu items
  const menuItems = useMemo(() => [
    {
      type: 'objective' as NodeType,
      icon: 'fas fa-flag',
      color: 'var(--primary-blue)',
      hoverClass: 'hover:bg-blue-50',
      title: 'Objective',
      description: 'Strategic objective or goal'
    },
    {
      type: 'outcome' as NodeType,
      icon: 'fas fa-bullseye',
      color: 'var(--primary-indigo)',
      hoverClass: 'hover:bg-muted',
      title: 'Outcome',
      description: 'Business goal or result'
    },
    {
      type: 'opportunity' as NodeType,
      icon: 'fas fa-lightbulb',
      color: 'var(--secondary-purple)',
      hoverClass: 'hover:bg-purple-50',
      title: 'Opportunity',
      description: 'Market or user opportunity'
    },
    {
      type: 'solution' as NodeType,
      icon: 'fas fa-cog',
      color: 'var(--accent-emerald)',
      hoverClass: 'hover:bg-emerald-50',
      title: 'Solution',
      description: 'Product or feature approach'
    },
    {
      type: 'research' as NodeType,
      icon: 'fas fa-search',
      color: 'var(--research-color)',
      hoverClass: 'hover:bg-teal-50',
      title: 'Research',
      description: 'Research and discovery activities'
    }
  ], []);

  const testCategories = useMemo(() => [
    { type: 'viability', label: 'Viability Test', color: 'var(--viability-color)' },
    { type: 'value', label: 'Value Test', color: 'var(--value-color)' },
    { type: 'feasibility', label: 'Feasibility Test', color: 'var(--feasibility-color)' },
    { type: 'usability', label: 'Usability Test', color: 'var(--usability-color)' }
  ], []);

  // NOW we can do early return after all hooks are declared
  if (!isOpen || !node) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[280px]"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div className="px-4 py-2">
        <div className="text-xs font-medium text-gray-500 mb-2">
          {node.title || 'Untitled Node'}
        </div>
        
        {/* Node Actions Menu (3 dots button) */}
        {menuType === 'nodeActions' && (
          <>
            <button
              onClick={handleEdit}
              className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded flex items-center transition-colors"
            >
              <i className="fas fa-edit mr-3 text-gray-600"></i>
              Edit Node
            </button>

            {node.children && node.children.length > 0 && onToggleCollapse && (
              <button
                onClick={handleToggleCollapse}
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded flex items-center transition-colors"
              >
                <i className={`fas ${node.isCollapsed ? 'fa-expand' : 'fa-compress'} mr-3 text-gray-600`}></i>
                {node.isCollapsed ? 'Expand' : 'Collapse'} Children
              </button>
            )}

            <div className="border-t border-gray-100 my-2"></div>

            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 text-sm text-left hover:bg-red-50 text-red-600 transition-colors flex items-center"
            >
              <i className="fas fa-trash mr-2"></i>
              Delete Node
            </button>
          </>
        )}

        {/* Add Child Menu (+1 button) */}
        {menuType === 'addChild' && (
          <>
            <div className="text-xs font-medium text-gray-500 mb-2">Add Child Node</div>
            
            {menuItems.map((item) => (
              <button 
                key={item.type}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddChild(item.type);
                }}
                className={`w-full px-3 py-2 text-sm text-left ${item.hoverClass} rounded flex items-center transition-colors`}
              >
                <i className={`${item.icon} mr-3 text-sm`} style={{ color: item.color }}></i>
                <div>
                  <div className="font-medium text-gray-900">{item.title}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </button>
            ))}

            <div className="relative">
              <button
                onClick={() => setShowTestCategories(!showTestCategories)}
                className="w-full px-3 py-2 text-sm text-left hover:bg-orange-50 rounded flex items-center justify-between transition-colors"
              >
                <div className="flex items-center">
                  <i className="fas fa-flask mr-3 text-sm" style={{ color: 'var(--orange-test)' }}></i>
                  <div>
                    <div className="font-medium text-gray-900">Assumption Test</div>
                    <div className="text-xs text-gray-500">Hypothesis to validate</div>
                  </div>
                </div>
                <i className={`fas fa-chevron-${showTestCategories ? 'up' : 'down'} text-xs text-gray-400`}></i>
              </button>

              {showTestCategories && (
                <div className="ml-6 mt-1 space-y-1">
                  {testCategories.map((category) => (
                    <button
                      key={category.type}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddChild('assumption', category.type as TestCategory);
                      }}
                      className="w-full px-3 py-1 text-xs text-left hover:bg-orange-50 rounded flex items-center transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: category.color }}></div>
                      {category.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddChild('metric');
              }}
              className="w-full px-3 py-2 text-sm text-left hover:bg-yellow-50 rounded flex items-center transition-colors"
            >
              <i className="fas fa-chart-line mr-3 text-sm" style={{ color: 'var(--kpi-color)' }}></i>
              <div>
                <div className="font-medium text-gray-900">Metric</div>
                <div className="text-xs text-gray-500">Key performance indicator</div>
              </div>
            </button>
          </>
        )}

        {/* Full Menu (default) */}
        {menuType === 'full' && (
          <>
            <button
              onClick={handleEdit}
              className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded flex items-center transition-colors"
            >
              <i className="fas fa-edit mr-3 text-gray-600"></i>
              Edit Node
            </button>

            {node.children && node.children.length > 0 && onToggleCollapse && (
              <button
                onClick={handleToggleCollapse}
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded flex items-center transition-colors"
              >
                <i className={`fas ${node.isCollapsed ? 'fa-expand' : 'fa-compress'} mr-3 text-gray-600`}></i>
                {node.isCollapsed ? 'Expand' : 'Collapse'} Children
              </button>
            )}

            <div className="border-t border-gray-100 my-2"></div>

            <div className="text-xs font-medium text-gray-500 mb-2">Add Child Node</div>
            
            {menuItems.map((item) => (
              <button 
                key={item.type}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddChild(item.type);
                }}
                className={`w-full px-3 py-2 text-sm text-left ${item.hoverClass} rounded flex items-center transition-colors`}
              >
                <i className={`${item.icon} mr-3 text-sm`} style={{ color: item.color }}></i>
                <div>
                  <div className="font-medium text-gray-900">{item.title}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </button>
            ))}

            <div className="relative">
              <button
                onClick={() => setShowTestCategories(!showTestCategories)}
                className="w-full px-3 py-2 text-sm text-left hover:bg-orange-50 rounded flex items-center justify-between transition-colors"
              >
                <div className="flex items-center">
                  <i className="fas fa-flask mr-3 text-sm" style={{ color: 'var(--orange-test)' }}></i>
                  <div>
                    <div className="font-medium text-gray-900">Assumption Test</div>
                    <div className="text-xs text-gray-500">Hypothesis to validate</div>
                  </div>
                </div>
                <i className={`fas fa-chevron-${showTestCategories ? 'up' : 'down'} text-xs text-gray-400`}></i>
              </button>

              {showTestCategories && (
                <div className="ml-6 mt-1 space-y-1">
                  {testCategories.map((category) => (
                    <button
                      key={category.type}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddChild('assumption', category.type as TestCategory);
                      }}
                      className="w-full px-3 py-1 text-xs text-left hover:bg-orange-50 rounded flex items-center transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: category.color }}></div>
                      {category.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddChild('metric');
              }}
              className="w-full px-3 py-2 text-sm text-left hover:bg-yellow-50 rounded flex items-center transition-colors"
            >
              <i className="fas fa-chart-line mr-3 text-sm" style={{ color: 'var(--kpi-color)' }}></i>
              <div>
                <div className="font-medium text-gray-900">Metric</div>
                <div className="text-xs text-gray-500">Key performance indicator</div>
              </div>
            </button>

            <div className="border-t border-gray-100 my-2"></div>

            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 text-sm text-left hover:bg-red-50 text-red-600 transition-colors flex items-center"
            >
              <i className="fas fa-trash mr-2"></i>
              Delete Node
            </button>
          </>
        )}
      </div>
    </div>
  );
});

export const ContextMenu = ContextMenuComponent;