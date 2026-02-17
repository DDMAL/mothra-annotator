import type { AnnotationClass } from './types';

export const CLASSES: AnnotationClass[] = [
  { id: 1, name: 'text', color: '#3B82F6', shortcut: '1' },
  { id: 2, name: 'music', color: '#EF4444', shortcut: '2' },
  { id: 3, name: 'staves', color: '#10B981', shortcut: '3' },
];

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 5.0;
export const ZOOM_STEP = 0.1;
export const MIN_BOX_SIZE = 4; // px in image space, ignore smaller drags
