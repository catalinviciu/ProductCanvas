
# 🎯 Node Content Templates

> **Feature Type**: Content Structure Enhancement - PM Documentation Quality  
> **Priority**: High - Content Quality & Consistency Improvement  
> **Complexity**: Medium - UI Component Enhancement with Structured Forms  
> **PM Value**: Standardized, high-quality node documentation workflow

---

## 🎯 **Feature Overview**

Replace the current free-form description field with structured templates for each node type, providing Product Managers with guided frameworks to capture comprehensive, consistent, and actionable information for Objectives, Outcomes, and Opportunities.

### **Current State Analysis**
- **Existing Implementation**: Single description field with markdown support
- **Current Components**: [`NodeEditSideDrawer`](rag://rag_source_0) with basic description textarea
- **Limitations**: Inconsistent documentation quality, missing key information, no structured guidance

### **Target State Vision**
- **Structured Templates**: Node-type-specific forms with guided fields
- **Mandatory & Optional Fields**: Title mandatory, template fields optional but encouraged
- **ICE Scoring Integration**: Built-in prioritization scoring for opportunities
- **Modern Compact UI**: Efficient form design optimized for PM workflow

---

## 📋 **Detailed Requirements**

### **Template Specifications**

#### **1. Objective Node Template**
```
Fields:
- Title (mandatory)
- The "Why" - Core Problem/Opportunity
- Desired Outcome - The "What"
- Strategic Context & Alignment
- Target Audience
- Exclusion Criteria - What This Objective Is NOT
```

#### **2. Outcome Node Template**
```
Fields:
- Title (mandatory)
- Who - Target Audience
- Does What - Desired Behavior
- Baseline - Current State
- Target - Desired State
- Measurement Method & Data Source
- Timeframe
```

#### **3. Opportunity Node Template**
```
Fields:
- Title (mandatory)
- Customer's Problem/Need
- Evidence & Insights
- Direct Link to Key Result
- Impact on the Customer
- Customer Segment(s) Primarily Affected
- ICE Prioritization Score (Impact/Confidence/Ease with calculator)
```

### **UI/UX Requirements**

#### **1. Form Design**
- **Compact Layout**: Collapsible sections for better space management
- **Progressive Disclosure**: Show most important fields first
- **Smart Placeholders**: Context-aware guidance text
- **Field Validation**: Only title is mandatory, others optional

#### **2. ICE Scoring Interface**
- **Interactive Sliders**: 1-5 scale with visual feedback
- **Auto-calculation**: Real-time ICE score calculation
- **Rationale Fields**: Text areas for explaining scores
- **Visual Score Display**: Prominent display of calculated ICE score

#### **3. Template Switching**
- **Dynamic Forms**: Form changes based on node type selection
- **Data Preservation**: Preserve data when switching between compatible fields
- **Confirmation Dialog**: Warn when switching would lose incompatible data

---

## 🔧 **Technical Implementation**

### **Template Field Definitions**

#### **Field Schema Interface**
```typescript
interface TemplateField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'slider' | 'calculated';
  placeholder: string;
  required: boolean;
  maxLength?: number;
  rows?: number;
  section?: string;
}

interface ICEScore {
  impact: number;
  confidence: number;
  ease: number;
  impactRationale: string;
  confidenceRationale: string;
  easeRationale: string;
  calculatedScore: number;
}
```

#### **Template Definitions**
```typescript
const OBJECTIVE_TEMPLATE: TemplateField[] = [
  {
    id: 'coreWhy',
    label: 'The "Why" (Core Problem/Opportunity)',
    type: 'textarea',
    placeholder: 'What fundamental problem are we solving for users? Focus on the unmet need or significant opportunity...',
    required: false,
    rows: 3,
    section: 'problem'
  },
  // ... additional fields
];
```

### **Component Architecture Updates**

#### **Enhanced Side Drawer Structure**
```typescript
NodeEditSideDrawer.tsx
├── NodeEditHeader (existing)
├── BasicInfoSection (title + type - existing)
├── TemplateFormSection (NEW - dynamic template fields)
│   ├── ObjectiveForm
│   ├── OutcomeForm
│   └── OpportunityForm (with ICE scoring)
├── ICEScoringWidget (NEW - for opportunities)
└── DrawerActions (existing)
```

#### **Template Form Components**
```typescript
// New template-specific components
ObjectiveForm.tsx - Structured objective fields
OutcomeForm.tsx - Outcome tracking fields  
OpportunityForm.tsx - Opportunity assessment fields
ICEScoringWidget.tsx - Interactive scoring interface
TemplateField.tsx - Reusable field component
```

---

## 🎨 **User Experience Design**

### **Visual Design Guidelines**

#### **Template Form Layout**
- **Section Headers**: Clear visual separation with icons
- **Field Grouping**: Related fields grouped in collapsible sections
- **Compact Spacing**: Efficient use of drawer space
- **Visual Hierarchy**: Important fields more prominent

#### **ICE Scoring Widget Design**
- **Slider Interface**: Clean, modern sliders with value labels
- **Score Display**: Large, prominent calculated score
- **Rationale Placement**: Compact text areas below each slider
- **Color Coding**: Visual feedback for score ranges (low/medium/high)

#### **Placeholder Text Strategy**
- **Contextual Guidance**: Specific examples for each field
- **Progressive Detail**: More detailed placeholders for complex fields
- **Disappearing Behavior**: Standard placeholder behavior on focus
- **Help Icons**: Optional help tooltips for complex concepts

### **Interaction Patterns**

#### **Template Switching Flow**
1. **Type Selection**: User changes node type in dropdown
2. **Data Assessment**: System checks for compatible/incompatible data
3. **Confirmation**: If data loss possible, show confirmation dialog
4. **Form Transformation**: Smoothly transition to new template
5. **Focus Management**: Auto-focus on first empty required field

#### **ICE Scoring Workflow**
1. **Slider Interaction**: User adjusts impact/confidence/ease scores
2. **Real-time Calculation**: ICE score updates immediately
3. **Rationale Entry**: Optional explanatory text for each score
4. **Visual Feedback**: Score changes reflected in visual indicators

---

## 🚀 **Implementation Plan**

### **Phase 1: Template Infrastructure (Week 1)**
- **Template Definitions**: Create field schemas for all node types
- **Template Engine**: Build dynamic form rendering system
- **Data Model Updates**: Extend node schema to store template data
- **Basic Form Rendering**: Implement template-specific form components

### **Phase 2: ICE Scoring Widget (Week 2)**
- **Slider Components**: Build interactive scoring sliders
- **Score Calculator**: Implement real-time ICE calculation
- **Rationale Fields**: Add explanatory text areas
- **Integration**: Connect ICE widget to opportunity template

### **Phase 3: Enhanced UI & UX (Week 3)**
- **Visual Polish**: Implement modern, compact design
- **Section Collapsing**: Add collapsible sections for better space management
- **Placeholder System**: Implement contextual placeholder texts
- **Template Switching**: Build smooth transition between templates

### **Phase 4: Data Persistence & Validation (Week 4)**
- **Data Storage**: Update backend to handle template data
- **Migration**: Convert existing nodes to template format
- **Validation**: Implement template-specific validation rules
- **Testing**: Comprehensive testing of all template functionality

---

## 📊 **Success Metrics**

### **Content Quality Metrics**
- **Field Completion Rate**: 80% of template fields completed for new nodes
- **Documentation Consistency**: 90% reduction in incomplete node information
- **Template Adoption**: 95% of new nodes use template format
- **ICE Score Usage**: 100% of opportunities include ICE scores

### **User Experience Metrics**
- **Form Completion Time**: 50% reduction in time to create comprehensive nodes
- **User Satisfaction**: Positive feedback on template guidance
- **Template Switching**: <5% data loss incidents during type changes
- **ICE Scoring Efficiency**: <30 seconds to complete ICE assessment

### **Technical Metrics**
- **Form Performance**: <200ms template switching time
- **Data Integrity**: 100% successful template data storage
- **Mobile Compatibility**: Full template functionality on tablets
- **Accessibility**: WCAG 2.1 AA compliance for all template components

---

## 🔍 **Risk Assessment**

### **Technical Risks**
- **Data Migration**: Converting existing free-form content to templates
- **Performance Impact**: Complex forms may affect drawer performance
- **Storage Requirements**: Template data increases database usage
- **Backward Compatibility**: Maintaining support for non-template nodes

### **UX Risks**
- **Cognitive Load**: Templates may overwhelm users initially
- **Flexibility Loss**: Structured format may feel restrictive
- **Template Switching**: Users may lose data when changing node types
- **Mobile Usability**: Complex forms challenging on smaller screens

### **Mitigation Strategies**
- **Gradual Rollout**: Optional template mode before mandatory adoption
- **Data Preservation**: Smart field mapping when switching templates
- **Progressive Enhancement**: Start with basic templates, add complexity
- **User Training**: Create template-specific documentation and tutorials

---

## 🎯 **Acceptance Criteria**

### **Template Functionality**
- [ ] All three node types have complete template implementations
- [ ] Only title field is mandatory, all template fields are optional
- [ ] Template switching preserves compatible data
- [ ] ICE scoring calculates correctly and updates in real-time

### **User Interface**
- [ ] Compact, modern design fits within existing drawer space
- [ ] All template fields have appropriate placeholder text
- [ ] Collapsible sections work smoothly for space management
- [ ] ICE scoring widget is intuitive and visually clear

### **Data Handling**
- [ ] Template data saves correctly to database
- [ ] Existing nodes migrate to template format without data loss
- [ ] Form validation works properly for all field types
- [ ] Template switching confirmation dialog prevents accidental data loss

---

## 🔗 **Related Documentation**

### **Implementation**
- **Implementation Plan**: [Node Content Templates Implementation Plan](../implementation_plans/25_Node_Content_Templates_Implementation_Plan.md)
- **Workflow Guide**: [Documentation Workflow Guide](../workflow_guide.md)

### **Dependencies**
- **Existing Component**: [NodeEditSideDrawer](rag://rag_source_0)
- **Schema Updates**: Node model extensions for template data
- **UI Components**: Slider, collapsible sections, form validation
- **Database**: Template data storage and migration scripts

### **Impact Analysis**
- **Database Schema**: New fields for template-structured data
- **API Endpoints**: Extended to handle template data
- **Frontend State**: Enhanced context for template management
- **User Workflow**: Guided content creation process

---

**📝 Feature Version**: 1.0  
**🎯 Project Impact**: High - Content Quality & PM Workflow Enhancement  
**📅 Created**: January 2025  
**👤 Stakeholder**: Product Manager Discovery Team  
**📊 Status**: 📋 Feature Specification - Ready for Implementation
