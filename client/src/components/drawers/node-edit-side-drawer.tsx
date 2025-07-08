
import { useState, useEffect, useCallback, useMemo } from "react";
import { X, Save, Trash2, Type, Target, BarChart3, Lightbulb, ChevronDown, ChevronRight, Calculator, HelpCircle } from "lucide-react";
import { TreeNode, NodeType, TestCategory } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface NodeEditSideDrawerProps {
  node: TreeNode | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (node: TreeNode) => void;
  onDelete?: (nodeId: string) => void;
}

// Template data interfaces
interface TemplateData {
  // Objective fields
  coreWhy?: string;
  desiredOutcome?: string;
  strategicContext?: string;
  targetAudience?: string;
  exclusionCriteria?: string;
  
  // Outcome fields
  who?: string;
  doesWhat?: string;
  baseline?: string;
  target?: string;
  measurementMethod?: string;
  timeframe?: string;
  
  // Opportunity fields
  customerProblem?: string;
  evidenceInsights?: string;
  linkToKeyResult?: string;
  impactOnCustomer?: string;
  customerSegments?: string;
  
  // ICE scoring
  iceImpact?: number;
  iceConfidence?: number;
  iceEase?: number;
  iceImpactRationale?: string;
  iceConfidenceRationale?: string;
  iceEaseRationale?: string;
}

interface NodeFormData {
  type: NodeType;
  title: string;
  description: string;
  testCategory?: TestCategory;
  templateData: TemplateData;
}

const NODE_TYPE_ICONS = {
  objective: Target,
  outcome: BarChart3,
  opportunity: Lightbulb,
  solution: Target,
  assumption: Target,
  metric: BarChart3,
  research: Target,
};

const NODE_TYPE_COLORS = {
  objective: "bg-blue-100 text-blue-800 border-blue-200",
  outcome: "bg-indigo-100 text-indigo-800 border-indigo-200",
  opportunity: "bg-purple-100 text-purple-800 border-purple-200",
  solution: "bg-emerald-100 text-emerald-800 border-emerald-200",
  assumption: "bg-orange-100 text-orange-800 border-orange-200",
  metric: "bg-yellow-100 text-yellow-800 border-yellow-200",
  research: "bg-teal-100 text-teal-800 border-teal-200",
};

// Template field definitions with tooltips and examples
const TEMPLATE_GUIDANCE = {
  objective: {
    coreWhy: {
      tooltip: "What fundamental problem are we solving for users? What unmet need or significant opportunity are we addressing? Focus on user pain or gain...",
      placeholder: "Users can't easily track their spending across multiple accounts, leading to overspending and financial stress"
    },
    desiredOutcome: {
      tooltip: "What qualitative change do we aim to achieve for users? How will their experience be different and better?",
      placeholder: "Users will feel confident about their financial health and make informed spending decisions"
    },
    strategicContext: {
      tooltip: "Which broader company strategy does this support? How does it contribute to our long-term vision?",
      placeholder: "Supports Q2 strategic pillar: 'Empower financial literacy' and contributes to becoming the primary financial wellness platform"
    },
    targetAudience: {
      tooltip: "Which specific user segments or customer groups are we primarily focused on impacting?",
      placeholder: "Young professionals (25-35) with multiple income sources and basic financial literacy"
    },
    exclusionCriteria: {
      tooltip: "What specific problems, features, or initiatives are explicitly NOT covered by this objective? Helps maintain focus...",
      placeholder: "Does NOT include investment advice, business financial planning, or advanced tax optimization features"
    }
  },
  outcome: {
    who: {
      tooltip: "Which specific user segment, customer group, or persona are we focusing on? Be as precise as possible...",
      placeholder: "New users who signed up in the last 30 days and have connected at least one bank account"
    },
    doesWhat: {
      tooltip: "What specific, valuable action should the target audience perform? Describe the desired behavior change...",
      placeholder: "Complete their first budget setup within 7 days of account creation"
    },
    baseline: {
      tooltip: "What is the current measurable state? e.g., 'Currently, 10% of new users complete X action' or 'Average score is 3.5/5'",
      placeholder: "Currently, 12% of new users complete budget setup within 7 days"
    },
    target: {
      tooltip: "What specific target do we aim to reach? e.g., 'Increase to 25%' or 'Achieve average score of 4.2/5'",
      placeholder: "Increase to 35% completion rate within 7 days"
    },
    measurementMethod: {
      tooltip: "How will we measure this? Which tools/systems? e.g., 'Google Analytics event tracking' or 'Internal database query'",
      placeholder: "Mixpanel event tracking: 'budget_setup_completed' within 7 days of 'account_created'"
    },
    timeframe: {
      tooltip: "By when should we achieve this target? Should align with objective timeframe, typically a quarter...",
      placeholder: "End of Q2 2025 (June 30th)"
    }
  },
  opportunity: {
    customerProblem: {
      tooltip: "Describe the specific challenge or unmet need from the customer's perspective. What are they struggling with?",
      placeholder: "Users abandon budget setup because the process feels overwhelming and they don't understand why certain categories are suggested"
    },
    evidenceInsights: {
      tooltip: "What qualitative evidence confirms this problem? Quote customers directly, describe behaviors, reference research sessions...",
      placeholder: "User research (Jan 2025): 'I don't know where to start' mentioned by 8/10 participants. Heatmaps show 67% exit on category selection screen"
    },
    linkToKeyResult: {
      tooltip: "How does solving this problem directly contribute to moving the linked Key Result? Explain the causal connection...",
      placeholder: "Simplifying budget setup will increase completion rates, directly improving our Q2 KR: 'Increase new user activation by 23%'"
    },
    impactOnCustomer: {
      tooltip: "What negative consequence or frustration occurs if this isn't addressed? How does it hinder their progress?",
      placeholder: "Users never experience the core value of budgeting, leading to app abandonment and continued financial stress"
    },
    customerSegments: {
      tooltip: "Which specific customer groups are most impacted? e.g., 'New users in onboarding' or 'SMB segment customers'",
      placeholder: "First-time budgeters and users with irregular income patterns"
    },
    iceImpactRationale: {
      tooltip: "Why did you give this impact score? Consider potential effect on Key Result and customer impact...",
      placeholder: "High impact: Directly affects new user activation, our top Q2 priority"
    },
    iceConfidenceRationale: {
      tooltip: "Why this confidence level? Consider strength of evidence, problem clarity, and prior experience...",
      placeholder: "High confidence: Clear user research evidence and similar patterns from competitor analysis"
    },
    iceEaseRationale: {
      tooltip: "Why this ease score? Consider technical complexity, required research, team capacity, and dependencies...",
      placeholder: "Medium ease: Requires UX redesign and some backend changes, but no new integrations"
    }
  }
};

export function NodeEditSideDrawer({ node, isOpen, onClose, onSave, onDelete }: NodeEditSideDrawerProps) {
  const [formData, setFormData] = useState<NodeFormData>({
    type: 'objective',
    title: '',
    description: '',
    testCategory: 'viability',
    templateData: {}
  });
  const [isDirty, setIsDirty] = useState(false);
  const [isTemplateExpanded, setIsTemplateExpanded] = useState(true);
  const [isIceExpanded, setIsIceExpanded] = useState(true);

  // Initialize form data when node changes
  useEffect(() => {
    if (node) {
      setFormData({
        type: node.type,
        title: node.title,
        description: node.description,
        testCategory: node.testCategory || 'viability',
        templateData: (node as any).templateData || {}
      });
      setIsDirty(false);
    }
  }, [node]);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (isDirty && node) {
      const draftKey = `node-draft-${node.id}`;
      localStorage.setItem(draftKey, JSON.stringify(formData));
    }
  }, [formData, isDirty, node]);

  const handleFieldChange = useCallback((field: keyof NodeFormData | string, value: any) => {
    if (field.startsWith('template.')) {
      const templateField = field.replace('template.', '');
      setFormData(prev => ({
        ...prev,
        templateData: { ...prev.templateData, [templateField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    setIsDirty(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!node) return;

    const updatedNode: TreeNode = {
      ...node,
      type: formData.type,
      title: formData.title,
      description: formData.description,
      testCategory: formData.type === 'assumption' ? formData.testCategory : undefined,
      templateData: formData.templateData
    } as any;

    onSave(updatedNode);
    setIsDirty(false);
    
    if (node) {
      const draftKey = `node-draft-${node.id}`;
      localStorage.removeItem(draftKey);
    }
    
    onClose();
  }, [node, formData, onSave, onClose]);

  const handleCancel = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmed) return;
    }
    onClose();
  }, [isDirty, onClose]);

  const handleDelete = useCallback(() => {
    if (!node || !onDelete) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this node? This action cannot be undone.');
    if (confirmed) {
      onDelete(node.id);
      onClose();
    }
  }, [node, onDelete, onClose]);

  // Handle type changes with data preservation
  const handleTypeChange = useCallback((newType: NodeType) => {
    if (newType === formData.type) return;
    
    // Check if there's template data that would be lost
    const hasTemplateData = Object.keys(formData.templateData).some(key => formData.templateData[key as keyof TemplateData]);
    
    if (hasTemplateData) {
      const confirmed = window.confirm(
        'Changing the node type will clear template-specific data. Are you sure you want to continue?'
      );
      if (!confirmed) return;
    }
    
    setFormData(prev => ({
      ...prev,
      type: newType,
      templateData: {} // Clear template data when switching types
    }));
    setIsDirty(true);
  }, [formData.type, formData.templateData]);

  // Calculate ICE score
  const iceScore = useMemo(() => {
    const { iceImpact = 0, iceConfidence = 0, iceEase = 0 } = formData.templateData;
    return iceImpact * iceConfidence * iceEase;
  }, [formData.templateData.iceImpact, formData.templateData.iceConfidence, formData.templateData.iceEase]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            handleSave();
            break;
        }
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleSave, handleCancel]);

  const NodeIcon = NODE_TYPE_ICONS[formData.type];

  if (!node) return null;

  return (
    <div className={cn(
      "fixed inset-y-0 right-0 z-50 flex",
      isOpen ? "translate-x-0" : "translate-x-full"
    )}>
      {/* Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={cn(
        "relative bg-white shadow-2xl w-[600px] max-w-[90vw] transition-transform duration-300 ease-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              NODE_TYPE_COLORS[formData.type]
            )}>
              <NodeIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Edit Node</h2>
              <Badge variant="outline" className={cn("text-xs", NODE_TYPE_COLORS[formData.type])}>
                {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDirty && (
              <div className="w-2 h-2 bg-orange-500 rounded-full" title="Unsaved changes" />
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 h-[calc(100vh-140px)]">
          <div className="p-4 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                <Label className="text-sm font-medium">Basic Information</Label>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="node-type">Node Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={handleTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="objective">Objective</SelectItem>
                      <SelectItem value="outcome">Outcome</SelectItem>
                      <SelectItem value="opportunity">Opportunity</SelectItem>
                      <SelectItem value="solution">Solution</SelectItem>
                      <SelectItem value="assumption">Assumption Test</SelectItem>
                      <SelectItem value="metric">Metric</SelectItem>
                      <SelectItem value="research">Research</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="node-title">Title <span className="text-red-500">*</span></Label>
                  <Input
                    id="node-title"
                    value={formData.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    placeholder="Enter node title..."
                    required
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Template-Specific Content */}
            {(formData.type === 'objective' || formData.type === 'outcome' || formData.type === 'opportunity') && (
              <>
                <Collapsible open={isTemplateExpanded} onOpenChange={setIsTemplateExpanded}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                    {isTemplateExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <NodeIcon className="w-4 h-4" />
                    <Label className="text-sm font-medium cursor-pointer">
                      {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)} Template
                    </Label>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-4">
                    {formData.type === 'objective' && (
                      <ObjectiveTemplate 
                        data={formData.templateData}
                        onFieldChange={handleFieldChange}
                      />
                    )}
                    {formData.type === 'outcome' && (
                      <OutcomeTemplate 
                        data={formData.templateData}
                        onFieldChange={handleFieldChange}
                      />
                    )}
                    {formData.type === 'opportunity' && (
                      <OpportunityTemplate 
                        data={formData.templateData}
                        onFieldChange={handleFieldChange}
                      />
                    )}
                  </CollapsibleContent>
                </Collapsible>

                {/* ICE Scoring for Opportunities */}
                {formData.type === 'opportunity' && (
                  <>
                    <Separator />
                    <Collapsible open={isIceExpanded} onOpenChange={setIsIceExpanded}>
                      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                        {isIceExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <Calculator className="w-4 h-4" />
                        <Label className="text-sm font-medium cursor-pointer">ICE Prioritization Score</Label>
                        {iceScore > 0 && (
                          <Badge variant="secondary" className="ml-auto">
                            Score: {iceScore}
                          </Badge>
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-4">
                        <ICEScoringWidget 
                          data={formData.templateData}
                          onFieldChange={handleFieldChange}
                          calculatedScore={iceScore}
                        />
                      </CollapsibleContent>
                    </Collapsible>
                  </>
                )}
                <Separator />
              </>
            )}

            {/* Test Category for Assumptions */}
            {formData.type === 'assumption' && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <Label className="text-sm font-medium">Test Category</Label>
                  </div>
                  <RadioGroup
                    value={formData.testCategory}
                    onValueChange={(value: TestCategory) => handleFieldChange('testCategory', value)}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="viability" id="viability" />
                      <Label htmlFor="viability" className="cursor-pointer">Viability</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="value" id="value" />
                      <Label htmlFor="value" className="cursor-pointer">Value</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="feasibility" id="feasibility" />
                      <Label htmlFor="feasibility" className="cursor-pointer">Feasibility</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="usability" id="usability" />
                      <Label htmlFor="usability" className="cursor-pointer">Usability</Label>
                    </div>
                  </RadioGroup>
                </div>
                <Separator />
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="flex items-center gap-2">
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.title.trim()}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Template Components
function ObjectiveTemplate({ data, onFieldChange }: {
  data: TemplateData;
  onFieldChange: (field: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <TemplateField
        id="coreWhy"
        label='The "Why" (Core Problem/Opportunity)'
        value={data.coreWhy || ''}
        placeholder={TEMPLATE_GUIDANCE.objective.coreWhy.placeholder}
        tooltip={TEMPLATE_GUIDANCE.objective.coreWhy.tooltip}
        onChange={(value) => onFieldChange('template.coreWhy', value)}
        type="textarea"
        rows={3}
      />
      <TemplateField
        id="desiredOutcome"
        label='Desired Outcome (The "What")'
        value={data.desiredOutcome || ''}
        placeholder={TEMPLATE_GUIDANCE.objective.desiredOutcome.placeholder}
        tooltip={TEMPLATE_GUIDANCE.objective.desiredOutcome.tooltip}
        onChange={(value) => onFieldChange('template.desiredOutcome', value)}
        type="textarea"
        rows={3}
      />
      <TemplateField
        id="strategicContext"
        label="Strategic Context & Alignment"
        value={data.strategicContext || ''}
        placeholder={TEMPLATE_GUIDANCE.objective.strategicContext.placeholder}
        tooltip={TEMPLATE_GUIDANCE.objective.strategicContext.tooltip}
        onChange={(value) => onFieldChange('template.strategicContext', value)}
        type="textarea"
        rows={2}
      />
      <TemplateField
        id="targetAudience"
        label="Target Audience"
        value={data.targetAudience || ''}
        placeholder={TEMPLATE_GUIDANCE.objective.targetAudience.placeholder}
        tooltip={TEMPLATE_GUIDANCE.objective.targetAudience.tooltip}
        onChange={(value) => onFieldChange('template.targetAudience', value)}
        type="text"
      />
      <TemplateField
        id="exclusionCriteria"
        label="Exclusion Criteria / What This Objective Is NOT"
        value={data.exclusionCriteria || ''}
        placeholder={TEMPLATE_GUIDANCE.objective.exclusionCriteria.placeholder}
        tooltip={TEMPLATE_GUIDANCE.objective.exclusionCriteria.tooltip}
        onChange={(value) => onFieldChange('template.exclusionCriteria', value)}
        type="textarea"
        rows={2}
      />
    </div>
  );
}

function OutcomeTemplate({ data, onFieldChange }: {
  data: TemplateData;
  onFieldChange: (field: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <TemplateField
        id="who"
        label="Who? (The Target Audience)"
        value={data.who || ''}
        placeholder={TEMPLATE_GUIDANCE.outcome.who.placeholder}
        tooltip={TEMPLATE_GUIDANCE.outcome.who.tooltip}
        onChange={(value) => onFieldChange('template.who', value)}
        type="textarea"
        rows={2}
      />
      <TemplateField
        id="doesWhat"
        label="Does What? (The Desired Behavior)"
        value={data.doesWhat || ''}
        placeholder={TEMPLATE_GUIDANCE.outcome.doesWhat.placeholder}
        tooltip={TEMPLATE_GUIDANCE.outcome.doesWhat.tooltip}
        onChange={(value) => onFieldChange('template.doesWhat', value)}
        type="textarea"
        rows={2}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TemplateField
          id="baseline"
          label="Baseline (Current State)"
          value={data.baseline || ''}
          placeholder={TEMPLATE_GUIDANCE.outcome.baseline.placeholder}
          tooltip={TEMPLATE_GUIDANCE.outcome.baseline.tooltip}
          onChange={(value) => onFieldChange('template.baseline', value)}
          type="textarea"
          rows={2}
        />
        <TemplateField
          id="target"
          label="Target (Desired State)"
          value={data.target || ''}
          placeholder={TEMPLATE_GUIDANCE.outcome.target.placeholder}
          tooltip={TEMPLATE_GUIDANCE.outcome.target.tooltip}
          onChange={(value) => onFieldChange('template.target', value)}
          type="textarea"
          rows={2}
        />
      </div>
      <TemplateField
        id="measurementMethod"
        label="Measurement Method & Data Source"
        value={data.measurementMethod || ''}
        placeholder={TEMPLATE_GUIDANCE.outcome.measurementMethod.placeholder}
        tooltip={TEMPLATE_GUIDANCE.outcome.measurementMethod.tooltip}
        onChange={(value) => onFieldChange('template.measurementMethod', value)}
        type="textarea"
        rows={2}
      />
      <TemplateField
        id="timeframe"
        label="Timeframe"
        value={data.timeframe || ''}
        placeholder={TEMPLATE_GUIDANCE.outcome.timeframe.placeholder}
        tooltip={TEMPLATE_GUIDANCE.outcome.timeframe.tooltip}
        onChange={(value) => onFieldChange('template.timeframe', value)}
        type="text"
      />
    </div>
  );
}

function OpportunityTemplate({ data, onFieldChange }: {
  data: TemplateData;
  onFieldChange: (field: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <TemplateField
        id="customerProblem"
        label="The Customer's Problem/Need (The &quot;What&quot;)"
        value={data.customerProblem || ''}
        placeholder={TEMPLATE_GUIDANCE.opportunity.customerProblem.placeholder}
        tooltip={TEMPLATE_GUIDANCE.opportunity.customerProblem.tooltip}
        onChange={(value) => onFieldChange('template.customerProblem', value)}
        type="textarea"
        rows={3}
      />
      <TemplateField
        id="evidenceInsights"
        label="Evidence & Insights (Why We Believe This is Real)"
        value={data.evidenceInsights || ''}
        placeholder={TEMPLATE_GUIDANCE.opportunity.evidenceInsights.placeholder}
        tooltip={TEMPLATE_GUIDANCE.opportunity.evidenceInsights.tooltip}
        onChange={(value) => onFieldChange('template.evidenceInsights', value)}
        type="textarea"
        rows={3}
      />
      <TemplateField
        id="linkToKeyResult"
        label="Direct Link to Key Result (How It Moves the Needle)"
        value={data.linkToKeyResult || ''}
        placeholder={TEMPLATE_GUIDANCE.opportunity.linkToKeyResult.placeholder}
        tooltip={TEMPLATE_GUIDANCE.opportunity.linkToKeyResult.tooltip}
        onChange={(value) => onFieldChange('template.linkToKeyResult', value)}
        type="textarea"
        rows={2}
      />
      <TemplateField
        id="impactOnCustomer"
        label="Impact on the Customer (The 'So What?' for Them)"
        value={data.impactOnCustomer || ''}
        placeholder={TEMPLATE_GUIDANCE.opportunity.impactOnCustomer.placeholder}
        tooltip={TEMPLATE_GUIDANCE.opportunity.impactOnCustomer.tooltip}
        onChange={(value) => onFieldChange('template.impactOnCustomer', value)}
        type="textarea"
        rows={2}
      />
      <TemplateField
        id="customerSegments"
        label="Customer Segment(s) Primarily Affected"
        value={data.customerSegments || ''}
        placeholder={TEMPLATE_GUIDANCE.opportunity.customerSegments.placeholder}
        tooltip={TEMPLATE_GUIDANCE.opportunity.customerSegments.tooltip}
        onChange={(value) => onFieldChange('template.customerSegments', value)}
        type="text"
      />
    </div>
  );
}

function ICEScoringWidget({ data, onFieldChange, calculatedScore }: {
  data: TemplateData;
  onFieldChange: (field: string, value: any) => void;
  calculatedScore: number;
}) {
  const getScoreColor = (score: number) => {
    if (score < 2) return "text-red-600";
    if (score < 4) return "text-yellow-600";
    return "text-green-600";
  };

  const getScoreLabel = (score: number) => {
    if (score < 2) return "Low";
    if (score < 4) return "Medium";
    return "High";
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      {/* Header with Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4" />
          <span className="font-medium">ICE Score</span>
        </div>
        <div className="text-right">
          <div className={cn("text-xl font-bold", getScoreColor(calculatedScore))}>
            {calculatedScore}
          </div>
          <div className="text-xs text-gray-500">
            {getScoreLabel(calculatedScore)}
          </div>
        </div>
      </div>

      {/* Compact Scoring Grid */}
      <div className="grid grid-cols-1 gap-3">
        {/* Impact */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Impact</Label>
            <span className="text-sm text-gray-500">
              {data.iceImpact || 1}
            </span>
          </div>
          <Slider
            value={[data.iceImpact || 1]}
            onValueChange={([value]) => onFieldChange('template.iceImpact', value)}
            max={5}
            min={1}
            step={1}
            className="w-full"
          />
          <Textarea
            value={data.iceImpactRationale || ''}
            onChange={(e) => onFieldChange('template.iceImpactRationale', e.target.value)}
            placeholder={TEMPLATE_GUIDANCE.opportunity.iceImpactRationale.placeholder}
            rows={1}
            className="text-xs"
          />
        </div>

        {/* Confidence */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Confidence</Label>
            <span className="text-sm text-gray-500">
              {data.iceConfidence || 1}
            </span>
          </div>
          <Slider
            value={[data.iceConfidence || 1]}
            onValueChange={([value]) => onFieldChange('template.iceConfidence', value)}
            max={5}
            min={1}
            step={1}
            className="w-full"
          />
          <Textarea
            value={data.iceConfidenceRationale || ''}
            onChange={(e) => onFieldChange('template.iceConfidenceRationale', e.target.value)}
            placeholder={TEMPLATE_GUIDANCE.opportunity.iceConfidenceRationale.placeholder}
            rows={1}
            className="text-xs"
          />
        </div>

        {/* Ease */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Ease</Label>
            <span className="text-sm text-gray-500">
              {data.iceEase || 1}
            </span>
          </div>
          <Slider
            value={[data.iceEase || 1]}
            onValueChange={([value]) => onFieldChange('template.iceEase', value)}
            max={5}
            min={1}
            step={1}
            className="w-full"
          />
          <Textarea
            value={data.iceEaseRationale || ''}
            onChange={(e) => onFieldChange('template.iceEaseRationale', e.target.value)}
            placeholder={TEMPLATE_GUIDANCE.opportunity.iceEaseRationale.placeholder}
            rows={1}
            className="text-xs"
          />
        </div>
      </div>

      <div className="pt-2 border-t text-xs text-gray-600">
        <strong>Calculation:</strong> {data.iceImpact || 1} × {data.iceConfidence || 1} × {data.iceEase || 1} = <strong>{calculatedScore}</strong>
      </div>
    </div>
  );
}

function TemplateField({ 
  id, 
  label, 
  value, 
  placeholder, 
  tooltip,
  onChange, 
  type = 'text',
  rows = 1
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  tooltip?: string;
  onChange: (value: string) => void;
  type?: 'text' | 'textarea';
  rows?: number;
}) {
  return (
    <TooltipProvider>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={id} className="text-sm font-medium">
            {label}
          </Label>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-3 h-3 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {type === 'textarea' ? (
          <Textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="text-sm"
          />
        ) : (
          <Input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="text-sm"
          />
        )}
      </div>
    </TooltipProvider>
  );
}
