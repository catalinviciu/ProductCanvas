import { type ImpactTree, type InsertImpactTree, type User, type UpsertUser } from "@shared/schema";
import { db } from "./db";
import { users, impactTrees } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User operations for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  // Impact tree operations
  getImpactTree(id: number): Promise<ImpactTree | undefined>;
  getAllImpactTrees(): Promise<ImpactTree[]>;
  createImpactTree(tree: InsertImpactTree): Promise<ImpactTree>;
  updateImpactTree(id: number, tree: Partial<InsertImpactTree>): Promise<ImpactTree | undefined>;
  deleteImpactTree(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Impact tree operations
  async getImpactTree(id: number): Promise<ImpactTree | undefined> {
    const [tree] = await db.select().from(impactTrees).where(eq(impactTrees.id, id));
    return tree;
  }

  async getAllImpactTrees(): Promise<ImpactTree[]> {
    return await db.select().from(impactTrees);
  }

  async createImpactTree(insertTree: InsertImpactTree): Promise<ImpactTree> {
    const [tree] = await db
      .insert(impactTrees)
      .values(insertTree)
      .returning();
    return tree;
  }

  async updateImpactTree(id: number, updates: Partial<InsertImpactTree>): Promise<ImpactTree | undefined> {
    const [tree] = await db
      .update(impactTrees)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(impactTrees.id, id))
      .returning();
    return tree;
  }

  async deleteImpactTree(id: number): Promise<boolean> {
    const result = await db
      .delete(impactTrees)
      .where(eq(impactTrees.id, id))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();