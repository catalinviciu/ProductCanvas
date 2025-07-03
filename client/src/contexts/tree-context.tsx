import { createContext, useContext, useMemo } from "react";
import { type TreeNode as TreeNodeType } from "@shared/schema";

interface TreeContextValue {
  // Node lookup functions for efficient access
  getNodeById: (id: string) => TreeNodeType | undefined;
  getParentNode: (nodeId: string) => TreeNodeType | undefined;
  getChildNodes: (nodeId: string) => TreeNodeType[];
  getAllNodes: () => TreeNodeType[];
}

const TreeContext = createContext<TreeContextValue | undefined>(undefined);

interface TreeProviderProps {
  children: React.ReactNode;
  nodes: TreeNodeType[];
}

export function TreeProvider({ children, nodes }: TreeProviderProps) {
  // Create efficient lookup maps and functions
  const contextValue = useMemo(() => {
    // Create a Map for O(1) node lookups instead of O(n) array searches
    const nodeMap = new Map<string, TreeNodeType>();
    const parentMap = new Map<string, string>(); // child -> parent mapping
    const childrenMap = new Map<string, TreeNodeType[]>(); // parent -> children mapping
    
    // Build lookup maps
    nodes.forEach(node => {
      nodeMap.set(node.id, node);
      
      if (node.parentId) {
        parentMap.set(node.id, node.parentId);
      }
      
      // Build children mapping
      node.children.forEach(childId => {
        const children = childrenMap.get(node.id) || [];
        const childNode = nodes.find(n => n.id === childId);
        if (childNode) {
          children.push(childNode);
          childrenMap.set(node.id, children);
        }
      });
    });

    return {
      getNodeById: (id: string) => nodeMap.get(id),
      getParentNode: (nodeId: string) => {
        const parentId = parentMap.get(nodeId);
        return parentId ? nodeMap.get(parentId) : undefined;
      },
      getChildNodes: (nodeId: string) => childrenMap.get(nodeId) || [],
      getAllNodes: () => nodes, // Keep this for cases where full array is still needed
    };
  }, [nodes]);

  return (
    <TreeContext.Provider value={contextValue}>
      {children}
    </TreeContext.Provider>
  );
}

export function useTreeContext() {
  const context = useContext(TreeContext);
  if (context === undefined) {
    throw new Error('useTreeContext must be used within a TreeProvider');
  }
  return context;
}

// Hook for safe optional access (doesn't throw if context is missing)
export function useTreeContextOptional() {
  return useContext(TreeContext);
}