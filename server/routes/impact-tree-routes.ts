import express from 'express';
import { z } from 'zod';
import { ImpactTreeService } from '../services/impact-tree-service';
import { isAuthenticated } from '../replitAuth';

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
});

const bulkUpdateNodesSchema = z.object({
  nodeUpdates: z.array(z.object({
    id: z.string(),
    updates: updateNodeSchema,
  })),
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

router.delete('/api/impact-trees/:id', isAuthenticated, async (req: any, res) => {
  try {
    const treeId = parseInt(req.params.id);
    const userId = req.user.claims.sub;
    
    if (isNaN(treeId)) {
      return res.status(400).json({ message: 'Invalid tree ID' });
    }

    const deleted = await treeService.deleteTree(treeId, userId);
    if (!deleted) {
      return res.status(404).json({ message: 'Tree not found' });
    }

    res.json({ message: 'Tree deleted successfully' });
  } catch (error) {
    console.error('Error deleting tree:', error);
    res.status(500).json({ message: 'Failed to delete tree' });
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

// Bulk update nodes endpoint
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

export default router;