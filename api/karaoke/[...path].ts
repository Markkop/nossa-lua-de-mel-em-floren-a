import type { VercelRequest, VercelResponse } from '@vercel/node';

import { buildApp } from '../../server/karaoke-server.js';

/**
 * `/api/karaoke/*` — do not use a root `api/[...path].ts`; it can break Vercel routing.
 * DJ login is `POST /api/karaoke/dj-auth` (not `.../auth/dj`) to avoid `auth` segment issues.
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
