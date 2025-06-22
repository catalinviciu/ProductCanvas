import { useState, useRef, useCallback, useEffect } from "react";
import { type TreeNode as TreeNodeType, type TestCategory } from "@shared/schema";
import { throttle } from "@/lib/performance-utils";
import { isChildHidden } from "@/lib/canvas-utils";

interface TreeNodeProps {
  node: TreeNodeType;
  isSelected: boolean;
  onUpdate: (node: TreeNodeType) => void;
  onSelect: (node: TreeNodeType | null) => void;
  onDelete: (nodeId: string) => void;
  onDrag: (nodeId: string, position: { x: number; y: number }) => void;
  onContextMenu: (position: { x: number; y: number }) => void;
  onReattach?: (nodeId: string, newParentId: string | null) => void;
  onToggleCollapse?: (nodeId: string) => void;
  onToggleChildVisibility?: (parentId: string, childId: string) => void;
  allNodes?: TreeNodeType[]; // Needed to get child node info for individual toggles
  isDropTarget?: boolean;
  isDraggedOver?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

const nodeTypeConfig = {
  outcome: {
    color: 'var(--primary-indigo)',
    className: 'node-outcome',
    label: 'Outcome',
    icon: 'fas fa-bullseye',
  },
  opportunity: {
    color: 'var(--secondary-purple)', 
    className: 'node-opportunity',
    label: 'Opportunity',
    icon: 'fas fa-lightbulb',
  },
  solution: {
    color: 'var(--accent-emerald)',
    className: 'node-solution',
    label: 'Solution',
    icon: 'fas fa-cog',
  },
  assumption: {
    color: 'var(--orange-test)',
    className: 'node-assumption',
    label: 'Assumption Test',
    icon: 'fas fa-flask',
  },
  kpi: {
    color: 'var(--kpi-color)',
    className: 'node-kpi',
    label: 'KPI',
    icon: 'fas fa-chart-line',
  },
};

const testCategoryConfig = {
  viability: { 
    color: 'var(--viability-color)', 
    bg: 'hsl(217, 91%, 95%)', 
    label: 'Viability',
    icon: 'fas fa-seedling'
  },
  value: { 
    color: 'var(--value-color)', 
    bg: 'hsl(142, 76%, 95%)', 
    label: 'Value',
    icon: 'fas fa-gem'
  },
  feasibility: { 
    color: 'var(--feasibility-color)', 
    bg: 'hsl(271, 81%, 95%)', 
    label: 'Feasibility',
    icon: 'fas fa-wrench'
  },
  usability: { 
    color: 'var(--usability-color)', 
    bg: 'hsl(330, 81%, 95%)', 
    label: 'Usability',
    icon: 'fas fa-user-check'
  },
};

export function TreeNode({
  node,
  isSelected,
  onUpdate,
  onSelect,
  onDelete,
  onDrag,
  onContextMenu,
  onReattach,
  onToggleCollapse,
  onToggleChildVisibility,
  allNodes = [],
  isDropTarget = false,
  isDraggedOver = false,
  orientation = 'horizontal',
}: TreeNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);
  const [editDescription, setEditDescription] = useState(node.description);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [draggedOverNodeId, setDraggedOverNodeId] = useState<string | null>(null);
  const [isMovingWithParent, setIsMovingWithParent] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; nodeX: number; nodeY: number }>({ 
    startX: 0, startY: 0, nodeX: 0, nodeY: 0 
  });

  const config = nodeTypeConfig[node.type];

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      e.stopPropagation();
      onSelect(node);
      
      // Only enable position dragging if not in editing mode and not using attachment dragging
      if (!isEditing && !e.shiftKey) {
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

  // Throttled drag handler for better performance
  const throttledDragHandler = useCallback(
    throttle((position: { x: number; y: number }) => {
      onDrag(node.id, position);
    }, 16), // ~60fps
    [node.id, onDrag]
  );

  // Global mouse event handlers for smooth dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && !isEditing) {
        e.preventDefault();
        const deltaX = e.clientX - dragRef.current.startX;
        const deltaY = e.clientY - dragRef.current.startY;
        
        const newPosition = {
          x: dragRef.current.nodeX + deltaX,
          y: dragRef.current.nodeY + deltaY,
        };
        
        throttledDragHandler(newPosition);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isEditing, node.id, onDrag]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDraggedNode(null);
  }, []);

  // Enhanced drop zone handlers for attachment
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('text/plain')) {
      setDraggedOverNodeId(node.id);
    }
  }, [node.id]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear if we're actually leaving this node
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDraggedOverNodeId(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const draggedNodeId = e.dataTransfer.getData('text/plain');
    if (draggedNodeId && draggedNodeId !== node.id && onReattach) {
      onReattach(draggedNodeId, node.id);
    }
    setDraggedOverNodeId(null);
  }, [node.id, onReattach]);

  // Controlled drag start for attachment - only when Alt key is held
  const handleDragStart = useCallback((e: React.DragEvent) => {
    // Only allow HTML5 drag when Alt key is held for attachment
    if (e.altKey) {
      e.dataTransfer.setData('text/plain', node.id);
      e.dataTransfer.effectAllowed = 'move';
      setDraggedNode(node.id);
    } else {
      e.preventDefault();
    }
  }, [node.id]);

  const handleDragEnd = useCallback(() => {
    setDraggedNode(null);
    setDraggedOverNodeId(null);
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
      className={`absolute w-64 transition-all duration-200 tree-node-container ${
        config.className
      } ${isSelected ? 'ring-2 ring-blue-400 shadow-lg' : 'hover:shadow-lg'} ${
        isDragging ? 'dragging scale-105 shadow-2xl rotate-1 z-50' : ''
      } ${isEditing ? 'z-50' : ''} ${
        draggedOverNodeId === node.id ? 'ring-2 ring-green-400 bg-green-50 scale-102' : ''
      } ${
        isDropTarget && draggedNode ? 'ring-2 ring-dashed ring-blue-300 animate-pulse' : ''
      } ${
        isDraggedOver ? 'ring-2 ring-yellow-400 bg-yellow-50' : ''
      }`}
      style={{ 
        left: node.position.x, 
        top: node.position.y,
        zIndex: isDragging ? 100 : isSelected ? 20 : isEditing ? 50 : 1,
        cursor: isDragging ? 'grabbing' : isEditing ? 'text' : 'grab',
        userSelect: 'none',
        transform: isDragging ? 'rotate(2deg) scale(1.05)' : 'none',
        boxShadow: isDragging ? '0 20px 40px rgba(0,0,0,0.15)' : undefined,
      }}
      draggable={!isEditing}
      title={`${config.label}: ${node.title}${!isEditing ? `\n\nDrag to move ${node.children.length > 0 ? '(children will follow)' : 'position'}\nHold Alt + drag to reattach to other cards` : ''}`}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="bg-white rounded-lg shadow-md p-4 node-created relative">
        {/* Attachment Indicator */}
        {(draggedOverNodeId === node.id || (isDropTarget && draggedNode)) && (
          <div className="attachment-indicator">
            <i className="fas fa-plus text-white text-xs"></i>
          </div>
        )}
        
        {/* Node Header */}
        <div className="flex items-center space-x-2 mb-2">
          <i 
            className={`${config.icon} text-sm`}
            style={{ color: config.color }}
          />
          <span 
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: config.color }}
          >
            {config.label}
          </span>
          {node.type === 'assumption' && node.testCategory && (
            <div className="ml-auto">
              <i 
                className={`${testCategoryConfig[node.testCategory].icon} text-xs`}
                style={{ color: testCategoryConfig[node.testCategory].color }}
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
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                node.children.length > 0 ? 
                  (node.isCollapsed ? 'bg-purple-100 border border-purple-200' : 'bg-blue-100 border border-blue-200') 
                  : 'bg-gray-100'
              }`}>
                <span className={`text-xs ${
                  node.children.length > 0 ? 
                    (node.isCollapsed ? 'text-purple-600 font-medium' : 'text-blue-600 font-medium')
                    : 'text-gray-600'
                }`}>
                  {node.children.length}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {node.children.length === 1 ? 'child' : 'children'}
                {node.isCollapsed && node.children.length > 0 && ' (hidden)'}
              </span>
              {node.children.length > 0 && (
                <i className={`fas ${node.isCollapsed ? 'fa-eye-slash' : 'fa-sitemap'} text-xs ${
                  node.isCollapsed ? 'text-purple-500' : 'text-blue-500'
                }`} title={
                  node.isCollapsed ? 'Children are hidden - click + to expand' : 'Moving this card will reorganize all children'
                }></i>
              )}
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

        {/* Individual Child Toggle Buttons */}
        {node.children.length > 0 && !node.isCollapsed && (
          <div className={`absolute flex ${
            orientation === 'horizontal' 
              ? 'flex-col -right-8 top-2 space-y-1' 
              : 'flex-row -bottom-8 left-2 space-x-1'
          }`}>
            {node.children.map((childId, index) => {
              const childNode = allNodes.find(n => n.id === childId);
              const isHidden = isChildHidden(node, childId);
              
              return (
                <button
                  key={childId}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleChildVisibility?.(node.id, childId);
                  }}
                  className={`w-4 h-4 rounded-full text-xs font-bold
                           flex items-center justify-center
                           shadow-sm hover:shadow-md transition-all duration-200
                           border border-white z-10 ${
                             isHidden 
                               ? 'bg-gray-400 hover:bg-gray-500 text-white opacity-60' 
                               : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                           }`}
                  title={`${isHidden ? 'Show' : 'Hide'} ${childNode?.title || 'child'} branch`}
                >
                  {isHidden ? '+' : '−'}
                </button>
              );
            })}
          </div>
        )}

        {/* Master Collapse/Expand Button */}
        {node.children.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse?.(node.id);
            }}
            className={`absolute w-6 h-6 
                     bg-blue-500 hover:bg-blue-600 text-white rounded-full 
                     flex items-center justify-center text-xs font-bold
                     shadow-md hover:shadow-lg transition-all duration-200
                     border-2 border-white z-10 ${
                       orientation === 'horizontal' 
                         ? '-right-3 top-1/2 -translate-y-1/2' 
                         : '-bottom-3 left-1/2 -translate-x-1/2'
                     }`}
            title={node.isCollapsed ? 'Expand all children' : 'Collapse all children'}
          >
            {node.isCollapsed ? '+' : '−'}
          </button>
        )}
      </div>
    </div>
  );
}
