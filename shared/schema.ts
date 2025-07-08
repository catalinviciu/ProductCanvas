import { pgTable, text, serial, integer, jsonb, timestamp, varchar, index } from "drizzle-orm/pg-core";
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
  name: text("name").notNull(),
  description: text("description"),
  nodes: jsonb("nodes").notNull().default('[]'),
  connections: jsonb("connections").notNull().default('[]'),
  canvasState: jsonb("canvas_state").notNull().default('{"zoom": 1, "pan": {"x": 0, "y": 0}}'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertImpactTreeSchema = createInsertSchema(impactTrees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertImpactTree = z.infer<typeof insertImpactTreeSchema>;
export type ImpactTree = typeof impactTrees.$inferSelect;

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
