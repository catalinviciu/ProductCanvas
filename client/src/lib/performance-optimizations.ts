import { type TreeNode } from '@shared/schema';

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private frameCount = 0;
  private lastFrameTime = 0;
  private fps = 0;
  private rafId: number | null = null;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring() {
    this.measureFPS();
  }

  private measureFPS() {
    const now = performance.now();
    if (this.lastFrameTime) {
      const delta = now - this.lastFrameTime;
      this.fps = 1000 / delta;
      this.frameCount++;
    }
    this.lastFrameTime = now;
    this.rafId = requestAnimationFrame(() => this.measureFPS());
  }

  stopMonitoring() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  getFPS(): number {
    return Math.round(this.fps);
  }

  getAverageFPS(): number {
    return this.frameCount > 0 ? Math.round(this.fps) : 0;
  }
}

// Optimized animation frame scheduler
export class AnimationScheduler {
  private static instance: AnimationScheduler;
  private pendingUpdates = new Set<() => void>();
  private isScheduled = false;

  static getInstance(): AnimationScheduler {
    if (!AnimationScheduler.instance) {
      AnimationScheduler.instance = new AnimationScheduler();
    }
    return AnimationScheduler.instance;
  }

  schedule(callback: () => void): void {
    this.pendingUpdates.add(callback);
    
    if (!this.isScheduled) {
      this.isScheduled = true;
      requestAnimationFrame(() => {
        this.flush();
      });
    }
  }

  private flush(): void {
    const updates = Array.from(this.pendingUpdates);
    this.pendingUpdates.clear();
    this.isScheduled = false;

    // Execute all pending updates in a single frame
    updates.forEach(update => {
      try {
        update();
      } catch (error) {
        console.error('Error executing animation update:', error);
      }
    });
  }
}

// Canvas viewport culling for large trees
export class ViewportCuller {
  private static readonly BUFFER_SIZE = 100; // px buffer around viewport

  static getVisibleNodes(
    nodes: TreeNode[],
    viewport: { x: number; y: number; width: number; height: number },
    zoom: number
  ): TreeNode[] {
    const buffer = ViewportCuller.BUFFER_SIZE / zoom;
    const visibleBounds = {
      left: viewport.x - buffer,
      right: viewport.x + viewport.width + buffer,
      top: viewport.y - buffer,
      bottom: viewport.y + viewport.height + buffer
    };

    return nodes.filter(node => {
      const nodeSize = 200; // Approximate node size
      return (
        node.position.x + nodeSize > visibleBounds.left &&
        node.position.x < visibleBounds.right &&
        node.position.y + nodeSize > visibleBounds.top &&
        node.position.y < visibleBounds.bottom
      );
    });
  }
}

// Debounced function factory with performance optimizations
export function createOptimizedDebounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: { 
    leading?: boolean; 
    trailing?: boolean; 
    maxWait?: number;
    immediate?: boolean;
  } = {}
): T & { cancel: () => void; flush: () => void } {
  let timeout: NodeJS.Timeout | null = null;
  let maxTimeout: NodeJS.Timeout | null = null;
  let result: ReturnType<T>;
  let lastArgs: Parameters<T>;
  let lastThis: any;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;
  let leading = false;
  let maxing = false;

  const { leading: enableLeading = false, trailing = true, maxWait, immediate = false } = options;

  if (typeof func !== 'function') {
    throw new TypeError('Expected a function');
  }

  if (maxWait !== undefined) {
    maxing = true;
  }

  function invokeFunc(time: number) {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = lastThis = undefined as any;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time: number) {
    lastInvokeTime = time;
    timeout = setTimeout(timerExpired, wait);
    return enableLeading ? invokeFunc(time) : result;
  }

  function remainingWait(time: number) {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return maxing
      ? Math.min(timeWaiting, (maxWait || 0) - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time: number) {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxing && timeSinceLastInvoke >= (maxWait || 0))
    );
  }

  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeout = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time: number) {
    timeout = null;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined as any;
    return result;
  }

  function cancel() {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    if (maxTimeout !== null) {
      clearTimeout(maxTimeout);
    }
    lastInvokeTime = 0;
    lastArgs = lastThis = timeout = maxTimeout = undefined as any;
  }

  function flush() {
    return timeout === null ? result : trailingEdge(Date.now());
  }

  function debounced(this: any, ...args: Parameters<T>) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeout === null) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        clearTimeout(timeout);
        timeout = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timeout === null) {
      timeout = setTimeout(timerExpired, wait);
    }
    return result;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;

  return debounced as T & { cancel: () => void; flush: () => void };
}

// Memory-efficient node position cache
export class NodePositionCache {
  private cache = new Map<string, { x: number; y: number; timestamp: number }>();
  private readonly maxAge = 5000; // 5 seconds
  private readonly maxSize = 1000; // Maximum cached positions

  set(nodeId: string, position: { x: number; y: number }): void {
    // Clean up old entries if cache is too large
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(nodeId, {
      ...position,
      timestamp: Date.now()
    });
  }

  get(nodeId: string): { x: number; y: number } | null {
    const cached = this.cache.get(nodeId);
    if (!cached) return null;

    // Check if cached position is still valid
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(nodeId);
      return null;
    }

    return { x: cached.x, y: cached.y };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [nodeId, data] of this.cache.entries()) {
      if (now - data.timestamp > this.maxAge) {
        this.cache.delete(nodeId);
      }
    }

    // If still too large, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      const sorted = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = sorted.slice(0, this.cache.size - Math.floor(this.maxSize * 0.8));
      toRemove.forEach(([nodeId]) => this.cache.delete(nodeId));
    }
  }

  clear(): void {
    this.cache.clear();
  }
}