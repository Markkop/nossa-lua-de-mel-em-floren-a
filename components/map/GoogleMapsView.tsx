import React, { useState, useCallback } from 'react';
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import { MapViewProps, DEFAULT_ZOOM } from './map-shared';
import { Accommodation } from '../../types';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Convert distance string to approximate car time
function getCarTime(distance: string): string {
  if (distance === '0m') return '0min';
  if (distance.includes('~150m') || distance.includes('150m')) return '1min';
  if (distance.includes('~1.6km') || distance.includes('1.6km')) return '3-4min';
  if (distance.includes('~2.5km') || distance.includes('2.5km')) return '5-6min';
  if (distance.includes('~3km') || distance.includes('3km')) return '6-8min';
  if (distance.includes('~4km') || distance.includes('4km')) return '8-10min';
  // Fallback: try to extract km and estimate
  const kmMatch = distance.match(/(\d+\.?\d*)km/);
  if (kmMatch) {
    const km = parseFloat(kmMatch[1]);
    const minutes = Math.round(km * 2.5); // ~2.5 min per km average
    return `~${minutes}min`;
  }
  return distance; // Fallback to original if can't parse
}

// Get Google Maps link for accommodation
function getGoogleMapsLink(accommodationId: string): string {
  const links: Record<string, string> = {
    'casa-da-lagoa': 'https://maps.app.goo.gl/PM4rvxds1K3YUgxz6',
    'hotel-hola': 'https://maps.app.goo.gl/NxTzHVKCvHqSMav36',
    'quintal-verde': 'https://maps.app.goo.gl/DYgLHosPyoANS42a8',
    'essencia-do-sol': 'https://maps.app.goo.gl/YvG6QCtE1hqD5oiv9',
    'lembranca': 'https://maps.app.goo.gl/JNKEQH4if16sXQda8',
    'dunas-do-sol': 'https://maps.app.goo.gl/xvPDZSi44L5u7jU89',
    'santarina': 'https://maps.app.goo.gl/8uo5jH886jrzX2nz5',
    'jardim-da-lagoa': 'https://maps.app.goo.gl/vUfYdy4HQSQX5hFK7',
    'haute-haus': 'https://maps.app.goo.gl/FePoCexAFYUSDUXY9',
  };
  return links[accommodationId] || `https://www.google.com/maps?q=${accommodationId}`;
}

interface InfoContentProps {
  accommodation: Accommodation;
}

const InfoContent: React.FC<InfoContentProps> = ({ accommodation }) => (
  <div className="min-w-[200px] max-w-[280px] p-1">
    <h3 className="font-bold text-[#3d2b1f] text-sm mb-1">
      {accommodation.name}
      {accommodation.rating && (
        <> (<span className="text-yellow-500">★</span> {accommodation.rating})</>
      )}
      {' '}
      {getCarTime(accommodation.distanceToVenue)}
    </h3>
    <p className="text-xs text-gray-500 mb-2">{accommodation.address}</p>
    
    <div className="flex gap-2">
      {accommodation.bookingUrl && (
        <a
          href={accommodation.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center text-xs bg-[#8b5e3c] text-white py-1.5 rounded-lg hover:bg-[#6d4a2f] transition-colors"
        >
          Ver no Booking
        </a>
      )}
      <a
        href={getGoogleMapsLink(accommodation.id)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-center text-xs border border-[#8b5e3c] text-[#8b5e3c] py-1.5 rounded-lg hover:bg-[#8b5e3c] hover:text-white transition-colors"
      >
        Google Maps
      </a>
    </div>
  </div>
);

// Create a Star marker SVG URL (Lucide Star icon) - yellow color
function createStarMarkerUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
    <polygon fill="#fbbf24" stroke="black" stroke-width="1.5" stroke-linejoin="round" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// Create a Heart marker SVG URL (Lucide Heart icon) - pink color for venue
function createHeartMarkerUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
    <path fill="#ec4899" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const GoogleMapsView: React.FC<MapViewProps> = ({
  accommodations,
  selectedId,
  center,
  onSelectAccommodation,
}) => {
  const [infoWindowAccom, setInfoWindowAccom] = useState<Accommodation | null>(null);
  
  const handleMarkerClick = useCallback((accom: Accommodation) => {
    setInfoWindowAccom(accom);
    onSelectAccommodation(accom.id);
  }, [onSelectAccommodation]);
  
  const handleInfoWindowClose = useCallback(() => {
    setInfoWindowAccom(null);
    onSelectAccommodation(null);
  }, [onSelectAccommodation]);
  
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="h-[600px] bg-gray-100 rounded-2xl flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Google Maps API Key não configurada.</p>
          <p className="text-sm text-gray-500">
            Adicione VITE_GOOGLE_MAPS_API_KEY ao seu arquivo .env
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} region="BR" language="pt-BR">
      <Map
        defaultCenter={center}
        defaultZoom={DEFAULT_ZOOM}
        className="h-[600px] rounded-2xl shadow-lg"
        gestureHandling="cooperative"
        disableDefaultUI={false}
        zoomControl={true}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={true}
      >
        {accommodations.map((accom) => (
          <Marker
            key={accom.id}
            position={{ lat: accom.lat, lng: accom.lng }}
            onClick={() => handleMarkerClick(accom)}
            icon={{
              url: accom.isVenue 
                ? createHeartMarkerUrl()
                : createStarMarkerUrl(),
              scaledSize: accom.isVenue ? { width: 36, height: 36 } : { width: 28, height: 28 },
              anchor: accom.isVenue ? { x: 18, y: 18 } : { x: 14, y: 14 },
            }}
            title={accom.name}
          />
        ))}
        
        {infoWindowAccom && (
          <InfoWindow
            position={{ lat: infoWindowAccom.lat, lng: infoWindowAccom.lng }}
            onCloseClick={handleInfoWindowClose}
            pixelOffset={[0, -36]}
          >
            <InfoContent accommodation={infoWindowAccom} />
          </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
};

export default GoogleMapsView;
