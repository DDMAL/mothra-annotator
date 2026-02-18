import type { AnnotationSession, Annotation } from './types';

const STORAGE_PREFIX = 'mothra-session-';

export function getStorageKey(imageName: string): string {
  return `${STORAGE_PREFIX}${imageName}`;
}

export function saveSession(session: AnnotationSession): void {
  try {
    localStorage.setItem(getStorageKey(session.imageName), JSON.stringify(session));
  } catch {
    // localStorage quota exceeded — silently fail
  }
}

function isValidAnnotation(ann: unknown): ann is Annotation {
  if (typeof ann !== 'object' || ann === null) return false;
  const a = ann as Record<string, unknown>;
  return (
    typeof a.id === 'string' &&
    typeof a.classId === 'number' &&
    Array.isArray(a.bbox) &&
    a.bbox.length === 4 &&
    a.bbox.every((v: unknown) => typeof v === 'number')
  );
}

export function loadSession(imageName: string): AnnotationSession | null {
  try {
    const raw = localStorage.getItem(getStorageKey(imageName));
    if (!raw) return null;

    const data = JSON.parse(raw);
    if (
      !data.imageName ||
      typeof data.imageWidth !== 'number' ||
      typeof data.imageHeight !== 'number' ||
      !Array.isArray(data.annotations) ||
      !data.annotations.every(isValidAnnotation)
    ) {
      return null;
    }

    return data as AnnotationSession;
  } catch {
    return null;
  }
}

export function clearSession(imageName: string): void {
  localStorage.removeItem(getStorageKey(imageName));
}
