import type { VercelRequest, VercelResponse } from '@vercel/node';
import Fastify, { type FastifyInstance } from 'fastify';

import { registerPhotoGalleryRoutes } from '../server/photo-gallery-server.js';

let appPromise: Promise<FastifyInstance> | null = null;

function getApp() {
  if (!appPromise) {
    appPromise = Promise.resolve(Fastify({ logger: true, trustProxy: true })).then(async (app) => {
      await registerPhotoGalleryRoutes(app);
      await app.ready();
      return app;
    });
  }
  return appPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await getApp();
  app.server.emit('request', req, res);
}

export const config = {
  maxDuration: 60,
};
