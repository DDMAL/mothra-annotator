import { useAppStore } from '../store/useAppStore';
import { CLASSES } from '../lib/constants';

interface ToolbarProps {
  onToggleHelp: () => void;
}

export default function Toolbar({ onToggleHelp }: ToolbarProps) {
  const activeClassId = useAppStore((s) => s.activeClassId);
  const zoom = useAppStore((s) => s.zoom);
  const boxOpacity = useAppStore((s) => s.boxOpacity);
  const showLabels = useAppStore((s) => s.showLabels);
  const editMode = useAppStore((s) => s.editMode);
  const setEditMode = useAppStore((s) => s.setEditMode);

  const hiddenClassIds = useAppStore((s) => s.hiddenClassIds);

  const setActiveClass = useAppStore((s) => s.setActiveClass);
  const zoomIn = useAppStore((s) => s.zoomIn);
  const zoomOut = useAppStore((s) => s.zoomOut);
  const resetView = useAppStore((s) => s.resetView);
  const setOpacity = useAppStore((s) => s.setOpacity);
  const toggleLabels = useAppStore((s) => s.toggleLabels);
  const toggleClassVisibility = useAppStore((s) => s.toggleClassVisibility);
  const toggleAllClassVisibility = useAppStore((s) => s.toggleAllClassVisibility);
  const clearAll = useAppStore((s) => s.clearAll);

  const isIdle = editMode === 'idle';
  const allVisible = hiddenClassIds.size === 0;

  return (
    <div
      className={`h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-1 text-sm select-none ${isIdle ? 'pointer-events-none opacity-40' : ''}`}
    >
      {/* Mode switch */}
      <div className="flex items-center rounded-md bg-gray-100 p-0.5">
        <button
          onClick={() => setEditMode('draw')}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            editMode === 'draw'
              ? 'bg-gray-700 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          aria-label="Drawing mode (D)"
          title="Draw annotations (D)"
        >
          Draw
        </button>
        <button
          onClick={() => setEditMode('select')}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            editMode === 'select'
              ? 'bg-gray-700 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          aria-label="Selecting mode (V)"
          title="Select & move annotations (V)"
        >
          Select
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 mx-2" />

      {/* Class selector */}
      <div className="flex items-center gap-1">
        {CLASSES.map((cls) => (
          <button
            key={cls.id}
            onClick={() => setActiveClass(cls.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeClassId === cls.id
                ? 'ring-2 ring-offset-1 bg-gray-100'
                : 'hover:bg-gray-50 text-gray-600'
            }`}
            style={{
              boxShadow:
                activeClassId === cls.id ? `0 0 0 2px white, 0 0 0 4px ${cls.color}` : undefined,
            }}
            aria-label={`Select class: ${cls.name} (${cls.shortcut})`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
              style={{ backgroundColor: cls.color }}
            />
            <span>{cls.name}</span>
            <kbd className="text-[10px] text-gray-400 bg-gray-100 px-1 rounded">{cls.shortcut}</kbd>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 mx-2" />

      {/* Visibility toggles */}
      <div className="flex items-center gap-1">
        <button
          onClick={toggleAllClassVisibility}
          className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors ${
            allVisible ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:bg-gray-50'
          }`}
          aria-label={allVisible ? 'Hide all classes' : 'Show all classes'}
          title={allVisible ? 'Hide all' : 'Show all'}
        >
          <span
            className={`w-3 h-3 rounded border flex items-center justify-center text-[8px] ${
              allVisible ? 'bg-gray-600 border-gray-600 text-white' : 'border-gray-400'
            }`}
          >
            {allVisible ? '✓' : ''}
          </span>
          All
        </button>
        {CLASSES.map((cls) => {
          const isVisible = !hiddenClassIds.has(cls.id);
          return (
            <button
              key={cls.id}
              onClick={() => toggleClassVisibility(cls.id)}
              className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors ${
                isVisible ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:bg-gray-50'
              }`}
              aria-label={`${isVisible ? 'Hide' : 'Show'} ${cls.name} annotations`}
              title={`${isVisible ? 'Hide' : 'Show'} ${cls.name}`}
            >
              <span
                className={`w-3 h-3 rounded border flex items-center justify-center text-[8px]`}
                style={{
                  backgroundColor: isVisible ? cls.color : undefined,
                  borderColor: cls.color,
                  color: isVisible ? 'white' : 'transparent',
                }}
              >
                {isVisible ? '✓' : ''}
              </span>
              <span className="capitalize">{cls.name}</span>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 mx-2" />

      {/* Zoom controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={zoomOut}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
          aria-label="Zoom out"
        >
          −
        </button>
        <span className="w-12 text-center text-xs text-gray-600 tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={zoomIn}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={resetView}
          className="px-2 py-1 text-xs rounded hover:bg-gray-100 text-gray-600"
          aria-label="Fit image to view"
        >
          Fit
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 mx-2" />

      {/* Opacity slider */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500" htmlFor="opacity-slider">
          Opacity
        </label>
        <input
          id="opacity-slider"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={boxOpacity}
          onChange={(e) => setOpacity(parseFloat(e.target.value))}
          className="w-20 h-1 accent-gray-500"
        />
        <span className="text-xs text-gray-500 w-8 tabular-nums">
          {Math.round(boxOpacity * 100)}%
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 mx-2" />

      {/* Label toggle */}
      <button
        onClick={toggleLabels}
        className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors ${
          showLabels ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:bg-gray-50'
        }`}
        aria-label="Toggle labels"
      >
        <span
          className={`w-3 h-3 rounded border flex items-center justify-center text-[8px] ${
            showLabels ? 'bg-gray-600 border-gray-600 text-white' : 'border-gray-400'
          }`}
        >
          {showLabels ? '✓' : ''}
        </span>
        Labels
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Clear all */}
      <button
        onClick={() => {
          if (window.confirm('Clear all annotations? This can be undone with Ctrl+Z.')) {
            clearAll();
          }
        }}
        className="px-2.5 py-1 text-xs rounded text-red-600 hover:bg-red-50 transition-colors"
        aria-label="Clear all annotations"
      >
        Clear All
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 mx-2" />

      {/* Help */}
      <button
        onClick={onToggleHelp}
        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 font-medium text-sm"
        aria-label="Keyboard shortcuts help"
      >
        ?
      </button>
    </div>
  );
}
