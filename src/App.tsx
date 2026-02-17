import Toolbar from './components/Toolbar';
import ImageLoader from './components/ImageLoader';
import AnnotationCanvas from './components/AnnotationCanvas';
import AnnotationList from './components/AnnotationList';
import StatusBar from './components/StatusBar';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';

function App() {
  const imageLoaded = false; // TODO: Phase 2

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex">{imageLoaded ? <AnnotationCanvas /> : <ImageLoader />}</div>
        <AnnotationList />
      </div>
      <StatusBar />
      <KeyboardShortcutsHelp />
    </div>
  );
}

export default App;
