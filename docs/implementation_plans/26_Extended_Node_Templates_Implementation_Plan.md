
# 🚀 Extended Node Templates Implementation Plan

> **Implementation Type**: Feature Extension - Template System Enhancement  
> **Complexity**: Medium - UI Component Extension with Advanced Scoring  
> **Estimated Duration**: 3-4 weeks  
> **Dependencies**: Existing Node Content Templates system

---

## 📋 **Implementation Overview**

This plan details the technical implementation of extended templates for Solution, Assumption Test, Metric, and Research node types, building on the existing template infrastructure while preserving current Objective, Outcome, and Opportunity templates.

### **Pre-Implementation Validation**

#### **✅ CRITICAL CHECKS (MANDATORY)**
- [ ] **Existing Template System**: Verify current template infrastructure is stable
- [ ] **Database Schema**: Confirm current template data storage is working
- [ ] **UI Components**: Validate existing template components are reusable
- [ ] **Performance Baseline**: Measure current side drawer performance

#### **🎯 SUCCESS CRITERIA VALIDATION**
- [ ] **Template Consistency**: New templates must match existing UI/UX patterns
- [ ] **Data Preservation**: Template switching must preserve compatible data
- [ ] **Performance**: No degradation in drawer loading or switching times
- [ ] **Mobile Compatibility**: All new templates must work on tablets

---

## 🗄️ **Database & Schema Changes**

### **Phase 1: Extended Template Data Schema (8 hours)**

#### **Enhanced TemplateData Interface**
```typescript
// Extended template data types in shared/schema.ts
interface ExtendedTemplateData {
  // Existing fields (preserve unchanged)
  coreWhy?: string;
  desiredOutcome?: string;
  // ... existing Objective, Outcome, Opportunity fields
  
  // NEW: Solution template fields
  solutionRationale?: string;
  solutionDescription?: string;
  keyUseCases?: string;
  coreFeatures?: string;
  dependencies?: string;
  
  // NEW: RICE scoring for Solutions
  riceReach?: number;
  riceImpact?: number;
  riceConfidence?: number;
  riceEffort?: number;
  riceReachRationale?: string;
  riceImpactRationale?: string;
  riceConfidenceRationale?: string;
  riceEffortRationale?: string;
  calculatedRiceScore?: number;
  
  // NEW: Assumption Test fields
  assumptionType?: 'desirability' | 'feasibility' | 'viability' | 'usability';
  coreAssumption?: string;
  experimentDesign?: string;
  learningGoal?: string;
  successIndicators?: string;
  
  // NEW: Evidence-Impact scoring for Assumptions
  evidenceStrength?: number;
  impactIfWrong?: number;
  evidenceRationale?: string;
  impactRationale?: string;
  calculatedPriority?: 'high' | 'low' | 'not-worth-testing';
  
  // NEW: Metric template fields
  metricType?: 'leading' | 'lagging' | 'diagnostic';
  definition?: string;
  dataSource?: string;
  collectionMethod?: string;
  frequency?: string;
  targetValue?: string;
  currentBaseline?: string;
  
  // NEW: Research template fields
  researchType?: 'user-research' | 'market-research' | 'competitive-analysis' | 'technical-research';
  researchQuestion?: string;
  methodology?: string;
  participantsSources?: string;
  timeline?: string;
  successCriteria?: string;
  keyFindings?: string;
}
```

#### **Database Migration Strategy**
```sql
-- No schema changes needed - existing JSONB template_data field accommodates new structure
-- Validate existing data remains intact
SELECT COUNT(*) FROM impact_trees WHERE nodes::text LIKE '%templateData%';
```

---

## 🎨 **Frontend Implementation**

### **Phase 2: Template Component Architecture (16 hours)**

#### **New Template Form Components**
```typescript
// client/src/components/drawers/template-forms/SolutionForm.tsx
interface SolutionFormProps {
  data: ExtendedTemplateData;
  onFieldChange: (field: string, value: string | number) => void;
}

export function SolutionForm({ data, onFieldChange }: SolutionFormProps) {
  return (
    <div className="space-y-4">
      <CollapsibleSection title="Solution Definition" defaultOpen>
        <TemplateField
          id="solutionRationale"
          label="Solution Rationale"
          value={data.solutionRationale || ''}
          placeholder={SOLUTION_PLACEHOLDERS.solutionRationale}
          onChange={(value) => onFieldChange('template.solutionRationale', value)}
          type="textarea"
          rows={4}
        />
        
        <TemplateField
          id="solutionDescription"
          label="Solution Description"
          value={data.solutionDescription || ''}
          placeholder={SOLUTION_PLACEHOLDERS.solutionDescription}
          onChange={(value) => onFieldChange('template.solutionDescription', value)}
          type="textarea"
          rows={3}
        />
        
        <TemplateField
          id="keyUseCases"
          label="Key Use Cases / User Stories"
          value={data.keyUseCases || ''}
          placeholder={SOLUTION_PLACEHOLDERS.keyUseCases}
          onChange={(value) => onFieldChange('template.keyUseCases', value)}
          type="textarea"
          rows={3}
        />
        
        <TemplateField
          id="coreFeatures"
          label="Core Features"
          value={data.coreFeatures || ''}
          placeholder={SOLUTION_PLACEHOLDERS.coreFeatures}
          onChange={(value) => onFieldChange('template.coreFeatures', value)}
          type="textarea"
          rows={3}
        />
        
        <TemplateField
          id="dependencies"
          label="Dependencies"
          value={data.dependencies || ''}
          placeholder={SOLUTION_PLACEHOLDERS.dependencies}
          onChange={(value) => onFieldChange('template.dependencies', value)}
          type="textarea"
          rows={3}
        />
      </CollapsibleSection>
      
      <CollapsibleSection title="RICE Prioritization" defaultOpen>
        <RiceScoringWidget
          data={data}
          onFieldChange={onFieldChange}
        />
      </CollapsibleSection>
    </div>
  );
}
```

#### **Advanced Scoring Widgets**
```typescript
// client/src/components/drawers/scoring-widgets/RiceScoringWidget.tsx
interface RiceScoringWidgetProps {
  data: ExtendedTemplateData;
  onFieldChange: (field: string, value: number | string) => void;
}

export function RiceScoringWidget({ data, onFieldChange }: RiceScoringWidgetProps) {
  // Calculate RICE score in real-time
  const calculateRiceScore = useCallback(() => {
    const reach = data.riceReach || 0;
    const impact = data.riceImpact || 0;
    const confidence = data.riceConfidence || 0;
    const effort = data.riceEffort || 1; // Avoid division by zero
    
    const score = (reach * impact * confidence) / effort;
    onFieldChange('template.calculatedRiceScore', Math.round(score * 100) / 100);
  }, [data.riceReach, data.riceImpact, data.riceConfidence, data.riceEffort, onFieldChange]);

  useEffect(() => {
    calculateRiceScore();
  }, [calculateRiceScore]);

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="text-lg font-semibold text-blue-900">
          RICE Score: {data.calculatedRiceScore?.toFixed(1) || '0.0'}
        </div>
        <div className="text-sm text-blue-700">
          Formula: (Reach × Impact × Confidence) ÷ Effort
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <ScoreSlider
          label="Reach"
          value={data.riceReach || 0}
          onChange={(value) => onFieldChange('template.riceReach', value)}
          min={0}
          max={10000}
          step={100}
          tooltip="How many users will this affect per quarter?"
        />
        
        <ScoreSlider
          label="Impact"
          value={data.riceImpact || 0}
          onChange={(value) => onFieldChange('template.riceImpact', value)}
          min={0}
          max={3}
          step={0.5}
          tooltip="How much will this contribute to the outcome? (3=Massive, 2=High, 1=Medium, 0.5=Low)"
        />
        
        <ScoreSlider
          label="Confidence"
          value={data.riceConfidence || 0}
          onChange={(value) => onFieldChange('template.riceConfidence', value)}
          min={0}
          max={100}
          step={5}
          tooltip="How confident are you in your estimates? (percentage)"
        />
        
        <ScoreSlider
          label="Effort"
          value={data.riceEffort || 1}
          onChange={(value) => onFieldChange('template.riceEffort', value)}
          min={0.1}
          max={12}
          step={0.1}
          tooltip="Total work required from all teams (person-months)"
        />
      </div>
      
      <div className="space-y-2">
        <TemplateField
          id="riceReachRationale"
          label="Reach Rationale"
          value={data.riceReachRationale || ''}
          placeholder="Explain your reach estimate..."
          onChange={(value) => onFieldChange('template.riceReachRationale', value)}
          type="textarea"
          rows={2}
        />
        
        <TemplateField
          id="riceImpactRationale"
          label="Impact Rationale"
          value={data.riceImpactRationale || ''}
          placeholder="Explain your impact estimate..."
          onChange={(value) => onFieldChange('template.riceImpactRationale', value)}
          type="textarea"
          rows={2}
        />
      </div>
    </div>
  );
}
```

#### **Evidence-Impact Matrix Widget**
```typescript
// client/src/components/drawers/scoring-widgets/EvidenceImpactWidget.tsx
export function EvidenceImpactWidget({ data, onFieldChange }: EvidenceImpactWidgetProps) {
  // Calculate priority based on evidence strength and impact
  const calculatePriority = useCallback(() => {
    const evidence = data.evidenceStrength || 0;
    const impact = data.impactIfWrong || 0;
    
    let priority: 'high' | 'low' | 'not-worth-testing';
    
    if (evidence >= 4 && impact >= 4) priority = 'low'; // Strong evidence, high impact
    else if (evidence >= 4 && impact < 4) priority = 'not-worth-testing'; // Strong evidence, low impact
    else if (evidence < 4 && impact < 4) priority = 'low'; // Weak evidence, low impact
    else priority = 'high'; // Weak evidence, high impact
    
    onFieldChange('template.calculatedPriority', priority);
  }, [data.evidenceStrength, data.impactIfWrong, onFieldChange]);

  useEffect(() => {
    calculatePriority();
  }, [calculatePriority]);

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 p-4 rounded-lg">
        <div className="text-lg font-semibold text-purple-900">
          Priority: {data.calculatedPriority?.toUpperCase() || 'UNKNOWN'}
        </div>
        <div className="text-sm text-purple-700">
          Based on evidence strength vs impact if assumption is wrong
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <ScoreSlider
          label="Evidence Strength"
          value={data.evidenceStrength || 0}
          onChange={(value) => onFieldChange('template.evidenceStrength', value)}
          min={1}
          max={5}
          step={1}
          tooltip="How much evidence supports this assumption? (1=Weak, 5=Strong)"
        />
        
        <ScoreSlider
          label="Impact if Wrong"
          value={data.impactIfWrong || 0}
          onChange={(value) => onFieldChange('template.impactIfWrong', value)}
          min={1}
          max={5}
          step={1}
          tooltip="What's the impact if this assumption is incorrect? (1=Low, 5=High)"
        />
      </div>
      
      {/* 2x2 Priority Matrix Visualization */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="text-sm font-medium mb-2">Priority Matrix</div>
        <div className="grid grid-cols-2 gap-1 h-32">
          <div className="bg-yellow-200 p-2 text-xs text-center">
            Low Priority<br/>
            (Strong Evidence,<br/>High Impact)
          </div>
          <div className="bg-red-200 p-2 text-xs text-center">
            High Priority<br/>
            (Weak Evidence,<br/>High Impact)
          </div>
          <div className="bg-gray-200 p-2 text-xs text-center">
            Not Worth Testing<br/>
            (Strong Evidence,<br/>Low Impact)
          </div>
          <div className="bg-yellow-200 p-2 text-xs text-center">
            Low Priority<br/>
            (Weak Evidence,<br/>Low Impact)
          </div>
        </div>
      </div>
    </div>
  );
}
```

### **Phase 3: Template Integration (12 hours)**

#### **Extended Template Placeholders**
```typescript
// client/src/lib/template-placeholders.ts
export const EXTENDED_TEMPLATE_PLACEHOLDERS = {
  solution: {
    solutionRationale: "e.g., 'By proactively displaying universally recognized symbols of digital security, we can address the user's fear, uncertainty, and doubt at the exact moment they are asked to trust us with their financial data. This increased feeling of safety will make them more likely to complete the bank connection process.'",
    
    solutionDescription: "e.g., 'A new module on the bank connection page that displays security information and credentials to build user trust.'",
    
    keyUseCases: "e.g., 'As a new user, when I am asked to connect my bank account, I want to see proof of security so that I can feel confident my data is safe.'",
    
    coreFeatures: "e.g., 'Display a row of third-party security logos (e.g., Norton, McAfee, Plaid). Include a \"Learn More\" link that opens a modal with details on encryption and data policies.'",
    
    dependencies: "e.g., 'Technical: Access to the Plaid API for their official security marks. Cross-functional: Legal team review of all security claims made in the \"Learn More\" modal.'"
  },
  
  assumptionTest: {
    desirability: {
      coreAssumption: "e.g., 'Our music streaming app users desire a personalized playlist curator feature that learns their preferences and automatically generates new playlists, saving them time and introducing them to new music.'",
      
      experimentDesign: "e.g., 'Conduct a brief, in-app survey for 100 active users asking: \"Would you be interested in a feature that automatically creates personalized playlists for you based on your listening habits?\"'",
      
      learningGoal: "e.g., 'To gauge the level of user interest in an automated playlist curation feature and understand their specific needs and expectations from it, informing whether to invest in its development.'",
      
      successIndicators: "e.g., 'Over 70% of surveyed users indicating strong interest (\"Yes, definitely\" or \"Yes, probably\"). Recurring themes in open-ended responses about saving time, discovering new artists, or matching specific moods.'"
    },
    
    feasibility: {
      coreAssumption: "e.g., 'Our current database and API infrastructure can handle real-time inventory updates across all product SKUs for our e-commerce platform during peak traffic without significant latency or data inconsistencies.'",
      
      experimentDesign: "e.g., 'Run a controlled load test in a staging environment. Simulate 500 concurrent users browsing products and 50 concurrent \"purchase\" events (which trigger inventory updates).'",
      
      learningGoal: "e.g., 'To determine if our existing technical architecture can support real-time inventory synchronization under realistic load conditions, identifying any performance bottlenecks or data integrity risks.'",
      
      successIndicators: "e.g., 'Average inventory update latency remaining below 200ms. Database CPU and memory utilization staying below 80%. No instances of incorrect inventory counts observed after concurrent updates.'"
    }
  },
  
  metric: {
    definition: "e.g., 'The number of unique users who actively engage with the platform within a 7-day period, measured by completing at least one core action (creating content, making a transaction, or interacting with other users).'",
    
    dataSource: "e.g., 'Google Analytics 4 user engagement events, combined with internal user activity database tracking core actions.'",
    
    collectionMethod: "e.g., 'Automated daily aggregation from GA4 API and internal database queries, compiled into weekly reports.'",
    
    targetValue: "e.g., '10,000 weekly active users by end of Q3 2025'",
    
    currentBaseline: "e.g., '7,500 weekly active users as of December 2024'"
  },
  
  research: {
    researchQuestion: "e.g., 'Why do users drop off at the bank connection step, and what specific concerns or barriers prevent them from completing this action?'",
    
    methodology: "e.g., 'Mixed methods approach: 1) User interviews with 8-10 users who dropped off, 2) Usability testing of the bank connection flow, 3) Analysis of user behavior data from the connection funnel.'",
    
    participantsSources: "e.g., 'Recent users who started but didn\\'t complete bank connection (recruited via email), plus 3-5 new users for fresh perspective (recruited via user research panel).'",
    
    timeline: "e.g., 'Week 1-2: Recruit participants and conduct interviews. Week 3: Usability testing sessions. Week 4: Data analysis and synthesis. Week 5: Report preparation and presentation.'",
    
    successCriteria: "e.g., 'Clear identification of top 3 barriers to bank connection completion, with specific user quotes and behavioral evidence. Actionable recommendations for reducing drop-off by at least 25%.'"
  }
};
```

#### **Enhanced Side Drawer Integration**
```typescript
// client/src/components/drawers/node-edit-side-drawer.tsx - UPDATE
const renderTemplateSection = () => {
  if (!node.type) return null;

  const templateData = node.templateData || {};

  switch (node.type) {
    case 'objective':
      return <ObjectiveForm data={templateData} onFieldChange={handleFieldChange} />;
    case 'outcome':
      return <OutcomeForm data={templateData} onFieldChange={handleFieldChange} />;
    case 'opportunity':
      return <OpportunityForm data={templateData} onFieldChange={handleFieldChange} />;
    case 'solution':
      return <SolutionForm data={templateData} onFieldChange={handleFieldChange} />;
    case 'assumption':
      return <AssumptionTestForm data={templateData} onFieldChange={handleFieldChange} />;
    case 'metric':
      return <MetricForm data={templateData} onFieldChange={handleFieldChange} />;
    case 'research':
      return <ResearchForm data={templateData} onFieldChange={handleFieldChange} />;
    default:
      return null;
  }
};
```

---

## 🧪 **Testing Strategy**

### **Phase 4: Comprehensive Testing (12 hours)**

#### **Unit Testing**
```typescript
// client/src/components/drawers/scoring-widgets/__tests__/RiceScoringWidget.test.tsx
describe('RiceScoringWidget', () => {
  it('calculates RICE score correctly', () => {
    const mockOnFieldChange = jest.fn();
    const testData = {
      riceReach: 1000,
      riceImpact: 2,
      riceConfidence: 80,
      riceEffort: 1
    };
    
    render(<RiceScoringWidget data={testData} onFieldChange={mockOnFieldChange} />);
    
    // Verify calculation: (1000 * 2 * 80) / 1 = 160,000
    expect(mockOnFieldChange).toHaveBeenCalledWith('template.calculatedRiceScore', 160000);
  });
  
  it('handles edge cases gracefully', () => {
    const mockOnFieldChange = jest.fn();
    const testData = { riceEffort: 0 }; // Division by zero case
    
    render(<RiceScoringWidget data={testData} onFieldChange={mockOnFieldChange} />);
    
    // Should default effort to 1 to avoid division by zero
    expect(mockOnFieldChange).toHaveBeenCalledWith('template.riceEffort', 1);
  });
});
```

#### **Integration Testing**
```typescript
// client/src/components/drawers/__tests__/node-edit-side-drawer.integration.test.tsx
describe('Extended Template Integration', () => {
  it('switches between all template types correctly', async () => {
    const mockNode = createMockNode('solution');
    render(<NodeEditSideDrawer node={mockNode} />);
    
    // Switch to assumption test template
    const typeSelect = screen.getByLabelText('Node Type');
    fireEvent.change(typeSelect, { target: { value: 'assumption' } });
    
    // Verify assumption test template renders
    expect(screen.getByText('Assumption Type')).toBeInTheDocument();
    expect(screen.getByText('Evidence-Impact Prioritization')).toBeInTheDocument();
  });
  
  it('preserves compatible data during template switches', async () => {
    const mockNode = createMockNode('solution', {
      templateData: { solutionRationale: 'Test rationale' }
    });
    
    render(<NodeEditSideDrawer node={mockNode} />);
    
    // Switch template types and verify data preservation logic
    // (Implementation would check for compatible fields)
  });
});
```

---

## 📊 **Performance Optimization**

### **Phase 5: Performance & Polish (8 hours)**

#### **React Performance Optimizations**
```typescript
// Memoize scoring calculations to prevent unnecessary re-renders
const MemoizedRiceScoringWidget = React.memo(RiceScoringWidget, (prevProps, nextProps) => {
  return (
    prevProps.data.riceReach === nextProps.data.riceReach &&
    prevProps.data.riceImpact === nextProps.data.riceImpact &&
    prevProps.data.riceConfidence === nextProps.data.riceConfidence &&
    prevProps.data.riceEffort === nextProps.data.riceEffort
  );
});

// Debounce scoring calculations to improve performance
const useDebouncedScoring = (calculateFn: () => void, delay: number = 300) => {
  const debouncedFn = useMemo(
    () => debounce(calculateFn, delay),
    [calculateFn, delay]
  );
  
  useEffect(() => {
    return () => {
      debouncedFn.cancel();
    };
  }, [debouncedFn]);
  
  return debouncedFn;
};
```

#### **Bundle Size Optimization**
- **Lazy Loading**: Load template components only when needed
- **Code Splitting**: Separate scoring widgets into async chunks
- **Tree Shaking**: Ensure unused template components are excluded

---

## ✅ **Implementation Checklist**

### **Database & Backend**
- [ ] **Extended schema interface**: New template data types defined
- [ ] **Data validation**: Server-side validation for new template fields
- [ ] **API compatibility**: Existing endpoints handle extended template data
- [ ] **Migration testing**: Existing template data remains intact

### **Frontend Components**
- [ ] **Solution template**: Complete implementation with RICE scoring
- [ ] **Assumption test template**: Implementation with Evidence-Impact matrix
- [ ] **Metric template**: Complete form implementation
- [ ] **Research template**: Complete form implementation
- [ ] **Scoring widgets**: RICE and Evidence-Impact widgets functional
- [ ] **Template integration**: All templates integrate with side drawer

### **User Experience**
- [ ] **Placeholder texts**: Context-aware placeholders for all fields
- [ ] **Template switching**: Smooth transitions between all template types
- [ ] **Data preservation**: Compatible data preserved during template changes
- [ ] **Mobile responsiveness**: All templates work on tablet devices
- [ ] **Performance**: No degradation in drawer loading times

### **Testing & Quality**
- [ ] **Unit tests**: Scoring calculations and individual components
- [ ] **Integration tests**: Template switching and data persistence
- [ ] **Performance tests**: No regression in side drawer performance
- [ ] **Accessibility**: All new components meet WCAG 2.1 AA standards
- [ ] **Browser testing**: Cross-browser compatibility verified

### **Documentation & Deployment**
- [ ] **Code documentation**: JSDoc comments for all new components
- [ ] **User documentation**: Template usage guide updated
- [ ] **Implementation report**: Comprehensive completion report created
- [ ] **Replit deployment**: Successfully deployed to production

---

## 🚀 **Deployment Strategy**

### **Phased Rollout Plan**
1. **Week 1**: Deploy Solution template only, gather feedback
2. **Week 2**: Add Assumption Test template with Evidence-Impact matrix
3. **Week 3**: Deploy Metric and Research templates
4. **Week 4**: Full system integration and performance optimization

### **Rollback Plan**
- **Feature Flags**: Enable/disable specific templates independently
- **Data Compatibility**: All changes backward compatible with existing data
- **Quick Rollback**: Can revert to existing template system without data loss

---

**📝 Implementation Plan Version**: 1.0  
**🎯 Estimated Completion**: 3-4 weeks  
**📅 Created**: January 2025  
**👤 Implementation Team**: Frontend Development Team  
**📊 Status**: 📋 Ready for Implementation
