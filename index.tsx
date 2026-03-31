
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PresentesPage from './pages/PresentesPage';
import HospedagemPage from './pages/HospedagemPage';
import KaraokePage from './pages/KaraokePage';
import GamePage from './pages/GamePage';

/**
 * Detects which subdomain we're on to render the appropriate page.
 * Returns null to use route-based navigation (e.g. root domain paths + localhost).
 */
const getSubdomain = (): 'presentes' | 'hospedagem' | 'karaoke' | null => {
  const host = window.location.hostname;
  
  if (host.startsWith('presentes.')) return 'presentes';
  if (host.startsWith('hospedagem.')) return 'hospedagem';
  if (host.startsWith('karaoke.')) return 'karaoke';
  
  // root domain or localhost - use route-based navigation
  return null;
};

/**
 * Router unificado: sempre usa Routes para o React Router casar /missao em qualquer
 * host (incl. subdomínios). Rotas mais específicas (/missao) têm prioridade sobre
 * o catch-all /* do subdomínio.
 */
const SubdomainRouter: React.FC = () => {
  const subdomain = getSubdomain();

  return (
    <Routes>
      <Route path="/missao" element={<GamePage />} />
      <Route path="/game" element={<Navigate to="/missao" replace />} />
      {subdomain === null ? (
        <>
          <Route path="/" element={<HomePage />} />
          <Route path="/presentes" element={<PresentesPage />} />
          <Route path="/hospedagem" element={<HospedagemPage />} />
          <Route path="/karaoke" element={<KaraokePage />} />
        </>
      ) : subdomain === 'presentes' ? (
        <Route path="/*" element={<PresentesPage />} />
      ) : subdomain === 'hospedagem' ? (
        <Route path="/*" element={<HospedagemPage />} />
      ) : (
        <Route path="/*" element={<KaraokePage />} />
      )}
    </Routes>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <SubdomainRouter />
    </BrowserRouter>
  </React.StrictMode>
);
