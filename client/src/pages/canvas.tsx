import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ImpactTreeCanvas } from "@/components/canvas/impact-tree-canvas";
import { NodeEditSideDrawer } from "@/components/drawers/node-edit-side-drawer";
import { ContextMenu } from "@/components/modals/context-menu";
import { CreateFirstNodeModal } from "@/components/modals/create-first-node-modal";
import { CanvasHeader } from "@/components/canvas-header";
import { useCanvas } from "@/hooks/use-canvas";
import { useAuth } from "@/hooks/useAuth";
import { type ImpactTree } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function CanvasPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Handle new tree creation or existing tree ID
  const treeId = id === "new" ? null : id ? parseInt(id) : 1;

  const { data: impactTree, isLoading, error } = useQuery<ImpactTree>({
    queryKey: treeId ? ["/api/impact-trees", treeId] : ["/api/impact-trees", "new"],
    enabled: !!isAuthenticated && !authLoading,
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
    <div className="h-screen bg-white dark:bg-gray-900 relative overflow-hidden flex flex-col">
      <CanvasHeader impactTree={impactTree} isNew={isNewTree} />
      
      <main className="flex-1 relative">
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
