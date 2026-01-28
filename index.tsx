
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PresentesPage from './pages/PresentesPage';
import HospedagemPage from './pages/HospedagemPage';

/**
 * Detects which subdomain we're on to render the appropriate page.
 * Returns null for localhost/development to use route-based fallback.
 */
const getSubdomain = (): 'root' | 'presentes' | 'hospedagem' | null => {
  const host = window.location.hostname;
  
  if (host.startsWith('presentes.')) return 'presentes';
  if (host.startsWith('hospedagem.')) return 'hospedagem';
  if (host === 'yoshaemark.com' || host === 'www.yoshaemark.com') return 'root';
  
  // localhost or other - use route-based navigation
  return null;
};

/**
 * Wrapper component that handles subdomain-based routing.
 * If on a specific subdomain, renders that page directly.
 * Otherwise, falls back to route-based navigation for local development.
 */
const SubdomainRouter: React.FC = () => {
  const subdomain = getSubdomain();
  
  // Subdomain detected - render the appropriate page directly
  if (subdomain === 'presentes') return <PresentesPage />;
  if (subdomain === 'hospedagem') return <HospedagemPage />;
  if (subdomain === 'root') return <HomePage />;
  
  // No subdomain (localhost) - use route-based navigation
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/presentes" element={<PresentesPage />} />
      <Route path="/hospedagem" element={<HospedagemPage />} />
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
