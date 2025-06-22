import { useMemo, memo } from 'react';
import { type TreeNode, type NodeConnection } from "@shared/schema";

interface NodeConnectionsProps {
  connections: NodeConnection[];
  nodes: TreeNode[];
  zoom: number;
  orientation?: 'horizontal' | 'vertical';
}

// Enhanced connection configuration with modern design
const CONNECTION_CONFIG = {
  cardWidth: 300,
  nodeHeight: 144,
  cardHeight: 144, // Fixed card height - no extension for children
  connectionOffset: 40,
  strokeWidth: {
    shadow: 3,
    main: 2,
    hover: 3,
  },
  colors: {
    main: '#6366F1',
    hover: '#4F46E5',
    shadow: 'rgba(99, 102, 241, 0.35)',
    gradient: {
      start: '#6366F1',
      middle: '#8B5CF6',
      end: '#A855F7',
    },
  },
  arrowSize: 5,
  animation: {
    duration: '0.3s',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

const NodeConnectionsComponent = memo(function NodeConnections({ connections, nodes, zoom, orientation = 'horizontal' }: NodeConnectionsProps) {
  // Memoize node lookup map for better performance
  const nodeMap = useMemo(() => {
    const map = new Map<string, TreeNode>();
    nodes.forEach(node => map.set(node.id, node));
    return map;
  }, [nodes]);

  // Memoize connection path generation functions
  const generateConnectionPath = useMemo(() => {
    return (fromNode: TreeNode, toNode: TreeNode, layout: 'horizontal' | 'vertical') => {
      const { cardWidth, cardHeight, connectionOffset } = CONNECTION_CONFIG;
      
      if (layout === 'horizontal') {
        // Connect from right edge of parent card to left edge of child card
        const fromX = fromNode.position.x + cardWidth;
        const fromY = fromNode.position.y + (cardHeight / 2);
        
        const toX = toNode.position.x;
        const toY = toNode.position.y + (cardHeight / 2);

        // Enhanced control point calculation for smoother curves
        const distance = Math.abs(toX - fromX);
        const dynamicOffset = Math.min(connectionOffset + (distance * 0.4), 180);
        
        const controlX1 = fromX + dynamicOffset;
        const controlY1 = fromY;
        const controlX2 = toX - dynamicOffset;
        const controlY2 = toY;

        return `M ${fromX} ${fromY} C ${controlX1} ${controlY1} ${controlX2} ${controlY2} ${toX} ${toY}`;
      } else {
        // Connect from bottom edge of parent card to top edge of child card
        const fromX = fromNode.position.x + (cardWidth / 2);
        const fromY = fromNode.position.y + cardHeight;
        
        const toX = toNode.position.x + (cardWidth / 2);
        const toY = toNode.position.y;

        // Enhanced control point calculation for vertical connections
        const distance = Math.abs(toY - fromY);
        const dynamicOffset = Math.min(connectionOffset + (distance * 0.3), 120);

        const controlX1 = fromX;
        const controlY1 = fromY + dynamicOffset;
        const controlX2 = toX;
        const controlY2 = toY - dynamicOffset;

        return `M ${fromX} ${fromY} C ${controlX1} ${controlY1} ${controlX2} ${controlY2} ${toX} ${toY}`;
      }
    };
  }, []);

  const getArrowPosition = useMemo(() => {
    return (toNode: TreeNode, layout: 'horizontal' | 'vertical') => {
      const { cardWidth, cardHeight, arrowSize } = CONNECTION_CONFIG;
      
      if (layout === 'horizontal') {
        // Position arrow at the left edge of the target card
        return {
          cx: toNode.position.x - arrowSize * 1.5,
          cy: toNode.position.y + (cardHeight / 2),
          r: arrowSize / zoom,
        };
      } else {
        // Position arrow at the top edge of the target card
        return {
          cx: toNode.position.x + (cardWidth / 2),
          cy: toNode.position.y - arrowSize * 1.5,
          r: arrowSize / zoom,
        };
      }
    };
  }, [zoom]);

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
  }, [connections, nodeMap, orientation, generateConnectionPath, getArrowPosition]);

  // Enhanced SVG definitions with modern gradients and effects
  const svgDefs = useMemo(() => (
    <defs>
      {/* Enhanced gradient with smooth color transitions */}
      <linearGradient id="modernConnectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={CONNECTION_CONFIG.colors.gradient.start} stopOpacity="0.9" />
        <stop offset="50%" stopColor={CONNECTION_CONFIG.colors.gradient.middle} stopOpacity="1" />
        <stop offset="100%" stopColor={CONNECTION_CONFIG.colors.gradient.end} stopOpacity="0.8" />
      </linearGradient>
      
      {/* Hover gradient with brighter colors */}
      <linearGradient id="connectionHoverGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#4F46E5" stopOpacity="1" />
        <stop offset="50%" stopColor="#7C3AED" stopOpacity="1" />
        <stop offset="100%" stopColor="#9333EA" stopOpacity="1" />
      </linearGradient>
      
      {/* Enhanced shadow with glow effect */}
      <filter id="modernConnectionShadow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
        <feOffset dx="0" dy="2" result="offset"/>
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.3"/>
        </feComponentTransfer>
        <feMerge> 
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/> 
        </feMerge>
      </filter>
      
      {/* Glow effect for connections */}
      <filter id="connectionGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      
      {/* Arrow marker definition */}
      <marker id="arrowhead" markerWidth="10" markerHeight="7" 
              refX="10" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" 
                 fill="url(#modernConnectionGradient)" />
      </marker>
    </defs>
  ), []);

  // Enhanced connection renderings with modern design and animations
  const connectionElements = useMemo(() => {
    return connectionPaths.map((connectionData) => {
      if (!connectionData) return null;
      
      const { id, path, arrowPosition } = connectionData;
      const strokeWidth = CONNECTION_CONFIG.strokeWidth;
      
      return (
        <g key={id} className="modern-connection-group">
          {/* Subtle glow backdrop */}
          <path
            d={path}
            stroke="url(#modernConnectionGradient)"
            strokeWidth={Math.max((strokeWidth.shadow + 2) / zoom, 2)}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.3"
            filter="url(#connectionGlow)"
            className="connection-glow"
          />
          
          {/* Fallback solid color line for better visibility */}
          <path
            d={path}
            stroke={CONNECTION_CONFIG.colors.main}
            strokeWidth={Math.max(strokeWidth.main / zoom, 0.5)}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
            className="connection-fallback"
          />
          
          {/* Shadow path for depth */}
          <path
            d={path}
            stroke={CONNECTION_CONFIG.colors.shadow}
            strokeWidth={Math.max(strokeWidth.shadow / zoom, 1.5)}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#modernConnectionShadow)"
            className="connection-shadow"
          />
          
          {/* Main connection line with enhanced gradient */}
          <path
            d={path}
            stroke="url(#modernConnectionGradient)"
            strokeWidth={Math.max(strokeWidth.main / zoom, 0.7)}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="connection-main"
            opacity="1"
            style={{
              transition: `all ${CONNECTION_CONFIG.animation.duration} ${CONNECTION_CONFIG.animation.easing}`
            }}
          />
          
          {/* Enhanced arrow indicator */}
          <g className="connection-arrow">
            {/* Arrow shadow */}
            <circle
              cx={arrowPosition.cx + 1}
              cy={arrowPosition.cy + 1}
              r={arrowPosition.r + 1}
              fill="rgba(0,0,0,0.1)"
              className="arrow-shadow"
            />
            {/* Main arrow */}
            <circle
              cx={arrowPosition.cx}
              cy={arrowPosition.cy}
              r={Math.max(arrowPosition.r, 3)}
              fill="url(#modernConnectionGradient)"
              className="arrow-main"
              style={{
                transition: `all ${CONNECTION_CONFIG.animation.duration} ${CONNECTION_CONFIG.animation.easing}`
              }}
            />
            {/* Arrow highlight */}
            <circle
              cx={arrowPosition.cx - arrowPosition.r * 0.3}
              cy={arrowPosition.cy - arrowPosition.r * 0.3}
              r={arrowPosition.r * 0.4}
              fill="rgba(255,255,255,0.4)"
              className="arrow-highlight"
            />
          </g>
        </g>
      );
    });
  }, [connectionPaths, zoom]);

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
      {svgDefs}
      {connectionElements}
    </svg>
  );
});

// Export the memoized component
export { NodeConnectionsComponent as NodeConnections };