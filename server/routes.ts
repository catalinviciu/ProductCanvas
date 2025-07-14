import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertImpactTreeSchema, type TreeNode, type NodeConnection, type CanvasState } from "@shared/schema";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { registerEnhancedRoutes } from "./enhanced-routes";
import impactTreeRoutes from "./routes/impact-tree-routes";

const updateNodeSchema = z.object({
  id: z.string(),
  type: z.enum(["outcome", "opportunity", "solution", "assumption"]),
  title: z.string(),
  description: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  parentId: z.string().optional(),
  testCategory: z.enum(["viability", "value", "feasibility", "usability"]).optional(),
  children: z.array(z.string())
});

const updateCanvasSchema = z.object({
  nodes: z.array(updateNodeSchema),
  connections: z.array(z.object({
    id: z.string(),
    fromNodeId: z.string(),
    toNodeId: z.string()
  })),
  canvasState: z.object({
    zoom: z.number(),
    pan: z.object({
      x: z.number(),
      y: z.number()
    })
  })
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Register new tree and node routes FIRST (before old routes to avoid conflicts)
  app.use(impactTreeRoutes);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Old routes are removed - using the new impact tree routes instead

  // Register enhanced routes for AI and user progress tracking
  registerEnhancedRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
