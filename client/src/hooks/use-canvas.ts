import { useState, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type ImpactTree, type TreeNode, type NodeConnection, type CanvasState, type NodeType, type TestCategory } from "@shared/schema";
import { generateNodeId, createNode, createConnection, getHomePosition, calculateNodeLayout, snapToGrid, preventOverlap, getSmartNodePosition, moveNodeWithChildren, toggleNodeCollapse, toggleChildVisibility, handleBranchDrag, reorganizeSubtree, fitNodesToScreen, autoLayoutAfterDrop } from "@/lib/canvas-utils";
import { useEnhancedTreePersistence } from "./use-enhanced-tree-persistence";

interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  node: TreeNode | null;
  menuType: 'full' | 'addChild' | 'nodeActions';
}

interface EditDrawerState {
  isOpen: boolean;
}

interface CreateFirstNodeModalState {
  isOpen: boolean;
}

export function useCanvas(impactTree: ImpactTree | undefined) {
  const queryClient = useQueryClient();
  const enhancedPersistence = useEnhancedTreePersistence(impactTree?.id || 0);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    node: null,
    menuType: 'full',
  });
  const [editDrawer, setEditDrawer] = useState<EditDrawerState>({ isOpen: false });
  const [createFirstNodeModal, setCreateFirstNodeModal] = useState<CreateFirstNodeModalState>({ isOpen: false });

  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [connections, setConnections] = useState<NodeConnection[]>([]);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1,
    pan: { x: 0, y: 0 },
    orientation: 'vertical',
  });

  // Initialize state from impactTree
  useEffect(() => {
    if (impactTree) {
      const treeNodes = (impactTree.nodes as TreeNode[]) || [];
      setNodes(treeNodes);
      setConnections((impactTree.connections as NodeConnection[]) || []);
      
      // Show create first node modal if canvas is empty
      setCreateFirstNodeModal({ isOpen: treeNodes.length === 0 });
      
      // Use saved canvas state if available, otherwise use home position
      const canvasStateData = impactTree.canvasState as any;
      if (canvasStateData?.zoom && canvasStateData?.pan) {
        setCanvasState({
          zoom: canvasStateData.zoom,
          pan: canvasStateData.pan,
          orientation: canvasStateData.orientation || 'vertical',
        });
      } else {
        // Apply home positioning based on nodes
        const homePosition = getHomePosition(treeNodes, 'vertical');
        setCanvasState(homePosition);
      }
    }
  }, [impactTree]);

  // Add event listener for add child context menu
  useEffect(() => {
    const handleAddChildContextMenuEvent = (event: CustomEvent) => {
      const { x, y, node } = event.detail;
      setContextMenu({
        isOpen: true,
        position: { x, y },
        node,
        menuType: 'addChild',
      });
    };

    document.addEventListener('addChildContextMenu', handleAddChildContextMenuEvent as EventListener);
    
    return () => {
      document.removeEventListener('addChildContextMenu', handleAddChildContextMenuEvent as EventListener);
    };
  }, []);

  const updateTreeMutation = useMutation({
    mutationFn: async (updates: { nodes: TreeNode[]; connections: NodeConnection[]; canvasState: CanvasState }) => {
      if (!impactTree?.id) throw new Error('No impact tree loaded');
      return apiRequest('PUT', `/api/impact-trees/${impactTree.id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/impact-trees'] });
    },
  });

  const saveTree = useCallback((updatedNodes?: TreeNode[], updatedConnections?: NodeConnection[], updatedCanvasState?: CanvasState, activityType?: string) => {
    const finalNodes = updatedNodes || nodes;
    const finalConnections = updatedConnections || connections;
    const finalCanvasState = updatedCanvasState || canvasState;

    // Only save if we have an existing tree with an ID
    if (impactTree && impactTree.id) {
      enhancedPersistence.saveTreeWithTracking(
        finalNodes,
        finalConnections,
        finalCanvasState,
        activityType
      );
    }
    // For new trees (when impactTree is null), we need to create the tree first
    // but this should be handled at the page level, not here
  }, [nodes, connections, canvasState, enhancedPersistence, impactTree]);

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
    saveTree(updatedNodes, updatedConnections, undefined, 'node_created');
  }, [nodes, connections, canvasState.orientation, saveTree]);

  const handleContextMenu = useCallback((node: TreeNode, position: { x: number; y: number }) => {
    setContextMenu({
      isOpen: true,
      position,
      node,
      menuType: 'nodeActions',
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, node: null, menuType: 'full' });
  }, []);

  const handleAddChildFromContext = useCallback((type: NodeType, testCategory?: TestCategory) => {
    if (contextMenu.node) {
      handleNodeCreate(type, testCategory, contextMenu.node);
    }
    setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, node: null, menuType: 'full' });
  }, [contextMenu.node, handleNodeCreate]);

  const handleNodeUpdate = useCallback((updatedNode: TreeNode) => {
    // Check if this is just a position update (dragging) vs other changes
    const existingNode = nodes.find(n => n.id === updatedNode.id);
    const isPositionOnlyUpdate = existingNode && 
      existingNode.title === updatedNode.title &&
      existingNode.description === updatedNode.description &&
      existingNode.type === updatedNode.type;

    if (isPositionOnlyUpdate) {
      // For position-only updates (dragging), use branch drag system but don't auto-reorganize
      const updatedNodes = handleBranchDrag(nodes, updatedNode.id, updatedNode.position, canvasState.orientation);
      setNodes(updatedNodes);
      saveTree(updatedNodes);
    } else {
      // For other updates (title, description, etc.), apply changes normally
      const updatedNodes = nodes.map(node => 
        node.id === updatedNode.id ? updatedNode : node
      );
      setNodes(updatedNodes);
      saveTree(updatedNodes);
    }
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

    // Auto-reorganize entire tree after reattachment for better alignment
    const reorganizedNodes = autoLayoutAfterDrop(updatedNodes, canvasState.orientation);
    
    setNodes(reorganizedNodes);
    setConnections(updatedConnections);
    saveTree(reorganizedNodes, updatedConnections);
    
    // Force clear all drag-related states after reattachment
    setTimeout(() => {
      // Clear any browser-level drag states by forcing focus away from dragged elements
      const draggedElements = document.querySelectorAll('[draggable="true"]');
      draggedElements.forEach(element => {
        if (element === document.activeElement) {
          (element as HTMLElement).blur();
        }
      });
      
      // Ensure node selection is cleared to prevent sticky selection
      setSelectedNode(null);
    }, 100);
  }, [nodes, connections, saveTree, setSelectedNode]);

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

  const closeEditDrawer = useCallback(() => {
    setEditDrawer({ isOpen: false });
  }, []);

  const openEditDrawer = useCallback((node: TreeNode) => {
    setSelectedNode(node);
    setEditDrawer({ isOpen: true });
  }, []);

  const resetToHome = useCallback(() => {
    const homePosition = getHomePosition(nodes, canvasState.orientation);
    setCanvasState(homePosition);
    saveTree(undefined, undefined, homePosition);
  }, [nodes, canvasState.orientation, saveTree]);

  const fitToScreen = useCallback(() => {
    // Get canvas dimensions - use typical viewport dimensions if not available
    const canvasWidth = window.innerWidth - 320; // Account for sidebar
    const canvasHeight = window.innerHeight - 80; // Account for header
    
    const fitPosition = fitNodesToScreen(nodes, canvasWidth, canvasHeight, canvasState.orientation);
    setCanvasState(fitPosition);
    saveTree(undefined, undefined, fitPosition);
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
    
    // Update canvas state with new orientation and fit to screen
    const canvasWidth = window.innerWidth - 320; // Account for sidebar
    const canvasHeight = window.innerHeight - 80; // Account for header
    const fitPosition = fitNodesToScreen(layoutedNodes, canvasWidth, canvasHeight, newOrientation);
    setCanvasState(fitPosition);
    saveTree(layoutedNodes, undefined, fitPosition);
  }, [nodes, canvasState.orientation, saveTree]);

  const handleToggleCollapse = useCallback((nodeId: string) => {
    const updatedNodes = toggleNodeCollapse(nodes, nodeId);
    setNodes(updatedNodes);
    saveTree(updatedNodes);
  }, [nodes, saveTree]);

  const handleToggleChildVisibility = useCallback((parentId: string, childId: string) => {
    const updatedNodes = toggleChildVisibility(nodes, parentId, childId);
    setNodes(updatedNodes);
    saveTree(updatedNodes);
  }, [nodes, saveTree]);

  const closeCreateFirstNodeModal = useCallback(() => {
    setCreateFirstNodeModal({ isOpen: false });
  }, []);

  const handleCreateFirstNode = useCallback((type: NodeType, testCategory?: TestCategory) => {
    handleNodeCreate(type, testCategory);
    closeCreateFirstNodeModal();
  }, [handleNodeCreate]);

  return {
    selectedNode,
    contextMenu,
    editDrawer,
    createFirstNodeModal,
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
    handleToggleChildVisibility,
    handleAutoLayout,
    handleOrientationToggle,
    closeContextMenu,
    closeEditDrawer,
    openEditDrawer,
    resetToHome,
    fitToScreen,
    closeCreateFirstNodeModal,
    handleCreateFirstNode,
  };
}
