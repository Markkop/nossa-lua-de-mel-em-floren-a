import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ACCOMMODATIONS } from '../accommodations';
import AccommodationsMap from '../components/map/AccommodationsMap';
import AccommodationCard from '../components/AccommodationCard';
import { useGeocodedAccommodations } from '../hooks/useGeocodedAccommodations';

const HospedagemPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Geocode accommodations with browser caching
  const { accommodations, geocodingState, venueCenter } = useGeocodedAccommodations(ACCOMMODATIONS);
  
  const handleSelectAccommodation = (id: string | null) => {
    setSelectedId(id);
  };
  
  // Group accommodations by cluster for better organization
  const venueAccommodation = accommodations.find(a => a.isVenue);
  const otherAccommodations = accommodations.filter(a => !a.isVenue);
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="relative h-[70dvh] flex items-center justify-center text-center px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?q=80&w=2074&auto=format&fit=crop"
            alt="Lagoa da Conceição"
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
        
        {/* Back to Home Link */}
        <Link 
          to="/"
          className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Lista de Presentes</span>
        </Link>
        
        <div className="relative z-10 max-w-4xl animate-fadeIn">
          <div className="mb-6 inline-block bg-[#8b5e3c]/30 backdrop-blur-md px-6 py-2 rounded-full border border-white/40">
            <span className="text-white font-bold tracking-[0.2em] text-[10px] uppercase">Lagoa da Conceição • Florianópolis</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
            Onde Ficar
          </h1>
          <p className="text-xl md:text-2xl text-white font-light italic max-w-2xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
            "Opções de hospedagem perto da celebração."
          </p>
        </div>
      </header>

      {/* Intro Section */}
      <section className="py-16 bg-[#fdfbf7] text-center px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 text-[#8b5e3c] opacity-60">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h2 className="text-4xl md:text-5xl font-serif text-[#3d2b1f] mb-8">Hospedagens Selecionadas</h2>
          <p className="text-lg text-gray-600 leading-relaxed mb-8 font-light">
            Florianópolis é mágica, mas sua geografia requer estratégia! 
            Selecionamos a dedo opções de hospedagem próximas à <strong className="text-[#8b5e3c]">Haute Haus</strong> para todos os estilos.
          </p>
          
          {/* Golden Tip Box */}
          <div className="bg-[#d4a574]/10 border border-[#d4a574]/30 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#d4a574] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-serif text-lg text-[#3d2b1f] mb-2">Dica de Ouro</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Nossa festa acontece na <strong>Rua Vereador Osni Ortiga</strong>. 
                  Ficar nesta mesma rua (Haute Haus, Jardim da Lagoa, Dunasol) significa 
                  evitar o trânsito da Lagoa e chegar à cerimônia em minutos!
                </p>
              </div>
            </div>
          </div>
          
          <div className="w-32 h-[1px] bg-[#8b5e3c] mx-auto opacity-40"></div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-12 bg-[#fdfbf7] px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-serif text-[#3d2b1f] mb-2">Mapa Interativo</h3>
            <p className="text-sm text-gray-500">
              {geocodingState.isLoading 
                ? `Carregando coordenadas... (${geocodingState.progress}/${geocodingState.total})`
                : 'Clique nos marcadores para ver detalhes de cada hospedagem'
              }
            </p>
            {geocodingState.error && !geocodingState.isLoading && (
              <p className="text-xs text-amber-600 mt-2 bg-amber-50 inline-block px-3 py-1 rounded-full">
                ⚠️ {geocodingState.error}
              </p>
            )}
          </div>
          <AccommodationsMap 
            accommodations={accommodations}
            venueCenter={venueCenter}
            onSelectAccommodation={handleSelectAccommodation}
          />
        </div>
      </section>

      {/* Venue Card (Featured) */}
      {venueAccommodation && (
        <section className="py-12 bg-gradient-to-b from-[#fdfbf7] to-[#f5efe8] px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <span className="inline-block bg-[#d4a574]/20 text-[#8b5e3c] px-4 py-1 rounded-full text-sm font-medium mb-4">
                Local do Casamento
              </span>
              <h3 className="text-3xl font-serif text-[#3d2b1f]">Haute Haus Guest House</h3>
            </div>
            <div>
              <AccommodationCard 
                accommodation={venueAccommodation}
                isSelected={selectedId === venueAccommodation.id}
                onSelect={handleSelectAccommodation}
              />
            </div>
          </div>
        </section>
      )}

      {/* Accommodations Grid */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-serif text-[#3d2b1f] mb-4">Outras Opções de Hospedagem</h3>
          <p className="text-gray-500">Clique em um card para destacá-lo no mapa</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {otherAccommodations.map((accommodation) => (
            <div key={accommodation.id}>
              <AccommodationCard 
                accommodation={accommodation}
                isSelected={selectedId === accommodation.id}
                onSelect={handleSelectAccommodation}
              />
            </div>
          ))}
        </div>
      </main>

      {/* Transport Tips Section */}
      <section className="py-16 bg-[#f5efe8] px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="mb-6 text-[#8b5e3c] opacity-60">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h3 className="text-3xl font-serif text-[#3d2b1f] mb-4">Dicas de Transporte</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f0e6da]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h4 className="font-serif text-lg text-[#3d2b1f]">Do Aeroporto</h4>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Todas as hospedagens estão a 15-20km do Aeroporto Hercílio Luz. 
                O trajeto leva <strong>25-30 minutos</strong> sem trânsito, podendo chegar a 50-60 minutos em horário de pico.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f0e6da]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h4 className="font-serif text-lg text-[#3d2b1f]">Segurança</h4>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Para voltar da festa, recomendamos <strong>Uber ou táxis locais</strong>. 
                Se beber, não dirija! A estrada da Haute Haus é tranquila, mas possui fiscalização frequente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#3d2b1f] text-white py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-2xl font-serif mb-6 italic opacity-80">Nos vemos em breve!</h3>
          <p className="text-5xl md:text-6xl font-serif mb-8 text-[#e6d5c3]">Yosha & Mark</p>
          <div className="flex justify-center gap-6 mb-10 opacity-40">
            <span className="w-16 h-[1px] bg-white self-center"></span>
            <span className="text-[10px] uppercase tracking-[0.4em]">Florianópolis</span>
            <span className="w-16 h-[1px] bg-white self-center"></span>
          </div>
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para Lista de Presentes
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default HospedagemPage;
