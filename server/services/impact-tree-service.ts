import { eq, and, desc, inArray, count, sql } from "drizzle-orm";
import { db } from "../db";
import { impactTrees, treeNodes, userActivities, opportunityWorkflowStatuses, workflowStatuses } from "@shared/schema";
import type { ImpactTree, TreeNode, TreeNodeRecord, InsertTreeNode, OpportunityWorkflowStatus, WorkflowStatus } from "@shared/schema";

export class ImpactTreeService {
  
  // Tree operations
  async getUserTrees(userId: string): Promise<Array<ImpactTree & { nodeCount: number }>> {
    const trees = await db
      .select({
        id: impactTrees.id,
        user_id: impactTrees.user_id,
        name: impactTrees.name,
        description: impactTrees.description,
        canvasState: impactTrees.canvasState,
        treeStructure: impactTrees.treeStructure,
        userMetrics: impactTrees.userMetrics,
        aiMetadata: impactTrees.aiMetadata,
        processingVersion: impactTrees.processingVersion,
        lastAiProcessedAt: impactTrees.lastAiProcessedAt,
        createdAt: impactTrees.createdAt,
        updatedAt: impactTrees.updatedAt,
      })
      .from(impactTrees)
      .where(eq(impactTrees.user_id, userId))
      .orderBy(desc(impactTrees.updatedAt));
    
    // Get node counts for each tree
    const treeWithCounts = await Promise.all(
      trees.map(async (tree) => {
        const nodeCount = await db
          .select({ count: count() })
          .from(treeNodes)
          .where(eq(treeNodes.treeId, tree.id));
        
        return {
          ...tree,
          nodeCount: nodeCount[0]?.count || 0,
        };
      })
    );
    
    return treeWithCounts;
  }

  async getTreeWithNodes(treeId: number, userId: string): Promise<(ImpactTree & { nodeRecords: TreeNodeRecord[] }) | null> {
    // First verify ownership
    const [tree] = await db
      .select()
      .from(impactTrees)
      .where(and(
        eq(impactTrees.id, treeId),
        eq(impactTrees.user_id, userId)
      ))
      .limit(1);

    if (!tree) return null;

    // Get all nodes for this tree
    const nodeRecords = await db
      .select()
      .from(treeNodes)
      .where(eq(treeNodes.treeId, treeId))
      .orderBy(treeNodes.createdAt);

    return {
      ...tree,
      nodeRecords,
    };
  }

  async createTree(userId: string, data: {
    name: string;
    description?: string;
    canvasState?: any;
  }): Promise<ImpactTree> {
    const [newTree] = await db
      .insert(impactTrees)
      .values({
        user_id: userId,
        name: data.name,
        description: data.description,
        nodes: [],
        connections: [],
        canvasState: data.canvasState || {
          zoom: 1,
          pan: { x: 0, y: 0 },
          orientation: "vertical"
        },
        treeStructure: {},
        userMetrics: {},
        aiMetadata: {},
      })
      .returning();

    return newTree;
  }

  async updateTree(treeId: number, userId: string, updates: {
    name?: string;
    description?: string;
    canvasState?: any;
    nodes?: TreeNode[];
    connections?: any[];
  }): Promise<ImpactTree | null> {
    const [updatedTree] = await db
      .update(impactTrees)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(
        eq(impactTrees.id, treeId),
        eq(impactTrees.user_id, userId)
      ))
      .returning();

    return updatedTree || null;
  }

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
    await this.logActivity(userId, treeId, null, 'tree_renamed', {
      newName: newName.trim(),
    });

    return updatedTree;
  }

  /**
   * Delete an impact tree and all associated data
   * @param treeId - Tree ID to delete
   * @param userId - User ID for authorization
   * @returns Success status and deletion summary
   */
  async deleteTree(treeId: number, userId: string): Promise<{ success: boolean; deletedNodes: number; treeName: string }> {
    console.log('Starting deleteTree transaction for treeId:', treeId);
    
    // Start transaction for atomic operation
    return await db.transaction(async (tx) => {
      console.log('Inside transaction, verifying tree ownership...');
      
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
        console.log('Tree not found or access denied');
        throw new Error('Tree not found or access denied');
      }

      const treeName = tree[0].name;
      console.log('Tree found:', treeName);

      // Count nodes for summary
      const nodeCount = await tx
        .select({ count: count() })
        .from(treeNodes)
        .where(eq(treeNodes.treeId, treeId));

      const deletedNodes = nodeCount[0]?.count || 0;
      console.log('Nodes to delete:', deletedNodes);

      // Delete tree (cascade will handle nodes)
      console.log('Deleting tree...');
      const deleteResult = await tx
        .delete(impactTrees)
        .where(eq(impactTrees.id, treeId));

      console.log('Delete result:', deleteResult);

      console.log('Transaction completed successfully');
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

  // Node operations
  async createNode(treeId: number, userId: string, nodeData: {
    id: string;
    type: string;
    title: string;
    description?: string;
    templateData?: any;
    position: { x: number; y: number };
    parentId?: string;
    metadata?: any;
  }): Promise<TreeNodeRecord | null> {
    // Verify tree ownership
    const treeOwnership = await db
      .select({ id: impactTrees.id })
      .from(impactTrees)
      .where(and(
        eq(impactTrees.id, treeId),
        eq(impactTrees.user_id, userId)
      ))
      .limit(1);

    if (treeOwnership.length === 0) return null;

    // If parentId is provided, verify it exists in this tree
    if (nodeData.parentId) {
      const parentExists = await db
        .select({ id: treeNodes.id })
        .from(treeNodes)
        .where(and(
          eq(treeNodes.id, nodeData.parentId),
          eq(treeNodes.treeId, treeId)
        ))
        .limit(1);

      if (parentExists.length === 0) {
        throw new Error("Parent node not found in this tree");
      }
    }

    const [newNode] = await db
      .insert(treeNodes)
      .values({
        id: nodeData.id,
        treeId,
        parentId: nodeData.parentId,
        nodeType: nodeData.type,
        title: nodeData.title,
        description: nodeData.description,
        templateData: nodeData.templateData || {},
        position: nodeData.position,
        metadata: nodeData.metadata || {},
      })
      .returning();

    // Log activity
    await this.logActivity(userId, treeId, nodeData.id, 'node_created', {
      nodeType: nodeData.type,
      title: nodeData.title,
    });

    return newNode;
  }

  async updateNode(treeId: number, nodeId: string, userId: string, updates: {
    title?: string;
    description?: string;
    templateData?: any;
    position?: { x: number; y: number };
    parentId?: string;
    metadata?: any;
  }): Promise<TreeNodeRecord | null> {
    // Verify tree ownership and node existence
    const nodeExists = await db
      .select({ id: treeNodes.id })
      .from(treeNodes)
      .innerJoin(impactTrees, eq(treeNodes.treeId, impactTrees.id))
      .where(and(
        eq(treeNodes.id, nodeId),
        eq(treeNodes.treeId, treeId),
        eq(impactTrees.user_id, userId)
      ))
      .limit(1);

    if (nodeExists.length === 0) return null;

    // If parentId is being updated, verify it exists in this tree
    if (updates.parentId) {
      const parentExists = await db
        .select({ id: treeNodes.id })
        .from(treeNodes)
        .where(and(
          eq(treeNodes.id, updates.parentId),
          eq(treeNodes.treeId, treeId)
        ))
        .limit(1);

      if (parentExists.length === 0) {
        throw new Error("Parent node not found in this tree");
      }
    }

    const [updatedNode] = await db
      .update(treeNodes)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(treeNodes.id, nodeId))
      .returning();

    // Log activity
    await this.logActivity(userId, treeId, nodeId, 'node_updated', {
      updates: Object.keys(updates),
    });

    return updatedNode;
  }

  async deleteNode(treeId: number, nodeId: string, userId: string): Promise<boolean> {
    // Verify tree ownership and node existence
    const nodeExists = await db
      .select({ id: treeNodes.id })
      .from(treeNodes)
      .innerJoin(impactTrees, eq(treeNodes.treeId, impactTrees.id))
      .where(and(
        eq(treeNodes.id, nodeId),
        eq(treeNodes.treeId, treeId),
        eq(impactTrees.user_id, userId)
      ))
      .limit(1);

    if (nodeExists.length === 0) return false;

    const result = await db
      .delete(treeNodes)
      .where(eq(treeNodes.id, nodeId))
      .returning();

    if (result.length > 0) {
      // Log activity
      await this.logActivity(userId, treeId, nodeId, 'node_deleted', {
        nodeId,
      });
    }

    return result.length > 0;
  }

  async getNodesByTree(treeId: number, userId: string): Promise<TreeNodeRecord[]> {
    // Verify tree ownership
    const treeOwnership = await db
      .select({ id: impactTrees.id })
      .from(impactTrees)
      .where(and(
        eq(impactTrees.id, treeId),
        eq(impactTrees.user_id, userId)
      ))
      .limit(1);

    if (treeOwnership.length === 0) return [];

    const nodes = await db
      .select()
      .from(treeNodes)
      .where(eq(treeNodes.treeId, treeId))
      .orderBy(treeNodes.createdAt);

    return nodes;
  }

  async getNodeChildren(treeId: number, nodeId: string, userId: string): Promise<TreeNodeRecord[]> {
    // Verify tree ownership
    const treeOwnership = await db
      .select({ id: impactTrees.id })
      .from(impactTrees)
      .where(and(
        eq(impactTrees.id, treeId),
        eq(impactTrees.user_id, userId)
      ))
      .limit(1);

    if (treeOwnership.length === 0) return [];

    const children = await db
      .select()
      .from(treeNodes)
      .where(and(
        eq(treeNodes.treeId, treeId),
        eq(treeNodes.parentId, nodeId)
      ))
      .orderBy(treeNodes.createdAt);

    return children;
  }

  async bulkUpdateNodes(treeId: number, userId: string, nodeUpdates: Array<{
    id: string;
    updates: {
      title?: string;
      description?: string;
      templateData?: any;
      position?: { x: number; y: number };
      parentId?: string;
      metadata?: any;
    };
  }>): Promise<TreeNodeRecord[]> {
    console.log('BulkUpdateNodes called with:', { treeId, userId, nodeUpdatesCount: nodeUpdates.length });
    
    // Verify tree ownership
    const treeOwnership = await db
      .select({ id: impactTrees.id })
      .from(impactTrees)
      .where(and(
        eq(impactTrees.id, treeId),
        eq(impactTrees.user_id, userId)
      ))
      .limit(1);

    if (treeOwnership.length === 0) {
      console.log('Tree ownership verification failed');
      throw new Error('Tree not found or access denied');
    }

    // If no updates provided, return empty array (normal for optimistic updates)
    if (nodeUpdates.length === 0) {
      console.log('No node updates provided - returning empty array');
      return [];
    }

    const updatedNodes: TreeNodeRecord[] = [];

    // First, check which nodes exist in the database
    const existingNodeIds = await db
      .select({ id: treeNodes.id })
      .from(treeNodes)
      .where(and(
        eq(treeNodes.treeId, treeId),
        inArray(treeNodes.id, nodeUpdates.map(n => n.id))
      ));

    const existingIds = new Set(existingNodeIds.map(n => n.id));
    const validUpdates = nodeUpdates.filter(update => existingIds.has(update.id));

    console.log('Existing nodes:', existingIds.size, 'Valid updates:', validUpdates.length);

    // Process updates in transaction only for existing nodes
    if (validUpdates.length > 0) {
      await db.transaction(async (tx) => {
        for (const nodeUpdate of validUpdates) {
          console.log('Updating node:', nodeUpdate.id, 'with:', nodeUpdate.updates);
          
          const [updatedNode] = await tx
            .update(treeNodes)
            .set({
              ...nodeUpdate.updates,
              updatedAt: new Date(),
            })
            .where(and(
              eq(treeNodes.id, nodeUpdate.id),
              eq(treeNodes.treeId, treeId)
            ))
            .returning();

          if (updatedNode) {
            console.log('Successfully updated node:', updatedNode.id);
            updatedNodes.push(updatedNode);
          }
        }
      });
    }

    console.log('Bulk update completed. Updated nodes:', updatedNodes.length);

    // Log bulk update activity only if we actually updated something
    if (updatedNodes.length > 0) {
      await this.logActivity(userId, treeId, null, 'bulk_node_update', {
        updatedCount: updatedNodes.length,
        nodeIds: updatedNodes.map(n => n.id),
      });
    }

    return updatedNodes;
  }

  // Status management for opportunity nodes
  async updateNodeStatus(
    treeId: number, 
    nodeId: string, 
    userId: string, 
    workflowStatus: WorkflowStatus
  ): Promise<TreeNodeRecord | null> {
    // Validate status
    if (!workflowStatuses.includes(workflowStatus)) {
      throw new Error(`Invalid workflow status: ${workflowStatus}`);
    }

    // Get existing node
    const existingNode = await db
      .select()
      .from(treeNodes)
      .where(and(
        eq(treeNodes.id, nodeId),
        eq(treeNodes.treeId, treeId)
      ))
      .limit(1);

    if (!existingNode.length) return null;

    // Verify tree ownership
    const treeOwnership = await db
      .select({ id: impactTrees.id })
      .from(impactTrees)
      .where(and(
        eq(impactTrees.id, treeId),
        eq(impactTrees.user_id, userId)
      ))
      .limit(1);

    if (treeOwnership.length === 0) return null;

    // Check if node type supports workflow status (exclude metric nodes)
    if (existingNode[0].nodeType === 'metric') {
      throw new Error('Metric nodes do not support workflow status');
    }

    // Update node with new status
    const updatedTemplateData = {
      ...existingNode[0].templateData,
      workflowStatus
    };

    const [updatedNode] = await db
      .update(treeNodes)
      .set({
        templateData: updatedTemplateData,
        updatedAt: new Date()
      })
      .where(eq(treeNodes.id, nodeId))
      .returning();

    // Log activity
    await this.logActivity(
      userId,
      treeId,
      nodeId,
      'node_status_updated',
      { 
        nodeTitle: existingNode[0].title,
        nodeType: existingNode[0].nodeType,
        previousStatus: existingNode[0].templateData?.workflowStatus,
        newStatus: workflowStatus 
      }
    );

    return updatedNode;
  }

  // Migration method for existing opportunity nodes
  async migrateOpportunityStatuses(userId: string): Promise<void> {
    console.log('Starting opportunity status migration for user:', userId);
    
    // Find all opportunity nodes belonging to user's trees without workflowStatus
    const opportunityNodes = await db
      .select({
        id: treeNodes.id,
        treeId: treeNodes.treeId,
        title: treeNodes.title,
        templateData: treeNodes.templateData
      })
      .from(treeNodes)
      .innerJoin(impactTrees, eq(treeNodes.treeId, impactTrees.id))
      .where(and(
        eq(treeNodes.nodeType, 'opportunity'),
        eq(impactTrees.user_id, userId)
      ));

    console.log(`Found ${opportunityNodes.length} opportunity nodes for user`);

    // Filter nodes that don't have workflowStatus
    const nodesToUpdate = opportunityNodes.filter(node => 
      !node.templateData?.workflowStatus
    );

    console.log(`${nodesToUpdate.length} nodes need status migration`);

    // Update nodes without workflowStatus to default 'identified'
    for (const node of nodesToUpdate) {
      const updatedTemplateData = {
        ...node.templateData,
        workflowStatus: 'identified' as OpportunityWorkflowStatus
      };

      await db
        .update(treeNodes)
        .set({
          templateData: updatedTemplateData,
          updatedAt: new Date()
        })
        .where(eq(treeNodes.id, node.id));

      console.log(`Migrated node ${node.id} (${node.title}) to 'identified' status`);
    }

    console.log('Migration completed');
  }

  // Migration method for all existing nodes (except opportunity and metric) to add workflow status
  async migrateWorkflowStatuses(userId: string): Promise<void> {
    console.log('Starting workflow status migration for user:', userId);
    
    // Find all nodes belonging to user's trees that support workflow status (exclude metric and opportunity)
    const supportedNodeTypes = ['objective', 'outcome', 'solution', 'assumption', 'research'];
    
    const nodesToMigrate = await db
      .select({
        id: treeNodes.id,
        treeId: treeNodes.treeId,
        title: treeNodes.title,
        nodeType: treeNodes.nodeType,
        templateData: treeNodes.templateData
      })
      .from(treeNodes)
      .innerJoin(impactTrees, eq(treeNodes.treeId, impactTrees.id))
      .where(and(
        inArray(treeNodes.nodeType, supportedNodeTypes),
        eq(impactTrees.user_id, userId)
      ));

    console.log(`Found ${nodesToMigrate.length} nodes to migrate for user`);

    // Update nodes without workflowStatus to default 'identified'
    const nodesToUpdate = nodesToMigrate.filter(node => 
      !node.templateData?.workflowStatus
    );

    console.log(`${nodesToUpdate.length} nodes need status migration`);

    for (const node of nodesToUpdate) {
      const updatedTemplateData = {
        ...node.templateData,
        workflowStatus: 'identified' as WorkflowStatus
      };

      await db
        .update(treeNodes)
        .set({
          templateData: updatedTemplateData,
          updatedAt: new Date()
        })
        .where(eq(treeNodes.id, node.id));

      console.log(`Migrated node ${node.id} (${node.title}) to 'identified' status`);
    }

    console.log('Workflow status migration completed');
  }

  // Activity logging
  async logActivity(
    userId: string,
    treeId: number,
    nodeId: string | null,
    activityType: string,
    activityData: any
  ): Promise<void> {
    try {
      await db.insert(userActivities).values({
        userId,
        treeId,
        nodeId,
        activityType,
        activityData,
        sessionId: this.getSessionId(),
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw - activity logging shouldn't break main operations
    }
  }

  private getSessionId(): string {
    // Simple session ID generation - in production, use proper session management
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}