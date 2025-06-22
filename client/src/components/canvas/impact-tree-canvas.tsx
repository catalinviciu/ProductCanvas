import { useRef, useEffect, useState, useCallback } from "react";
import { TreeNode } from "./tree-node";
import { NodeConnections } from "./node-connections";
import { CanvasToolbar } from "./canvas-toolbar";
import { CanvasContextMenu } from "../modals/canvas-context-menu";
import { getVisibleNodes, getVisibleConnections } from "@/lib/canvas-utils";
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
}

export function ImpactTreeCanvas({
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

  // Get only visible nodes and connections
  const visibleNodes = getVisibleNodes(nodes);
  const visibleConnections = getVisibleConnections(nodes, connections);

  // Calculate dynamic canvas bounds based on nodes
  const getCanvasBounds = useCallback(() => {
    if (nodes.length === 0) {
      return { minX: -1000, maxX: 1000, minY: -1000, maxY: 1000, width: 2000, height: 2000 };
    }

    const padding = 500;
    const minX = Math.min(...nodes.map(n => n.position.x)) - padding;
    const maxX = Math.max(...nodes.map(n => n.position.x + 256)) + padding; // 256 is node width
    const minY = Math.min(...nodes.map(n => n.position.y)) - padding;
    const maxY = Math.max(...nodes.map(n => n.position.y + 120)) + padding; // 120 is node height

    return {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }, [nodes]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
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
    const bounds = getCanvasBounds();
    
    // Calculate viewport dimensions
    const viewportWidth = rect.width * 0.2;
    const viewportHeight = rect.height * 0.2;
    
    // Clamp click position to ensure viewport doesn't go outside minimap bounds
    const clampedX = Math.max(viewportWidth / 2, Math.min(rect.width - viewportWidth / 2, x));
    const clampedY = Math.max(viewportHeight / 2, Math.min(rect.height - viewportHeight / 2, y));
    
    // Convert minimap coordinates to canvas coordinates using dynamic bounds
    const normalizedX = (clampedX - viewportWidth / 2) / (rect.width - viewportWidth);
    const normalizedY = (clampedY - viewportHeight / 2) / (rect.height - viewportHeight);
    
    const canvasX = bounds.minX + normalizedX * bounds.width;
    const canvasY = bounds.minY + normalizedY * bounds.height;
    
    onCanvasUpdate({ pan: { x: -canvasX + 400, y: -canvasY + 300 } }); // Center in viewport
  }, [onCanvasUpdate, getCanvasBounds]);

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
      const bounds = getCanvasBounds();
      
      // Calculate viewport dimensions for proper clamping
      const viewportWidth = rect.width * 0.2;
      const viewportHeight = rect.height * 0.2;
      
      // Clamp coordinates within mini map bounds with viewport size consideration
      const clampedX = Math.max(viewportWidth / 2, Math.min(rect.width - viewportWidth / 2, x));
      const clampedY = Math.max(viewportHeight / 2, Math.min(rect.height - viewportHeight / 2, y));
      
      // Convert minimap coordinates to canvas coordinates using dynamic bounds
      const normalizedX = (clampedX - viewportWidth / 2) / (rect.width - viewportWidth);
      const normalizedY = (clampedY - viewportHeight / 2) / (rect.height - viewportHeight);
      
      const canvasX = bounds.minX + normalizedX * bounds.width;
      const canvasY = bounds.minY + normalizedY * bounds.height;
      
      onCanvasUpdate({ pan: { x: -canvasX + 400, y: -canvasY + 300 } });
    }
  }, [miniMapDragging, onCanvasUpdate, getCanvasBounds]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const newPan = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      };
      onCanvasUpdate({ pan: newPan });
    }
  }, [isPanning, dragStart, onCanvasUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setIsDragging(false);
    setMiniMapDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.1, Math.min(3, canvasState.zoom + delta));
    onCanvasUpdate({ zoom: newZoom });
  }, [canvasState.zoom, onCanvasUpdate]);

  const handleNodeDrag = useCallback((nodeId: string, newPosition: { x: number; y: number }) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      // Use the enhanced collision detection system that handles branches with sub-branches
      onNodeUpdate({ ...node, position: newPosition });
    }
  }, [nodes, onNodeUpdate]);

  // Global mouse event handlers for mini map dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (miniMapDragging) {
        const miniMapElement = document.querySelector('.mini-map');
        if (miniMapElement) {
          const rect = miniMapElement.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const bounds = getCanvasBounds();
          
          // Clamp coordinates within mini map bounds with viewport size consideration
          const viewportWidth = rect.width * 0.2; // 20% width of minimap
          const viewportHeight = rect.height * 0.2; // 20% height of minimap
          
          const clampedX = Math.max(viewportWidth / 2, Math.min(rect.width - viewportWidth / 2, x));
          const clampedY = Math.max(viewportHeight / 2, Math.min(rect.height - viewportHeight / 2, y));
          
          // Convert minimap coordinates to canvas coordinates using dynamic bounds
          const normalizedX = (clampedX - viewportWidth / 2) / (rect.width - viewportWidth);
          const normalizedY = (clampedY - viewportHeight / 2) / (rect.height - viewportHeight);
          
          const canvasX = bounds.minX + normalizedX * bounds.width;
          const canvasY = bounds.minY + normalizedY * bounds.height;
          
          onCanvasUpdate({ pan: { x: -canvasX + 400, y: -canvasY + 300 } });
        }
      }
    };

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
  }, [miniMapDragging, onCanvasUpdate, getCanvasBounds]);

  const canvasStyle = {
    transform: `translate(${canvasState.pan.x}px, ${canvasState.pan.y}px) scale(${canvasState.zoom})`,
    transformOrigin: '0 0',
    width: '200%',
    height: '200%',
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <CanvasToolbar 
        zoom={canvasState.zoom}
        onZoomIn={() => onCanvasUpdate({ zoom: Math.min(3, canvasState.zoom + 0.1) })}
        onZoomOut={() => onCanvasUpdate({ zoom: Math.max(0.1, canvasState.zoom - 0.1) })}
        onResetView={onResetToHome}
        isPanMode={isPanMode}
        onTogglePanMode={() => setIsPanMode(!isPanMode)}
      />

      {/* Canvas Grid Background */}
      <div 
        className="absolute inset-0 canvas-grid"
        style={{
          backgroundPosition: `${canvasState.pan.x}px ${canvasState.pan.y}px`,
          backgroundSize: `${20 * canvasState.zoom}px ${20 * canvasState.zoom}px`,
        }}
      />

      {/* Main Canvas */}
      <div
        ref={canvasRef}
        className="relative w-full h-full cursor-grab active:cursor-grabbing"
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
            // Force clear all drag states and selection
            setDraggedNodeId(null);
            setDraggedOverNodeId(null);
            setTimeout(() => {
              onNodeSelect(null);
              // Force browser to clear any remaining drag states
              if (document.activeElement) {
                (document.activeElement as HTMLElement).blur();
              }
            }, 50);
          }
        }}
        style={{ cursor: isPanning ? 'grabbing' : (isPanMode ? 'grab' : 'default') }}
      >
        {/* Canvas Background Layer - ensures right-click works everywhere */}
        <div 
          className="absolute inset-0 canvas-background"
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

          {/* Tree Nodes */}
          {visibleNodes.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              isSelected={selectedNode?.id === node.id}
              onUpdate={onNodeUpdate}
              onSelect={onNodeSelect}
              onDelete={onNodeDelete}
              onDrag={handleNodeDrag}
              onContextMenu={(position) => onContextMenu(node, position)}
              onReattach={onNodeReattach}
              onToggleCollapse={onToggleCollapse}
              onToggleChildVisibility={onToggleChildVisibility}
              allNodes={nodes}
              isDropTarget={draggedNodeId !== null && draggedNodeId !== node.id}
              isDraggedOver={draggedOverNodeId === node.id}
              orientation={canvasState.orientation}
            />
          ))}

          {/* Ghost Toggle Buttons for Hidden Children */}
          {visibleNodes.map((node) => {
            if (node.isCollapsed || !node.hiddenChildren?.length) return null;
            
            return node.hiddenChildren.map((hiddenChildId) => {
              const hiddenChild = nodes.find(n => n.id === hiddenChildId);
              if (!hiddenChild) return null;
              
              return (
                <button
                  key={`ghost-${hiddenChildId}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleChildVisibility(node.id, hiddenChildId);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className={`absolute w-6 h-6 rounded-full text-xs font-bold
                           flex items-center justify-center cursor-pointer
                           shadow-md hover:shadow-lg transition-all duration-200
                           border-2 border-white z-20 bg-gray-400 hover:bg-gray-500 text-white`}
                  style={{
                    left: hiddenChild.position.x + (canvasState.orientation === 'horizontal' ? -28 : 124),
                    top: hiddenChild.position.y + (canvasState.orientation === 'horizontal' ? 76 : -28),
                    pointerEvents: 'all'
                  }}
                  title={`Show ${hiddenChild.title} branch`}
                >
                  +
                </button>
              );
            });
          }).flat()}
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 flex flex-col">
          <button 
            className="canvas-control-btn"
            onClick={() => onCanvasUpdate({ zoom: Math.min(3, canvasState.zoom + 0.1) })}
          >
            <i className="fas fa-plus text-gray-600"></i>
          </button>
          <div className="h-px bg-gray-200 my-1"></div>
          <button 
            className="canvas-control-btn"
            onClick={() => onCanvasUpdate({ zoom: Math.max(0.1, canvasState.zoom - 0.1) })}
          >
            <i className="fas fa-minus text-gray-600"></i>
          </button>
        </div>
      </div>

      {/* Mini Map */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 w-40 h-32">
          <div className="text-xs text-gray-500 mb-2">Mini Map</div>
          <div 
            className="relative w-full h-16 bg-gray-50 border border-gray-200 rounded cursor-pointer select-none overflow-hidden"
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
            {/* Viewport indicator */}
            <div 
              className={`absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 rounded cursor-move transition-all ${miniMapDragging ? 'bg-opacity-40 border-blue-600' : ''}`}
              style={(() => {
                const bounds = getCanvasBounds();
                const viewportCenterX = -canvasState.pan.x + 400; // Current viewport center
                const viewportCenterY = -canvasState.pan.y + 300;
                
                // Convert to normalized coordinates (0-1) within canvas bounds
                const normalizedX = (viewportCenterX - bounds.minX) / bounds.width;
                const normalizedY = (viewportCenterY - bounds.minY) / bounds.height;
                
                // Convert to minimap percentage (account for viewport size)
                const left = Math.max(0, Math.min(80, normalizedX * 100));
                const top = Math.max(0, Math.min(80, normalizedY * 100));
                
                return {
                  left: `${left}%`,
                  top: `${top}%`,
                  width: '20%',
                  height: '20%',
                };
              })()}
              onMouseDown={(e) => {
                e.stopPropagation();
                setMiniMapDragging(true);
                document.body.style.cursor = 'grabbing';
              }}
            />
            {/* Node indicators */}
            {nodes.map((node) => {
              const bounds = getCanvasBounds();
              const normalizedX = (node.position.x - bounds.minX) / bounds.width;
              const normalizedY = (node.position.y - bounds.minY) / bounds.height;
              
              return (
                <div
                  key={node.id}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{
                    left: `${Math.max(0, Math.min(95, normalizedX * 100))}%`,
                    top: `${Math.max(0, Math.min(95, normalizedY * 100))}%`,
                    backgroundColor: 
                      node.type === 'outcome' ? '#4f46e5' :
                      node.type === 'opportunity' ? '#7c3aed' :
                      node.type === 'solution' ? '#059669' :
                      node.type === 'assumption' ? '#ea580c' :
                      '#dc2626'
                  }}
                />
              );
            })}
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
}
