import JSZip from 'jszip';
import type { AnnotationSession } from './types';

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
    if (!ann.id || typeof ann.classId !== 'number' || !Array.isArray(ann.bbox) || ann.bbox.length !== 4) {
      throw new Error('Invalid annotation entry in JSON');
    }
  }

  return data as AnnotationSession;
}
