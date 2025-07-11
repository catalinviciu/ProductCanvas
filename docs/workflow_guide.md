# 📋 React + Node.js Documentation Workflow Guide

> **Complete guide for AI-assisted documentation workflow in React + Node.js projects**
> **For AI Assistants**: Use this guide to create consistent, properly organized documentation

---

## 🎯 **Documentation Philosophy**

### **Core Principles**
1. **Practical Over Perfect**: Focus on utility for full-stack development with AI assistance
2. **Consistency**: Follow established patterns and templates
3. **Actionable**: All documentation should lead to clear next steps
4. **Maintainable**: Simple enough to keep updated without overhead
5. **🎓 Accessible Learning**: Make complex concepts understandable for developers at all skill levels

### **AI Assistant Role**
- **Autonomous Documentation**: Create proper documentation when given simple requests
- **Template Usage**: Always use appropriate templates for consistency
- **Cross-referencing**: Link related documents and maintain relationships
- **Quality Assurance**: Ensure documentation follows React + Node.js patterns
- **🎓 MANDATORY**: Include comprehensive Developer Learning Guide sections in all documentation

### **🎓 MANDATORY: Developer Learning Guide Requirements**
**ALL React + Node.js documentation MUST include a comprehensive Developer Learning Guide section**:

#### **Purpose**
- Make React + Node.js documentation accessible to developers at all skill levels
- Provide visual learning aids alongside technical specifications
- Explain the "why" behind technical decisions, not just the "what"
- Create a learning resource that grows with project complexity

#### **Required Content**
1. **Plain English Explanations**: Complex concepts explained in beginner-friendly terms
2. **Visual Diagrams**: Mermaid flowcharts, architecture diagrams, sequence diagrams
3. **Step-by-Step Breakdowns**: Implementation logic broken into digestible steps
4. **Context & Rationale**: Why certain approaches were chosen over alternatives
5. **Common Pitfalls**: Potential mistakes and how to avoid them
6. **Learning Connections**: Prerequisites, related concepts, further reading

---

## 🚀 **Streamlined Commands (Token-Efficient)**

### **🆕 For New Features**
```bash
# NEW WAY (Automated, fewer tokens):
"Document new feature: [description]"  # Creates BOTH feature spec AND implementation plan
"Implement [feature] using the plan"   # Uses existing plan
"Create implementation report"          # Creates comprehensive report
```

### **🐛 For Issues/Bugs**
```bash
# NEW WAY (Automated, fewer tokens):
"Document new issue: [description]"    # Creates BOTH issue report AND fix plan (if P1/P2)
"Fix [issue] using the plan"           # Uses existing plan
"Create implementation report"          # Creates comprehensive report
```

---

## 📁 **Documentation Structure**

### **Primary Folders**
```
docs/
├── new_features/           # Feature specifications and requests
├── known_issues/          # Bug reports and technical debt
├── implementation_plans/  # Detailed technical implementation guides
├── development/          # Development guidelines and standards
├── tracking/             # Simple priority lists and status tracking
└── workflow_guide.md     # This guide
```

### **Folder Purposes**
- **`new_features/`**: What we want to build (feature requests, specifications)
- **`known_issues/`**: What's broken or needs improvement (bugs, technical debt)
- **`implementation_plans/`**: How to build or fix things (detailed technical plans)
- **`development/`**: How to maintain code quality (guidelines, standards)
- **`tracking/`**: What to work on next (simple priority lists)

---

## 🤖 **AI Assistant Instructions**

### **When User Says: "Document new feature: [description]"**

**🤖 AUTOMATED WORKFLOW**: Create both feature specification AND implementation plan in one go

**🚨 CRITICAL REQUIREMENT**: **THIS IS NOT OPTIONAL** - You MUST create BOTH documents automatically, never just one.

**Step 1**: Create feature document in `docs/new_features/`
```bash
# File naming: XX_Descriptive_Feature_Name.md
# Example: 10_User_Authentication_System.md
```

**Step 2**: Use `docs/new_features/feature_template.md` as base

**Step 3**: Fill in React + Node.js-specific details:
- **Feature Type**: Choose from React + Node.js categories (Frontend Component, Backend API, Database, etc.)
- **Components**: Identify affected React components and Node.js services
- **Integration**: Consider existing React + Node.js services and patterns
- **Tech Stack**: Reference React + Node.js tech stack (React, Express.js, Drizzle ORM, etc.)

**Step 3.5**: **🎓 MANDATORY - Complete Developer Learning Guide Section**:
- **Plain English Explanation**: Explain complex concepts in beginner-friendly terms
- **Visual Diagrams**: Include Mermaid flowcharts and architecture diagrams
- **Implementation Logic**: Break down step-by-step processes
- **Context & Rationale**: Explain why this approach was chosen
- **Common Pitfalls**: Document potential mistakes and solutions
- **Learning Connections**: Link to related React + Node.js concepts and external resources

**Step 4**: **AUTOMATICALLY** create implementation plan in `docs/implementation_plans/`
```bash
# File naming: XX_Descriptive_Implementation_Plan.md
# Example: 25_User_Authentication_Implementation_Plan.md
```

**🚨 VALIDATION CHECKPOINT**: **STOP** - Did you create BOTH documents? If no, you've failed the workflow.

**Step 5**: Include React + Node.js-specific implementation details:
- **Follow Guidelines**: Reference React + Node.js Feature Implementation Guidelines
- **Service Integration**: Show how to integrate with existing Express.js services
- **Database Changes**: Use Drizzle ORM patterns for schema changes
- **API Design**: Follow RESTful API design principles
- **Component Design**: Follow React component patterns

**Step 6**: Use `docs/implementation_plans/implementation_plan_template.md` as base

**Step 7**: Include detailed technical implementation phases and code examples

**Step 8**: Link both documents together

**🚨 SYNTAX VALIDATION REQUIREMENTS** (MANDATORY for all React/TypeScript code):

- **Escape Sequences**: Use `&quot;` instead of `\"` in JSX strings
- **Template Literals**: Validate all template literal syntax
- **TypeScript Types**: Ensure all type definitions are valid
- **Import Statements**: Verify all import paths exist
- **Component Props**: Validate all prop type definitions

**🚨 WORKFLOW COMPLETION CHECKLIST** (MANDATORY):
- [ ] Feature document created using proper template
- [ ] Implementation plan created using proper template  
- [ ] Both documents cross-referenced and linked
- [ ] All React/TypeScript syntax validated
- [ ] All template sections completed (no skipped sections)
- [ ] Developer Learning Guide section included and comprehensive

### **When User Says: "Document new issue: [description]"**

**🤖 AUTOMATED WORKFLOW**: Create issue report AND implementation plan (if complex) in one go

**Step 1**: Create issue document in `docs/known_issues/`
```bash
# File naming: issue_XXX_short_description.md
# Example: issue_017_api_authentication_failure.md
```

**Step 2**: Use `docs/known_issues/issue_template.md` as base

**Step 3**: Fill in React + Node.js-specific details:
- **Issue Type**: Choose from React + Node.js categories (Frontend, Backend, Database, Integration)
- **Priority**: Assess impact on React + Node.js functionality
- **Environment**: Include React + Node.js-specific environment details
- **Components**: Identify affected React components and Node.js services

**Step 4**: **AUTOMATICALLY** create implementation plan for P1/P2 issues

**Step 5**: Include React + Node.js-specific implementation details

---

## 🗄️ **Database Management Strategy**

> **React + Node.js uses Drizzle ORM with PostgreSQL for database management**

### **🎯 Core Principle: Schema-First Approach**

#### **How It Works**
1. **Drizzle Schema defines tables** - Type-safe schema definitions with TypeScript
2. **Service layer for data access** - Clean separation of concerns with ImpactTreeService
3. **Transaction support** - Proper ACID compliance with PostgreSQL
4. **Migration with push** - Use `npm run db:push` for schema changes

#### **🚨 CRITICAL: For New Features - The React + Node.js Way (MANDATORY PROCESS)**

**✅ STEP 1: Define Drizzle Schema (REQUIRED)**
```typescript
// shared/schema.ts
import { pgTable, text, serial, integer, jsonb, timestamp, varchar, index } from "drizzle-orm/pg-core";

export const featureTable = pgTable("feature_table", {
  id: serial("id").primaryKey(),
  user_id: varchar("user_id", { length: 255 }),
  name: text("name").notNull(),
  description: text("description"),
  data: jsonb("data").notNull().default('{}'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("idx_feature_user").on(table.user_id),
  dataGin: index("idx_feature_data").using("gin", table.data),
}));

export type Feature = typeof featureTable.$inferSelect;
export type InsertFeature = typeof featureTable.$inferInsert;
```

**✅ STEP 2: Create Service Layer (REQUIRED)**
```typescript
// server/services/feature-service.ts
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import { featureTable } from "@shared/schema";

export class FeatureService {
  async createFeature(userId: string, data: {
    name: string;
    description?: string;
    data?: any;
  }): Promise<Feature> {
    const [feature] = await db
      .insert(featureTable)
      .values({
        user_id: userId,
        name: data.name,
        description: data.description,
        data: data.data || {},
      })
      .returning();
    
    return feature;
  }

  async getUserFeatures(userId: string): Promise<Feature[]> {
    return await db
      .select()
      .from(featureTable)
      .where(eq(featureTable.user_id, userId))
      .orderBy(desc(featureTable.updatedAt));
  }

  async updateFeature(id: number, userId: string, updates: Partial<InsertFeature>): Promise<Feature | null> {
    const [updated] = await db
      .update(featureTable)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(
        eq(featureTable.id, id),
        eq(featureTable.user_id, userId)
      ))
      .returning();
    
    return updated || null;
  }
}
```

**✅ STEP 3: Push Schema Changes (REQUIRED)**
```bash
# Push schema changes to database
npm run db:push

# This will:
# 1. Compare current schema with database
# 2. Generate migration SQL
# 3. Apply changes to PostgreSQL
# 4. Update type definitions
```

---

## 📝 **Template Usage Guidelines**

### **Feature Template Usage**
```markdown
# Use for:
- New React components (Canvas components, modals, drawers)
- New Node.js services (Express.js API endpoints)
- API endpoints (Impact tree operations)
- Database schema changes (Drizzle ORM entities)
- Integration features (Canvas-backend sync)
- Performance optimizations (Canvas rendering, optimistic updates)

# Key sections to focus on:
- Business case (why this feature matters for PM discovery)
- Technical specification (React + Node.js integration)
- Implementation approach (Canvas and tree-specific patterns)
- Success metrics (measurable outcomes)
```

### **Issue Template Usage**
```markdown
# Use for:
- Frontend bugs (React components, Canvas issues)
- Backend bugs (Node.js services, API issues)
- Database problems (Drizzle ORM/PostgreSQL issues)
- Integration issues (Frontend-Backend communication)
- Canvas performance problems (Rendering, large trees)
- Security concerns (Authentication, data protection)

# Key sections to focus on:
- Clear problem description
- Reproduction steps
- Impact assessment (on PM discovery workflow)
- Proposed solution approach
```

---

## 🔗 **Cross-Reference Patterns**

### **Linking Strategy**
- **Feature → Implementation Plan**: Every approved feature should have an implementation plan
- **Issue → Implementation Plan**: P1 and P2 issues should have implementation plans
- **Implementation Plan → Development Guidelines**: Reference relevant guidelines
- **All Documents → Related Documents**: Link to similar or related work

### **Naming Conventions**
```bash
# Features (Pending)
XX_descriptive_feature_name.md
example: 15_user_dashboard_component.md

# Features (Completed) - Add "X" prefix
XXX_descriptive_feature_name.md
example: X15_user_dashboard_component.md

# Issues (Pending)
issue_XXX_short_description.md
example: issue_016_api_timeout_error.md

# Issues (Completed) - Add "X" prefix
Xissue_XXX_short_description.md
example: Xissue_016_api_timeout_error.md
```

---

## ✅ **Completion Marking System**

### **"X" Prefix Completion Convention**
**Purpose**: Provide immediate visual indication of completion status without requiring separate tracking documents or complex status systems.

### **When to Add "X" Prefix**
- **Upon Implementation Completion**: When a feature, issue fix, or implementation plan has been fully implemented and deployed
- **Upon Verification**: After testing confirms the implementation works as expected
- **Upon Documentation**: After implementation reports are created and linked

---

## 🎯 **Quality Standards**

### **🚨 MANDATORY React/TypeScript Syntax Validation**

**Before proposing ANY React/TypeScript code changes, VALIDATE:**

1. **JSX String Escaping**:
   ```typescript
   // ❌ WRONG - Will cause syntax error
   label="The Customer's Problem (The \"What\")"
   
   // ✅ CORRECT - Use HTML entities in JSX
   label="The Customer's Problem (The &quot;What&quot;)"
   ```

2. **Template Literal Validation**:
   ```typescript
   // ❌ Check for unescaped quotes, invalid syntax
   // ✅ Validate all template literal expressions
   ```

3. **Import Path Validation**:
   ```typescript
   // ✅ Ensure all imports reference existing files
   import { Component } from './existing-component'
   ```

### **Documentation Quality Checklist**
- [ ] **Template Used**: Appropriate template used as base
- [ ] **React + Node.js Context**: Specific to React + Node.js tech stack and patterns
- [ ] **Clear Objective**: Purpose and goals clearly stated
- [ ] **Actionable**: Next steps clearly defined
- [ ] **Cross-Referenced**: Links to related documentation
- [ ] **Consistent Naming**: Follows naming conventions
- [ ] **Proper Categorization**: Placed in correct folder
- [ ] **Developer Learning Guide**: Comprehensive educational content included
- [ ] **Canvas Integration**: Considers HTML5 canvas and tree visualization
- [ ] **🚨 MANDATORY**: Both feature doc AND implementation plan created (if feature request)
- [ ] **🚨 MANDATORY**: All React/TypeScript syntax validated before proposal

### **AI Assistant Quality Standards**
- **Always use templates** - Never create documentation from scratch
- **Include React + Node.js context** - Reference existing services, patterns, tech stack
- **Maintain consistency** - Follow established naming and organization patterns
- **Cross-reference appropriately** - Link related documents and guidelines
- **Focus on actionability** - Ensure documentation leads to clear next steps
- **Apply completion marking** - Use "X" prefix when features/issues are completed
- **Canvas awareness** - Consider HTML5 canvas and tree visualization in all features

### **🚨 MANDATORY REQUIREMENTS (Non-Negotiable)**
- **AUTOMATIC IMPLEMENTATION PLANS**: Every feature request MUST create both feature doc AND implementation plan
- **SYNTAX VALIDATION**: All React/TypeScript code MUST be validated for syntax errors before proposal
- **COMPLETE WORKFLOW**: Never skip steps, always follow complete workflow process
- **TEMPLATE COMPLIANCE**: Use complete templates, never partial or abbreviated versions
- **CHECKPOINT VALIDATION**: Stop and verify each step is completed before proceeding

---

**📝 Workflow Guide Version**: 1.0
**🎯 Purpose**: Enable efficient AI-assisted documentation for React + Node.js projects
**📅 Last Updated**: June 2025
