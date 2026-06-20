export interface PhotoGalleryPhoto {
  id: string;
  filename: string;
  camera: 'Canon EOS R6m2' | 'Canon EOS R6';
  width: number;
  height: number;
  bytes: number;
  pathname: string;
  thumbnailBytes: number;
  thumbnailPathname: string;
}

export interface PhotoGallerySection {
  id: 'camera-1' | 'camera-2';
  title: string;
  camera: PhotoGalleryPhoto['camera'];
  count: number;
  photos: PhotoGalleryPhoto[];
}

export interface PhotoGalleryManifest {
  version: string;
  generatedAt: string;
  total: number;
  totalBytes: number;
  sections: PhotoGallerySection[];
}
