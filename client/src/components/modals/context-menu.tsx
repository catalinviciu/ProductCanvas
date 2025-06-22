import { useEffect, useRef } from "react";
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
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[160px]"
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
        <div className="text-xs font-medium text-gray-500 mb-2">Add Child</div>
        <div className="space-y-1">
          <button 
            onClick={() => handleAddChild('opportunity')}
            className="w-full px-2 py-1 text-xs text-left hover:bg-gray-50 rounded flex items-center"
          >
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
            Opportunity
          </button>
          <button 
            onClick={() => handleAddChild('solution')}
            className="w-full px-2 py-1 text-xs text-left hover:bg-gray-50 rounded flex items-center"
          >
            <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
            Solution
          </button>
          <button 
            onClick={() => handleAddChild('assumption')}
            className="w-full px-2 py-1 text-xs text-left hover:bg-gray-50 rounded flex items-center"
          >
            <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
            Assumption Test
          </button>
        </div>
      </div>
      
      <div className="border-t border-gray-100 my-1"></div>
      
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
