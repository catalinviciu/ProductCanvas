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
    isCollapsed: false,
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
  const levelSpacing = 350; // Horizontal spacing between levels
  const siblingSpacing = 180; // Vertical spacing between siblings

  // Build tree structure to calculate subtree heights for horizontal layout
  const getSubtreeHeight = (nodeId: string): number => {
    const node = nodeMap.get(nodeId);
    if (!node || node.children.length === 0) return 1;
    
    const childHeights = node.children.map(childId => getSubtreeHeight(childId));
    return Math.max(1, childHeights.reduce((sum, height) => sum + height, 0));
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

    // Layout children horizontally to the right
    if (node.children.length > 0) {
      const childX = x + levelSpacing;
      let childY = y;

      // Calculate starting position to center children vertically relative to parent
      const totalChildHeight = node.children.reduce((sum, childId) => 
        sum + getSubtreeHeight(childId) * siblingSpacing, 0) - siblingSpacing;
      childY = y - totalChildHeight / 2;

      // Ensure children don't overlap with existing nodes at this level
      const existingNodesAtLevel = layoutNodes.filter(n => Math.abs(n.position.x - childX) < 50);
      if (existingNodesAtLevel.length > 0) {
        const maxY = Math.max(...existingNodesAtLevel.map(n => n.position.y));
        childY = Math.max(childY, maxY + 200); // Add buffer space
      }

      node.children.forEach(childId => {
        const subtreeHeight = getSubtreeHeight(childId);
        const centerOffset = (subtreeHeight - 1) * siblingSpacing / 2;
        layoutTree(childId, childX, childY + centerOffset, level + 1);
        childY += subtreeHeight * siblingSpacing;
      });
    }
  };

  // Layout each root tree
  let rootY = 200;
  rootNodes.forEach((root, index) => {
    if (index > 0) {
      rootY += getSubtreeHeight(root.id) * siblingSpacing + 300; // Extra spacing between trees
    }
    layoutTree(root.id, 100, rootY, 0);
  });

  return layoutNodes;
}

// Get visible nodes (excluding collapsed subtrees)
export function getVisibleNodes(nodes: TreeNode[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));
  
  const visibleNodes: TreeNode[] = [];
  const visitedNodes = new Set<string>();
  
  // Start with root nodes
  const rootNodes = nodes.filter(n => !n.parentId);
  
  const traverseVisible = (nodeId: string) => {
    if (visitedNodes.has(nodeId)) return;
    visitedNodes.add(nodeId);
    
    const node = nodeMap.get(nodeId);
    if (!node) return;
    
    visibleNodes.push(node);
    
    // Only traverse children if node is not collapsed
    if (!node.isCollapsed && node.children.length > 0) {
      node.children.forEach(childId => traverseVisible(childId));
    }
  };
  
  rootNodes.forEach(root => traverseVisible(root.id));
  return visibleNodes;
}

// Get visible connections (only between visible nodes)
export function getVisibleConnections(nodes: TreeNode[], connections: NodeConnection[]): NodeConnection[] {
  const visibleNodes = getVisibleNodes(nodes);
  const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
  
  return connections.filter(conn => 
    visibleNodeIds.has(conn.fromNodeId) && visibleNodeIds.has(conn.toNodeId)
  );
}

// Toggle collapse state of a node
export function toggleNodeCollapse(nodes: TreeNode[], nodeId: string): TreeNode[] {
  return nodes.map(node => 
    node.id === nodeId 
      ? { ...node, isCollapsed: !node.isCollapsed }
      : node
  );
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

  // Position child nodes to the right of parent (horizontal layout)
  const siblings = nodes.filter(n => n.parentId === parentNode.id);
  const basePosition = {
    x: parentNode.position.x + 350,
    y: parentNode.position.y
  };

  // Find all nodes at the same horizontal level (within 50px of target X)
  const levelNodes = nodes.filter(n => Math.abs(n.position.x - basePosition.x) < 50);
  
  // Start with parent's Y position, then adjust for siblings
  let targetY = basePosition.y + (siblings.length * 180);
  
  // Check for conflicts and adjust position
  while (levelNodes.some(node => Math.abs(node.position.y - targetY) < 160)) {
    targetY += 180; // Move down by one spacing unit
  }
  
  // Additional safety check - ensure minimum distance from all existing nodes
  const minDistance = 160;
  for (const node of levelNodes) {
    if (Math.abs(node.position.y - targetY) < minDistance) {
      if (targetY <= node.position.y) {
        targetY = node.position.y - minDistance;
      } else {
        targetY = node.position.y + minDistance;
      }
    }
  }

  const targetPosition = {
    x: basePosition.x,
    y: targetY
  };

  return preventOverlap(nodes, { id: 'temp', type: 'outcome', title: '', description: '', position: { x: 0, y: 0 }, children: [] }, targetPosition);
}

// Move parent and reorganize all children in a clean layout
export function moveNodeWithChildren(
  nodes: TreeNode[], 
  nodeId: string, 
  newPosition: { x: number; y: number }
): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));
  
  const movedNode = nodeMap.get(nodeId);
  if (!movedNode) return nodes;

  // Calculate position delta
  const deltaX = newPosition.x - movedNode.position.x;
  const deltaY = newPosition.y - movedNode.position.y;

  // Recursively get all descendants
  const getAllDescendants = (parentId: string): string[] => {
    const parent = nodeMap.get(parentId);
    if (!parent) return [];
    
    let descendants: string[] = [];
    parent.children.forEach(childId => {
      descendants.push(childId);
      descendants = descendants.concat(getAllDescendants(childId));
    });
    return descendants;
  };

  const descendantIds = getAllDescendants(nodeId);
  
  // Update positions maintaining relative layout but with proper organization
  const updatedNodes = nodes.map(node => {
    if (node.id === nodeId) {
      // Move the parent to the new position
      return {
        ...node,
        position: snapToGrid(newPosition)
      };
    } else if (descendantIds.includes(node.id)) {
      // Move children maintaining their relative positions but reorganized
      const newChildPosition = {
        x: node.position.x + deltaX,
        y: node.position.y + deltaY
      };
      return {
        ...node,
        position: snapToGrid(newChildPosition)
      };
    }
    return node;
  });

  // Apply smart reorganization to the moved subtree
  return reorganizeSubtree(updatedNodes, nodeId);
}

// Reorganize a subtree to maintain clean hierarchical layout (horizontal)
export function reorganizeSubtree(nodes: TreeNode[], rootNodeId: string): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));
  
  const rootNode = nodeMap.get(rootNodeId);
  if (!rootNode) return nodes;

  const updatedNodes = [...nodes];
  const levelSpacing = 350; // Horizontal spacing between levels
  const siblingSpacing = 180; // Vertical spacing between siblings

  const layoutSubtree = (nodeId: string, x: number, y: number, level: number) => {
    const node = nodeMap.get(nodeId);
    if (!node) return;

    // Update node position
    const nodeIndex = updatedNodes.findIndex(n => n.id === nodeId);
    if (nodeIndex !== -1) {
      updatedNodes[nodeIndex] = {
        ...updatedNodes[nodeIndex],
        position: snapToGrid({ x, y })
      };
    }

    // Layout children horizontally to the right
    if (node.children.length > 0) {
      const childX = x + levelSpacing;
      let childY = y;

      // Center children vertically relative to parent
      const totalChildHeight = (node.children.length - 1) * siblingSpacing;
      childY = y - totalChildHeight / 2;

      node.children.forEach((childId, index) => {
        layoutSubtree(childId, childX, childY + (index * siblingSpacing), level + 1);
      });
    }
  };

  layoutSubtree(rootNodeId, rootNode.position.x, rootNode.position.y, 0);
  return updatedNodes;
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
