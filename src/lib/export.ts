import JSZip from 'jszip';
import type { Annotation, AnnotationSession } from './types';
import { CLASSES } from './constants';

export function toJSON(session: AnnotationSession): string {
  return JSON.stringify(session, null, 2);
}

export function toYOLO(session: AnnotationSession): string {
  const { imageWidth, imageHeight, annotations } = session;

  const lines = annotations
    .filter((a) => a.bbox[2] >= 1 && a.bbox[3] >= 1)
    .map((a) => {
      const [x, y, w, h] = a.bbox;
      const classId = a.classId - 1;
      const xCenter = ((x + w / 2) / imageWidth).toFixed(6);
      const yCenter = ((y + h / 2) / imageHeight).toFixed(6);
      const nw = (w / imageWidth).toFixed(6);
      const nh = (h / imageHeight).toFixed(6);
      return `${classId} ${xCenter} ${yCenter} ${nw} ${nh}`;
    });

  return lines.join('\n');
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getBaseName(imageName: string): string {
  return imageName.replace(/\.[^.]+$/, '');
}

export function downloadJSON(session: AnnotationSession) {
  const json = toJSON(session);
  const blob = new Blob([json], { type: 'application/json' });
  downloadBlob(blob, `${getBaseName(session.imageName)}.json`);
}

export function downloadYOLO(session: AnnotationSession) {
  const yoloContent = toYOLO(session);
  const baseName = getBaseName(session.imageName);
  downloadBlob(new Blob([yoloContent], { type: 'text/plain' }), `${baseName}.txt`);
}

export async function downloadBoth(session: AnnotationSession) {
  const baseName = getBaseName(session.imageName);
  const json = toJSON(session);
  const yoloContent = toYOLO(session);

  const zip = new JSZip();
  zip.file(`${baseName}.json`, json);
  zip.file(`${baseName}.txt`, yoloContent);

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, `${baseName}_annotations.zip`);
}

export async function importJSON(file: File): Promise<AnnotationSession> {
  const text = await file.text();
  const data = JSON.parse(text);

  if (
    !data.imageName ||
    typeof data.imageWidth !== 'number' ||
    typeof data.imageHeight !== 'number' ||
    !Array.isArray(data.annotations)
  ) {
    throw new Error('Invalid annotation JSON: missing required fields');
  }

  for (const ann of data.annotations) {
    if (
      !ann.id ||
      typeof ann.classId !== 'number' ||
      !Array.isArray(ann.bbox) ||
      ann.bbox.length !== 4
    ) {
      throw new Error('Invalid annotation entry in JSON');
    }
  }

  return data as AnnotationSession;
}

export function fromYOLO(text: string, imageWidth: number, imageHeight: number): Annotation[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const annotations: Annotation[] = [];

  for (const line of lines) {
    const parts = line.split(/\s+/);
    if (parts.length !== 5) {
      throw new Error(`Invalid YOLO line: "${line}"`);
    }

    const nums = parts.map(Number);
    if (nums.some((n) => Number.isNaN(n))) {
      throw new Error(`Invalid YOLO line (non-numeric field): "${line}"`);
    }
    const [rawClassId, cx, cy, nw, nh] = nums;

    const classId = rawClassId + 1; // YOLO 0-indexed -> app 1-indexed
    if (!CLASSES.some((c) => c.id === classId)) {
      throw new Error(`Unknown YOLO class id ${rawClassId} in line: "${line}"`);
    }

    const w = nw * imageWidth;
    const h = nh * imageHeight;
    const x = cx * imageWidth - w / 2;
    const y = cy * imageHeight - h / 2;

    annotations.push({
      id: crypto.randomUUID(),
      classId,
      bbox: [x, y, w, h],
      timestamp: new Date().toISOString(),
    });
  }

  return annotations;
}

export async function importYOLO(
  file: File,
  imageWidth: number,
  imageHeight: number,
): Promise<Annotation[]> {
  const text = await file.text();
  return fromYOLO(text, imageWidth, imageHeight);
}
