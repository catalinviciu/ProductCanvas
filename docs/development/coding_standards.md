
# 🎨 AI-Native Impact Tree Coding Standards

> **Comprehensive coding standards for React + Node.js development in the Impact Tree project**

---

## 📋 **Overview**

This document establishes coding standards for the AI-Native Impact Tree project to ensure consistent, maintainable, and high-quality code across the React frontend and Node.js backend, with special focus on canvas performance and PM discovery workflow support.

---

## 🟢 **Node.js + Express Standards**

### **Code Style**
- **Google JavaScript Style Guide**: Follow Google's JavaScript/TypeScript style guidelines
- **Line Length**: Maximum 100 characters
- **Indentation**: 2 spaces (no tabs)
- **Encoding**: UTF-8 for all TypeScript files

### **Naming Conventions**
```typescript
// Variables and functions: camelCase
const impactTreeData = [];
function calculateTreeDepth() {}

// Classes: PascalCase
export class ImpactTreeService {}
export class DiscoveryAIService {}

// Constants: UPPER_SNAKE_CASE
const MAX_TREE_NODES = 500;
const VERTEX_AI_TIMEOUT = 30000;

// Files: kebab-case
impact-tree-service.ts
discovery-ai-service.ts
tree-validation.ts

// API endpoints: kebab-case with RESTful patterns
GET /api/impact-trees
POST /api/impact-trees/:id/canvas
PUT /api/discovery/insights
```

### **Express API Patterns**
```typescript
// ✅ RECOMMENDED: Impact tree API structure
import express from 'express';
import { z } from 'zod';
import { ImpactTreeService } from '../services/impact-tree-service';

const router = express.Router();
const treeService = new ImpactTreeService();

/**
 * Get impact tree by ID
 * Supports PM discovery workflow with full tree structure
 */
router.get('/api/impact-trees/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ 
        error: 'Invalid tree ID',
        code: 'INVALID_TREE_ID'
      });
    }

    const tree = await treeService.getTreeById(id);
    if (!tree) {
      return res.status(404).json({ 
        error: 'Impact tree not found',
        code: 'TREE_NOT_FOUND'
      });
    }

    res.json(tree);
  } catch (error) {
    console.error('Error fetching impact tree:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * Update canvas state for PM discovery workflow
 * Handles tree node positions, connections, and canvas state
 */
router.put('/api/impact-trees/:id/canvas', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = updateCanvasSchema.parse(req.body);
    
    const updatedTree = await treeService.updateCanvasState(id, validatedData);
    if (!updatedTree) {
      return res.status(404).json({ 
        error: 'Impact tree not found',
        code: 'TREE_NOT_FOUND'
      });
    }

    res.json(updatedTree);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid canvas data',
        code: 'VALIDATION_ERROR',
        details: error.errors
      });
    }
    
    console.error('Error updating canvas state:', error);
    res.status(500).json({ 
      error: 'Failed to update canvas state',
      code: 'UPDATE_ERROR'
    });
  }
});
```

### **Error Handling Patterns**
```typescript
// ✅ RECOMMENDED: Consistent error handling for PM workflow
export class ImpactTreeError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ImpactTreeError';
  }
}

export class TreeNotFoundError extends ImpactTreeError {
  constructor(treeId: number) {
    super(`Impact tree with ID ${treeId} not found`, 'TREE_NOT_FOUND', 404);
  }
}

export class CanvasStateError extends ImpactTreeError {
  constructor(message: string) {
    super(message, 'CANVAS_STATE_ERROR', 400);
  }
}

// Global error handler for Express
export const errorHandler = (error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof ImpactTreeError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code
    });
  }

  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
};
```

---

## ⚛️ **React + TypeScript Standards**

### **Code Style**
- **Prettier Configuration**: Use Prettier for consistent formatting
- **Line Length**: Maximum 100 characters
- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings, double quotes for JSX attributes

### **Component Naming and Structure**
```typescript
// ✅ RECOMMENDED: Impact tree component structure
import React, { useState, useEffect, useCallback, memo } from 'react';
import { TreeNode, NodeConnection, CanvasState } from '../types/canvas';
import { useTreeStore } from '../stores/tree-store';

interface ImpactTreeCanvasProps {
  treeId: number;
  onNodeSelect?: (node: TreeNode | null) => void;
  onTreeUpdate?: (updates: CanvasUpdate) => void;
  className?: string;
}

/**
 * Interactive canvas for PM discovery workflow
 * Supports tree visualization, node editing, and discovery activities
 */
export const ImpactTreeCanvas: React.FC<ImpactTreeCanvasProps> = memo(({
  treeId,
  onNodeSelect,
  onTreeUpdate,
  className
}) => {
  const {
    nodes,
    connections,
    canvasState,
    selectedNode,
    updateCanvasState,
    selectNode
  } = useTreeStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  // Canvas interaction for PM discovery workflow
  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      selectNode(null); // Deselect nodes when clicking empty canvas
      onNodeSelect?.(null);
    }
  }, [selectNode, onNodeSelect]);

  // Optimized canvas rendering for large trees
  const handleCanvasRender = useCallback(() => {
    // Canvas rendering logic optimized for 100+ nodes
    // Use virtualization for trees larger than 200 nodes
  }, [nodes, connections, canvasState]);

  // Discovery workflow support
  const handleNodeCreate = useCallback((nodeType: NodeType, position: Position) => {
    const newNode: TreeNode = {
      id: crypto.randomUUID(),
      type: nodeType,
      title: getNodePlaceholder(nodeType),
      position,
      metadata: {}
    };

    addNode(newNode);
    onTreeUpdate?.({
      type: 'node_added',
      node: newNode
    });
  }, [addNode, onTreeUpdate]);

  return (
    <div 
      className={`impact-tree-canvas ${className || ''}`}
      onClick={handleCanvasClick}
      data-testid="impact-tree-canvas"
    >
      {/* Canvas rendering optimized for PM workflow */}
      <svg className="connections-layer">
        {connections.map(connection => (
          <ConnectionLine
            key={connection.id}
            connection={connection}
            nodes={nodes}
            zoom={canvasState.zoom}
          />
        ))}
      </svg>

      {/* Tree nodes with PM-focused interactions */}
      <div className="nodes-layer">
        {nodes.map(node => (
          <TreeNodeComponent
            key={node.id}
            node={node}
            isSelected={selectedNode?.id === node.id}
            onSelect={() => {
              selectNode(node);
              onNodeSelect?.(node);
            }}
            onUpdate={(updates) => updateNode(node.id, updates)}
            onDelete={() => deleteNode(node.id)}
          />
        ))}
      </div>
    </div>
  );
});

ImpactTreeCanvas.displayName = 'ImpactTreeCanvas';
```

### **State Management with Zustand**
```typescript
// ✅ RECOMMENDED: Tree state management for PM workflow
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface TreeStore {
  // Core tree data
  nodes: TreeNode[];
  connections: NodeConnection[];
  canvasState: CanvasState;
  
  // PM workflow state
  selectedNode: TreeNode | null;
  discoveryMode: 'strategy' | 'research' | 'assumptions';
  lastSaved: Date | null;
  
  // Tree operations optimized for discovery workflow
  addNode: (node: TreeNode) => void;
  updateNode: (id: string, updates: Partial<TreeNode>) => void;
  deleteNode: (id: string) => void;
  duplicateNode: (id: string) => void;
  
  // Canvas operations for PM interactions
  updateCanvasState: (updates: Partial<CanvasState>) => void;
  resetCanvasPosition: () => void;
  zoomToFit: () => void;
  
  // Discovery workflow operations
  selectNode: (node: TreeNode | null) => void;
  setDiscoveryMode: (mode: DiscoveryMode) => void;
  markTreeSaved: () => void;
}

export const useTreeStore = create<TreeStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        nodes: [],
        connections: [],
        canvasState: { zoom: 1, pan: { x: 0, y: 0 }, orientation: 'vertical' },
        selectedNode: null,
        discoveryMode: 'strategy',
        lastSaved: null,

        // Tree operations
        addNode: (node) => set((state) => ({
          nodes: [...state.nodes, node]
        })),

        updateNode: (id, updates) => set((state) => ({
          nodes: state.nodes.map(node =>
            node.id === id ? { ...node, ...updates } : node
          )
        })),

        deleteNode: (id) => set((state) => ({
          nodes: state.nodes.filter(node => node.id !== id),
          connections: state.connections.filter(conn =>
            conn.sourceId !== id && conn.targetId !== id
          ),
          selectedNode: state.selectedNode?.id === id ? null : state.selectedNode
        })),

        // Canvas operations optimized for PM workflow
        updateCanvasState: (updates) => set((state) => ({
          canvasState: { ...state.canvasState, ...updates }
        })),

        resetCanvasPosition: () => set((state) => ({
          canvasState: { ...state.canvasState, pan: { x: 0, y: 0 }, zoom: 1 }
        })),

        // Discovery workflow support
        selectNode: (node) => set({ selectedNode: node }),
        
        setDiscoveryMode: (mode) => set({ discoveryMode: mode }),
        
        markTreeSaved: () => set({ lastSaved: new Date() })
      }),
      {
        name: 'impact-tree-storage',
        // Only persist essential state, not UI state
        partialize: (state) => ({
          canvasState: state.canvasState,
          discoveryMode: state.discoveryMode
        })
      }
    ),
    { name: 'tree-store' }
  )
);
```

---

## 🗄️ **Database Standards (Drizzle ORM + PostgreSQL)**

### **Schema Design for Impact Trees**
```typescript
// ✅ RECOMMENDED: Impact tree schema optimized for PM workflow
import { pgTable, text, serial, integer, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const impactTrees = pgTable("impact_trees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  
  // Tree structure optimized for canvas performance
  nodes: jsonb("nodes").notNull().default('[]'),
  connections: jsonb("connections").notNull().default('[]'),
  
  // Canvas state for PM workflow persistence
  canvasState: jsonb("canvas_state").notNull().default(
    '{"zoom": 1, "pan": {"x": 0, "y": 0}, "orientation": "vertical"}'
  ),
  
  // Discovery workflow metadata
  discoveryPhase: text("discovery_phase").default('strategy'),
  lastDiscoveryUpdate: timestamp("last_discovery_update").defaultNow(),
  
  // Standard timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Indexes for PM workflow queries
  nameIdx: index("idx_tree_name").on(table.name),
  discoveryPhaseIdx: index("idx_discovery_phase").on(table.discoveryPhase),
  updatedAtIdx: index("idx_updated_at").on(table.updatedAt),
}));

// Discovery artifacts for continuous discovery
export const discoveryArtifacts = pgTable("discovery_artifacts", {
  id: serial("id").primaryKey(),
  treeId: integer("tree_id").references(() => impactTrees.id, { onDelete: 'cascade' }),
  nodeId: text("node_id").notNull(),
  
  // Artifact type for PM discovery workflow
  artifactType: text("artifact_type").notNull(), // 'research', 'assumption', 'metric', 'insight'
  title: text("title").notNull(),
  content: jsonb("content").notNull(),
  
  // Discovery context
  discoverySession: text("discovery_session"),
  validationStatus: text("validation_status").default('hypothesis'),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  treeNodeIdx: index("idx_tree_node").on(table.treeId, table.nodeId),
  artifactTypeIdx: index("idx_artifact_type").on(table.artifactType),
  discoverySessionIdx: index("idx_discovery_session").on(table.discoverySession),
}));

// Type-safe schemas with Zod validation
export const insertImpactTreeSchema = createInsertSchema(impactTrees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectImpactTreeSchema = createSelectSchema(impactTrees);

export type InsertImpactTree = typeof insertImpactTreeSchema._type;
export type ImpactTree = typeof impactTrees.$inferSelect;
export type DiscoveryArtifact = typeof discoveryArtifacts.$inferSelect;
```

### **Repository Patterns for PM Workflow**
```typescript
// ✅ RECOMMENDED: Repository with PM-focused operations
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, desc, and } from 'drizzle-orm';
import { impactTrees, discoveryArtifacts } from '../schema';

export class ImpactTreeRepository {
  constructor(private db: DrizzleDB) {}

  // Get tree with full discovery context
  async getTreeById(id: number): Promise<ImpactTree | undefined> {
    const [tree] = await this.db
      .select()
      .from(impactTrees)
      .where(eq(impactTrees.id, id))
      .limit(1);
    
    return tree;
  }

  // Optimized canvas state updates for PM workflow
  async updateCanvasState(id: number, updates: {
    nodes: TreeNode[];
    connections: NodeConnection[];
    canvasState: CanvasState;
  }): Promise<ImpactTree | undefined> {
    const [updated] = await this.db
      .update(impactTrees)
      .set({
        nodes: updates.nodes,
        connections: updates.connections,
        canvasState: updates.canvasState,
        lastDiscoveryUpdate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(impactTrees.id, id))
      .returning();
    
    return updated;
  }

  // Discovery artifacts for continuous discovery workflow
  async addDiscoveryArtifact(artifact: {
    treeId: number;
    nodeId: string;
    artifactType: string;
    title: string;
    content: any;
    discoverySession?: string;
  }): Promise<DiscoveryArtifact> {
    const [created] = await this.db
      .insert(discoveryArtifacts)
      .values(artifact)
      .returning();
    
    return created;
  }

  // Get discovery artifacts for PM research
  async getDiscoveryArtifacts(treeId: number, nodeId?: string): Promise<DiscoveryArtifact[]> {
    return await this.db
      .select()
      .from(discoveryArtifacts)
      .where(
        nodeId 
          ? and(eq(discoveryArtifacts.treeId, treeId), eq(discoveryArtifacts.nodeId, nodeId))
          : eq(discoveryArtifacts.treeId, treeId)
      )
      .orderBy(desc(discoveryArtifacts.createdAt));
  }

  // Get recent trees for PM dashboard
  async getRecentTrees(limit: number = 10): Promise<ImpactTree[]> {
    return await this.db
      .select({
        id: impactTrees.id,
        name: impactTrees.name,
        description: impactTrees.description,
        discoveryPhase: impactTrees.discoveryPhase,
        lastDiscoveryUpdate: impactTrees.lastDiscoveryUpdate,
        updatedAt: impactTrees.updatedAt
      })
      .from(impactTrees)
      .orderBy(desc(impactTrees.updatedAt))
      .limit(limit);
  }
}
```

---

## 🧪 **Testing Standards**

### **React Component Testing**
```typescript
// ✅ RECOMMENDED: Impact tree component testing
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ImpactTreeCanvas } from '../ImpactTreeCanvas';
import { useTreeStore } from '../../stores/tree-store';

// Mock the tree store for testing
jest.mock('../../stores/tree-store');

describe('ImpactTreeCanvas', () => {
  let queryClient: QueryClient;
  const mockTreeStore = {
    nodes: [
      {
        id: 'node-1',
        type: 'objective',
        title: 'Increase User Engagement',
        position: { x: 100, y: 100 },
        metadata: {}
      }
    ],
    connections: [],
    canvasState: { zoom: 1, pan: { x: 0, y: 0 }, orientation: 'vertical' },
    selectedNode: null,
    updateCanvasState: jest.fn(),
    selectNode: jest.fn(),
    addNode: jest.fn(),
    updateNode: jest.fn(),
    deleteNode: jest.fn()
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    (useTreeStore as jest.Mock).mockReturnValue(mockTreeStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders impact tree canvas for PM workflow', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ImpactTreeCanvas treeId={1} />
      </QueryClientProvider>
    );

    expect(screen.getByTestId('impact-tree-canvas')).toBeInTheDocument();
    expect(screen.getByText('Increase User Engagement')).toBeInTheDocument();
  });

  test('handles node selection for discovery workflow', async () => {
    const onNodeSelect = jest.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <ImpactTreeCanvas treeId={1} onNodeSelect={onNodeSelect} />
      </QueryClientProvider>
    );

    const node = screen.getByText('Increase User Engagement');
    fireEvent.click(node);

    await waitFor(() => {
      expect(mockTreeStore.selectNode).toHaveBeenCalledWith(mockTreeStore.nodes[0]);
      expect(onNodeSelect).toHaveBeenCalledWith(mockTreeStore.nodes[0]);
    });
  });

  test('supports canvas interactions for large trees', async () => {
    // Test with 100+ nodes to verify performance
    const manyNodes = Array.from({ length: 150 }, (_, i) => ({
      id: `node-${i}`,
      type: 'opportunity' as const,
      title: `Opportunity ${i}`,
      position: { x: (i % 10) * 200, y: Math.floor(i / 10) * 150 },
      metadata: {}
    }));

    (useTreeStore as jest.Mock).mockReturnValue({
      ...mockTreeStore,
      nodes: manyNodes
    });

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ImpactTreeCanvas treeId={1} />
      </QueryClientProvider>
    );

    // Verify all nodes are rendered (with virtualization if implemented)
    expect(container.querySelectorAll('[data-testid*="tree-node"]')).toHaveLength(150);
  });
});
```

### **API Testing**
```typescript
// ✅ RECOMMENDED: Impact tree API testing
import request from 'supertest';
import { app } from '../app';
import { ImpactTreeService } from '../services/impact-tree-service';

jest.mock('../services/impact-tree-service');

describe('Impact Tree API', () => {
  const mockTreeService = {
    getTreeById: jest.fn(),
    updateCanvasState: jest.fn(),
    createTree: jest.fn()
  };

  beforeEach(() => {
    (ImpactTreeService as jest.Mock).mockImplementation(() => mockTreeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/impact-trees/:id', () => {
    test('returns impact tree for PM discovery workflow', async () => {
      const mockTree = {
        id: 1,
        name: 'Product Strategy Canvas',
        nodes: [
          { id: 'node-1', type: 'objective', title: 'Increase Revenue' }
        ],
        connections: [],
        canvasState: { zoom: 1, pan: { x: 0, y: 0 } }
      };

      mockTreeService.getTreeById.mockResolvedValue(mockTree);

      const response = await request(app)
        .get('/api/impact-trees/1')
        .expect(200);

      expect(response.body).toEqual(mockTree);
      expect(mockTreeService.getTreeById).toHaveBeenCalledWith(1);
    });

    test('returns 404 for non-existent tree', async () => {
      mockTreeService.getTreeById.mockResolvedValue(undefined);

      const response = await request(app)
        .get('/api/impact-trees/999')
        .expect(404);

      expect(response.body).toEqual({
        error: 'Impact tree not found',
        code: 'TREE_NOT_FOUND'
      });
    });
  });

  describe('PUT /api/impact-trees/:id/canvas', () => {
    test('updates canvas state for PM workflow', async () => {
      const canvasUpdate = {
        nodes: [
          { id: 'node-1', type: 'objective', title: 'Updated Objective', position: { x: 100, y: 100 } }
        ],
        connections: [],
        canvasState: { zoom: 1.5, pan: { x: 50, y: 25 } }
      };

      const updatedTree = { id: 1, ...canvasUpdate };
      mockTreeService.updateCanvasState.mockResolvedValue(updatedTree);

      const response = await request(app)
        .put('/api/impact-trees/1/canvas')
        .send(canvasUpdate)
        .expect(200);

      expect(response.body).toEqual(updatedTree);
      expect(mockTreeService.updateCanvasState).toHaveBeenCalledWith(1, canvasUpdate);
    });

    test('validates canvas data for tree integrity', async () => {
      const invalidUpdate = {
        nodes: [], // Missing required nodes
        // Missing connections and canvasState
      };

      const response = await request(app)
        .put('/api/impact-trees/1/canvas')
        .send(invalidUpdate)
        .expect(400);

      expect(response.body.error).toContain('Invalid canvas data');
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

---

## 📋 **Code Quality Checklist**

### **Impact Tree Specific Quality**
- [ ] **PM Workflow Support**: Features support continuous discovery practices
- [ ] **Canvas Performance**: Optimized for trees with 100+ nodes
- [ ] **Tree State Integrity**: Node relationships and connections maintained
- [ ] **Discovery Context**: All features align with PM discovery methodology

### **Frontend Code Quality**
- [ ] **React Best Practices**: Proper hooks usage, component composition
- [ ] **TypeScript Types**: Comprehensive typing for tree operations
- [ ] **Canvas Optimization**: Efficient rendering and interaction handling
- [ ] **State Management**: Clean Zustand integration with persistence

### **Backend Code Quality**
- [ ] **API Design**: RESTful endpoints for tree operations
- [ ] **Database Optimization**: Efficient JSONB queries and indexing
- [ ] **Error Handling**: Comprehensive error responses for PM workflow
- [ ] **Validation**: Input validation for tree integrity

### **General Quality**
- [ ] **Code formatted** with Prettier
- [ ] **ESLint rules** followed for TypeScript
- [ ] **No performance regressions** in canvas or API
- [ ] **Discovery workflow** not disrupted by changes

---

**📝 Standards Version**: 2.0  
**🎯 Project Type**: AI-Native Impact Tree (React + Node.js)  
**📅 Last Updated**: [Date]  
**🚀 Status**: Production Ready for PM Discovery Workflow
