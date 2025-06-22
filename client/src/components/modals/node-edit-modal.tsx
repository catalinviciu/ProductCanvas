import { useState, useEffect, memo, useCallback } from "react";
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

export const NodeEditModal = memo(function NodeEditModal({ node, isOpen, onClose, onSave }: NodeEditModalProps) {
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

  // Memoized handlers for better performance
  const handleSave = useCallback(() => {
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
  }, [node, formData, onSave, onClose]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!node) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <i className="fas fa-edit text-blue-600"></i>
            <span>Edit Node</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-6">
          <div className="space-y-3">
            <Label htmlFor="node-type" className="text-sm font-semibold text-gray-700">Node Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: NodeType) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-400 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outcome" className="flex items-center space-x-2 p-3">
                  <i className="fas fa-bullseye text-indigo-600 mr-2"></i>
                  Outcome
                </SelectItem>
                <SelectItem value="opportunity" className="flex items-center space-x-2 p-3">
                  <i className="fas fa-lightbulb text-purple-600 mr-2"></i>
                  Opportunity
                </SelectItem>
                <SelectItem value="solution" className="flex items-center space-x-2 p-3">
                  <i className="fas fa-cog text-emerald-600 mr-2"></i>
                  Solution
                </SelectItem>
                <SelectItem value="assumption" className="flex items-center space-x-2 p-3">
                  <i className="fas fa-flask text-orange-600 mr-2"></i>
                  Assumption Test
                </SelectItem>
                <SelectItem value="kpi" className="flex items-center space-x-2 p-3">
                  <i className="fas fa-chart-line text-red-600 mr-2"></i>
                  KPI
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="node-title" className="text-sm font-semibold text-gray-700">Title</Label>
            <Input
              id="node-title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter a clear, descriptive title..."
              className="h-12 border-2 border-gray-200 focus:border-blue-400 transition-colors text-lg"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="node-description" className="text-sm font-semibold text-gray-700">Description</Label>
            <Textarea
              id="node-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide additional details and context..."
              rows={4}
              className="border-2 border-gray-200 focus:border-blue-400 transition-colors resize-none"
            />
          </div>

          {formData.type === 'assumption' && (
            <div className="space-y-4 p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200">
              <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                <i className="fas fa-flask text-orange-600"></i>
                <span>Test Category</span>
              </Label>
              <RadioGroup
                value={formData.testCategory}
                onValueChange={(value: TestCategory) => setFormData(prev => ({ ...prev, testCategory: value }))}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                <div className="flex items-start space-x-3 p-4 border-2 border-blue-200 rounded-xl cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all">
                  <RadioGroupItem value="viability" id="viability" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="viability" className="cursor-pointer font-medium text-blue-900 flex items-center space-x-2">
                      <i className="fas fa-seedling text-blue-600"></i>
                      <span>Viability</span>
                    </Label>
                    <p className="text-sm text-blue-700 mt-1">Business model validation</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 border-2 border-emerald-200 rounded-xl cursor-pointer hover:bg-emerald-50 hover:border-emerald-300 transition-all">
                  <RadioGroupItem value="value" id="value" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="value" className="cursor-pointer font-medium text-emerald-900 flex items-center space-x-2">
                      <i className="fas fa-gem text-emerald-600"></i>
                      <span>Value</span>
                    </Label>
                    <p className="text-sm text-emerald-700 mt-1">User value proposition</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 border-2 border-purple-200 rounded-xl cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-all">
                  <RadioGroupItem value="feasibility" id="feasibility" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="feasibility" className="cursor-pointer font-medium text-purple-900 flex items-center space-x-2">
                      <i className="fas fa-wrench text-purple-600"></i>
                      <span>Feasibility</span>
                    </Label>
                    <p className="text-sm text-purple-700 mt-1">Technical implementation</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 border-2 border-pink-200 rounded-xl cursor-pointer hover:bg-pink-50 hover:border-pink-300 transition-all">
                  <RadioGroupItem value="usability" id="usability" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="usability" className="cursor-pointer font-medium text-pink-900 flex items-center space-x-2">
                      <i className="fas fa-user-check text-pink-600"></i>
                      <span>Usability</span>
                    </Label>
                    <p className="text-sm text-pink-700 mt-1">User experience validation</p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="px-6 py-2 border-2 border-gray-300 hover:border-gray-400 transition-colors"
          >
            <i className="fas fa-times mr-2"></i>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <i className="fas fa-save mr-2"></i>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
