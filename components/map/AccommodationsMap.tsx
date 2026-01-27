import React, { useState, lazy, Suspense } from 'react';
import { Accommodation } from '../../types';
import { MAP_PROVIDER, CLUSTER_COLORS, CLUSTER_LABELS, MapProvider, VENUE_CENTER } from './map-shared';

// Lazy load map components
const GoogleMapsView = lazy(() => import('./GoogleMapsView'));
const LeafletMapView = lazy(() => import('./LeafletMapView'));

interface AccommodationsMapProps {
  accommodations: Accommodation[];
  venueCenter?: { lat: number; lng: number } | null;
  onSelectAccommodation?: (id: string | null) => void;
}

const MapLoadingFallback: React.FC = () => (
  <div className="h-[400px] bg-gray-100 rounded-2xl flex items-center justify-center animate-pulse">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-[#8b5e3c] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <span className="text-gray-500">Carregando mapa...</span>
    </div>
  </div>
);

const Legend: React.FC = () => (
  <div className="flex flex-wrap gap-3 justify-center mt-4">
    {(Object.keys(CLUSTER_COLORS) as Array<keyof typeof CLUSTER_COLORS>).map((cluster) => (
      <div key={cluster} className="flex items-center gap-2">
        <div 
          className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
          style={{ backgroundColor: CLUSTER_COLORS[cluster] }}
        />
        <span className="text-xs text-gray-600">{CLUSTER_LABELS[cluster]}</span>
      </div>
    ))}
  </div>
);

const AccommodationsMap: React.FC<AccommodationsMapProps> = ({
  accommodations,
  venueCenter: propVenueCenter,
  onSelectAccommodation,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [provider] = useState<MapProvider>(MAP_PROVIDER);
  
  // Use geocoded venue center if available, otherwise fall back to default
  const mapCenter = propVenueCenter || VENUE_CENTER;
  
  const handleSelectAccommodation = (id: string | null) => {
    setSelectedId(id);
    onSelectAccommodation?.(id);
  };
  
  const mapProps = {
    accommodations,
    selectedId,
    center: mapCenter,
    onSelectAccommodation: handleSelectAccommodation,
  };
  
  return (
    <div className="w-full">
      <Suspense fallback={<MapLoadingFallback />}>
        {provider === 'google' ? (
          <GoogleMapsView {...mapProps} />
        ) : (
          <LeafletMapView {...mapProps} />
        )}
      </Suspense>
      <Legend />
    </div>
  );
};

export default AccommodationsMap;
