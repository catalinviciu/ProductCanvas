import { useState, useRef, useCallback } from "react";
import { type TreeNode as TreeNodeType, type TestCategory } from "@shared/schema";

interface TreeNodeProps {
  node: TreeNodeType;
  isSelected: boolean;
  onUpdate: (node: TreeNodeType) => void;
  onSelect: (node: TreeNodeType | null) => void;
  onDelete: (nodeId: string) => void;
  onDrag: (nodeId: string, position: { x: number; y: number }) => void;
  onContextMenu: (position: { x: number; y: number }) => void;
}

const nodeTypeConfig = {
  outcome: {
    color: 'var(--primary-indigo)',
    className: 'node-outcome',
    label: 'Outcome',
  },
  opportunity: {
    color: 'var(--secondary-purple)', 
    className: 'node-opportunity',
    label: 'Opportunity',
  },
  solution: {
    color: 'var(--accent-emerald)',
    className: 'node-solution',
    label: 'Solution',
  },
  assumption: {
    color: 'var(--orange-test)',
    className: 'node-assumption',
    label: 'Assumption Test',
  },
};

const testCategoryConfig = {
  viability: { color: 'var(--viability-color)', bg: 'hsl(217, 91%, 95%)', label: 'Viability' },
  value: { color: 'var(--value-color)', bg: 'hsl(142, 76%, 95%)', label: 'Value' },
  feasibility: { color: 'var(--feasibility-color)', bg: 'hsl(271, 81%, 95%)', label: 'Feasibility' },
  usability: { color: 'var(--usability-color)', bg: 'hsl(330, 81%, 95%)', label: 'Usability' },
};

export function TreeNode({
  node,
  isSelected,
  onUpdate,
  onSelect,
  onDelete,
  onDrag,
  onContextMenu,
}: TreeNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);
  const [editDescription, setEditDescription] = useState(node.description);
  const dragRef = useRef<{ startX: number; startY: number; nodeX: number; nodeY: number }>({ 
    startX: 0, startY: 0, nodeX: 0, nodeY: 0 
  });

  const config = nodeTypeConfig[node.type];

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      e.stopPropagation();
      onSelect(node);
      
      if (!isEditing) {
        setIsDragging(true);
        dragRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          nodeX: node.position.x,
          nodeY: node.position.y,
        };
      }
    }
  }, [node, onSelect, isEditing]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && !isEditing) {
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      
      const newPosition = {
        x: dragRef.current.nodeX + deltaX,
        y: dragRef.current.nodeY + deltaY,
      };
      
      onDrag(node.id, newPosition);
    }
  }, [isDragging, isEditing, node.id, onDrag]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu({ x: e.clientX, y: e.clientY });
  }, [onContextMenu]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  const handleSaveEdit = useCallback(() => {
    setIsEditing(false);
    if (editTitle !== node.title || editDescription !== node.description) {
      onUpdate({
        ...node,
        title: editTitle,
        description: editDescription,
      });
    }
  }, [editTitle, editDescription, node, onUpdate]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditTitle(node.title);
    setEditDescription(node.description);
  }, [node.title, node.description]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  }, [handleSaveEdit, handleCancelEdit]);

  return (
    <div
      className={`absolute w-64 cursor-move hover:shadow-lg transition-all ${
        config.className
      } ${isSelected ? 'ring-2 ring-blue-400' : ''} ${isDragging ? 'dragging' : ''} ${
        isEditing ? 'z-50' : ''
      }`}
      style={{ 
        left: node.position.x, 
        top: node.position.y,
        zIndex: isSelected ? 10 : 1,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
    >
      <div className="bg-white rounded-lg shadow-md p-4 node-created">
        {/* Node Header */}
        <div className="flex items-center space-x-2 mb-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <span 
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: config.color }}
          >
            {config.label}
          </span>
          {node.type === 'assumption' && node.testCategory && (
            <div className="ml-auto">
              <span 
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: testCategoryConfig[node.testCategory].color }}
                title={`${testCategoryConfig[node.testCategory].label} Test`}
              />
            </div>
          )}
        </div>

        {/* Node Content */}
        {isEditing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full font-semibold text-gray-900 border-none outline-none bg-gray-50 rounded px-2 py-1"
              autoFocus
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full text-sm text-gray-600 border-none outline-none bg-gray-50 rounded px-2 py-1 resize-none"
              rows={2}
            />
            <div className="flex space-x-2">
              <button
                onClick={handleSaveEdit}
                className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="font-semibold text-gray-900 mb-2">{node.title}</h3>
            <p className="text-sm text-gray-600 mb-3">{node.description}</p>
          </>
        )}

        {/* Node Footer */}
        {!isEditing && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-xs text-gray-600">{node.children.length}</span>
              </div>
              <span className="text-xs text-gray-500">
                {node.children.length === 1 ? 'child' : 'children'}
              </span>
            </div>
            
            {node.type === 'assumption' && node.testCategory && (
              <div className="text-xs">
                <span 
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: testCategoryConfig[node.testCategory].bg,
                    color: testCategoryConfig[node.testCategory].color,
                  }}
                >
                  {testCategoryConfig[node.testCategory].label}
                </span>
              </div>
            )}
            
            <button 
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleContextMenu(e);
              }}
            >
              <i className="fas fa-ellipsis-h text-gray-400 text-xs"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
