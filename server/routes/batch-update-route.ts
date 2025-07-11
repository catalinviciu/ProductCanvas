import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { treeNodes } from '../../shared/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { isAuthenticated } from '../replitAuth';

const router = Router();

// Validation schema for batch update request
const BatchUpdateSchema = z.object({
  nodes: z.array(z.object({
    id: z.string(),
    position: z.object({
      x: z.number(),
      y: z.number()
    })
  })).min(1).max(100) // Limit batch size for performance
});

// Batch update endpoint
router.put('/api/impact-trees/:treeId/nodes/batch', isAuthenticated, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const treeId = parseInt(req.params.treeId);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate request body
    const validation = BatchUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid request format',
        details: validation.error.errors
      });
    }

    const { nodes } = validation.data;

    // Verify tree ownership
    const tree = await db.query.impactTrees.findFirst({
      where: (trees, { eq, and }) => and(
        eq(trees.id, treeId),
        eq(trees.userId, userId)
      )
    });

    if (!tree) {
      return res.status(404).json({ error: 'Tree not found' });
    }

    // Verify all nodes belong to this tree
    const nodeIds = nodes.map(n => n.id);
    const existingNodes = await db.query.treeNodes.findMany({
      where: (nodes, { eq, and, inArray }) => and(
        eq(nodes.treeId, treeId),
        inArray(nodes.id, nodeIds)
      ),
      columns: { id: true }
    });

    const existingNodeIds = new Set(existingNodes.map(n => n.id));
    const invalidNodes = nodeIds.filter(id => !existingNodeIds.has(id));

    if (invalidNodes.length > 0) {
      return res.status(400).json({ 
        error: 'Invalid nodes',
        invalid: invalidNodes
      });
    }

    // Perform batch update using transaction
    const updateResults = await db.transaction(async (tx) => {
      const results = await Promise.allSettled(
        nodes.map(async (node) => {
          const result = await tx
            .update(treeNodes)
            .set({
              position: node.position,
              updatedAt: new Date()
            })
            .where(
              and(
                eq(treeNodes.id, node.id),
                eq(treeNodes.treeId, treeId)
              )
            )
            .returning({ id: treeNodes.id });

          if (result.length === 0) {
            throw new Error(`Node ${node.id} not found or not updated`);
          }

          return node.id;
        })
      );

      return results;
    });

    // Separate successful and failed updates
    const successful = [];
    const failed = [];

    updateResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push(nodes[index].id);
        console.error(`Failed to update node ${nodes[index].id}:`, result.reason);
      }
    });

    // Log activity for successful updates
    if (successful.length > 0) {
      try {
        await db.insert(userActivities).values({
          userId,
          treeId,
          activityType: 'bulk_position_update',
          description: `Updated positions for ${successful.length} nodes`,
          metadata: {
            nodeCount: successful.length,
            duration: Date.now() - startTime
          }
        });
      } catch (error) {
        console.error('Failed to log activity:', error);
        // Don't fail the main operation for logging issues
      }
    }

    const duration = Date.now() - startTime;
    
    // Performance monitoring
    console.log(`Batch update completed: ${successful.length} successful, ${failed.length} failed in ${duration}ms`);

    res.json({
      success: successful.length > 0,
      updated: successful.length,
      failed: failed.length > 0 ? failed : undefined,
      timestamp: new Date().toISOString(),
      duration,
      // Include performance metrics for monitoring
      performance: {
        totalNodes: nodes.length,
        successRate: (successful.length / nodes.length) * 100,
        averageTimePerNode: duration / nodes.length
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Batch update error:', error);
    
    res.status(500).json({ 
      error: 'Batch update failed',
      duration,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint for batch operations
router.get('/api/impact-trees/:treeId/nodes/batch/health', isAuthenticated, async (req, res) => {
  const treeId = parseInt(req.params.treeId);
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Simple query to check database responsiveness
    const startTime = Date.now();
    const nodeCount = await db.query.treeNodes.findMany({
      where: (nodes, { eq }) => eq(nodes.treeId, treeId),
      columns: { id: true }
    });
    const queryTime = Date.now() - startTime;

    res.json({
      healthy: true,
      nodeCount: nodeCount.length,
      queryTime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;