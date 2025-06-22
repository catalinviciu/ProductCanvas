import { useMemo, memo } from 'react';
import { type TreeNode, type NodeConnection } from "@shared/schema";

interface NodeConnectionsProps {
  connections: NodeConnection[];
  nodes: TreeNode[];
  zoom: number;
  orientation?: 'horizontal' | 'vertical';
}

// Connection configuration constants for better maintainability
const CONNECTION_CONFIG = {
  cardWidth: 256,
  nodeHeight: 120,
  connectionOffset: 50,
  strokeWidth: {
    shadow: 6,
    main: 3,
  },
  colors: {
    main: '#6366F1',
    hover: '#4F46E5',
    shadow: 'rgba(0,0,0,0.1)',
  },
  arrowSize: 4,
} as const;

export const NodeConnections = memo(function NodeConnections({ connections, nodes, zoom, orientation = 'horizontal' }: NodeConnectionsProps) {
  // Memoize node lookup map for better performance
  const nodeMap = useMemo(() => {
    const map = new Map<string, TreeNode>();
    nodes.forEach(node => map.set(node.id, node));
    return map;
  }, [nodes]);

  // Memoize connection paths to avoid recalculation on every render
  const connectionPaths = useMemo(() => {
    return connections.map(connection => {
      const fromNode = nodeMap.get(connection.fromNodeId);
      const toNode = nodeMap.get(connection.toNodeId);
      
      if (!fromNode || !toNode) return null;
      
      const path = generateConnectionPath(fromNode, toNode, orientation);
      const arrowPosition = getArrowPosition(toNode, orientation);
      
      return {
        id: connection.id,
        path,
        arrowPosition,
        fromNode,
        toNode,
      };
    }).filter(Boolean);
  }, [connections, nodeMap, orientation]);

  function generateConnectionPath(fromNode: TreeNode, toNode: TreeNode, layout: 'horizontal' | 'vertical') {
    const { cardWidth, nodeHeight, connectionOffset } = CONNECTION_CONFIG;
    
    if (layout === 'horizontal') {
      // Optimized horizontal connections with better curve calculation
      const fromX = fromNode.position.x + cardWidth;
      const fromY = fromNode.position.y + (nodeHeight / 2);
      
      const toX = toNode.position.x;
      const toY = toNode.position.y + (nodeHeight / 2);

      // Dynamic control point calculation based on distance
      const distance = Math.abs(toX - fromX);
      const dynamicOffset = Math.min(connectionOffset + (distance * 0.3), 150);
      
      const controlX1 = fromX + dynamicOffset;
      const controlY1 = fromY;
      const controlX2 = toX - dynamicOffset;
      const controlY2 = toY;

      return `M ${fromX} ${fromY} C ${controlX1} ${controlY1} ${controlX2} ${controlY2} ${toX} ${toY}`;
    } else {
      // Optimized vertical connections
      const fromX = fromNode.position.x + (cardWidth / 2);
      const fromY = fromNode.position.y + nodeHeight;
      
      const toX = toNode.position.x + (cardWidth / 2);
      const toY = toNode.position.y;

      const distance = Math.abs(toY - fromY);
      const dynamicOffset = Math.min(connectionOffset + (distance * 0.3), 150);

      const controlX1 = fromX;
      const controlY1 = fromY + dynamicOffset;
      const controlX2 = toX;
      const controlY2 = toY - dynamicOffset;

      return `M ${fromX} ${fromY} C ${controlX1} ${controlY1} ${controlX2} ${controlY2} ${toX} ${toY}`;
    }
  }

  function getArrowPosition(toNode: TreeNode, layout: 'horizontal' | 'vertical') {
    const { cardWidth, nodeHeight, arrowSize } = CONNECTION_CONFIG;
    
    if (layout === 'horizontal') {
      return {
        cx: toNode.position.x - arrowSize,
        cy: toNode.position.y + (nodeHeight / 2),
        r: arrowSize / zoom,
      };
    } else {
      return {
        cx: toNode.position.x + (cardWidth / 2),
        cy: toNode.position.y - arrowSize,
        r: arrowSize / zoom,
      };
    }
  }

  if (!connectionPaths.length) return null;

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
      <defs>
        {/* Enhanced gradient for better visual depth */}
        <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={CONNECTION_CONFIG.colors.main} stopOpacity="0.8" />
          <stop offset="50%" stopColor={CONNECTION_CONFIG.colors.main} stopOpacity="1" />
          <stop offset="100%" stopColor={CONNECTION_CONFIG.colors.hover} stopOpacity="0.9" />
        </linearGradient>
        
        {/* Optimized filter for better performance */}
        <filter id="connectionShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.1"/>
        </filter>
      </defs>
      
      {connectionPaths.map((connectionData) => {
        if (!connectionData) return null;
        
        const { id, path, arrowPosition } = connectionData;
        const strokeWidth = CONNECTION_CONFIG.strokeWidth;
        
        return (
          <g key={id} className="connection-group">
            {/* Optimized shadow with reduced blur for better performance */}
            <path
              d={path}
              stroke={CONNECTION_CONFIG.colors.shadow}
              strokeWidth={strokeWidth.shadow / zoom}
              fill="none"
              strokeLinecap="round"
            />
            
            {/* Main connection line with gradient */}
            <path
              d={path}
              stroke="url(#connectionGradient)"
              strokeWidth={strokeWidth.main / zoom}
              fill="none"
              strokeLinecap="round"
              className="transition-all duration-200 hover:stroke-opacity-80"
              filter="url(#connectionShadow)"
            />
            
            {/* Enhanced arrow with gradient */}
            <circle
              cx={arrowPosition.cx}
              cy={arrowPosition.cy}
              r={arrowPosition.r}
              fill="url(#connectionGradient)"
              className="transition-all duration-200"
              filter="url(#connectionShadow)"
            />
          </g>
        );
      })}
    </svg>
  );
});
