
export interface GalleryItem {
  imageUrl: string;
  caption: string;
  emoji?: string;
}

export interface GiftOption {
  id: number;
  title: string;
  description: string;
  amount: number;
  imageUrl: string;
  gallery: GalleryItem[];
}

export type AccommodationCluster = 'venue' | 'osni_ortiga' | 'centro' | 'rendeiras' | 'retiro';

export interface Accommodation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceToVenue: string;
  needsCar: boolean;
  rating: number | null;
  ratingLabel: string | null;
  priceRange: string | null;
  imageUrl: string;
  bookingUrl: string | null;
  phone: string | null;
  amenities: string[];
  idealFor: string;
  vibe: string;
  description: string;
  cluster: AccommodationCluster;
  isVenue?: boolean;
}
