import { useState, useRef, useCallback, useEffect, memo, useMemo } from "react";
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

const TreeNodeComponent = memo(function TreeNode({
  node,
  isSelected,
  onUpdate,
  onSelect,
  onDelete,
  onDrag,
  onContextMenu,
  onReattach,
  onToggleCollapse,
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
  const dragRef = useRef<{ startX: number; startY: number; nodeX: number; nodeY: number }>({ 
    startX: 0, startY: 0, nodeX: 0, nodeY: 0 
  });

  // Memoize config to prevent unnecessary recalculations
  const config = useMemo(() => nodeTypeConfig[node.type], [node.type]);
  
  // Memoize parent node lookup
  const parentNode = useMemo(() => 
    node.parentId ? allNodes.find(n => n.id === node.parentId) : null,
    [node.parentId, allNodes]
  );
  

  
  // Memoize collapse state calculations
  const collapseState = useMemo(() => {
    const hasChildren = node.children.length > 0;
    const allChildrenHidden = hasChildren ? areAllChildrenHidden(node) : false;
    return { hasChildren, allChildrenHidden };
  }, [node.children.length, node]);

  // Memoize test category config
  const testConfig = useMemo(() => 
    node.testCategory ? testCategoryConfig[node.testCategory] : null,
    [node.testCategory]
  );

  // Sync edit state with node changes
  useEffect(() => {
    setEditTitle(node.title);
    setEditDescription(node.description);
  }, [node.title, node.description]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't handle mouse down if we're in editing mode or clicking on form elements
    if (isEditing || (e.target as HTMLElement).closest('.space-y-3')) {
      return;
    }
    
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
  }, [isDragging, isEditing, throttledDragHandler]);

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
      setDraggedNode(null);
      setDraggedOverNodeId(null);
      
      setTimeout(() => {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.blur) {
          activeElement.blur();
        }
        const canvas = document.querySelector('.impact-tree-canvas') as HTMLElement;
        if (canvas) {
          canvas.focus();
        }
      }, 10);
    } else {
      setDraggedOverNodeId(null);
    }
  }, [node.id, onReattach]);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    // Only allow HTML5 drag when Alt key is held for attachment
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

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setDraggedNode(null);
    setDraggedOverNodeId(null);
    
    const cleanup = () => {
      const draggedElement = e.target as HTMLElement;
      if (draggedElement) {
        draggedElement.style.transform = '';
        draggedElement.style.opacity = '1';
        draggedElement.style.pointerEvents = '';
        draggedElement.blur();
      }
      
      const canvas = document.querySelector('.impact-tree-canvas');
      if (canvas) {
        (canvas as HTMLElement).focus();
        setTimeout(() => (canvas as HTMLElement).blur(), 10);
      }
      
      const mouseEvent = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      document.dispatchEvent(mouseEvent);
      
      if (e.dataTransfer.dropEffect === 'move') {
        onSelect(null);
      }
    };
    
    cleanup();
    setTimeout(cleanup, 50);
    setTimeout(cleanup, 200);
  }, [onSelect]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu({ x: e.clientX, y: e.clientY });
  }, [onContextMenu]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Double click - entering edit mode for node:', node.id);
    setIsEditing(true);
  }, [node.id]);

  const handleSaveEdit = useCallback(() => {
    console.log('Save edit clicked for node:', node.id, { editTitle, editDescription });
    setIsEditing(false);
    if (editTitle !== node.title || editDescription !== node.description) {
      console.log('Updating node with new values');
      onUpdate({
        ...node,
        title: editTitle,
        description: editDescription,
      });
    }
  }, [editTitle, editDescription, node, onUpdate]);

  const handleCancelEdit = useCallback(() => {
    console.log('Cancel edit clicked for node:', node.id);
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

  // Memoize dynamic className to prevent excessive recalculations
  const nodeClassName = useMemo(() => {
    const baseClass = `absolute w-75 transition-all duration-200 tree-node-container ${config.className}`;
    const stateClasses = [];
    
    if (isSelected) stateClasses.push('ring-2 ring-blue-400 shadow-lg');
    else stateClasses.push('hover:shadow-lg');
    
    if (isDragging) stateClasses.push('dragging scale-105 shadow-2xl rotate-1 z-50');
    if (isEditing) stateClasses.push('editing z-50');
    if (draggedOverNodeId === node.id) stateClasses.push('ring-2 ring-green-400 bg-green-50 scale-102');
    if (isDropTarget && draggedNode) stateClasses.push('ring-2 ring-dashed ring-blue-300 animate-pulse');
    if (isDraggedOver) stateClasses.push('ring-2 ring-yellow-400 bg-yellow-50');
    
    return `${baseClass} ${stateClasses.join(' ')}`;
  }, [config.className, isSelected, isDragging, isEditing, draggedOverNodeId, node.id, isDropTarget, draggedNode, isDraggedOver]);

  // Memoize style object to prevent unnecessary re-renders
  const nodeStyle = useMemo(() => ({
    left: node.position.x, 
    top: node.position.y,
    zIndex: isDragging ? 100 : isSelected ? 20 : isEditing ? 50 : 1,
    cursor: isDragging ? 'grabbing' : isEditing ? 'text' : 'grab',
    userSelect: 'none' as const,
    transform: isDragging ? 'rotate(2deg) scale(1.05)' : 'none',
    boxShadow: isDragging ? '0 20px 40px rgba(0,0,0,0.15)' : undefined,
  }), [node.position.x, node.position.y, isDragging, isSelected, isEditing]);

  return (
    <div
      className={nodeClassName}
      style={nodeStyle}
      draggable={!isEditing}
      title={`${config.label}: ${node.title}${!isEditing ? `\n\nDrag to move ${collapseState.hasChildren ? '(children will follow)' : 'position'}\nHold Alt + drag to reattach to other cards` : ''}`}
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
      <div className="modern-card node-created relative group flex flex-col">
        {/* Enhanced Attachment Indicator */}
        {(draggedOverNodeId === node.id || (isDropTarget && draggedNode)) && (
          <div className="enhanced-attachment-indicator">
            <div className="pulse-ring"></div>
            <div className="pulse-ring delay-75"></div>
            <i className="fas fa-plus text-white text-xs"></i>
          </div>
        )}
        
        {/* Card Accent Border */}
        <div 
          className="absolute inset-0 opacity-20 bg-gradient-to-br text-[#ffffff]"
          style={{
            background: `linear-gradient(135deg, ${config.color}22 0%, ${config.color}11 50%, transparent 100%)`
          }}
        />
        
        {/* Node Header - Compact */}
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <div className="flex items-center space-x-1.5">
            <div 
              className="icon-container-compact"
              style={{ '--accent-color': config.color } as any}
            >
              <i className={`${config.icon} text-xs`} />
            </div>
            <div className="flex flex-col">
              <span 
                className="text-xs font-medium uppercase tracking-wide"
                style={{ color: config.color }}
              >
                {config.label}
              </span>
              {node.type === 'assumption' && testConfig && (
                <span className="text-xs text-gray-400 -mt-0.5">
                  {testConfig.label}
                </span>
              )}
            </div>
          </div>
          
          {/* Action buttons container */}
          <div className="flex items-center">
            {!isEditing && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  onContextMenu(node, { x: rect.right, y: rect.bottom });
                }}
                className="action-btn-compact"
                title="More options"
              >
                <i className="fas fa-ellipsis-v text-xs"></i>
              </button>
            )}
          </div>
        </div>

        {/* Node Content - Compact layout */}
        <div className="flex-1 flex flex-col min-h-0">
          {isEditing ? (
            <div className="edit-mode-container" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onMouseDown={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                className="edit-title-input-single"
                placeholder="Enter title..."
                autoFocus
              />
              <div className="edit-actions-container">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSaveEdit();
                  }}
                  className="edit-btn-save"
                  type="button"
                >
                  <i className="fas fa-check"></i>
                  Save
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCancelEdit();
                  }}
                  className="edit-btn-cancel"
                  type="button"
                >
                  <i className="fas fa-times"></i>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="content-area-compact flex-1 overflow-hidden" onDoubleClick={handleDoubleClick}>
              <h3 className="node-title-compact line-clamp-2">{node.title}</h3>
            </div>
          )}
        </div>

        {/* Test category badge in card if needed */}
        {!isEditing && node.type === 'assumption' && testConfig && (
          <div className="test-category-badge-inline">
            <i className={`${testConfig.icon} text-xs mr-1`} />
            <span>{testConfig.label}</span>
          </div>
        )}

        
      </div>
      {/* Children indicator bottom left - clickable to toggle visibility */}
      {!isEditing && (
        <div 
          className={`children-indicator-bottom-left ${collapseState.hasChildren ? 'clickable' : ''}`}
          onClick={collapseState.hasChildren ? (e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleCollapse?.(node.id);
          } : undefined}
          title={collapseState.hasChildren ? 
            (node.isCollapsed ? 'Click to show children' : 'Click to hide children') : 
            'No children'
          }
        >
          <div className={`children-badge-external ${
            collapseState.hasChildren ? 
              (node.isCollapsed ? 'collapsed' : 'expanded') 
              : 'empty'
          }`}>
            <span className="children-count-external">{node.children.length}</span>
          </div>
          <span className="children-label-external">
            {node.children.length === 1 ? 'child' : 'children'}
            {node.isCollapsed && collapseState.hasChildren && ' (hidden)'}
          </span>
          
          {collapseState.hasChildren && (
            <div className="status-icon-external">
              <i className={`fas ${node.isCollapsed ? 'fa-eye-slash' : 'fa-eye'} text-xs ${
                node.isCollapsed ? 'text-purple-500' : 'text-blue-500'
              }`}></i>
            </div>
          )}
        </div>
      )}

      {/* +1 Action button bottom right */}
      {!isEditing && (
        <div 
          className="action-button-bottom-right clickable"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleContextMenu(e);
          }}
          title="Add child node"
        >
          <div className="action-badge-external">
            <span className="action-text-external">+1</span>
          </div>
        </div>
      )}
    </div>
  );
});

// Export the memoized component
export const TreeNode = TreeNodeComponent;