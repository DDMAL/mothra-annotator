import type { AnnotationClass } from './types';

export const CLASSES: AnnotationClass[] = [
  { id: 1, name: 'text', color: '#5B8FA3', shortcut: '1' },
  { id: 2, name: 'music', color: '#7A9B5F', shortcut: '2' },
  { id: 3, name: 'staves', color: '#B8860B', shortcut: '3' },
];

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 5.0;
export const ZOOM_STEP = 0.1;
export const MIN_BOX_SIZE = 4; // px in image space, ignore smaller drags
export const HANDLE_HALFSIZE_PX = 4; // half-size of resize handles in screen pixels (8px total)
