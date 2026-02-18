import { useState, useCallback } from 'react';
import Toolbar from './components/Toolbar';
import ImageLoader from './components/ImageLoader';
import AnnotationCanvas from './components/AnnotationCanvas';
import AnnotationList from './components/AnnotationList';
import ExportPanel from './components/ExportPanel';
import StatusBar from './components/StatusBar';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';
import { useImageLoader } from './hooks/useImageLoader';

function App() {
  const { image, error, loadImage } = useImageLoader();
  const [showHelp, setShowHelp] = useState(false);
  const toggleHelp = useCallback(() => setShowHelp((v) => !v), []);

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
