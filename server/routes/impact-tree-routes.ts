import express from 'express';
import { z } from 'zod';
import { ImpactTreeService } from '../services/impact-tree-service';
import { isAuthenticated } from '../replitAuth';
import { opportunityWorkflowStatuses } from '@shared/schema';

const router = express.Router();
const treeService = new ImpactTreeService();

// Validation schemas
const createTreeSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  canvasState: z.object({
    zoom: z.number().default(1),
    pan: z.object({
      x: z.number().default(0),
      y: z.number().default(0),
    }),
    orientation: z.enum(['vertical', 'horizontal']).default('vertical'),
  }).optional(),
});

const updateTreeSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  canvasState: z.object({
    zoom: z.number(),
    pan: z.object({
      x: z.number(),
      y: z.number(),
    }),
    orientation: z.enum(['vertical', 'horizontal']).optional(),
  }).optional(),
  nodes: z.array(z.any()).optional(),
  connections: z.array(z.any()).optional(),
});

const createNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['objective', 'outcome', 'opportunity', 'solution', 'assumption', 'metric', 'research']),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  templateData: z.record(z.any()).optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  parentId: z.string().nullable().optional(),
  metadata: z.record(z.any()).optional(),
});

const updateNodeSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  templateData: z.record(z.any()).optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  parentId: z.string().nullable().optional(),
  metadata: z.record(z.any()).optional(),
  isCollapsed: z.boolean().optional(),
  hiddenChildren: z.array(z.string()).optional(),
});

const bulkUpdateNodesSchema = z.object({
  nodeUpdates: z.array(z.object({
    id: z.string(),
    updates: updateNodeSchema,
  })),
});

const updateNodeStatusSchema = z.object({
  workflowStatus: z.enum(opportunityWorkflowStatuses)
});

// Tree CRUD operations
router.get('/api/impact-trees', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const trees = await treeService.getUserTrees(userId);
    res.json(trees);
  } catch (error) {
    console.error('Error fetching trees:', error);
    res.status(500).json({ message: 'Failed to fetch trees' });
  }
});

router.get('/api/impact-trees/:id', isAuthenticated, async (req: any, res) => {
  try {
    const treeId = parseInt(req.params.id);
    const userId = req.user.claims.sub;
    
    if (isNaN(treeId)) {
      return res.status(400).json({ message: 'Invalid tree ID' });
    }

    const tree = await treeService.getTreeWithNodes(treeId, userId);
    if (!tree) {
      return res.status(404).json({ message: 'Tree not found' });
    }

    res.json(tree);
  } catch (error) {
    console.error('Error fetching tree:', error);
    res.status(500).json({ message: 'Failed to fetch tree' });
  }
});

router.post('/api/impact-trees', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const validatedData = createTreeSchema.parse(req.body);
    
    const tree = await treeService.createTree(userId, validatedData);
    res.status(201).json(tree);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Invalid data', 
        errors: error.errors 
      });
    }
    console.error('Error creating tree:', error);
    res.status(500).json({ message: 'Failed to create tree' });
  }
});

router.put('/api/impact-trees/:id', isAuthenticated, async (req: any, res) => {
  try {
    const treeId = parseInt(req.params.id);
    const userId = req.user.claims.sub;
    
    if (isNaN(treeId)) {
      return res.status(400).json({ message: 'Invalid tree ID' });
    }

    const validatedData = updateTreeSchema.parse(req.body);
    
    const updatedTree = await treeService.updateTree(treeId, userId, validatedData);
    if (!updatedTree) {
      return res.status(404).json({ message: 'Tree not found' });
    }

    res.json(updatedTree);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Invalid data', 
        errors: error.errors 
      });
    }
    console.error('Error updating tree:', error);
    res.status(500).json({ message: 'Failed to update tree' });
  }
});

// Rename tree endpoint
router.put('/api/impact-trees/:id/rename', isAuthenticated, async (req: any, res) => {
  try {
    const treeId = parseInt(req.params.id);
    const userId = req.user.claims.sub;
    
    if (isNaN(treeId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid tree ID',
        code: 'INVALID_TREE_ID'
      });
    }
    
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
        code: 'VALIDATION_ERROR',
        details: error.errors
      });
    }
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: error.message,
        code: 'DUPLICATE_NAME'
      });
    }
    
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return res.status(404).json({
        success: false,
        error: 'Tree not found',
        code: 'TREE_NOT_FOUND'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to rename tree',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Get deletion preview endpoint
router.get('/api/impact-trees/:id/delete-preview', isAuthenticated, async (req: any, res) => {
  try {
    const treeId = parseInt(req.params.id);
    const userId = req.user.claims.sub;
    
    if (isNaN(treeId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid tree ID',
        code: 'INVALID_TREE_ID'
      });
    }
    
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
        error: 'Tree not found',
        code: 'TREE_NOT_FOUND'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to get deletion preview',
      code: 'INTERNAL_ERROR'
    });
  }
});

router.delete('/api/impact-trees/:id', isAuthenticated, async (req: any, res) => {
  try {
    console.log('DELETE request received for tree ID:', req.params.id);
    const treeId = parseInt(req.params.id);
    const userId = req.user.claims.sub;
    
    if (isNaN(treeId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid tree ID',
        code: 'INVALID_TREE_ID'
      });
    }

    console.log('About to call deleteTree service with treeId:', treeId, 'userId:', userId);
    const result = await treeService.deleteTree(treeId, userId);
    
    console.log('Delete successful, result:', result);
    
    // Log activity after successful deletion (outside of transaction)
    try {
      console.log('Logging activity after successful deletion...');
      await treeService.logActivity(
        userId,
        treeId,
        null,
        'tree_deleted',
        { treeName: result.treeName, deletedNodes: result.deletedNodes }
      );
      console.log('Activity logged successfully');
    } catch (error) {
      console.error('Failed to log activity after deletion:', error);
    }
    
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
        error: 'Tree not found',
        code: 'TREE_NOT_FOUND'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete tree',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Node CRUD operations
router.get('/api/impact-trees/:id/nodes', isAuthenticated, async (req: any, res) => {
  try {
    const treeId = parseInt(req.params.id);
    const userId = req.user.claims.sub;
    
    if (isNaN(treeId)) {
      return res.status(400).json({ message: 'Invalid tree ID' });
    }

    const nodes = await treeService.getNodesByTree(treeId, userId);
    res.json(nodes);
  } catch (error) {
    console.error('Error fetching nodes:', error);
    res.status(500).json({ message: 'Failed to fetch nodes' });
  }
});

router.post('/api/impact-trees/:id/nodes', isAuthenticated, async (req: any, res) => {
  try {
    const treeId = parseInt(req.params.id);
    const userId = req.user.claims.sub;
    
    if (isNaN(treeId)) {
      return res.status(400).json({ message: 'Invalid tree ID' });
    }

    const validatedData = createNodeSchema.parse(req.body);
    
    const node = await treeService.createNode(treeId, userId, validatedData);
    if (!node) {
      return res.status(404).json({ message: 'Tree not found' });
    }

    res.status(201).json(node);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Invalid data', 
        errors: error.errors 
      });
    }
    console.error('Error creating node:', error);
    res.status(500).json({ message: 'Failed to create node' });
  }
});

// Bulk update nodes endpoint (must come before :nodeId route)
router.put('/api/impact-trees/:id/nodes/bulk-update', isAuthenticated, async (req: any, res) => {
  try {
    const treeId = parseInt(req.params.id);
    const userId = req.user.claims.sub;
    
    if (isNaN(treeId)) {
      return res.status(400).json({ message: 'Invalid tree ID' });
    }

    console.log('Bulk update request:', { treeId, userId, body: req.body });
    
    const validatedData = bulkUpdateNodesSchema.parse(req.body);
    console.log('Validated data:', validatedData);
    
    const updatedNodes = await treeService.bulkUpdateNodes(treeId, userId, validatedData.nodeUpdates);
    console.log('Updated nodes count:', updatedNodes.length);
    
    // Return success even if no nodes were updated (may be normal for optimistic updates)
    res.json({
      message: 'Bulk update processed successfully',
      updatedCount: updatedNodes.length,
      nodes: updatedNodes,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return res.status(400).json({ 
        message: 'Invalid data', 
        errors: error.errors 
      });
    }
    console.error('Error bulk updating nodes:', error);
    res.status(500).json({ message: 'Failed to bulk update nodes' });
  }
});

router.put('/api/impact-trees/:id/nodes/:nodeId', isAuthenticated, async (req: any, res) => {
  try {
    const treeId = parseInt(req.params.id);
    const nodeId = req.params.nodeId;
    const userId = req.user.claims.sub;
    
    if (isNaN(treeId)) {
      return res.status(400).json({ message: 'Invalid tree ID' });
    }

    const validatedData = updateNodeSchema.parse(req.body);
    
    const updatedNode = await treeService.updateNode(treeId, nodeId, userId, validatedData);
    if (!updatedNode) {
      return res.status(404).json({ message: 'Node not found' });
    }

    res.json(updatedNode);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Invalid data', 
        errors: error.errors 
      });
    }
    console.error('Error updating node:', error);
    res.status(500).json({ message: 'Failed to update node' });
  }
});

router.delete('/api/impact-trees/:id/nodes/:nodeId', isAuthenticated, async (req: any, res) => {
  try {
    const treeId = parseInt(req.params.id);
    const nodeId = req.params.nodeId;
    const userId = req.user.claims.sub;
    
    if (isNaN(treeId)) {
      return res.status(400).json({ message: 'Invalid tree ID' });
    }

    const deleted = await treeService.deleteNode(treeId, nodeId, userId);
    if (!deleted) {
      return res.status(404).json({ message: 'Node not found' });
    }

    res.json({ message: 'Node deleted successfully' });
  } catch (error) {
    console.error('Error deleting node:', error);
    res.status(500).json({ message: 'Failed to delete node' });
  }
});

router.get('/api/impact-trees/:id/nodes/:nodeId/children', isAuthenticated, async (req: any, res) => {
  try {
    const treeId = parseInt(req.params.id);
    const nodeId = req.params.nodeId;
    const userId = req.user.claims.sub;
    
    if (isNaN(treeId)) {
      return res.status(400).json({ message: 'Invalid tree ID' });
    }

    const children = await treeService.getNodeChildren(treeId, nodeId, userId);
    res.json(children);
  } catch (error) {
    console.error('Error fetching node children:', error);
    res.status(500).json({ message: 'Failed to fetch node children' });
  }
});

// Status management endpoints
router.patch('/api/impact-trees/:treeId/nodes/:nodeId/status', isAuthenticated, async (req: any, res) => {
  try {
    const treeId = parseInt(req.params.treeId);
    const nodeId = req.params.nodeId;
    const userId = req.user.claims.sub;
    
    if (isNaN(treeId)) {
      return res.status(400).json({ message: 'Invalid tree ID' });
    }
    
    const { workflowStatus } = updateNodeStatusSchema.parse(req.body);
    
    const updatedNode = await treeService.updateNodeStatus(treeId, nodeId, userId, workflowStatus);
    
    if (!updatedNode) {
      return res.status(404).json({ message: "Node not found" });
    }
    
    res.json(updatedNode);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid status", errors: error.errors });
    }
    console.error('Status update error:', error);
    res.status(500).json({ message: "Failed to update node status" });
  }
});

// Migration endpoint (development only)
router.post('/api/impact-trees/migrate-statuses', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    await treeService.migrateOpportunityStatuses(userId);
    res.json({ message: "Migration completed successfully" });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ message: "Migration failed" });
  }
});

export default router;