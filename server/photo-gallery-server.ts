import { timingSafeEqual } from 'node:crypto';
import { Readable } from 'node:stream';

import { get } from '@vercel/blob';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { SignJWT, jwtVerify } from 'jose';

import manifest from '../data/photo-gallery-manifest.js';
import type { PhotoGalleryPhoto } from '../data/photo-gallery-types.js';

const COOKIE_NAME = 'photo_gallery_session';
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const GALLERY_PASSWORD = 'tudolindo';
const photoById = new Map(
  manifest.sections.flatMap((section) => section.photos).map((photo) => [photo.id, photo]),
);
const coverPhoto = manifest.sections.flatMap((section) => section.photos)[0];

function getJwtSecret(): Uint8Array {
  const secret = process.env.PHOTO_GALLERY_JWT_SECRET;
  if (!secret) throw new Error('PHOTO_GALLERY_JWT_SECRET não está configurado.');
  return new TextEncoder().encode(secret);
}

function passwordMatches(provided: string): boolean {
  const actual = Buffer.from(GALLERY_PASSWORD, 'utf8');
  const candidate = Buffer.from(provided, 'utf8');
  if (actual.length !== candidate.length) return false;
  return timingSafeEqual(actual, candidate);
}

function getCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [key, ...valueParts] = part.trim().split('=');
    if (key === name) return decodeURIComponent(valueParts.join('='));
  }
  return null;
}

async function hasValidSession(request: FastifyRequest): Promise<boolean> {
  const token = getCookie(request.headers.cookie, COOKIE_NAME);
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload.role === 'photo-gallery';
  } catch {
    return false;
  }
}

function isSecureRequest(request: FastifyRequest): boolean {
  const forwardedProto = request.headers['x-forwarded-proto'];
  return request.protocol === 'https' || forwardedProto === 'https';
}

function setSessionCookie(reply: FastifyReply, token: string, secure: boolean) {
  const attributes = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_SECONDS}`,
  ];
  if (secure) attributes.push('Secure');
  reply.header('Set-Cookie', attributes.join('; '));
}

function clearSessionCookie(reply: FastifyReply, secure: boolean) {
  const attributes = [
    `${COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (secure) attributes.push('Secure');
  reply.header('Set-Cookie', attributes.join('; '));
}

async function requireSession(request: FastifyRequest, reply: FastifyReply): Promise<boolean> {
  if (await hasValidSession(request)) return true;
  reply.code(401).send({ error: 'Sessão expirada. Entre novamente.' });
  return false;
}

async function sendPhoto(
  request: FastifyRequest,
  reply: FastifyReply,
  photo: PhotoGalleryPhoto,
  options: { publicCache?: boolean; download?: boolean } = {},
) {
  const result = await get(photo.pathname, {
    access: 'private',
    ifNoneMatch:
      typeof request.headers['if-none-match'] === 'string'
        ? request.headers['if-none-match']
        : undefined,
  });

  if (!result) return reply.code(404).send({ error: 'Arquivo indisponível.' });

  reply
    .header('ETag', result.blob.etag)
    .header(
      'Cache-Control',
      options.publicCache ? 'public, max-age=3600, s-maxage=86400' : 'private, no-cache',
    )
    .header('X-Content-Type-Options', 'nosniff');

  if (result.statusCode === 304) return reply.code(304).send();

  reply.header('Content-Type', result.blob.contentType);
  reply.header('Content-Length', result.blob.size);
  if (options.download) {
    reply.header('Content-Disposition', `attachment; filename="${photo.filename}"`);
  }

  return reply.send(Readable.fromWeb(result.stream as never));
}

export async function registerPhotoGalleryRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { action?: string; id?: string; download?: string } }>(
    '/api/photos',
    async (request, reply) => {
      const action = request.query.action ?? 'session';

      if (action === 'session') {
        return { authenticated: await hasValidSession(request) };
      }

      if (action === 'cover') {
        if (!coverPhoto) return reply.code(404).send({ error: 'Capa indisponível.' });
        return sendPhoto(request, reply, coverPhoto, { publicCache: true });
      }

      if (!(await requireSession(request, reply))) return;

      if (action === 'manifest') {
        return {
          version: manifest.version,
          generatedAt: manifest.generatedAt,
          total: manifest.total,
          sections: manifest.sections.map((section) => ({
            id: section.id,
            title: section.title,
            camera: section.camera,
            count: section.count,
            photos: section.photos.map(({ pathname: _pathname, bytes: _bytes, ...photo }) => photo),
          })),
        };
      }

      if (action !== 'media') {
        return reply.code(400).send({ error: 'Ação inválida.' });
      }

      const id = request.query.id ?? '';
      if (!/^(r6m2|r6)-\d{4}$/.test(id)) {
        return reply.code(400).send({ error: 'Identificador inválido.' });
      }

      const photo = photoById.get(id);
      if (!photo) return reply.code(404).send({ error: 'Foto não encontrada.' });

      return sendPhoto(request, reply, photo, { download: request.query.download === '1' });
    },
  );

  app.post<{ Body: { password?: string } }>('/api/photos', async (request, reply) => {
    const password = request.body?.password ?? '';
    if (!passwordMatches(password)) {
      return reply.code(401).send({ error: 'Senha incorreta.' });
    }

    const token = await new SignJWT({ role: 'photo-gallery' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${SESSION_SECONDS}s`)
      .sign(getJwtSecret());

    setSessionCookie(reply, token, isSecureRequest(request));
    return { authenticated: true };
  });

  app.delete('/api/photos', async (request, reply) => {
    clearSessionCookie(reply, isSecureRequest(request));
    return { authenticated: false };
  });
}
