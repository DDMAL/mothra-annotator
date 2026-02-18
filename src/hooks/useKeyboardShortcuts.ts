import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { CLASSES } from '../lib/constants';

interface ShortcutActions {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  cancelDrawing: () => void;
}

export function useKeyboardShortcuts({ zoomIn, zoomOut, resetView, cancelDrawing }: ShortcutActions) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Skip shortcuts when typing in input/textarea fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      // Ctrl/Cmd+Z → undo
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        useAppStore.getState().undo();
        return;
      }

      switch (e.key) {
        case '+':
        case '=':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
          e.preventDefault();
          zoomOut();
          break;
        case '0':
          e.preventDefault();
          resetView();
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
        case 'Escape':
          cancelDrawing();
          useAppStore.getState().setSelected(null);
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [zoomIn, zoomOut, resetView, cancelDrawing]);
}
