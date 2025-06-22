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

    // Create curved path using quadratic bezier curve
    const controlX1 = fromX + 100;
    const controlY1 = fromY;
    const controlX2 = toX - 100;
    const controlY2 = toY;

    return `M ${fromX} ${fromY} Q ${controlX1} ${controlY1} ${(controlX1 + controlX2) / 2} ${(controlY1 + controlY2) / 2} Q ${controlX2} ${controlY2} ${toX} ${toY}`;
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
          <path
            key={connection.id}
            d={path}
            className="connection-line"
            strokeWidth={2 / zoom} // Adjust stroke width based on zoom
          />
        );
      })}
    </svg>
  );
}
