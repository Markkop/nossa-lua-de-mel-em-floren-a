import type { VercelRequest, VercelResponse } from '@vercel/node';

import { buildApp } from '../../server/karaoke-server.js';

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
