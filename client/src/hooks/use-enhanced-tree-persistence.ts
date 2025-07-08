import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { TreeNode, NodeConnection, CanvasState } from '@shared/schema';

interface EnhancedTreeUpdate {
  nodes: TreeNode[];
  connections: NodeConnection[];
  canvasState: CanvasState;
  activityType?: string;
  sessionId?: string;
}

interface UserProgressAnalytics {
  totalTrees: number;
  treesCompleted: number;
  avgCompletionRate: number;
  totalTimeSpent: number;
  mostActiveTreeId: number | null;
  recentActivity: any[];
  progressTrend: 'improving' | 'stable' | 'declining';
}

export function useEnhancedTreePersistence(treeId: number) {
  const { toast } = useToast();

  // Enhanced save mutation with activity tracking
  const saveTreeMutation = useMutation({
    mutationFn: async (data: EnhancedTreeUpdate) => {
      const response = await fetch(`/api/impact-trees/${treeId}/enhanced`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save tree with enhanced tracking');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/impact-trees', treeId] });
      queryClient.invalidateQueries({ queryKey: ['/api/impact-trees'] });
      
      // Show success toast
      toast({
        title: "Tree saved successfully",
        description: "Your changes have been saved with activity tracking.",
      });
    },
    onError: (error) => {
      console.error('Enhanced tree save error:', error);
      toast({
        title: "Save failed",
        description: "Failed to save tree changes. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Get tree versions
  const { data: versions, isLoading: versionsLoading } = useQuery({
    queryKey: ['/api/impact-trees', treeId, 'versions'],
    queryFn: async () => {
      const response = await fetch(`/api/impact-trees/${treeId}/versions`);
      if (!response.ok) {
        throw new Error('Failed to fetch tree versions');
      }
      return response.json();
    },
  });

  // Enhanced save function with automatic activity type detection
  const saveTreeWithTracking = (
    nodes: TreeNode[],
    connections: NodeConnection[],
    canvasState: CanvasState,
    activityType?: string
  ) => {
    // Auto-detect activity type if not provided
    const detectedActivityType = activityType || detectActivityType(nodes, connections);
    
    // Generate session ID if not exists
    const sessionId = getOrCreateSessionId();

    saveTreeMutation.mutate({
      nodes,
      connections,
      canvasState,
      activityType: detectedActivityType,
      sessionId,
    });
  };

  return {
    saveTreeWithTracking,
    versions,
    versionsLoading,
    isSaving: saveTreeMutation.isPending,
    saveError: saveTreeMutation.error,
  };
}

// Hook for user progress analytics
export function useUserProgressAnalytics(userId: string) {
  return useQuery({
    queryKey: ['/api/users', userId, 'progress'],
    queryFn: async (): Promise<UserProgressAnalytics> => {
      const response = await fetch(`/api/users/${userId}/progress`);
      if (!response.ok) {
        throw new Error('Failed to fetch user progress analytics');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook for analytics dashboard
export function useAnalyticsDashboard() {
  return useQuery({
    queryKey: ['/api/analytics/dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch analytics dashboard');
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
}

// Helper function to detect activity type based on changes
function detectActivityType(nodes: TreeNode[], connections: NodeConnection[]): string {
  // This is a simplified version - in practice, you'd compare with previous state
  // For now, we'll use a basic heuristic
  
  if (nodes.length === 0) return 'tree_cleared';
  if (connections.length === 0 && nodes.length === 1) return 'first_node_created';
  
  // Check if any nodes have recently completed template fields
  const hasCompletedTemplates = nodes.some(node => {
    const templateData = node.templateData || {};
    const completedFields = Object.values(templateData).filter(
      value => value !== null && value !== undefined && value !== ''
    );
    return completedFields.length > 0;
  });
  
  if (hasCompletedTemplates) return 'template_updated';
  
  return 'manual_save';
}

// Helper function to get or create session ID
function getOrCreateSessionId(): string {
  const storageKey = 'impact_tree_session_id';
  let sessionId = sessionStorage.getItem(storageKey);
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
}

// Hook for AI processing status (for future AI features)
export function useAIProcessingStatus() {
  return useQuery({
    queryKey: ['/api/ai/trees/batch'],
    queryFn: async () => {
      const response = await fetch('/api/ai/trees/batch?limit=1');
      if (!response.ok) {
        throw new Error('Failed to fetch AI processing status');
      }
      return response.json();
    },
    enabled: false, // Only enable when needed
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}