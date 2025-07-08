import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertImpactTreeSchema, type TreeNode, type NodeConnection, type CanvasState } from "@shared/schema";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./replitAuth";

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

  // Get all impact trees
  app.get("/api/impact-trees", isAuthenticated, async (req, res) => {
    try {
      const trees = await storage.getAllImpactTrees();
      
      // If no trees exist, create a sample tree
      if (trees.length === 0) {
        const sampleTree = await storage.createImpactTree({
          name: "Sample Product Strategy",
          description: "A sample impact tree demonstrating strategic planning",
          nodes: [],
          connections: [],
          canvasState: {
            zoom: 1,
            pan: { x: 0, y: 0 },
            orientation: 'vertical'
          }
        });
        res.json([sampleTree]);
      } else {
        res.json(trees);
      }
    } catch (error) {
      console.error("Error fetching impact trees:", error);
      res.status(500).json({ message: "Failed to fetch impact trees" });
    }
  });

  // Get a specific impact tree
  app.get("/api/impact-trees/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid tree ID" });
      }

      const tree = await storage.getImpactTree(id);
      if (!tree) {
        return res.status(404).json({ message: "Impact tree not found" });
      }

      res.json(tree);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch impact tree" });
    }
  });

  // Create a new impact tree
  app.post("/api/impact-trees", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertImpactTreeSchema.parse(req.body);
      const tree = await storage.createImpactTree(validatedData);
      res.status(201).json(tree);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create impact tree" });
    }
  });

  // Update an impact tree
  app.put("/api/impact-trees/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid tree ID" });
      }

      const validatedData = updateCanvasSchema.parse(req.body);
      const updatedTree = await storage.updateImpactTree(id, {
        nodes: validatedData.nodes,
        connections: validatedData.connections,
        canvasState: validatedData.canvasState
      });

      if (!updatedTree) {
        return res.status(404).json({ message: "Impact tree not found" });
      }

      res.json(updatedTree);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update impact tree" });
    }
  });

  // Delete an impact tree
  app.delete("/api/impact-trees/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid tree ID" });
      }

      const deleted = await storage.deleteImpactTree(id);
      if (!deleted) {
        return res.status(404).json({ message: "Impact tree not found" });
      }

      res.json({ message: "Impact tree deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete impact tree" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
