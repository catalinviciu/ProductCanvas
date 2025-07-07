import { useState, useEffect, useCallback, useMemo } from "react";
import { X, Save, Trash2, Type, FileText, Target, Lightbulb, Cog, TestTube, BarChart3, Search } from "lucide-react";
import MDEditor from '@uiw/react-md-editor';
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
import { cn } from "@/lib/utils";

interface NodeEditSideDrawerProps {
  node: TreeNode | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (node: TreeNode) => void;
  onDelete?: (nodeId: string) => void;
}

interface NodeFormData {
  type: NodeType;
  title: string;
  description: string;
  testCategory?: TestCategory;
  // Node-specific fields
  successMetrics?: string;
  timeline?: string;
  stakeholders?: string;
  marketSize?: string;
  userSegment?: string;
  validationCriteria?: string;
  priorityScore?: number;
  implementationApproach?: string;
  resourceRequirements?: string;
  dependencies?: string;
  technicalComplexity?: 'low' | 'medium' | 'high';
  hypothesis?: string;
  testMethodology?: string;
  successCriteria?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  researchQuestions?: string;
  methodology?: string;
  findings?: string;
}

const NODE_TYPE_ICONS = {
  objective: Target,
  outcome: BarChart3,
  opportunity: Lightbulb,
  solution: Cog,
  assumption: TestTube,
  metric: BarChart3,
  research: Search,
};

const NODE_TYPE_COLORS = {
  objective: "bg-purple-100 text-purple-800 border-purple-200",
  outcome: "bg-blue-100 text-blue-800 border-blue-200",
  opportunity: "bg-yellow-100 text-yellow-800 border-yellow-200",
  solution: "bg-green-100 text-green-800 border-green-200",
  assumption: "bg-red-100 text-red-800 border-red-200",
  metric: "bg-indigo-100 text-indigo-800 border-indigo-200",
  research: "bg-orange-100 text-orange-800 border-orange-200",
};

export function NodeEditSideDrawer({ node, isOpen, onClose, onSave, onDelete }: NodeEditSideDrawerProps) {
  const [formData, setFormData] = useState<NodeFormData>({
    type: 'objective',
    title: '',
    description: '',
    testCategory: 'viability',
  });
  const [isDirty, setIsDirty] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true);
  const [isNodeFieldsExpanded, setIsNodeFieldsExpanded] = useState(true);

  // Initialize form data when node changes
  useEffect(() => {
    if (node) {
      setFormData({
        type: node.type,
        title: node.title,
        description: node.description,
        testCategory: node.testCategory || 'viability',
        // Initialize node-specific fields (these would be stored in node.metadata in real implementation)
        successMetrics: '',
        timeline: '',
        stakeholders: '',
        marketSize: '',
        userSegment: '',
        validationCriteria: '',
        priorityScore: 5,
        implementationApproach: '',
        resourceRequirements: '',
        dependencies: '',
        technicalComplexity: 'medium',
        hypothesis: '',
        testMethodology: '',
        successCriteria: '',
        riskLevel: 'medium',
        researchQuestions: '',
        methodology: '',
        findings: '',
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

  const handleFieldChange = useCallback((field: keyof NodeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      // In a real implementation, node-specific fields would be stored in node.metadata
    };

    onSave(updatedNode);
    setIsDirty(false);
    
    // Clear draft from localStorage
    if (node) {
      const draftKey = `node-draft-${node.id}`;
      localStorage.removeItem(draftKey);
    }
    
    onClose();
  }, [node, formData, onSave, onClose]);

  const handleCancel = useCallback(() => {
    if (isDirty) {
      // In a real implementation, show confirmation dialog
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
        "relative bg-white shadow-2xl w-[500px] max-w-[90vw] transition-transform duration-300 ease-out",
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
                    onValueChange={(value: NodeType) => handleFieldChange('type', value)}
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
                  <Label htmlFor="node-title">Title</Label>
                  <Input
                    id="node-title"
                    value={formData.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    placeholder="Enter node title..."
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Description Section */}
            <Collapsible open={isDescriptionExpanded} onOpenChange={setIsDescriptionExpanded}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                <FileText className="w-4 h-4" />
                <Label className="text-sm font-medium cursor-pointer">Description</Label>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-4">
                <div className="border rounded-lg overflow-hidden">
                  <MDEditor
                    value={formData.description}
                    onChange={(value) => handleFieldChange('description', value || '')}
                    height={200}
                    preview="edit"
                    hideToolbar={false}
                    data-color-mode="light"
                  />
                </div>
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>Supports markdown formatting</span>
                  <span>{formData.description.length} characters</span>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Test Category for Assumptions */}
            {formData.type === 'assumption' && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TestTube className="w-4 h-4" />
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

            {/* Node-Specific Fields */}
            <NodeSpecificFields 
              nodeType={formData.type}
              formData={formData}
              onFieldChange={handleFieldChange}
              isExpanded={isNodeFieldsExpanded}
              onToggleExpanded={setIsNodeFieldsExpanded}
            />
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
            <Button onClick={handleSave} disabled={!isDirty}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Node-specific fields component
function NodeSpecificFields({
  nodeType,
  formData,
  onFieldChange,
  isExpanded,
  onToggleExpanded
}: {
  nodeType: NodeType;
  formData: NodeFormData;
  onFieldChange: (field: keyof NodeFormData, value: any) => void;
  isExpanded: boolean;
  onToggleExpanded: (expanded: boolean) => void;
}) {
  const NodeIcon = NODE_TYPE_ICONS[nodeType];

  const renderFields = () => {
    switch (nodeType) {
      case 'outcome':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="success-metrics">Success Metrics</Label>
              <Textarea
                id="success-metrics"
                value={formData.successMetrics || ''}
                onChange={(e) => onFieldChange('successMetrics', e.target.value)}
                placeholder="How will you measure success?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeline">Timeline</Label>
              <Input
                id="timeline"
                value={formData.timeline || ''}
                onChange={(e) => onFieldChange('timeline', e.target.value)}
                placeholder="When should this outcome be achieved?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stakeholders">Stakeholders</Label>
              <Input
                id="stakeholders"
                value={formData.stakeholders || ''}
                onChange={(e) => onFieldChange('stakeholders', e.target.value)}
                placeholder="Who is responsible for this outcome?"
              />
            </div>
          </div>
        );

      case 'opportunity':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="market-size">Market Size</Label>
              <Input
                id="market-size"
                value={formData.marketSize || ''}
                onChange={(e) => onFieldChange('marketSize', e.target.value)}
                placeholder="What's the size of this opportunity?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-segment">User Segment</Label>
              <Input
                id="user-segment"
                value={formData.userSegment || ''}
                onChange={(e) => onFieldChange('userSegment', e.target.value)}
                placeholder="Which users does this opportunity target?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validation-criteria">Validation Criteria</Label>
              <Textarea
                id="validation-criteria"
                value={formData.validationCriteria || ''}
                onChange={(e) => onFieldChange('validationCriteria', e.target.value)}
                placeholder="How will you validate this opportunity?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority-score">Priority Score (1-10)</Label>
              <Select
                value={formData.priorityScore?.toString() || '5'}
                onValueChange={(value) => onFieldChange('priorityScore', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                    <SelectItem key={score} value={score.toString()}>{score}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'solution':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="implementation-approach">Implementation Approach</Label>
              <Textarea
                id="implementation-approach"
                value={formData.implementationApproach || ''}
                onChange={(e) => onFieldChange('implementationApproach', e.target.value)}
                placeholder="How will this solution be implemented?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resource-requirements">Resource Requirements</Label>
              <Textarea
                id="resource-requirements"
                value={formData.resourceRequirements || ''}
                onChange={(e) => onFieldChange('resourceRequirements', e.target.value)}
                placeholder="What resources are needed?"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dependencies">Dependencies</Label>
              <Input
                id="dependencies"
                value={formData.dependencies || ''}
                onChange={(e) => onFieldChange('dependencies', e.target.value)}
                placeholder="What depends on this solution?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="technical-complexity">Technical Complexity</Label>
              <Select
                value={formData.technicalComplexity || 'medium'}
                onValueChange={(value: 'low' | 'medium' | 'high') => onFieldChange('technicalComplexity', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'assumption':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hypothesis">Hypothesis Statement</Label>
              <Textarea
                id="hypothesis"
                value={formData.hypothesis || ''}
                onChange={(e) => onFieldChange('hypothesis', e.target.value)}
                placeholder="What is your hypothesis?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="test-methodology">Test Methodology</Label>
              <Select
                value={formData.testMethodology || ''}
                onValueChange={(value) => onFieldChange('testMethodology', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select test method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="survey">Survey</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="prototype">Prototype</SelectItem>
                  <SelectItem value="ab-test">A/B Test</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="market-research">Market Research</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="success-criteria">Success Criteria</Label>
              <Textarea
                id="success-criteria"
                value={formData.successCriteria || ''}
                onChange={(e) => onFieldChange('successCriteria', e.target.value)}
                placeholder="What would validate this assumption?"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk-level">Risk Level</Label>
              <Select
                value={formData.riskLevel || 'medium'}
                onValueChange={(value: 'low' | 'medium' | 'high') => onFieldChange('riskLevel', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'research':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="research-questions">Research Questions</Label>
              <Textarea
                id="research-questions"
                value={formData.researchQuestions || ''}
                onChange={(e) => onFieldChange('researchQuestions', e.target.value)}
                placeholder="What questions need to be answered?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="methodology">Methodology</Label>
              <Textarea
                id="methodology"
                value={formData.methodology || ''}
                onChange={(e) => onFieldChange('methodology', e.target.value)}
                placeholder="How will you conduct this research?"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="findings">Findings</Label>
              <Textarea
                id="findings"
                value={formData.findings || ''}
                onChange={(e) => onFieldChange('findings', e.target.value)}
                placeholder="What have you discovered?"
                rows={3}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const fields = renderFields();
  if (!fields) return null;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
        <NodeIcon className="w-4 h-4" />
        <Label className="text-sm font-medium cursor-pointer">
          {nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} Details
        </Label>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 mt-4">
        {fields}
      </CollapsibleContent>
    </Collapsible>
  );
}