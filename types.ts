
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
