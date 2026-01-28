
import React, { useState } from 'react';
import { GIFT_OPTIONS } from '../constants';
import { GiftOption } from '../types';
import GiftCard from '../components/GiftCard';
import PixModal from '../components/PixModal';
import GalleryModal from '../components/GalleryModal';

const PresentesPage: React.FC = () => {
  const [selectedGift, setSelectedGift] = useState<GiftOption | null>(null);
  const [galleryGift, setGalleryGift] = useState<GiftOption | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="relative h-[100dvh] flex items-center justify-center text-center px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1543429257-3eb0b65d9c58?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
            alt="Firenze Skyline"
            className="w-full h-full object-cover brightness-[0.85]"
            style={{
              maskImage: 'linear-gradient(to bottom, black 0%, black 90%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 90%, transparent 100%)'
            }}
          />
          {/* Warmer overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#3d2b1f]/40 via-transparent via-60% to-[#fdfbf7]" />
          <div className="absolute inset-0 bg-black/10" />
          {/* Extra smooth bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-[5dvh] bg-gradient-to-t from-[#fdfbf7] via-[#fdfbf7]/60 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-4xl animate-fadeIn">
          <div className="mb-6 inline-block bg-[#8b5e3c]/30 backdrop-blur-md px-6 py-2 rounded-full border border-white/40">
            <span className="text-white font-bold tracking-[0.2em] text-[10px] uppercase">Florença • Itália</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-serif text-white mb-6 drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
            Firenze, Amore Mio
          </h1>
          <p className="text-xl md:text-3xl text-white font-light italic max-w-2xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
            "Compartilhe conosco esse sonho renascentista."
          </p>
        </div>
      </header>

      {/* Intro Section */}
      <section className="py-24 bg-[#fdfbf7] text-center px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 text-[#8b5e3c] opacity-60">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-4xl md:text-5xl font-serif text-[#3d2b1f] mb-8">Nossa Lista de Presentes</h2>
          <p className="text-lg text-gray-600 leading-relaxed font-light">
            Sua presença é o nosso maior presente, mas se desejar nos agraciar com um gesto especial para nossa lua de mel, 
            escolhemos alguns momentos que sonhamos viver em Florença.
          </p>
          
          <div className="w-32 h-[1px] bg-[#8b5e3c] mx-auto opacity-40 mt-8"></div>
        </div>
      </section>

      {/* Gifts Grid */}
      <main className="container mx-auto px-4 pb-40">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {GIFT_OPTIONS.map((gift) => (
            <GiftCard 
              key={gift.id} 
              gift={gift} 
              onSelect={(g) => setSelectedGift(g)} 
              onSelectGallery={(g) => setGalleryGift(g)}
            />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#3d2b1f] text-white py-24 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-2xl font-serif mb-6 italic opacity-80">Com carinho,</h3>
          <p className="text-6xl md:text-7xl font-serif mb-10 text-[#e6d5c3]">Yosha & Mark</p>
          <div className="flex justify-center gap-6 mb-12 opacity-40">
            <span className="w-16 h-[1px] bg-white self-center"></span>
            <span className="text-[10px] uppercase tracking-[0.4em]">Grazie Mille</span>
            <span className="w-16 h-[1px] bg-white self-center"></span>
          </div>
          <p className="text-xs text-white/40 italic font-light tracking-wide uppercase">
            "A vida é uma combinação de magia e massa." – Federico Fellini
          </p>
        </div>
      </footer>

      {/* Modals */}
      {selectedGift && (
        <PixModal 
          gift={selectedGift} 
          onClose={() => setSelectedGift(null)} 
        />
      )}
      {galleryGift && (
        <GalleryModal 
          allGifts={GIFT_OPTIONS}
          startingGiftIndex={GIFT_OPTIONS.findIndex(g => g.id === galleryGift.id)}
          onClose={() => setGalleryGift(null)} 
        />
      )}
    </div>
  );
};

export default PresentesPage;
