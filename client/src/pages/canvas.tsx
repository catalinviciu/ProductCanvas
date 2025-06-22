import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ImpactTreeCanvas } from "@/components/canvas/impact-tree-canvas";

import { ProjectHeader } from "@/components/header/project-header";
import { NodeEditModal } from "@/components/modals/node-edit-modal";
import { ContextMenu } from "@/components/modals/context-menu";
import { CreateFirstNodeModal } from "@/components/modals/create-first-node-modal";
import { useCanvas } from "@/hooks/use-canvas";
import { type ImpactTree } from "@shared/schema";

export default function CanvasPage() {
  const { id } = useParams();
  const treeId = id ? parseInt(id) : 1;

  const { data: impactTree, isLoading } = useQuery<ImpactTree>({
    queryKey: ["/api/impact-trees", treeId],
  });

  // Always call useCanvas hook - never conditionally
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
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-700">Loading impact tree...</div>
        </div>
      </div>
    );
  }

  if (!impactTree) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center">
          <div className="text-6xl text-red-400 mb-4">⚠️</div>
          <div className="text-xl font-semibold text-red-600">Failed to load impact tree</div>
          <div className="text-sm text-red-500 mt-2">Please refresh the page or contact support</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-gray-100">
      <ProjectHeader 
        projectName={impactTree.name}
        lastSaved={impactTree.updatedAt}
        onAutoLayout={handleAutoLayout}
        onFitToScreen={fitToScreen}
        orientation={canvasState.orientation}
        onOrientationToggle={handleOrientationToggle}
      />
      
      <main className="flex-1 relative overflow-hidden">
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
      />

      <CreateFirstNodeModal
        isOpen={createFirstNodeModal.isOpen}
        onClose={closeCreateFirstNodeModal}
        onNodeCreate={handleCreateFirstNode}
      />
    </div>
  );
}
