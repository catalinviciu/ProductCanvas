import { type TreeNode, type NodeConnection } from "@shared/schema";

interface NodeConnectionsProps {
  connections: NodeConnection[];
  nodes: TreeNode[];
  zoom: number;
  orientation?: 'horizontal' | 'vertical';
}

export function NodeConnections({ connections, nodes, zoom, orientation = 'horizontal' }: NodeConnectionsProps) {
  const getNodeById = (id: string) => nodes.find(node => node.id === id);

  const generateConnectionPath = (fromNode: TreeNode, toNode: TreeNode) => {
    const cardWidth = 256; // w-64 = 256px
    const nodeHeight = 120; // Approximate node height based on padding and content
    
    if (orientation === 'horizontal') {
      // Horizontal layout: connections go from right to left
      const fromX = fromNode.children.length > 0 ? 
        fromNode.position.x + cardWidth : 
        fromNode.position.x + cardWidth;
      const fromY = fromNode.position.y + (nodeHeight / 2);
      
      const toX = toNode.position.x;
      const toY = toNode.position.y + (nodeHeight / 2);

      const controlX1 = fromX + 50;
      const controlY1 = fromY;
      const controlX2 = toX - 50;
      const controlY2 = toY;

      return `M ${fromX} ${fromY} C ${controlX1} ${controlY1} ${controlX2} ${controlY2} ${toX} ${toY}`;
    } else {
      // Vertical layout: connections go from bottom to top
      const fromX = fromNode.position.x + (cardWidth / 2);
      const fromY = fromNode.children.length > 0 ? 
        fromNode.position.y + nodeHeight : 
        fromNode.position.y + nodeHeight;
      
      const toX = toNode.position.x + (cardWidth / 2);
      const toY = toNode.position.y;

      const controlX1 = fromX;
      const controlY1 = fromY + 50;
      const controlX2 = toX;
      const controlY2 = toY - 50;

      return `M ${fromX} ${fromY} C ${controlX1} ${controlY1} ${controlX2} ${controlY2} ${toX} ${toY}`;
    }
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
