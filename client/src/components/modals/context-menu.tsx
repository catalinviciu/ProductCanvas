import { useEffect, useRef, useState, memo, useCallback } from "react";
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
}

export const ContextMenu = memo(function ContextMenu({
  isOpen,
  position,
  node,
  onClose,
  onEdit,
  onDelete,
  onAddChild,
  onToggleCollapse,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showTestCategories, setShowTestCategories] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Reset position when menu opens
  useEffect(() => {
    if (isOpen) {
      setAdjustedPosition(position);
    }
  }, [isOpen, position]);

  // Calculate adjusted position to keep menu within viewport
  useEffect(() => {
    if (!isOpen) return;

    // Use setTimeout to ensure DOM is updated before measuring
    const timer = setTimeout(() => {
      if (!menuRef.current) return;

      const menuElement = menuRef.current;
      const menuRect = menuElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newX = position.x;
      let newY = position.y;

      // Adjust horizontal position if menu would overflow right edge
      if (position.x + menuRect.width > viewportWidth) {
        newX = viewportWidth - menuRect.width - 10; // 10px margin from edge
      }

      // Adjust horizontal position if menu would overflow left edge
      if (newX < 10) {
        newX = 10; // 10px margin from edge
      }

      // Adjust vertical position if menu would overflow bottom edge
      if (position.y + menuRect.height > viewportHeight) {
        newY = viewportHeight - menuRect.height - 10; // 10px margin from edge
      }

      // Adjust vertical position if menu would overflow top edge
      if (newY < 10) {
        newY = 10; // 10px margin from edge
      }

      setAdjustedPosition({ x: newX, y: newY });
    }, 0);

    return () => clearTimeout(timer);
  }, [isOpen, position, showTestCategories]);

  if (!isOpen || !node) return null;

  // Memoized handlers for better performance
  const handleEdit = useCallback(() => {
    onEdit(node);
    onClose();
  }, [node, onEdit, onClose]);

  const handleDelete = useCallback(() => {
    onDelete(node.id);
    onClose();
  }, [node.id, onDelete, onClose]);

  const handleAddChild = useCallback((type: NodeType, testCategory?: TestCategory) => {
    onAddChild(type, testCategory);
    onClose();
  }, [onAddChild, onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200/50 py-3 min-w-[320px] max-w-[400px]"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }}
    >
      <button 
        onClick={handleEdit}
        className="w-full px-4 py-3 text-sm text-left hover:bg-blue-50 transition-all duration-200 flex items-center group rounded-lg mx-2"
      >
        <i className="fas fa-edit mr-3 text-blue-500 group-hover:text-blue-600 transition-colors"></i>
        <div>
          <div className="font-medium text-gray-900 group-hover:text-blue-900">Edit Node</div>
          <div className="text-xs text-gray-500">Modify title and description</div>
        </div>
      </button>
      
      <div className="border-t border-gray-100 my-2 mx-2"></div>
      
      <div className="px-4 py-2">
        <div className="text-xs font-semibold text-gray-600 mb-3 flex items-center space-x-2">
          <i className="fas fa-plus text-gray-500"></i>
          <span>Add Child Node</span>
        </div>
        <div className="space-y-2">
          <button 
            onClick={() => handleAddChild('outcome')}
            className="w-full px-3 py-3 text-sm text-left hover:bg-indigo-50 rounded-lg flex items-center transition-all duration-200 group border border-transparent hover:border-indigo-200"
          >
            <i className="fas fa-bullseye mr-3 text-sm text-indigo-600 group-hover:text-indigo-700 transition-colors"></i>
            <div>
              <div className="font-semibold text-gray-900 group-hover:text-indigo-900">Outcome</div>
              <div className="text-xs text-gray-500 group-hover:text-indigo-600">Business goal or result</div>
            </div>
          </button>
          <button 
            onClick={() => handleAddChild('opportunity')}
            className="w-full px-3 py-2 text-sm text-left hover:bg-purple-50 rounded flex items-center transition-colors"
          >
            <i className="fas fa-lightbulb mr-3 text-sm" style={{ color: 'var(--secondary-purple)' }}></i>
            <div>
              <div className="font-medium text-gray-900">Opportunity</div>
              <div className="text-xs text-gray-500">Market or user opportunity</div>
            </div>
          </button>
          <button 
            onClick={() => handleAddChild('solution')}
            className="w-full px-3 py-2 text-sm text-left hover:bg-emerald-50 rounded flex items-center transition-colors"
          >
            <i className="fas fa-cog mr-3 text-sm" style={{ color: 'var(--accent-emerald)' }}></i>
            <div>
              <div className="font-medium text-gray-900">Solution</div>
              <div className="text-xs text-gray-500">Product or feature approach</div>
            </div>
          </button>
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
            <i className={`fas fa-chevron-${showTestCategories ? 'up' : 'right'} text-gray-400 text-xs`}></i>
          </button>
          
          {showTestCategories && (
            <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-100 pl-3">
              <button 
                onClick={() => handleAddChild('assumption', 'viability')}
                className="w-full px-2 py-1.5 text-xs text-left hover:bg-blue-50 rounded flex items-center transition-colors"
              >
                <i className="fas fa-seedling mr-2 text-xs" style={{ color: 'var(--viability-color)' }}></i>
                <div>
                  <div className="font-medium text-gray-900">Viability</div>
                  <div className="text-xs text-gray-500">Business model validation</div>
                </div>
              </button>
              <button 
                onClick={() => handleAddChild('assumption', 'value')}
                className="w-full px-2 py-1.5 text-xs text-left hover:bg-green-50 rounded flex items-center transition-colors"
              >
                <i className="fas fa-gem mr-2 text-xs" style={{ color: 'var(--value-color)' }}></i>
                <div>
                  <div className="font-medium text-gray-900">Value</div>
                  <div className="text-xs text-gray-500">User value proposition</div>
                </div>
              </button>
              <button 
                onClick={() => handleAddChild('assumption', 'feasibility')}
                className="w-full px-2 py-1.5 text-xs text-left hover:bg-purple-50 rounded flex items-center transition-colors"
              >
                <i className="fas fa-wrench mr-2 text-xs" style={{ color: 'var(--feasibility-color)' }}></i>
                <div>
                  <div className="font-medium text-gray-900">Feasibility</div>
                  <div className="text-xs text-gray-500">Technical implementation</div>
                </div>
              </button>
              <button 
                onClick={() => handleAddChild('assumption', 'usability')}
                className="w-full px-2 py-1.5 text-xs text-left hover:bg-pink-50 rounded flex items-center transition-colors"
              >
                <i className="fas fa-user-check mr-2 text-xs" style={{ color: 'var(--usability-color)' }}></i>
                <div>
                  <div className="font-medium text-gray-900">Usability</div>
                  <div className="text-xs text-gray-500">User experience validation</div>
                </div>
              </button>
            </div>
          )}
          <button 
            onClick={() => handleAddChild('kpi')}
            className="w-full px-3 py-2 text-sm text-left hover:bg-yellow-50 rounded flex items-center transition-colors"
          >
            <i className="fas fa-chart-line mr-3 text-sm" style={{ color: 'var(--kpi-color)' }}></i>
            <div>
              <div className="font-medium text-gray-900">KPI</div>
              <div className="text-xs text-gray-500">Key performance indicator</div>
            </div>
          </button>
        </div>
      </div>
      
      <div className="border-t border-gray-100 my-1"></div>
      
      {/* Collapse/Expand Option */}
      {node && node.children.length > 0 && onToggleCollapse && (
        <button 
          onClick={() => {
            onToggleCollapse(node.id);
            onClose();
          }}
          className="w-full px-4 py-2 text-sm text-left hover:bg-purple-50 transition-colors flex items-center"
        >
          <i className={`fas ${node.isCollapsed ? 'fa-expand' : 'fa-compress'} mr-2 text-purple-600`}></i>
          <div>
            <div className="font-medium text-purple-600">
              {node.isCollapsed ? 'Expand Branch' : 'Collapse Branch'}
            </div>
            <div className="text-xs text-gray-500">
              {node.isCollapsed ? 'Show child cards' : 'Hide child cards'}
            </div>
          </div>
        </button>
      )}
      
      <button 
        onClick={() => {
          if (node) {
            // Detach from parent (make it a root node)
            const event = new CustomEvent('reattach-node', { 
              detail: { nodeId: node.id, newParentId: null } 
            });
            window.dispatchEvent(event);
            onClose();
          }
        }}
        className="w-full px-4 py-2 text-sm text-left hover:bg-blue-50 transition-colors flex items-center"
      >
        <i className="fas fa-unlink mr-2 text-blue-600"></i>
        <div>
          <div className="font-medium text-blue-600">Detach from Parent</div>
          <div className="text-xs text-gray-500">Make this a standalone card</div>
        </div>
      </button>
      
      <button className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors flex items-center">
        <i className="fas fa-copy mr-2 text-gray-400"></i>
        Duplicate
      </button>
      <button className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors flex items-center">
        <i className="fas fa-download mr-2 text-gray-400"></i>
        Export Branch
      </button>
      
      <div className="border-t border-gray-100 my-1"></div>
      
      <button 
        onClick={handleDelete}
        className="w-full px-4 py-2 text-sm text-left hover:bg-red-50 text-red-600 transition-colors flex items-center"
      >
        <i className="fas fa-trash mr-2"></i>
        Delete Node
      </button>
    </div>
  );
});
