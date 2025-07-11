import { useRef, useEffect, useState, useCallback, memo, useMemo } from "react";
import { TreeNode } from "./tree-node";
import { NodeConnections } from "./node-connections";
import { CanvasToolbar } from "./canvas-toolbar";
import { CanvasContextMenu } from "../modals/canvas-context-menu";
import { TreeProvider } from "@/contexts/tree-context";
import { getVisibleNodes, getVisibleConnections, moveNodeWithChildren, snapToGrid } from "@/lib/canvas-utils";
import { throttle, debounce } from "@/lib/performance-utils";
import { NODE_DIMENSIONS, CANVAS_CONSTANTS } from "@/lib/node-constants";
import { type TreeNode as TreeNodeType, type NodeConnection, type CanvasState, type NodeType, type TestCategory } from "@shared/schema";

interface ImpactTreeCanvasProps {
  nodes: TreeNodeType[];
  connections: NodeConnection[];
  canvasState: CanvasState;
  selectedNode: TreeNodeType | null;
  onNodeUpdate: (node: TreeNodeType) => void;
  onNodeSelect: (node: TreeNodeType | null) => void;
  onNodeDelete: (nodeId: string) => void;
  onCanvasUpdate: (updates: Partial<CanvasState>) => void;
  onContextMenu: (node: TreeNodeType, position: { x: number; y: number }) => void;
  onNodeCreate: (type: NodeType, testCategory?: TestCategory, parentNode?: TreeNodeType, customPosition?: { x: number; y: number }) => void;
  onNodeReattach: (nodeId: string, newParentId: string | null) => void;
  onToggleCollapse: (nodeId: string) => void;
  onToggleChildVisibility: (parentId: string, childId: string) => void;
  onResetToHome: () => void;
  onFitToScreen: () => void;
  onOrientationToggle: () => void;
}

const ImpactTreeCanvasComponent = memo(function ImpactTreeCanvas({
  nodes,
  connections,
  canvasState,
  selectedNode,
  onNodeUpdate,
  onNodeSelect,
  onNodeDelete,
  onCanvasUpdate,
  onContextMenu,
  onNodeCreate,
  onNodeReattach,
  onToggleCollapse,
  onToggleChildVisibility,
  onResetToHome,
  onFitToScreen,
  onOrientationToggle,
}: ImpactTreeCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isPanMode, setIsPanMode] = useState(false);
  const [canvasContextMenu, setCanvasContextMenu] = useState<{isOpen: boolean, position: {x: number, y: number}} | null>(null);
  const [miniMapDragging, setMiniMapDragging] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [draggedOverNodeId, setDraggedOverNodeId] = useState<string | null>(null);

  // Memoize visible nodes and connections for performance
  const visibleNodes = useMemo(() => getVisibleNodes(nodes), [nodes]);
  const visibleConnections = useMemo(() => getVisibleConnections(nodes, connections), [nodes, connections]);

  // Calculate dynamic canvas bounds based on nodes with memoization
  const canvasBounds = useMemo(() => {
    if (nodes.length === 0) {
      return { minX: -1000, maxX: 1000, minY: -1000, maxY: 1000, width: 2000, height: 2000 };
    }

    const padding = CANVAS_CONSTANTS.CANVAS_PADDING * 5; // 500px padding
    const minX = Math.min(...nodes.map(n => n.position.x)) - padding;
    const maxX = Math.max(...nodes.map(n => n.position.x + NODE_DIMENSIONS.WIDTH)) + padding;
    const minY = Math.min(...nodes.map(n => n.position.y)) - padding;
    const maxY = Math.max(...nodes.map(n => n.position.y + NODE_DIMENSIONS.HEIGHT)) + padding;

    return {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }, [nodes]);

  // Memoize canvas style to prevent unnecessary recalculations
  const canvasStyle = useMemo(() => ({
    transform: `translate(${canvasState.pan.x}px, ${canvasState.pan.y}px) scale(${canvasState.zoom})`,
    transformOrigin: '0 0',
    width: '200%',
    height: '200%',
  }), [canvasState.pan.x, canvasState.pan.y, canvasState.zoom]);

  // Memoize grid background style
  const gridStyle = useMemo(() => ({
    backgroundPosition: `${canvasState.pan.x}px ${canvasState.pan.y}px`,
    backgroundSize: `${20 * canvasState.zoom}px ${20 * canvasState.zoom}px`,
  }), [canvasState.pan.x, canvasState.pan.y, canvasState.zoom]);

  // Throttled canvas update for better performance
  const throttledCanvasUpdate = useCallback(
    throttle((updates: Partial<CanvasState>) => {
      onCanvasUpdate(updates);
    }, 16), // ~60fps
    [onCanvasUpdate]
  );

  // Debounced canvas update for less frequent operations
  const debouncedCanvasUpdate = useCallback(
    debounce((updates: Partial<CanvasState>) => {
      onCanvasUpdate(updates);
    }, 100),
    [onCanvasUpdate]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Dispatch custom event to hide navigation
    document.dispatchEvent(new CustomEvent('canvasInteraction', { detail: { type: 'mousedown' } }));
    
    // Close canvas context menu on any click
    setCanvasContextMenu(null);
    
    if (e.button === 1 || (e.button === 0 && e.metaKey) || (e.button === 0 && isPanMode)) { // Middle click, Cmd+click, or pan mode
      setIsPanning(true);
      setDragStart({ x: e.clientX - canvasState.pan.x, y: e.clientY - canvasState.pan.y });
      e.preventDefault();
    } else if (e.button === 0 && !isPanMode) { // Left click in select mode
      // Check if clicking on empty canvas
      if (e.target === canvasRef.current) {
        onNodeSelect(null);
      }
    }
  }, [canvasState.pan, onNodeSelect, isPanMode]);

  const handleCanvasContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if right-clicking on a tree node
    const target = e.target as HTMLElement;
    const isOnNode = target.closest('.tree-node-container') || 
                     target.closest('.node-created');
    
    // Only show canvas context menu if NOT clicking on a node
    if (!isOnNode) {
      setCanvasContextMenu({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY }
      });
    }
  }, []);

  // Calculate actual canvas viewport dimensions
  const canvasViewportDimensions = useMemo(() => {
    // Get actual canvas dimensions or use reasonable defaults
    const canvasElement = canvasRef.current;
    const viewportWidth = canvasElement ? 
      canvasElement.clientWidth / canvasState.zoom : 
      800 / canvasState.zoom;
    const viewportHeight = canvasElement ? 
      canvasElement.clientHeight / canvasState.zoom : 
      600 / canvasState.zoom;
    
    // Calculate as percentage of total canvas bounds
    const widthPercentage = Math.min(100, (viewportWidth / canvasBounds.width) * 100);
    const heightPercentage = Math.min(100, (viewportHeight / canvasBounds.height) * 100);
    
    return {
      widthPercentage: Math.max(5, widthPercentage), // Minimum 5% visibility
      heightPercentage: Math.max(5, heightPercentage), // Minimum 5% visibility
    };
  }, [canvasState.zoom, canvasBounds.width, canvasBounds.height]);

  const handleCanvasNodeCreate = useCallback((type: NodeType, testCategory?: TestCategory) => {
    if (canvasContextMenu) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        // Calculate the world position where the node should be created
        const screenX = canvasContextMenu.position.x - rect.left;
        const screenY = canvasContextMenu.position.y - rect.top;
        
        // Transform screen coordinates to world coordinates
        const worldX = (screenX - canvasState.pan.x) / canvasState.zoom;
        const worldY = (screenY - canvasState.pan.y) / canvasState.zoom;
        
        onNodeCreate(type, testCategory, undefined, { x: worldX, y: worldY });
      }
    }
    setCanvasContextMenu(null);
  }, [canvasContextMenu, canvasState, onNodeCreate]);

  const handleMiniMapClick = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate viewport dimensions based on actual canvas viewport
    const { widthPercentage, heightPercentage } = canvasViewportDimensions;
    const viewportWidth = rect.width * (widthPercentage / 100);
    const viewportHeight = rect.height * (heightPercentage / 100);
    
    // Clamp click position to ensure viewport doesn't go outside minimap bounds
    const clampedX = Math.max(viewportWidth / 2, Math.min(rect.width - viewportWidth / 2, x));
    const clampedY = Math.max(viewportHeight / 2, Math.min(rect.height - viewportHeight / 2, y));
    
    // Convert minimap coordinates to canvas coordinates using dynamic bounds
    const normalizedX = (clampedX - viewportWidth / 2) / (rect.width - viewportWidth);
    const normalizedY = (clampedY - viewportHeight / 2) / (rect.height - viewportHeight);
    
    const canvasX = canvasBounds.minX + normalizedX * canvasBounds.width;
    const canvasY = canvasBounds.minY + normalizedY * canvasBounds.height;
    
    onCanvasUpdate({ pan: { x: -canvasX + 400, y: -canvasY + 300 } }); // Center in viewport
  }, [onCanvasUpdate, canvasBounds, canvasViewportDimensions]);

  const handleMiniMapMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Always handle click first, then set dragging
    handleMiniMapClick(e);
    setMiniMapDragging(true);
    document.body.style.cursor = 'grabbing';
  }, [handleMiniMapClick]);

  const handleMiniMapMouseMove = useCallback((e: React.MouseEvent) => {
    if (miniMapDragging) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Calculate viewport dimensions based on actual canvas viewport
      const { widthPercentage, heightPercentage } = canvasViewportDimensions;
      const viewportWidth = rect.width * (widthPercentage / 100);
      const viewportHeight = rect.height * (heightPercentage / 100);
      
      // Clamp coordinates within mini map bounds with viewport size consideration
      const clampedX = Math.max(viewportWidth / 2, Math.min(rect.width - viewportWidth / 2, x));
      const clampedY = Math.max(viewportHeight / 2, Math.min(rect.height - viewportHeight / 2, y));
      
      // Convert minimap coordinates to canvas coordinates using dynamic bounds
      const normalizedX = (clampedX - viewportWidth / 2) / (rect.width - viewportWidth);
      const normalizedY = (clampedY - viewportHeight / 2) / (rect.height - viewportHeight);
      
      const canvasX = canvasBounds.minX + normalizedX * canvasBounds.width;
      const canvasY = canvasBounds.minY + normalizedY * canvasBounds.height;
      
      throttledCanvasUpdate({ pan: { x: -canvasX + 400, y: -canvasY + 300 } });
    }
  }, [miniMapDragging, throttledCanvasUpdate, canvasBounds, canvasViewportDimensions]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const newPan = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      };
      throttledCanvasUpdate({ pan: newPan });
    }
  }, [isPanning, dragStart, throttledCanvasUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setIsDragging(false);
    setMiniMapDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.1, Math.min(3, canvasState.zoom + delta));
    debouncedCanvasUpdate({ zoom: newZoom });
  }, [canvasState.zoom, debouncedCanvasUpdate]);

  const handleNodeDrag = useCallback((nodeId: string, newPosition: { x: number; y: number }) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      // Snap the new position to grid
      const snappedPosition = snapToGrid(newPosition);
      
      // Check if the node has children
      if (node.children && node.children.length > 0) {
        // Use moveNodeWithChildren to move the node and all its children
        const updatedNodes = moveNodeWithChildren(nodes, nodeId, snappedPosition, canvasState.orientation);
        
        // Find all nodes that actually moved
        const movedNodes = updatedNodes.filter(updatedNode => {
          const originalNode = nodes.find(n => n.id === updatedNode.id);
          return originalNode && (
            originalNode.position.x !== updatedNode.position.x || 
            originalNode.position.y !== updatedNode.position.y
          );
        });
        
        // Update all moved nodes individually but only call onNodeUpdate once per node
        movedNodes.forEach(movedNode => {
          onNodeUpdate(movedNode);
        });
      } else {
        // Single node without children - simple update
        onNodeUpdate({ ...node, position: snappedPosition });
      }
    }
  }, [nodes, onNodeUpdate, canvasState.orientation]);

  // Global mouse event handlers for mini map dragging with performance optimization
  useEffect(() => {
    const handleGlobalMouseMove = throttle((e: MouseEvent) => {
      if (miniMapDragging) {
        const miniMapElement = document.querySelector('.mini-map');
        if (miniMapElement) {
          const rect = miniMapElement.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          // Calculate dynamic viewport dimensions based on current zoom and canvas bounds
          const canvasElement = canvasRef.current;
          const viewportWidth = canvasElement ? 
            canvasElement.clientWidth / canvasState.zoom : 
            800 / canvasState.zoom;
          const viewportHeight = canvasElement ? 
            canvasElement.clientHeight / canvasState.zoom : 
            600 / canvasState.zoom;
          
          // Calculate as percentage of total canvas bounds
          const widthPercentage = Math.max(5, Math.min(100, (viewportWidth / canvasBounds.width) * 100));
          const heightPercentage = Math.max(5, Math.min(100, (viewportHeight / canvasBounds.height) * 100));
          
          // Calculate actual viewport dimensions on minimap
          const minimapViewportWidth = rect.width * (widthPercentage / 100);
          const minimapViewportHeight = rect.height * (heightPercentage / 100);
          
          const clampedX = Math.max(minimapViewportWidth / 2, Math.min(rect.width - minimapViewportWidth / 2, x));
          const clampedY = Math.max(minimapViewportHeight / 2, Math.min(rect.height - minimapViewportHeight / 2, y));
          
          // Convert minimap coordinates to canvas coordinates using dynamic bounds
          const normalizedX = (clampedX - minimapViewportWidth / 2) / (rect.width - minimapViewportWidth);
          const normalizedY = (clampedY - minimapViewportHeight / 2) / (rect.height - minimapViewportHeight);
          
          const canvasX = canvasBounds.minX + normalizedX * canvasBounds.width;
          const canvasY = canvasBounds.minY + normalizedY * canvasBounds.height;
          
          onCanvasUpdate({ pan: { x: -canvasX + 400, y: -canvasY + 300 } });
        }
      }
    }, 16);

    const handleGlobalMouseUp = () => {
      setMiniMapDragging(false);
      document.body.style.cursor = '';
    };

    if (miniMapDragging) {
      document.body.style.cursor = 'grabbing';
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.body.style.cursor = '';
      };
    }
  }, [miniMapDragging, onCanvasUpdate, canvasBounds, canvasState.zoom]);

  // Memoize minimap viewport indicator style for performance
  const minimapViewportStyle = useMemo(() => {
    const viewportCenterX = -canvasState.pan.x + 400; // Current viewport center
    const viewportCenterY = -canvasState.pan.y + 300;
    
    // Convert to normalized coordinates (0-1) within canvas bounds
    const normalizedX = (viewportCenterX - canvasBounds.minX) / canvasBounds.width;
    const normalizedY = (viewportCenterY - canvasBounds.minY) / canvasBounds.height;
    
    // Use calculated viewport dimensions instead of hardcoded 20%
    const { widthPercentage, heightPercentage } = canvasViewportDimensions;
    
    // Convert to minimap percentage (account for actual viewport size)
    const left = Math.max(0, Math.min(100 - widthPercentage, normalizedX * 100 - widthPercentage / 2));
    const top = Math.max(0, Math.min(100 - heightPercentage, normalizedY * 100 - heightPercentage / 2));
    
    return {
      left: `${left}%`,
      top: `${top}%`,
      width: `${widthPercentage}%`,
      height: `${heightPercentage}%`,
    };
  }, [canvasState.pan.x, canvasState.pan.y, canvasBounds, canvasViewportDimensions]);

  // Memoize minimap node indicators for performance
  const minimapNodeIndicators = useMemo(() => {
    return nodes.map((node) => {
      const normalizedX = (node.position.x - canvasBounds.minX) / canvasBounds.width;
      const normalizedY = (node.position.y - canvasBounds.minY) / canvasBounds.height;
      
      const nodeColor = 
        node.type === 'outcome' ? '#4f46e5' :
        node.type === 'opportunity' ? '#7c3aed' :
        node.type === 'solution' ? '#059669' :
        node.type === 'assumption' ? '#ea580c' :
        '#dc2626';
      
      return (
        <div
          key={node.id}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            left: `${Math.max(0, Math.min(95, normalizedX * 100))}%`,
            top: `${Math.max(0, Math.min(95, normalizedY * 100))}%`,
            backgroundColor: nodeColor
          }}
        />
      );
    });
  }, [nodes, canvasBounds]);



  return (
    <div className="relative w-full h-full overflow-hidden">
      <CanvasToolbar 
        zoom={canvasState.zoom}
        onZoomIn={() => onCanvasUpdate({ zoom: Math.min(3, canvasState.zoom + 0.1) })}
        onZoomOut={() => onCanvasUpdate({ zoom: Math.max(0.1, canvasState.zoom - 0.1) })}
        isPanMode={isPanMode}
        onTogglePanMode={() => setIsPanMode(!isPanMode)}
        onFitToScreen={onFitToScreen}
        orientation={canvasState.orientation}
        onOrientationToggle={onOrientationToggle}
      />

      {/* Enhanced Canvas Background */}
      <div className="modern-canvas-background">
        <div className="canvas-gradient-overlay" />
        <div 
          className="modern-grid-pattern"
          style={gridStyle}
        />
      </div>

      {/* Main Canvas */}
      <div
        ref={canvasRef}
        className="modern-canvas-container impact-tree-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleCanvasContextMenu}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const draggedNodeId = e.dataTransfer.getData('text/plain');
          if (draggedNodeId) {
            onNodeReattach(draggedNodeId, null); // Detach from parent
            setDraggedNodeId(null);
            setDraggedOverNodeId(null);
            setTimeout(() => {
              onNodeSelect(null);
              if (document.activeElement) {
                (document.activeElement as HTMLElement).blur();
              }
            }, 50);
          }
        }}
        style={{ cursor: isPanning ? 'grabbing' : (isPanMode ? 'grab' : 'default') }}
      >
        {/* Interactive Canvas Surface */}
        <div 
          className="canvas-interaction-layer"
          style={{ 
            pointerEvents: 'all',
            zIndex: 0
          }}
        />
        
        <div style={canvasStyle}>
          {/* Node Connections */}
          <NodeConnections 
            connections={visibleConnections}
            nodes={visibleNodes}
            zoom={canvasState.zoom}
            orientation={canvasState.orientation}
          />

          {/* Tree Nodes with Context Provider for Performance */}
          <TreeProvider nodes={nodes}>
            {visibleNodes.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                isSelected={selectedNode?.id === node.id}
                onUpdate={onNodeUpdate}
                onSelect={onNodeSelect}
                onDelete={onNodeDelete}
                onDrag={handleNodeDrag}
                onContextMenu={(position: { x: number; y: number }) => onContextMenu(node, position)}
                onReattach={onNodeReattach}
                onToggleCollapse={onToggleCollapse}
                isDropTarget={draggedNodeId !== null && draggedNodeId !== node.id}
                isDraggedOver={draggedOverNodeId === node.id}
                orientation={canvasState.orientation}
              />
            ))}
          </TreeProvider>


        </div>
      </div>

      {/* Enhanced Zoom Controls */}
      <div className="modern-zoom-controls">
        <div className="zoom-controls-container">
          <button 
            className="zoom-btn zoom-btn-in"
            onClick={() => onCanvasUpdate({ zoom: Math.min(3, canvasState.zoom + 0.1) })}
            disabled={canvasState.zoom >= 3}
            title="Zoom In"
          >
            <i className="fas fa-plus"></i>
          </button>
          <div className="zoom-indicator">
            <span className="zoom-text">{Math.round(canvasState.zoom * 100)}%</span>
          </div>
          <button 
            className="zoom-btn zoom-btn-out"
            onClick={() => onCanvasUpdate({ zoom: Math.max(0.1, canvasState.zoom - 0.1) })}
            disabled={canvasState.zoom <= 0.1}
            title="Zoom Out"
          >
            <i className="fas fa-minus"></i>
          </button>
        </div>
      </div>

      {/* Enhanced Mini Map */}
      <div className="modern-minimap">
        <div className="minimap-container">
          <div className="minimap-header">
            <div className="minimap-title">
              <i className="fas fa-map text-xs mr-1"></i>
              <span>Navigation</span>
            </div>
            <div className="minimap-stats">
              <span>{nodes.length} nodes</span>
            </div>
          </div>
          <div 
            className="minimap-viewport"
            onMouseDown={handleMiniMapMouseDown}
            onMouseMove={handleMiniMapMouseMove}
            onMouseUp={() => {
              setMiniMapDragging(false);
              document.body.style.cursor = '';
            }}
            onMouseLeave={() => {
              setMiniMapDragging(false);
              document.body.style.cursor = '';
            }}
          >
            {/* Enhanced Viewport indicator */}
            <div 
              className={`viewport-indicator ${miniMapDragging ? 'dragging' : ''}`}
              style={minimapViewportStyle}
              onMouseDown={(e) => {
                e.stopPropagation();
                setMiniMapDragging(true);
                document.body.style.cursor = 'grabbing';
              }}
            >
              <div className="viewport-border"></div>
              <div className="viewport-fill"></div>
            </div>
            {/* Enhanced Node indicators */}
            <div className="minimap-nodes">
              {minimapNodeIndicators}
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Context Menu */}
      <CanvasContextMenu
        isOpen={canvasContextMenu?.isOpen || false}
        position={canvasContextMenu?.position || { x: 0, y: 0 }}
        onClose={() => setCanvasContextMenu(null)}
        onNodeCreate={handleCanvasNodeCreate}
      />
    </div>
  );
});

// Export the memoized component
export { ImpactTreeCanvasComponent as ImpactTreeCanvas };