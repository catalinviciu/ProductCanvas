import { type TreeNode, type NodeConnection, type NodeType, type TestCategory } from "@shared/schema";

export function generateNodeId(type: NodeType): string {
  return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateConnectionId(): string {
  return `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createNode(
  id: string,
  type: NodeType,
  position: { x: number; y: number },
  testCategory?: TestCategory,
  parentId?: string
): TreeNode {
  const defaultTitles = {
    outcome: "New Outcome",
    opportunity: "New Opportunity", 
    solution: "New Solution",
    assumption: "New Assumption Test",
  };

  const defaultDescriptions = {
    outcome: "Define the desired business outcome",
    opportunity: "Identify the market opportunity",
    solution: "Design the solution approach", 
    assumption: "Test key assumptions",
  };

  return {
    id,
    type,
    title: defaultTitles[type],
    description: defaultDescriptions[type],
    position,
    parentId,
    testCategory,
    children: [],
  };
}

export function createConnection(fromNodeId: string, toNodeId: string): NodeConnection {
  return {
    id: generateConnectionId(),
    fromNodeId,
    toNodeId,
  };
}

export function calculateNodeLayout(nodes: TreeNode[]): TreeNode[] {
  // Simple auto-layout algorithm - arrange nodes in levels
  const nodeMap = new Map<string, TreeNode>();
  const rootNodes: TreeNode[] = [];
  
  nodes.forEach(node => {
    nodeMap.set(node.id, node);
    if (!node.parentId) {
      rootNodes.push(node);
    }
  });

  const layoutNodes: TreeNode[] = [];
  let currentY = 100;
  const levelHeight = 200;
  const nodeWidth = 300;

  const layoutLevel = (nodeIds: string[], level: number, startX: number = 200) => {
    const levelNodes = nodeIds.map(id => nodeMap.get(id)!).filter(Boolean);
    
    levelNodes.forEach((node, index) => {
      const layoutNode: TreeNode = {
        ...node,
        position: {
          x: startX + (index * nodeWidth),
          y: currentY + (level * levelHeight),
        },
      };
      
      layoutNodes.push(layoutNode);
      
      if (node.children.length > 0) {
        layoutLevel(node.children, level + 1, startX + (index * nodeWidth));
      }
    });
  };

  layoutLevel(rootNodes.map(n => n.id), 0);
  
  return layoutNodes;
}

export function getHomePosition(nodes: TreeNode[]): { zoom: number; pan: { x: number; y: number } } {
  // If no nodes, position at top-left corner
  if (nodes.length === 0) {
    return { zoom: 1, pan: { x: 100, y: 100 } };
  }

  // Find outcome nodes
  const outcomeNodes = nodes.filter(node => node.type === 'outcome');
  
  if (outcomeNodes.length === 0) {
    // No outcome nodes, position at top-left corner
    return { zoom: 1, pan: { x: 100, y: 100 } };
  }

  // Find the outcome node closest to top-left (smallest x + y)
  const topLeftOutcome = outcomeNodes.reduce((closest, current) => {
    const closestDistance = closest.position.x + closest.position.y;
    const currentDistance = current.position.x + current.position.y;
    return currentDistance < closestDistance ? current : closest;
  });

  // Center the view on this outcome node
  const centerX = topLeftOutcome.position.x + 128; // Half of node width
  const centerY = topLeftOutcome.position.y + 100; // Half of node height
  
  return {
    zoom: 1,
    pan: { x: 400 - centerX, y: 300 - centerY } // Center in viewport
  };
}

export function fitNodesToScreen(nodes: TreeNode[], canvasWidth: number, canvasHeight: number) {
  if (nodes.length === 0) return getHomePosition(nodes);

  const padding = 50;
  
  const minX = Math.min(...nodes.map(n => n.position.x));
  const maxX = Math.max(...nodes.map(n => n.position.x + 256)); // Node width
  const minY = Math.min(...nodes.map(n => n.position.y));
  const maxY = Math.max(...nodes.map(n => n.position.y + 120)); // Node height
  
  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;
  
  const scaleX = (canvasWidth - padding * 2) / contentWidth;
  const scaleY = (canvasHeight - padding * 2) / contentHeight;
  const zoom = Math.min(scaleX, scaleY, 1);
  
  const pan = {
    x: (canvasWidth - contentWidth * zoom) / 2 - minX * zoom,
    y: (canvasHeight - contentHeight * zoom) / 2 - minY * zoom,
  };
  
  return { zoom, pan };
}
