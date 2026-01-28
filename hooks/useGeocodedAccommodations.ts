import { useState, useEffect, useMemo } from 'react';
import { Accommodation } from '../types';
import { geocodeAddress, getCachedLocation, GeocodedLocation } from '../utils/geocoding';

// Set to false to use hardcoded coordinates from accommodations.ts
// Set to true to enable Google Geocoding API
const USE_GEOCODING = false;

export interface GeocodingState {
  isLoading: boolean;
  progress: number;
  total: number;
  error: string | null;
  failedCount: number;
}

export interface UseGeocodedAccommodationsResult {
  accommodations: Accommodation[];
  geocodingState: GeocodingState;
  venueCenter: { lat: number; lng: number } | null;
}

/**
 * Hook to geocode accommodation addresses with caching
 * Returns accommodations with updated coordinates from Google Geocoding API
 */
export function useGeocodedAccommodations(
  originalAccommodations: Accommodation[]
): UseGeocodedAccommodationsResult {
  // When geocoding is disabled, return original accommodations immediately
  if (!USE_GEOCODING) {
    const venue = originalAccommodations.find(a => a.isVenue);
    return {
      accommodations: originalAccommodations,
      geocodingState: {
        isLoading: false,
        progress: originalAccommodations.length,
        total: originalAccommodations.length,
        error: null,
        failedCount: 0,
      },
      venueCenter: venue ? { lat: venue.lat, lng: venue.lng } : null,
    };
  }

  const [geocodedCoords, setGeocodedCoords] = useState<Map<string, GeocodedLocation>>(new Map());
  const [state, setState] = useState<GeocodingState>({
    isLoading: true,
    progress: 0,
    total: originalAccommodations.length,
    error: null,
    failedCount: 0,
  });

  useEffect(() => {
    let isMounted = true;
    
    async function geocodeAll() {
      const coordsMap = new Map<string, GeocodedLocation>();
      let completed = 0;
      let failed = 0;
      const total = originalAccommodations.length;
      
      // First pass: check cache for all addresses
      const needsGeocoding: Accommodation[] = [];
      
      for (const accom of originalAccommodations) {
        const cached = getCachedLocation(accom.address);
        if (cached) {
          coordsMap.set(accom.id, cached);
          completed++;
        } else {
          needsGeocoding.push(accom);
        }
      }
      
      // Update state with cached results
      if (isMounted) {
        setGeocodedCoords(new Map(coordsMap));
        setState(prev => ({ 
          ...prev, 
          progress: completed, 
          isLoading: needsGeocoding.length > 0 
        }));
      }
      
      // If all from cache, we're done
      if (needsGeocoding.length === 0) {
        if (isMounted) {
          setState(prev => ({ ...prev, isLoading: false }));
        }
        return;
      }
      
      // Second pass: geocode addresses not in cache
      for (const accom of needsGeocoding) {
        if (!isMounted) break;
        
        try {
          const location = await geocodeAddress(accom.address);
          if (location && isMounted) {
            coordsMap.set(accom.id, location);
            setGeocodedCoords(new Map(coordsMap));
          } else {
            // Geocoding returned null (failed)
            failed++;
          }
          completed++;
          
          if (isMounted) {
            setState(prev => ({ ...prev, progress: completed, failedCount: failed }));
          }
        } catch (error) {
          console.error(`Failed to geocode ${accom.name}:`, error);
          completed++;
          failed++;
          if (isMounted) {
            setState(prev => ({ ...prev, progress: completed, failedCount: failed }));
          }
        }
        
        // Small delay to avoid rate limiting
        if (needsGeocoding.indexOf(accom) < needsGeocoding.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }
      
      if (isMounted) {
        const errorMsg = failed > 0 
          ? `Geocoding falhou para ${failed} endereço(s). Verifique se a Geocoding API está habilitada no Google Cloud Console.`
          : null;
        setState(prev => ({ ...prev, isLoading: false, error: errorMsg }));
      }
    }
    
    geocodeAll();
    
    return () => {
      isMounted = false;
    };
  }, [originalAccommodations]);

  // Merge geocoded coordinates with original accommodations
  const accommodations = useMemo(() => {
    return originalAccommodations.map(accom => {
      const geocoded = geocodedCoords.get(accom.id);
      if (geocoded) {
        return {
          ...accom,
          lat: geocoded.lat,
          lng: geocoded.lng,
        };
      }
      return accom;
    });
  }, [originalAccommodations, geocodedCoords]);

  // Find venue center from geocoded venue
  const venueCenter = useMemo(() => {
    const venue = accommodations.find(a => a.isVenue);
    if (venue) {
      return { lat: venue.lat, lng: venue.lng };
    }
    return null;
  }, [accommodations]);

  return {
    accommodations,
    geocodingState: state,
    venueCenter,
  };
}
