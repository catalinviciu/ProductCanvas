
# 🎨 Enhanced Node Edit Side Drawer

> **Feature Type**: UI/UX Enhancement - Canvas Interaction  
> **Priority**: High - Core PM Workflow Improvement  
> **Complexity**: Medium - UI Component Enhancement  
> **PM Value**: Direct improvement to daily discovery documentation workflow

---

## 🎯 **Feature Overview**

Transform the current node edit modal into a comprehensive side drawer that provides Product Managers with enhanced editing capabilities, including rich text formatting for descriptions and node-type-specific information fields.

### **Current State Analysis**
- **Existing Implementation**: Modal-based editing with basic text inputs
- **Current Components**: [`NodeEditModal`](rag://rag_source_0) with simple form fields
- **UI Library**: Radix UI with [Drawer component](rag://rag_source_1) already available
- **Limitations**: Cramped editing space, no formatting options, generic fields for all node types

### **Target State Vision**
- **Side Drawer Interface**: Spacious editing environment that doesn't obstruct canvas view
- **Rich Text Editing**: Formatted descriptions with markdown support
- **Node-Type-Specific Fields**: Contextual information fields based on node type
- **Enhanced UX**: Better visual hierarchy and improved PM workflow integration

---

## 📋 **Detailed Requirements**

### **Core Functionality Requirements**

#### **1. Side Drawer Implementation**
- **Drawer Positioning**: Right-side drawer (400px min width, expandable)
- **Canvas Integration**: Drawer slides in without covering canvas completely
- **Responsive Design**: Adapts to different screen sizes with mobile optimization
- **Persistent State**: Maintains open/closed state during canvas interactions

#### **2. Enhanced Description Editing**
- **Rich Text Editor**: Markdown-supported text area with formatting toolbar
- **Dynamic Placeholders**: Context-aware placeholder text based on node type
- **Hypothesis Integration**: For assumption tests, description field serves as hypothesis statement
- **Formatting Options**:
  - Bold, italic, underline text formatting
  - Bullet points and numbered lists
  - Headers (H1, H2, H3) for structure
  - Link insertion capabilities
  - Code blocks for technical details
- **Auto-save**: Drafts saved locally to prevent data loss
- **Character Count**: Visual indicator with recommended length guidelines

#### **3. Node-Type-Specific Fields**
- **Dynamic Field Rendering**: Fields change based on selected node type
- **Outcome Nodes**: Outcome metric, outcome timeline
- **Opportunity Nodes**: User segment, impact, confidence level
- **Solution Nodes**: Implementation approach, dependencies, technical complexity
- **Assumption Test Nodes**: Uses description as hypothesis, test methodology, success criteria
- **Research Nodes**: Research questions, methodology, findings section

#### **4. Improved User Experience**
- **Visual Hierarchy**: Clear section organization with collapsible groups
- **Field Validation**: Real-time validation with helpful error messages
- **Keyboard Shortcuts**: Save (Ctrl+S), Cancel (Esc), Format text
- **Accessibility**: Full keyboard navigation and screen reader support

---

## 🔧 **Technical Implementation**

### **Component Architecture**

#### **New Component Structure**
```typescript
// New side drawer component
NodeEditSideDrawer.tsx
├── NodeEditHeader (title, node type, actions)
├── BasicInfoSection (title, type selector)
├── DescriptionSection (rich text editor)
├── NodeSpecificFields (dynamic based on type)
├── TestCategorySection (for assumption nodes)
└── DrawerActions (save, cancel, delete)
```

#### **Rich Text Editor Integration**
- **Library Choice**: React-based markdown editor (e.g., @uiw/react-md-editor)
- **Toolbar Configuration**: Customized toolbar with PM-relevant formatting
- **Preview Mode**: Live preview of formatted text
- **Export Options**: Plain text fallback for database storage

### **State Management Enhancement**

#### **Drawer State Context**
```typescript
interface NodeEditDrawerState {
  isOpen: boolean;
  editingNode: TreeNode | null;
  formData: NodeFormData;
  isDirty: boolean;
  validationErrors: ValidationError[];
}
```

#### **Auto-save Implementation**
- **Debounced Saves**: 2-second delay after typing stops
- **Local Storage**: Draft persistence across sessions
- **Conflict Resolution**: Handle concurrent edits gracefully

### **Node-Type-Specific Field Definitions**

#### **Outcome Node Fields**
- **Outcome Metric**: Text area for measurable outcomes
- **Outcome Timeline**: Date picker for target achievement

#### **Opportunity Node Fields**
- **User Segment**: Target user group identification
- **Impact**: Text area describing potential impact
- **Confidence**: Low/Medium/High confidence level

#### **Solution Node Fields**
- **Implementation Approach**: Rich text for technical details
- **Dependencies**: Link to assumption tests and opportunities
- **Technical Complexity**: Low/Medium/High rating scale

#### **Assumption Test Node Fields**
- **Hypothesis Statement**: Uses the description field for hypothesis
- **Test Methodology**: Dropdown with common test types
- **Success Criteria**: Specific measurable outcomes
- **Risk Level**: Low/Medium/High assessment

---

## 🎨 **User Experience Design**

### **Visual Design Guidelines**

#### **Drawer Layout**
- **Header Section**: 60px height with node type indicator and actions
- **Content Area**: Scrollable with proper padding and spacing
- **Footer Actions**: Fixed position with save/cancel buttons
- **Resize Handle**: Optional width adjustment for user preference

#### **Rich Text Editor Design**
- **Toolbar**: Compact formatting options relevant to PM documentation
- **Editor Area**: Minimum 200px height, auto-expanding
- **Preview Toggle**: Side-by-side or tab-based preview mode
- **Character Counter**: Visual progress indicator

#### **Node-Specific Field Styling**
- **Section Headers**: Clear visual separation between field groups
- **Field Grouping**: Related fields grouped in collapsible sections
- **Help Text**: Contextual guidance for complex fields
- **Validation Feedback**: Inline error messages with helpful suggestions

### **Interaction Patterns**

#### **Opening the Drawer**
- **Trigger Actions**: Double-click node, context menu "Edit Node", edit button
- **Animation**: Smooth slide-in from right side (300ms duration)
- **Focus Management**: Auto-focus on title field when opened

#### **Editing Workflow**
- **Progressive Disclosure**: Show basic fields first, expand for detailed fields
- **Tab Navigation**: Logical tab order through all interactive elements
- **Save Behavior**: Auto-save drafts, manual save for final version
- **Exit Confirmation**: Prompt if unsaved changes exist

---

## 🚀 **Implementation Plan**

### **Phase 1: Core Drawer Implementation (Week 1)**
- **Setup**: Create new `NodeEditSideDrawer` component
- **Basic Layout**: Implement drawer positioning and responsive design
- **State Management**: Add drawer state to existing tree context
- **Migration**: Replace modal trigger with drawer opening

### **Phase 2: Rich Text Editor Integration (Week 2)**
- **Editor Selection**: Choose and integrate markdown editor library
- **Toolbar Configuration**: Customize formatting options for PM use cases
- **Preview Mode**: Implement live preview functionality
- **Storage**: Update backend to handle formatted text

### **Phase 3: Node-Type-Specific Fields (Week 3)**
- **Field Definitions**: Create field schemas for each node type
- **Dynamic Rendering**: Implement conditional field rendering
- **Validation**: Add type-specific validation rules
- **Database Updates**: Extend schema to store additional fields

### **Phase 4: Enhanced UX & Polish (Week 4)**
- **Auto-save**: Implement draft saving and restoration
- **Keyboard Shortcuts**: Add productivity shortcuts
- **Accessibility**: Full a11y compliance testing
- **Performance**: Optimize rendering for large descriptions

---

## 📊 **Success Metrics**

### **Quantitative Metrics**
- **Node Description Length**: 3x increase in average description length
- **Formatting Usage**: 60% of descriptions use at least one formatting option
- **Edit Session Time**: 40% reduction in time spent editing nodes
- **Save Frequency**: 50% reduction in unsaved work loss incidents

### **Qualitative Metrics**
- **PM Feedback**: Positive feedback on editing experience
- **Workflow Integration**: Seamless integration with discovery processes
- **Information Quality**: Improved clarity and structure of node content
- **Tool Adoption**: Increased daily usage of editing features

### **Technical Metrics**
- **Performance**: <100ms drawer open/close animation
- **Reliability**: 99.9% successful save rate
- **Accessibility**: WCAG 2.1 AA compliance
- **Mobile Usability**: Full functionality on tablet devices

---

## 🔍 **Risk Assessment**

### **Technical Risks**
- **Rich Text Storage**: Ensure markdown content renders consistently
- **Performance Impact**: Large descriptions may affect canvas performance
- **Mobile Compatibility**: Drawer may be challenging on small screens
- **Browser Compatibility**: Markdown editor support across browsers

### **UX Risks**
- **Complexity Increase**: More fields may overwhelm less technical PMs
- **Workflow Disruption**: Change from modal to drawer may confuse existing users
- **Information Overload**: Too many fields may reduce actual usage
- **Learning Curve**: Rich text editing may require user training

### **Mitigation Strategies**
- **Progressive Enhancement**: Start with simple fields, add complexity gradually
- **User Testing**: Conduct PM feedback sessions before full rollout
- **Fallback Options**: Maintain plain text editing option
- **Training Materials**: Create quick start guide for new features

---

## 🎯 **Acceptance Criteria**

### **Functional Requirements**
- [ ] Side drawer opens/closes smoothly without canvas disruption
- [ ] Rich text editor supports markdown formatting and preview
- [ ] Node-type-specific fields render correctly for each node type
- [ ] Auto-save functionality prevents data loss
- [ ] Form validation provides helpful error messages
- [ ] Keyboard shortcuts work as expected
- [ ] Mobile responsive design functions properly

### **Quality Requirements**
- [ ] Drawer animation performance <100ms
- [ ] Rich text editor loads <500ms
- [ ] All interactions accessible via keyboard
- [ ] Component passes TypeScript strict mode compilation
- [ ] Unit tests cover all major functionality
- [ ] Integration tests verify canvas-drawer interaction

### **User Experience Requirements**
- [ ] PMs can edit node descriptions 3x faster than current modal
- [ ] Formatting options are discoverable and easy to use
- [ ] Node-specific fields provide contextual help
- [ ] Unsaved changes are preserved across sessions
- [ ] Error states are clear and actionable
- [ ] Mobile editing experience is usable on tablets

---

## 🔗 **Related Documentation**

### **Dependencies**
- **UI Components**: [Drawer](rag://rag_source_1), [Textarea](rag://rag_source_2)
- **Current Implementation**: [NodeEditModal](rag://rag_source_0)
- **Canvas Integration**: [TreeNode](rag://rag_source_3) double-click behavior
- **Context Menus**: [ContextMenu](rag://rag_source_8) edit actions

### **Impact Analysis**
- **Canvas Performance**: Minimal impact, drawer doesn't block canvas
- **Database Schema**: New fields for node-type-specific data
- **API Changes**: Extended PUT endpoints for rich node data
- **State Management**: Enhanced tree context for drawer state

### **Future Enhancements**
- **Collaborative Editing**: Real-time multi-user editing
- **Template System**: Pre-defined templates for common node types
- **Export Options**: Export node content to various formats
- **Integration**: Connect with external PM tools and platforms

---

**📝 Feature Version**: 1.0  
**🎯 Project Impact**: High - Core PM Workflow Enhancement  
**📅 Created**: January 2025  
**👤 Stakeholder**: Product Manager Discovery Team  
**📊 Status**: 📋 Feature Specification - Ready for Implementation Planning
