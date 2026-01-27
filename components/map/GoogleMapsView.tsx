import React, { useState, useCallback } from 'react';
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import { MapViewProps, DEFAULT_ZOOM, getMarkerColor, getClusterLabel } from './map-shared';
import { Accommodation } from '../../types';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

interface InfoContentProps {
  accommodation: Accommodation;
}

const InfoContent: React.FC<InfoContentProps> = ({ accommodation }) => (
  <div className="min-w-[200px] max-w-[280px] p-1">
    <img 
      src={accommodation.imageUrl} 
      alt={accommodation.name}
      className="w-full h-24 object-cover rounded-lg mb-3"
    />
    <h3 className="font-bold text-[#3d2b1f] text-sm mb-1">{accommodation.name}</h3>
    <p className="text-xs text-gray-500 mb-2">{accommodation.address}</p>
    
    <div className="flex items-center gap-2 mb-2">
      <span 
        className="text-xs px-2 py-0.5 rounded-full text-white"
        style={{ backgroundColor: getMarkerColor(accommodation.cluster) }}
      >
        {getClusterLabel(accommodation.cluster)}
      </span>
      <span className="text-xs text-gray-600">{accommodation.distanceToVenue}</span>
    </div>
    
    {accommodation.rating && (
      <div className="flex items-center gap-1 mb-2">
        <span className="text-yellow-500">★</span>
        <span className="text-xs font-semibold">{accommodation.rating}</span>
        <span className="text-xs text-gray-500">{accommodation.ratingLabel}</span>
      </div>
    )}
    
    <div className="flex flex-wrap gap-1 mb-3">
      {accommodation.amenities.slice(0, 3).map((amenity, idx) => (
        <span key={idx} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded">
          {amenity}
        </span>
      ))}
    </div>
    
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
        href={`https://www.google.com/maps?q=${accommodation.lat},${accommodation.lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-center text-xs border border-[#8b5e3c] text-[#8b5e3c] py-1.5 rounded-lg hover:bg-[#8b5e3c] hover:text-white transition-colors"
      >
        Google Maps
      </a>
    </div>
  </div>
);

// Create a colored pin SVG URL
function createPinUrl(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
    <path fill="${color}" stroke="white" stroke-width="2" d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 24 12 24s12-16.8 12-24C24 5.4 18.6 0 12 0z"/>
    <circle fill="white" cx="12" cy="12" r="5"/>
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
      <div className="h-[400px] bg-gray-100 rounded-2xl flex items-center justify-center p-8">
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
        className="h-[400px] rounded-2xl shadow-lg"
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
              url: createPinUrl(getMarkerColor(accom.cluster)),
              scaledSize: accom.isVenue ? { width: 32, height: 48 } : { width: 24, height: 36 },
              anchor: accom.isVenue ? { x: 16, y: 48 } : { x: 12, y: 36 },
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
