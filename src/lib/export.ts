import type { AnnotationSession } from './types';

export function toJSON(session: AnnotationSession): string {
  return JSON.stringify(session, null, 2);
}

export function toYOLO(_session: AnnotationSession): {
  annotations: string;
  classes: string;
} {
  // TODO: Phase 8
  return { annotations: '', classes: '' };
}
