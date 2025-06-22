import { useState, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type ImpactTree, type TreeNode, type NodeConnection, type CanvasState, type NodeType, type TestCategory } from "@shared/schema";
import { generateNodeId, createNode, createConnection } from "@/lib/canvas-utils";

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
  });

  // Initialize state from impactTree
  useEffect(() => {
    if (impactTree) {
      setNodes((impactTree.nodes as TreeNode[]) || []);
      setConnections((impactTree.connections as NodeConnection[]) || []);
      
      // Ensure canvasState has proper defaults
      const canvasStateData = impactTree.canvasState as any;
      setCanvasState({
        zoom: canvasStateData?.zoom || 1,
        pan: canvasStateData?.pan || { x: 0, y: 0 },
      });
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
    
    // Calculate position - use custom position if provided, otherwise use parent/default logic
    const position = customPosition || (parentNode 
      ? { x: parentNode.position.x + 300, y: parentNode.position.y + 100 }
      : { x: 200, y: 200 });

    const newNode = createNode(nodeId, type, position, testCategory, parentNode?.id);
    const updatedNodes = [...nodes, newNode];
    
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
    const updatedNodes = nodes.map(node => 
      node.id === updatedNode.id ? updatedNode : node
    );
    
    setNodes(updatedNodes);
    saveTree(updatedNodes);
  }, [nodes, saveTree]);

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
    closeContextMenu,
    closeEditModal,
    openEditModal,
  };
}
