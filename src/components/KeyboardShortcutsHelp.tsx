interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  altKeys?: string[];
  description: string;
}

const SHORTCUT_GROUPS: { title: string; shortcuts: Shortcut[] }[] = [
  {
    title: 'Classes',
    shortcuts: [
      { keys: ['1'], description: 'Select text class' },
      { keys: ['2'], description: 'Select music class' },
      { keys: ['3'], description: 'Select staves class' },
    ],
  },
  {
    title: 'Drawing',
    shortcuts: [
      { keys: ['Click + Drag'], description: 'Draw bounding box' },
      { keys: ['Delete'], altKeys: ['Backspace'], description: 'Delete selected annotation' },
      { keys: ['Ctrl/Cmd', 'Z'], description: 'Undo' },
      { keys: ['Escape'], description: 'Cancel drawing / deselect' },
    ],
  },
  {
    title: 'View',
    shortcuts: [
      { keys: ['+'], altKeys: ['='], description: 'Zoom in' },
      { keys: ['-'], description: 'Zoom out' },
      { keys: ['0'], description: 'Fit to view' },
      { keys: ['Scroll'], description: 'Scroll vertically' },
      { keys: ['Shift + Scroll'], description: 'Scroll horizontally' },
      { keys: ['Ctrl/Cmd + Scroll'], description: 'Zoom to cursor' },
      { keys: ['Space + Drag'], description: 'Pan' },
      { keys: ['Middle Click + Drag'], description: 'Pan' },
    ],
  },
  {
    title: 'Display',
    shortcuts: [{ keys: ['L'], description: 'Toggle labels' }],
  },
  {
    title: 'File',
    shortcuts: [{ keys: ['Ctrl/Cmd', 'S'], description: 'Quick-save JSON' }],
  },
  {
    title: 'Help',
    shortcuts: [{ keys: ['?'], description: 'Toggle this dialog' }],
  },
];

export default function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close shortcuts help"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 divide-y divide-gray-200">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title} className="py-4 first:pt-0 last:pb-0">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between text-sm text-gray-300"
                  >
                    <span className="text-gray-700">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <span key={i}>
                          {i > 0 && <span className="text-gray-300 mx-0.5">+ </span>}
                          <kbd className="inline-block min-w-6 text-center px-1.5 py-0.5 text-xs font-mono bg-gray-100 border border-gray-300 rounded text-gray-600">
                            {key}
                          </kbd>
                        </span>
                      ))}
                      {shortcut.altKeys?.map((key, i) => (
                        <span key={`alt-${i}`}>
                          <span className="text-gray-300 mx-0.5">/ </span>
                          <kbd className="inline-block min-w-6 text-center px-1.5 py-0.5 text-xs font-mono bg-gray-100 border border-gray-300 rounded text-gray-600">
                            {key}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
