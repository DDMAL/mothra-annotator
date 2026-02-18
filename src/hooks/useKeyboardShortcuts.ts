import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { CLASSES } from '../lib/constants';
import { toJSON } from '../lib/export';

interface ShortcutActions {
  cancelDrawing: () => void;
  isHelpOpen: boolean;
  toggleHelp: () => void;
}

function downloadJSON() {
  const { annotations, imageName, imageWidth, imageHeight } = useAppStore.getState();
  if (!imageName) return;
  const session = { imageName, imageWidth, imageHeight, annotations };
  const json = toJSON(session);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${imageName.replace(/\.[^.]+$/, '')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function useKeyboardShortcuts({ cancelDrawing, isHelpOpen, toggleHelp }: ShortcutActions) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Skip shortcuts when typing in input/textarea fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      // Ctrl/Cmd+S → quick-save JSON
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        downloadJSON();
        return;
      }

      // Ctrl/Cmd+Z → undo
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        useAppStore.getState().undo();
        return;
      }

      // ? → toggle help (requires shift on most keyboards)
      if (e.key === '?') {
        toggleHelp();
        return;
      }

      switch (e.key) {
        case '+':
        case '=':
          e.preventDefault();
          useAppStore.getState().zoomIn();
          break;
        case '-':
          e.preventDefault();
          useAppStore.getState().zoomOut();
          break;
        case '0':
          e.preventDefault();
          useAppStore.getState().resetView();
          break;
        case '1':
        case '2':
        case '3': {
          const cls = CLASSES.find((c) => c.shortcut === e.key);
          if (cls) useAppStore.getState().setActiveClass(cls.id);
          break;
        }
        case 'Delete':
        case 'Backspace': {
          const { selectedId } = useAppStore.getState();
          if (selectedId) {
            e.preventDefault();
            useAppStore.getState().deleteAnnotation(selectedId);
          }
          break;
        }
        case 'l':
          useAppStore.getState().toggleLabels();
          break;
        case 'Escape':
          if (isHelpOpen) {
            toggleHelp();
          } else {
            cancelDrawing();
            useAppStore.getState().setSelected(null);
          }
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cancelDrawing, isHelpOpen, toggleHelp]);
}
