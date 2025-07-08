import type { Express } from "express";
import { enhancedStorage } from "./enhanced-storage";
import { z } from "zod";

const aiProcessingSchema = z.object({
  treeIds: z.array(z.number()),
  processingResults: z.array(z.object({
    treeId: z.number(),
    insights: z.record(z.any()),
    confidence: z.number(),
    processedAt: z.string(),
  })),
});

const enhancedTreeUpdateSchema = z.object({
  nodes: z.array(z.any()),
  connections: z.array(z.any()),
  canvasState: z.object({
    zoom: z.number(),
    pan: z.object({
      x: z.number(),
      y: z.number(),
    }),
    orientation: z.enum(['horizontal', 'vertical']),
  }),
  activityType: z.string().optional().default('manual_save'),
  sessionId: z.string().optional(),
});

export function registerEnhancedRoutes(app: Express) {
  
  // Enhanced tree save with tracking
  app.put("/api/impact-trees/:id/enhanced", async (req, res) => {
    try {
      const treeId = parseInt(req.params.id);
      const userId = req.user?.claims.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const validatedData = enhancedTreeUpdateSchema.parse(req.body);
      
      const updatedTree = await enhancedStorage.saveTreeWithTracking(
        treeId,
        userId,
        validatedData
      );
      
      res.json(updatedTree);
    } catch (error) {
      console.error("Enhanced tree save error:", error);
      res.status(500).json({ message: "Failed to save tree with tracking" });
    }
  });
  
  // Get trees for AI processing
  app.get("/api/ai/trees/batch", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const lastProcessedBefore = req.query.lastProcessedBefore 
        ? new Date(req.query.lastProcessedBefore as string)
        : undefined;
      
      const trees = await enhancedStorage.getTreesForAIProcessing(limit, lastProcessedBefore);
      
      res.json({
        trees,
        count: trees.length,
        hasMore: trees.length === limit,
      });
    } catch (error) {
      console.error("AI batch fetch error:", error);
      res.status(500).json({ message: "Failed to fetch trees for AI processing" });
    }
  });
  
  // Mark trees as AI processed
  app.post("/api/ai/trees/mark-processed", async (req, res) => {
    try {
      const validatedData = aiProcessingSchema.parse(req.body);
      
      await enhancedStorage.markAIProcessed(
        validatedData.treeIds,
        validatedData.processingResults
      );
      
      res.json({ 
        message: "Trees marked as processed",
        processedCount: validatedData.treeIds.length 
      });
    } catch (error) {
      console.error("AI processing update error:", error);
      res.status(500).json({ message: "Failed to update AI processing status" });
    }
  });
  
  // User progress analytics
  app.get("/api/users/:userId/progress", async (req, res) => {
    try {
      const userId = req.params.userId;
      const requestingUserId = req.user?.claims.sub;
      
      // Ensure users can only access their own data
      if (userId !== requestingUserId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const analytics = await enhancedStorage.getUserProgressAnalytics(userId);
      
      res.json(analytics);
    } catch (error) {
      console.error("User progress analytics error:", error);
      res.status(500).json({ message: "Failed to fetch user progress" });
    }
  });
  
  // Tree version history
  app.get("/api/impact-trees/:id/versions", async (req, res) => {
    try {
      const treeId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 10;
      
      const versions = await enhancedStorage.getTreeVersions(treeId, limit);
      
      res.json(versions);
    } catch (error) {
      console.error("Tree versions fetch error:", error);
      res.status(500).json({ message: "Failed to fetch tree versions" });
    }
  });
  
  // Get user activities for a tree
  app.get("/api/impact-trees/:id/activities", async (req, res) => {
    try {
      const treeId = parseInt(req.params.id);
      const userId = req.user?.claims.sub;
      const limit = parseInt(req.query.limit as string) || 50;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // This could be implemented in enhanced storage
      res.json({ activities: [], message: "Activities endpoint ready" });
    } catch (error) {
      console.error("Tree activities fetch error:", error);
      res.status(500).json({ message: "Failed to fetch tree activities" });
    }
  });
  
  // Get analytics dashboard data
  app.get("/api/analytics/dashboard", async (req, res) => {
    try {
      const userId = req.user?.claims.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const analytics = await enhancedStorage.getUserProgressAnalytics(userId);
      
      // Enhanced dashboard data
      const dashboardData = {
        userProgress: analytics,
        systemMetrics: {
          totalTreesInSystem: 1, // Could be implemented
          avgTreeCompletionRate: 0.7,
          activeUsers: 1,
        },
        suggestions: [
          "Complete template fields for better AI insights",
          "Add more connections between nodes",
          "Review and update older trees",
        ],
      };
      
      res.json(dashboardData);
    } catch (error) {
      console.error("Dashboard analytics error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });
}