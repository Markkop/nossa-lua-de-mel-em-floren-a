import React from 'react';
import { DOMAINS } from '../constants';

const cardClassName =
  'group relative isolate flex min-h-40 flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/30 bg-[#2f2118] px-5 py-6 text-center text-white shadow-[0_18px_45px_rgba(20,12,8,0.18)] transition duration-300 ease-out hover:-translate-y-1 hover:border-white/50 hover:shadow-[0_22px_55px_rgba(20,12,8,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#3d2b1f] motion-reduce:transform-none motion-reduce:transition-none';

const iconClassName =
  'relative z-10 mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-sm transition-colors duration-300 group-hover:bg-white/15';

const titleClassName =
  'flex min-h-12 items-center justify-center text-xl font-semibold leading-tight tracking-[-0.01em]';

const descriptionClassName =
  'mt-1 max-w-48 text-sm font-light leading-5 text-white/75';

const cardImageClassName =
  'absolute inset-0 h-full w-full object-cover opacity-40 transition duration-500 ease-out group-hover:scale-105 group-hover:opacity-50 motion-reduce:transform-none motion-reduce:transition-none';

const cardImages = {
  presentes:
    'https://images.unsplash.com/photo-1543429257-3eb0b65d9c58?q=70&w=700&auto=format&fit=crop',
  hospedagem:
    'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?q=70&w=700&auto=format&fit=crop',
  karaoke:
    'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=70&w=700&auto=format&fit=crop',
  fotos: '/api/photos?action=cover',
};

const CardImage: React.FC<{ src: string; position?: string }> = ({ src, position }) => (
  <>
    <img
      src={src}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      className={cardImageClassName}
      style={position ? { objectPosition: position } : undefined}
    />
    <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-[#21150e]/55 via-[#2f2017]/65 to-[#21150e]/85" />
  </>
);

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#fdfbf7]">
      {/* Hero Section */}
      <header className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-24 text-center sm:px-6 sm:py-28">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1534445867742-43195f401b6c?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
            alt="Florença e Florianópolis"
            className="w-full h-full object-cover brightness-[0.7]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#fdfbf7]" />
        </div>
        
        <div className="relative z-10 w-full max-w-7xl animate-fadeIn">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-5 font-serif text-5xl text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] sm:text-6xl md:text-8xl">
              Yosha & Mark
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg font-light italic leading-relaxed text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] sm:text-xl md:mb-14 md:text-2xl">
              "Celebrando nosso amor em duas terras encantadas."
            </p>
          </div>
          
          <nav aria-label="Atalhos principais" className="mx-auto grid max-w-6xl grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
            <a
              href={DOMAINS.presentes}
              className={cardClassName}
            >
              <CardImage src={cardImages.presentes} />
              <span className={iconClassName}>
                <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </span>
              <span className="relative z-10 flex flex-col items-center">
                <span className={titleClassName}>Lista de Presentes</span>
                <span className={descriptionClassName}>Lua de Mel em Florença</span>
              </span>
            </a>
            
            <a
              href={DOMAINS.hospedagem}
              className={cardClassName}
            >
              <CardImage src={cardImages.hospedagem} />
              <span className={iconClassName}>
                <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </span>
              <span className="relative z-10 flex flex-col items-center">
                <span className={titleClassName}>Hospedagem</span>
                <span className={descriptionClassName}>Casamento em Florianópolis</span>
              </span>
            </a>

            <a
              href={DOMAINS.karaoke}
              className={cardClassName}
            >
              <CardImage src={cardImages.karaoke} />
              <span className={iconClassName}>
                <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </span>
              <span className="relative z-10 flex flex-col items-center">
                <span className={titleClassName}>Karaokê</span>
                <span className={descriptionClassName}>Fila de músicas</span>
              </span>
            </a>

            <a
              href="/fotos"
              className={cardClassName}
            >
              <CardImage src={cardImages.fotos} position="center 28%" />
              <span className={iconClassName}>
                <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h2l1-2h8l1 2h2a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm9 10a4 4 0 100-8 4 4 0 000 8z" />
                </svg>
              </span>
              <span className="relative z-10 flex flex-col items-center">
                <span className={titleClassName}>Fotos do casamento</span>
                <span className={descriptionClassName}>Nossa galeria</span>
              </span>
            </a>
          </nav>
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
