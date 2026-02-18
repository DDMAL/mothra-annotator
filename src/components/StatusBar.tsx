import { useAppStore } from '../store/useAppStore';
import { CLASSES } from '../lib/constants';

export default function StatusBar() {
  const zoom = useAppStore((s) => s.zoom);
  const cursorImageCoords = useAppStore((s) => s.cursorImageCoords);
  const annotations = useAppStore((s) => s.annotations);

  const classCounts = CLASSES.map((cls) => ({
    ...cls,
    count: annotations.filter((a) => a.classId === cls.id).length,
  }));

  return (
    <div className="h-8 bg-white border-t border-gray-200 flex items-center px-4 gap-6 text-xs text-gray-500 select-none">
      {/* Zoom */}
      <span className="tabular-nums">{Math.round(zoom * 100)}%</span>

      {/* Cursor coordinates */}
      <span className="tabular-nums w-32">
        {cursorImageCoords
          ? `X: ${cursorImageCoords[0]}  Y: ${cursorImageCoords[1]}`
          : '—'}
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Annotation counts per class + total */}
      <span className="flex items-center gap-3">
        {classCounts.map((cls) => (
          <span key={cls.id} className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: cls.color }}
            />
            <span className="tabular-nums">{cls.count}</span>
          </span>
        ))}
        <span className="tabular-nums">
          {annotations.length} total
        </span>
      </span>
    </div>
  );
}
