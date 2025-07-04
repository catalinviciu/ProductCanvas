import { type TreeNode, type NodeConnection, type NodeType, type TestCategory } from "@shared/schema";
import { NODE_DIMENSIONS, CANVAS_CONSTANTS } from "@/lib/node-constants";

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
    objective: "New Objective",
    outcome: "New Outcome",
    opportunity: "New Opportunity", 
    solution: "New Solution",
    assumption: "New Assumption Test",
    metric: "New Metric",
    research: "New Research",
  };

  const defaultDescriptions = {
    objective: "Define strategic objective",
    outcome: "Define the desired business outcome",
    opportunity: "Identify the market opportunity",
    solution: "Design the solution approach", 
    assumption: "Test key assumptions",
    metric: "Track key performance indicator",
    research: "Research and discovery activities",
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
  // Only layout visible nodes to save space on canvas
  const visibleNodes = getVisibleNodes(nodes);
  return orientation === 'horizontal' 
    ? calculateHorizontalLayout(visibleNodes)
    : calculateVerticalLayout(visibleNodes);
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
  const nodeWidth = NODE_DIMENSIONS.WIDTH; // Card width
  const nodeHeight = NODE_DIMENSIONS.HEIGHT; // Card height
  // Increased spacing for better visual hierarchy
  const levelSpacing = nodeWidth + 120; // horizontal spacing between levels
  const siblingSpacing = nodeHeight + CANVAS_CONSTANTS.MIN_NODE_SPACING + 10; // vertical spacing between siblings

  // Build tree structure to calculate subtree heights for horizontal layout
  // Only consider visible (non-hidden) children for height calculation
  const getSubtreeHeight = (nodeId: string): number => {
    const node = nodeMap.get(nodeId);
    if (!node || node.children.length === 0) return 1;
    
    // Filter out hidden children from height calculations
    const visibleChildren = node.children.filter(childId => 
      !node.hiddenChildren?.includes(childId)
    );
    
    if (visibleChildren.length === 0) return 1;
    
    const childHeights = visibleChildren.map(childId => getSubtreeHeight(childId));
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
      // Only layout visible (non-hidden) children
      const visibleChildren = node.children.filter(childId => 
        !node.hiddenChildren?.includes(childId)
      );
      
      if (visibleChildren.length > 0) {
        const childX = x + levelSpacing;
        let childY = y;

        // Calculate starting position to center children vertically relative to parent
        const totalChildHeight = visibleChildren.reduce((sum, childId) => 
          sum + getSubtreeHeight(childId) * siblingSpacing, 0) - siblingSpacing;
        childY = y - totalChildHeight / 2;

        // Ensure children don't overlap with existing nodes at this level
        const existingNodesAtLevel = layoutNodes.filter(n => Math.abs(n.position.x - childX) < 50);
        if (existingNodesAtLevel.length > 0) {
          const maxY = Math.max(...existingNodesAtLevel.map(n => n.position.y));
          childY = Math.max(childY, maxY + siblingSpacing);
        }

        visibleChildren.forEach(childId => {
          const subtreeHeight = getSubtreeHeight(childId);
          const centerOffset = (subtreeHeight - 1) * siblingSpacing / 2;
          layoutTree(childId, childX, childY + centerOffset, level + 1);
          childY += subtreeHeight * siblingSpacing;
        });
      }
    }
  };

  // Layout each root tree
  let rootY = 200;
  rootNodes.forEach((root, index) => {
    if (index > 0) {
      rootY += getSubtreeHeight(root.id) * siblingSpacing + (siblingSpacing * 2);
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
  const nodeWidth = NODE_DIMENSIONS.WIDTH; // Card width
  const nodeHeight = NODE_DIMENSIONS.HEIGHT; // Base card height
  const actualCardHeight = 180; // Actual card height including footer
  // Increased spacing for better visual hierarchy in vertical layout
  const levelSpacing = actualCardHeight + 84; // 264px total vertical spacing between levels for better curve space
  const siblingSpacing = nodeWidth + CANVAS_CONSTANTS.MIN_NODE_SPACING + 10; // horizontal spacing between siblings

  // Build tree structure to calculate subtree widths for vertical layout
  // Only consider visible (non-hidden) children for width calculation
  const getSubtreeWidth = (nodeId: string): number => {
    const node = nodeMap.get(nodeId);
    if (!node || node.children.length === 0) return 1;
    
    // Filter out hidden children from width calculations
    const visibleChildren = node.children.filter(childId => 
      !node.hiddenChildren?.includes(childId)
    );
    
    if (visibleChildren.length === 0) return 1;
    
    const childWidths = visibleChildren.map(childId => getSubtreeWidth(childId));
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

    // Layout children vertically downward (flipped perspective of horizontal)
    if (node.children.length > 0) {
      // Only layout visible (non-hidden) children
      const visibleChildren = node.children.filter(childId => 
        !node.hiddenChildren?.includes(childId)
      );
      
      if (visibleChildren.length > 0) {
        const childY = y + levelSpacing;
        
        // Calculate total width needed for all visible children and their subtrees
        const totalSubtreeWidth = visibleChildren.reduce((sum, childId) => 
          sum + getSubtreeWidth(childId), 0);
        
        // Start position for children - center them under the parent
        let currentX = x - ((totalSubtreeWidth - 1) * siblingSpacing) / 2;

        visibleChildren.forEach(childId => {
          const subtreeWidth = getSubtreeWidth(childId);
          // Position each child at the center of its allocated space
          const childCenterX = currentX + ((subtreeWidth - 1) * siblingSpacing) / 2;
          
          layoutTree(childId, childCenterX, childY, level + 1);
          currentX += subtreeWidth * siblingSpacing;
        });
      }
    }
  };

  // Layout each root tree with proper spacing
  let currentX = 300;
  rootNodes.forEach((root, index) => {
    if (index > 0) {
      // Add spacing between separate root trees
      currentX += getSubtreeWidth(root.id) * siblingSpacing + (siblingSpacing * 2);
    }
    
    // Center the root tree based on its total width
    const rootSubtreeWidth = getSubtreeWidth(root.id);
    const rootCenterX = currentX + ((rootSubtreeWidth - 1) * siblingSpacing) / 2;
    
    layoutTree(root.id, rootCenterX, 100, 0);
    currentX += rootSubtreeWidth * siblingSpacing;
  });

  return layoutNodes;
}

// Get visible nodes (excluding collapsed subtrees and hidden children)
export function getVisibleNodes(nodes: TreeNode[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));
  
  const visibleNodes: TreeNode[] = [];
  const visitedNodes = new Set<string>();
  
  // Start with root nodes
  const rootNodes = nodes.filter(n => !n.parentId);
  
  const traverseVisible = (nodeId: string, isRoot: boolean = false) => {
    if (visitedNodes.has(nodeId)) return;
    visitedNodes.add(nodeId);
    
    const node = nodeMap.get(nodeId);
    if (!node) return;
    
    // Always show the node itself (root nodes are always visible)
    visibleNodes.push(node);
    
    // Only traverse children if node is not collapsed
    if (!node.isCollapsed && node.children.length > 0) {
      // Filter out hidden children
      const visibleChildren = node.children.filter(childId => 
        !node.hiddenChildren?.includes(childId)
      );
      visibleChildren.forEach(childId => traverseVisible(childId, false));
    }
  };
  
  rootNodes.forEach(root => traverseVisible(root.id, true));
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
  return nodes.map(node => {
    if (node.id === nodeId) {
      if (!node.children.length) {
        // No children to collapse/expand
        return node;
      }
      
      // Check current visibility state
      const isCurrentlyCollapsed = node.isCollapsed;
      const hasHiddenChildren = (node.hiddenChildren?.length || 0) > 0;
      const allChildrenHidden = (node.hiddenChildren?.length || 0) === node.children.length;
      
      if (isCurrentlyCollapsed || allChildrenHidden) {
        // Currently collapsed or all children individually hidden - expand and show all
        return {
          ...node,
          isCollapsed: false,
          hiddenChildren: []
        };
      } else {
        // Currently expanded - collapse all children
        return {
          ...node,
          isCollapsed: true,
          hiddenChildren: [] // Clear individual hidden states when collapsing
        };
      }
    }
    return node;
  });
}

// Simplified toggle collapse - no individual child hiding needed
export function toggleChildVisibility(nodes: TreeNode[], parentId: string, childId: string): TreeNode[] {
  // This function is no longer used but kept for compatibility
  return nodes;
}

// Get visible child nodes for a parent (excluding hidden ones)
export function getVisibleChildNodes(node: TreeNode, allNodes: TreeNode[]): TreeNode[] {
  if (!node.children.length) return [];
  
  const nodeMap = new Map<string, TreeNode>();
  allNodes.forEach(n => nodeMap.set(n.id, n));
  
  const visibleChildIds = node.children.filter(childId => 
    !node.hiddenChildren?.includes(childId)
  );
  
  return visibleChildIds
    .map(id => nodeMap.get(id))
    .filter((n): n is TreeNode => n !== undefined);
}

// Check if a child node is hidden
export function isChildHidden(parentNode: TreeNode, childId: string): boolean {
  return parentNode.hiddenChildren?.includes(childId) || false;
}

// Check if all children are effectively hidden (either individually hidden or parent collapsed)
export function areAllChildrenHidden(node: TreeNode): boolean {
  if (!node.children.length) return false;
  
  // If node is collapsed, all children are hidden
  if (node.isCollapsed) return true;
  
  // Check if all children are individually hidden
  const hiddenCount = node.hiddenChildren?.length || 0;
  return hiddenCount === node.children.length;
}

// Snap position to grid for clean alignment
export function snapToGrid(position: { x: number; y: number }, gridSize: number = 20): { x: number; y: number } {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize
  };
}

// Optimized collision detection using spatial hashing for better performance
const COLLISION_GRID_SIZE = 300;

interface SpatialGrid {
  [key: string]: TreeNode[];
}

function createSpatialGrid(nodes: TreeNode[]): SpatialGrid {
  const grid: SpatialGrid = {};
  
  nodes.forEach(node => {
    const bounds = getNodeBounds(node, 20);
    const startX = Math.floor(bounds.x / COLLISION_GRID_SIZE);
    const startY = Math.floor(bounds.y / COLLISION_GRID_SIZE);
    const endX = Math.floor((bounds.x + bounds.width) / COLLISION_GRID_SIZE);
    const endY = Math.floor((bounds.y + bounds.height) / COLLISION_GRID_SIZE);
    
    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        const key = `${x},${y}`;
        if (!grid[key]) grid[key] = [];
        grid[key].push(node);
      }
    }
  });
  
  return grid;
}

function getNearbyNodes(grid: SpatialGrid, position: { x: number; y: number }, width: number = 300, height: number = 144): TreeNode[] {
  const startX = Math.floor((position.x - 20) / COLLISION_GRID_SIZE);
  const startY = Math.floor((position.y - 20) / COLLISION_GRID_SIZE);
  const endX = Math.floor((position.x + width + 20) / COLLISION_GRID_SIZE);
  const endY = Math.floor((position.y + height + 20) / COLLISION_GRID_SIZE);
  
  const nearbyNodes = new Set<TreeNode>();
  
  for (let x = startX; x <= endX; x++) {
    for (let y = startY; y <= endY; y++) {
      const key = `${x},${y}`;
      if (grid[key]) {
        grid[key].forEach(node => nearbyNodes.add(node));
      }
    }
  }
  
  return Array.from(nearbyNodes);
}

// Optimized overlap prevention with spatial partitioning
export function preventOverlap(nodes: TreeNode[], targetNode: TreeNode, newPosition: { x: number; y: number }): { x: number; y: number } {
  const padding = 40;
  // Only consider visible nodes for collision detection to save canvas space
  const visibleNodes = getVisibleNodes(nodes).filter(n => n.id !== targetNode.id);
  const spatialGrid = createSpatialGrid(visibleNodes);
  
  let adjustedPosition = { ...newPosition };
  let attempts = 0;
  const maxAttempts = 20; // Reduced attempts for better performance
  
  while (attempts < maxAttempts) {
    const nearbyNodes = getNearbyNodes(spatialGrid, adjustedPosition);
    let hasOverlap = false;
    let bestDirection = { x: 0, y: 0 };
    let minOverlap = Infinity;
    
    const targetBounds = getNodeBounds({ ...targetNode, position: adjustedPosition }, padding / 2);
    
    for (const node of nearbyNodes) {
      const nodeBounds = getNodeBounds(node, padding / 2);
      
      if (boundsOverlap(targetBounds, nodeBounds)) {
        hasOverlap = true;
        
        // Calculate overlap amount for better direction calculation
        const overlapX = Math.min(targetBounds.x + targetBounds.width, nodeBounds.x + nodeBounds.width) - 
                        Math.max(targetBounds.x, nodeBounds.x);
        const overlapY = Math.min(targetBounds.y + targetBounds.height, nodeBounds.y + nodeBounds.height) - 
                        Math.max(targetBounds.y, nodeBounds.y);
        const overlapArea = Math.max(0, overlapX) * Math.max(0, overlapY);
        
        if (overlapArea < minOverlap) {
          minOverlap = overlapArea;
          
          // Calculate optimal direction to minimize movement
          const centerDistance = {
            x: adjustedPosition.x - node.position.x,
            y: adjustedPosition.y - node.position.y
          };
          
          const distance = Math.sqrt(centerDistance.x * centerDistance.x + centerDistance.y * centerDistance.y);
          
          if (distance > 0) {
            bestDirection = {
              x: (centerDistance.x / distance),
              y: (centerDistance.y / distance)
            };
          } else {
            bestDirection = { x: 1, y: 0.5 };
          }
        }
      }
    }
    
    if (!hasOverlap) break;
    
    // Apply calculated movement with increased spacing
    const cardWidth = 300;
    const cardHeight = 144;
    const pushDistanceX = cardWidth + 120; // Match horizontal level spacing
    const pushDistanceY = cardHeight + 60; // Match vertical sibling spacing
    adjustedPosition.x += bestDirection.x * pushDistanceX;
    adjustedPosition.y += bestDirection.y * pushDistanceY;
    
    attempts++;
  }

  return snapToGrid(adjustedPosition);
}

// Enhanced smart positioning for new nodes using comprehensive collision detection
export function getSmartNodePosition(nodes: TreeNode[], parentNode?: TreeNode, orientation: 'horizontal' | 'vertical' = 'horizontal'): { x: number; y: number } {
  // Only consider visible nodes for positioning to save canvas space
  const visibleNodes = getVisibleNodes(nodes);
  
  if (!parentNode) {
    // Find a good position for root nodes
    const rootNodes = visibleNodes.filter(n => !n.parentId);
    if (rootNodes.length === 0) {
      return orientation === 'horizontal' ? { x: 200, y: 100 } : { x: 300, y: 100 };
    }
    
    if (orientation === 'horizontal') {
      // Position to the right of existing root nodes
      const rightmostRoot = rootNodes.reduce((max, node) => 
        node.position.x > max.position.x ? node : max, rootNodes[0]);
      
      const cardWidth = 300;
      const levelSpacing = cardWidth + 120; // Match new horizontal spacing
      const initialPosition = { x: rightmostRoot.position.x + levelSpacing, y: rightmostRoot.position.y };
      return findOptimalPosition(visibleNodes, initialPosition);
    } else {
      // Position below existing root nodes in vertical layout
      const bottommostRoot = rootNodes.reduce((max, node) => 
        node.position.y > max.position.y ? node : max, rootNodes[0]);
      
      const actualCardHeight = 180; // Actual card height including footer
      const levelSpacing = actualCardHeight + 84; // Match new vertical spacing
      const initialPosition = { x: bottommostRoot.position.x, y: bottommostRoot.position.y + levelSpacing };
      return findOptimalPosition(visibleNodes, initialPosition);
    }
  }

  const siblings = visibleNodes.filter(n => n.parentId === parentNode.id);
  
  if (orientation === 'horizontal') {
    // Position child nodes to the right of parent (horizontal layout)
    const cardWidth = 300;
    const cardHeight = 144;
    const levelSpacing = cardWidth + 120; // Match new horizontal spacing
    const siblingSpacing = cardHeight + 60; // Match new vertical spacing
    const basePosition = {
      x: parentNode.position.x + levelSpacing,
      y: parentNode.position.y
    };

    const initialY = basePosition.y + (siblings.length * siblingSpacing);
    const initialPosition = { x: basePosition.x, y: initialY };
    
    return findOptimalPosition(visibleNodes, initialPosition);
  } else {
    // Position child nodes below parent (vertical layout) - centered like horizontal
    const cardWidth = 300;
    const actualCardHeight = 180; // Actual card height including footer
    const levelSpacing = actualCardHeight + 84; // Match new vertical spacing
    const siblingSpacing = cardWidth + 60; // Match new horizontal spacing in vertical layout
    const basePosition = {
      x: parentNode.position.x,
      y: parentNode.position.y + levelSpacing
    };

    // Center children horizontally relative to parent, spacing them out
    const totalSiblings = siblings.length + 1; // Include the new node
    const totalWidth = (totalSiblings - 1) * siblingSpacing;
    const startX = basePosition.x - (totalWidth / 2);
    const initialX = startX + (siblings.length * siblingSpacing);
    
    const initialPosition = { x: initialX, y: basePosition.y };
    
    return findOptimalPosition(visibleNodes, initialPosition);
  }
}

// Optimized position finding using spatial grid
export function findOptimalPosition(
  nodes: TreeNode[], 
  preferredPosition: { x: number; y: number },
  margin: number = 50
): { x: number; y: number } {
  const spatialGrid = createSpatialGrid(nodes);
  
  // Quick collision check using spatial grid
  const hasCollisionAtPosition = (pos: { x: number; y: number }) => {
    const nearbyNodes = getNearbyNodes(spatialGrid, pos, 256, 160);
    const testBounds = getNodeBounds({ 
      id: 'temp', 
      type: 'outcome', 
      title: '', 
      description: '', 
      position: pos, 
      children: [] 
    }, margin);
    
    return nearbyNodes.some(node => {
      const nodeBounds = getNodeBounds(node, margin);
      return boundsOverlap(testBounds, nodeBounds);
    });
  };

  // If preferred position is clear, use it
  if (!hasCollisionAtPosition(preferredPosition)) {
    return snapToGrid(preferredPosition);
  }

  // Optimized search with reduced iterations
  const searchRadius = 100;
  const step = 50;
  
  // Prioritize cardinal directions for better tree layouts
  const priorityAngles = [0, Math.PI, Math.PI/2, 3*Math.PI/2];
  const secondaryAngles = [Math.PI/4, 3*Math.PI/4, 5*Math.PI/4, 7*Math.PI/4];
  
  for (let radius = step; radius <= searchRadius * 3; radius += step) {
    // Try priority directions first
    for (const angle of priorityAngles) {
      const testPos = {
        x: preferredPosition.x + Math.cos(angle) * radius,
        y: preferredPosition.y + Math.sin(angle) * radius
      };
      
      if (!hasCollisionAtPosition(testPos)) {
        return snapToGrid(testPos);
      }
    }
    
    // Then try diagonal positions
    for (const angle of secondaryAngles) {
      const testPos = {
        x: preferredPosition.x + Math.cos(angle) * radius,
        y: preferredPosition.y + Math.sin(angle) * radius
      };
      
      if (!hasCollisionAtPosition(testPos)) {
        return snapToGrid(testPos);
      }
    }
  }
  
  // Enhanced fallback with multiple options
  const fallbackPositions = [
    { x: preferredPosition.x + 400, y: preferredPosition.y },
    { x: preferredPosition.x, y: preferredPosition.y + 400 },
    { x: preferredPosition.x - 400, y: preferredPosition.y },
    { x: preferredPosition.x, y: preferredPosition.y - 400 },
  ];
  
  for (const fallbackPos of fallbackPositions) {
    if (!hasCollisionAtPosition(fallbackPos)) {
      return snapToGrid(fallbackPos);
    }
  }
  
  // Final fallback - move far away
  return snapToGrid({ 
    x: preferredPosition.x + 600, 
    y: preferredPosition.y + 300 
  });
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
    width: 300 + (margin * 2), // Standard node width is 300px
    height: 144 + (margin * 2)  // Standard node height is 144px (reduced by 10%)
  };
}

// Check if two bounding boxes overlap
export function boundsOverlap(bounds1: { x: number; y: number; width: number; height: number }, bounds2: { x: number; y: number; width: number; height: number }): boolean {
  return !(bounds1.x + bounds1.width <= bounds2.x || 
           bounds2.x + bounds2.width <= bounds1.x || 
           bounds1.y + bounds1.height <= bounds2.y || 
           bounds2.y + bounds2.height <= bounds1.y);
}

// Optimized collision-free position finding for subtree movement
export function findCollisionFreePosition(
  nodes: TreeNode[],
  movingNodeId: string,
  targetPosition: { x: number; y: number }
): { x: number; y: number } {
  // Only consider visible nodes for collision detection to save canvas space
  const visibleNodes = getVisibleNodes(nodes);
  const nodeMap = new Map<string, TreeNode>();
  visibleNodes.forEach(n => nodeMap.set(n.id, n));
  
  const movingNode = nodeMap.get(movingNodeId);
  if (!movingNode) return targetPosition;

  // Get all nodes in the moving subtree (only visible ones)
  const descendantIds = getAllDescendants(visibleNodes, movingNodeId);
  const subtreeIds = new Set([movingNodeId, ...descendantIds]);
  const otherNodes = visibleNodes.filter(node => !subtreeIds.has(node.id));
  
  // Early exit if no other nodes to collide with
  if (otherNodes.length === 0) return snapToGrid(targetPosition);
  
  // Create spatial grid for non-moving nodes only
  const spatialGrid = createSpatialGrid(otherNodes);
  
  // Calculate subtree bounds more efficiently
  const getSubtreeBounds = (pos: { x: number; y: number }) => {
    const adjustedDeltaX = pos.x - movingNode.position.x;
    const adjustedDeltaY = pos.y - movingNode.position.y;
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    visibleNodes.forEach(node => {
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
  
  // Optimized collision detection using spatial grid
  const hasCollision = (pos: { x: number; y: number }) => {
    const subtreeBounds = getSubtreeBounds(pos);
    const nearbyNodes = getNearbyNodes(spatialGrid, pos, subtreeBounds.width, subtreeBounds.height);
    
    return nearbyNodes.some(otherNode => {
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
  
  // If still no position found, try moving further away using proper spacing
  const fallbackPos = {
    x: targetPosition.x + 420, // Use horizontal level spacing
    y: targetPosition.y
  };
  
  return snapToGrid(hasCollision(fallbackPos) ? { x: targetPosition.x, y: targetPosition.y + 204 } : fallbackPos);
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
    const nodeHeightWithSpacing = NODE_DIMENSIONS.HEIGHT + CANVAS_CONSTANTS.MIN_NODE_SPACING + 10; // 144 + 60 = 204
    if (!node || node.children.length === 0) return nodeHeightWithSpacing;
    
    // Calculate total height of all children
    let totalChildHeight = 0;
    node.children.forEach(childId => {
      totalChildHeight += calculateHeight(childId);
    });
    
    // Add proper spacing between children to match layout
    const spacing = Math.max(0, (node.children.length - 1) * CANVAS_CONSTANTS.MIN_NODE_SPACING + 10);
    return Math.max(nodeHeightWithSpacing, totalChildHeight + spacing);
  };
  
  return calculateHeight(nodeId);
}

// Reorganize a subtree to maintain clean hierarchical layout with collision avoidance
export function reorganizeSubtree(nodes: TreeNode[], rootNodeId: string, orientation: 'horizontal' | 'vertical' = 'horizontal'): TreeNode[] {
  // Only reorganize visible nodes to save canvas space
  const visibleNodes = getVisibleNodes(nodes);
  const rootNodeVisible = visibleNodes.find(n => n.id === rootNodeId);
  
  // If the root node isn't visible, don't reorganize
  if (!rootNodeVisible) return nodes;
  
  if (orientation === 'horizontal') {
    return reorganizeSubtreeHorizontal(nodes, rootNodeId);
  } else {
    return reorganizeSubtreeVertical(nodes, rootNodeId);
  }
}

function reorganizeSubtreeHorizontal(nodes: TreeNode[], rootNodeId: string): TreeNode[] {
  // Only reorganize based on visible nodes to save canvas space
  const visibleNodes = getVisibleNodes(nodes);
  const nodeMap = new Map<string, TreeNode>();
  visibleNodes.forEach(n => nodeMap.set(n.id, n));
  
  const rootNode = nodeMap.get(rootNodeId);
  if (!rootNode) return nodes;

  const updatedNodes = [...nodes];
  const levelSpacing = NODE_DIMENSIONS.WIDTH + 120; // Match main layout horizontal spacing
  const siblingSpacing = NODE_DIMENSIONS.HEIGHT + CANVAS_CONSTANTS.MIN_NODE_SPACING + 10; // Match main layout vertical spacing
  const subtreeIds = new Set([rootNodeId, ...getAllDescendants(visibleNodes, rootNodeId)]);
  
  // Use the same logic as calculateHorizontalLayout but for a subtree
  const layoutedNodes: TreeNode[] = [];
  
  const getSubtreeHeight = (nodeId: string): number => {
    const node = nodeMap.get(nodeId);
    if (!node || node.children.length === 0) return 1;
    
    // Filter out hidden children from height calculations
    const visibleChildren = node.children.filter(childId => 
      !node.hiddenChildren?.includes(childId)
    );
    
    if (visibleChildren.length === 0) return 1;
    
    const childHeights = visibleChildren.map(childId => getSubtreeHeight(childId));
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
    
    // Update in the main array
    const nodeIndex = updatedNodes.findIndex(n => n.id === nodeId);
    if (nodeIndex !== -1) {
      updatedNodes[nodeIndex] = layoutNode;
      nodeMap.set(nodeId, layoutNode);
    }

    // Layout children horizontally to the right
    if (node.children.length > 0) {
      // Only layout visible (non-hidden) children
      const visibleChildren = node.children.filter(childId => 
        !node.hiddenChildren?.includes(childId)
      );
      
      if (visibleChildren.length > 0) {
        const childX = x + levelSpacing;
        let childY = y;

        // Calculate starting position to center children vertically relative to parent
        const totalChildHeight = visibleChildren.reduce((sum, childId) => 
          sum + getSubtreeHeight(childId) * siblingSpacing, 0) - siblingSpacing;
        childY = y - totalChildHeight / 2;

        visibleChildren.forEach(childId => {
          const subtreeHeight = getSubtreeHeight(childId);
          const centerOffset = (subtreeHeight - 1) * siblingSpacing / 2;
          layoutTree(childId, childX, childY + centerOffset, level + 1);
          childY += subtreeHeight * siblingSpacing;
        });
      }
    }
  };

  // Start layout from root position
  layoutTree(rootNodeId, rootNode.position.x, rootNode.position.y, 0);
  
  return updatedNodes;
}

function reorganizeSubtreeVertical(nodes: TreeNode[], rootNodeId: string): TreeNode[] {
  // Only reorganize based on visible nodes to save canvas space
  const visibleNodes = getVisibleNodes(nodes);
  const nodeMap = new Map<string, TreeNode>();
  visibleNodes.forEach(n => nodeMap.set(n.id, n));
  
  const rootNode = nodeMap.get(rootNodeId);
  if (!rootNode) return nodes;

  const updatedNodes = [...nodes];
  const actualCardHeight = 180; // Actual card height including footer
  const levelSpacing = NODE_DIMENSIONS.HEIGHT + 84; // Match main layout vertical spacing
  const siblingSpacing = NODE_DIMENSIONS.WIDTH + CANVAS_CONSTANTS.MIN_NODE_SPACING + 10; // Match main layout horizontal spacing in vertical mode
  const subtreeIds = new Set([rootNodeId, ...getAllDescendants(visibleNodes, rootNodeId)]);
  
  // Use the same logic as calculateVerticalLayout but for a subtree
  const layoutedNodes: TreeNode[] = [];
  
  const getSubtreeWidth = (nodeId: string): number => {
    const node = nodeMap.get(nodeId);
    if (!node || node.children.length === 0) return 1;
    
    // Filter out hidden children from width calculations
    const visibleChildren = node.children.filter(childId => 
      !node.hiddenChildren?.includes(childId)
    );
    
    if (visibleChildren.length === 0) return 1;
    
    const childWidths = visibleChildren.map(childId => getSubtreeWidth(childId));
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
    layoutedNodes.push(layoutNode);

    // Layout children vertically downward (same as main vertical layout)
    if (node.children.length > 0) {
      // Only layout visible (non-hidden) children
      const visibleChildren = node.children.filter(childId => 
        !node.hiddenChildren?.includes(childId)
      );
      
      if (visibleChildren.length > 0) {
        const childY = y + levelSpacing;
        
        // Calculate total width needed for all visible children and their subtrees
        const totalSubtreeWidth = visibleChildren.reduce((sum, childId) => 
          sum + getSubtreeWidth(childId), 0);
        
        // Start position for children - center them under the parent
        let currentX = x - ((totalSubtreeWidth - 1) * siblingSpacing) / 2;

        visibleChildren.forEach(childId => {
          const subtreeWidth = getSubtreeWidth(childId);
          // Position each child at the center of its allocated space
          const childCenterX = currentX + ((subtreeWidth - 1) * siblingSpacing) / 2;
          
          layoutTree(childId, childCenterX, childY, level + 1);
          currentX += subtreeWidth * siblingSpacing;
        });
      }
    }
  };

  // Start layout from root position
  layoutTree(rootNodeId, rootNode.position.x, rootNode.position.y, 0);
  
  // Update the nodes in the original array
  layoutedNodes.forEach(layoutedNode => {
    const nodeIndex = updatedNodes.findIndex(n => n.id === layoutedNode.id);
    if (nodeIndex !== -1) {
      updatedNodes[nodeIndex] = layoutedNode;
    }
  });
  
  return updatedNodes;
}

// Auto-layout entire tree after drag-and-drop operations
export function autoLayoutAfterDrop(nodes: TreeNode[], orientation: 'horizontal' | 'vertical' = 'horizontal'): TreeNode[] {
  return calculateNodeLayout(nodes, orientation);
}

export function getHomePosition(nodes: TreeNode[], currentOrientation: 'horizontal' | 'vertical' = 'horizontal'): { zoom: number; pan: { x: number; y: number }; orientation: 'horizontal' | 'vertical' } {
  // Only consider visible nodes for home positioning to save canvas space
  const visibleNodes = getVisibleNodes(nodes);
  
  // If no visible nodes, position at top-left corner
  if (visibleNodes.length === 0) {
    return { zoom: 1, pan: { x: 100, y: 100 }, orientation: currentOrientation };
  }

  // Find outcome nodes among visible nodes
  const outcomeNodes = visibleNodes.filter(node => node.type === 'outcome');
  
  if (outcomeNodes.length === 0) {
    // No outcome nodes, return home position using first visible node
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

export function fitNodesToScreen(nodes: TreeNode[], canvasWidth: number, canvasHeight: number, currentOrientation: 'horizontal' | 'vertical' = 'horizontal') {
  if (nodes.length === 0) return getHomePosition(nodes, currentOrientation);

  // Get only visible nodes (not collapsed)
  const visibleNodes = getVisibleNodes(nodes);
  if (visibleNodes.length === 0) return getHomePosition(nodes, currentOrientation);

  const padding = CANVAS_CONSTANTS.CANVAS_PADDING; // Use centralized padding
  const nodeWidth = NODE_DIMENSIONS.WIDTH;
  const nodeHeight = NODE_DIMENSIONS.HEIGHT;
  
  const minX = Math.min(...visibleNodes.map(n => n.position.x));
  const maxX = Math.max(...visibleNodes.map(n => n.position.x + nodeWidth));
  const minY = Math.min(...visibleNodes.map(n => n.position.y));
  const maxY = Math.max(...visibleNodes.map(n => n.position.y + nodeHeight));
  
  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;
  
  // Prevent division by zero
  if (contentWidth <= 0 || contentHeight <= 0) {
    return getHomePosition(nodes, currentOrientation);
  }
  
  // Calculate zoom to fit content with padding
  const scaleX = (canvasWidth - padding * 2) / contentWidth;
  const scaleY = (canvasHeight - padding * 2) / contentHeight;
  const zoom = Math.min(scaleX, scaleY, CANVAS_CONSTANTS.MAX_ZOOM);
  
  // Ensure minimum zoom
  const finalZoom = Math.max(zoom, CANVAS_CONSTANTS.MIN_ZOOM);
  
  // Calculate content bounds with zoom applied
  const scaledContentWidth = contentWidth * finalZoom;
  const scaledContentHeight = contentHeight * finalZoom;
  
  // Center the content in the available space
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  
  // Calculate the center of the content
  const contentCenterX = minX + contentWidth / 2;
  const contentCenterY = minY + contentHeight / 2;
  
  // Calculate pan to center the content
  const pan = {
    x: centerX - (contentCenterX * finalZoom),
    y: centerY - (contentCenterY * finalZoom),
  };
  
  return { zoom: finalZoom, pan, orientation: currentOrientation };
}
