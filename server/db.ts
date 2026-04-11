import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for the karaoke API server');
}

export const sql = neon(process.env.DATABASE_URL);

export type QueueRow = { id: string; name: string; song: string; artist: string; youtubeUrl: string };
export type GuestRow = { id: string; name: string; song: string; artist: string; youtubeUrl: string };
export type OtherRow = { id: string; song: string; artist: string; youtubeUrl: string };

export type KaraokeState = {
  queue: QueueRow[];
  guestSongs: GuestRow[];
  otherSongs: OtherRow[];
};

export async function loadState(): Promise<KaraokeState> {
  const queue = await sql`
    SELECT id::text AS id, name, song, artist, youtube_url AS "youtubeUrl"
    FROM karaoke_queue
    ORDER BY sort_order ASC, created_at ASC
  `;
  const guestSongs = await sql`
    SELECT id::text AS id, name, song, artist, youtube_url AS "youtubeUrl"
    FROM karaoke_guest_songs
    ORDER BY created_at ASC
  `;
  const otherSongs = await sql`
    SELECT id::text AS id, song, artist, youtube_url AS "youtubeUrl"
    FROM karaoke_other_songs
    ORDER BY created_at ASC
  `;
  return {
    queue: queue as QueueRow[],
    guestSongs: guestSongs as GuestRow[],
    otherSongs: otherSongs as OtherRow[],
  };
}

export async function addQueueEntry(name: string, song: string, artist: string, youtubeUrl: string): Promise<void> {
  const rows = await sql`
    SELECT MAX(sort_order) AS max FROM karaoke_queue
  `;
  const max = (rows[0] as { max: number | null } | undefined)?.max;
  const next = (max ?? -1) + 1;
  await sql`
    INSERT INTO karaoke_queue (sort_order, name, song, artist, youtube_url)
    VALUES (${next}, ${name}, ${song}, ${artist}, ${youtubeUrl})
  `;
}

export async function addGuestSong(name: string, song: string, artist: string, youtubeUrl: string): Promise<void> {
  await sql`
    INSERT INTO karaoke_guest_songs (name, song, artist, youtube_url)
    VALUES (${name}, ${song}, ${artist}, ${youtubeUrl})
  `;
}

export async function addOtherSong(song: string, artist: string, youtubeUrl: string): Promise<void> {
  await sql`
    INSERT INTO karaoke_other_songs (song, artist, youtube_url)
    VALUES (${song}, ${artist}, ${youtubeUrl})
  `;
}

export async function deleteGuestSong(id: string): Promise<boolean> {
  const rows = await sql`
    DELETE FROM karaoke_guest_songs WHERE id = ${id}::uuid RETURNING id::text AS id
  `;
  return rows.length > 0;
}

export async function deleteAllGuestSongs(): Promise<number> {
  const rows = await sql`
    DELETE FROM karaoke_guest_songs RETURNING id
  `;
  return rows.length;
}

export async function deleteAllOtherSongs(): Promise<number> {
  const rows = await sql`
    DELETE FROM karaoke_other_songs RETURNING id
  `;
  return rows.length;
}

export async function deleteOtherSong(id: string): Promise<boolean> {
  const rows = await sql`
    DELETE FROM karaoke_other_songs WHERE id = ${id}::uuid RETURNING id::text AS id
  `;
  return rows.length > 0;
}

export async function deleteQueueEntry(id: string): Promise<boolean> {
  const rows = await sql`
    DELETE FROM karaoke_queue WHERE id = ${id}::uuid RETURNING id::text AS id
  `;
  return rows.length > 0;
}

export async function skipQueueEntry(id: string): Promise<void> {
  const rows = await sql`
    SELECT sort_order FROM karaoke_queue WHERE id = ${id}::uuid
  `;
  const row = rows[0] as { sort_order: number } | undefined;
  if (!row) return;
  const maxRows = await sql`
    SELECT MAX(sort_order) AS max FROM karaoke_queue
  `;
  const max = (maxRows[0] as { max: number | null } | undefined)?.max;
  const next = (max ?? row.sort_order) + 1;
  await sql`
    UPDATE karaoke_queue SET sort_order = ${next} WHERE id = ${id}::uuid
  `;
}

/** Move entry to be "Próximo" (index 1): immediately after who is singing now, not the end of the queue. */
export async function moveQueueEntryToNext(id: string): Promise<void> {
  const state = await loadState();
  const ids = state.queue.map((q) => q.id);
  const from = ids.indexOf(id);
  if (from === -1) return;
  const without = ids.filter((x) => x !== id);
  const insertAt = Math.min(1, without.length);
  const newIds = [...without.slice(0, insertAt), id, ...without.slice(insertAt)];
  await reorderQueue(newIds);
}

export async function reorderQueue(ids: string[]): Promise<void> {
  const statements = ids.map(
    (id, index) => sql`UPDATE karaoke_queue SET sort_order = ${index} WHERE id = ${id}::uuid`
  );
  await sql.transaction(statements);
}

export async function queueHasDuplicate(name: string, song: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1 AS n FROM karaoke_queue
    WHERE lower(trim(name)) = lower(trim(${name})) AND lower(trim(song)) = lower(trim(${song}))
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function guestHasDuplicate(name: string, song: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1 AS n FROM karaoke_guest_songs
    WHERE lower(trim(name)) = lower(trim(${name})) AND lower(trim(song)) = lower(trim(${song}))
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function otherHasDuplicate(song: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1 AS n FROM karaoke_other_songs
    WHERE lower(trim(song)) = lower(trim(${song}))
    LIMIT 1
  `;
  return rows.length > 0;
}
