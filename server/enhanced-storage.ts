import { db } from "./db";
import { impactTrees, treeVersions, userActivities } from "@shared/schema";
import { eq, desc, and, lt, isNull, inArray, sql } from "drizzle-orm";
import type { TreeNode, NodeConnection, CanvasState } from "@shared/schema";

export interface AIOptimizedStructure {
  hierarchy: TreeHierarchy;
  nodes: NormalizedNodeData;
  connections: ConnectionGraph;
  metadata: AIMetadata;
}

export interface TreeHierarchy {
  rootNodes: string[];
  nodeRelationships: Record<string, NodeRelationship>;
  maxDepth: number;
  totalNodes: number;
}

export interface NodeRelationship {
  parent?: string;
  children: string[];
  depth: number;
  path: string;
  siblings: string[];
}

export interface NormalizedNodeData {
  [nodeId: string]: {
    type: string;
    title: string;
    templateData: Record<string, any>;
    position: { x: number; y: number };
    metadata: {
      createdAt: string;
      lastModified: string;
      completionStatus: 'empty' | 'partial' | 'complete';
      templateFieldsCompleted: number;
      totalTemplateFields: number;
    };
    aiContext: {
      businessDomain: string;
      priorityScore: number;
      keywords: string[];
      relationships: string[];
    };
  };
}

export interface ConnectionGraph {
  edges: Array<{
    from: string;
    to: string;
    type: 'parent-child' | 'dependency' | 'reference';
    strength: number;
  }>;
  adjacencyList: Record<string, string[]>;
  pathMatrix: Record<string, Record<string, number>>;
}

export interface AIMetadata {
  totalNodes: number;
  totalConnections: number;
  nodeTypeDistribution: Record<string, number>;
  avgCompletionRate: number;
  treeComplexity: number;
  lastProcessed: string;
  processingVersion: number;
}

export interface UserProgressAnalytics {
  totalTrees: number;
  treesCompleted: number;
  avgCompletionRate: number;
  totalTimeSpent: number;
  mostActiveTreeId: number | null;
  recentActivity: any[];
  progressTrend: 'improving' | 'stable' | 'declining';
}

export interface AIProcessingBatch {
  id: number;
  userId: string;
  name: string;
  treeStructure: any;
  nodes: TreeNode[];
  connections: NodeConnection[];
  aiMetadata: any;
  updatedAt: Date;
}

export interface AIProcessingResult {
  treeId: number;
  insights: Record<string, any>;
  confidence: number;
  processedAt: string;
}

export class EnhancedTreeStorage {
  
  // Save tree with AI optimization and user tracking
  async saveTreeWithTracking(
    treeId: number,
    userId: string,
    treeData: {
      nodes: TreeNode[];
      connections: NodeConnection[];
      canvasState: CanvasState;
      activityType: string;
      sessionId?: string;
    }
  ): Promise<any> {
    
    return await db.transaction(async (tx) => {
      // Build AI-optimized structure
      const aiStructure = this.buildAIStructure(treeData.nodes, treeData.connections);
      
      // Calculate user metrics
      const userMetrics = this.calculateUserMetrics(treeData.nodes, userId);
      
      // Update main tree record
      const [updatedTree] = await tx
        .update(impactTrees)
        .set({
          user_id: userId,
          nodes: treeData.nodes,
          connections: treeData.connections,
          canvasState: treeData.canvasState,
          treeStructure: aiStructure.hierarchy,
          userMetrics: userMetrics,
          aiMetadata: aiStructure.metadata,
          updatedAt: new Date(),
        })
        .where(eq(impactTrees.id, treeId))
        .returning();
      
      // Log user activity
      await tx.insert(userActivities).values({
        userId: userId,
        treeId: treeId,
        activityType: treeData.activityType,
        activityData: {
          nodesChanged: treeData.nodes.length,
          connectionsChanged: treeData.connections.length,
          canvasAction: treeData.activityType,
        },
        sessionId: treeData.sessionId,
        createdAt: new Date(),
      });
      
      // Create version snapshot for significant changes
      if (this.isSignificantChange(treeData.activityType)) {
        await this.createVersionSnapshot(tx, treeId, userId, updatedTree);
      }
      
      return updatedTree;
    });
  }
  
  // Build hierarchical structure for AI processing
  private buildAIStructure(
    nodes: TreeNode[], 
    connections: NodeConnection[]
  ): AIOptimizedStructure {
    
    // Build hierarchy
    const hierarchy = this.buildHierarchy(nodes, connections);
    
    // Normalize node data
    const normalizedNodes: NormalizedNodeData = {};
    nodes.forEach(node => {
      normalizedNodes[node.id] = {
        type: node.type,
        title: node.title,
        templateData: node.templateData || {},
        position: node.position,
        metadata: {
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          completionStatus: this.calculateNodeCompletionStatus(node),
          templateFieldsCompleted: this.countCompletedFields(node),
          totalTemplateFields: this.getTotalTemplateFields(node.type),
        },
        aiContext: {
          businessDomain: this.inferBusinessDomain(node),
          priorityScore: this.calculatePriorityScore(node),
          keywords: this.extractKeywords(node),
          relationships: this.findRelatedNodes(node.id, connections),
        },
      };
    });
    
    // Build connection graph
    const connectionGraph = this.buildConnectionGraph(connections);
    
    // AI metadata
    const metadata: AIMetadata = {
      totalNodes: nodes.length,
      totalConnections: connections.length,
      nodeTypeDistribution: this.getNodeTypeDistribution(nodes),
      avgCompletionRate: this.calculateAvgCompletionRate(nodes),
      treeComplexity: this.calculateTreeComplexity(hierarchy, connectionGraph),
      lastProcessed: new Date().toISOString(),
      processingVersion: 1,
    };
    
    return {
      hierarchy,
      nodes: normalizedNodes,
      connections: connectionGraph,
      metadata,
    };
  }
  
  // Get trees for AI batch processing
  async getTreesForAIProcessing(
    limit: number = 100,
    lastProcessedBefore?: Date
  ): Promise<AIProcessingBatch[]> {
    
    const whereCondition = lastProcessedBefore 
      ? lt(impactTrees.lastAiProcessedAt, lastProcessedBefore)
      : isNull(impactTrees.lastAiProcessedAt);
    
    return await db
      .select({
        id: impactTrees.id,
        userId: impactTrees.user_id,
        name: impactTrees.name,
        treeStructure: impactTrees.treeStructure,
        nodes: impactTrees.nodes,
        connections: impactTrees.connections,
        aiMetadata: impactTrees.aiMetadata,
        updatedAt: impactTrees.updatedAt,
      })
      .from(impactTrees)
      .where(whereCondition)
      .limit(limit)
      .orderBy(desc(impactTrees.updatedAt));
  }
  
  // Mark trees as AI processed
  async markAIProcessed(
    treeIds: number[],
    processingResults: AIProcessingResult[]
  ): Promise<void> {
    
    const resultsMap = new Map(
      processingResults.map(result => [result.treeId, result])
    );
    
    for (const treeId of treeIds) {
      const result = resultsMap.get(treeId);
      await db
        .update(impactTrees)
        .set({
          lastAiProcessedAt: new Date(),
          processingVersion: sql`processing_version + 1`,
          aiMetadata: sql`ai_metadata || ${JSON.stringify(result?.insights || {})}`,
        })
        .where(eq(impactTrees.id, treeId));
    }
  }
  
  // Get user progress analytics
  async getUserProgressAnalytics(userId: string): Promise<UserProgressAnalytics> {
    // Get user's trees with completion metrics
    const userTrees = await db
      .select({
        id: impactTrees.id,
        name: impactTrees.name,
        userMetrics: impactTrees.userMetrics,
        createdAt: impactTrees.createdAt,
        updatedAt: impactTrees.updatedAt,
      })
      .from(impactTrees)
      .where(eq(impactTrees.user_id, userId))
      .orderBy(desc(impactTrees.updatedAt));
    
    // Get recent user activities
    const recentActivities = await db
      .select()
      .from(userActivities)
      .where(eq(userActivities.userId, userId))
      .orderBy(desc(userActivities.createdAt))
      .limit(100);
    
    return {
      totalTrees: userTrees.length,
      treesCompleted: userTrees.filter(t => this.isTreeCompleted(t)).length,
      avgCompletionRate: this.calculateUserAvgCompletion(userTrees),
      totalTimeSpent: this.calculateTotalTimeSpent(recentActivities),
      mostActiveTreeId: this.findMostActiveTree(recentActivities),
      recentActivity: recentActivities.slice(0, 10),
      progressTrend: this.calculateProgressTrend(userTrees, recentActivities),
    };
  }

  // Get tree versions
  async getTreeVersions(treeId: number, limit: number = 10): Promise<any[]> {
    return await db
      .select()
      .from(treeVersions)
      .where(eq(treeVersions.treeId, treeId))
      .orderBy(desc(treeVersions.createdAt))
      .limit(limit);
  }
  
  // Create version snapshot for significant changes
  private async createVersionSnapshot(
    tx: any,
    treeId: number,
    userId: string,
    treeData: any
  ): Promise<void> {
    
    // Get current version number
    const latestVersion = await tx
      .select({ versionNumber: treeVersions.versionNumber })
      .from(treeVersions)
      .where(eq(treeVersions.treeId, treeId))
      .orderBy(desc(treeVersions.versionNumber))
      .limit(1);
    
    const nextVersion = (latestVersion[0]?.versionNumber || 0) + 1;
    
    // Create version snapshot
    await tx.insert(treeVersions).values({
      treeId: treeId,
      versionNumber: nextVersion,
      treeSnapshot: {
        nodes: treeData.nodes,
        connections: treeData.connections,
        canvasState: treeData.canvasState,
        metadata: treeData.aiMetadata,
      },
      changeDescription: `Auto-snapshot v${nextVersion}`,
      userId: userId,
      createdAt: new Date(),
    });
  }
  
  // Helper methods for AI structure building
  private buildHierarchy(nodes: TreeNode[], connections: NodeConnection[]): TreeHierarchy {
    const nodeRelationships: Record<string, NodeRelationship> = {};
    const childrenMap = new Map<string, string[]>();
    const parentMap = new Map<string, string>();
    
    // Build parent-child relationships
    connections.forEach(conn => {
      const children = childrenMap.get(conn.fromNodeId) || [];
      children.push(conn.toNodeId);
      childrenMap.set(conn.fromNodeId, children);
      parentMap.set(conn.toNodeId, conn.fromNodeId);
    });
    
    // Find root nodes (nodes with no parents)
    const rootNodes = nodes
      .filter(node => !parentMap.has(node.id))
      .map(node => node.id);
    
    // Calculate depth and paths for each node
    let maxDepth = 0;
    const calculateDepthAndPath = (nodeId: string, depth = 0, path = 'root'): void => {
      maxDepth = Math.max(maxDepth, depth);
      const children = childrenMap.get(nodeId) || [];
      const parent = parentMap.get(nodeId);
      const siblings = parent ? (childrenMap.get(parent) || []).filter(id => id !== nodeId) : [];
      
      nodeRelationships[nodeId] = {
        parent,
        children,
        depth,
        path: path === 'root' ? nodeId : `${path}.${nodeId}`,
        siblings,
      };
      
      children.forEach(childId => {
        calculateDepthAndPath(childId, depth + 1, nodeRelationships[nodeId].path);
      });
    };
    
    rootNodes.forEach(rootId => calculateDepthAndPath(rootId));
    
    return {
      rootNodes,
      nodeRelationships,
      maxDepth,
      totalNodes: nodes.length,
    };
  }

  private buildConnectionGraph(connections: NodeConnection[]): ConnectionGraph {
    const edges = connections.map(conn => ({
      from: conn.fromNodeId,
      to: conn.toNodeId,
      type: 'parent-child' as const,
      strength: 1,
    }));

    const adjacencyList: Record<string, string[]> = {};
    connections.forEach(conn => {
      if (!adjacencyList[conn.fromNodeId]) {
        adjacencyList[conn.fromNodeId] = [];
      }
      adjacencyList[conn.fromNodeId].push(conn.toNodeId);
    });

    // Simple path matrix (can be enhanced)
    const pathMatrix: Record<string, Record<string, number>> = {};
    // Implementation would calculate shortest paths between all nodes

    return {
      edges,
      adjacencyList,
      pathMatrix,
    };
  }
  
  private calculateNodeCompletionStatus(node: TreeNode): 'empty' | 'partial' | 'complete' {
    if (!node.templateData) return 'empty';
    
    const totalFields = this.getTotalTemplateFields(node.type);
    const completedFields = this.countCompletedFields(node);
    
    if (completedFields === 0) return 'empty';
    if (completedFields === totalFields) return 'complete';
    return 'partial';
  }
  
  private countCompletedFields(node: TreeNode): number {
    if (!node.templateData) return 0;
    
    return Object.values(node.templateData).filter(value => 
      value !== null && value !== undefined && value !== ''
    ).length;
  }
  
  private getTotalTemplateFields(nodeType: string): number {
    const fieldCounts = {
      objective: 5, // coreWhy, desiredOutcome, strategicContext, targetAudience, exclusionCriteria
      outcome: 6,   // who, doesWhat, baseline, target, measurementMethod, timeframe
      opportunity: 9, // customerProblem, evidenceInsights, linkToKeyResult, impactOnCustomer, customerSegments + ICE scores
      solution: 12,   // solutionRationale, implementationApproach, keyFeatures, etc. + RICE scores
      assumption: 8,  // assumptionType, hypothesisStatement, testMethod, etc. + Evidence-Impact scores
      metric: 7,      // metricType, metricDefinition, calculationMethod, etc.
      research: 6,    // researchQuestions, methodology, participants, timeline, expectedOutcomes, researchType
    };
    
    return fieldCounts[nodeType as keyof typeof fieldCounts] || 3;
  }

  private calculateUserMetrics(nodes: TreeNode[], userId: string): Record<string, any> {
    const completionRates = nodes.map(node => {
      const completed = this.countCompletedFields(node);
      const total = this.getTotalTemplateFields(node.type);
      return total > 0 ? completed / total : 0;
    });

    return {
      totalNodes: nodes.length,
      avgCompletionRate: completionRates.length > 0 ? completionRates.reduce((a, b) => a + b, 0) / completionRates.length : 0,
      nodeTypeDistribution: this.getNodeTypeDistribution(nodes),
      lastUpdated: new Date().toISOString(),
    };
  }

  private getNodeTypeDistribution(nodes: TreeNode[]): Record<string, number> {
    return nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateAvgCompletionRate(nodes: TreeNode[]): number {
    const rates = nodes.map(node => {
      const completed = this.countCompletedFields(node);
      const total = this.getTotalTemplateFields(node.type);
      return total > 0 ? completed / total : 0;
    });
    
    return rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
  }

  private calculateTreeComplexity(hierarchy: TreeHierarchy, connectionGraph: ConnectionGraph): number {
    // Simple complexity score based on depth and connections
    return hierarchy.maxDepth * 0.3 + connectionGraph.edges.length * 0.1;
  }

  private inferBusinessDomain(node: TreeNode): string {
    // Simple keyword-based domain inference
    const title = node.title.toLowerCase();
    const description = node.description?.toLowerCase() || '';
    
    if (title.includes('user') || description.includes('user')) return 'user_experience';
    if (title.includes('revenue') || description.includes('revenue')) return 'revenue';
    if (title.includes('cost') || description.includes('cost')) return 'cost_optimization';
    if (title.includes('growth') || description.includes('growth')) return 'growth';
    
    return 'general';
  }

  private calculatePriorityScore(node: TreeNode): number {
    // Simple priority scoring based on ICE/RICE scores if available
    const template = node.templateData || {};
    
    if (template.iceImpact && template.iceConfidence && template.iceEase) {
      return (template.iceImpact * template.iceConfidence * template.iceEase) / 1000;
    }
    
    if (template.riceReach && template.riceImpact && template.riceConfidence && template.riceEffort) {
      return (template.riceReach * template.riceImpact * template.riceConfidence) / template.riceEffort / 1000;
    }
    
    return 0.5; // Default medium priority
  }

  private extractKeywords(node: TreeNode): string[] {
    const text = `${node.title} ${node.description || ''}`.toLowerCase();
    // Simple keyword extraction
    return text.split(/\s+/).filter(word => word.length > 3).slice(0, 10);
  }

  private findRelatedNodes(nodeId: string, connections: NodeConnection[]): string[] {
    const related = new Set<string>();
    
    connections.forEach(conn => {
      if (conn.fromNodeId === nodeId) {
        related.add(conn.toNodeId);
      }
      if (conn.toNodeId === nodeId) {
        related.add(conn.fromNodeId);
      }
    });
    
    return Array.from(related);
  }

  private isSignificantChange(activityType: string): boolean {
    const significantTypes = [
      'node_created', 'node_deleted', 'connection_created', 'connection_deleted',
      'template_completed', 'major_edit'
    ];
    
    return significantTypes.includes(activityType);
  }

  private isTreeCompleted(tree: any): boolean {
    const metrics = tree.userMetrics || {};
    return metrics.avgCompletionRate > 0.8;
  }

  private calculateUserAvgCompletion(trees: any[]): number {
    if (trees.length === 0) return 0;
    
    const rates = trees.map(tree => {
      const metrics = tree.userMetrics || {};
      return metrics.avgCompletionRate || 0;
    });
    
    return rates.reduce((a, b) => a + b, 0) / rates.length;
  }

  private calculateTotalTimeSpent(activities: any[]): number {
    return activities.reduce((total, activity) => {
      return total + (activity.durationMs || 0);
    }, 0);
  }

  private findMostActiveTree(activities: any[]): number | null {
    if (activities.length === 0) return null;
    
    const treeActivity = activities.reduce((acc, activity) => {
      if (activity.treeId) {
        acc[activity.treeId] = (acc[activity.treeId] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);
    
    let maxCount = 0;
    let mostActiveId = null;
    
    Object.entries(treeActivity).forEach(([treeId, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostActiveId = parseInt(treeId);
      }
    });
    
    return mostActiveId;
  }

  private calculateProgressTrend(trees: any[], activities: any[]): 'improving' | 'stable' | 'declining' {
    // Simple trend calculation based on recent activity
    const recentActivities = activities.filter(a => 
      new Date(a.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
    );
    
    if (recentActivities.length > 10) return 'improving';
    if (recentActivities.length > 3) return 'stable';
    return 'declining';
  }
}

export const enhancedStorage = new EnhancedTreeStorage();