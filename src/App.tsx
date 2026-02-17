import Toolbar from './components/Toolbar';
import ImageLoader from './components/ImageLoader';
import AnnotationCanvas from './components/AnnotationCanvas';
import AnnotationList from './components/AnnotationList';
import StatusBar from './components/StatusBar';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';
import { useImageLoader } from './hooks/useImageLoader';

function App() {
  const { image, error, loadImage } = useImageLoader();

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex">
          {image ? (
            <AnnotationCanvas image={image} />
          ) : (
            <ImageLoader onLoadImage={loadImage} error={error} />
          )}
        </div>
        <AnnotationList />
      </div>
      <StatusBar />
      <KeyboardShortcutsHelp />
    </div>
  );
}

export default App;
