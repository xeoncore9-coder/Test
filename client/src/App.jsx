import { Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import EditorPage from './pages/EditorPage';
import TMPage from './pages/TMPage';
import GlossaryPage from './pages/GlossaryPage';

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="logo">CAT Tool</Link>
        <nav>
          <Link to="/">Projects</Link>
          <Link to="/tm">Translation Memory</Link>
          <Link to="/glossary">Glossary</Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/editor/:projectId" element={<EditorPage />} />
          <Route path="/tm" element={<TMPage />} />
          <Route path="/glossary" element={<GlossaryPage />} />
        </Routes>
      </main>
    </div>
  );
}
