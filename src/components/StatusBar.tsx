import { useAppStore } from '../store/useAppStore';
import { CLASSES } from '../lib/constants';

export default function StatusBar() {
  const zoom = useAppStore((s) => s.zoom);
  const cursorImageCoords = useAppStore((s) => s.cursorImageCoords);
  const activeClassId = useAppStore((s) => s.activeClassId);

  const activeClass = CLASSES.find((c) => c.id === activeClassId);

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

      {/* Active class */}
      {activeClass && (
        <span className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ backgroundColor: activeClass.color }}
          />
          <span className="capitalize">{activeClass.name}</span>
        </span>
      )}
    </div>
  );
}
