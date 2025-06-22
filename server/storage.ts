import { impactTrees, type ImpactTree, type InsertImpactTree } from "@shared/schema";

export interface IStorage {
  getImpactTree(id: number): Promise<ImpactTree | undefined>;
  getAllImpactTrees(): Promise<ImpactTree[]>;
  createImpactTree(tree: InsertImpactTree): Promise<ImpactTree>;
  updateImpactTree(id: number, tree: Partial<InsertImpactTree>): Promise<ImpactTree | undefined>;
  deleteImpactTree(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private impactTrees: Map<number, ImpactTree>;
  private currentId: number;

  constructor() {
    this.impactTrees = new Map();
    this.currentId = 1;
    
    // Initialize with a sample impact tree
    this.createSampleTree();
  }

  private createSampleTree() {
    const sampleTree: ImpactTree = {
      id: 1,
      name: "Product Strategy Canvas",
      description: "User retention improvement strategy",
      nodes: [
        {
          id: "outcome-1",
          type: "outcome",
          title: "Increase User Retention by 25%",
          description: "Improve long-term user engagement and reduce churn rate through strategic product improvements",
          position: { x: 200, y: 100 },
          children: ["opportunity-1", "opportunity-2"]
        },
        {
          id: "opportunity-1",
          type: "opportunity", 
          title: "Improve Onboarding Experience",
          description: "Streamline the user onboarding process to reduce drop-off rates",
          position: { x: 500, y: 200 },
          parentId: "outcome-1",
          children: ["solution-1"]
        },
        {
          id: "opportunity-2",
          type: "opportunity",
          title: "Enhance Core Features", 
          description: "Add value to existing features that users engage with most",
          position: { x: 500, y: 300 },
          parentId: "outcome-1",
          children: ["solution-2", "solution-3"]
        },
        {
          id: "solution-1",
          type: "solution",
          title: "Interactive Tutorial System",
          description: "Create guided tutorials that adapt to user behavior and preferences", 
          position: { x: 800, y: 300 },
          parentId: "opportunity-1",
          children: ["assumption-1"]
        },
        {
          id: "solution-2", 
          type: "solution",
          title: "Smart Recommendations",
          description: "AI-powered feature suggestions based on user patterns",
          position: { x: 800, y: 400 },
          parentId: "opportunity-2",
          children: ["assumption-2"]
        },
        {
          id: "solution-3",
          type: "solution", 
          title: "Personalized Dashboard",
          description: "Customizable interface that adapts to individual user needs",
          position: { x: 800, y: 500 },
          parentId: "opportunity-2", 
          children: ["assumption-3"]
        },
        {
          id: "assumption-1",
          type: "assumption",
          title: "Users will complete tutorials",
          description: "Test if users engage with and complete interactive tutorials",
          position: { x: 1100, y: 400 },
          parentId: "solution-1",
          testCategory: "usability",
          children: []
        },
        {
          id: "assumption-2",
          type: "assumption",
          title: "AI recommendations add value", 
          description: "Validate that users find AI-generated recommendations helpful",
          position: { x: 1100, y: 500 },
          parentId: "solution-2",
          testCategory: "value",
          children: []
        },
        {
          id: "assumption-3",
          type: "assumption",
          title: "Personalization is technically viable",
          description: "Test technical feasibility of real-time dashboard personalization",
          position: { x: 1100, y: 600 },
          parentId: "solution-3", 
          testCategory: "feasibility",
          children: []
        }
      ],
      connections: [
        { id: "conn-1", fromNodeId: "outcome-1", toNodeId: "opportunity-1" },
        { id: "conn-2", fromNodeId: "outcome-1", toNodeId: "opportunity-2" },
        { id: "conn-3", fromNodeId: "opportunity-1", toNodeId: "solution-1" },
        { id: "conn-4", fromNodeId: "opportunity-2", toNodeId: "solution-2" },
        { id: "conn-5", fromNodeId: "opportunity-2", toNodeId: "solution-3" },
        { id: "conn-6", fromNodeId: "solution-1", toNodeId: "assumption-1" },
        { id: "conn-7", fromNodeId: "solution-2", toNodeId: "assumption-2" },
        { id: "conn-8", fromNodeId: "solution-3", toNodeId: "assumption-3" }
      ],
      canvasState: { zoom: 1, pan: { x: 0, y: 0 } },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.impactTrees.set(1, sampleTree);
    this.currentId = 2;
  }

  async getImpactTree(id: number): Promise<ImpactTree | undefined> {
    return this.impactTrees.get(id);
  }

  async getAllImpactTrees(): Promise<ImpactTree[]> {
    return Array.from(this.impactTrees.values());
  }

  async createImpactTree(insertTree: InsertImpactTree): Promise<ImpactTree> {
    const id = this.currentId++;
    const tree: ImpactTree = {
      ...insertTree,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.impactTrees.set(id, tree);
    return tree;
  }

  async updateImpactTree(id: number, updates: Partial<InsertImpactTree>): Promise<ImpactTree | undefined> {
    const existingTree = this.impactTrees.get(id);
    if (!existingTree) return undefined;

    const updatedTree: ImpactTree = {
      ...existingTree,
      ...updates,
      updatedAt: new Date(),
    };
    this.impactTrees.set(id, updatedTree);
    return updatedTree;
  }

  async deleteImpactTree(id: number): Promise<boolean> {
    return this.impactTrees.delete(id);
  }
}

export const storage = new MemStorage();
