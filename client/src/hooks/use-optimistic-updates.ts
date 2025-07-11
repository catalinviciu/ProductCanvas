import { useCallback, useRef, useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { type TreeNode } from '@shared/schema';

interface PendingUpdate {
  nodeId: string;
  updates: any;
  timestamp: number;
}

interface OptimisticUpdatesConfig {
  treeId: number;
  debounceMs?: number;
  batchSize?: number;
}

export function useOptimisticUpdates({
  treeId,
  debounceMs = 500,
  batchSize = 10
}: OptimisticUpdatesConfig) {
  const queryClient = useQueryClient();
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, PendingUpdate>>(new Map());
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);

  // Bulk update mutation for batching multiple node updates
  const bulkUpdateMutation = useMutation({
    mutationFn: async (updates: Array<{ nodeId: string; updates: any }>) => {
      console.log('Processing bulk update for', updates.length, 'nodes');
      const response = await apiRequest('PUT', `/api/impact-trees/${treeId}/nodes/bulk-update`, { 
        nodeUpdates: updates.map(u => ({ id: u.nodeId, updates: u.updates }))
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Bulk update failed: ${error.message}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Bulk update completed successfully:', data);
      queryClient.invalidateQueries({ queryKey: [`/api/impact-trees/${treeId}`] });
    },
    onError: (error) => {
      console.error('Bulk update failed:', error);
      // Show user-friendly error message
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: {
            title: "Update failed",
            description: "Failed to save changes. Please try again.",
            variant: "destructive",
          }
        }));
      }
    }
  });

  // Process pending updates in batches
  const processPendingUpdates = useCallback(async () => {
    if (pendingUpdates.size === 0 || processingRef.current) return;

    processingRef.current = true;
    setIsProcessing(true);
    
    try {
      const currentUpdates = new Map(pendingUpdates);
      const updates = Array.from(currentUpdates.values()).map(pending => ({
        nodeId: pending.nodeId,
        updates: pending.updates
      }));

      // Process in batches
      const batches = [];
      for (let i = 0; i < updates.length; i += batchSize) {
        batches.push(updates.slice(i, i + batchSize));
      }

      // Process all batches
      for (const batch of batches) {
        await bulkUpdateMutation.mutateAsync(batch);
      }

      // Clear processed updates
      setPendingUpdates(new Map());
    } catch (error) {
      console.error('Error processing pending updates:', error);
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [batchSize, bulkUpdateMutation, pendingUpdates]);

  // Debounced update function
  const scheduleUpdate = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      processPendingUpdates();
    }, debounceMs);
  }, [processPendingUpdates, debounceMs]);

  // Add or update a pending update
  const addPendingUpdate = useCallback((nodeId: string, updates: any) => {
    setPendingUpdates(prev => {
      const newMap = new Map(prev);
      newMap.set(nodeId, {
        nodeId,
        updates,
        timestamp: Date.now()
      });
      return newMap;
    });
    
    scheduleUpdate();
  }, [scheduleUpdate]);

  // Optimistic update function - updates local state immediately and schedules persistence
  const optimisticUpdate = useCallback((nodeId: string, updates: any) => {
    // Add to pending updates for persistence
    addPendingUpdate(nodeId, updates);
    
    // Return success immediately for optimistic UI updates
    return Promise.resolve();
  }, [addPendingUpdate]);

  // Force flush all pending updates immediately
  const flushPendingUpdates = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    return processPendingUpdates();
  }, [processPendingUpdates]);

  return {
    optimisticUpdate,
    flushPendingUpdates,
    pendingUpdatesCount: pendingUpdates.size,
    isProcessing,
    addPendingUpdate
  };
}