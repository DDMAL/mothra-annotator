export interface Annotation {
  id: string;
  classId: number; // 1 = text, 2 = music, 3 = staves (1-indexed for JSON)
  bbox: [number, number, number, number]; // [x, y, w, h] in image-pixel coords
  timestamp: string; // ISO 8601
}

export interface AnnotationSession {
  imageName: string;
  imageWidth: number;
  imageHeight: number;
  annotations: Annotation[];
}

export interface AnnotationClass {
  id: number;
  name: string;
  color: string;
  shortcut: string;
}

export interface ViewportState {
  zoom: number; // 1.0 = 100%, max 5.0
  panX: number;
  panY: number;
}

export type EditMode = 'idle' | 'draw' | 'select';

export type DragHandle = 'body' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

export interface DragState {
  active: boolean;
  annotationId: string | null;
  handle: DragHandle;
  previewBbox: [number, number, number, number] | null; // preview bbox during drag
}
