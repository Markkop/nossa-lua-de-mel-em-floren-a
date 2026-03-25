import { randomBytes, timingSafeEqual } from 'node:crypto';

import cors from '@fastify/cors';
import Fastify from 'fastify';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

import * as db from './db.js';

const DJ_PIN = process.env.KARAOKE_DJ_PIN ?? '0000';
const JWT_SECRET = new TextEncoder().encode(
  process.env.KARAOKE_JWT_SECRET ?? 'dev-only-set-KARAOKE_JWT_SECRET'
);

type DjPayload = JWTPayload & { role?: string };

function getBearerToken(header: string | undefined): string | null {
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

async function verifyDjToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const p = payload as DjPayload;
    return p.role === 'dj';
  } catch {
    return false;
  }
}

async function requireDj(header: string | undefined): Promise<boolean> {
  const token = getBearerToken(header);
  if (!token) return false;
  return verifyDjToken(token);
}

function pinMatches(provided: string): boolean {
  const a = Buffer.from(provided.trim(), 'utf8');
  const b = Buffer.from(DJ_PIN, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export async function buildApp() {
  const fastify = Fastify({ logger: true, trustProxy: true });

  await fastify.register(cors, { origin: true });

  fastify.get('/api/karaoke/health', async () => ({ ok: true }));

  fastify.get('/api/karaoke/state', async () => db.loadState());

  fastify.post<{ Body: { pin?: string } }>('/api/karaoke/dj-auth', async (request, reply) => {
    const pin = request.body?.pin ?? '';
    if (!pinMatches(pin)) {
      return reply.code(401).send({ error: 'PIN inválido' });
    }
    const token = await new SignJWT({ role: 'dj' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .setJti(randomBytes(16).toString('hex'))
      .sign(JWT_SECRET);
    return { token };
  });

  fastify.post<{ Body: { name?: string; song?: string } }>('/api/karaoke/queue', async (request, reply) => {
    const name = (request.body?.name ?? '').trim().replace(/\s+/g, ' ');
    const song = (request.body?.song ?? '').trim().replace(/\s+/g, ' ');
    if (!name || !song) {
      return reply.code(400).send({ error: 'Nome e música são obrigatórios' });
    }
    if (await db.queueHasDuplicate(name, song)) {
      return reply.code(409).send({ error: 'Essa inscrição já está na fila' });
    }
    await db.addQueueEntry(name, song);
    return { ok: true };
  });

  fastify.post<{ Body: { name?: string; song?: string } }>('/api/karaoke/guest-songs', async (request, reply) => {
    const name = normalizeText(request.body?.name ?? '');
    const song = normalizeText(request.body?.song ?? '');
    if (!name || !song) {
      return reply.code(400).send({ error: 'Convidado e música são obrigatórios' });
    }
    if (await db.guestHasDuplicate(name, song)) {
      return reply.code(409).send({ error: 'Essa combinação já foi adicionada' });
    }
    await db.addGuestSong(name, song);
    return { ok: true };
  });

  fastify.post<{ Body: { entries?: { name: string; song: string }[] } }>(
    '/api/karaoke/guest-songs/bulk',
    async (request, reply) => {
      const entries = request.body?.entries;
      if (!Array.isArray(entries) || entries.length === 0) {
        return reply.code(400).send({ error: 'entries obrigatório' });
      }
      const errors: string[] = [];
      let added = 0;
      for (let i = 0; i < entries.length; i++) {
        const name = normalizeText(entries[i]?.name ?? '');
        const song = normalizeText(entries[i]?.song ?? '');
        if (!name || !song) {
          errors.push(`Linha ${i + 1}: convidado e música são obrigatórios.`);
          continue;
        }
        if (await db.guestHasDuplicate(name, song)) {
          errors.push(`Linha ${i + 1}: já existe (duplicada).`);
          continue;
        }
        await db.addGuestSong(name, song);
        added++;
      }
      return { added, errors };
    }
  );

  fastify.post<{ Body: { song?: string } }>('/api/karaoke/other-songs', async (request, reply) => {
    const song = normalizeText(request.body?.song ?? '');
    if (!song) {
      return reply.code(400).send({ error: 'Música é obrigatória' });
    }
    if (await db.otherHasDuplicate(song)) {
      return reply.code(409).send({ error: 'Essa música já foi adicionada' });
    }
    await db.addOtherSong(song);
    return { ok: true };
  });

  fastify.post<{ Body: { songs?: string[] } }>('/api/karaoke/other-songs/bulk', async (request, reply) => {
    const songs = request.body?.songs;
    if (!Array.isArray(songs) || songs.length === 0) {
      return reply.code(400).send({ error: 'songs obrigatório' });
    }
    const errors: string[] = [];
    let added = 0;
    for (let i = 0; i < songs.length; i++) {
      const song = normalizeText(songs[i] ?? '');
      if (!song) {
        errors.push(`Linha ${i + 1}: música inválida.`);
        continue;
      }
      if (await db.otherHasDuplicate(song)) {
        errors.push(`Linha ${i + 1}: já existe (duplicada).`);
        continue;
      }
      await db.addOtherSong(song);
      added++;
    }
    return { added, errors };
  });

  fastify.post<{ Body: { ids?: string[] } }>(
    '/api/karaoke/queue/reorder',
    async (request, reply) => {
      if (!(await requireDj(request.headers.authorization))) {
        return reply.code(401).send({ error: 'Acesso de DJ necessário' });
      }
      const ids = request.body?.ids;
      if (!Array.isArray(ids) || ids.length === 0) {
        return reply.code(400).send({ error: 'Lista de ids inválida' });
      }
      const state = await db.loadState();
      const valid = new Set(state.queue.map((q) => q.id));
      if (ids.length !== state.queue.length || !ids.every((id) => valid.has(id))) {
        return reply.code(400).send({ error: 'Ordem não confere com a fila atual' });
      }
      await db.reorderQueue(ids);
      return { ok: true };
    }
  );

  fastify.post<{ Body: { id?: string } }>('/api/karaoke/queue/skip', async (request, reply) => {
    if (!(await requireDj(request.headers.authorization))) {
      return reply.code(401).send({ error: 'Acesso de DJ necessário' });
    }
    const id = request.body?.id;
    if (!id) return reply.code(400).send({ error: 'id é obrigatório' });
    await db.skipQueueEntry(id);
    return { ok: true };
  });

  fastify.delete<{ Params: { id: string } }>('/api/karaoke/queue/:id', async (request, reply) => {
    if (!(await requireDj(request.headers.authorization))) {
      return reply.code(401).send({ error: 'Acesso de DJ necessário' });
    }
    const id = request.params.id;
    await db.deleteQueueEntry(id);
    return { ok: true };
  });

  fastify.delete<{ Params: { id: string } }>('/api/karaoke/guest-songs/:id', async (request, reply) => {
    if (!(await requireDj(request.headers.authorization))) {
      return reply.code(401).send({ error: 'Acesso de DJ necessário' });
    }
    await db.deleteGuestSong(request.params.id);
    return { ok: true };
  });

  fastify.delete<{ Params: { id: string } }>('/api/karaoke/other-songs/:id', async (request, reply) => {
    if (!(await requireDj(request.headers.authorization))) {
      return reply.code(401).send({ error: 'Acesso de DJ necessário' });
    }
    await db.deleteOtherSong(request.params.id);
    return { ok: true };
  });

  return fastify;
}
