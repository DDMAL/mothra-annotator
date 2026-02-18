import { useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { downloadJSON, downloadYOLO, downloadBoth, importJSON } from '../lib/export';
import { clearSession } from '../lib/storage';
import type { AnnotationSession } from '../lib/types';

function buildSession(): AnnotationSession | null {
  const { annotations, imageName, imageWidth, imageHeight } = useAppStore.getState();
  if (!imageName) return null;
  return { imageName, imageWidth, imageHeight, annotations };
}

export default function ExportPanel() {
  const imageName = useAppStore((s) => s.imageName);
  const annotationCount = useAppStore((s) => s.annotations.length);
  const imageWidth = useAppStore((s) => s.imageWidth);
  const imageHeight = useAppStore((s) => s.imageHeight);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasAnnotations = annotationCount > 0;
  const hasImage = !!imageName;

  const handleDownloadJSON = () => {
    const session = buildSession();
    if (session) downloadJSON(session);
  };

  const handleDownloadYOLO = () => {
    const session = buildSession();
    if (session) downloadYOLO(session);
  };

  const handleDownloadBoth = async () => {
    const session = buildSession();
    if (session) await downloadBoth(session);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const session = await importJSON(file);

      if (hasImage && (session.imageWidth !== imageWidth || session.imageHeight !== imageHeight)) {
        const proceed = window.confirm(
          `Image dimensions mismatch:\n` +
            `Current: ${imageWidth}×${imageHeight}\n` +
            `JSON: ${session.imageWidth}×${session.imageHeight}\n\n` +
            `Import anyway? Annotations may not align correctly.`,
        );
        if (!proceed) return;
      }

      useAppStore.getState().restoreSession(session.annotations);
    } catch (err) {
      alert(`Failed to import JSON: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    // Reset input so the same file can be re-imported
    e.target.value = '';
  };

  return (
    <div className="border-t border-gray-200 px-3 py-3">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Export</div>
      <div className="flex flex-col gap-1.5">
        <button
          onClick={handleDownloadJSON}
          disabled={!hasImage || !hasAnnotations}
          className="w-full px-3 py-1.5 text-xs font-medium rounded bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Download annotations as JSON"
        >
          Download JSON
        </button>
        <button
          onClick={handleDownloadYOLO}
          disabled={!hasImage || !hasAnnotations}
          className="w-full px-3 py-1.5 text-xs font-medium rounded bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Download annotations as YOLO format"
        >
          Download YOLO
        </button>
        <button
          onClick={handleDownloadBoth}
          disabled={!hasImage || !hasAnnotations}
          className="w-full px-3 py-1.5 text-xs font-medium rounded bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Download all formats as ZIP"
        >
          Download All (.zip)
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={!hasImage}
          className="w-full px-3 py-1.5 text-xs font-medium rounded bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Import annotations from JSON file"
        >
          Import JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </div>
      {hasImage && (
        <button
          onClick={() => {
            if (!window.confirm('Clear saved session and all annotations for this image?')) return;
            if (imageName) clearSession(imageName);
            useAppStore.getState().clearAll();
          }}
          className="w-full mt-2 px-3 py-1.5 text-xs font-medium rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          aria-label="Clear saved session"
        >
          Clear Session
        </button>
      )}
    </div>
  );
}
