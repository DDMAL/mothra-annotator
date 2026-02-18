import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { CLASSES } from '../lib/constants';

function getClassColor(classId: number): string {
  return CLASSES.find((c) => c.id === classId)?.color ?? '#888';
}

function getClassName(classId: number): string {
  return CLASSES.find((c) => c.id === classId)?.name ?? 'unknown';
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function AnnotationList() {
  const annotations = useAppStore((s) => s.annotations);
  const selectedId = useAppStore((s) => s.selectedId);
  const setSelected = useAppStore((s) => s.setSelected);
  const deleteAnnotation = useAppStore((s) => s.deleteAnnotation);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll selected row into view
  useEffect(() => {
    if (!selectedId || !listRef.current) return;
    const row = listRef.current.querySelector(`[data-id="${selectedId}"]`);
    row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedId]);

  // Sort newest first
  const sorted = [...annotations].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <div className="flex-1 flex flex-col text-sm overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-xl text-gray-700">Annotations</span>
          <span className="text-xs text-gray-400">{annotations.length} total</span>
        </div>
        {/* Class counts */}
        <div className="flex items-center gap-5 mt-1 justify-end">
          {CLASSES.map((cls) => (
            <span key={cls.id} className="flex items-center gap-1 text-xs text-gray-500">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: cls.color }}
              />
              <span className="capitalize">{cls.name}</span>
              <span className="tabular-nums">
                {annotations.filter((a) => a.classId === cls.id).length}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Scrollable list */}
      <div ref={listRef} className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="px-3 py-8 text-center text-gray-400">No annotations yet</div>
        ) : (
          sorted.map((ann) => {
            const color = getClassColor(ann.classId);
            const isSelected = ann.id === selectedId;
            return (
              <div
                key={ann.id}
                data-id={ann.id}
                onClick={() => setSelected(ann.id)}
                className={`px-3 py-2 cursor-pointer border-b border-gray-100 flex items-start gap-2 hover:bg-gray-50 ${
                  isSelected ? 'bg-blue-50 ring-1 ring-inset ring-blue-200' : ''
                }`}
              >
                {/* Color dot */}
                <span
                  className="mt-1 w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-gray-700 capitalize">
                      {getClassName(ann.classId)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    [{ann.bbox[0].toFixed()}, {ann.bbox[1].toFixed()}, {ann.bbox[2].toFixed()},{' '}
                    {ann.bbox[3].toFixed()}]
                  </div>
                  <div className="text-xs text-gray-300">{formatTimestamp(ann.timestamp)}</div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAnnotation(ann.id);
                  }}
                  className="p-1.5 text-gray-300 hover:text-red-500 rounded hover:bg-red-50 shrink-0 self-center"
                  aria-label={`Delete ${getClassName(ann.classId)} annotation`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
