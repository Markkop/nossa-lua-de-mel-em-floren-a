import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapViewProps, DEFAULT_ZOOM } from './map-shared';
import { Accommodation } from '../../types';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

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

// Fix for default marker icons in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Lucide Star SVG path - yellow color
function createStarSvg(size: number): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
      <polygon fill="#fbbf24" stroke="black" stroke-width="1.5" stroke-linejoin="round" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  `;
}

// Lucide Heart SVG path - pink color for venue
function createHeartSvg(size: number): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
      <path fill="#ec4899" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
  `;
}

function createMarkerIcon(isVenue: boolean = false): L.DivIcon {
  const size = isVenue ? 36 : 28;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        ${isVenue ? 'animation: pulse 2s infinite;' : ''}
      ">
        ${isVenue ? createHeartSvg(size) : createStarSvg(size)}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// Component to fly to selected marker
function FlyToMarker({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.flyTo([lat, lng], 16, { duration: 0.5 });
  }, [lat, lng, map]);
  
  return null;
}

const LeafletMapView: React.FC<MapViewProps> = ({
  accommodations,
  selectedId,
  center,
  onSelectAccommodation,
}) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <div className="h-[600px] bg-gray-100 rounded-2xl flex items-center justify-center">
        <span className="text-gray-500">Carregando mapa...</span>
      </div>
    );
  }
  
  const selectedAccom = selectedId 
    ? accommodations.find(a => a.id === selectedId) 
    : null;
  
  return (
    <>
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(212, 165, 116, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(212, 165, 116, 0); }
          100% { box-shadow: 0 0 0 0 rgba(212, 165, 116, 0); }
        }
        .leaflet-container {
          font-family: 'Lato', sans-serif;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .leaflet-popup-content {
          margin: 0;
        }
      `}</style>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={DEFAULT_ZOOM}
        className="h-[600px] rounded-2xl shadow-lg z-0"
        style={{ zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {selectedAccom && (
          <FlyToMarker lat={selectedAccom.lat} lng={selectedAccom.lng} />
        )}
        
        {accommodations.map((accom) => (
          <Marker
            key={accom.id}
            position={[accom.lat, accom.lng]}
            icon={createMarkerIcon(accom.isVenue)}
            eventHandlers={{
              click: () => onSelectAccommodation(accom.id),
            }}
          >
            <Popup>
              <div className="min-w-[200px] max-w-[280px] p-3">
                <h3 className="font-bold text-[#3d2b1f] text-sm mb-1">
                  {accom.name}
                  {accom.id !== 'haute-haus' && accom.rating && (
                    <> (<span className="text-yellow-500">★</span> {accom.rating})</>
                  )}
                  {accom.id !== 'haute-haus' && (
                    <> {' '}{getCarTime(accom.distanceToVenue)}</>
                  )}
                </h3>
                <p className="text-xs text-gray-500 mb-2">{accom.address}</p>
                
                <div className="flex gap-2">
                  {accom.bookingUrl && (
                    <a
                      href={accom.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center text-xs bg-[#8b5e3c] text-white py-1.5 rounded-lg hover:bg-[#6d4a2f] transition-colors"
                    >
                      Ver no Booking
                    </a>
                  )}
                  <a
                    href={getGoogleMapsLink(accom.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center text-xs border border-[#8b5e3c] text-[#8b5e3c] py-1.5 rounded-lg hover:bg-[#8b5e3c] hover:text-white transition-colors"
                  >
                    Google Maps
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );
};

export default LeafletMapView;
