import { useState, useCallback, useMemo, useRef } from 'react';
import { debounce } from '@/lib/performance-utils';
import { apiRequest } from '@/lib/queryClient';
import { TreeNode } from '@/types/canvas';

interface OptimisticUpdate {
  nodeId: string;
  position: { x: number; y: number };
  timestamp: number;
  retryCount?: number;
}

interface BatchUpdateRequest {
  nodes: Array<{
    id: string;
    position: { x: number; y: number };
  }>;
}

interface BatchUpdateResponse {
  success: boolean;
  updated: number;
  timestamp: string;
  failed?: string[];
}

interface UseOptimisticUpdatesOptions {
  treeId: number;
  debounceMs?: number;
  maxRetries?: number;
  onError?: (error: Error) => void;
  onSuccess?: (response: BatchUpdateResponse) => void;
}

export function useOptimisticUpdates({
  treeId,
  debounceMs = 500,
  maxRetries = 3,
  onError,
  onSuccess
}: UseOptimisticUpdatesOptions) {
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, OptimisticUpdate>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [errorNodes, setErrorNodes] = useState<Set<string>>(new Set());
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Enhanced batch save with retry logic and error handling
  const performBatchSave = useCallback(async (updates: Map<string, OptimisticUpdate>) => {
    if (updates.size === 0) return;
    
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    setIsSaving(true);
    setErrorNodes(new Set());
    
    try {
      const batchRequest: BatchUpdateRequest = {
        nodes: Array.from(updates.entries()).map(([nodeId, data]) => ({
          id: nodeId,
          position: data.position
        }))
      };
      
      const response = await apiRequest<BatchUpdateResponse>(
        `/api/impact-trees/${treeId}/nodes/batch`,
        {
          method: 'PUT',
          body: JSON.stringify(batchRequest),
          signal: abortControllerRef.current.signal
        }
      );
      
      if (response.success) {
        // Clear successfully saved updates
        setPendingUpdates(prev => {
          const updated = new Map(prev);
          batchRequest.nodes.forEach(node => updated.delete(node.id));
          return updated;
        });
        
        setLastSaved(new Date());
        onSuccess?.(response);
      } else {
        // Handle partial failures
        if (response.failed) {
          setErrorNodes(new Set(response.failed));
          
          // Retry failed updates
          const failedUpdates = new Map();
          response.failed.forEach(nodeId => {
            const update = updates.get(nodeId);
            if (update && (update.retryCount || 0) < maxRetries) {
              failedUpdates.set(nodeId, {
                ...update,
                retryCount: (update.retryCount || 0) + 1
              });
            }
          });
          
          if (failedUpdates.size > 0) {
            setPendingUpdates(prev => new Map([...prev, ...failedUpdates]));
            // Retry after exponential backoff
            setTimeout(() => performBatchSave(failedUpdates), 
              Math.pow(2, (Array.from(failedUpdates.values())[0].retryCount || 0)) * 1000);
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return; // Request was cancelled, ignore
      }
      
      console.error('Batch save failed:', error);
      onError?.(error as Error);
      
      // Mark nodes as having errors
      setErrorNodes(new Set(Array.from(updates.keys())));
      
      // Retry logic for network errors
      const retriableUpdates = new Map();
      updates.forEach((update, nodeId) => {
        if ((update.retryCount || 0) < maxRetries) {
          retriableUpdates.set(nodeId, {
            ...update,
            retryCount: (update.retryCount || 0) + 1
          });
        }
      });
      
      if (retriableUpdates.size > 0) {
        setPendingUpdates(prev => new Map([...prev, ...retriableUpdates]));
        // Retry with exponential backoff
        setTimeout(() => performBatchSave(retriableUpdates), 
          Math.pow(2, (Array.from(retriableUpdates.values())[0].retryCount || 0)) * 1000);
      }
    } finally {
      setIsSaving(false);
      abortControllerRef.current = null;
    }
  }, [treeId, maxRetries, onError, onSuccess]);

  // Debounced save function
  const debouncedSave = useMemo(
    () => debounce(async () => {
      await performBatchSave(pendingUpdates);
    }, debounceMs),
    [performBatchSave, pendingUpdates, debounceMs]
  );

  // Queue an update for batching
  const queueUpdate = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setPendingUpdates(prev => new Map(prev).set(nodeId, {
      nodeId,
      position,
      timestamp: Date.now(),
      retryCount: 0
    }));
    debouncedSave();
  }, [debouncedSave]);

  // Queue multiple updates (for subtree operations)
  const queueMultipleUpdates = useCallback((updates: Array<{ nodeId: string; position: { x: number; y: number } }>) => {
    setPendingUpdates(prev => {
      const newUpdates = new Map(prev);
      updates.forEach(({ nodeId, position }) => {
        newUpdates.set(nodeId, {
          nodeId,
          position,
          timestamp: Date.now(),
          retryCount: 0
        });
      });
      return newUpdates;
    });
    debouncedSave();
  }, [debouncedSave]);

  // Force immediate save (for critical operations)
  const forceSave = useCallback(async () => {
    debouncedSave.cancel();
    await performBatchSave(pendingUpdates);
  }, [debouncedSave, performBatchSave, pendingUpdates]);

  // Clear pending updates (for errors or cancellation)
  const clearPending = useCallback(() => {
    debouncedSave.cancel();
    setPendingUpdates(new Map());
    setErrorNodes(new Set());
  }, [debouncedSave]);

  // Check if a node has pending updates
  const hasPendingUpdate = useCallback((nodeId: string) => {
    return pendingUpdates.has(nodeId);
  }, [pendingUpdates]);

  // Check if a node has errors
  const hasError = useCallback((nodeId: string) => {
    return errorNodes.has(nodeId);
  }, [errorNodes]);

  return {
    // Core functions
    queueUpdate,
    queueMultipleUpdates,
    forceSave,
    clearPending,
    
    // Status checks
    hasPendingUpdate,
    hasError,
    
    // State
    pendingCount: pendingUpdates.size,
    isSaving,
    lastSaved,
    errorCount: errorNodes.size,
    
    // Advanced features
    pendingNodeIds: Array.from(pendingUpdates.keys()),
    errorNodeIds: Array.from(errorNodes)
  };
}