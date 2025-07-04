import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ImpactTreeCanvas } from "@/components/canvas/impact-tree-canvas";


import { NodeEditModal } from "@/components/modals/node-edit-modal";
import { ContextMenu } from "@/components/modals/context-menu";
import { CreateFirstNodeModal } from "@/components/modals/create-first-node-modal";
import { useCanvas } from "@/hooks/use-canvas";
import { type ImpactTree } from "@shared/schema";

export default function CanvasPage() {
  const { id } = useParams();
  const treeId = id ? parseInt(id) : 1; // Default to tree 1 if no ID provided

  const { data: impactTree, isLoading } = useQuery<ImpactTree>({
    queryKey: ["/api/impact-trees", treeId],
  });

  const {
    selectedNode,
    contextMenu,
    editModal,
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
    closeEditModal,
    openEditModal,
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

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading impact tree...</div>
      </div>
    );
  }

  if (!impactTree) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-red-600">Failed to load impact tree</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white relative overflow-hidden">
      <main className="h-full">
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

      <NodeEditModal
        node={selectedNode}
        isOpen={editModal.isOpen}
        onClose={closeEditModal}
        onSave={handleNodeUpdate}
      />

      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        node={contextMenu.node}
        onClose={closeContextMenu}
        onEdit={openEditModal}
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
