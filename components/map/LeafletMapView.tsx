import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapViewProps, DEFAULT_ZOOM, getMarkerColor, getClusterLabel } from './map-shared';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function createMarkerIcon(color: string, isVenue: boolean = false): L.DivIcon {
  const size = isVenue ? 32 : 24;
  const borderWidth = isVenue ? 4 : 3;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: ${borderWidth}px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ${isVenue ? 'animation: pulse 2s infinite;' : ''}
      "></div>
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
      <div className="h-[400px] bg-gray-100 rounded-2xl flex items-center justify-center">
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
        className="h-[400px] rounded-2xl shadow-lg z-0"
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
            icon={createMarkerIcon(getMarkerColor(accom.cluster), accom.isVenue)}
            eventHandlers={{
              click: () => onSelectAccommodation(accom.id),
            }}
          >
            <Popup>
              <div className="min-w-[200px] max-w-[280px] p-3">
                <img 
                  src={accom.imageUrl} 
                  alt={accom.name}
                  className="w-full h-24 object-cover rounded-lg mb-3"
                />
                <h3 className="font-bold text-[#3d2b1f] text-sm mb-1">{accom.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{accom.address}</p>
                
                <div className="flex items-center gap-2 mb-2">
                  <span 
                    className="text-xs px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: getMarkerColor(accom.cluster) }}
                  >
                    {getClusterLabel(accom.cluster)}
                  </span>
                  <span className="text-xs text-gray-600">{accom.distanceToVenue}</span>
                </div>
                
                {accom.rating && (
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-yellow-500">★</span>
                    <span className="text-xs font-semibold">{accom.rating}</span>
                    <span className="text-xs text-gray-500">{accom.ratingLabel}</span>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {accom.amenities.slice(0, 3).map((amenity, idx) => (
                    <span key={idx} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded">
                      {amenity}
                    </span>
                  ))}
                </div>
                
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
                    href={`https://www.google.com/maps?q=${accom.lat},${accom.lng}`}
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
