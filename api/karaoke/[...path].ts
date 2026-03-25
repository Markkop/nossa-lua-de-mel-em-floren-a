import type { VercelRequest, VercelResponse } from '@vercel/node';

import { buildApp } from '../../server/karaoke-server.js';

/**
 * `/api/karaoke/*` — Fastify handles all karaoke routes. Routes use a single path segment
 * after `/api/karaoke/` (e.g. `guest-songs-bulk`, not `guest-songs/bulk`) so Vercel’s
 * file router does not 404 on multi-segment paths. Do not use a root `api/[...path].ts`.
 */
let appPromise: ReturnType<typeof buildApp> | null = null;

function getApp() {
  if (!appPromise) {
    appPromise = buildApp().then(async (app) => {
      await app.ready();
      return app;
    });
  }
  return appPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const fastify = await getApp();
  fastify.server.emit('request', req, res);
}

export const config = {
  maxDuration: 60,
};
