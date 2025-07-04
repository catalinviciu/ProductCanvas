import { type NodeType } from "@shared/schema";

/**
 * Placeholder texts for node title inputs that provide clear examples
 * of what users should enter for each node type in impact trees.
 */
export const NODE_PLACEHOLDER_TEXTS: Record<NodeType, string> = {
  objective: "e.g., Increase monthly revenue by 20%",
  outcome: "e.g., Higher customer satisfaction scores",
  opportunity: "e.g., Expand to mobile app market",
  solution: "e.g., Build automated email system",
  assumption: "e.g., Users will pay $10/month for premium",
  metric: "e.g., Weekly active users",
  research: "e.g., Survey 100 existing customers",
};

/**
 * Get the placeholder text for a specific node type
 */
export function getNodePlaceholder(nodeType: NodeType): string {
  return NODE_PLACEHOLDER_TEXTS[nodeType];
}