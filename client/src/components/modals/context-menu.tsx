import { useEffect, useRef, useState } from "react";
import { type TreeNode, type NodeType, type TestCategory } from "@shared/schema";

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  node: TreeNode | null;
  onClose: () => void;
  onEdit: (node: TreeNode) => void;
  onDelete: (nodeId: string) => void;
  onAddChild: (type: NodeType, testCategory?: TestCategory) => void;
}

export function ContextMenu({
  isOpen,
  position,
  node,
  onClose,
  onEdit,
  onDelete,
  onAddChild,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showTestCategories, setShowTestCategories] = useState(false);

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

  if (!isOpen || !node) return null;

  const handleEdit = () => {
    onEdit(node);
    onClose();
  };

  const handleDelete = () => {
    onDelete(node.id);
    onClose();
  };

  const handleAddChild = (type: NodeType, testCategory?: TestCategory) => {
    onAddChild(type, testCategory);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[280px]"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <button 
        onClick={handleEdit}
        className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors flex items-center"
      >
        <i className="fas fa-edit mr-2 text-gray-400"></i>
        Edit Node
      </button>
      
      <div className="border-t border-gray-100 my-1"></div>
      
      <div className="px-4 py-2">
        <div className="text-xs font-medium text-gray-500 mb-2">Add Child Node</div>
        <div className="space-y-1">
          <button 
            onClick={() => handleAddChild('outcome')}
            className="w-full px-3 py-2 text-sm text-left hover:bg-blue-50 rounded flex items-center transition-colors"
          >
            <i className="fas fa-bullseye mr-3 text-sm" style={{ color: 'var(--primary-indigo)' }}></i>
            <div>
              <div className="font-medium text-gray-900">Outcome</div>
              <div className="text-xs text-gray-500">Business goal or result</div>
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
}
