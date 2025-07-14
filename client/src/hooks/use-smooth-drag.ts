import { useCallback, useRef, useState } from 'react';
import { useOptimisticUpdates } from './use-optimistic-updates';
import { type TreeNode } from '@shared/schema';

interface SmoothDragConfig {
  treeId: number;
  debounceMs?: number;
  batchSize?: number;
}

interface DragState {
  isDragging: boolean;
  draggedNodes: Set<string>;
  dragStartTime: number;
}

/**
 * Hook for smooth drag operations that don't interrupt user flow
 * - Provides instant visual feedback
 * - Debounces persistence until drag stops
 * - Batches multiple node updates during drag operations
 */
export function useSmoothDrag({ treeId, debounceMs = 300, batchSize = 10 }: SmoothDragConfig) {
  const optimisticUpdates = useOptimisticUpdates({
    treeId,
    debounceMs,
    batchSize
  });
  
  const dragState = useRef<DragState>({
    isDragging: false,
    draggedNodes: new Set(),
    dragStartTime: 0
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const dragEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDragUpdates = useRef<Map<string, any>>(new Map());

  /**
   * Start drag operation - immediate visual feedback only
   */
  const startDrag = useCallback((nodeId: string) => {
    dragState.current = {
      isDragging: true,
      draggedNodes: new Set([nodeId]),
      dragStartTime: Date.now()
    };
    setIsDragging(true);
    
    // Clear any pending drag end timeout
    if (dragEndTimeoutRef.current) {
      clearTimeout(dragEndTimeoutRef.current);
      dragEndTimeoutRef.current = null;
    }
  }, []);

  /**
   * Update node position during drag - visual only, no persistence
   */
  const updateDragPosition = useCallback((nodeId: string, updates: any) => {
    if (!dragState.current.isDragging) return;
    
    // Add to dragged nodes set
    dragState.current.draggedNodes.add(nodeId);
    
    // Store pending updates without persisting
    pendingDragUpdates.current.set(nodeId, updates);
    
    // This will be handled by the parent component for immediate visual feedback
    // No persistence occurs during active dragging
  }, []);

  /**
   * End drag operation - persist all accumulated changes
   */
  const endDrag = useCallback(() => {
    if (!dragState.current.isDragging) return;
    
    // Clear drag end timeout if it exists
    if (dragEndTimeoutRef.current) {
      clearTimeout(dragEndTimeoutRef.current);
      dragEndTimeoutRef.current = null;
    }
    
    // Schedule persistence after a brief delay to ensure smooth UX
    dragEndTimeoutRef.current = setTimeout(() => {
      // Persist all pending updates at once
      const updates = Array.from(pendingDragUpdates.current.entries());
      
      updates.forEach(([nodeId, nodeUpdates]) => {
        optimisticUpdates.optimisticUpdate(nodeId, nodeUpdates);
      });
      
      // Clear state
      dragState.current = {
        isDragging: false,
        draggedNodes: new Set(),
        dragStartTime: 0
      };
      setIsDragging(false);
      pendingDragUpdates.current.clear();
    }, 100); // Brief delay for smooth UX
  }, [optimisticUpdates]);

  /**
   * Force immediate persistence of all pending drag updates
   */
  const flushDragUpdates = useCallback(() => {
    if (pendingDragUpdates.current.size === 0) return;
    
    const updates = Array.from(pendingDragUpdates.current.entries());
    updates.forEach(([nodeId, nodeUpdates]) => {
      optimisticUpdates.optimisticUpdate(nodeId, nodeUpdates);
    });
    
    pendingDragUpdates.current.clear();
  }, [optimisticUpdates]);

  /**
   * Check if a node is currently being dragged
   */
  const isNodeDragging = useCallback((nodeId: string) => {
    return dragState.current.draggedNodes.has(nodeId);
  }, []);

  /**
   * Get drag statistics
   */
  const getDragStats = useCallback(() => {
    return {
      isDragging: dragState.current.isDragging,
      draggedNodesCount: dragState.current.draggedNodes.size,
      dragDuration: dragState.current.isDragging ? Date.now() - dragState.current.dragStartTime : 0,
      pendingUpdatesCount: pendingDragUpdates.current.size
    };
  }, []);

  return {
    isDragging,
    startDrag,
    updateDragPosition,
    endDrag,
    flushDragUpdates,
    isNodeDragging,
    getDragStats,
    
    // Pass through optimistic updates for non-drag operations
    optimisticUpdate: optimisticUpdates.optimisticUpdate,
    pendingUpdatesCount: optimisticUpdates.pendingUpdatesCount,
    isProcessingUpdates: optimisticUpdates.isProcessingUpdates
  };
}