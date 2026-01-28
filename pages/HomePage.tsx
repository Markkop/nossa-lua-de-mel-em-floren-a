import React from 'react';
import { DOMAINS } from '../constants';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#fdfbf7]">
      {/* Hero Section */}
      <header className="relative h-[100dvh] flex items-center justify-center text-center px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1534445867742-43195f401b6c?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
            alt="Florença e Florianópolis"
            className="w-full h-full object-cover brightness-[0.7]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#fdfbf7]" />
        </div>
        
        <div className="relative z-10 max-w-4xl animate-fadeIn">
          <h1 className="text-5xl md:text-8xl font-serif text-white mb-6 drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
            Yosha & Mark
          </h1>
          <p className="text-xl md:text-2xl text-white/90 font-light italic max-w-2xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] mb-12">
            "Celebrando nosso amor em duas terras encantadas."
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={DOMAINS.presentes}
              className="group inline-flex items-center gap-3 bg-[#3d2b1f]/60 backdrop-blur-md border border-white/40 text-white px-8 py-4 rounded-xl font-medium hover:bg-[#3d2b1f] transition-all duration-300"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              <span className="flex flex-col items-start">
                <span className="text-lg">Lista de Presentes</span>
                <span className="text-xs opacity-70 font-light">Lua de Mel em Florença</span>
              </span>
            </a>
            
            <a
              href={DOMAINS.hospedagem}
              className="group inline-flex items-center gap-3 bg-[#3d2b1f]/60 backdrop-blur-md border border-white/40 text-white px-8 py-4 rounded-xl font-medium hover:bg-[#3d2b1f] transition-all duration-300"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="flex flex-col items-start">
                <span className="text-lg">Hospedagem</span>
                <span className="text-xs opacity-70 font-light">Casamento em Florianópolis</span>
              </span>
            </a>
          </div>
        </div>
      </header>

      {/* Footer */}
      <footer className="bg-[#3d2b1f] text-white py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-4xl md:text-5xl font-serif mb-6 text-[#e6d5c3]">Com amor,</p>
          <p className="text-2xl font-serif italic opacity-80">Yosha & Mark</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
