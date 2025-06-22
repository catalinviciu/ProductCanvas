import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { type TreeNode, type NodeType, type TestCategory } from "@shared/schema";

interface NodeEditModalProps {
  node: TreeNode | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (node: TreeNode) => void;
}

export function NodeEditModal({ node, isOpen, onClose, onSave }: NodeEditModalProps) {
  const [formData, setFormData] = useState({
    type: 'outcome' as NodeType,
    title: '',
    description: '',
    testCategory: 'viability' as TestCategory,
  });

  useEffect(() => {
    if (node) {
      setFormData({
        type: node.type,
        title: node.title,
        description: node.description,
        testCategory: node.testCategory || 'viability',
      });
    }
  }, [node]);

  const handleSave = () => {
    if (!node) return;

    const updatedNode: TreeNode = {
      ...node,
      type: formData.type,
      title: formData.title,
      description: formData.description,
      testCategory: formData.type === 'assumption' ? formData.testCategory : undefined,
    };

    onSave(updatedNode);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!node) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Node</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="node-type">Node Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: NodeType) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outcome">Outcome</SelectItem>
                <SelectItem value="opportunity">Opportunity</SelectItem>
                <SelectItem value="solution">Solution</SelectItem>
                <SelectItem value="assumption">Assumption Test</SelectItem>
                <SelectItem value="kpi">KPI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="node-title">Title</Label>
            <Input
              id="node-title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter node title..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="node-description">Description</Label>
            <Textarea
              id="node-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter node description..."
              rows={3}
            />
          </div>

          {formData.type === 'assumption' && (
            <div className="space-y-3">
              <Label>Test Category</Label>
              <RadioGroup
                value={formData.testCategory}
                onValueChange={(value: TestCategory) => setFormData(prev => ({ ...prev, testCategory: value }))}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <RadioGroupItem value="viability" id="viability" />
                  <Label htmlFor="viability" className="cursor-pointer">Viability</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <RadioGroupItem value="value" id="value" />
                  <Label htmlFor="value" className="cursor-pointer">Value</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <RadioGroupItem value="feasibility" id="feasibility" />
                  <Label htmlFor="feasibility" className="cursor-pointer">Feasibility</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <RadioGroupItem value="usability" id="usability" />
                  <Label htmlFor="usability" className="cursor-pointer">Usability</Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
