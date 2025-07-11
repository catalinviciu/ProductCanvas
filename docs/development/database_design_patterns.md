# 🗄️ Database Design Patterns

> **Drizzle ORM best practices and patterns for React + Node.js Impact Tree applications**

---

## 📋 **Overview**

This document establishes database design patterns and best practices for the AI-Native Impact Tree project using Drizzle ORM with PostgreSQL. These patterns ensure scalable, maintainable, and performant database operations.

---

## 🎯 **Database Design Principles**

### **1. Schema Design Philosophy**

Design for flexibility and performance:

```typescript
// ✅ RECOMMENDED: Flexible schema design
import { pgTable, text, serial, integer, jsonb, timestamp, varchar, index, boolean } from "drizzle-orm/pg-core";

export const impactTrees = pgTable("impact_trees", {
  id: serial("id").primaryKey(),
  user_id: varchar("user_id", { length: 255 }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  
  // Flexible JSON storage for tree structure
  nodes: jsonb("nodes").notNull().default('[]'),
  connections: jsonb("connections").notNull().default('[]'),
  
  // Canvas state persistence
  canvasState: jsonb("canvas_state").notNull().default(
    '{"zoom": 1, "pan": {"x": 0, "y": 0}, "orientation": "vertical"}'
  ),
  
  // Metadata for discovery workflow
  discoveryPhase: text("discovery_phase").default('strategy'),
  isTemplate: boolean("is_template").default(false),
  
  // Standard timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Performance indexes
  userIdx: index("idx_trees_user").on(table.user_id),
  nameIdx: index("idx_trees_name").on(table.name),
  updatedAtIdx: index("idx_trees_updated").on(table.updatedAt.desc()),
  
  // GIN indexes for JSONB columns
  nodesGin: index("idx_trees_nodes").using("gin", table.nodes),
  connectionsGin: index("idx_trees_connections").using("gin", table.connections),
  canvasStateGin: index("idx_trees_canvas_state").using("gin", table.canvasState),
}));
```

### **2. Individual Node Management**

Separate node table for complex operations:

```typescript
// ✅ RECOMMENDED: Individual node table for complex queries
export const treeNodes = pgTable("tree_nodes", {
  id: text("id").primaryKey(),
  treeId: integer("tree_id").notNull().references(() => impactTrees.id, { onDelete: "cascade" }),
  parentId: text("parent_id").references(() => treeNodes.id, { onDelete: "cascade" }),
  
  // Node properties
  nodeType: text("node_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  
  // Position and visual state
  position: jsonb("position").notNull().default('{"x": 0, "y": 0}'),
  isCollapsed: boolean("is_collapsed").default(false),
  
  // Template data for node-specific fields
  templateData: jsonb("template_data").default('{}'),
  
  // Metadata
  metadata: jsonb("metadata").default('{}'),
  
  // Standard timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Performance indexes
  treeIdIdx: index("idx_tree_nodes_tree_id").on(table.treeId),
  parentIdIdx: index("idx_tree_nodes_parent_id").on(table.parentId),
  typeIdx: index("idx_tree_nodes_type").on(table.nodeType),
  
  // GIN indexes for JSONB
  templateDataGin: index("idx_tree_nodes_template_data").using("gin", table.templateData),
  positionGin: index("idx_tree_nodes_position").using("gin", table.position),
}));
```

### **3. Activity Tracking**

Track user activity for analytics:

```typescript
// ✅ RECOMMENDED: Activity tracking for PM workflow
export const userActivities = pgTable("user_activities", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  treeId: integer("tree_id").references(() => impactTrees.id, { onDelete: "cascade" }),
  
  // Activity details
  activityType: text("activity_type").notNull(),
  description: text("description"),
  sessionId: text("session_id"),
  
  // Activity data
  activityData: jsonb("activity_data").default('{}'),
  
  // Context
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("idx_activities_user").on(table.userId),
  treeIdIdx: index("idx_activities_tree").on(table.treeId),
  typeIdx: index("idx_activities_type").on(table.activityType),
  sessionIdx: index("idx_activities_session").on(table.sessionId),
  createdAtIdx: index("idx_activities_created").on(table.createdAt.desc()),
}));
```

---

## 🔧 **Drizzle ORM Patterns**

### **1. Type-Safe Schema Definitions**

Create comprehensive type definitions:

```typescript
// ✅ RECOMMENDED: Type definitions with Zod integration
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Insert schemas (for creating records)
export const insertImpactTreeSchema = createInsertSchema(impactTrees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTreeNodeSchema = createInsertSchema(treeNodes).omit({
  createdAt: true,
  updatedAt: true,
});

// Select schemas (for querying records)
export const selectImpactTreeSchema = createSelectSchema(impactTrees);
export const selectTreeNodeSchema = createSelectSchema(treeNodes);

// Extended schemas for API validation
export const createTreeSchema = insertImpactTreeSchema.extend({
  nodes: z.array(z.object({
    id: z.string(),
    type: z.enum(['objective', 'outcome', 'opportunity', 'solution', 'assumption', 'metric', 'research']),
    title: z.string().min(1),
    description: z.string().optional(),
    position: z.object({
      x: z.number(),
      y: z.number()
    }),
    templateData: z.record(z.any()).optional()
  })).optional(),
  
  connections: z.array(z.object({
    id: z.string(),
    fromNodeId: z.string(),
    toNodeId: z.string()
  })).optional()
});

// Type exports
export type InsertImpactTree = z.infer<typeof insertImpactTreeSchema>;
export type ImpactTree = typeof impactTrees.$inferSelect;
export type TreeNodeRecord = typeof treeNodes.$inferSelect;
export type InsertTreeNode = typeof treeNodes.$inferInsert;
export type UserActivity = typeof userActivities.$inferSelect;
```

### **2. Query Patterns**

Implement efficient query patterns:

```typescript
// ✅ RECOMMENDED: Efficient query patterns
import { eq, and, or, desc, asc, count, sql } from "drizzle-orm";
import { db } from "./db";

export class TreeRepository {
  // Get tree with node count
  async getTreeWithNodeCount(treeId: number, userId: string) {
    return await db
      .select({
        id: impactTrees.id,
        name: impactTrees.name,
        description: impactTrees.description,
        canvasState: impactTrees.canvasState,
        updatedAt: impactTrees.updatedAt,
        nodeCount: sql<number>`(
          SELECT COUNT(*) FROM ${treeNodes} 
          WHERE ${treeNodes.treeId} = ${impactTrees.id}
        )`.as('nodeCount')
      })
      .from(impactTrees)
      .where(and(
        eq(impactTrees.id, treeId),
        eq(impactTrees.user_id, userId)
      ))
      .limit(1);
  }

  // Get tree with all nodes (using join)
  async getTreeWithNodes(treeId: number, userId: string) {
    const tree = await db.query.impactTrees.findFirst({
      where: and(
        eq(impactTrees.id, treeId),
        eq(impactTrees.user_id, userId)
      ),
      with: {
        nodeRecords: {
          orderBy: [asc(treeNodes.createdAt)]
        }
      }
    });

    return tree;
  }

  // Bulk node operations
  async bulkUpdateNodes(treeId: number, nodeUpdates: Array<{
    id: string;
    updates: Partial<InsertTreeNode>;
  }>) {
    return await db.transaction(async (tx) => {
      const results = [];
      
      for (const { id, updates } of nodeUpdates) {
        const [updated] = await tx
          .update(treeNodes)
          .set({
            ...updates,
            updatedAt: new Date()
          })
          .where(and(
            eq(treeNodes.id, id),
            eq(treeNodes.treeId, treeId)
          ))
          .returning();
        
        if (updated) {
          results.push(updated);
        }
      }
      
      return results;
    });
  }

  // Complex queries with aggregation
  async getTreeAnalytics(userId: string) {
    return await db
      .select({
        totalTrees: count(),
        avgNodesPerTree: sql<number>`AVG(
          (SELECT COUNT(*) FROM ${treeNodes} WHERE ${treeNodes.treeId} = ${impactTrees.id})
        )`.as('avgNodesPerTree'),
        lastActivity: sql<Date>`MAX(${impactTrees.updatedAt})`.as('lastActivity'),
        nodeTypeDistribution: sql<object>`
          json_object_agg(
            node_type,
            node_count
          )
        `.as('nodeTypeDistribution')
      })
      .from(impactTrees)
      .leftJoin(
        sql`(
          SELECT 
            tree_id,
            node_type,
            COUNT(*) as node_count
          FROM ${treeNodes}
          GROUP BY tree_id, node_type
        ) node_stats`.as('node_stats'),
        sql`node_stats.tree_id = ${impactTrees.id}`
      )
      .where(eq(impactTrees.user_id, userId))
      .groupBy(impactTrees.user_id);
  }
}
```

### **3. Transaction Management**

Use transactions for complex operations:

```typescript
// ✅ RECOMMENDED: Transaction patterns
export class TreeService {
  async createTreeWithNodes(userId: string, treeData: {
    name: string;
    description?: string;
    nodes: Array<{
      id: string;
      type: string;
      title: string;
      description?: string;
      position: { x: number; y: number };
      parentId?: string;
      templateData?: any;
    }>;
    connections: Array<{
      id: string;
      fromNodeId: string;
      toNodeId: string;
    }>;
  }) {
    return await db.transaction(async (tx) => {
      // Create tree
      const [tree] = await tx
        .insert(impactTrees)
        .values({
          user_id: userId,
          name: treeData.name,
          description: treeData.description,
          nodes: treeData.nodes,
          connections: treeData.connections
        })
        .returning();

      // Create individual node records
      if (treeData.nodes.length > 0) {
        const nodeInserts = treeData.nodes.map(node => ({
          id: node.id,
          treeId: tree.id,
          parentId: node.parentId,
          nodeType: node.type,
          title: node.title,
          description: node.description,
          position: node.position,
          templateData: node.templateData || {}
        }));

        await tx
          .insert(treeNodes)
          .values(nodeInserts);
      }

      // Log activity
      await tx
        .insert(userActivities)
        .values({
          userId,
          treeId: tree.id,
          activityType: 'tree_created',
          description: `Created tree: ${tree.name}`,
          activityData: {
            nodeCount: treeData.nodes.length,
            connectionCount: treeData.connections.length
          }
        });

      return tree;
    });
  }

  async moveNode(nodeId: string, newParentId: string | null, newPosition: { x: number; y: number }) {
    return await db.transaction(async (tx) => {
      // Update node position and parent
      const [updatedNode] = await tx
        .update(treeNodes)
        .set({
          parentId: newParentId,
          position: newPosition,
          updatedAt: new Date()
        })
        .where(eq(treeNodes.id, nodeId))
        .returning();

      if (!updatedNode) {
        throw new Error('Node not found');
      }

      // Update tree's updated timestamp
      await tx
        .update(impactTrees)
        .set({ updatedAt: new Date() })
        .where(eq(impactTrees.id, updatedNode.treeId));

      // Log activity
      await tx
        .insert(userActivities)
        .values({
          userId: 'current_user_id', // Get from context
          treeId: updatedNode.treeId,
          activityType: 'node_moved',
          description: `Moved node: ${updatedNode.title}`,
          activityData: {
            nodeId,
            newParentId,
            newPosition
          }
        });

      return updatedNode;
    });
  }
}
```

---

## 🚀 **Performance Optimization**

### **1. Indexing Strategy**

Optimize queries with proper indexes:

```typescript
// ✅ RECOMMENDED: Comprehensive indexing
export const impactTrees = pgTable("impact_trees", {
  // ... column definitions
}, (table) => ({
  // Single column indexes
  userIdx: index("idx_trees_user").on(table.user_id),
  nameIdx: index("idx_trees_name").on(table.name),
  
  // Composite indexes for common queries
  userUpdatedIdx: index("idx_trees_user_updated").on(table.user_id, table.updatedAt.desc()),
  userNameIdx: index("idx_trees_user_name").on(table.user_id, table.name),
  
  // Partial indexes for filtered queries
  templateTreesIdx: index("idx_trees_templates").on(table.user_id).where(eq(table.isTemplate, true)),
  
  // GIN indexes for JSONB queries
  nodesGin: index("idx_trees_nodes").using("gin", table.nodes),
  canvasStateGin: index("idx_trees_canvas_state").using("gin", table.canvasState),
  
  // Expression indexes for computed values
  nodeCountIdx: index("idx_trees_node_count").on(
    sql`jsonb_array_length(${table.nodes})`
  ),
}));
```

### **2. Query Optimization**

Optimize complex queries:

```typescript
// ✅ RECOMMENDED: Query optimization patterns
export class OptimizedTreeQueries {
  // Use prepared statements for repeated queries
  private static getUserTreesStatement = db
    .select({
      id: impactTrees.id,
      name: impactTrees.name,
      description: impactTrees.description,
      nodeCount: sql<number>`jsonb_array_length(${impactTrees.nodes})`,
      updatedAt: impactTrees.updatedAt
    })
    .from(impactTrees)
    .where(eq(impactTrees.user_id, sql.placeholder('userId')))
    .orderBy(desc(impactTrees.updatedAt))
    .prepare();

  static async getUserTrees(userId: string) {
    return await this.getUserTreesStatement.execute({ userId });
  }

  // Use subqueries for complex filtering
  static async getTreesWithMinNodes(userId: string, minNodes: number) {
    return await db
      .select()
      .from(impactTrees)
      .where(and(
        eq(impactTrees.user_id, userId),
        sql`jsonb_array_length(${impactTrees.nodes}) >= ${minNodes}`
      ))
      .orderBy(desc(impactTrees.updatedAt));
  }

  // Use CTEs for hierarchical queries
  static async getNodeHierarchy(treeId: number) {
    return await db.execute(sql`
      WITH RECURSIVE node_hierarchy AS (
        -- Base case: root nodes
        SELECT 
          id, 
          parent_id, 
          title, 
          node_type, 
          0 as depth,
          id::text as path
        FROM ${treeNodes}
        WHERE tree_id = ${treeId} AND parent_id IS NULL
        
        UNION ALL
        
        -- Recursive case: child nodes
        SELECT 
          n.id, 
          n.parent_id, 
          n.title, 
          n.node_type, 
          nh.depth + 1,
          nh.path || '/' || n.id
        FROM ${treeNodes} n
        JOIN node_hierarchy nh ON n.parent_id = nh.id
      )
      SELECT * FROM node_hierarchy
      ORDER BY depth, path
    `);
  }
}
```

### **3. Connection Pooling**

Configure efficient connection pooling:

```typescript
// ✅ RECOMMENDED: Connection pool configuration
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Pool configuration for performance
  max: 20,                    // Maximum connections
  min: 5,                     // Minimum connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Timeout when acquiring connection
  acquireTimeoutMillis: 60000,   // Timeout when acquiring from pool
  
  // Connection validation
  allowExitOnIdle: true,
  
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

export const db = drizzle(pool, { schema });

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database connections...');
  await pool.end();
  process.exit(0);
});
```

---

## 📊 **Migration Patterns**

### **1. Schema Migrations**

Use Drizzle migrations for schema changes:

```typescript
// ✅ RECOMMENDED: Migration patterns
// migrations/0001_initial.sql
CREATE TABLE IF NOT EXISTS "impact_trees" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" varchar(255) NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "nodes" jsonb DEFAULT '[]' NOT NULL,
  "connections" jsonb DEFAULT '[]' NOT NULL,
  "canvas_state" jsonb DEFAULT '{"zoom": 1, "pan": {"x": 0, "y": 0}, "orientation": "vertical"}' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_trees_user" ON "impact_trees" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_trees_updated" ON "impact_trees" ("updated_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_trees_nodes" ON "impact_trees" USING gin ("nodes");

// migrations/0002_add_node_table.sql
CREATE TABLE IF NOT EXISTS "tree_nodes" (
  "id" text PRIMARY KEY NOT NULL,
  "tree_id" integer NOT NULL,
  "parent_id" text,
  "node_type" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "position" jsonb DEFAULT '{"x": 0, "y": 0}' NOT NULL,
  "template_data" jsonb DEFAULT '{}',
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "tree_nodes" ADD CONSTRAINT "tree_nodes_tree_id_impact_trees_id_fk" 
  FOREIGN KEY ("tree_id") REFERENCES "impact_trees"("id") ON DELETE cascade;
ALTER TABLE "tree_nodes" ADD CONSTRAINT "tree_nodes_parent_id_tree_nodes_id_fk" 
  FOREIGN KEY ("parent_id") REFERENCES "tree_nodes"("id") ON DELETE cascade;

CREATE INDEX IF NOT EXISTS "idx_tree_nodes_tree_id" ON "tree_nodes" ("tree_id");
CREATE INDEX IF NOT EXISTS "idx_tree_nodes_parent_id" ON "tree_nodes" ("parent_id");
```

### **2. Data Migration Utilities**

Create utilities for data transformations:

```typescript
// ✅ RECOMMENDED: Data migration utilities
export class DataMigration {
  // Migrate existing JSONB nodes to individual records
  static async migrateNodesToTable() {
    const trees = await db.select().from(impactTrees);
    
    for (const tree of trees) {
      const nodes = tree.nodes as any[];
      if (nodes && nodes.length > 0) {
        const nodeInserts = nodes.map(node => ({
          id: node.id,
          treeId: tree.id,
          parentId: node.parentId,
          nodeType: node.type,
          title: node.title,
          description: node.description,
          position: node.position,
          templateData: node.templateData || {}
        }));

        await db.insert(treeNodes).values(nodeInserts);
      }
    }
  }

  // Cleanup orphaned records
  static async cleanupOrphanedNodes() {
    await db.execute(sql`
      DELETE FROM ${treeNodes} 
      WHERE tree_id NOT IN (
        SELECT id FROM ${impactTrees}
      )
    `);
  }

  // Update canvas state format
  static async updateCanvasStateFormat() {
    const trees = await db.select().from(impactTrees);
    
    for (const tree of trees) {
      const canvasState = tree.canvasState as any;
      if (canvasState && !canvasState.orientation) {
        const updatedState = {
          ...canvasState,
          orientation: 'vertical'
        };
        
        await db
          .update(impactTrees)
          .set({ canvasState: updatedState })
          .where(eq(impactTrees.id, tree.id));
      }
    }
  }
}
```

---

## 🎯 **Best Practices Summary**

1. **Type Safety**: Use Drizzle schemas with Zod validation
2. **Indexing**: Create appropriate indexes for query patterns
3. **Transactions**: Use transactions for complex operations
4. **Connection Pooling**: Configure efficient connection pools
5. **Query Optimization**: Use prepared statements and CTEs
6. **Migration Strategy**: Plan schema changes carefully
7. **JSONB Usage**: Use JSONB for flexible data with proper indexing
8. **Activity Tracking**: Log user activities for analytics

---

**📝 Guidelines Version**: 1.0  
**🎯 Project Type**: React + Node.js Database  
**📅 Last Updated**: July 2025  
**🚀 Status**: Production Ready