import { useRef, useEffect, useState, useCallback } from "react";
import { TreeNode } from "./tree-node";
import { NodeConnections } from "./node-connections";
import { CanvasToolbar } from "./canvas-toolbar";
import { type TreeNode as TreeNodeType, type NodeConnection, type CanvasState } from "@shared/schema";

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
}: ImpactTreeCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isPanMode, setIsPanMode] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
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
      onNodeUpdate({ ...node, position: newPosition });
    }
  }, [nodes, onNodeUpdate]);

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
        onResetView={() => onCanvasUpdate({ zoom: 1, pan: { x: 0, y: 0 } })}
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
        style={{ cursor: isPanning ? 'grabbing' : (isPanMode ? 'grab' : 'default') }}
      >
        <div style={canvasStyle}>
          {/* Node Connections */}
          <NodeConnections 
            connections={connections}
            nodes={nodes}
            zoom={canvasState.zoom}
          />

          {/* Tree Nodes */}
          {nodes.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              isSelected={selectedNode?.id === node.id}
              onUpdate={onNodeUpdate}
              onSelect={onNodeSelect}
              onDelete={onNodeDelete}
              onDrag={handleNodeDrag}
              onContextMenu={(position) => onContextMenu(node, position)}
            />
          ))}
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 w-32 h-24">
          <div className="text-xs text-gray-500 mb-2">Mini Map</div>
          <div 
            className="relative w-full h-full mini-map cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              
              // Convert minimap coordinates to canvas coordinates
              const canvasX = (x / rect.width) * 1400 - 400;
              const canvasY = (y / rect.height) * 800 - 300;
              
              onCanvasUpdate({ pan: { x: -canvasX, y: -canvasY } });
            }}
          >
            {/* Viewport indicator */}
            <div 
              className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 rounded"
              style={{
                left: `${Math.max(0, Math.min(80, (-canvasState.pan.x / 1400) * 100))}%`,
                top: `${Math.max(0, Math.min(80, (-canvasState.pan.y / 800) * 100))}%`,
                width: '20%',
                height: '20%',
              }}
            />
            {/* Node indicators */}
            {nodes.map((node) => (
              <div
                key={node.id}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  left: `${(node.position.x / 1400) * 100}%`,
                  top: `${(node.position.y / 800) * 100}%`,
                  backgroundColor: 
                    node.type === 'outcome' ? 'var(--primary-indigo)' :
                    node.type === 'opportunity' ? 'var(--secondary-purple)' :
                    node.type === 'solution' ? 'var(--accent-emerald)' :
                    'var(--orange-test)'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
