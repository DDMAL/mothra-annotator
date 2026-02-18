import { useState, useCallback, useEffect, useRef } from 'react';
import Toolbar from './components/Toolbar';
import ImageLoader from './components/ImageLoader';
import AnnotationCanvas from './components/AnnotationCanvas';
import AnnotationList from './components/AnnotationList';
import ExportPanel from './components/ExportPanel';
import StatusBar from './components/StatusBar';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';
import { useImageLoader } from './hooks/useImageLoader';
import { useAppStore } from './store/useAppStore';
import { saveSession } from './lib/storage';

function App() {
  const { image, error, loadImage } = useImageLoader();
  const [showHelp, setShowHelp] = useState(false);
  const toggleHelp = useCallback(() => setShowHelp((v) => !v), []);

  // Auto-save annotations to localStorage (debounced 500ms)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevAnnotationsRef = useRef(useAppStore.getState().annotations);
  useEffect(() => {
    const unsub = useAppStore.subscribe((state) => {
      if (state.annotations === prevAnnotationsRef.current) return;
      prevAnnotationsRef.current = state.annotations;
      clearTimeout(saveTimerRef.current);
      if (!state.imageName) return;
      const { imageName, imageWidth, imageHeight, annotations } = state;
      saveTimerRef.current = setTimeout(() => {
        saveSession({ imageName, imageWidth, imageHeight, annotations });
        useAppStore.getState().setLastSaved(Date.now());
      }, 500);
    });
    return () => {
      unsub();
      clearTimeout(saveTimerRef.current);
    };
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Toolbar onToggleHelp={toggleHelp} />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex">
          {image ? (
            <AnnotationCanvas image={image} isHelpOpen={showHelp} onToggleHelp={toggleHelp} />
          ) : (
            <ImageLoader onLoadImage={loadImage} error={error} />
          )}
        </div>
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <AnnotationList />
          <ExportPanel />
        </div>
      </div>
      <StatusBar />
      <KeyboardShortcutsHelp isOpen={showHelp} onClose={toggleHelp} />
    </div>
  );
}

export default App;
