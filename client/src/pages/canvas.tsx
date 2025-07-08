import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { ImpactTreeCanvas } from "@/components/canvas/impact-tree-canvas";
import { NodeEditSideDrawer } from "@/components/drawers/node-edit-side-drawer";
import { ContextMenu } from "@/components/modals/context-menu";
import { CreateFirstNodeModal } from "@/components/modals/create-first-node-modal";
import { CanvasHeader } from "@/components/canvas-header";
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
  const queryClient = useQueryClient();
  const hasCreatedTree = useRef(false);
  
  // Handle new tree creation or existing tree ID
  const treeId = id === "new" ? null : id ? parseInt(id) : 1;

  // Mutation to create new tree
  const createTreeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/impact-trees', {
        name: "New Impact Tree",
        description: "Strategic planning canvas",
        nodes: [],
        connections: [],
        canvasState: { zoom: 1, pan: { x: 0, y: 0 }, orientation: 'vertical' }
      });
    },
    onSuccess: (newTree) => {
      queryClient.invalidateQueries({ queryKey: ['/api/impact-trees'] });
      queryClient.setQueryData(['/api/impact-trees', newTree.id], newTree);
      // Redirect to the new tree's URL
      setLocation(`/canvas/${newTree.id}`);
    },
  });

  const { data: impactTree, isLoading, error } = useQuery<ImpactTree>({
    queryKey: treeId ? ["/api/impact-trees", treeId] : ["/api/impact-trees", "new"],
    enabled: !!isAuthenticated && !authLoading && treeId !== null,
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
  } = useCanvas(impactTree);

  // Create tree immediately when accessing /canvas/new
  useEffect(() => {
    if (id === "new" && isAuthenticated && !authLoading && !hasCreatedTree.current) {
      hasCreatedTree.current = true;
      createTreeMutation.mutate();
    }
  }, [id, isAuthenticated, authLoading, createTreeMutation]);

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

  // Show loading state when creating new tree
  if (id === "new" && createTreeMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-900 dark:text-white">Creating new impact tree...</p>
        </div>
      </div>
    );
  }

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

  if (isLoading || authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading impact tree...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirect handled in useEffect
  }

  const isNewTree = id === "new";

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
    </div>
  );
}
