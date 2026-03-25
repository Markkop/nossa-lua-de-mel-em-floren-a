import type { VercelRequest, VercelResponse } from '@vercel/node';

import { buildApp } from '../server/karaoke-server.js';

/**
 * Single catch-all for `/api/*` so nested paths like `/api/karaoke/auth/dj`
 * are not shadowed by Vercel’s router (a nested `api/karaoke/[...path].ts`
 * can 404 on multi-segment routes under `auth/`).
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
