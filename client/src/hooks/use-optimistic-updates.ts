import { useCallback, useRef, useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { type TreeNode } from '@shared/schema';

interface PendingUpdate {
  id: string;
  type: 'position' | 'content' | 'structure';
  nodeId: string;
  updates: any;
  timestamp: number;
}

interface OptimisticUpdatesConfig {
  treeId: number;
  debounceMs?: number;
  batchSize?: number;
  maxRetries?: number;
}

export function useOptimisticUpdates({
  treeId,
  debounceMs = 500,
  batchSize = 10,
  maxRetries = 3
}: OptimisticUpdatesConfig) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, PendingUpdate>>(new Map());
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);
  const retryCountRef = useRef<Map<string, number>>(new Map());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  // Enhanced bulk update mutation with retry logic
  const bulkUpdateMutation = useMutation({
    mutationFn: async (updates: PendingUpdate[]) => {
      console.log('Processing bulk update for', updates.length, 'items');
      setSaveStatus('pending');
      
      return await apiRequest('/api/impact-trees/batch-update', { 
        method: 'POST',
        body: { 
          updates: updates.map(u => ({
            id: u.id,
            type: u.type,
            data: {
              nodeId: u.nodeId,
              position: u.type === 'position' ? u.updates.position : undefined,
              content: u.type === 'content' ? u.updates : undefined,
              structure: u.type === 'structure' ? u.updates : undefined,
              treeId
            }
          }))
        }
      });
    },
    onSuccess: (data, variables) => {
      console.log('Bulk update completed successfully:', data);
      
      // Clear successfully saved updates
      variables.forEach(update => {
        pendingUpdates.delete(update.id);
        retryCountRef.current.delete(update.id);
      });
      
      // Update state
      setPendingUpdates(new Map(pendingUpdates));
      setSaveStatus('success');
      
      // Invalidate affected queries
      queryClient.invalidateQueries({ queryKey: [`/api/impact-trees/${treeId}`] });
      
      // Show success briefly
      setTimeout(() => {
        setSaveStatus('idle');
      }, 1500);
    },
    onError: (error, variables) => {
      console.error('Bulk update failed:', error);
      setSaveStatus('error');
      
      // Implement retry logic
      const failedUpdates = variables.filter(update => {
        const retryCount = retryCountRef.current.get(update.id) || 0;
        return retryCount < maxRetries;
      });

      if (failedUpdates.length > 0) {
        // Increment retry counts
        failedUpdates.forEach(update => {
          const currentRetries = retryCountRef.current.get(update.id) || 0;
          retryCountRef.current.set(update.id, currentRetries + 1);
        });

        // Schedule retry with exponential backoff
        const retryDelay = 1000 * Math.pow(2, retryCountRef.current.get(failedUpdates[0].id) || 0);
        setTimeout(() => {
          setSaveStatus('pending');
          bulkUpdateMutation.mutate(failedUpdates);
        }, retryDelay);
      } else {
        // All retries exhausted
        toast({
          title: "Save Error",
          description: "Some changes couldn't be saved. Please try again.",
          variant: "destructive"
        });
        setTimeout(() => {
          setSaveStatus('idle');
        }, 3000);
      }
    }
  });

  // Process pending updates in batches with improved debouncing
  const processPendingUpdates = useCallback(async () => {
    if (pendingUpdates.size === 0 || processingRef.current) return;

    processingRef.current = true;
    setIsProcessing(true);
    
    try {
      const updates = Array.from(pendingUpdates.values());
      
      // Sort by timestamp and batch
      const sortedUpdates = updates.sort((a, b) => a.timestamp - b.timestamp);
      const batches = [];
      
      for (let i = 0; i < sortedUpdates.length; i += batchSize) {
        batches.push(sortedUpdates.slice(i, i + batchSize));
      }

      // Process batches sequentially with staggered timing
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        // Small delay between batches to prevent server overload
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        await bulkUpdateMutation.mutateAsync(batch);
      }
    } catch (error) {
      console.error('Error processing pending updates:', error);
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [batchSize, bulkUpdateMutation, pendingUpdates]);

  // Enhanced debounced save function with improved timing
  const debouncedSave = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      processPendingUpdates();
    }, debounceMs);
  }, [processPendingUpdates, debounceMs]);

  // Add optimistic update function
  const addOptimisticUpdate = useCallback((nodeId: string, type: PendingUpdate['type'], updates: any) => {
    const updateId = `${nodeId}_${type}_${Date.now()}`;
    
    setPendingUpdates(prev => {
      const newMap = new Map(prev);
      newMap.set(updateId, {
        id: updateId,
        type,
        nodeId,
        updates,
        timestamp: Date.now()
      });
      return newMap;
    });
    
    // Clear existing timeout and set new one
    debouncedSave();
    setSaveStatus('pending');
  }, [debouncedSave]);

  // Legacy function for backward compatibility
  const addPendingUpdate = useCallback((nodeId: string, updates: any) => {
    addOptimisticUpdate(nodeId, 'position', updates);
  }, [addOptimisticUpdate]);

  // Optimistic update function - updates local state immediately and schedules persistence
  const optimisticUpdate = useCallback((nodeId: string, updates: any) => {
    // Add to pending updates for persistence
    addOptimisticUpdate(nodeId, 'position', updates);
    
    // Return success immediately for optimistic UI updates
    return Promise.resolve();
  }, [addOptimisticUpdate]);

  // Force flush all pending updates immediately
  const flushPendingUpdates = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    return processPendingUpdates();
  }, [processPendingUpdates]);

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      // Flush any pending updates on unmount
      if (pendingUpdates.size > 0) {
        processPendingUpdates();
      }
    };
  }, [processPendingUpdates, pendingUpdates.size]);

  return {
    optimisticUpdate,
    flushPendingUpdates,
    pendingUpdatesCount: pendingUpdates.size,
    isProcessing,
    addPendingUpdate,
    addOptimisticUpdate,
    saveStatus,
    hasUnsavedChanges: pendingUpdates.size > 0
  };
}