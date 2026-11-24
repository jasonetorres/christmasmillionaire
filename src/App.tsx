import { BrowserRouter, Routes, Route, Navigate, Link, Outlet } from 'react-router-dom';
import Welcome from './Pages/Welcome';
import Host from './Pages/Host';
import Display from './Pages/Display';
import Vote from './Pages/Vote';
import Santa from './Pages/Santa';

import GameRoute from './show/GameRoute';

function MillionaireLayout() {
  return <div className="np-legacy">
    <nav aria-label="Game navigation"><Link to="/">← Christmas Game Night</Link></nav>
    <Outlet />
  </div>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/games/:id" element={<GameRoute />} />
        <Route path="/displayurl" element={<Display />} />
        <Route element={<MillionaireLayout />}>
          <Route path="/hostjt" element={<Host />} />
          <Route path="/vote" element={<Vote />} />
          <Route path="/santa" element={<Santa />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
