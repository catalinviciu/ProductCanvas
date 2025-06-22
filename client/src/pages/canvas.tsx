import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ImpactTreeCanvas } from "@/components/canvas/impact-tree-canvas";
import { NodePalette } from "@/components/sidebar/node-palette";
import { CanvasControls } from "@/components/sidebar/canvas-controls";
import { ProjectHeader } from "@/components/header/project-header";
import { NodeEditModal } from "@/components/modals/node-edit-modal";
import { ContextMenu } from "@/components/modals/context-menu";
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
  } = useCanvas(impactTree);

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
    <div className="h-screen flex flex-col bg-gray-50">
      <ProjectHeader 
        projectName={impactTree.name}
        lastSaved={impactTree.updatedAt}
        onAutoLayout={() => {}}
        onFitToScreen={() => {}}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          <div className="space-y-6">
            <NodePalette onNodeCreate={handleNodeCreate} />
            <CanvasControls 
              canvasState={canvasState}
              onCanvasUpdate={handleCanvasUpdate}
            />
          </div>
        </aside>

        <main className="flex-1 bg-white relative overflow-hidden">
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
          />
        </main>
      </div>

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
      />
    </div>
  );
}
