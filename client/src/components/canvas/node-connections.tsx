import { type TreeNode, type NodeConnection } from "@shared/schema";

interface NodeConnectionsProps {
  connections: NodeConnection[];
  nodes: TreeNode[];
  zoom: number;
}

export function NodeConnections({ connections, nodes, zoom }: NodeConnectionsProps) {
  const getNodeById = (id: string) => nodes.find(node => node.id === id);

  const generateConnectionPath = (fromNode: TreeNode, toNode: TreeNode) => {
    const fromX = fromNode.position.x + 256; // Node width (256px) to get right edge
    const fromY = fromNode.position.y + 60; // Half node height to center vertically
    const toX = toNode.position.x;
    const toY = toNode.position.y + 60;

    // Create smooth curved path using cubic bezier curve
    const controlX1 = fromX + 150;
    const controlY1 = fromY;
    const controlX2 = toX - 150;
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
