import type { AnnotationSession } from './types';

const STORAGE_PREFIX = 'mothra-session-';

export function getStorageKey(imageName: string): string {
  return `${STORAGE_PREFIX}${imageName}`;
}

export function saveSession(_session: AnnotationSession): void {
  // TODO: Phase 9
}

export function loadSession(_imageName: string): AnnotationSession | null {
  // TODO: Phase 9
  return null;
}

export function clearSession(_imageName: string): void {
  // TODO: Phase 9
}
