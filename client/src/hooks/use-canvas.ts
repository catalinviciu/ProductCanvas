import { useState, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type ImpactTree, type TreeNode, type NodeConnection, type CanvasState, type NodeType, type TestCategory } from "@shared/schema";
import { generateNodeId, createNode, createConnection, getHomePosition, calculateNodeLayout, snapToGrid, preventOverlap, getSmartNodePosition, moveNodeWithChildren, toggleNodeCollapse, handleBranchDrag, reorganizeSubtree } from "@/lib/canvas-utils";

interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  node: TreeNode | null;
}

interface EditModalState {
  isOpen: boolean;
}

export function useCanvas(impactTree: ImpactTree | undefined) {
  const queryClient = useQueryClient();
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    node: null,
  });
  const [editModal, setEditModal] = useState<EditModalState>({ isOpen: false });

  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [connections, setConnections] = useState<NodeConnection[]>([]);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1,
    pan: { x: 0, y: 0 },
    orientation: 'horizontal',
  });

  // Initialize state from impactTree
  useEffect(() => {
    if (impactTree) {
      const treeNodes = (impactTree.nodes as TreeNode[]) || [];
      setNodes(treeNodes);
      setConnections((impactTree.connections as NodeConnection[]) || []);
      
      // Use saved canvas state if available, otherwise use home position
      const canvasStateData = impactTree.canvasState as any;
      if (canvasStateData?.zoom && canvasStateData?.pan) {
        setCanvasState({
          zoom: canvasStateData.zoom,
          pan: canvasStateData.pan,
          orientation: canvasStateData.orientation || 'horizontal',
        });
      } else {
        // Apply home positioning based on nodes
        const homePosition = getHomePosition(treeNodes, 'horizontal');
        setCanvasState(homePosition);
      }
    }
  }, [impactTree]);

  const updateTreeMutation = useMutation({
    mutationFn: async (updates: { nodes: TreeNode[]; connections: NodeConnection[]; canvasState: CanvasState }) => {
      if (!impactTree?.id) throw new Error('No impact tree loaded');
      return apiRequest('PUT', `/api/impact-trees/${impactTree.id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/impact-trees'] });
    },
  });

  const saveTree = useCallback((updatedNodes?: TreeNode[], updatedConnections?: NodeConnection[], updatedCanvasState?: CanvasState) => {
    if (!impactTree?.id) return; // Don't save if no valid tree ID
    
    const finalNodes = updatedNodes || nodes;
    const finalConnections = updatedConnections || connections;
    const finalCanvasState = updatedCanvasState || canvasState;

    updateTreeMutation.mutate({
      nodes: finalNodes,
      connections: finalConnections,
      canvasState: finalCanvasState,
    });
  }, [nodes, connections, canvasState, updateTreeMutation, impactTree?.id]);

  const handleNodeCreate = useCallback((type: NodeType, testCategory?: TestCategory, parentNode?: TreeNode, customPosition?: { x: number; y: number }) => {
    const nodeId = generateNodeId(type);
    
    // Use enhanced smart positioning with comprehensive collision detection
    const position = customPosition || getSmartNodePosition(nodes, parentNode, canvasState.orientation);
    const snappedPosition = snapToGrid(position);

    const newNode = createNode(nodeId, type, snappedPosition, testCategory, parentNode?.id);
    let updatedNodes = [...nodes, newNode];
    
    let updatedConnections = connections;
    
    // Create connection if there's a parent
    if (parentNode) {
      const connection = createConnection(parentNode.id, nodeId);
      updatedConnections = [...connections, connection];
      
      // Update parent's children array
      const updatedParent = { ...parentNode, children: [...parentNode.children, nodeId] };
      const nodeIndex = updatedNodes.findIndex(n => n.id === parentNode.id);
      if (nodeIndex !== -1) {
        updatedNodes[nodeIndex] = updatedParent;
      }
    }

    // After adding the new node, reorganize the parent's subtree if it has children
    // This ensures the new branch fits perfectly without overlaps
    if (parentNode && parentNode.children && parentNode.children.length > 0) {
      // Use the same reorganization system as drag operations
      updatedNodes = reorganizeSubtree(updatedNodes, parentNode.id, canvasState.orientation);
    }

    setNodes(updatedNodes);
    setConnections(updatedConnections);
    saveTree(updatedNodes, updatedConnections);
  }, [nodes, connections, saveTree]);

  const handleContextMenu = useCallback((node: TreeNode, position: { x: number; y: number }) => {
    setContextMenu({
      isOpen: true,
      position,
      node,
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, node: null });
  }, []);

  const handleAddChildFromContext = useCallback((type: NodeType, testCategory?: TestCategory) => {
    if (contextMenu.node) {
      handleNodeCreate(type, testCategory, contextMenu.node);
    }
    setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, node: null });
  }, [contextMenu.node, handleNodeCreate]);

  const handleNodeUpdate = useCallback((updatedNode: TreeNode) => {
    // Use comprehensive branch drag system that handles both single nodes and complex branches
    const updatedNodes = handleBranchDrag(nodes, updatedNode.id, updatedNode.position, canvasState.orientation);
    
    // Apply any other node updates (title, description, etc.) that aren't position-related
    const finalNodes = updatedNodes.map(node => 
      node.id === updatedNode.id ? { ...updatedNode, position: node.position } : node
    );
    
    setNodes(finalNodes);
    saveTree(finalNodes);
  }, [nodes, canvasState.orientation, saveTree]);

  const handleNodeReattach = useCallback((nodeId: string, newParentId: string | null) => {
    const nodeToReattach = nodes.find(n => n.id === nodeId);
    if (!nodeToReattach) return;

    // Prevent self-attachment and circular dependencies
    if (nodeId === newParentId) return;
    
    // Check for circular dependency (node can't be attached to its own descendant)
    const isDescendant = (parentId: string, checkId: string): boolean => {
      const parent = nodes.find(n => n.id === parentId);
      if (!parent) return false;
      if (parent.children.includes(checkId)) return true;
      return parent.children.some(childId => isDescendant(childId, checkId));
    };
    
    if (newParentId && isDescendant(nodeId, newParentId)) return;

    let updatedNodes = [...nodes];
    const updatedConnections = [...connections];

    // Remove from old parent
    if (nodeToReattach.parentId) {
      const oldParentIndex = updatedNodes.findIndex(n => n.id === nodeToReattach.parentId);
      if (oldParentIndex !== -1) {
        updatedNodes[oldParentIndex] = {
          ...updatedNodes[oldParentIndex],
          children: updatedNodes[oldParentIndex].children.filter(id => id !== nodeId)
        };
      }
      
      // Remove old connection
      const oldConnectionIndex = updatedConnections.findIndex(
        conn => conn.toNodeId === nodeId && conn.fromNodeId === nodeToReattach.parentId
      );
      if (oldConnectionIndex !== -1) {
        updatedConnections.splice(oldConnectionIndex, 1);
      }
    }

    // Update the node itself
    const nodeIndex = updatedNodes.findIndex(n => n.id === nodeId);
    if (nodeIndex !== -1) {
      updatedNodes[nodeIndex] = {
        ...updatedNodes[nodeIndex],
        parentId: newParentId || undefined
      };
    }

    // Add to new parent and get smart positioning
    if (newParentId) {
      const newParentIndex = updatedNodes.findIndex(n => n.id === newParentId);
      if (newParentIndex !== -1) {
        updatedNodes[newParentIndex] = {
          ...updatedNodes[newParentIndex],
          children: [...updatedNodes[newParentIndex].children, nodeId]
        };
      }
      
      // Create new connection
      const connection = createConnection(newParentId, nodeId);
      updatedConnections.push(connection);
      
      // Calculate smart position for the reattached branch
      const newParent = updatedNodes[newParentIndex];
      if (newParent) {
        const smartPosition = getSmartNodePosition(updatedNodes, newParent, canvasState.orientation);
        
        // Apply collision-free positioning for the entire branch being moved
        if (nodeToReattach.children && nodeToReattach.children.length > 0) {
          // This is a branch with children - use comprehensive collision detection
          updatedNodes = moveNodeWithChildren(updatedNodes, nodeId, smartPosition);
        } else {
          // Single node - use simple positioning
          const adjustedPosition = preventOverlap(updatedNodes, nodeToReattach, smartPosition);
          const snappedPosition = snapToGrid(adjustedPosition);
          
          const nodeToUpdateIndex = updatedNodes.findIndex(n => n.id === nodeId);
          if (nodeToUpdateIndex !== -1) {
            updatedNodes[nodeToUpdateIndex] = {
              ...updatedNodes[nodeToUpdateIndex],
              position: snappedPosition
            };
          }
        }
      }
    } else {
      // Moving to root level - find a good position among other root nodes
      const rootPosition = getSmartNodePosition(updatedNodes, undefined, canvasState.orientation);
      
      if (nodeToReattach.children && nodeToReattach.children.length > 0) {
        // Branch with children
        updatedNodes = moveNodeWithChildren(updatedNodes, nodeId, rootPosition);
      } else {
        // Single node
        const adjustedPosition = preventOverlap(updatedNodes, nodeToReattach, rootPosition);
        const snappedPosition = snapToGrid(adjustedPosition);
        
        const nodeToUpdateIndex = updatedNodes.findIndex(n => n.id === nodeId);
        if (nodeToUpdateIndex !== -1) {
          updatedNodes[nodeToUpdateIndex] = {
            ...updatedNodes[nodeToUpdateIndex],
            position: snappedPosition
          };
        }
      }
    }

    setNodes(updatedNodes);
    setConnections(updatedConnections);
    saveTree(updatedNodes, updatedConnections);
  }, [nodes, connections, saveTree]);

  const handleNodeDelete = useCallback((nodeId: string) => {
    const nodeToDelete = nodes.find(n => n.id === nodeId);
    if (!nodeToDelete) return;

    // Remove node and all its descendants
    const nodesToDelete = new Set<string>();
    const findDescendants = (id: string) => {
      nodesToDelete.add(id);
      const node = nodes.find(n => n.id === id);
      if (node) {
        node.children.forEach(childId => findDescendants(childId));
      }
    };
    findDescendants(nodeId);

    const updatedNodes = nodes.filter(node => !nodesToDelete.has(node.id));
    const updatedConnections = connections.filter(conn => 
      !nodesToDelete.has(conn.fromNodeId) && !nodesToDelete.has(conn.toNodeId)
    );

    // Update parent node's children array
    if (nodeToDelete.parentId) {
      const parentIndex = updatedNodes.findIndex(n => n.id === nodeToDelete.parentId);
      if (parentIndex !== -1) {
        updatedNodes[parentIndex] = {
          ...updatedNodes[parentIndex],
          children: updatedNodes[parentIndex].children.filter(id => id !== nodeId)
        };
      }
    }

    setNodes(updatedNodes);
    setConnections(updatedConnections);
    setSelectedNode(null);
    saveTree(updatedNodes, updatedConnections);
  }, [nodes, connections, saveTree]);

  const handleNodeSelect = useCallback((node: TreeNode | null) => {
    setSelectedNode(node);
  }, []);

  const handleCanvasUpdate = useCallback((updates: Partial<CanvasState>) => {
    const updatedCanvasState = { ...canvasState, ...updates };
    setCanvasState(updatedCanvasState);
    saveTree(undefined, undefined, updatedCanvasState);
  }, [canvasState, saveTree]);

  const closeEditModal = useCallback(() => {
    setEditModal({ isOpen: false });
  }, []);

  const openEditModal = useCallback((node: TreeNode) => {
    setSelectedNode(node);
    setEditModal({ isOpen: true });
  }, []);

  const resetToHome = useCallback(() => {
    const homePosition = getHomePosition(nodes, canvasState.orientation);
    setCanvasState(homePosition);
    saveTree(undefined, undefined, homePosition);
  }, [nodes, canvasState.orientation, saveTree]);

  const handleAutoLayout = useCallback(() => {
    const layoutedNodes = calculateNodeLayout(nodes, canvasState.orientation);
    setNodes(layoutedNodes);
    saveTree(layoutedNodes);
    
    // Also adjust view to fit the newly organized tree
    const homePosition = getHomePosition(layoutedNodes, canvasState.orientation);
    setCanvasState(homePosition);
    saveTree(layoutedNodes, undefined, homePosition);
  }, [nodes, canvasState.orientation, saveTree]);

  const handleOrientationToggle = useCallback(() => {
    const newOrientation = canvasState.orientation === 'horizontal' ? 'vertical' : 'horizontal';
    const layoutedNodes = calculateNodeLayout(nodes, newOrientation);
    setNodes(layoutedNodes);
    
    // Update canvas state with new orientation and home position
    const homePosition = getHomePosition(layoutedNodes, newOrientation);
    setCanvasState(homePosition);
    saveTree(layoutedNodes, undefined, homePosition);
  }, [nodes, canvasState.orientation, saveTree]);

  const handleToggleCollapse = useCallback((nodeId: string) => {
    const updatedNodes = toggleNodeCollapse(nodes, nodeId);
    setNodes(updatedNodes);
    saveTree(updatedNodes);
  }, [nodes, saveTree]);

  return {
    selectedNode,
    contextMenu,
    editModal,
    canvasState,
    nodes,
    connections,
    handleNodeCreate,
    handleNodeUpdate,
    handleNodeDelete,
    handleNodeSelect,
    handleCanvasUpdate,
    handleContextMenu,
    handleAddChildFromContext,
    handleNodeReattach,
    handleToggleCollapse,
    handleAutoLayout,
    handleOrientationToggle,
    closeContextMenu,
    closeEditModal,
    openEditModal,
    resetToHome,
  };
}
