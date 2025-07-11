import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { ImpactTreeCanvas } from "@/components/canvas/impact-tree-canvas";
import { NodeEditSideDrawer } from "@/components/drawers/node-edit-side-drawer";
import { ContextMenu } from "@/components/modals/context-menu";
import { CreateFirstNodeModal } from "@/components/modals/create-first-node-modal";
import { CanvasHeader } from "@/components/canvas-header";
import { OptimisticUpdatesIndicator } from "@/components/canvas/optimistic-updates-indicator";
import { useCanvas } from "@/hooks/use-canvas";
import { useAuth } from "@/hooks/useAuth";
import { useNavAutoHide } from "@/hooks/use-nav-auto-hide";
import { type ImpactTree } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

export default function CanvasPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Handle new tree creation or existing tree ID
  const treeId = id === "new" ? null : id ? parseInt(id, 10) : null;
  const isNewTree = id === "new";
  
  // Debug logging to understand URL parsing
  console.log('URL params - id:', id, 'treeId:', treeId, 'isNewTree:', isNewTree);

  // Create new tree mutation
  const createTreeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/impact-trees', {
        name: 'New Impact Tree',
        description: 'A new strategic planning canvas',
        canvasState: {
          zoom: 1,
          pan: { x: 0, y: 0 },
          orientation: 'vertical'
        }
      });
      return response.json();
    },
    onSuccess: (newTree) => {
      console.log('New tree created:', newTree);
      toast({
        title: "Tree created",
        description: "Your new impact tree has been created successfully.",
      });
      // Redirect to the new tree
      setLocation(`/canvas/${newTree.id}`);
    },
    onError: (error) => {
      console.error('Error creating tree:', error);
      toast({
        title: "Creation failed",
        description: "Failed to create new tree. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create new tree automatically when accessing /canvas/new
  useEffect(() => {
    if (isNewTree && isAuthenticated && !authLoading && !createTreeMutation.isPending) {
      createTreeMutation.mutate();
    }
  }, [isNewTree, isAuthenticated, authLoading, createTreeMutation]);

  const { data: impactTree, isLoading, error } = useQuery<ImpactTree>({
    queryKey: treeId ? [`/api/impact-trees/${treeId}`] : ["/api/impact-trees/new"],
    enabled: !!isAuthenticated && !authLoading && !!treeId && !isNaN(treeId), // Only load if we have a valid tree ID
    retry: (failureCount, error) => {
      if (error && isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return false;
      }
      return failureCount < 3;
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { isNavVisible, magneticZoneRef } = useNavAutoHide();

  const {
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
    handleNodeDrag,
    handleSubtreeDrag,
    optimisticUpdates,
  } = useCanvas(impactTree);

  // Debug tree loading
  useEffect(() => {
    console.log('Canvas - Tree ID:', treeId, 'Impact Tree:', impactTree?.id, 'Loading:', isLoading);
  }, [treeId, impactTree, isLoading]);

  // Listen for custom reattach events from context menu
  useEffect(() => {
    const handleReattachEvent = (event: CustomEvent) => {
      const { nodeId, newParentId } = event.detail;
      handleNodeReattach(nodeId, newParentId);
    };

    window.addEventListener('reattach-node', handleReattachEvent as EventListener);
    return () => {
      window.removeEventListener('reattach-node', handleReattachEvent as EventListener);
    };
  }, [handleNodeReattach]);

  if (isLoading || authLoading || (treeId && !isNaN(treeId) && !impactTree)) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading impact tree...</div>
      </div>
    );
  }
  
  // Show error if tree ID is invalid
  if (treeId && isNaN(treeId)) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-red-600">Invalid tree ID</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirect handled in useEffect
  }

  return (
    <div className="h-screen bg-white dark:bg-gray-900 relative overflow-hidden">
      <CanvasHeader 
        impactTree={impactTree} 
        isNew={isNewTree} 
        isVisible={isNavVisible}
        magneticZoneRef={magneticZoneRef}
      />
      
      <main className={`relative canvas-background transition-all duration-500 ease-out ${
        isNavVisible ? 'h-full pt-14' : 'h-full'
      }`}>
        <ImpactTreeCanvas
          nodes={nodes}
          connections={connections}
          canvasState={canvasState}
          selectedNode={selectedNode}
          onNodeUpdate={handleNodeUpdate}
          onNodeSelect={handleNodeSelect}
          onNodeDelete={handleNodeDelete}
          onCanvasUpdate={handleCanvasUpdate}
          onContextMenu={handleContextMenu}
          onNodeCreate={handleNodeCreate}
          onNodeReattach={handleNodeReattach}
          onToggleCollapse={handleToggleCollapse}
          onToggleChildVisibility={handleToggleChildVisibility}
          onResetToHome={resetToHome}
          onFitToScreen={fitToScreen}
          onOrientationToggle={handleOrientationToggle}
          onNodeDrag={handleNodeDrag}
          onSubtreeDrag={handleSubtreeDrag}
          optimisticUpdates={optimisticUpdates}
        />
      </main>

      <NodeEditSideDrawer
        node={selectedNode}
        isOpen={editDrawer.isOpen}
        onClose={closeEditDrawer}
        onSave={handleNodeUpdate}
        onDelete={handleNodeDelete}
      />

      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        node={contextMenu.node}
        onClose={closeContextMenu}
        onEdit={openEditDrawer}
        onDelete={handleNodeDelete}
        onAddChild={handleAddChildFromContext}
        onToggleCollapse={handleToggleCollapse}
        menuType={contextMenu.menuType}
      />

      <CreateFirstNodeModal
        isOpen={createFirstNodeModal.isOpen}
        onClose={closeCreateFirstNodeModal}
        onNodeCreate={handleCreateFirstNode}
      />

      {/* Optimistic Updates Indicator is now inside the canvas */}
    </div>
  );
}
