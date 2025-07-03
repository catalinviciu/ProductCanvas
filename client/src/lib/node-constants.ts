// Node dimensions and constants
export const NODE_DIMENSIONS = {
  WIDTH: 300,
  HEIGHT: 144,
  BORDER_RADIUS: 8,
  PADDING: 16,
} as const;

// Visual feedback constants
export const DRAG_FEEDBACK = {
  DROP_TARGET_SCALE: 1.02,
  DRAG_OVER_SCALE: 1.05,
  PULSE_ANIMATION_DURATION: 2000,
  HIGHLIGHT_OPACITY: 0.1,
} as const;

// Grid and spacing constants
export const CANVAS_CONSTANTS = {
  GRID_SIZE: 20,
  MIN_NODE_SPACING: 50,
  CANVAS_PADDING: 100,
  ZOOM_STEP: 0.1,
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 3,
} as const;

// Node type dimensions (if nodes have different sizes in the future)
export const NODE_TYPE_DIMENSIONS = {
  objective: { width: NODE_DIMENSIONS.WIDTH, height: NODE_DIMENSIONS.HEIGHT },
  outcome: { width: NODE_DIMENSIONS.WIDTH, height: NODE_DIMENSIONS.HEIGHT },
  opportunity: { width: NODE_DIMENSIONS.WIDTH, height: NODE_DIMENSIONS.HEIGHT },
  solution: { width: NODE_DIMENSIONS.WIDTH, height: NODE_DIMENSIONS.HEIGHT },
  assumption: { width: NODE_DIMENSIONS.WIDTH, height: NODE_DIMENSIONS.HEIGHT },
  metric: { width: NODE_DIMENSIONS.WIDTH, height: NODE_DIMENSIONS.HEIGHT },
  research: { width: NODE_DIMENSIONS.WIDTH, height: NODE_DIMENSIONS.HEIGHT },
} as const;

// Function to get node dimensions by type
export function getNodeDimensions(nodeType: keyof typeof NODE_TYPE_DIMENSIONS = 'objective') {
  return NODE_TYPE_DIMENSIONS[nodeType] || NODE_TYPE_DIMENSIONS.objective;
}

// Function to get node bounds including position
export function getNodeBounds(position: { x: number; y: number }, nodeType: keyof typeof NODE_TYPE_DIMENSIONS = 'objective') {
  const dimensions = getNodeDimensions(nodeType);
  return {
    x: position.x,
    y: position.y,
    width: dimensions.width,
    height: dimensions.height,
  };
}