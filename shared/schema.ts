import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

// Node types
export const nodeTypes = ["outcome", "opportunity", "solution", "assumption", "kpi"] as const;
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
}

export interface NodeConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
}

export interface CanvasState {
  zoom: number;
  pan: { x: number; y: number };
}
