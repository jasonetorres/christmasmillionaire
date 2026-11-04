import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './Pages/Welcome';
import Host from './Pages/Host';
import Display from './Pages/Display';
import Vote from './Pages/Vote';
import Santa from './Pages/Santa';
import SetupRequired from './Components/SetupRequired';
import { isSupabaseConfigured } from './lib/supabase';

function App() {
  if (!isSupabaseConfigured) {
    return <SetupRequired />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/hostjt" element={<Host />} />
        <Route path="/displayurl" element={<Display />} />
        <Route path="/vote" element={<Vote />} />
        <Route path="/santa" element={<Santa />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
