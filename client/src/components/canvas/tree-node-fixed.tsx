import { useState, useRef, useCallback, useEffect, memo } from "react";
import { type TreeNode as TreeNodeType, type TestCategory } from "@shared/schema";
import { throttle } from "@/lib/performance-utils";
import { isChildHidden, areAllChildrenHidden } from "@/lib/canvas-utils";

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
  allNodes?: TreeNodeType[];
  isDropTarget?: boolean;
  isDraggedOver?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

// Enhanced node type configuration with improved styling
const NODE_TYPE_CONFIG = {
  outcome: {
    color: '#6366F1',
    bgColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    className: 'node-outcome',
    label: 'Outcome',
    icon: 'fas fa-bullseye',
    gradient: 'from-indigo-50 to-indigo-100',
  },
  opportunity: {
    color: '#8B5CF6',
    bgColor: '#F3E8FF',
    borderColor: '#DDD6FE',
    className: 'node-opportunity',
    label: 'Opportunity',
    icon: 'fas fa-lightbulb',
    gradient: 'from-purple-50 to-purple-100',
  },
  solution: {
    color: '#059669',
    bgColor: '#ECFDF5',
    borderColor: '#BBF7D0',
    className: 'node-solution',
    label: 'Solution',
    icon: 'fas fa-cog',
    gradient: 'from-emerald-50 to-emerald-100',
  },
  assumption: {
    color: '#EA580C',
    bgColor: '#FFF7ED',
    borderColor: '#FED7AA',
    className: 'node-assumption',
    label: 'Assumption Test',
    icon: 'fas fa-flask',
    gradient: 'from-orange-50 to-orange-100',
  },
  kpi: {
    color: '#DC2626',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    className: 'node-kpi',
    label: 'KPI',
    icon: 'fas fa-chart-line',
    gradient: 'from-red-50 to-red-100',
  },
} as const;

const TEST_CATEGORY_CONFIG = {
  viability: { 
    color: '#2563EB', 
    bg: '#EFF6FF', 
    label: 'Viability',
    icon: 'fas fa-seedling'
  },
  value: { 
    color: '#059669', 
    bg: '#ECFDF5', 
    label: 'Value',
    icon: 'fas fa-gem'
  },
  feasibility: { 
    color: '#7C3AED', 
    bg: '#F3E8FF', 
    label: 'Feasibility',
    icon: 'fas fa-wrench'
  },
  usability: { 
    color: '#DB2777', 
    bg: '#FDF2F8', 
    label: 'Usability',
    icon: 'fas fa-user-check'
  },
} as const;

export const TreeNode = memo(function TreeNode({
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
  const [isHovered, setIsHovered] = useState(false);
  
  const dragRef = useRef<{ startX: number; startY: number; nodeX: number; nodeY: number }>({ 
    startX: 0, startY: 0, nodeX: 0, nodeY: 0 
  });

  const config = NODE_TYPE_CONFIG[node.type];

  // Memoized handlers for better performance
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      e.stopPropagation();
      onSelect(node);
      
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

  // Throttled drag handler for smooth performance
  const throttledDragHandler = useCallback(
    throttle((position: { x: number; y: number }) => {
      onDrag(node.id, position);
    }, 16),
    [node.id, onDrag]
  );

  // Enhanced global mouse event handlers
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
  }, [isDragging, isEditing, throttledDragHandler]);

  // Enhanced drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (e.altKey) {
      e.dataTransfer.setData('text/plain', node.id);
      e.dataTransfer.effectAllowed = 'move';
      setDraggedNode(node.id);
      
      const emptyImg = new Image();
      emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
      e.dataTransfer.setDragImage(emptyImg, 0, 0);
    } else {
      e.preventDefault();
    }
  }, [node.id]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const draggedNodeId = e.dataTransfer.getData('text/plain');
    if (draggedNodeId && draggedNodeId !== node.id && onReattach) {
      onReattach(draggedNodeId, node.id);
      setDraggedNode(null);
      setDraggedOverNodeId(null);
    }
  }, [node.id, onReattach]);

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

  // Enhanced keyboard handling
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  }, [handleSaveEdit, handleCancelEdit]);

  // Enhanced styling calculations
  const nodeClasses = `
    absolute w-64 transition-all duration-300 ease-out
    ${config.className}
    ${isSelected ? 'ring-2 ring-blue-400 shadow-xl scale-105' : 'hover:shadow-lg hover:scale-102'}
    ${isDragging ? 'dragging scale-110 shadow-2xl rotate-1 z-50' : ''}
    ${isEditing ? 'z-50 ring-2 ring-green-400' : ''}
    ${draggedOverNodeId === node.id ? 'ring-2 ring-emerald-400 bg-emerald-50 scale-105' : ''}
    ${isDropTarget && draggedNode ? 'ring-2 ring-dashed ring-blue-300 animate-pulse' : ''}
    ${isDraggedOver ? 'ring-2 ring-yellow-400 bg-yellow-50 scale-102' : ''}
    ${isHovered ? 'shadow-lg' : ''}
  `.trim();

  const nodeStyle = {
    left: node.position.x,
    top: node.position.y,
    zIndex: isDragging ? 100 : isSelected ? 20 : isEditing ? 50 : 1,
    cursor: isDragging ? 'grabbing' : isEditing ? 'text' : 'grab',
    userSelect: 'none' as const,
    transform: isDragging ? 'rotate(2deg) scale(1.05)' : isHovered ? 'scale(1.02)' : 'none',
    boxShadow: isDragging ? '0 25px 50px rgba(0,0,0,0.2)' : undefined,
    borderColor: config.borderColor,
  };

  return (
    <div
      className={nodeClasses}
      style={nodeStyle}
      draggable={!isEditing}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
      onDragStart={handleDragStart}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={`${config.label}: ${node.title}${!isEditing ? `\n\nDrag to move\nHold Alt + drag to reattach` : ''}`}
    >
      <div className={`bg-gradient-to-br ${config.gradient} rounded-xl shadow-md border-2 p-4 node-created relative overflow-hidden`}>
        {/* Enhanced header with gradient background */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex items-center space-x-2">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
              style={{ backgroundColor: config.color }}
            >
              <i className={`${config.icon} text-white text-sm`} />
            </div>
            <span 
              className="text-sm font-semibold uppercase tracking-wide"
              style={{ color: config.color }}
            >
              {config.label}
            </span>
          </div>
          
          {node.type === 'assumption' && node.testCategory && (
            <div className="ml-auto">
              <span 
                className="px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1"
                style={{
                  backgroundColor: TEST_CATEGORY_CONFIG[node.testCategory].bg,
                  color: TEST_CATEGORY_CONFIG[node.testCategory].color,
                }}
              >
                <i className={`${TEST_CATEGORY_CONFIG[node.testCategory].icon} text-xs`} />
                <span>{TEST_CATEGORY_CONFIG[node.testCategory].label}</span>
              </span>
            </div>
          )}
        </div>

        {/* Enhanced content area */}
        {isEditing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full font-semibold text-gray-900 border-2 border-blue-200 outline-none bg-white rounded-lg px-3 py-2 focus:border-blue-400 transition-colors"
              autoFocus
              placeholder="Enter title..."
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full text-sm text-gray-700 border-2 border-blue-200 outline-none bg-white rounded-lg px-3 py-2 resize-none focus:border-blue-400 transition-colors"
              rows={3}
              placeholder="Enter description..."
            />
            <div className="flex space-x-2 pt-2">
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-1"
              >
                <i className="fas fa-check text-xs" />
                <span>Save</span>
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 transition-colors flex items-center justify-center space-x-1"
              >
                <i className="fas fa-times text-xs" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="font-bold text-gray-900 mb-2 leading-tight">{node.title}</h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">{node.description}</p>
          </>
        )}

        {/* Enhanced footer with improved visual hierarchy */}
        {!isEditing && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 ${
                node.children.length > 0 ? 
                  (node.isCollapsed ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-blue-100 border-blue-300 text-blue-700') 
                  : 'bg-gray-100 border-gray-300 text-gray-500'
              } transition-colors`}>
                <span className="text-xs font-bold">
                  {node.children.length}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-600 font-medium">
                  {node.children.length === 1 ? 'child' : 'children'}
                </span>
                {node.isCollapsed && node.children.length > 0 && (
                  <span className="text-xs text-purple-600 font-medium">hidden</span>
                )}
              </div>
            </div>
            
            <button 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
              onClick={(e) => {
                e.stopPropagation();
                handleContextMenu(e);
              }}
            >
              <i className="fas fa-ellipsis-h text-gray-400 group-hover:text-gray-600 text-sm transition-colors" />
            </button>
          </div>
        )}

        {/* Enhanced toggle buttons with better positioning */}
        {node.children.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse?.(node.id);
            }}
            className={`absolute w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                     shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-white z-10
                     ${areAllChildrenHidden(node) ? 'bg-blue-500 hover:bg-blue-600' : 'bg-purple-500 hover:bg-purple-600'}
                     text-white ${
                       orientation === 'horizontal' 
                         ? '-right-3 top-1/2 -translate-y-1/2' 
                         : '-bottom-3 left-1/2 -translate-x-1/2'
                     }`}
            title={areAllChildrenHidden(node) ? 'Expand all children' : 'Collapse all children'}
          >
            {areAllChildrenHidden(node) ? '+' : '−'}
          </button>
        )}

        {/* Individual child visibility toggle */}
        {node.parentId && (() => {
          const parentNode = allNodes.find(n => n.id === node.parentId);
          if (!parentNode || parentNode.isCollapsed) return null;
          
          const isHidden = isChildHidden(parentNode, node.id);
          
          return (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleChildVisibility?.(node.parentId!, node.id);
              }}
              className={`absolute w-6 h-6 rounded-full text-xs font-bold
                       flex items-center justify-center cursor-pointer
                       shadow-lg hover:shadow-xl transition-all duration-200
                       border-2 border-white z-20 ${
                         isHidden 
                           ? 'bg-gray-500 hover:bg-gray-600 text-white' 
                           : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                       } ${
                         orientation === 'horizontal' 
                           ? '-left-3 top-1/2 -translate-y-1/2' 
                           : '-top-3 left-1/2 -translate-x-1/2'
                       }`}
              title={`${isHidden ? 'Show' : 'Hide'} ${node.title} branch`}
            >
              {isHidden ? '+' : '−'}
            </button>
          );
        })()}
      </div>
    </div>
  );
});