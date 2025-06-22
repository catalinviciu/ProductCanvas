import { type TreeNode, type NodeConnection } from "@shared/schema";

interface NodeConnectionsProps {
  connections: NodeConnection[];
  nodes: TreeNode[];
  zoom: number;
}

export function NodeConnections({ connections, nodes, zoom }: NodeConnectionsProps) {
  const getNodeById = (id: string) => nodes.find(node => node.id === id);

  const generateConnectionPath = (fromNode: TreeNode, toNode: TreeNode) => {
    // Calculate exact button center position:
    // Button CSS: "absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6"
    // -right-3 = -12px from card's right edge
    // w-6 h-6 = 24px width/height
    // Button center is at: card_right_edge + (-12px + 12px) = card_right_edge + 0px
    
    const cardWidth = 256; // w-64 = 256px
    const nodeHeight = 120; // Approximate node height based on padding and content
    
    // For nodes with children, start from collapse/expand button center
    // For nodes without children, start from card's right edge
    const fromX = fromNode.children.length > 0 ? 
      fromNode.position.x + cardWidth : // Button center is exactly at card's right edge
      fromNode.position.x + cardWidth; // Card edge for nodes without children
    
    // Button is positioned at top-1/2 (vertical center of card)
    const fromY = fromNode.position.y + (nodeHeight / 2);
    
    // End at left edge of target node, vertically centered
    const toX = toNode.position.x;
    const toY = toNode.position.y + (nodeHeight / 2);

    // Create smooth curved path
    const controlX1 = fromX + 50;
    const controlY1 = fromY;
    const controlX2 = toX - 50;
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
              cy={toNode.position.y + (120 / 2)}
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
