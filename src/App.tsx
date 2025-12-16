import { useState, useEffect } from 'react';
import { HostPanel } from './components/HostPanel';
import { DisplayPanel } from './components/DisplayPanel';
import { AdminPanel } from './components/AdminPanel';
import { AudienceVoting } from './components/AudienceVoting';
import { Settings, Tv, Smartphone } from 'lucide-react';

type Mode = 'select' | 'host' | 'display' | 'admin' | 'vote';

function App() {
  const [mode, setMode] = useState<Mode>('select');

  useEffect(() => {
    const pathname = window.location.pathname;
    if (pathname === '/vote') {
      setMode('vote');
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    if (modeParam === 'host' || modeParam === 'display') {
      setMode(modeParam);
    }
  }, []);

  if (mode === 'vote') {
    return <AudienceVoting />;
  }

  if (mode === 'admin') {
    return <AdminPanel onClose={() => setMode('select')} />;
  }

  if (mode === 'host') {
    return (
      <>
        <button
          onClick={() => setMode('select')}
          className="fixed top-4 left-4 z-50 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors shadow-lg"
        >
          ← Back
        </button>
        <button
          onClick={() => setMode('admin')}
          className="fixed top-4 right-4 z-50 bg-gray-800 text-white p-3 rounded-full hover:bg-gray-700 transition-colors shadow-lg"
          title="Admin Panel"
        >
          <Settings className="w-6 h-6" />
        </button>
        <HostPanel />
      </>
    );
  }

  if (mode === 'display') {
    return <DisplayPanel />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950 flex items-center justify-center p-8">
      <div className="text-center max-w-4xl">
        <h1 className="text-6xl md:text-8xl font-bold text-yellow-400 mb-4 drop-shadow-lg">
          Who Wants to Be a Millionaire?
        </h1>
        <h2 className="text-4xl md:text-5xl font-semibold text-red-400 mb-12">
          🎄 Christmas Edition 🎅
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => setMode('host')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-12 rounded-2xl hover:scale-105 transition-all shadow-2xl hover:shadow-blue-500/50"
          >
            <Smartphone className="w-24 h-24 mx-auto mb-4" />
            <h3 className="text-3xl font-bold mb-2">Host Panel</h3>
            <p className="text-xl text-blue-200">Control the game from your phone</p>
          </button>

          <button
            onClick={() => setMode('display')}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-12 rounded-2xl hover:scale-105 transition-all shadow-2xl hover:shadow-purple-500/50"
          >
            <Tv className="w-24 h-24 mx-auto mb-4" />
            <h3 className="text-3xl font-bold mb-2">Display Panel</h3>
            <p className="text-xl text-purple-200">Stream visual for your audience</p>
          </button>
        </div>

        <button
          onClick={() => setMode('admin')}
          className="bg-gray-700 text-white px-8 py-4 rounded-xl hover:bg-gray-600 transition-all shadow-lg flex items-center gap-3 mx-auto"
        >
          <Settings className="w-6 h-6" />
          <span className="text-xl">Admin Panel - Manage Questions</span>
        </button>

        <div className="mt-12 text-white text-left bg-blue-900/30 p-6 rounded-xl">
          <h3 className="text-2xl font-bold mb-4">Quick Setup:</h3>
          <ol className="list-decimal list-inside space-y-2 text-lg">
            <li>Go to Admin Panel and click "Seed Database" to load questions</li>
            <li>Open Host Panel on your phone</li>
            <li>Open Display Panel on your streaming computer (or add ?mode=display to URL)</li>
            <li>Use your phone to control the game while Display shows it to your audience</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default App;
