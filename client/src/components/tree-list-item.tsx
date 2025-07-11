import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, ExternalLink } from 'lucide-react';
import { InlineRename } from '@/components/inline-rename';
import { DeleteConfirmationModal } from '@/components/delete-confirmation-modal';
import { useTreeManagement } from '@/hooks/use-tree-management';
import { ImpactTree } from '@shared/schema';
import { Link } from 'wouter';

interface TreeListItemProps {
  tree: ImpactTree & { nodeCount: number };
  onNavigate: (treeId: number) => void;
}

export function TreeListItem({ tree, onNavigate }: TreeListItemProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletionPreview, setDeletionPreview] = useState<{
    treeName: string;
    nodeCount: number;
    connectionCount: number;
  } | null>(null);

  const { 
    renameTree, 
    deleteTree, 
    getDeletionPreview, 
    isRenaming, 
    isDeleting 
  } = useTreeManagement();

  const handleRename = (newName: string) => {
    renameTree({ treeId: tree.id, name: newName });
  };

  const handleDeleteClick = async () => {
    try {
      const preview = await getDeletionPreview(tree.id);
      setDeletionPreview(preview);
      setShowDeleteModal(true);
    } catch (error) {
      console.error('Failed to get deletion preview:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteTree(tree.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete tree:', error);
      // Keep modal open if deletion fails
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <InlineRename
              value={tree.name}
              onSave={handleRename}
              isLoading={isRenaming}
              placeholder="Enter tree name..."
              className="mb-2"
            />
            {tree.description && (
              <CardDescription>{tree.description}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate(tree.id)}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Open
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteClick}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>
            Updated {new Date(tree.updatedAt).toLocaleDateString()}
          </span>
          <span>
            {tree.nodeCount} nodes
          </span>
        </div>
      </CardContent>

      {deletionPreview && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          treeName={deletionPreview.treeName}
          nodeCount={deletionPreview.nodeCount}
          connectionCount={deletionPreview.connectionCount}
          isDeleting={isDeleting}
        />
      )}
    </Card>
  );
}