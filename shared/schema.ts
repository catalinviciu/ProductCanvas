import { pgTable, text, serial, integer, jsonb, timestamp, varchar, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const impactTrees = pgTable("impact_trees", {
  id: serial("id").primaryKey(),
  user_id: varchar("user_id", { length: 255 }),
  name: text("name").notNull(),
  description: text("description"),
  
  // Canvas state persistence
  canvasState: jsonb("canvas_state").notNull().default('{"zoom": 1, "pan": {"x": 0, "y": 0}}'),
  
  // AI-optimized structure
  treeStructure: jsonb("tree_structure").notNull().default('{}'),
  userMetrics: jsonb("user_metrics").notNull().default('{}'),
  aiMetadata: jsonb("ai_metadata").notNull().default('{}'),
  processingVersion: integer("processing_version").default(1),
  lastAiProcessedAt: timestamp("last_ai_processed_at"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userUpdatedIdx: index("idx_trees_user_updated").on(table.user_id, table.updatedAt.desc()),
  aiProcessingIdx: index("idx_trees_ai_processing").on(table.lastAiProcessedAt, table.processingVersion),
  treeStructureGin: index("idx_tree_structure_gin").using("gin", table.treeStructure),
}));

export const treeVersions = pgTable("tree_versions", {
  id: serial("id").primaryKey(),
  treeId: integer("tree_id").notNull().references(() => impactTrees.id, { onDelete: 'cascade' }),
  versionNumber: integer("version_number").notNull(),
  treeSnapshot: jsonb("tree_snapshot").notNull(),
  changeDescription: text("change_description"),
  userId: varchar("user_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  treeTimeIdx: index("idx_versions_tree_time").on(table.treeId, table.createdAt.desc()),
  uniqueVersion: unique("unique_tree_version").on(table.treeId, table.versionNumber),
}));

// Individual tree nodes table with adjacency list model
export const treeNodes = pgTable("tree_nodes", {
  id: text("id").primaryKey(),
  treeId: integer("tree_id").notNull().references(() => impactTrees.id, { onDelete: "cascade" }),
  parentId: text("parent_id").references(() => treeNodes.id, { onDelete: "cascade" }),
  nodeType: text("node_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  templateData: jsonb("template_data").default('{}'),
  position: jsonb("position").notNull().default('{"x": 0, "y": 0}'),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  treeIdIdx: index("idx_tree_nodes_tree_id").on(table.treeId),
  parentIdIdx: index("idx_tree_nodes_parent_id").on(table.parentId),
  nodeTypeIdx: index("idx_tree_nodes_type").on(table.nodeType),
  templateDataGin: index("idx_tree_nodes_template_data").using("gin", table.templateData),
}));

export const userActivities = pgTable("user_activities", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  treeId: integer("tree_id").references(() => impactTrees.id, { onDelete: 'cascade' }),
  nodeId: varchar("node_id", { length: 255 }),
  activityType: varchar("activity_type", { length: 50 }).notNull(),
  activityData: jsonb("activity_data").notNull().default('{}'),
  sessionId: varchar("session_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  durationMs: integer("duration_ms"),
}, (table) => ({
  userTimeIdx: index("idx_activities_user_time").on(table.userId, table.createdAt.desc()),
  treeTypeIdx: index("idx_activities_tree_type").on(table.treeId, table.activityType, table.createdAt.desc()),
}));

export const insertImpactTreeSchema = createInsertSchema(impactTrees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertImpactTree = z.infer<typeof insertImpactTreeSchema>;
export type ImpactTree = typeof impactTrees.$inferSelect;
export type TreeVersion = typeof treeVersions.$inferSelect;
export type UserActivity = typeof userActivities.$inferSelect;
export type InsertTreeVersion = typeof treeVersions.$inferInsert;
export type InsertUserActivity = typeof userActivities.$inferInsert;
export type TreeNodeRecord = typeof treeNodes.$inferSelect;
export type InsertTreeNode = typeof treeNodes.$inferInsert;

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Node types
export const nodeTypes = ["objective", "outcome", "opportunity", "solution", "assumption", "metric", "research"] as const;
export const testCategories = ["viability", "value", "feasibility", "usability"] as const;

export type NodeType = typeof nodeTypes[number];
export type TestCategory = typeof testCategories[number];

export interface TreeNode {
  id: string;
  type: NodeType;
  title: string;
  description: string;
  position: { x: number; y: number };
  parentId?: string;
  testCategory?: TestCategory;
  children: string[];
  isCollapsed?: boolean;
  hiddenChildren?: string[]; // Track which specific children are hidden
  isDragging?: boolean; // Track drag state for visual feedback
  templateData?: {
    // Objective fields
    coreWhy?: string;
    desiredOutcome?: string;
    strategicContext?: string;
    targetAudience?: string;
    exclusionCriteria?: string;
    
    // Outcome fields
    who?: string;
    doesWhat?: string;
    baseline?: string;
    target?: string;
    measurementMethod?: string;
    timeframe?: string;
    
    // Opportunity fields
    customerProblem?: string;
    evidenceInsights?: string;
    linkToKeyResult?: string;
    impactOnCustomer?: string;
    customerSegments?: string;
    
    // ICE scoring
    iceImpact?: number;
    iceConfidence?: number;
    iceEase?: number;
    iceImpactRationale?: string;
    iceConfidenceRationale?: string;
    iceEaseRationale?: string;
    
    // Solution fields
    solutionRationale?: string;
    implementationApproach?: string;
    keyFeatures?: string;
    technicalRequirements?: string;
    userExperience?: string;
    dependencies?: string;
    
    // RICE scoring for Solutions
    riceReach?: number;
    riceImpact?: number;
    riceConfidence?: number;
    riceEffort?: number;
    riceReachRationale?: string;
    riceImpactRationale?: string;
    riceConfidenceRationale?: string;
    riceEffortRationale?: string;
    
    // Assumption Test fields
    assumptionType?: string;
    hypothesisStatement?: string;
    testMethod?: string;
    successCriteria?: string;
    riskLevel?: string;
    
    // Evidence-Impact scoring for Assumptions
    evidenceScore?: number;
    impactScore?: number;
    evidenceRationale?: string;
    impactRationale?: string;
    
    // Metric fields
    metricType?: string;
    metricDefinition?: string;
    calculationMethod?: string;
    dataSource?: string;
    reportingFrequency?: string;
    
    // Research fields
    researchQuestions?: string;
    methodology?: string;
    participants?: string;
    timeline?: string;
    expectedOutcomes?: string;
    researchType?: string;
  };
}

export interface NodeConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
}

export interface CanvasState {
  zoom: number;
  pan: { x: number; y: number };
  orientation: 'horizontal' | 'vertical';
}
