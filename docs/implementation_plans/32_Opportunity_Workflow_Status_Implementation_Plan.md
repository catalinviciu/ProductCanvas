# 🔧 Implementation Plan: Opportunity Workflow Status

> **Detailed technical implementation plan for visual workflow status management in opportunity nodes**
> **Priority**: P1 | **Complexity**: Medium | **Effort**: 24 hours

---

## 📋 **Implementation Overview**

### **Objective**
Implement a visual workflow status system for opportunity nodes that allows Product Managers to track opportunities through the discovery process with statuses: Identified, Later, Next, Now, Done, and Trash.

### **Current State**
Opportunity nodes in the Impact Tree canvas display basic information (title, description, ICE scoring) but lack visual indicators for workflow status. PMs cannot easily identify which opportunities are in active research, completed, or need attention.

### **Target State**
Opportunity nodes display a modern, sleek status indicator in the top-right corner with color-coded visual cues. PMs can click the status to change it, and the same functionality is available in the side drawer editor. Status changes persist to the database and update the canvas immediately.

---

## 🎯 **Technical Requirements**

### **Frontend Requirements (React + TypeScript)**
- [x] **Status Indicator Component**: Interactive button component with color coding
- [x] **Status Selector Modal**: Dropdown/modal for status selection
- [x] **Canvas Integration**: Status rendering on HTML5 canvas with performance optimization
- [x] **Side Drawer Integration**: Status editing in node edit drawer
- [x] **Visual Design**: Modern, accessible status button design

### **Backend Requirements (Node.js + Express)**
- [x] **Status Persistence**: Store workflowStatus in templateData field
- [x] **Validation**: Enum validation for status values
- [x] **API Updates**: Modify existing node update endpoints
- [x] **Activity Logging**: Track status changes in user activities

### **Database Requirements**
- [x] **Template Data Extension**: Add workflowStatus field to opportunity templateData
- [x] **Status Enum**: Define allowed status values
- [x] **Migration Strategy**: Update existing opportunity nodes with default status

---

## 🏗️ **Implementation Strategy**

### **🚨 CRITICAL: Pre-Implementation Quality Gates**

#### **API Integration Quality Gates**
- [x] **Existing API Analysis**: Review current node update endpoints and templateData structure
- [x] **Status Validation**: Ensure status enum values are properly validated
- [x] **Template Data Schema**: Verify templateData.workflowStatus field integration
- [x] **Canvas State Sync**: Confirm status changes trigger canvas re-render
- [x] **Side Drawer Integration**: Validate status editing works in drawer

#### **React Component Quality Gates**
- [x] **Canvas Performance**: Ensure status indicators don't impact canvas rendering performance
- [x] **State Management**: Verify status changes update all UI components
- [x] **Event Handling**: Confirm status button clicks trigger correct API calls
- [x] **Visual Accessibility**: Ensure status colors meet accessibility standards
- [x] **Component Integration**: Validate status indicator positioning on opportunity nodes

#### **Database Integrity Gates**
- [x] **Template Data Structure**: Verify templateData field can accommodate workflowStatus
- [x] **Status Enum Validation**: Ensure database accepts only valid status values
- [x] **Migration Safety**: Test existing opportunity nodes with default status assignment
- [x] **Query Performance**: Verify status-based queries perform adequately

### **Phase 1: Database and Backend Foundation (8 hours)**

#### **Database Schema Updates**
```typescript
// Update shared/schema.ts - Add workflowStatus to opportunity template data
export const opportunityWorkflowStatuses = [
  'identified',
  'later', 
  'next',
  'now',
  'done',
  'trash'
] as const;

export type OpportunityWorkflowStatus = typeof opportunityWorkflowStatuses[number];

// Update TreeNode interface to include workflowStatus in templateData
export interface TreeNode {
  // ... existing fields
  templateData?: {
    // ... existing opportunity fields
    workflowStatus?: OpportunityWorkflowStatus;
    // ... rest of template data
  };
}
```

#### **Backend Service Updates**
```typescript
// Update server/services/impact-tree-service.ts
import { opportunityWorkflowStatuses } from '@shared/schema';

export class ImpactTreeService {
  // ... existing methods

  async updateNodeStatus(
    treeId: number, 
    nodeId: string, 
    userId: string, 
    workflowStatus: OpportunityWorkflowStatus
  ): Promise<TreeNodeRecord | null> {
    // Validate status
    if (!opportunityWorkflowStatuses.includes(workflowStatus)) {
      throw new Error(`Invalid workflow status: ${workflowStatus}`);
    }

    // Get existing node
    const existingNode = await db.query.treeNodes.findFirst({
      where: and(
        eq(treeNodes.id, nodeId),
        eq(treeNodes.treeId, treeId)
      )
    });

    if (!existingNode) return null;

    // Verify tree ownership
    const tree = await db.query.impactTrees.findFirst({
      where: and(
        eq(impactTrees.id, treeId),
        eq(impactTrees.user_id, userId)
      )
    });

    if (!tree) return null;

    // Update node with new status
    const updatedTemplateData = {
      ...existingNode.templateData,
      workflowStatus
    };

    const [updatedNode] = await db
      .update(treeNodes)
      .set({
        templateData: updatedTemplateData,
        updatedAt: new Date()
      })
      .where(eq(treeNodes.id, nodeId))
      .returning();

    // Log activity
    await this.logActivity(
      userId,
      treeId,
      'node_status_updated',
      `Updated opportunity "${existingNode.title}" status to ${workflowStatus}`,
      { nodeId, previousStatus: existingNode.templateData?.workflowStatus, newStatus: workflowStatus }
    );

    return updatedNode;
  }

  // Migration method for existing opportunity nodes
  async migrateOpportunityStatuses(userId: string): Promise<void> {
    // Find all opportunity nodes without workflowStatus
    const opportunityNodes = await db.query.treeNodes.findMany({
      where: and(
        eq(treeNodes.nodeType, 'opportunity'),
        // Filter for nodes belonging to user's trees
        exists(
          db.select().from(impactTrees)
            .where(and(
              eq(impactTrees.id, treeNodes.treeId),
              eq(impactTrees.user_id, userId)
            ))
        )
      )
    });

    // Update nodes without workflowStatus to default 'identified'
    const nodesToUpdate = opportunityNodes.filter(node => 
      !node.templateData?.workflowStatus
    );

    for (const node of nodesToUpdate) {
      const updatedTemplateData = {
        ...node.templateData,
        workflowStatus: 'identified' as OpportunityWorkflowStatus
      };

      await db
        .update(treeNodes)
        .set({
          templateData: updatedTemplateData,
          updatedAt: new Date()
        })
        .where(eq(treeNodes.id, node.id));
    }
  }
}
```

#### **API Endpoint Updates**
```typescript
// Update server/routes/impact-tree-routes.ts
import { z } from 'zod';
import { opportunityWorkflowStatuses } from '@shared/schema';

const updateNodeStatusSchema = z.object({
  workflowStatus: z.enum(opportunityWorkflowStatuses)
});

// New endpoint for status updates
router.patch('/api/impact-trees/:treeId/nodes/:nodeId/status', async (req: Request, res: Response) => {
  try {
    const treeId = parseInt(req.params.treeId);
    const nodeId = req.params.nodeId;
    const userId = req.user!.id;
    
    const { workflowStatus } = updateNodeStatusSchema.parse(req.body);
    
    const updatedNode = await treeService.updateNodeStatus(treeId, nodeId, userId, workflowStatus);
    
    if (!updatedNode) {
      return res.status(404).json({ message: "Node not found" });
    }
    
    res.json(updatedNode);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid status", errors: error.errors });
    }
    console.error('Status update error:', error);
    res.status(500).json({ message: "Failed to update node status" });
  }
});

// Migration endpoint (development only)
router.post('/api/impact-trees/migrate-statuses', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    await treeService.migrateOpportunityStatuses(userId);
    res.json({ message: "Migration completed successfully" });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ message: "Migration failed" });
  }
});
```

### **Phase 2: Frontend Components (12 hours)**

#### **Status Indicator Component**
```tsx
// Create client/src/components/opportunity-status-indicator.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { TreeNode, OpportunityWorkflowStatus } from '@shared/schema';

interface OpportunityStatusIndicatorProps {
  node: TreeNode;
  onStatusChange: (status: OpportunityWorkflowStatus) => void;
  disabled?: boolean;
  className?: string;
}

const statusConfig = {
  identified: { 
    label: 'Identified', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    hoverColor: 'hover:bg-blue-200'
  },
  later: { 
    label: 'Later', 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    hoverColor: 'hover:bg-gray-200'
  },
  next: { 
    label: 'Next', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    hoverColor: 'hover:bg-yellow-200'
  },
  now: { 
    label: 'Now', 
    color: 'bg-green-100 text-green-800 border-green-200',
    hoverColor: 'hover:bg-green-200'
  },
  done: { 
    label: 'Done', 
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    hoverColor: 'hover:bg-purple-200'
  },
  trash: { 
    label: 'Trash', 
    color: 'bg-red-100 text-red-800 border-red-200',
    hoverColor: 'hover:bg-red-200'
  }
};

export const OpportunityStatusIndicator: React.FC<OpportunityStatusIndicatorProps> = ({
  node,
  onStatusChange,
  disabled = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentStatus = node.templateData?.workflowStatus || 'identified';
  const config = statusConfig[currentStatus];

  const handleStatusSelect = (status: OpportunityWorkflowStatus) => {
    onStatusChange(status);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={`
            ${config.color} 
            ${config.hoverColor}
            border 
            px-2 
            py-1 
            h-auto 
            text-xs 
            font-medium 
            rounded-md 
            transition-colors 
            duration-200
            ${className}
          `}
        >
          {config.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        {Object.entries(statusConfig).map(([status, config]) => (
          <DropdownMenuItem
            key={status}
            onClick={() => handleStatusSelect(status as OpportunityWorkflowStatus)}
            className="cursor-pointer"
          >
            <Badge 
              variant="secondary" 
              className={`${config.color} mr-2 text-xs`}
            >
              {config.label}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

#### **Tree Node Component Integration**
```tsx
// Update client/src/components/tree-node.tsx
import { OpportunityStatusIndicator } from './opportunity-status-indicator';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { OpportunityWorkflowStatus } from '@shared/schema';

// Add to TreeNodeComponent
const TreeNodeComponent: React.FC<TreeNodeProps> = ({ 
  node, 
  onSelect, 
  onUpdate,
  // ... other props
}) => {
  const queryClient = useQueryClient();
  
  const updateStatusMutation = useMutation({
    mutationFn: async (status: OpportunityWorkflowStatus) => {
      return apiRequest(`/api/impact-trees/${node.treeId}/nodes/${node.id}/status`, {
        method: 'PATCH',
        body: { workflowStatus: status }
      });
    },
    onSuccess: () => {
      // Invalidate tree data to refresh canvas
      queryClient.invalidateQueries({ queryKey: ['/api/impact-trees', node.treeId] });
    }
  });

  const handleStatusChange = (status: OpportunityWorkflowStatus) => {
    updateStatusMutation.mutate(status);
  };

  return (
    <div className="tree-node opportunity-node">
      <div className="node-header">
        <h3 className="node-title">{node.title}</h3>
        <div className="node-actions">
          {node.type === 'opportunity' && (
            <OpportunityStatusIndicator
              node={node}
              onStatusChange={handleStatusChange}
              disabled={updateStatusMutation.isPending}
              className="mr-2"
            />
          )}
          {/* ... existing actions (3 dots menu) */}
        </div>
      </div>
      {/* ... rest of node content */}
    </div>
  );
};
```

#### **Side Drawer Integration**
```tsx
// Update client/src/components/enhanced-node-edit-drawer.tsx
import { OpportunityStatusIndicator } from './opportunity-status-indicator';

// Add to the opportunity template section
const OpportunityTemplate: React.FC<{
  node: TreeNode;
  onUpdate: (updates: Partial<TreeNode>) => void;
}> = ({ node, onUpdate }) => {
  const handleStatusChange = (status: OpportunityWorkflowStatus) => {
    onUpdate({
      templateData: {
        ...node.templateData,
        workflowStatus: status
      }
    });
  };

  return (
    <div className="opportunity-template">
      {/* Status section */}
      <div className="template-section">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Workflow Status</h3>
          <OpportunityStatusIndicator
            node={node}
            onStatusChange={handleStatusChange}
          />
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Track this opportunity through your discovery workflow
        </p>
      </div>
      
      {/* ... existing opportunity template fields */}
    </div>
  );
};
```

### **Phase 3: Canvas Integration (4 hours)**

#### **Canvas Status Rendering**
```tsx
// Update client/src/components/impact-tree-canvas.tsx
import { statusConfig } from '../components/opportunity-status-indicator';

// Add status indicator rendering to canvas nodes
const renderNodeStatus = (ctx: CanvasRenderingContext2D, node: TreeNode, x: number, y: number) => {
  if (node.type !== 'opportunity') return;
  
  const status = node.templateData?.workflowStatus || 'identified';
  const config = statusConfig[status];
  
  // Status indicator position (top-right of node)
  const statusX = x + NODE_DIMENSIONS.width - 60;
  const statusY = y + 8;
  const statusWidth = 50;
  const statusHeight = 20;
  
  // Draw status background
  ctx.fillStyle = config.backgroundColor;
  ctx.fillRect(statusX, statusY, statusWidth, statusHeight);
  
  // Draw status border
  ctx.strokeStyle = config.borderColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(statusX, statusY, statusWidth, statusHeight);
  
  // Draw status text
  ctx.fillStyle = config.textColor;
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(config.label, statusX + statusWidth / 2, statusY + 14);
};

// Add to main canvas rendering loop
const renderNodes = (ctx: CanvasRenderingContext2D, nodes: TreeNode[]) => {
  nodes.forEach(node => {
    const { x, y } = node.position;
    
    // ... existing node rendering
    
    // Render status indicator for opportunity nodes
    renderNodeStatus(ctx, node, x, y);
  });
};
```

---

## 🧪 **Testing Strategy**

### **Unit Tests**
```typescript
// Test status indicator component
describe('OpportunityStatusIndicator', () => {
  it('renders current status correctly', () => {
    const node = { templateData: { workflowStatus: 'now' } };
    render(<OpportunityStatusIndicator node={node} onStatusChange={jest.fn()} />);
    expect(screen.getByText('Now')).toBeInTheDocument();
  });

  it('calls onStatusChange when status selected', () => {
    const onStatusChange = jest.fn();
    const node = { templateData: { workflowStatus: 'identified' } };
    render(<OpportunityStatusIndicator node={node} onStatusChange={onStatusChange} />);
    
    fireEvent.click(screen.getByText('Identified'));
    fireEvent.click(screen.getByText('Now'));
    expect(onStatusChange).toHaveBeenCalledWith('now');
  });
});

// Test API endpoint
describe('Status Update API', () => {
  it('updates node status successfully', async () => {
    const response = await request(app)
      .patch('/api/impact-trees/1/nodes/test-node/status')
      .send({ workflowStatus: 'now' })
      .expect(200);
    
    expect(response.body.templateData.workflowStatus).toBe('now');
  });

  it('validates status enum values', async () => {
    await request(app)
      .patch('/api/impact-trees/1/nodes/test-node/status')
      .send({ workflowStatus: 'invalid' })
      .expect(400);
  });
});
```

### **Integration Tests**
```typescript
// Test complete workflow
describe('Opportunity Status Workflow', () => {
  it('updates status from canvas to database', async () => {
    // Create opportunity node
    const node = await createOpportunityNode();
    
    // Update status via API
    const response = await updateNodeStatus(node.id, 'now');
    expect(response.templateData.workflowStatus).toBe('now');
    
    // Verify database persistence
    const savedNode = await getNodeFromDatabase(node.id);
    expect(savedNode.templateData.workflowStatus).toBe('now');
  });
});
```

---

## 📋 **Implementation Checklist**

### **Phase 1: Backend Foundation**
- [ ] **Database schema** updated with workflowStatus enum
- [ ] **Service methods** implemented for status updates
- [ ] **API endpoints** created for status management
- [ ] **Migration script** created for existing nodes
- [ ] **Unit tests** written for backend functionality

### **Phase 2: Frontend Components**
- [ ] **Status indicator component** created with modern design
- [ ] **Tree node integration** completed
- [ ] **Side drawer integration** implemented
- [ ] **Canvas rendering** updated for status indicators
- [ ] **Component tests** written and passing

### **Phase 3: Integration & Testing**
- [ ] **End-to-end testing** completed
- [ ] **Performance testing** with status indicators
- [ ] **Accessibility testing** for color coding
- [ ] **User acceptance testing** with PM workflow
- [ ] **Code review** completed and approved

---

## 🎓 **Developer Learning Guide**

### **📚 Implementation Context**
This implementation extends the existing node system with workflow status tracking, a core component of continuous discovery methodology. The feature integrates seamlessly with the canvas rendering system and maintains high performance standards.

### **🔧 Key Implementation Patterns**

#### **Template Data Extension Pattern**
```typescript
// Pattern: Extending templateData without breaking existing structure
const updatedTemplateData = {
  ...existingNode.templateData,
  workflowStatus: newStatus
};
```

#### **Canvas Performance Pattern**
```typescript
// Pattern: Efficient status rendering on canvas
const renderNodeStatus = (ctx: CanvasRenderingContext2D, node: TreeNode) => {
  // Only render for opportunity nodes
  if (node.type !== 'opportunity') return;
  
  // Use cached color configurations
  const config = statusConfig[node.templateData?.workflowStatus || 'identified'];
  
  // Efficient drawing operations
  ctx.fillStyle = config.backgroundColor;
  ctx.fillRect(x, y, width, height);
};
```

#### **Component Integration Pattern**
```tsx
// Pattern: Seamless integration with existing components
<div className="node-actions">
  {node.type === 'opportunity' && (
    <OpportunityStatusIndicator
      node={node}
      onStatusChange={handleStatusChange}
      disabled={updateStatusMutation.isPending}
    />
  )}
  {/* Existing actions remain unchanged */}
</div>
```

### **⚠️ Common Pitfalls & Solutions**

#### **Canvas Performance Issues**
- **Problem**: Status indicators slow down canvas rendering
- **Solution**: Use efficient drawing operations and color caching
- **Prevention**: Test with large trees (100+ nodes) during development

#### **State Synchronization**
- **Problem**: Status changes not reflected in all UI components
- **Solution**: Use TanStack Query cache invalidation
- **Prevention**: Test status changes from both canvas and drawer

#### **Database Migration**
- **Problem**: Existing opportunity nodes without status
- **Solution**: Migration script with default 'identified' status
- **Prevention**: Run migration before deployment

### **🔗 Learning Resources**
- **Canvas Rendering**: HTML5 Canvas API documentation
- **React State Management**: TanStack Query patterns
- **TypeScript Enums**: Enum validation and type safety
- **Continuous Discovery**: Teresa Torres methodology

### **🎯 Key Takeaways**
- Template data extension provides flexible node customization
- Canvas performance optimization is critical for smooth user experience
- Component integration should maintain existing functionality
- Database migrations require careful planning and testing

---

## 🔗 **Related Documents**

- **Feature Specification**: [32_Opportunity_Workflow_Status_Feature.md](../new_features/32_Opportunity_Workflow_Status_Feature.md)
- **Canvas Performance Guidelines**: [docs/development/canvas_performance_guidelines.md](../development/canvas_performance_guidelines.md)
- **Node Template System**: [docs/new_features/Node_Content_Templates.md](../new_features/Node_Content_Templates.md)
- **API Design Guidelines**: [docs/development/api_design_guidelines.md](../development/api_design_guidelines.md)

---

**📝 Plan Version**: 1.0  
**🎯 Project Type**: AI-Native Impact Tree (React + Node.js)  
**📅 Created**: January 14, 2025  
**👤 Author**: AI Assistant  
**📊 Status**: 🔧 Ready for Implementation