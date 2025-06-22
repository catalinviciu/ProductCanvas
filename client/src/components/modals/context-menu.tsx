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

  // Memoized handlers - MUST be declared before any conditional returns
  const handleEdit = useCallback(() => {
    if (!node) return;
    onEdit(node);
    onClose();
  }, [node, onEdit, onClose]);

  const handleDelete = useCallback(() => {
    if (!node) return;
    onDelete(node.id);
    onClose();
  }, [node, onDelete, onClose]);

  const handleAddChild = useCallback((type: NodeType, testCategory?: TestCategory) => {
    onAddChild(type, testCategory);
    onClose();
  }, [onAddChild, onClose]);

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

  // Early return AFTER all hooks have been called
  if (!isOpen || !node) return null;

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
            className="w-full px-3 py-3 text-sm text-left hover:bg-purple-50 rounded-lg flex items-center transition-all duration-200 group border border-transparent hover:border-purple-200"
          >
            <i className="fas fa-lightbulb mr-3 text-sm text-purple-600 group-hover:text-purple-700 transition-colors"></i>
            <div>
              <div className="font-semibold text-gray-900 group-hover:text-purple-900">Opportunity</div>
              <div className="text-xs text-gray-500 group-hover:text-purple-600">Market or user opportunity</div>
            </div>
          </button>
          <button 
            onClick={() => handleAddChild('solution')}
            className="w-full px-3 py-3 text-sm text-left hover:bg-emerald-50 rounded-lg flex items-center transition-all duration-200 group border border-transparent hover:border-emerald-200"
          >
            <i className="fas fa-cog mr-3 text-sm text-emerald-600 group-hover:text-emerald-700 transition-colors"></i>
            <div>
              <div className="font-semibold text-gray-900 group-hover:text-emerald-900">Solution</div>
              <div className="text-xs text-gray-500 group-hover:text-emerald-600">Product or feature approach</div>
            </div>
          </button>
          <button 
            onClick={() => setShowTestCategories(!showTestCategories)}
            className="w-full px-3 py-3 text-sm text-left hover:bg-orange-50 rounded-lg flex items-center justify-between transition-all duration-200 group border border-transparent hover:border-orange-200"
          >
            <div className="flex items-center">
              <i className="fas fa-flask mr-3 text-sm text-orange-600 group-hover:text-orange-700 transition-colors"></i>
              <div>
                <div className="font-semibold text-gray-900 group-hover:text-orange-900">Assumption Test</div>
                <div className="text-xs text-gray-500 group-hover:text-orange-600">Hypothesis to validate</div>
              </div>
            </div>
            <i className={`fas fa-chevron-${showTestCategories ? 'up' : 'right'} text-gray-400 group-hover:text-orange-500 text-xs transition-colors`}></i>
          </button>
          
          {showTestCategories && (
            <div className="ml-4 mt-2 space-y-2 border-l-2 border-orange-200 pl-4 bg-gradient-to-r from-orange-50/50 to-transparent rounded-r-lg py-2">
              <button 
                onClick={() => handleAddChild('assumption', 'viability')}
                className="w-full px-3 py-2 text-xs text-left hover:bg-blue-50 rounded-lg flex items-center transition-all duration-200 group border border-transparent hover:border-blue-200"
              >
                <i className="fas fa-seedling mr-2 text-xs text-blue-600 group-hover:text-blue-700 transition-colors"></i>
                <div>
                  <div className="font-medium text-gray-900 group-hover:text-blue-900">Viability</div>
                  <div className="text-xs text-gray-500 group-hover:text-blue-600">Business model validation</div>
                </div>
              </button>
              <button 
                onClick={() => handleAddChild('assumption', 'value')}
                className="w-full px-3 py-2 text-xs text-left hover:bg-emerald-50 rounded-lg flex items-center transition-all duration-200 group border border-transparent hover:border-emerald-200"
              >
                <i className="fas fa-gem mr-2 text-xs text-emerald-600 group-hover:text-emerald-700 transition-colors"></i>
                <div>
                  <div className="font-medium text-gray-900 group-hover:text-emerald-900">Value</div>
                  <div className="text-xs text-gray-500 group-hover:text-emerald-600">User value proposition</div>
                </div>
              </button>
              <button 
                onClick={() => handleAddChild('assumption', 'feasibility')}
                className="w-full px-3 py-2 text-xs text-left hover:bg-purple-50 rounded-lg flex items-center transition-all duration-200 group border border-transparent hover:border-purple-200"
              >
                <i className="fas fa-wrench mr-2 text-xs text-purple-600 group-hover:text-purple-700 transition-colors"></i>
                <div>
                  <div className="font-medium text-gray-900 group-hover:text-purple-900">Feasibility</div>
                  <div className="text-xs text-gray-500 group-hover:text-purple-600">Technical implementation</div>
                </div>
              </button>
              <button 
                onClick={() => handleAddChild('assumption', 'usability')}
                className="w-full px-3 py-2 text-xs text-left hover:bg-pink-50 rounded-lg flex items-center transition-all duration-200 group border border-transparent hover:border-pink-200"
              >
                <i className="fas fa-user-check mr-2 text-xs text-pink-600 group-hover:text-pink-700 transition-colors"></i>
                <div>
                  <div className="font-medium text-gray-900 group-hover:text-pink-900">Usability</div>
                  <div className="text-xs text-gray-500 group-hover:text-pink-600">User experience validation</div>
                </div>
              </button>
            </div>
          )}
          <button 
            onClick={() => handleAddChild('kpi')}
            className="w-full px-3 py-3 text-sm text-left hover:bg-red-50 rounded-lg flex items-center transition-all duration-200 group border border-transparent hover:border-red-200"
          >
            <i className="fas fa-chart-line mr-3 text-sm text-red-600 group-hover:text-red-700 transition-colors"></i>
            <div>
              <div className="font-semibold text-gray-900 group-hover:text-red-900">KPI</div>
              <div className="text-xs text-gray-500 group-hover:text-red-600">Key performance indicator</div>
            </div>
          </button>
        </div>
      </div>
      
      <div className="border-t border-gray-100 my-3 mx-2"></div>
      
      {/* Collapse/Expand Option */}
      {node && node.children.length > 0 && onToggleCollapse && (
        <button 
          onClick={() => {
            onToggleCollapse(node.id);
            onClose();
          }}
          className="w-full px-4 py-3 text-sm text-left hover:bg-purple-50 transition-all duration-200 flex items-center group rounded-lg mx-2"
        >
          <i className={`fas ${node.isCollapsed ? 'fa-expand' : 'fa-compress'} mr-3 text-purple-600 group-hover:text-purple-700 transition-colors`}></i>
          <div>
            <div className="font-medium text-purple-600 group-hover:text-purple-700">
              {node.isCollapsed ? 'Expand Branch' : 'Collapse Branch'}
            </div>
            <div className="text-xs text-gray-500 group-hover:text-purple-500">
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
        className="w-full px-4 py-3 text-sm text-left hover:bg-blue-50 transition-all duration-200 flex items-center group rounded-lg mx-2"
      >
        <i className="fas fa-unlink mr-3 text-blue-600 group-hover:text-blue-700 transition-colors"></i>
        <div>
          <div className="font-medium text-blue-600 group-hover:text-blue-700">Detach from Parent</div>
          <div className="text-xs text-gray-500 group-hover:text-blue-500">Make this a standalone card</div>
        </div>
      </button>
      
      <button className="w-full px-4 py-3 text-sm text-left hover:bg-gray-50 transition-all duration-200 flex items-center group rounded-lg mx-2">
        <i className="fas fa-copy mr-3 text-gray-500 group-hover:text-gray-600 transition-colors"></i>
        <div>
          <div className="font-medium text-gray-700 group-hover:text-gray-800">Duplicate</div>
          <div className="text-xs text-gray-500">Create a copy of this node</div>
        </div>
      </button>
      <button className="w-full px-4 py-3 text-sm text-left hover:bg-gray-50 transition-all duration-200 flex items-center group rounded-lg mx-2">
        <i className="fas fa-download mr-3 text-gray-500 group-hover:text-gray-600 transition-colors"></i>
        <div>
          <div className="font-medium text-gray-700 group-hover:text-gray-800">Export Branch</div>
          <div className="text-xs text-gray-500">Download this branch as JSON</div>
        </div>
      </button>
      
      <div className="border-t border-gray-100 my-3 mx-2"></div>
      
      <button 
        onClick={handleDelete}
        className="w-full px-4 py-3 text-sm text-left hover:bg-red-50 transition-all duration-200 flex items-center group rounded-lg mx-2"
      >
        <i className="fas fa-trash mr-3 text-red-500 group-hover:text-red-600 transition-colors"></i>
        <div>
          <div className="font-medium text-red-600 group-hover:text-red-700">Delete Node</div>
          <div className="text-xs text-red-400 group-hover:text-red-500">Remove this node permanently</div>
        </div>
      </button>
    </div>
  );
});
