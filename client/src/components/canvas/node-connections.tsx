import { type TreeNode, type NodeConnection } from "@shared/schema";

interface NodeConnectionsProps {
  connections: NodeConnection[];
  nodes: TreeNode[];
  zoom: number;
}

export function NodeConnections({ connections, nodes, zoom }: NodeConnectionsProps) {
  const getNodeById = (id: string) => nodes.find(node => node.id === id);

  const generateConnectionPath = (fromNode: TreeNode, toNode: TreeNode) => {
    // Button positioning analysis:
    // Card: w-64 = 256px total width
    // Button: "absolute -right-3 top-1/2 w-6 h-6"
    // -right-3 = -0.75rem = -12px (positions button 12px outside right edge)
    // w-6 = 1.5rem = 24px width
    // Button left edge is at: card_right_edge + 12px = card_x + 256 + 12 = card_x + 268
    // Button center is at: button_left + 12px = card_x + 268 + 12 = card_x + 280
    // But we need to account for the actual visual center which appears to be at card_x + 256 + 0
    
    const cardWidth = 256; // w-64 in pixels
    
    const fromX = fromNode.children.length > 0 ? 
      fromNode.position.x + cardWidth + 12 : // Card edge + 12px to reach button center
      fromNode.position.x + cardWidth;
    
    const fromY = fromNode.position.y + 60; // Card vertical center
    const toX = toNode.position.x;
    const toY = toNode.position.y + 60;

    // Create curved path
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
