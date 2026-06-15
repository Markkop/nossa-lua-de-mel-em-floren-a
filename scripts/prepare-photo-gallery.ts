import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { list, put } from '@vercel/blob';
import exifr from 'exifr';
import sharp from 'sharp';

import type {
  PhotoGalleryManifest,
  PhotoGalleryPhoto,
  PhotoGallerySection,
} from '../data/photo-gallery-types.js';

const SOURCE_DIRECTORY =
  process.env.PHOTO_SOURCE_DIRECTORY ??
  path.join(process.env.HOME ?? '', 'Downloads', 'Casamento Yoshark 18.04.26');
const CACHE_DIRECTORY = path.resolve('.photo-gallery-cache/v1');
const MANIFEST_PATH = path.resolve('data/photo-gallery-manifest.ts');
const VERSION = 'wedding-gallery/v1';
const MAX_TOTAL_BYTES = 900 * 1024 * 1024;
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 78;

const CAMERA_CONFIG = {
  'Canon EOS R6m2': { sectionId: 'camera-1', title: 'Câmera 1', slug: 'r6m2', expected: 915 },
  'Canon EOS R6': { sectionId: 'camera-2', title: 'Câmera 2', slug: 'r6', expected: 364 },
} as const;

type CameraModel = keyof typeof CAMERA_CONFIG;

function numericFilenameOrder(filename: string): number {
  const match = filename.match(/(\d+)/);
  if (!match) throw new Error(`Nome sem sequência numérica: ${filename}`);
  return Number(match[1]);
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  worker: (value: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < values.length) {
      const index = nextIndex++;
      results[index] = await worker(values[index], index);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, runWorker));
  return results;
}

async function readCameraModel(filePath: string): Promise<CameraModel> {
  const exif = await exifr.parse(filePath, ['Model']);
  const model = exif?.Model;
  if (model !== 'Canon EOS R6m2' && model !== 'Canon EOS R6') {
    throw new Error(`Câmera não reconhecida em ${path.basename(filePath)}: ${String(model)}`);
  }
  return model;
}

async function processPhoto(filename: string, index: number): Promise<PhotoGalleryPhoto> {
  const sourcePath = path.join(SOURCE_DIRECTORY, filename);
  const camera = await readCameraModel(sourcePath);
  const config = CAMERA_CONFIG[camera];
  const sequence = numericFilenameOrder(filename);
  const paddedSequence = String(sequence).padStart(4, '0');
  const id = `${config.slug}-${paddedSequence}`;
  const pathname = `${VERSION}/${config.slug}/${paddedSequence}.jpg`;
  const outputPath = path.join(CACHE_DIRECTORY, config.slug, `${paddedSequence}.jpg`);

  await mkdir(path.dirname(outputPath), { recursive: true });

  const result = await sharp(sourcePath)
    .autoOrient()
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({
      quality: JPEG_QUALITY,
      progressive: true,
      mozjpeg: true,
    })
    .toFile(outputPath);

  if ((index + 1) % 50 === 0 || index === 0) {
    console.log(`Processadas ${index + 1} fotos...`);
  }

  return {
    id,
    filename,
    camera,
    width: result.width,
    height: result.height,
    bytes: result.size,
    pathname,
  };
}

async function getExistingPathnames(): Promise<Set<string>> {
  const existing = new Set<string>();
  let cursor: string | undefined;

  do {
    const page = await list({ prefix: `${VERSION}/`, limit: 1000, cursor });
    page.blobs.forEach((blob) => existing.add(blob.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return existing;
}

async function uploadPhotos(photos: PhotoGalleryPhoto[]) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN não está configurado.');
  }

  const existing = await getExistingPathnames();
  let uploaded = 0;
  let skipped = 0;

  await mapWithConcurrency(photos, 4, async (photo) => {
    if (existing.has(photo.pathname)) {
      skipped++;
      return;
    }

    const config = CAMERA_CONFIG[photo.camera];
    const filePath = path.join(CACHE_DIRECTORY, config.slug, `${photo.id.split('-').at(-1)}.jpg`);
    await put(photo.pathname, await readFile(filePath), {
      access: 'private',
      contentType: 'image/jpeg',
      cacheControlMaxAge: 31_536_000,
      addRandomSuffix: false,
    });
    uploaded++;
    if (uploaded % 50 === 0 || uploaded === 1) {
      console.log(`Enviadas ${uploaded} fotos ao Blob...`);
    }
  });

  console.log(`Upload concluído: ${uploaded} novas, ${skipped} já existentes.`);
}

function buildSections(photos: PhotoGalleryPhoto[]): PhotoGallerySection[] {
  return (Object.entries(CAMERA_CONFIG) as [CameraModel, (typeof CAMERA_CONFIG)[CameraModel]][]).map(
    ([camera, config]) => {
      const cameraPhotos = photos
        .filter((photo) => photo.camera === camera)
        .sort((a, b) => numericFilenameOrder(a.filename) - numericFilenameOrder(b.filename));

      if (cameraPhotos.length !== config.expected) {
        throw new Error(
          `${camera}: esperado ${config.expected}, encontrado ${cameraPhotos.length}.`,
        );
      }

      return {
        id: config.sectionId,
        title: config.title,
        camera,
        count: cameraPhotos.length,
        photos: cameraPhotos,
      };
    },
  );
}

function serializeManifest(manifest: PhotoGalleryManifest): string {
  return `import type { PhotoGalleryManifest } from './photo-gallery-types.js';

const manifest: PhotoGalleryManifest = ${JSON.stringify(manifest, null, 2)};

export default manifest;
`;
}

async function main() {
  const filenames = (await readdir(SOURCE_DIRECTORY))
    .filter((filename) => /^JPG-\d+\.jpg$/i.test(filename))
    .sort((a, b) => numericFilenameOrder(a) - numericFilenameOrder(b));

  if (filenames.length !== 1279) {
    throw new Error(`Esperadas 1279 fotos, encontradas ${filenames.length}.`);
  }

  await mkdir(CACHE_DIRECTORY, { recursive: true });
  const photos = await mapWithConcurrency(filenames, 4, processPhoto);
  const sections = buildSections(photos);
  const totalBytes = photos.reduce((sum, photo) => sum + photo.bytes, 0);

  if (totalBytes > MAX_TOTAL_BYTES) {
    throw new Error(
      `Derivados ocupam ${(totalBytes / 1024 / 1024).toFixed(1)} MB, acima do limite de 900 MB.`,
    );
  }

  const manifest: PhotoGalleryManifest = {
    version: VERSION,
    generatedAt: new Date().toISOString(),
    total: photos.length,
    totalBytes,
    sections,
  };

  await writeFile(MANIFEST_PATH, serializeManifest(manifest), 'utf8');
  console.log(`Manifesto gerado: ${manifest.total} fotos, ${(totalBytes / 1024 / 1024).toFixed(1)} MB.`);
  await uploadPhotos(photos);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
