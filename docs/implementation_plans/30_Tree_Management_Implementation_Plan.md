# 🔧 Tree Management Features Implementation Plan

> **Detailed technical implementation plan for tree rename and delete functionality**
> **Priority**: P2 | **Complexity**: Medium | **Effort**: 24 hours

---

## 📋 **Implementation Overview**

### **Objective**
Implement comprehensive tree management features allowing Product Managers to rename and delete impact trees from both the home page and canvas interface, with proper confirmation flows and cascade deletion of associated data.

### **Current State**
Impact trees can be created and viewed, but users cannot rename them to better reflect their evolving strategic focus or delete obsolete trees. This creates workspace clutter and makes strategic organization difficult.

### **Target State**
Users can easily rename trees inline from home page or canvas header, and safely delete trees with clear confirmation and automatic cleanup of all associated nodes and connections.

---

## 🎯 **Technical Requirements**

### **Frontend Requirements (React + TypeScript)**
- [ ] **Home Page Components**: Inline rename/delete controls for tree list
- [ ] **Canvas Header**: Clickable tree name with edit functionality
- [ ] **Confirmation Modals**: Delete confirmation with impact preview
- [ ] **State Management**: TanStack Query integration with cache invalidation
- [ ] **Error Handling**: User-friendly error states and loading indicators

### **Backend Requirements (Node.js + Express)**
- [ ] **Rename API**: PUT endpoint for tree name updates
- [ ] **Delete API**: DELETE endpoint with cascade operations
- [ ] **Validation**: Input validation and authorization checks
- [ ] **Transaction Safety**: Atomic operations with rollback capability

### **Database Requirements**
- [ ] **Cascade Constraints**: Proper foreign key relationships
- [ ] **Performance Optimization**: Indexes for efficient tree operations
- [ ] **Data Integrity**: Prevent orphaned records and ensure consistency

---

## 🏗️ **Implementation Strategy**

### **Phase 1: Database Foundation (4 hours)**

#### **Database Schema Enhancements**
```sql
-- Ensure cascade deletion constraints are properly configured
ALTER TABLE tree_nodes 
DROP CONSTRAINT IF EXISTS fk_tree_nodes_tree_id;

ALTER TABLE tree_nodes 
ADD CONSTRAINT fk_tree_nodes_tree_id 
FOREIGN KEY (tree_id) REFERENCES impact_trees(id) 
ON DELETE CASCADE;

-- Add index for efficient tree name lookups
CREATE INDEX IF NOT EXISTS idx_impact_trees_user_name 
ON impact_trees(user_id, name);

-- Add index for efficient node cleanup operations
CREATE INDEX IF NOT EXISTS idx_tree_nodes_tree_id_delete 
ON tree_nodes(tree_id) WHERE tree_id IS NOT NULL;
```

#### **Database Migration Script**
```typescript
// drizzle migration for cascade constraints
import { sql } from "drizzle-orm";

export async function up(db: any) {
  // Add cascade deletion constraint
  await db.execute(sql`
    ALTER TABLE tree_nodes 
    DROP CONSTRAINT IF EXISTS fk_tree_nodes_tree_id;
    
    ALTER TABLE tree_nodes 
    ADD CONSTRAINT fk_tree_nodes_tree_id 
    FOREIGN KEY (tree_id) REFERENCES impact_trees(id) 
    ON DELETE CASCADE;
  `);

  // Add performance indexes
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_impact_trees_user_name 
    ON impact_trees(user_id, name);
  `);
}
```

### **Phase 2: Backend API Implementation (8 hours)**

#### **Enhanced Tree Service**
```typescript
// server/services/impact-tree-service.ts
import { eq, and, count } from "drizzle-orm";
import { db } from "../db";
import { impactTrees, treeNodes } from "@shared/schema";

export class ImpactTreeService {
  /**
   * Rename an impact tree
   * @param treeId - Tree ID to rename
   * @param userId - User ID for authorization
   * @param newName - New tree name
   * @returns Updated tree or null if not found
   */
  async renameTree(
    treeId: number, 
    userId: string, 
    newName: string
  ): Promise<ImpactTree | null> {
    // Validate input
    if (!newName || newName.trim().length === 0) {
      throw new Error('Tree name cannot be empty');
    }

    if (newName.length > 100) {
      throw new Error('Tree name cannot exceed 100 characters');
    }

    // Check for duplicate names
    const existingTree = await db
      .select()
      .from(impactTrees)
      .where(
        and(
          eq(impactTrees.user_id, userId),
          eq(impactTrees.name, newName.trim())
        )
      )
      .limit(1);

    if (existingTree.length > 0 && existingTree[0].id !== treeId) {
      throw new Error('A tree with this name already exists');
    }

    // Update tree name
    const [updatedTree] = await db
      .update(impactTrees)
      .set({
        name: newName.trim(),
        updatedAt: new Date()
      })
      .where(
        and(
          eq(impactTrees.id, treeId),
          eq(impactTrees.user_id, userId)
        )
      )
      .returning();

    if (!updatedTree) {
      throw new Error('Tree not found or access denied');
    }

    // Log activity
    await this.logActivity(
      userId,
      'tree_renamed',
      `Renamed tree to "${newName}"`,
      { treeId, oldName: updatedTree.name, newName }
    );

    return updatedTree;
  }

  /**
   * Delete an impact tree and all associated data
   * @param treeId - Tree ID to delete
   * @param userId - User ID for authorization
   * @returns Success status and deletion summary
   */
  async deleteTree(
    treeId: number, 
    userId: string
  ): Promise<{ success: boolean; deletedNodes: number; treeName: string }> {
    // Start transaction for atomic operation
    return await db.transaction(async (tx) => {
      // Verify tree ownership
      const tree = await tx
        .select()
        .from(impactTrees)
        .where(
          and(
            eq(impactTrees.id, treeId),
            eq(impactTrees.user_id, userId)
          )
        )
        .limit(1);

      if (!tree.length) {
        throw new Error('Tree not found or access denied');
      }

      const treeName = tree[0].name;

      // Count nodes for summary
      const nodeCount = await tx
        .select({ count: count() })
        .from(treeNodes)
        .where(eq(treeNodes.treeId, treeId));

      const deletedNodes = nodeCount[0]?.count || 0;

      // Delete tree (cascade will handle nodes)
      await tx
        .delete(impactTrees)
        .where(eq(impactTrees.id, treeId));

      // Log activity
      await this.logActivity(
        userId,
        'tree_deleted',
        `Deleted tree "${treeName}" with ${deletedNodes} nodes`,
        { treeId, treeName, deletedNodes }
      );

      return {
        success: true,
        deletedNodes,
        treeName
      };
    });
  }

  /**
   * Get tree deletion preview
   * @param treeId - Tree ID to preview
   * @param userId - User ID for authorization
   * @returns Preview information for confirmation
   */
  async getTreeDeletionPreview(
    treeId: number, 
    userId: string
  ): Promise<{ treeName: string; nodeCount: number; connectionCount: number }> {
    // Verify tree ownership
    const tree = await db
      .select()
      .from(impactTrees)
      .where(
        and(
          eq(impactTrees.id, treeId),
          eq(impactTrees.user_id, userId)
        )
      )
      .limit(1);

    if (!tree.length) {
      throw new Error('Tree not found or access denied');
    }

    // Count associated data
    const nodeCount = await db
      .select({ count: count() })
      .from(treeNodes)
      .where(eq(treeNodes.treeId, treeId));

    // Calculate connection count from nodes
    const nodes = await db
      .select()
      .from(treeNodes)
      .where(eq(treeNodes.treeId, treeId));

    const connectionCount = nodes.filter(node => node.parentId !== null).length;

    return {
      treeName: tree[0].name,
      nodeCount: nodeCount[0]?.count || 0,
      connectionCount
    };
  }
}
```

#### **API Route Implementation**
```typescript
// server/routes/impact-tree-routes.ts
import express from 'express';
import { z } from 'zod';
import { ImpactTreeService } from '../services/impact-tree-service';
import { isAuthenticated } from '../middleware/auth';

const router = express.Router();
const treeService = new ImpactTreeService();

// Rename tree endpoint
router.put('/impact-trees/:id/rename', isAuthenticated, async (req, res) => {
  try {
    const treeId = parseInt(req.params.id);
    const userId = req.user!.id;
    
    // Validate request body
    const renameSchema = z.object({
      name: z.string().trim().min(1).max(100)
    });
    
    const { name } = renameSchema.parse(req.body);
    
    const updatedTree = await treeService.renameTree(treeId, userId, name);
    
    res.json({
      success: true,
      data: updatedTree,
      message: 'Tree renamed successfully'
    });
  } catch (error) {
    console.error('Error renaming tree:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tree name',
        details: error.errors
      });
    }
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return res.status(404).json({
        success: false,
        error: 'Tree not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to rename tree'
    });
  }
});

// Delete tree endpoint
router.delete('/impact-trees/:id', isAuthenticated, async (req, res) => {
  try {
    const treeId = parseInt(req.params.id);
    const userId = req.user!.id;
    
    const result = await treeService.deleteTree(treeId, userId);
    
    res.json({
      success: true,
      data: result,
      message: `Tree "${result.treeName}" deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting tree:', error);
    
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return res.status(404).json({
        success: false,
        error: 'Tree not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete tree'
    });
  }
});

// Get deletion preview endpoint
router.get('/impact-trees/:id/delete-preview', isAuthenticated, async (req, res) => {
  try {
    const treeId = parseInt(req.params.id);
    const userId = req.user!.id;
    
    const preview = await treeService.getTreeDeletionPreview(treeId, userId);
    
    res.json({
      success: true,
      data: preview
    });
  } catch (error) {
    console.error('Error getting deletion preview:', error);
    
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return res.status(404).json({
        success: false,
        error: 'Tree not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to get deletion preview'
    });
  }
});

export default router;
```

### **Phase 3: Frontend Implementation (10 hours)**

#### **Tree Management Hook**
```typescript
// client/src/hooks/use-tree-management.ts
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
      queryClient.invalidateQueries({ queryKey: ['impact-trees'] });
      queryClient.invalidateQueries({ queryKey: ['impact-tree', data.data.id] });
      
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
      return await apiRequest(`/api/impact-trees/${treeId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: (data) => {
      // Invalidate tree queries
      queryClient.invalidateQueries({ queryKey: ['impact-trees'] });
      
      toast({
        title: 'Tree deleted',
        description: `"${data.data.treeName}" and ${data.data.deletedNodes} nodes deleted`,
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
    deleteTree: deleteTreeMutation.mutate,
    getDeletionPreview,
    isRenaming: renameTreeMutation.isPending,
    isDeleting: deleteTreeMutation.isPending
  };
}
```

#### **Inline Rename Component**
```typescript
// client/src/components/inline-rename.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2, Check, X } from 'lucide-react';

interface InlineRenameProps {
  value: string;
  onSave: (newValue: string) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export function InlineRename({ 
  value, 
  onSave, 
  onCancel, 
  isLoading = false,
  placeholder = 'Enter name...',
  className = ''
}: InlineRenameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditValue(value);
    setIsEditing(true);
  };

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== value) {
      onSave(trimmedValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1"
        />
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isLoading || !editValue.trim()}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="flex-1 truncate">{value}</span>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleStartEdit}
        disabled={isLoading}
      >
        <Edit2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

#### **Delete Confirmation Modal**
```typescript
// client/src/components/delete-confirmation-modal.tsx
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  treeName: string;
  nodeCount: number;
  connectionCount: number;
  isDeleting?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  treeName,
  nodeCount,
  connectionCount,
  isDeleting = false
}: DeleteConfirmationModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Tree
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              Are you sure you want to delete <strong>&quot;{treeName}&quot;</strong>?
            </p>
            
            <div className="bg-destructive/10 p-3 rounded-md">
              <p className="text-sm font-medium mb-2">This will permanently delete:</p>
              <ul className="text-sm space-y-1">
                <li>• {nodeCount} nodes</li>
                <li>• {connectionCount} connections</li>
                <li>• All associated data</li>
              </ul>
            </div>
            
            <p className="text-sm text-muted-foreground">
              <strong>This action cannot be undone.</strong>
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete Tree'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

#### **Enhanced Home Page Tree List**
```typescript
// client/src/pages/home.tsx - Enhanced tree list item
import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InlineRename } from '@/components/inline-rename';
import { DeleteConfirmationModal } from '@/components/delete-confirmation-modal';
import { useTreeManagement } from '@/hooks/use-tree-management';

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

  const handleDeleteConfirm = () => {
    deleteTree(tree.id);
    setShowDeleteModal(false);
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
      <div className="flex-1 min-w-0">
        <InlineRename
          value={tree.name}
          onSave={handleRename}
          isLoading={isRenaming}
          placeholder="Enter tree name..."
          className="mb-2"
        />
        <p className="text-sm text-muted-foreground">
          {tree.nodeCount} nodes • Created {new Date(tree.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="flex items-center gap-2 ml-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate(tree.id)}
        >
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
    </div>
  );
}
```

#### **Enhanced Canvas Header**
```typescript
// client/src/components/canvas-header.tsx - Add rename functionality
import React from 'react';
import { InlineRename } from '@/components/inline-rename';
import { useTreeManagement } from '@/hooks/use-tree-management';

interface CanvasHeaderProps {
  impactTree?: ImpactTree;
  isNew?: boolean;
  isVisible?: boolean;
  magneticZoneRef?: React.RefObject<HTMLDivElement>;
}

export function CanvasHeader({ 
  impactTree, 
  isNew, 
  isVisible = true, 
  magneticZoneRef 
}: CanvasHeaderProps) {
  const { renameTree, isRenaming } = useTreeManagement();

  const handleRename = (newName: string) => {
    if (impactTree) {
      renameTree({ treeId: impactTree.id, name: newName });
    }
  };

  return (
    <div
      ref={magneticZoneRef}
      className={`canvas-header ${isVisible ? 'visible' : 'hidden'}`}
    >
      <div className="canvas-header-content">
        <div className="flex items-center gap-4">
          <Link to="/" className="back-button">
            ← Back to Trees
          </Link>
          
          {impactTree && !isNew && (
            <InlineRename
              value={impactTree.name}
              onSave={handleRename}
              isLoading={isRenaming}
              placeholder="Enter tree name..."
              className="tree-name-editor"
            />
          )}
          
          {isNew && (
            <span className="text-muted-foreground">New Tree</span>
          )}
        </div>
        
        <UserProfileMenu />
      </div>
    </div>
  );
}
```

### **Phase 4: Testing & Quality Assurance (2 hours)**

#### **Unit Tests**
```typescript
// __tests__/tree-management.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTreeManagement } from '@/hooks/use-tree-management';
import { createWrapper } from '@/test/test-utils';

describe('useTreeManagement', () => {
  it('should rename tree successfully', async () => {
    const { result } = renderHook(() => useTreeManagement(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      result.current.renameTree({ treeId: 1, name: 'New Tree Name' });
    });

    expect(result.current.isRenaming).toBe(false);
  });

  it('should delete tree with confirmation', async () => {
    const { result } = renderHook(() => useTreeManagement(), {
      wrapper: createWrapper()
    });

    const preview = await result.current.getDeletionPreview(1);
    expect(preview).toHaveProperty('treeName');
    expect(preview).toHaveProperty('nodeCount');
    expect(preview).toHaveProperty('connectionCount');
  });
});
```

#### **Integration Tests**
```typescript
// __tests__/tree-management-integration.test.ts
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TreeListItem } from '@/pages/home';
import { createWrapper } from '@/test/test-utils';

describe('Tree Management Integration', () => {
  it('should show rename interface when edit button is clicked', async () => {
    const mockTree = {
      id: 1,
      name: 'Test Tree',
      nodeCount: 5,
      createdAt: new Date().toISOString()
    };

    render(
      <TreeListItem tree={mockTree} onNavigate={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Tree')).toBeInTheDocument();
    });
  });

  it('should show delete confirmation modal', async () => {
    const mockTree = {
      id: 1,
      name: 'Test Tree',
      nodeCount: 5,
      createdAt: new Date().toISOString()
    };

    render(
      <TreeListItem tree={mockTree} onNavigate={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Delete Tree')).toBeInTheDocument();
    });
  });
});
```

---

## 🎯 **Quality Assurance Checklist**

### **Backend Testing**
- [ ] Rename API validates input properly
- [ ] Delete API performs cascade deletion
- [ ] Authorization checks prevent unauthorized access
- [ ] Error responses include proper status codes
- [ ] Database constraints prevent data corruption

### **Frontend Testing**
- [ ] Inline rename works in both home and canvas
- [ ] Delete confirmation shows correct information
- [ ] Loading states display during operations
- [ ] Error handling shows user-friendly messages
- [ ] Cache invalidation updates UI correctly

### **User Experience Testing**
- [ ] Rename is intuitive and responsive
- [ ] Delete confirmation is clear and safe
- [ ] Operations provide immediate feedback
- [ ] Mobile interface works properly
- [ ] Keyboard navigation is accessible

### **Performance Testing**
- [ ] Rename operations are fast (&lt;200ms)
- [ ] Delete operations complete quickly
- [ ] Large tree deletion doesn't timeout
- [ ] UI remains responsive during operations
- [ ] Database queries are optimized

---

## 🚀 **Deployment Strategy**

### **Database Migration**
```bash
# 1. Apply database migrations
npm run db:push

# 2. Verify cascade constraints
npm run db:check

# 3. Test with sample data
npm run db:seed:test
```

### **Feature Rollout**
```bash
# 1. Deploy backend changes
npm run build:server
npm run deploy:backend

# 2. Deploy frontend changes
npm run build:client
npm run deploy:frontend

# 3. Monitor for errors
npm run logs:monitor
```

### **Rollback Plan**
```bash
# If issues arise, rollback database changes
npm run db:rollback

# Revert to previous deployment
npm run deploy:rollback
```

---

## 📊 **Success Metrics**

### **Technical Metrics**
- **API Response Time**: &lt;200ms for rename, &lt;500ms for delete
- **Error Rate**: &lt;1% for all operations
- **Database Performance**: Cascade deletion &lt;1000ms
- **Frontend Performance**: UI updates &lt;100ms

### **User Experience Metrics**
- **Rename Usage**: 50%+ users rename at least one tree
- **Delete Usage**: 25%+ users delete at least one tree
- **Error Recovery**: 95%+ users complete operations successfully
- **User Satisfaction**: 4.5+ rating for tree management features

### **Business Metrics**
- **Workspace Organization**: Reduced average trees per user
- **User Retention**: Improved monthly active users
- **Feature Adoption**: 75%+ users try rename within first week
- **Support Tickets**: No increase in deletion-related support

---

## 🔗 **Related Documentation**

### **Technical References**
- [Feature Specification: Tree Management Features](../new_features/30_Tree_Management_Features.md)
- [API Design Guidelines](../development/api_design_guidelines.md)
- [Database Design Patterns](../development/database_design_patterns.md)

### **User Experience**
- [Canvas Performance Guidelines](../development/canvas_performance_guidelines.md)
- [React Component Patterns](../development/coding_standards.md)

### **Testing**
- [Testing Standards](../development/testing_standards.md)
- [Integration Testing Patterns](../development/integration_testing.md)

---

## 📋 **Implementation Checklist**

### **Phase 1: Database (4 hours)**
- [ ] Add cascade deletion constraints
- [ ] Create performance indexes
- [ ] Test database migrations
- [ ] Verify data integrity

### **Phase 2: Backend (8 hours)**
- [ ] Implement rename service method
- [ ] Implement delete service method
- [ ] Create deletion preview endpoint
- [ ] Add comprehensive error handling
- [ ] Write unit tests for services

### **Phase 3: Frontend (10 hours)**
- [ ] Create tree management hook
- [ ] Implement inline rename component
- [ ] Build delete confirmation modal
- [ ] Enhance home page tree list
- [ ] Update canvas header
- [ ] Add loading and error states

### **Phase 4: Testing (2 hours)**
- [ ] Write component tests
- [ ] Create integration tests
- [ ] Test error scenarios
- [ ] Verify accessibility
- [ ] Performance testing

### **Total Estimated Effort: 24 hours**
