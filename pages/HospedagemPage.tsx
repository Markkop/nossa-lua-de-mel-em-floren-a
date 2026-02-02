import React, { useState } from 'react';
import { ACCOMMODATIONS } from '../accommodations';
import AccommodationsMap from '../components/map/AccommodationsMap';
import { useGeocodedAccommodations } from '../hooks/useGeocodedAccommodations';

// Helper function to parse distance string to km
const parseDistanceToKm = (distance: string): number => {
  const cleaned = distance.replace('~', '').trim();
  if (cleaned.includes('km')) {
    return parseFloat(cleaned.replace('km', ''));
  } else if (cleaned.includes('m')) {
    return parseFloat(cleaned.replace('m', '')) / 1000;
  }
  return 0;
};

// Helper function to format distance in km
const formatDistanceKm = (distance: string): string => {
  const km = parseDistanceToKm(distance);
  if (km < 1) {
    return `${(km * 1000).toFixed(0)} m`;
  }
  return `${km.toFixed(1)} km`;
};

// Helper function to calculate approximate driving time
const getDrivingTime = (distance: string, needsCar: boolean): string => {
  if (!needsCar) return '-';
  const km = parseDistanceToKm(distance);
  // Approximate 2 min per km in beach town traffic
  const minutes = Math.max(2, Math.round(km * 2));
  return `${minutes} min`;
};

// Helper function to generate Google Maps URL
const getGoogleMapsUrl = (lat: number, lng: number, address: string): string => {
  return `https://www.google.com/maps?q=${lat},${lng}&hl=pt-BR`;
};

const HospedagemPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Geocode accommodations with browser caching
  const { accommodations, geocodingState, venueCenter } = useGeocodedAccommodations(ACCOMMODATIONS);
  
  const handleSelectAccommodation = (id: string | null) => {
    setSelectedId(id);
  };
  
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
            Selecionamos a dedo opções de hospedagem próximas à <strong className="text-[#8b5e3c]">Haute Haus</strong> para todos os estilos.
          </p>
          
          <div className="w-32 h-[1px] bg-[#8b5e3c] mx-auto opacity-40"></div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-12 bg-[#fdfbf7] px-4">
        <div className="max-w-4xl mx-auto">
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

      {/* Accommodations Table Section */}
      <section className="py-12 bg-[#fdfbf7] px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-serif text-[#3d2b1f] mb-2">Comparativo</h3>
            <p className="text-sm text-gray-500">Visão geral das opções de hospedagem</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#8b5e3c]/20">
                  <th className="text-left py-3 px-4 text-[#3d2b1f] font-serif font-normal text-sm">Nome</th>
                  <th className="text-center py-3 px-4 text-[#3d2b1f] font-serif font-normal text-sm">Distância</th>
                  <th className="text-center py-3 px-4 text-[#3d2b1f] font-serif font-normal text-sm">Tempo de carro</th>
                  <th className="text-center py-3 px-4 text-[#3d2b1f] font-serif font-normal text-sm">Preço</th>
                </tr>
              </thead>
              <tbody>
                {ACCOMMODATIONS.filter(acc => !acc.isVenue).map((acc) => (
                  <tr 
                    key={acc.id} 
                    className="border-b border-[#8b5e3c]/10 hover:bg-[#8b5e3c]/5 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <a 
                        href={acc.mapsUrl || getGoogleMapsUrl(acc.lat, acc.lng, acc.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#8b5e3c] hover:underline font-medium text-sm"
                      >
                        {acc.name}
                      </a>
                    </td>
                    <td className="text-center py-3 px-4 text-gray-600 text-sm">
                      {formatDistanceKm(acc.distanceToVenue)}
                    </td>
                    <td className="text-center py-3 px-4 text-gray-600 text-sm">
                      {getDrivingTime(acc.distanceToVenue, acc.needsCar)}
                    </td>
                    <td className="text-center py-3 px-4 text-[#8b5e3c] text-sm font-medium">
                      {acc.priceRange}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        </div>
      </footer>
    </div>
  );
};

export default HospedagemPage;
