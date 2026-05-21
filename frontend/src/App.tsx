import { UploadDropzone } from './components/UploadDropzone';
import { NetworkGraph } from './components/NetworkGraph';
import { Inspectors } from './components/Inspectors';
import { useStore } from './store/useStore';
import { Network } from 'lucide-react';

function App() {
  const graph = useStore((state) => state.graph);
  const fileName = useStore((state) => state.fileName);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* Top Navbar */}
      <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center px-6 justify-between shrink-0 z-20 relative shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-md">
            <Network className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            DBC Network Explorer
          </h1>
        </div>
        {fileName && (
          <div className="flex items-center gap-4">
            <div className="text-sm px-3 py-1 bg-slate-800 rounded border border-slate-700 text-slate-300">
              {fileName}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Upload Another
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative flex overflow-hidden">
        {!graph ? (
          <div className="w-full h-full flex items-center justify-center p-8 overflow-y-auto">
            <UploadDropzone />
          </div>
        ) : (
          <div className="flex-1 relative w-full h-full">
            <NetworkGraph />
            <Inspectors />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
