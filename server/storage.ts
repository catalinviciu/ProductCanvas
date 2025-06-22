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
      nodes: [],
      connections: [
        { id: "conn-1", fromNodeId: "outcome-1", toNodeId: "opportunity-1" },
        { id: "conn-2", fromNodeId: "outcome-1", toNodeId: "opportunity-2" },
        { id: "conn-3", fromNodeId: "opportunity-1", toNodeId: "solution-1" },
        { id: "conn-4", fromNodeId: "opportunity-2", toNodeId: "solution-2" },
        { id: "conn-5", fromNodeId: "opportunity-2", toNodeId: "solution-3" },
        { id: "conn-6", fromNodeId: "solution-1", toNodeId: "assumption-1" },
        { id: "conn-7", fromNodeId: "solution-2", toNodeId: "assumption-2" },
        { id: "conn-8", fromNodeId: "solution-3", toNodeId: "assumption-3" },
        { id: "conn-9", fromNodeId: "assumption-1", toNodeId: "kpi-1" },
        { id: "conn-10", fromNodeId: "assumption-2", toNodeId: "kpi-2" },
        { id: "conn-11", fromNodeId: "assumption-3", toNodeId: "kpi-3" }
      ],
      canvasState: { zoom: 1, pan: { x: 0, y: 0 }, orientation: 'horizontal' },
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
