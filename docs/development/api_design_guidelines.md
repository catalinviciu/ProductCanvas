# 🌐 API Design Guidelines

> **RESTful API design principles for React + Node.js Impact Tree applications**

---

## 📋 **Overview**

This document establishes API design guidelines for the AI-Native Impact Tree project, ensuring consistent, scalable, and maintainable REST APIs using Express.js and Node.js patterns.

---

## 🎯 **API Design Principles**

### **1. RESTful Resource Design**

Design APIs around resources, not actions:

```typescript
// ✅ RECOMMENDED: Resource-based endpoints
GET    /api/impact-trees              # Get all trees
POST   /api/impact-trees              # Create new tree
GET    /api/impact-trees/:id          # Get specific tree
PUT    /api/impact-trees/:id          # Update tree
DELETE /api/impact-trees/:id          # Delete tree

GET    /api/impact-trees/:id/nodes    # Get tree nodes
POST   /api/impact-trees/:id/nodes    # Create node
PUT    /api/impact-trees/:id/nodes/:nodeId  # Update node
DELETE /api/impact-trees/:id/nodes/:nodeId  # Delete node
```

### **2. Consistent Response Format**

Use consistent response structures:

```typescript
// ✅ RECOMMENDED: Consistent response format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  timestamp: string;
}

// Success response
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Product Strategy Tree",
    "nodes": [...]
  },
  "timestamp": "2025-07-11T16:00:00Z"
}

// Error response
{
  "success": false,
  "error": "Impact tree not found",
  "code": "TREE_NOT_FOUND",
  "timestamp": "2025-07-11T16:00:00Z"
}
```

### **3. HTTP Status Codes**

Use appropriate HTTP status codes:

```typescript
// ✅ RECOMMENDED: Proper status codes
200 OK          # Successful GET, PUT
201 Created     # Successful POST
204 No Content  # Successful DELETE
400 Bad Request # Invalid request data
401 Unauthorized # Authentication required
403 Forbidden   # Access denied
404 Not Found   # Resource not found
409 Conflict    # Resource conflict
422 Unprocessable Entity # Validation errors
500 Internal Server Error # Server errors
```

---

## 🔧 **Express.js Implementation Patterns**

### **1. Route Organization**

Structure routes logically:

```typescript
// ✅ RECOMMENDED: Route organization
import express from 'express';
import { ImpactTreeService } from '../services/impact-tree-service';
import { isAuthenticated } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { createTreeSchema, updateTreeSchema } from '../schemas/tree-schemas';

const router = express.Router();
const treeService = new ImpactTreeService();

// Apply authentication middleware
router.use(isAuthenticated);

// Tree CRUD operations
router.get('/impact-trees', async (req, res) => {
  try {
    const userId = req.user!.id;
    const trees = await treeService.getUserTrees(userId);
    
    res.json({
      success: true,
      data: trees,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trees',
      code: 'FETCH_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/impact-trees', validateRequest(createTreeSchema), async (req, res) => {
  try {
    const userId = req.user!.id;
    const treeData = req.body;
    
    const newTree = await treeService.createTree(userId, treeData);
    
    res.status(201).json({
      success: true,
      data: newTree,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create tree',
      code: 'CREATE_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
```

### **2. Input Validation with Zod**

Validate all input data:

```typescript
// ✅ RECOMMENDED: Zod validation schemas
import { z } from 'zod';

export const createTreeSchema = z.object({
  name: z.string().min(1, 'Tree name is required').max(255, 'Tree name too long'),
  description: z.string().optional(),
  canvasState: z.object({
    zoom: z.number().min(0.1).max(3),
    pan: z.object({
      x: z.number(),
      y: z.number()
    }),
    orientation: z.enum(['vertical', 'horizontal']).optional()
  }).optional()
});

export const updateTreeSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  nodes: z.array(z.object({
    id: z.string(),
    type: z.enum(['objective', 'outcome', 'opportunity', 'solution', 'assumption', 'metric', 'research']),
    title: z.string().min(1),
    description: z.string().optional(),
    position: z.object({
      x: z.number(),
      y: z.number()
    }),
    templateData: z.record(z.any()).optional()
  })).optional(),
  canvasState: z.object({
    zoom: z.number().min(0.1).max(3),
    pan: z.object({
      x: z.number(),
      y: z.number()
    }),
    orientation: z.enum(['vertical', 'horizontal']).optional()
  }).optional()
});

// Validation middleware
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors,
          timestamp: new Date().toISOString()
        });
      }
      next(error);
    }
  };
};
```

### **3. Error Handling**

Implement comprehensive error handling:

```typescript
// ✅ RECOMMENDED: Custom error classes
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

// Global error handler
export const errorHandler = (
  error: Error,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
      details: error.details,
      timestamp: new Date().toISOString()
    });
  }

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.errors,
      timestamp: new Date().toISOString()
    });
  }

  // Default server error
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
};
```

---

## 🗄️ **Database Integration Patterns**

### **1. Service Layer Pattern**

Separate business logic from API routes:

```typescript
// ✅ RECOMMENDED: Service layer implementation
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { impactTrees, treeNodes } from '@shared/schema';
import { NotFoundError, ValidationError } from '../errors';

export class ImpactTreeService {
  async createTree(userId: string, data: {
    name: string;
    description?: string;
    canvasState?: any;
  }): Promise<ImpactTree> {
    // Validate business rules
    if (!data.name || data.name.trim() === '') {
      throw new ValidationError('Tree name is required');
    }

    // Check for duplicate names
    const existingTree = await db.query.impactTrees.findFirst({
      where: and(
        eq(impactTrees.user_id, userId),
        eq(impactTrees.name, data.name.trim())
      )
    });

    if (existingTree) {
      throw new ValidationError('Tree name already exists');
    }

    // Create tree
    const [tree] = await db
      .insert(impactTrees)
      .values({
        user_id: userId,
        name: data.name.trim(),
        description: data.description,
        canvasState: data.canvasState || {
          zoom: 1,
          pan: { x: 0, y: 0 },
          orientation: 'vertical'
        }
      })
      .returning();

    return tree;
  }

  async updateTree(treeId: number, userId: string, updates: {
    name?: string;
    description?: string;
    nodes?: any[];
    connections?: any[];
    canvasState?: any;
  }): Promise<ImpactTree> {
    // Verify ownership
    const existingTree = await db.query.impactTrees.findFirst({
      where: and(
        eq(impactTrees.id, treeId),
        eq(impactTrees.user_id, userId)
      )
    });

    if (!existingTree) {
      throw new NotFoundError('Impact tree');
    }

    // Validate updates
    if (updates.name && updates.name.trim() === '') {
      throw new ValidationError('Tree name cannot be empty');
    }

    // Apply updates
    const [updatedTree] = await db
      .update(impactTrees)
      .set({
        ...updates,
        name: updates.name?.trim(),
        updatedAt: new Date()
      })
      .where(eq(impactTrees.id, treeId))
      .returning();

    return updatedTree;
  }

  async deleteTree(treeId: number, userId: string): Promise<void> {
    const result = await db
      .delete(impactTrees)
      .where(and(
        eq(impactTrees.id, treeId),
        eq(impactTrees.user_id, userId)
      ))
      .returning();

    if (result.length === 0) {
      throw new NotFoundError('Impact tree');
    }
  }

  async getUserTrees(userId: string): Promise<ImpactTree[]> {
    return await db
      .select()
      .from(impactTrees)
      .where(eq(impactTrees.user_id, userId))
      .orderBy(desc(impactTrees.updatedAt));
  }
}
```

### **2. Pagination and Filtering**

Implement efficient pagination:

```typescript
// ✅ RECOMMENDED: Pagination implementation
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export const paginateQuery = async <T>(
  query: any,
  params: PaginationParams
): Promise<PaginatedResponse<T>> => {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 10));
  const offset = (page - 1) * limit;

  // Get total count
  const [{ total }] = await query.select({ total: count() });

  // Get paginated results
  const data = await query
    .limit(limit)
    .offset(offset);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
};
```

---

## 🔒 **Authentication and Authorization**

### **1. Replit Auth Integration**

Implement session-based authentication:

```typescript
// ✅ RECOMMENDED: Replit Auth middleware
import { Request, Response, NextFunction } from 'express';
import { getSession } from './replitAuth';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export const isAuthenticated = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const session = await getSession();
    
    if (!session || !session.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
        timestamp: new Date().toISOString()
      });
    }

    req.user = session.user;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Authentication service error',
      code: 'AUTH_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};

// Resource ownership verification
export const verifyTreeOwnership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const treeId = parseInt(req.params.id);
    const userId = req.user!.id;

    const tree = await db.query.impactTrees.findFirst({
      where: and(
        eq(impactTrees.id, treeId),
        eq(impactTrees.user_id, userId)
      )
    });

    if (!tree) {
      return res.status(404).json({
        success: false,
        error: 'Impact tree not found',
        code: 'TREE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Authorization check failed',
      code: 'AUTH_CHECK_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};
```

---

## ⚡ **Performance Optimization**

### **1. Response Caching**

Implement intelligent caching:

```typescript
// ✅ RECOMMENDED: Response caching
import { createHash } from 'crypto';

const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export const cacheResponse = (ttl: number = 300000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = createHash('md5')
      .update(req.originalUrl + JSON.stringify(req.query))
      .digest('hex');

    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return res.json(cached.data);
    }

    const originalSend = res.json;
    res.json = function(data: any) {
      cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
      });
      
      return originalSend.call(this, data);
    };

    next();
  };
};
```

### **2. Batch Operations**

Support batch operations for canvas performance:

```typescript
// ✅ RECOMMENDED: Batch update endpoint
router.put('/impact-trees/:id/nodes/bulk-update', async (req, res) => {
  try {
    const treeId = parseInt(req.params.id);
    const userId = req.user!.id;
    const { nodeUpdates } = req.body;

    // Validate batch size
    if (nodeUpdates.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Batch size too large',
        code: 'BATCH_SIZE_ERROR',
        timestamp: new Date().toISOString()
      });
    }

    const result = await treeService.bulkUpdateNodes(treeId, userId, nodeUpdates);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Bulk update failed',
      code: 'BULK_UPDATE_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});
```

---

## 📊 **API Documentation**

### **1. OpenAPI Specification**

Document APIs with OpenAPI:

```yaml
# ✅ RECOMMENDED: OpenAPI documentation
openapi: 3.0.0
info:
  title: Impact Tree API
  version: 1.0.0
  description: API for managing impact trees and discovery workflows

paths:
  /api/impact-trees:
    get:
      summary: Get user's impact trees
      responses:
        '200':
          description: List of trees
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/ImpactTree'
    post:
      summary: Create new impact tree
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateTreeRequest'
      responses:
        '201':
          description: Tree created successfully

components:
  schemas:
    ImpactTree:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
        description:
          type: string
        nodes:
          type: array
        canvasState:
          type: object
```

---

## 🎯 **Best Practices Summary**

1. **RESTful Design**: Use resource-based URLs and appropriate HTTP methods
2. **Consistent Responses**: Use standardized response formats
3. **Input Validation**: Validate all input with Zod schemas
4. **Error Handling**: Implement comprehensive error handling
5. **Authentication**: Use Replit Auth with session-based security
6. **Performance**: Implement caching and batch operations
7. **Documentation**: Maintain OpenAPI specifications
8. **Testing**: Write comprehensive API tests

---

**📝 Guidelines Version**: 1.0  
**🎯 Project Type**: React + Node.js API  
**📅 Last Updated**: July 2025  
**🚀 Status**: Production Ready