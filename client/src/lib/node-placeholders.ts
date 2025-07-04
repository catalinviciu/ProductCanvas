import { type NodeType } from "@shared/schema";

/**
 * Placeholder texts for node title inputs that provide clear examples
 * of what users should enter for each node type in impact trees.
 */
export const NODE_PLACEHOLDER_TEXTS: Record<NodeType, string> = {
  objective:
    "e.g., Become the go-to platform for freelancers managing their finances.",
  outcome:
    "e.g., Increase the percentage of newly registered freelancers who connect their bank account from 40% to 60% by the end of Q3.",
  opportunity:
    "e.g., Customers are worried about the security of connecting their bank accounts.",
  solution: "e.g., Add security logos to the page.",
  assumption:
    "e.g., Lack of trust in our security is the primary reason users don't connect their bank accounts.",
  metric: "e.g., Weekly active users",
  research:
    "e.g., Interview 5 users who dropped off at the bank connection step.",
};

/**
 * Get the placeholder text for a specific node type
 */
export function getNodePlaceholder(nodeType: NodeType): string {
  return NODE_PLACEHOLDER_TEXTS[nodeType];
}
