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

export function calculateNodeLayout(nodes: TreeNode[], orientation: 'horizontal' | 'vertical' = 'horizontal'): TreeNode[] {
  return orientation === 'horizontal' 
    ? calculateHorizontalLayout(nodes)
    : calculateVerticalLayout(nodes);
}

function calculateHorizontalLayout(nodes: TreeNode[]): TreeNode[] {
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

function calculateVerticalLayout(nodes: TreeNode[]): TreeNode[] {
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
  const levelSpacing = 200; // Vertical spacing between levels
  const siblingSpacing = 320; // Horizontal spacing between siblings

  // Build tree structure to calculate subtree widths for vertical layout
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

    // Layout children vertically downward
    if (node.children.length > 0) {
      const childY = y + levelSpacing;
      let childX = x;

      // Calculate starting position to center children horizontally relative to parent
      const totalChildWidth = node.children.reduce((sum, childId) => 
        sum + getSubtreeWidth(childId) * siblingSpacing, 0) - siblingSpacing;
      childX = x - totalChildWidth / 2;

      // Ensure children don't overlap with existing nodes at this level
      const existingNodesAtLevel = layoutNodes.filter(n => Math.abs(n.position.y - childY) < 50);
      if (existingNodesAtLevel.length > 0) {
        const maxX = Math.max(...existingNodesAtLevel.map(n => n.position.x));
        childX = Math.max(childX, maxX + 350); // Add buffer space
      }

      node.children.forEach(childId => {
        const subtreeWidth = getSubtreeWidth(childId);
        const centerOffset = (subtreeWidth - 1) * siblingSpacing / 2;
        layoutTree(childId, childX + centerOffset, childY, level + 1);
        childX += subtreeWidth * siblingSpacing;
      });
    }
  };

  // Layout each root tree
  let rootX = 300;
  rootNodes.forEach((root, index) => {
    if (index > 0) {
      rootX += getSubtreeWidth(root.id) * siblingSpacing + 400; // Extra spacing between trees
    }
    layoutTree(root.id, rootX, 100, 0);
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
  const padding = 40;
  
  let adjustedPosition = { ...newPosition };
  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    let hasOverlap = false;

    for (const node of nodes) {
      if (node.id === targetNode.id) continue;

      // Use bounding box collision detection
      const targetBounds = getNodeBounds({ ...targetNode, position: adjustedPosition }, padding / 2);
      const nodeBounds = getNodeBounds(node, padding / 2);
      
      if (boundsOverlap(targetBounds, nodeBounds)) {
        hasOverlap = true;
        
        // Calculate direction to move away from the overlapping node
        const centerDistance = {
          x: adjustedPosition.x - node.position.x,
          y: adjustedPosition.y - node.position.y
        };
        
        // Normalize the direction and apply a minimum push distance
        const distance = Math.sqrt(centerDistance.x * centerDistance.x + centerDistance.y * centerDistance.y);
        const pushDistance = 320; // Node width + padding
        
        if (distance > 0) {
          adjustedPosition.x += (centerDistance.x / distance) * pushDistance;
          adjustedPosition.y += (centerDistance.y / distance) * pushDistance;
        } else {
          // If nodes are at exact same position, push in a default direction
          adjustedPosition.x += pushDistance;
          adjustedPosition.y += pushDistance * 0.5;
        }
        break;
      }
    }

    if (!hasOverlap) break;
    attempts++;
  }

  return snapToGrid(adjustedPosition);
}

// Enhanced smart positioning for new nodes using comprehensive collision detection
export function getSmartNodePosition(nodes: TreeNode[], parentNode?: TreeNode, orientation: 'horizontal' | 'vertical' = 'horizontal'): { x: number; y: number } {
  if (!parentNode) {
    // Find a good position for root nodes
    const rootNodes = nodes.filter(n => !n.parentId);
    if (rootNodes.length === 0) {
      return orientation === 'horizontal' ? { x: 200, y: 100 } : { x: 300, y: 100 };
    }
    
    if (orientation === 'horizontal') {
      // Position to the right of existing root nodes
      const rightmostRoot = rootNodes.reduce((max, node) => 
        node.position.x > max.position.x ? node : max, rootNodes[0]);
      
      const initialPosition = { x: rightmostRoot.position.x + 400, y: rightmostRoot.position.y };
      return findOptimalPosition(nodes, initialPosition);
    } else {
      // Position below existing root nodes in vertical layout
      const bottommostRoot = rootNodes.reduce((max, node) => 
        node.position.y > max.position.y ? node : max, rootNodes[0]);
      
      const initialPosition = { x: bottommostRoot.position.x, y: bottommostRoot.position.y + 400 };
      return findOptimalPosition(nodes, initialPosition);
    }
  }

  const siblings = nodes.filter(n => n.parentId === parentNode.id);
  
  if (orientation === 'horizontal') {
    // Position child nodes to the right of parent (horizontal layout)
    const basePosition = {
      x: parentNode.position.x + 350,
      y: parentNode.position.y
    };

    const initialY = basePosition.y + (siblings.length * 200);
    const initialPosition = { x: basePosition.x, y: initialY };
    
    return findOptimalPosition(nodes, initialPosition);
  } else {
    // Position child nodes below parent (vertical layout)
    const basePosition = {
      x: parentNode.position.x,
      y: parentNode.position.y + 200
    };

    const initialX = basePosition.x + (siblings.length * 320);
    const initialPosition = { x: initialX, y: basePosition.y };
    
    return findOptimalPosition(nodes, initialPosition);
  }
}

// Find optimal position using the same collision detection logic as drag operations
export function findOptimalPosition(
  nodes: TreeNode[], 
  preferredPosition: { x: number; y: number },
  margin: number = 50
): { x: number; y: number } {
  // Check if preferred position has collisions with any existing nodes or their subtrees
  const hasCollisionAtPosition = (pos: { x: number; y: number }) => {
    const testBounds = getNodeBounds({ 
      id: 'temp', 
      type: 'outcome', 
      title: '', 
      description: '', 
      position: pos, 
      children: [] 
    }, margin);
    
    return nodes.some(node => {
      const nodeBounds = getNodeBounds(node, margin);
      return boundsOverlap(testBounds, nodeBounds);
    });
  };

  // If preferred position is clear, use it
  if (!hasCollisionAtPosition(preferredPosition)) {
    return snapToGrid(preferredPosition);
  }

  // Use expanding search pattern to find collision-free position
  const searchRadius = 80;
  const step = 40;
  
  for (let radius = step; radius <= searchRadius * 4; radius += step) {
    // Try positions in expanding circles, prioritizing horizontal and vertical directions
    const angles = [
      0,              // Right
      Math.PI/2,      // Down
      Math.PI,        // Left
      3*Math.PI/2,    // Up
      Math.PI/4,      // Down-right
      3*Math.PI/4,    // Down-left
      5*Math.PI/4,    // Up-left
      7*Math.PI/4     // Up-right
    ];
    
    for (const angle of angles) {
      const testPos = {
        x: preferredPosition.x + Math.cos(angle) * radius,
        y: preferredPosition.y + Math.sin(angle) * radius
      };
      
      if (!hasCollisionAtPosition(testPos)) {
        return snapToGrid(testPos);
      }
    }
  }
  
  // If still no position found, use fallback positioning
  const fallbackPos = {
    x: preferredPosition.x + 400,
    y: preferredPosition.y + 200
  };
  
  return snapToGrid(hasCollisionAtPosition(fallbackPos) ? 
    { x: preferredPosition.x, y: preferredPosition.y + 400 } : 
    fallbackPos
  );
}

// Get all descendants of a node recursively
export function getAllDescendants(nodes: TreeNode[], parentId: string): string[] {
  const nodeMap = new Map<string, TreeNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));
  
  const getDescendantsRecursive = (nodeId: string): string[] => {
    const parent = nodeMap.get(nodeId);
    if (!parent) return [];
    
    let descendants: string[] = [];
    parent.children.forEach(childId => {
      descendants.push(childId);
      descendants = descendants.concat(getDescendantsRecursive(childId));
    });
    return descendants;
  };
  
  return getDescendantsRecursive(parentId);
}

// Get bounding box of a node including margin
export function getNodeBounds(node: TreeNode, margin: number = 20): { x: number; y: number; width: number; height: number } {
  return {
    x: node.position.x - margin,
    y: node.position.y - margin,
    width: 256 + (margin * 2), // Standard node width is 256px
    height: 160 + (margin * 2)  // Standard node height is 160px
  };
}

// Check if two bounding boxes overlap
export function boundsOverlap(bounds1: { x: number; y: number; width: number; height: number }, bounds2: { x: number; y: number; width: number; height: number }): boolean {
  return !(bounds1.x + bounds1.width <= bounds2.x || 
           bounds2.x + bounds2.width <= bounds1.x || 
           bounds1.y + bounds1.height <= bounds2.y || 
           bounds2.y + bounds2.height <= bounds1.y);
}

// Find a collision-free position for moving a subtree
export function findCollisionFreePosition(
  nodes: TreeNode[],
  movingNodeId: string,
  targetPosition: { x: number; y: number }
): { x: number; y: number } {
  const nodeMap = new Map<string, TreeNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));
  
  const movingNode = nodeMap.get(movingNodeId);
  if (!movingNode) return targetPosition;

  // Get all nodes in the moving subtree
  const descendantIds = getAllDescendants(nodes, movingNodeId);
  const subtreeIds = new Set([movingNodeId, ...descendantIds]);
  
  // Calculate the subtree bounds when moved to target position
  const deltaX = targetPosition.x - movingNode.position.x;
  const deltaY = targetPosition.y - movingNode.position.y;
  
  const getSubtreeBounds = (pos: { x: number; y: number }) => {
    const adjustedDeltaX = pos.x - movingNode.position.x;
    const adjustedDeltaY = pos.y - movingNode.position.y;
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
      if (subtreeIds.has(node.id)) {
        const newPos = {
          x: node.position.x + adjustedDeltaX,
          y: node.position.y + adjustedDeltaY
        };
        const bounds = getNodeBounds({ ...node, position: newPos }, 30);
        minX = Math.min(minX, bounds.x);
        minY = Math.min(minY, bounds.y);
        maxX = Math.max(maxX, bounds.x + bounds.width);
        maxY = Math.max(maxY, bounds.y + bounds.height);
      }
    });
    
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  };
  
  // Get all other nodes (not in the moving subtree)
  const otherNodes = nodes.filter(node => !subtreeIds.has(node.id));
  
  // Check if position causes collisions
  const hasCollision = (pos: { x: number; y: number }) => {
    const subtreeBounds = getSubtreeBounds(pos);
    
    return otherNodes.some(otherNode => {
      const otherBounds = getNodeBounds(otherNode, 30);
      return boundsOverlap(subtreeBounds, otherBounds);
    });
  };
  
  // If no collision at target position, use it
  if (!hasCollision(targetPosition)) {
    return snapToGrid(targetPosition);
  }
  
  // Find collision-free position by trying different offsets
  const searchRadius = 100;
  const step = 40;
  
  for (let radius = step; radius <= searchRadius * 3; radius += step) {
    // Try positions in expanding circles
    const angles = [0, Math.PI/2, Math.PI, 3*Math.PI/2, Math.PI/4, 3*Math.PI/4, 5*Math.PI/4, 7*Math.PI/4];
    
    for (const angle of angles) {
      const testPos = {
        x: targetPosition.x + Math.cos(angle) * radius,
        y: targetPosition.y + Math.sin(angle) * radius
      };
      
      if (!hasCollision(testPos)) {
        return snapToGrid(testPos);
      }
    }
  }
  
  // If still no position found, try moving further away
  const fallbackPos = {
    x: targetPosition.x + 400,
    y: targetPosition.y
  };
  
  return snapToGrid(hasCollision(fallbackPos) ? { x: targetPosition.x, y: targetPosition.y + 400 } : fallbackPos);
}

// Handle branch-level drag operations with comprehensive collision detection
export function handleBranchDrag(
  nodes: TreeNode[],
  nodeId: string,
  newPosition: { x: number; y: number },
  orientation: 'horizontal' | 'vertical' = 'horizontal'
): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));
  
  const draggedNode = nodeMap.get(nodeId);
  if (!draggedNode) return nodes;

  // Check if this is a branch (has children) or single node
  if (draggedNode.children && draggedNode.children.length > 0) {
    // This is a branch - use comprehensive collision detection
    return moveNodeWithChildren(nodes, nodeId, newPosition, orientation);
  } else {
    // Single node - use simple collision detection
    const adjustedPosition = preventOverlap(nodes, draggedNode, newPosition);
    const snappedPosition = snapToGrid(adjustedPosition);
    
    return nodes.map(node => 
      node.id === nodeId ? { ...node, position: snappedPosition } : node
    );
  }
}

// Move parent and reorganize all children in a clean layout
export function moveNodeWithChildren(
  nodes: TreeNode[], 
  nodeId: string, 
  newPosition: { x: number; y: number },
  orientation: 'horizontal' | 'vertical' = 'horizontal'
): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));
  
  const movedNode = nodeMap.get(nodeId);
  if (!movedNode) return nodes;

  // Find collision-free position
  const collisionFreePosition = findCollisionFreePosition(nodes, nodeId, newPosition);
  
  // Calculate position delta from collision-free position
  const deltaX = collisionFreePosition.x - movedNode.position.x;
  const deltaY = collisionFreePosition.y - movedNode.position.y;

  // Get all descendants
  const descendantIds = getAllDescendants(nodes, nodeId);
  
  // Update positions maintaining relative layout but preventing collisions
  const updatedNodes = nodes.map(node => {
    if (node.id === nodeId) {
      // Move the parent to the collision-free position
      return {
        ...node,
        position: collisionFreePosition
      };
    } else if (descendantIds.includes(node.id)) {
      // Move children maintaining their relative positions
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
  return reorganizeSubtree(updatedNodes, nodeId, orientation);
}

// Calculate the height needed for a subtree
function calculateSubtreeHeight(nodes: TreeNode[], nodeId: string): number {
  const nodeMap = new Map<string, TreeNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));
  
  const calculateHeight = (id: string): number => {
    const node = nodeMap.get(id);
    if (!node || node.children.length === 0) return 160; // Single node height
    
    // Calculate total height of all children
    let totalChildHeight = 0;
    node.children.forEach(childId => {
      totalChildHeight += calculateHeight(childId);
    });
    
    // Add spacing between children
    const spacing = Math.max(0, (node.children.length - 1) * 40);
    return Math.max(160, totalChildHeight + spacing);
  };
  
  return calculateHeight(nodeId);
}

// Reorganize a subtree to maintain clean hierarchical layout with collision avoidance
export function reorganizeSubtree(nodes: TreeNode[], rootNodeId: string, orientation: 'horizontal' | 'vertical' = 'horizontal'): TreeNode[] {
  if (orientation === 'horizontal') {
    return reorganizeSubtreeHorizontal(nodes, rootNodeId);
  } else {
    return reorganizeSubtreeVertical(nodes, rootNodeId);
  }
}

function reorganizeSubtreeHorizontal(nodes: TreeNode[], rootNodeId: string): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));
  
  const rootNode = nodeMap.get(rootNodeId);
  if (!rootNode) return nodes;

  const updatedNodes = [...nodes];
  const levelSpacing = 350; // Horizontal spacing between levels
  const minSiblingSpacing = 200; // Minimum vertical spacing between siblings
  const subtreeIds = new Set([rootNodeId, ...getAllDescendants(nodes, rootNodeId)]);
  
  const otherNodes = nodes.filter(node => !subtreeIds.has(node.id));
  const positionedSubtreeNodes = new Map<string, { x: number; y: number }>();

  const hasCollisionWithOthers = (pos: { x: number; y: number }, margin: number = 30) => {
    const testBounds = getNodeBounds({ id: 'temp', type: 'outcome', title: '', description: '', position: pos, children: [] }, margin);
    return otherNodes.some(otherNode => {
      const otherBounds = getNodeBounds(otherNode, margin);
      return boundsOverlap(testBounds, otherBounds);
    });
  };

  const hasCollisionWithSubtree = (pos: { x: number; y: number }, excludeId: string, margin: number = 30) => {
    const testBounds = getNodeBounds({ id: 'temp', type: 'outcome', title: '', description: '', position: pos, children: [] }, margin);
    
    const entries = Array.from(positionedSubtreeNodes.entries());
    for (let i = 0; i < entries.length; i++) {
      const [nodeId, nodePos] = entries[i];
      if (nodeId === excludeId) continue;
      const nodeBounds = getNodeBounds({ id: nodeId, type: 'outcome', title: '', description: '', position: nodePos, children: [] }, margin);
      if (boundsOverlap(testBounds, nodeBounds)) {
        return true;
      }
    }
    return false;
  };

  const layoutSubtree = (nodeId: string, x: number, y: number, level: number): number => {
    const node = nodeMap.get(nodeId);
    if (!node) return y;

    let nodeY = y;
    let attempts = 0;
    while ((hasCollisionWithOthers({ x, y: nodeY }) || hasCollisionWithSubtree({ x, y: nodeY }, nodeId)) && attempts < 20) {
      nodeY += minSiblingSpacing;
      attempts++;
    }

    const finalPosition = snapToGrid({ x, y: nodeY });
    positionedSubtreeNodes.set(nodeId, finalPosition);
    
    const nodeIndex = updatedNodes.findIndex(n => n.id === nodeId);
    if (nodeIndex !== -1) {
      updatedNodes[nodeIndex] = {
        ...updatedNodes[nodeIndex],
        position: finalPosition
      };
      nodeMap.set(nodeId, updatedNodes[nodeIndex]);
    }

    // Layout children horizontally to the right
    if (node.children.length > 0) {
      const childX = x + levelSpacing;
      let currentChildY = nodeY;
      
      const childHeights = node.children.map(childId => calculateSubtreeHeight(updatedNodes, childId));
      const totalRequiredHeight = childHeights.reduce((sum, height) => sum + height, 0);
      const totalSpacing = Math.max(0, (node.children.length - 1) * minSiblingSpacing);
      
      currentChildY = nodeY - (totalRequiredHeight + totalSpacing) / 2;
      
      node.children.forEach((childId, index) => {
        const childHeight = childHeights[index];
        const centerOffset = (childHeight - 1) * minSiblingSpacing / 2;
        layoutSubtree(childId, childX, currentChildY + centerOffset, level + 1);
        currentChildY += childHeight * minSiblingSpacing;
      });
    }

    return nodeY;
  };

  layoutSubtree(rootNodeId, rootNode.position.x, rootNode.position.y, 0);
  return updatedNodes;
}

function reorganizeSubtreeVertical(nodes: TreeNode[], rootNodeId: string): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));
  
  const rootNode = nodeMap.get(rootNodeId);
  if (!rootNode) return nodes;

  const updatedNodes = [...nodes];
  const levelSpacing = 200; // Vertical spacing between levels
  const minSiblingSpacing = 320; // Minimum horizontal spacing between siblings
  const subtreeIds = new Set([rootNodeId, ...getAllDescendants(nodes, rootNodeId)]);
  
  const otherNodes = nodes.filter(node => !subtreeIds.has(node.id));
  const positionedSubtreeNodes = new Map<string, { x: number; y: number }>();

  const hasCollisionWithOthers = (pos: { x: number; y: number }, margin: number = 30) => {
    const testBounds = getNodeBounds({ id: 'temp', type: 'outcome', title: '', description: '', position: pos, children: [] }, margin);
    return otherNodes.some(otherNode => {
      const otherBounds = getNodeBounds(otherNode, margin);
      return boundsOverlap(testBounds, otherBounds);
    });
  };

  const hasCollisionWithSubtree = (pos: { x: number; y: number }, excludeId: string, margin: number = 30) => {
    const testBounds = getNodeBounds({ id: 'temp', type: 'outcome', title: '', description: '', position: pos, children: [] }, margin);
    
    const entries = Array.from(positionedSubtreeNodes.entries());
    for (let i = 0; i < entries.length; i++) {
      const [nodeId, nodePos] = entries[i];
      if (nodeId === excludeId) continue;
      const nodeBounds = getNodeBounds({ id: nodeId, type: 'outcome', title: '', description: '', position: nodePos, children: [] }, margin);
      if (boundsOverlap(testBounds, nodeBounds)) {
        return true;
      }
    }
    return false;
  };

  const layoutSubtree = (nodeId: string, x: number, y: number, level: number): number => {
    const node = nodeMap.get(nodeId);
    if (!node) return x;

    let nodeX = x;
    let attempts = 0;
    while ((hasCollisionWithOthers({ x: nodeX, y }) || hasCollisionWithSubtree({ x: nodeX, y }, nodeId)) && attempts < 20) {
      nodeX += minSiblingSpacing;
      attempts++;
    }

    const finalPosition = snapToGrid({ x: nodeX, y });
    positionedSubtreeNodes.set(nodeId, finalPosition);
    
    const nodeIndex = updatedNodes.findIndex(n => n.id === nodeId);
    if (nodeIndex !== -1) {
      updatedNodes[nodeIndex] = {
        ...updatedNodes[nodeIndex],
        position: finalPosition
      };
      nodeMap.set(nodeId, updatedNodes[nodeIndex]);
    }

    // Layout children vertically below
    if (node.children.length > 0) {
      const childY = y + levelSpacing;
      let currentChildX = nodeX;
      
      // Calculate total width needed for all children
      const totalChildWidth = node.children.length * minSiblingSpacing;
      currentChildX = nodeX - totalChildWidth / 2;
      
      node.children.forEach((childId) => {
        const childFinalX = layoutSubtree(childId, currentChildX, childY, level + 1);
        currentChildX = Math.max(currentChildX, childFinalX + minSiblingSpacing);
      });
    }

    return nodeX;
  };

  layoutSubtree(rootNodeId, rootNode.position.x, rootNode.position.y, 0);
  return updatedNodes;
}

export function getHomePosition(nodes: TreeNode[], currentOrientation: 'horizontal' | 'vertical' = 'horizontal'): { zoom: number; pan: { x: number; y: number }; orientation: 'horizontal' | 'vertical' } {
  // If no nodes, position at top-left corner
  if (nodes.length === 0) {
    return { zoom: 1, pan: { x: 100, y: 100 }, orientation: currentOrientation };
  }

  // Find outcome nodes
  const outcomeNodes = nodes.filter(node => node.type === 'outcome');
  
  if (outcomeNodes.length === 0) {
    // No outcome nodes, position at top-left corner
    return { zoom: 1, pan: { x: 100, y: 100 }, orientation: currentOrientation };
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
    pan: { x: 400 - centerX, y: 300 - centerY }, // Center in viewport
    orientation: currentOrientation
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
