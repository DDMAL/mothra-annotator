import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { CLASSES } from '../lib/constants';
import { downloadJSON } from '../lib/export';

interface ShortcutActions {
  cancelDrawing: () => void;
  cancelDrag: () => void;
  isHelpOpen: boolean;
  toggleHelp: () => void;
}

function quickSaveJSON() {
  const { annotations, imageName, imageWidth, imageHeight } = useAppStore.getState();
  if (!imageName) return;
  downloadJSON({ imageName, imageWidth, imageHeight, annotations });
}

export function useKeyboardShortcuts({ cancelDrawing, cancelDrag, isHelpOpen, toggleHelp }: ShortcutActions) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Skip shortcuts when typing in input/textarea fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      // Ctrl/Cmd+S → quick-save JSON
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        quickSaveJSON();
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
        case 'd':
        case 'D': {
          const { editMode } = useAppStore.getState();
          if (editMode !== 'idle') {
            cancelDrag();
            useAppStore.getState().setEditMode('draw');
          }
          break;
        }
        case 'v':
        case 'V': {
          const { editMode } = useAppStore.getState();
          if (editMode !== 'idle') {
            cancelDrawing();
            useAppStore.getState().setEditMode('select');
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
            cancelDrag();
            useAppStore.getState().setSelected(null);
          }
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cancelDrawing, cancelDrag, isHelpOpen, toggleHelp]);
}
