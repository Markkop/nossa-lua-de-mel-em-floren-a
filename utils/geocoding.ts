// Google Geocoding API with localStorage caching

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const CACHE_KEY = 'geocoding_cache';
const CACHE_VERSION = 'v1';

export interface GeocodedLocation {
  lat: number;
  lng: number;
  formattedAddress?: string;
  geocodedAt: number;
}

interface GeocodeCache {
  version: string;
  entries: Record<string, GeocodedLocation>;
}

interface GoogleGeocodingResult {
  results: Array<{
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    formatted_address: string;
  }>;
  status: string;
}

/**
 * Load geocoding cache from localStorage
 */
function loadCache(): GeocodeCache {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as GeocodeCache;
      // Invalidate cache if version mismatch
      if (parsed.version === CACHE_VERSION) {
        return parsed;
      }
    }
  } catch {
    // Invalid cache, start fresh
  }
  return { version: CACHE_VERSION, entries: {} };
}

/**
 * Save geocoding cache to localStorage
 */
function saveCache(cache: GeocodeCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage might be full or disabled
    console.warn('Failed to save geocoding cache to localStorage');
  }
}

/**
 * Normalize address for consistent cache keys
 */
function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/,\s*/g, ', ');
}

/**
 * Get cached location for an address
 */
export function getCachedLocation(address: string): GeocodedLocation | null {
  const cache = loadCache();
  const key = normalizeAddress(address);
  return cache.entries[key] || null;
}

/**
 * Geocode an address using Google Geocoding API
 */
export async function geocodeAddress(address: string): Promise<GeocodedLocation | null> {
  // Check cache first
  const cached = getCachedLocation(address);
  if (cached) {
    console.log(`[Geocoding] Cache hit for: ${address}`);
    return cached;
  }

  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('[Geocoding] No API key available');
    return null;
  }

  try {
    console.log(`[Geocoding] Fetching: ${address}`);
    
    // Add Florianópolis, SC, Brazil context for better results
    const fullAddress = address.includes('Florianópolis') 
      ? address 
      : `${address}, Florianópolis, SC, Brazil`;
    
    const encodedAddress = encodeURIComponent(fullAddress);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}&region=br&language=pt-BR`;
    
    const response = await fetch(url);
    const data: GoogleGeocodingResult = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      const location: GeocodedLocation = {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
        geocodedAt: Date.now(),
      };
      
      // Save to cache
      const cache = loadCache();
      cache.entries[normalizeAddress(address)] = location;
      saveCache(cache);
      
      console.log(`[Geocoding] Success: ${address} -> ${location.lat}, ${location.lng}`);
      return location;
    } else {
      console.warn(`[Geocoding] No results for: ${address}`, data.status);
      return null;
    }
  } catch (error) {
    console.error(`[Geocoding] Error for: ${address}`, error);
    return null;
  }
}

/**
 * Geocode multiple addresses in parallel with rate limiting
 */
export async function geocodeAddresses(
  addresses: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, GeocodedLocation | null>> {
  const results = new Map<string, GeocodedLocation | null>();
  const total = addresses.length;
  let completed = 0;
  
  // Process in batches of 5 to avoid rate limiting
  const batchSize = 5;
  
  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(async (address) => {
        const location = await geocodeAddress(address);
        completed++;
        onProgress?.(completed, total);
        return { address, location };
      })
    );
    
    for (const { address, location } of batchResults) {
      results.set(address, location);
    }
    
    // Small delay between batches to avoid rate limiting
    if (i + batchSize < addresses.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

/**
 * Clear the geocoding cache
 */
export function clearGeocodeCache(): void {
  localStorage.removeItem(CACHE_KEY);
  console.log('[Geocoding] Cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { entries: number; addresses: string[] } {
  const cache = loadCache();
  const addresses = Object.keys(cache.entries);
  return {
    entries: addresses.length,
    addresses,
  };
}
