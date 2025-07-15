import { TreeNodeRecord } from '@shared/schema';

export class ScoreCalculationService {
  /**
   * Calculate ICE score for Opportunity nodes
   * Formula: (Impact x Confidence x Ease) 
   */
  calculateICEScore(templateData: any): number | null {
    const { iceImpact, iceConfidence, iceEase } = templateData;
    
    // Only calculate if all required fields are present and valid
    if (!this.isValidScore(iceImpact) || !this.isValidScore(iceConfidence) || !this.isValidScore(iceEase)) {
      return null;
    }
    
    return Math.round((iceImpact * iceConfidence * iceEase) * 10) / 10;
  }

  /**
   * Calculate RICE score for Solution nodes
   * Formula: (Reach × Impact × Confidence) / Effort
   */
  calculateRICEScore(templateData: any): number | null {
    const { riceReach, riceImpact, riceConfidence, riceEffort } = templateData;
    
    // Only calculate if all required fields are present and valid
    if (!this.isValidScore(riceReach) || !this.isValidScore(riceImpact) || 
        !this.isValidScore(riceConfidence) || !this.isValidScore(riceEffort)) {
      return null;
    }
    
    // Prevent division by zero
    if (riceEffort === 0) {
      return null;
    }
    
    return Math.round((riceReach * riceImpact * riceConfidence) / riceEffort * 10) / 10;
  }

  /**
   * Calculate and update scores for a node
   */
  updateNodeScores(node: TreeNodeRecord): any {
    const updatedTemplateData = { ...node.templateData };
    
    // Calculate ICE score for Opportunity nodes
    if (node.nodeType === 'opportunity') {
      const iceScore = this.calculateICEScore(updatedTemplateData);
      if (iceScore !== null) {
        updatedTemplateData.iceScore = iceScore;
      } else {
        delete updatedTemplateData.iceScore;
      }
    }
    
    // Calculate RICE score for Solution nodes
    if (node.nodeType === 'solution') {
      const riceScore = this.calculateRICEScore(updatedTemplateData);
      if (riceScore !== null) {
        updatedTemplateData.riceScore = riceScore;
      } else {
        delete updatedTemplateData.riceScore;
      }
    }
    
    return updatedTemplateData;
  }

  /**
   * Validate score value
   */
  private isValidScore(value: any): boolean {
    return typeof value === 'number' && value >= 0 && value <= 10;
  }
}

export const scoreCalculationService = new ScoreCalculationService();