import { eq, and, desc, inArray, count } from "drizzle-orm";
import { db } from "../db";
import { impactTrees, treeNodes, userActivities } from "@shared/schema";
import type { ImpactTree, TreeNode, TreeNodeRecord, InsertTreeNode } from "@shared/schema";

export class ImpactTreeService {
  
  // Tree operations
  async getUserTrees(userId: string): Promise<Array<ImpactTree & { nodeCount: number }>> {
    const trees = await db
      .select({
        id: impactTrees.id,
        user_id: impactTrees.user_id,
        name: impactTrees.name,
        description: impactTrees.description,
        nodes: impactTrees.nodes,
        connections: impactTrees.connections,
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

  async deleteTree(treeId: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(impactTrees)
      .where(and(
        eq(impactTrees.id, treeId),
        eq(impactTrees.user_id, userId)
      ))
      .returning();

    return result.length > 0;
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

    const updatedNodes: TreeNodeRecord[] = [];

    // Process updates in transaction
    await db.transaction(async (tx) => {
      for (const nodeUpdate of nodeUpdates) {
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
          updatedNodes.push(updatedNode);
        }
      }
    });

    // Log bulk update activity
    await this.logActivity(userId, treeId, null, 'bulk_node_update', {
      updatedCount: updatedNodes.length,
      nodeIds: nodeUpdates.map(n => n.id),
    });

    return updatedNodes;
  }

  // Activity logging
  private async logActivity(
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