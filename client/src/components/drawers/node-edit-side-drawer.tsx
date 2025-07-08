
import { useState, useEffect, useCallback, useMemo } from "react";
import { X, Save, Trash2, Type, Target, BarChart3, Lightbulb, ChevronDown, ChevronRight, Calculator, HelpCircle, Cog, FlaskConical, TrendingUp, Search } from "lucide-react";
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
  
  // Solution fields
  solutionRationale?: string;
  implementationApproach?: string;
  keyFeatures?: string;
  technicalRequirements?: string;
  userExperience?: string;
  dependencies?: string;
  
  // RICE scoring for Solutions
  riceReach?: number;
  riceImpact?: number;
  riceConfidence?: number;
  riceEffort?: number;
  riceReachRationale?: string;
  riceImpactRationale?: string;
  riceConfidenceRationale?: string;
  riceEffortRationale?: string;
  
  // Assumption Test fields
  assumptionType?: string;
  hypothesisStatement?: string;
  testMethod?: string;
  successCriteria?: string;
  riskLevel?: string;
  
  // Evidence-Impact scoring for Assumptions
  evidenceScore?: number;
  impactScore?: number;
  evidenceRationale?: string;
  impactRationale?: string;
  
  // Metric fields
  metricType?: string;
  metricDefinition?: string;
  calculationMethod?: string;
  dataSource?: string;
  reportingFrequency?: string;
  target?: string;
  
  // Research fields
  researchQuestions?: string;
  methodology?: string;
  participants?: string;
  timeline?: string;
  expectedOutcomes?: string;
  researchType?: string;
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
  solution: Cog,
  assumption: FlaskConical,
  metric: TrendingUp,
  research: Search,
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
  },
  solution: {
    solutionRationale: {
      tooltip: "Why is this the right solution? What makes it better than alternative approaches?",
      placeholder: "Guided budget setup wizard reduces cognitive load and provides contextual help, addressing the core usability issue"
    },
    implementationApproach: {
      tooltip: "How will this solution be built? What's the technical approach and methodology?",
      placeholder: "Progressive disclosure UI pattern with smart defaults, A/B test different flows, iterative user testing"
    },
    keyFeatures: {
      tooltip: "What are the core features and capabilities that make this solution effective?",
      placeholder: "Smart category suggestions, progress indicators, skip options, contextual help tooltips, mobile-first design"
    },
    technicalRequirements: {
      tooltip: "What technical infrastructure, tools, or systems are needed?",
      placeholder: "Frontend: New onboarding flow components, Backend: Category suggestion algorithm, Analytics: Flow tracking"
    },
    userExperience: {
      tooltip: "How will users interact with this solution? What's their journey?",
      placeholder: "Users see 3-step wizard, get personalized categories, can skip advanced options, receive confirmation"
    },
    dependencies: {
      tooltip: "What other work, teams, or systems does this solution depend on?",
      placeholder: "Depends on: Category data analysis (Analytics team), Design system updates (Design team), API changes (Backend team)"
    },
    riceReachRationale: {
      tooltip: "How many people will this solution impact? Consider user base size and frequency of use.",
      placeholder: "High reach: All new users go through budget setup (500+ monthly), affects core onboarding flow"
    },
    riceImpactRationale: {
      tooltip: "How much will this solution improve the target metric? Consider magnitude of change.",
      placeholder: "High impact: Expected 23% increase in completion rate based on similar UX improvements"
    },
    riceConfidenceRationale: {
      tooltip: "How confident are you in the reach and impact estimates? Consider evidence strength.",
      placeholder: "High confidence: Strong user research evidence, proven UX patterns, similar competitor implementations"
    },
    riceEffortRationale: {
      tooltip: "How much person-time will this solution require? Consider all team efforts.",
      placeholder: "Medium effort: 2 weeks design, 3 weeks development, 1 week testing (6 person-weeks total)"
    }
  },
  assumption: {
    assumptionType: {
      tooltip: "What type of assumption is this? e.g., Value, Feasibility, Viability, Usability",
      placeholder: "Usability - Users will understand and prefer guided setup over free-form configuration"
    },
    hypothesisStatement: {
      tooltip: "State your assumption as a testable hypothesis with clear conditions for success/failure.",
      placeholder: "If we provide guided budget setup with smart defaults, then new users will complete setup 50% faster with 40% higher satisfaction"
    },
    testMethod: {
      tooltip: "How will you test this assumption? What's your validation approach?",
      placeholder: "A/B test: 50% see current flow, 50% see guided wizard. Measure completion time, completion rate, and satisfaction survey"
    },
    successCriteria: {
      tooltip: "What specific results will prove this assumption true? Be measurable and specific.",
      placeholder: "Success: >20% faster completion, >15% higher completion rate, >0.5 point satisfaction increase (5-point scale)"
    },
    riskLevel: {
      tooltip: "How risky is it if this assumption is wrong? What's the impact of being incorrect?",
      placeholder: "Medium risk: Wrong direction could delay onboarding improvements by 1 sprint, low development cost to reverse"
    },
    evidenceRationale: {
      tooltip: "How strong is the evidence supporting this assumption? Consider research quality and quantity.",
      placeholder: "Strong evidence: User interviews, competitor analysis, UX research patterns support guided approach"
    },
    impactRationale: {
      tooltip: "How much will proving this assumption advance the objective? Consider strategic importance.",
      placeholder: "High impact: Directly addresses main onboarding barrier, enabling broader activation improvements"
    }
  },
  metric: {
    metricType: {
      tooltip: "What type of metric is this? e.g., Leading, Lagging, Vanity, Actionable, North Star",
      placeholder: "Leading metric - Budget setup completion rate (predicts user activation)"
    },
    metricDefinition: {
      tooltip: "Precisely define what this metric measures. Be specific about scope and boundaries.",
      placeholder: "Percentage of new users who complete budget setup within 7 days of account creation"
    },
    calculationMethod: {
      tooltip: "How is this metric calculated? What's the exact formula or methodology?",
      placeholder: "Formula: (Users who completed budget setup in 7 days / Total new users in period) × 100"
    },
    dataSource: {
      tooltip: "Where does the data come from? What systems, databases, or tools provide this information?",
      placeholder: "Primary: Mixpanel event tracking, Secondary: PostgreSQL user database, Validation: Google Analytics"
    },
    reportingFrequency: {
      tooltip: "How often will this metric be measured and reported? Consider business needs and data availability.",
      placeholder: "Daily monitoring, Weekly team reports, Monthly business reviews"
    },
    target: {
      tooltip: "What target value are you aiming for? Include timeframe and rationale.",
      placeholder: "Target: 35% completion rate by end of Q2 (up from current 12%)"
    }
  },
  research: {
    researchQuestions: {
      tooltip: "What specific questions will this research answer? Be clear and focused.",
      placeholder: "1. What specific steps in budget setup cause users to abandon? 2. What contextual help do users need most?"
    },
    methodology: {
      tooltip: "How will you conduct this research? What methods and techniques will you use?",
      placeholder: "Mixed methods: User interviews (n=8), usability testing (n=12), analytics analysis, competitor benchmarking"
    },
    participants: {
      tooltip: "Who will you study? Be specific about target audience and recruitment criteria.",
      placeholder: "New users (0-14 days), attempted but didn't complete budget setup, mix of demographics, varied financial experience"
    },
    timeline: {
      tooltip: "When will this research be conducted? Include key milestones and deliverables.",
      placeholder: "Week 1: Recruit and screen participants, Week 2: Interviews, Week 3: Analysis, Week 4: Report and recommendations"
    },
    expectedOutcomes: {
      tooltip: "What insights or decisions will this research enable? How will it inform strategy?",
      placeholder: "Identify top 3 friction points, design requirements for guided setup, prioritize next iteration features"
    },
    researchType: {
      tooltip: "What type of research is this? e.g., Generative, Evaluative, Quantitative, Qualitative",
      placeholder: "Evaluative research - Testing current onboarding flow to identify improvement opportunities"
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

  // Calculate RICE score
  const riceScore = useMemo(() => {
    const { riceReach = 0, riceImpact = 0, riceConfidence = 0, riceEffort = 1 } = formData.templateData;
    if (riceEffort === 0) return 0;
    return (riceReach * riceImpact * riceConfidence) / riceEffort;
  }, [formData.templateData.riceReach, formData.templateData.riceImpact, formData.templateData.riceConfidence, formData.templateData.riceEffort]);

  // Calculate Evidence-Impact score
  const evidenceImpactScore = useMemo(() => {
    const { evidenceScore = 0, impactScore = 0 } = formData.templateData;
    return evidenceScore * impactScore;
  }, [formData.templateData.evidenceScore, formData.templateData.impactScore]);

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
            {(formData.type === 'objective' || formData.type === 'outcome' || formData.type === 'opportunity' || formData.type === 'solution' || formData.type === 'metric' || formData.type === 'research') && (
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
                    {formData.type === 'solution' && (
                      <SolutionTemplate 
                        data={formData.templateData}
                        onFieldChange={handleFieldChange}
                      />
                    )}
                    {formData.type === 'metric' && (
                      <MetricTemplate 
                        data={formData.templateData}
                        onFieldChange={handleFieldChange}
                      />
                    )}
                    {formData.type === 'research' && (
                      <ResearchTemplate 
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

                {/* RICE Scoring for Solutions */}
                {formData.type === 'solution' && (
                  <>
                    <Separator />
                    <Collapsible open={isIceExpanded} onOpenChange={setIsIceExpanded}>
                      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                        {isIceExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <Calculator className="w-4 h-4" />
                        <Label className="text-sm font-medium cursor-pointer">RICE Prioritization Score</Label>
                        {riceScore > 0 && (
                          <Badge variant="secondary" className="ml-auto">
                            Score: {riceScore.toFixed(1)}
                          </Badge>
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-4">
                        <RICEScoringWidget 
                          data={formData.templateData}
                          onFieldChange={handleFieldChange}
                          calculatedScore={riceScore}
                        />
                      </CollapsibleContent>
                    </Collapsible>
                  </>
                )}
                <Separator />
              </>
            )}

            {/* Assumption Test Template */}
            {formData.type === 'assumption' && (
              <>
                <Collapsible open={isTemplateExpanded} onOpenChange={setIsTemplateExpanded}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                    {isTemplateExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <NodeIcon className="w-4 h-4" />
                    <Label className="text-sm font-medium cursor-pointer">Assumption Test Template</Label>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-4">
                    <AssumptionTemplate 
                      data={formData.templateData}
                      onFieldChange={handleFieldChange}
                    />
                  </CollapsibleContent>
                </Collapsible>

                {/* Evidence-Impact Scoring for Assumptions */}
                <Separator />
                <Collapsible open={isIceExpanded} onOpenChange={setIsIceExpanded}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                    {isIceExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <Calculator className="w-4 h-4" />
                    <Label className="text-sm font-medium cursor-pointer">Evidence-Impact Prioritization</Label>
                    {evidenceImpactScore > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        Score: {evidenceImpactScore}
                      </Badge>
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <EvidenceImpactWidget 
                      data={formData.templateData}
                      onFieldChange={handleFieldChange}
                      calculatedScore={evidenceImpactScore}
                    />
                  </CollapsibleContent>
                </Collapsible>
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

// Solution Template Component
function SolutionTemplate({ data, onFieldChange }: {
  data: TemplateData;
  onFieldChange: (field: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <TemplateField
        id="solutionRationale"
        label="Solution Rationale (Why This Solution?)"
        value={data.solutionRationale || ''}
        placeholder={TEMPLATE_GUIDANCE.solution.solutionRationale.placeholder}
        tooltip={TEMPLATE_GUIDANCE.solution.solutionRationale.tooltip}
        onChange={(value) => onFieldChange('template.solutionRationale', value)}
        type="textarea"
        rows={3}
      />
      <TemplateField
        id="implementationApproach"
        label="Implementation Approach"
        value={data.implementationApproach || ''}
        placeholder={TEMPLATE_GUIDANCE.solution.implementationApproach.placeholder}
        tooltip={TEMPLATE_GUIDANCE.solution.implementationApproach.tooltip}
        onChange={(value) => onFieldChange('template.implementationApproach', value)}
        type="textarea"
        rows={3}
      />
      <TemplateField
        id="keyFeatures"
        label="Key Features & Capabilities"
        value={data.keyFeatures || ''}
        placeholder={TEMPLATE_GUIDANCE.solution.keyFeatures.placeholder}
        tooltip={TEMPLATE_GUIDANCE.solution.keyFeatures.tooltip}
        onChange={(value) => onFieldChange('template.keyFeatures', value)}
        type="textarea"
        rows={3}
      />
      <TemplateField
        id="technicalRequirements"
        label="Technical Requirements"
        value={data.technicalRequirements || ''}
        placeholder={TEMPLATE_GUIDANCE.solution.technicalRequirements.placeholder}
        tooltip={TEMPLATE_GUIDANCE.solution.technicalRequirements.tooltip}
        onChange={(value) => onFieldChange('template.technicalRequirements', value)}
        type="textarea"
        rows={2}
      />
      <TemplateField
        id="userExperience"
        label="User Experience Design"
        value={data.userExperience || ''}
        placeholder={TEMPLATE_GUIDANCE.solution.userExperience.placeholder}
        tooltip={TEMPLATE_GUIDANCE.solution.userExperience.tooltip}
        onChange={(value) => onFieldChange('template.userExperience', value)}
        type="textarea"
        rows={2}
      />
      <TemplateField
        id="dependencies"
        label="Dependencies & Constraints"
        value={data.dependencies || ''}
        placeholder={TEMPLATE_GUIDANCE.solution.dependencies.placeholder}
        tooltip={TEMPLATE_GUIDANCE.solution.dependencies.tooltip}
        onChange={(value) => onFieldChange('template.dependencies', value)}
        type="textarea"
        rows={2}
      />
    </div>
  );
}

// Assumption Test Template Component
function AssumptionTemplate({ data, onFieldChange }: {
  data: TemplateData;
  onFieldChange: (field: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <TemplateField
        id="assumptionType"
        label="Assumption Type"
        value={data.assumptionType || ''}
        placeholder={TEMPLATE_GUIDANCE.assumption.assumptionType.placeholder}
        tooltip={TEMPLATE_GUIDANCE.assumption.assumptionType.tooltip}
        onChange={(value) => onFieldChange('template.assumptionType', value)}
        type="text"
      />
      <TemplateField
        id="hypothesisStatement"
        label="Hypothesis Statement"
        value={data.hypothesisStatement || ''}
        placeholder={TEMPLATE_GUIDANCE.assumption.hypothesisStatement.placeholder}
        tooltip={TEMPLATE_GUIDANCE.assumption.hypothesisStatement.tooltip}
        onChange={(value) => onFieldChange('template.hypothesisStatement', value)}
        type="textarea"
        rows={3}
      />
      <TemplateField
        id="testMethod"
        label="Test Method & Approach"
        value={data.testMethod || ''}
        placeholder={TEMPLATE_GUIDANCE.assumption.testMethod.placeholder}
        tooltip={TEMPLATE_GUIDANCE.assumption.testMethod.tooltip}
        onChange={(value) => onFieldChange('template.testMethod', value)}
        type="textarea"
        rows={3}
      />
      <TemplateField
        id="successCriteria"
        label="Success Criteria"
        value={data.successCriteria || ''}
        placeholder={TEMPLATE_GUIDANCE.assumption.successCriteria.placeholder}
        tooltip={TEMPLATE_GUIDANCE.assumption.successCriteria.tooltip}
        onChange={(value) => onFieldChange('template.successCriteria', value)}
        type="textarea"
        rows={2}
      />
      <TemplateField
        id="riskLevel"
        label="Risk Level & Impact"
        value={data.riskLevel || ''}
        placeholder={TEMPLATE_GUIDANCE.assumption.riskLevel.placeholder}
        tooltip={TEMPLATE_GUIDANCE.assumption.riskLevel.tooltip}
        onChange={(value) => onFieldChange('template.riskLevel', value)}
        type="textarea"
        rows={2}
      />
    </div>
  );
}

// Metric Template Component
function MetricTemplate({ data, onFieldChange }: {
  data: TemplateData;
  onFieldChange: (field: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <TemplateField
        id="metricType"
        label="Metric Type"
        value={data.metricType || ''}
        placeholder={TEMPLATE_GUIDANCE.metric.metricType.placeholder}
        tooltip={TEMPLATE_GUIDANCE.metric.metricType.tooltip}
        onChange={(value) => onFieldChange('template.metricType', value)}
        type="text"
      />
      <TemplateField
        id="metricDefinition"
        label="Metric Definition"
        value={data.metricDefinition || ''}
        placeholder={TEMPLATE_GUIDANCE.metric.metricDefinition.placeholder}
        tooltip={TEMPLATE_GUIDANCE.metric.metricDefinition.tooltip}
        onChange={(value) => onFieldChange('template.metricDefinition', value)}
        type="textarea"
        rows={3}
      />
      <TemplateField
        id="calculationMethod"
        label="Calculation Method"
        value={data.calculationMethod || ''}
        placeholder={TEMPLATE_GUIDANCE.metric.calculationMethod.placeholder}
        tooltip={TEMPLATE_GUIDANCE.metric.calculationMethod.tooltip}
        onChange={(value) => onFieldChange('template.calculationMethod', value)}
        type="textarea"
        rows={2}
      />
      <TemplateField
        id="dataSource"
        label="Data Source & Tools"
        value={data.dataSource || ''}
        placeholder={TEMPLATE_GUIDANCE.metric.dataSource.placeholder}
        tooltip={TEMPLATE_GUIDANCE.metric.dataSource.tooltip}
        onChange={(value) => onFieldChange('template.dataSource', value)}
        type="textarea"
        rows={2}
      />
      <TemplateField
        id="reportingFrequency"
        label="Reporting Frequency"
        value={data.reportingFrequency || ''}
        placeholder={TEMPLATE_GUIDANCE.metric.reportingFrequency.placeholder}
        tooltip={TEMPLATE_GUIDANCE.metric.reportingFrequency.tooltip}
        onChange={(value) => onFieldChange('template.reportingFrequency', value)}
        type="text"
      />
      <TemplateField
        id="target"
        label="Target Value & Timeframe"
        value={data.target || ''}
        placeholder={TEMPLATE_GUIDANCE.metric.target.placeholder}
        tooltip={TEMPLATE_GUIDANCE.metric.target.tooltip}
        onChange={(value) => onFieldChange('template.target', value)}
        type="text"
      />
    </div>
  );
}

// Research Template Component
function ResearchTemplate({ data, onFieldChange }: {
  data: TemplateData;
  onFieldChange: (field: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <TemplateField
        id="researchType"
        label="Research Type"
        value={data.researchType || ''}
        placeholder={TEMPLATE_GUIDANCE.research.researchType.placeholder}
        tooltip={TEMPLATE_GUIDANCE.research.researchType.tooltip}
        onChange={(value) => onFieldChange('template.researchType', value)}
        type="text"
      />
      <TemplateField
        id="researchQuestions"
        label="Research Questions"
        value={data.researchQuestions || ''}
        placeholder={TEMPLATE_GUIDANCE.research.researchQuestions.placeholder}
        tooltip={TEMPLATE_GUIDANCE.research.researchQuestions.tooltip}
        onChange={(value) => onFieldChange('template.researchQuestions', value)}
        type="textarea"
        rows={3}
      />
      <TemplateField
        id="methodology"
        label="Methodology & Approach"
        value={data.methodology || ''}
        placeholder={TEMPLATE_GUIDANCE.research.methodology.placeholder}
        tooltip={TEMPLATE_GUIDANCE.research.methodology.tooltip}
        onChange={(value) => onFieldChange('template.methodology', value)}
        type="textarea"
        rows={3}
      />
      <TemplateField
        id="participants"
        label="Participants & Recruitment"
        value={data.participants || ''}
        placeholder={TEMPLATE_GUIDANCE.research.participants.placeholder}
        tooltip={TEMPLATE_GUIDANCE.research.participants.tooltip}
        onChange={(value) => onFieldChange('template.participants', value)}
        type="textarea"
        rows={2}
      />
      <TemplateField
        id="timeline"
        label="Timeline & Milestones"
        value={data.timeline || ''}
        placeholder={TEMPLATE_GUIDANCE.research.timeline.placeholder}
        tooltip={TEMPLATE_GUIDANCE.research.timeline.tooltip}
        onChange={(value) => onFieldChange('template.timeline', value)}
        type="textarea"
        rows={2}
      />
      <TemplateField
        id="expectedOutcomes"
        label="Expected Outcomes & Deliverables"
        value={data.expectedOutcomes || ''}
        placeholder={TEMPLATE_GUIDANCE.research.expectedOutcomes.placeholder}
        tooltip={TEMPLATE_GUIDANCE.research.expectedOutcomes.tooltip}
        onChange={(value) => onFieldChange('template.expectedOutcomes', value)}
        type="textarea"
        rows={3}
      />
    </div>
  );
}

// RICE Scoring Widget Component
function RICEScoringWidget({ data, onFieldChange, calculatedScore }: {
  data: TemplateData;
  onFieldChange: (field: string, value: any) => void;
  calculatedScore: number;
}) {
  const getScoreColor = (score: number) => {
    if (score < 10) return "text-red-600";
    if (score < 50) return "text-yellow-600";
    return "text-green-600";
  };

  const getScoreLabel = (score: number) => {
    if (score < 10) return "Low";
    if (score < 50) return "Medium";
    return "High";
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      {/* Header with Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4" />
          <span className="font-medium">RICE Score</span>
        </div>
        <div className="text-right">
          <div className={cn("text-xl font-bold", getScoreColor(calculatedScore))}>
            {calculatedScore.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">
            {getScoreLabel(calculatedScore)}
          </div>
        </div>
      </div>

      {/* Scoring Grid */}
      <div className="grid grid-cols-1 gap-3">
        {/* Reach */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Reach</Label>
            <span className="text-sm text-gray-500">
              {data.riceReach || 0}
            </span>
          </div>
          <Slider
            value={[data.riceReach || 0]}
            onValueChange={([value]) => onFieldChange('template.riceReach', value)}
            max={100}
            min={0}
            step={1}
            className="w-full"
          />
          <Textarea
            value={data.riceReachRationale || ''}
            onChange={(e) => onFieldChange('template.riceReachRationale', e.target.value)}
            placeholder={TEMPLATE_GUIDANCE.solution.riceReachRationale.placeholder}
            rows={1}
            className="text-xs"
          />
        </div>

        {/* Impact */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Impact</Label>
            <span className="text-sm text-gray-500">
              {data.riceImpact || 0}
            </span>
          </div>
          <Slider
            value={[data.riceImpact || 0]}
            onValueChange={([value]) => onFieldChange('template.riceImpact', value)}
            max={5}
            min={0}
            step={1}
            className="w-full"
          />
          <Textarea
            value={data.riceImpactRationale || ''}
            onChange={(e) => onFieldChange('template.riceImpactRationale', e.target.value)}
            placeholder={TEMPLATE_GUIDANCE.solution.riceImpactRationale.placeholder}
            rows={1}
            className="text-xs"
          />
        </div>

        {/* Confidence */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Confidence</Label>
            <span className="text-sm text-gray-500">
              {data.riceConfidence || 0}%
            </span>
          </div>
          <Slider
            value={[data.riceConfidence || 0]}
            onValueChange={([value]) => onFieldChange('template.riceConfidence', value)}
            max={100}
            min={0}
            step={1}
            className="w-full"
          />
          <Textarea
            value={data.riceConfidenceRationale || ''}
            onChange={(e) => onFieldChange('template.riceConfidenceRationale', e.target.value)}
            placeholder={TEMPLATE_GUIDANCE.solution.riceConfidenceRationale.placeholder}
            rows={1}
            className="text-xs"
          />
        </div>

        {/* Effort */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Effort (Person-Weeks)</Label>
            <span className="text-sm text-gray-500">
              {data.riceEffort || 1}
            </span>
          </div>
          <Slider
            value={[data.riceEffort || 1]}
            onValueChange={([value]) => onFieldChange('template.riceEffort', value)}
            max={50}
            min={1}
            step={1}
            className="w-full"
          />
          <Textarea
            value={data.riceEffortRationale || ''}
            onChange={(e) => onFieldChange('template.riceEffortRationale', e.target.value)}
            placeholder={TEMPLATE_GUIDANCE.solution.riceEffortRationale.placeholder}
            rows={1}
            className="text-xs"
          />
        </div>
      </div>

      <div className="pt-2 border-t text-xs text-gray-600">
        <strong>Formula:</strong> ({data.riceReach || 0} × {data.riceImpact || 0} × {data.riceConfidence || 0}%) ÷ {data.riceEffort || 1} = <strong>{calculatedScore.toFixed(1)}</strong>
      </div>
    </div>
  );
}

// Evidence-Impact Widget Component
function EvidenceImpactWidget({ data, onFieldChange, calculatedScore }: {
  data: TemplateData;
  onFieldChange: (field: string, value: any) => void;
  calculatedScore: number;
}) {
  const getScoreColor = (score: number) => {
    if (score < 6) return "text-red-600";
    if (score < 15) return "text-yellow-600";
    return "text-green-600";
  };

  const getScoreLabel = (score: number) => {
    if (score < 6) return "Low";
    if (score < 15) return "Medium";
    return "High";
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      {/* Header with Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4" />
          <span className="font-medium">Evidence-Impact Score</span>
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

      {/* Scoring Grid */}
      <div className="grid grid-cols-1 gap-3">
        {/* Evidence */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Evidence Strength</Label>
            <span className="text-sm text-gray-500">
              {data.evidenceScore || 1}
            </span>
          </div>
          <Slider
            value={[data.evidenceScore || 1]}
            onValueChange={([value]) => onFieldChange('template.evidenceScore', value)}
            max={5}
            min={1}
            step={1}
            className="w-full"
          />
          <Textarea
            value={data.evidenceRationale || ''}
            onChange={(e) => onFieldChange('template.evidenceRationale', e.target.value)}
            placeholder={TEMPLATE_GUIDANCE.assumption.evidenceRationale.placeholder}
            rows={1}
            className="text-xs"
          />
        </div>

        {/* Impact */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Impact on Objective</Label>
            <span className="text-sm text-gray-500">
              {data.impactScore || 1}
            </span>
          </div>
          <Slider
            value={[data.impactScore || 1]}
            onValueChange={([value]) => onFieldChange('template.impactScore', value)}
            max={5}
            min={1}
            step={1}
            className="w-full"
          />
          <Textarea
            value={data.impactRationale || ''}
            onChange={(e) => onFieldChange('template.impactRationale', e.target.value)}
            placeholder={TEMPLATE_GUIDANCE.assumption.impactRationale.placeholder}
            rows={1}
            className="text-xs"
          />
        </div>
      </div>

      <div className="pt-2 border-t text-xs text-gray-600">
        <strong>Calculation:</strong> {data.evidenceScore || 1} × {data.impactScore || 1} = <strong>{calculatedScore}</strong>
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
