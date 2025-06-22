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
    kpi: "New KPI",
  };

  const defaultDescriptions = {
    outcome: "Define the desired business outcome",
    opportunity: "Identify the market opportunity",
    solution: "Design the solution approach", 
    assumption: "Test key assumptions",
    kpi: "Track key performance indicator",
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
  const nodeMap = new Map<string, TreeNode>();
  const rootNodes: TreeNode[] = [];
  
  nodes.forEach(node => {
    nodeMap.set(node.id, node);
    if (!node.parentId) {
      rootNodes.push(node);
    }
  });

  const layoutNodes: TreeNode[] = [];
  const nodeWidth = 280; // Card width + margin
  const nodeHeight = 160; // Card height + margin
  const levelSpacing = 200;
  const siblingSpacing = 320;

  // Build tree structure to calculate subtree widths
  const getSubtreeWidth = (nodeId: string): number => {
    const node = nodeMap.get(nodeId);
    if (!node || node.children.length === 0) return 1;
    
    const childWidths = node.children.map(childId => getSubtreeWidth(childId));
    return Math.max(1, childWidths.reduce((sum, width) => sum + width, 0));
  };

  const layoutTree = (nodeId: string, x: number, y: number, level: number) => {
    const node = nodeMap.get(nodeId);
    if (!node) return;

    // Position current node
    const layoutNode: TreeNode = {
      ...node,
      position: { x, y }
    };
    layoutNodes.push(layoutNode);

    // Layout children
    if (node.children.length > 0) {
      const childY = y + levelSpacing;
      let childX = x;

      // Calculate starting position to center children under parent
      const totalChildWidth = node.children.reduce((sum, childId) => 
        sum + getSubtreeWidth(childId) * siblingSpacing, 0) - siblingSpacing;
      childX = x - totalChildWidth / 2;

      node.children.forEach(childId => {
        const subtreeWidth = getSubtreeWidth(childId);
        const centerOffset = (subtreeWidth - 1) * siblingSpacing / 2;
        layoutTree(childId, childX + centerOffset, childY, level + 1);
        childX += subtreeWidth * siblingSpacing;
      });
    }
  };

  // Layout each root tree
  let rootX = 200;
  rootNodes.forEach((root, index) => {
    if (index > 0) {
      rootX += getSubtreeWidth(root.id) * siblingSpacing + 400; // Extra spacing between trees
    }
    layoutTree(root.id, rootX, 100, 0);
  });

  return layoutNodes;
}

// Snap position to grid for clean alignment
export function snapToGrid(position: { x: number; y: number }, gridSize: number = 20): { x: number; y: number } {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize
  };
}

// Check for overlapping nodes and adjust positions
export function preventOverlap(nodes: TreeNode[], targetNode: TreeNode, newPosition: { x: number; y: number }): { x: number; y: number } {
  const nodeWidth = 264; // Card width
  const nodeHeight = 120; // Card height
  const padding = 20;

  let adjustedPosition = { ...newPosition };
  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    let hasOverlap = false;

    for (const node of nodes) {
      if (node.id === targetNode.id) continue;

      const distance = {
        x: Math.abs(adjustedPosition.x - node.position.x),
        y: Math.abs(adjustedPosition.y - node.position.y)
      };

      if (distance.x < nodeWidth + padding && distance.y < nodeHeight + padding) {
        hasOverlap = true;
        
        // Push away from overlapping node
        const pushDirection = {
          x: adjustedPosition.x > node.position.x ? 1 : -1,
          y: adjustedPosition.y > node.position.y ? 1 : -1
        };

        adjustedPosition.x += pushDirection.x * (nodeWidth + padding - distance.x + 10);
        adjustedPosition.y += pushDirection.y * (nodeHeight + padding - distance.y + 10);
        break;
      }
    }

    if (!hasOverlap) break;
    attempts++;
  }

  return snapToGrid(adjustedPosition);
}

// Smart positioning for new nodes
export function getSmartNodePosition(nodes: TreeNode[], parentNode?: TreeNode): { x: number; y: number } {
  if (!parentNode) {
    // Find a good position for root nodes
    const rootNodes = nodes.filter(n => !n.parentId);
    if (rootNodes.length === 0) {
      return { x: 200, y: 100 };
    }
    
    // Position to the right of existing root nodes
    const rightmostRoot = rootNodes.reduce((max, node) => 
      node.position.x > max.position.x ? node : max, rootNodes[0]);
    
    return preventOverlap(nodes, { id: 'temp', type: 'outcome', title: '', description: '', position: { x: 0, y: 0 }, children: [] }, 
      { x: rightmostRoot.position.x + 400, y: rightmostRoot.position.y });
  }

  // Position child nodes below and to the right of parent
  const siblings = nodes.filter(n => n.parentId === parentNode.id);
  const basePosition = {
    x: parentNode.position.x + 300,
    y: parentNode.position.y + 180
  };

  // Offset for siblings
  const siblingOffset = siblings.length * 200;
  const targetPosition = {
    x: basePosition.x + siblingOffset,
    y: basePosition.y
  };

  return preventOverlap(nodes, { id: 'temp', type: 'outcome', title: '', description: '', position: { x: 0, y: 0 }, children: [] }, targetPosition);
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
