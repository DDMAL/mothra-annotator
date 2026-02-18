import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { CLASSES } from '../lib/constants';

function SessionIndicator() {
  const lastSaved = useAppStore((s) => s.lastSaved);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!lastSaved) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timer);
  }, [lastSaved]);

  if (!visible) return null;

  return (
    <span className="text-green-600 flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
      Saved
    </span>
  );
}

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
        {cursorImageCoords ? `X: ${cursorImageCoords[0]}  Y: ${cursorImageCoords[1]}` : '—'}
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Session saved indicator */}
      <SessionIndicator />

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
