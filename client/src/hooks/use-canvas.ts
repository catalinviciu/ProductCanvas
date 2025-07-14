import { useState, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type ImpactTree, type TreeNode, type NodeConnection, type CanvasState, type NodeType, type TestCategory } from "@shared/schema";
import { generateNodeId, createNode, createConnection, getHomePosition, calculateNodeLayout, snapToGrid, preventOverlap, getSmartNodePosition, moveNodeWithChildren, toggleNodeCollapse, toggleChildVisibility, handleBranchDrag, reorganizeSubtree, fitNodesToScreen, autoLayoutAfterDrop } from "@/lib/canvas-utils";
import { useEnhancedTreePersistence } from "./use-enhanced-tree-persistence";
import { useOptimisticUpdates } from "./use-optimistic-updates";
import { useSmoothDrag } from "./use-smooth-drag";

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
  const optimisticUpdates = useOptimisticUpdates({ 
    treeId: impactTree?.id || 0,
    debounceMs: 500,
    batchSize: 10
  });
  const smoothDrag = useSmoothDrag({
    treeId: impactTree?.id || 0,
    debounceMs: 300,
    batchSize: 10
  });
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
      // Convert nodeRecords to TreeNode format if available, otherwise use legacy nodes
      let treeNodes: TreeNode[] = [];
      
      if ((impactTree as any).nodeRecords) {
        // Convert database records to TreeNode format
        const nodeRecords = (impactTree as any).nodeRecords;
        treeNodes = nodeRecords.map((record: any) => ({
          id: record.id,
          type: record.nodeType,
          title: record.title,
          description: record.description || '',
          position: record.position,
          parentId: record.parentId,
          children: nodeRecords.filter((r: any) => r.parentId === record.id).map((r: any) => r.id),
          templateData: record.templateData || {},
          testCategory: record.metadata?.testCategory,
          isCollapsed: false,
          hiddenChildren: [],
        }));
        
        // Generate connections based on parent-child relationships
        const generatedConnections: NodeConnection[] = [];
        nodeRecords.forEach((record: any) => {
          if (record.parentId) {
            generatedConnections.push({
              id: `${record.parentId}-${record.id}`,
              fromNodeId: record.parentId,
              toNodeId: record.id,
            });
          }
        });
        
        setConnections(generatedConnections);
      } else {
        // Use legacy nodes structure for backward compatibility
        treeNodes = (impactTree.nodes as TreeNode[]) || [];
        setConnections((impactTree.connections as NodeConnection[]) || []);
      }
      
      setNodes(treeNodes);
      
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

  // Add drag event listeners for smooth drag system
  useEffect(() => {
    const handleDragStart = (event: CustomEvent) => {
      const { nodeId } = event.detail;
      smoothDrag.startDrag(nodeId);
    };

    const handleParentChildDragStart = (event: CustomEvent) => {
      const { parentId, childIds } = event.detail;
      
      // Get current positions of all nodes
      const nodePositions = new Map<string, { x: number; y: number }>();
      [parentId, ...childIds].forEach(nodeId => {
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          nodePositions.set(nodeId, { x: node.position.x, y: node.position.y });
        }
      });
      
      smoothDrag.startParentChildDrag(parentId, childIds, nodePositions);
    };

    const handleParentChildDragUpdate = (event: CustomEvent) => {
      const { parentId, newPosition, childIds } = event.detail;
      
      // Update parent position immediately with drag state
      smoothDrag.updateParentChildDrag(parentId, newPosition, (nodeId, position, isDragging = false) => {
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          const updatedNode = { ...node, position, isDragging };
          // Also set isDragging on all children to show visual feedback
          const updatedNodes = nodes.map(n => {
            if (n.id === nodeId) {
              return updatedNode;
            } else if (childIds.includes(n.id)) {
              return { ...n, isDragging: true };
            }
            return n;
          });
          setNodes(updatedNodes);
        }
      });
    };

    const handleDragEnd = (event: CustomEvent) => {
      const { nodeId } = event.detail;
      smoothDrag.endDrag();
    };

    const handleParentChildDragEnd = (event: CustomEvent) => {
      const { parentId, childIds } = event.detail;
      
      // Clear isDragging flag from parent and all children
      const parentNode = nodes.find(n => n.id === parentId);
      if (parentNode && parentNode.isDragging) {
        // Clear isDragging from all nodes involved in the drag
        const updatedNodes = nodes.map(n => {
          if (n.id === parentId || childIds.includes(n.id)) {
            return { ...n, isDragging: false };
          }
          return n;
        });
        
        // Use the same comprehensive autolayout as reattaching nodes
        // This ensures all nested levels are properly positioned
        console.log('Before autolayout - Parent position:', parentNode.position);
        const reorganizedNodes = autoLayoutAfterDrop(updatedNodes, canvasState.orientation);
        console.log('After autolayout - nodes repositioned:', reorganizedNodes.filter(n => [parentId, ...childIds].includes(n.id)).map(n => ({ id: n.id, position: n.position })));
        setNodes(reorganizedNodes);
        
        // Update all nodes that were repositioned through optimistic updates
        // This ensures the autolayout positions are persisted, not the old positions
        const nodesToUpdate = [parentId, ...childIds];
        nodesToUpdate.forEach(nodeId => {
          const node = reorganizedNodes.find(n => n.id === nodeId);
          if (node) {
            console.log(`Persisting position for ${nodeId}:`, node.position);
            optimisticUpdates.optimisticUpdate(nodeId, {
              position: node.position,
              metadata: { lastModified: new Date().toISOString() }
            });
          }
        });
      }
    };

    document.addEventListener('dragStart', handleDragStart as EventListener);
    document.addEventListener('parentChildDragStart', handleParentChildDragStart as EventListener);
    document.addEventListener('parentChildDragUpdate', handleParentChildDragUpdate as EventListener);
    document.addEventListener('dragEnd', handleDragEnd as EventListener);
    document.addEventListener('parentChildDragEnd', handleParentChildDragEnd as EventListener);
    
    return () => {
      document.removeEventListener('dragStart', handleDragStart as EventListener);
      document.removeEventListener('parentChildDragStart', handleParentChildDragStart as EventListener);
      document.removeEventListener('parentChildDragUpdate', handleParentChildDragUpdate as EventListener);
      document.removeEventListener('dragEnd', handleDragEnd as EventListener);
      document.removeEventListener('parentChildDragEnd', handleParentChildDragEnd as EventListener);
    };
  }, [smoothDrag, nodes, canvasState.orientation, optimisticUpdates]);

  const updateTreeMutation = useMutation({
    mutationFn: async (updates: { nodes: TreeNode[]; connections: NodeConnection[]; canvasState: CanvasState }) => {
      if (!impactTree?.id) throw new Error('No impact tree loaded');
      return apiRequest(`/api/impact-trees/${impactTree.id}`, { method: 'PUT', body: updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/impact-trees'] });
      queryClient.invalidateQueries({ queryKey: [`/api/impact-trees/${impactTree?.id}`] });
    },
  });

  const createNodeMutation = useMutation({
    mutationFn: async (nodeData: {
      id: string;
      type: string;
      title: string;
      description?: string;
      templateData?: any;
      position: { x: number; y: number };
      parentId?: string;
      metadata?: any;
    }) => {
      console.log('Creating node - Tree ID:', impactTree?.id, 'Node data:', nodeData);
      if (!impactTree?.id) {
        console.error('No impact tree loaded when trying to create node');
        throw new Error('No impact tree loaded');
      }
      return apiRequest(`/api/impact-trees/${impactTree.id}/nodes`, { method: 'POST', body: nodeData });
    },
    onSuccess: () => {
      console.log('Node created successfully');
      queryClient.invalidateQueries({ queryKey: [`/api/impact-trees/${impactTree?.id}`] });
    },
    onError: (error) => {
      console.error('Error creating node:', error);
    },
  });

  const updateNodeMutation = useMutation({
    mutationFn: async ({ nodeId, updates }: { nodeId: string; updates: any }) => {
      console.log('Updating node - Tree ID:', impactTree?.id, 'Node ID:', nodeId, 'Updates:', updates);
      if (!impactTree?.id) throw new Error('No impact tree loaded');
      return apiRequest(`/api/impact-trees/${impactTree.id}/nodes/${nodeId}`, { method: 'PUT', body: updates });
    },
    onSuccess: () => {
      console.log('Node updated successfully');
      queryClient.invalidateQueries({ queryKey: [`/api/impact-trees/${impactTree?.id}`] });
    },
    onError: (error) => {
      console.error('Error updating node:', error);
    },
  });

  const deleteNodeMutation = useMutation({
    mutationFn: async (nodeId: string) => {
      if (!impactTree?.id) throw new Error('No impact tree loaded');
      return apiRequest(`/api/impact-trees/${impactTree.id}/nodes/${nodeId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/impact-trees/${impactTree?.id}`] });
    },
  });

  const saveTree = useCallback((updatedNodes?: TreeNode[], updatedConnections?: NodeConnection[], updatedCanvasState?: CanvasState, activityType?: string) => {
    if (!impactTree?.id) return; // Don't save if no valid tree ID
    
    const finalNodes = updatedNodes || nodes;
    const finalConnections = updatedConnections || connections;
    const finalCanvasState = updatedCanvasState || canvasState;

    // Use enhanced persistence with activity tracking
    enhancedPersistence.saveTreeWithTracking(
      finalNodes,
      finalConnections,
      finalCanvasState,
      activityType
    );
  }, [nodes, connections, canvasState, enhancedPersistence, impactTree?.id]);

  const handleNodeCreate = useCallback((type: NodeType, testCategory?: TestCategory, parentNode?: TreeNode, customPosition?: { x: number; y: number }) => {
    if (!impactTree?.id) {
      console.error('Cannot create node: No impact tree loaded');
      return;
    }
    
    const nodeId = generateNodeId(type);
    
    // Use enhanced smart positioning with comprehensive collision detection
    const position = customPosition || getSmartNodePosition(nodes, parentNode, canvasState.orientation);
    const snappedPosition = snapToGrid(position);

    const newNode = createNode(nodeId, type, snappedPosition, testCategory, parentNode?.id);
    
    // Update local state immediately for responsive UI
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
    if (parentNode && parentNode.children && parentNode.children.length > 0) {
      updatedNodes = reorganizeSubtree(updatedNodes, parentNode.id, canvasState.orientation);
    }

    setNodes(updatedNodes);
    setConnections(updatedConnections);
    
    // Save node to database using the new API
    createNodeMutation.mutate({
      id: nodeId,
      type: type,
      title: newNode.title,
      description: newNode.description,
      templateData: newNode.templateData,
      position: snappedPosition,
      parentId: parentNode?.id,
      metadata: {
        testCategory: testCategory,
        createdAt: new Date().toISOString(),
      }
    });
  }, [nodes, connections, canvasState.orientation, createNodeMutation, impactTree?.id]);

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

    // Update local state immediately for responsive UI
    const updatedNodes = nodes.map(node => 
      node.id === updatedNode.id ? updatedNode : node
    );
    setNodes(updatedNodes);
    
    // Use different persistence strategies for drag vs other updates
    if (isPositionOnlyUpdate && smoothDrag.isNodeDragging(updatedNode.id)) {
      // For drag updates: use smooth drag system (delayed persistence)
      // Note: Parent-child drag updates are handled by the event system
      // Only handle individual node drag updates here
      smoothDrag.updateDragPosition(updatedNode.id, {
        title: updatedNode.title,
        description: updatedNode.description,
        templateData: updatedNode.templateData,
        position: updatedNode.position,
        parentId: updatedNode.parentId,
        metadata: {
          testCategory: updatedNode.testCategory,
          lastModified: new Date().toISOString(),
        }
      });
    } else {
      // For content updates: use optimistic updates (immediate persistence)
      optimisticUpdates.optimisticUpdate(updatedNode.id, {
        title: updatedNode.title,
        description: updatedNode.description,
        templateData: updatedNode.templateData,
        position: updatedNode.position,
        parentId: updatedNode.parentId,
        metadata: {
          testCategory: updatedNode.testCategory,
          lastModified: new Date().toISOString(),
        }
      });
    }
  }, [nodes, optimisticUpdates, smoothDrag]);

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

    // Update local state immediately for responsive UI
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
    
    // Delete node from database using the new API
    deleteNodeMutation.mutate(nodeId);
  }, [nodes, connections, deleteNodeMutation]);

  const handleNodeSelect = useCallback((node: TreeNode | null) => {
    setSelectedNode(node);
  }, []);

  const handleCanvasUpdate = useCallback((updates: Partial<CanvasState>) => {
    const updatedCanvasState = { ...canvasState, ...updates };
    setCanvasState(updatedCanvasState);
    saveTree(undefined, undefined, updatedCanvasState);
  }, [canvasState, saveTree]);

  // Flush pending updates when doing major operations
  const handleMajorOperation = useCallback(async (operation: () => void) => {
    // Flush any pending position updates before major changes
    await optimisticUpdates.flushPendingUpdates();
    operation();
  }, [optimisticUpdates]);

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

  // Cleanup function to flush pending updates when component unmounts
  useEffect(() => {
    return () => {
      smoothDrag.flushDragUpdates();
      optimisticUpdates.flushPendingUpdates();
    };
  }, [optimisticUpdates, smoothDrag]);

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
    // Combined updates status (prioritizing drag state during drag operations)
    pendingUpdatesCount: smoothDrag.isDragging ? 0 : optimisticUpdates.pendingUpdatesCount,
    isProcessingUpdates: smoothDrag.isDragging ? false : optimisticUpdates.isProcessing,
    flushPendingUpdates: smoothDrag.isDragging ? smoothDrag.flushDragUpdates : optimisticUpdates.flushPendingUpdates,
    // Drag state for UI feedback
    isDragging: smoothDrag.isDragging,
  };
}
