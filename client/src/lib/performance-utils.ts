// Performance utilities for canvas operations
import { type TreeNode } from "@shared/schema";

// Debounce utility for expensive operations
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeout: NodeJS.Timeout;
  
  const debounced = ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as ((...args: Parameters<T>) => void) & { cancel: () => void };
  
  debounced.cancel = () => {
    clearTimeout(timeout);
  };
  
  return debounced;
}

// Throttle utility for frequent operations like dragging
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Viewport culling for better rendering performance
export function getVisibleNodesInViewport(
  nodes: TreeNode[],
  viewport: { x: number; y: number; width: number; height: number },
  margin: number = 100
): TreeNode[] {
  const viewportBounds = {
    left: viewport.x - margin,
    right: viewport.x + viewport.width + margin,
    top: viewport.y - margin,
    bottom: viewport.y + viewport.height + margin,
  };

  return nodes.filter(node => {
    const nodeRight = node.position.x + 256; // Node width
    const nodeBottom = node.position.y + 160; // Node height

    return !(
      node.position.x > viewportBounds.right ||
      nodeRight < viewportBounds.left ||
      node.position.y > viewportBounds.bottom ||
      nodeBottom < viewportBounds.top
    );
  });
}

// Batch DOM updates for better performance
export class BatchUpdater {
  private updates: (() => void)[] = [];
  private isScheduled = false;

  addUpdate(update: () => void) {
    this.updates.push(update);
    if (!this.isScheduled) {
      this.isScheduled = true;
      requestAnimationFrame(() => {
        this.flush();
      });
    }
  }

  private flush() {
    const updates = [...this.updates];
    this.updates.length = 0;
    this.isScheduled = false;
    
    updates.forEach(update => update());
  }
}

// Memory-efficient node position cache
export class NodePositionCache {
  private cache = new Map<string, { x: number; y: number; timestamp: number }>();
  private maxAge = 5000; // 5 seconds

  set(nodeId: string, position: { x: number; y: number }) {
    this.cache.set(nodeId, {
      ...position,
      timestamp: Date.now()
    });
  }

  get(nodeId: string): { x: number; y: number } | null {
    const cached = this.cache.get(nodeId);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(nodeId);
      return null;
    }

    return { x: cached.x, y: cached.y };
  }

  clear() {
    this.cache.clear();
  }

  cleanup() {
    const now = Date.now();
    const toDelete: string[] = [];
    
    this.cache.forEach((data, nodeId) => {
      if (now - data.timestamp > this.maxAge) {
        toDelete.push(nodeId);
      }
    });
    
    toDelete.forEach(nodeId => this.cache.delete(nodeId));
  }
}