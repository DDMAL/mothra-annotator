import { useEffect } from 'react';

interface ZoomActions {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
}

export function useKeyboardShortcuts({ zoomIn, zoomOut, resetView }: ZoomActions) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Skip shortcuts when typing in input/textarea fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

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
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [zoomIn, zoomOut, resetView]);
}
