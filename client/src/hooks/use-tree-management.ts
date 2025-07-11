import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export interface TreeDeletionPreview {
  treeName: string;
  nodeCount: number;
  connectionCount: number;
}

export function useTreeManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const renameTreeMutation = useMutation({
    mutationFn: async ({ treeId, name }: { treeId: number; name: string }) => {
      return await apiRequest(`/api/impact-trees/${treeId}/rename`, {
        method: 'PUT',
        body: { name }
      });
    },
    onSuccess: (data) => {
      // Invalidate tree queries
      queryClient.invalidateQueries({ queryKey: ['/api/impact-trees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/impact-trees', data.data.id] });
      
      toast({
        title: 'Tree renamed',
        description: `Tree renamed to "${data.data.name}"`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to rename tree',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  });

  const deleteTreeMutation = useMutation({
    mutationFn: async (treeId: number) => {
      console.log('Delete mutation called with treeId:', treeId);
      try {
        const result = await apiRequest(`/api/impact-trees/${treeId}`, {
          method: 'DELETE'
        });
        console.log('Delete API response:', result);
        return result;
      } catch (error) {
        console.error('Delete API error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate tree queries
      queryClient.invalidateQueries({ queryKey: ['/api/impact-trees'] });
      
      toast({
        title: 'Tree deleted',
        description: `"${data.treeName}" and ${data.deletedNodes} nodes deleted`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete tree',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  });

  const getDeletionPreview = async (treeId: number): Promise<TreeDeletionPreview> => {
    const response = await apiRequest(`/api/impact-trees/${treeId}/delete-preview`);
    return response.data;
  };

  return {
    renameTree: renameTreeMutation.mutate,
    deleteTree: deleteTreeMutation.mutateAsync,
    getDeletionPreview,
    isRenaming: renameTreeMutation.isPending,
    isDeleting: deleteTreeMutation.isPending
  };
}