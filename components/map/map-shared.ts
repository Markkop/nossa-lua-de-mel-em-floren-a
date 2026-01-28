import { Accommodation, AccommodationCluster } from '../../types';

// Map provider configuration - change this flag to switch providers
// 'leaflet' = OpenStreetMap (free, no API key required)
// 'google' = Google Maps (requires VITE_GOOGLE_MAPS_API_KEY with Maps JavaScript API enabled)
export type MapProvider = 'google' | 'leaflet';
export const MAP_PROVIDER: MapProvider = 'google';

// Haute Haus coordinates (wedding venue)
export const VENUE_CENTER = {
  lat: -27.5954,
  lng: -48.4580,
};

export const DEFAULT_ZOOM = 14;

// Color scheme for clusters
export const CLUSTER_COLORS: Record<AccommodationCluster, string> = {
  venue: '#d4a574',      // Gold - Wedding venue
  osni_ortiga: '#22c55e', // Green - Walk to venue
  centro: '#3b82f6',      // Blue - Urban area
  rendeiras: '#f97316',   // Orange - Tourist zone
  retiro: '#8b5cf6',      // Purple - Retreat/quiet
};

export const CLUSTER_LABELS: Record<AccommodationCluster, string> = {
  venue: '',
  osni_ortiga: '',
  centro: '',
  rendeiras: '',
  retiro: 'Retiro / Paz',
};

export function getMarkerColor(cluster: AccommodationCluster): string {
  return CLUSTER_COLORS[cluster];
}

export function getClusterLabel(cluster: AccommodationCluster): string {
  return CLUSTER_LABELS[cluster];
}

export interface MapViewProps {
  accommodations: Accommodation[];
  selectedId: string | null;
  center: { lat: number; lng: number };
  onSelectAccommodation: (id: string | null) => void;
}
