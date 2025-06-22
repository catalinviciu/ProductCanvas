export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DragEvent {
  nodeId: string;
  startPosition: Point;
  currentPosition: Point;
  offset: Point;
}

export interface CanvasEvent {
  type: 'nodeSelect' | 'nodeDeselect' | 'nodeDrag' | 'nodeCreate' | 'nodeDelete' | 'canvasPan' | 'canvasZoom';
  payload: any;
}

export interface ViewportState {
  zoom: number;
  pan: Point;
  bounds: Rect;
}

export interface SelectionState {
  selectedNodes: string[];
  selectionRect?: Rect;
}
