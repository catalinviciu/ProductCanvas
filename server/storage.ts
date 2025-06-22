import { type ImpactTree, type InsertImpactTree } from "@shared/schema";

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
    this.createSampleTree();
  }

  private createSampleTree() {
    const sampleTree: ImpactTree = {
      id: 1,
      name: "Product Strategy Canvas",
      description: "User retention improvement strategy",
      nodes: [],
      connections: [],
      canvasState: {
        zoom: 1,
        pan: { x: 0, y: 0 },
        orientation: 'horizontal'
      },
      createdAt: new Date('2024-01-15T10:00:00Z'),
      updatedAt: new Date('2024-01-20T14:30:00Z')
    };

    this.impactTrees.set(1, sampleTree);
  }

  async getImpactTree(id: number): Promise<ImpactTree | undefined> {
    return this.impactTrees.get(id);
  }

  async getAllImpactTrees(): Promise<ImpactTree[]> {
    return Array.from(this.impactTrees.values());
  }

  async createImpactTree(insertTree: InsertImpactTree): Promise<ImpactTree> {
    this.currentId++;
    const tree: ImpactTree = {
      id: this.currentId,
      ...insertTree,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.impactTrees.set(this.currentId, tree);
    return tree;
  }

  async updateImpactTree(id: number, updates: Partial<InsertImpactTree>): Promise<ImpactTree | undefined> {
    const existingTree = this.impactTrees.get(id);
    if (!existingTree) return undefined;

    const updatedTree: ImpactTree = {
      ...existingTree,
      ...updates,
      updatedAt: new Date()
    };

    this.impactTrees.set(id, updatedTree);
    return updatedTree;
  }

  async deleteImpactTree(id: number): Promise<boolean> {
    return this.impactTrees.delete(id);
  }
}

export const storage = new MemStorage();