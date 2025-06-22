import { type TreeNode, type NodeConnection } from "@shared/schema";

interface NodeConnectionsProps {
  connections: NodeConnection[];
  nodes: TreeNode[];
  zoom: number;
}

export function NodeConnections({ connections, nodes, zoom }: NodeConnectionsProps) {
  const getNodeById = (id: string) => nodes.find(node => node.id === id);

  const generateConnectionPath = (fromNode: TreeNode, toNode: TreeNode) => {
    // Calculate exact button position:
    // Card: w-64 (256px) with p-4 padding, so inner content is ~248px
    // Button: "absolute -right-3 top-1/2 w-6 h-6" 
    // -right-3 moves button 12px outside the card boundary
    // w-6 is 24px width, so center is 12px from button's left edge
    // Final calculation: card_x + 256px (card width) + 12px (outside offset) = button center
    const cardWidth = 256;
    const buttonCenterOffset = 12; // Button extends 12px beyond card edge, center is at +12px
    
    const fromX = fromNode.children.length > 0 ? 
      fromNode.position.x + cardWidth + buttonCenterOffset :
      fromNode.position.x + cardWidth;
    
    const fromY = fromNode.position.y + 60; // Card center vertically
    const toX = toNode.position.x;
    const toY = toNode.position.y + 60;

    // Smooth curved connection
    const controlX1 = fromX + 60;
    const controlY1 = fromY;
    const controlX2 = toX - 60;
    const controlY2 = toY;

    return `M ${fromX} ${fromY} C ${controlX1} ${controlY1} ${controlX2} ${controlY2} ${toX} ${toY}`;
  };

  if (!connections.length) return null;

  return (
    <svg 
      className="absolute pointer-events-none"
      style={{ 
        left: 0, 
        top: 0, 
        width: '100%', 
        height: '100%',
        overflow: 'visible'
      }}
    >
      {connections.map((connection) => {
        const fromNode = getNodeById(connection.fromNodeId);
        const toNode = getNodeById(connection.toNodeId);
        
        if (!fromNode || !toNode) return null;

        const path = generateConnectionPath(fromNode, toNode);
        
        return (
          <g key={connection.id}>
            {/* Shadow/outline for better visibility */}
            <path
              d={path}
              stroke="rgba(0,0,0,0.1)"
              strokeWidth={6 / zoom}
              fill="none"
            />
            {/* Main connection line */}
            <path
              d={path}
              stroke="#6366F1"
              strokeWidth={3 / zoom}
              fill="none"
              strokeLinecap="round"
              className="transition-all duration-200 hover:stroke-indigo-600"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
            />
            {/* Arrow marker at the end */}
            <circle
              cx={toNode.position.x}
              cy={toNode.position.y + 60}
              r={4 / zoom}
              fill="#6366F1"
              className="transition-all duration-200"
            />
          </g>
        );
      })}
    </svg>
  );
}
