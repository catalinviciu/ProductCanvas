import { useState, useCallback } from "react";

export interface DragState {
  isDragging: boolean;
  dragOffset: { x: number; y: number };
  startPosition: { x: number; y: number };
}

export function useDragDrop() {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    startPosition: { x: 0, y: 0 },
  });

  const startDrag = useCallback((clientX: number, clientY: number, elementPosition: { x: number; y: number }) => {
    setDragState({
      isDragging: true,
      dragOffset: {
        x: clientX - elementPosition.x,
        y: clientY - elementPosition.y,
      },
      startPosition: elementPosition,
    });
  }, []);

  const updateDrag = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
    if (!dragState.isDragging) return dragState.startPosition;
    
    return {
      x: clientX - dragState.dragOffset.x,
      y: clientY - dragState.dragOffset.y,
    };
  }, [dragState]);

  const endDrag = useCallback(() => {
    setDragState(prev => ({ ...prev, isDragging: false }));
  }, []);

  return {
    dragState,
    startDrag,
    updateDrag,
    endDrag,
  };
}
