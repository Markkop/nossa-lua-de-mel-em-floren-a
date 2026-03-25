export type KaraokeEntry = { id: string; name: string; song: string };
export type OtherSong = { id: string; song: string };

export type KaraokeState = {
  queue: KaraokeEntry[];
  guestSongs: KaraokeEntry[];
  otherSongs: OtherSong[];
};

const API_BASE = import.meta.env.VITE_KARAOKE_API_URL ?? '';

function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

async function parseError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: string };
    return j.error ?? `Erro ${res.status}`;
  } catch {
    return `Erro ${res.status}`;
  }
}

export async function fetchKaraokeState(): Promise<KaraokeState> {
  const res = await fetch(apiUrl('/api/karaoke/state'));
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<KaraokeState>;
}

export async function djLogin(pin: string): Promise<string> {
  const res = await fetch(apiUrl('/api/karaoke/dj-auth'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const { token } = (await res.json()) as { token: string };
  return token;
}

export async function postQueue(name: string, song: string): Promise<void> {
  const res = await fetch(apiUrl('/api/karaoke/queue'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, song }),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function postGuestSong(name: string, song: string): Promise<void> {
  const res = await fetch(apiUrl('/api/karaoke/guest-songs'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, song }),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function postGuestSongsBulk(entries: { name: string; song: string }[]): Promise<{
  added: number;
  errors: string[];
}> {
  const res = await fetch(apiUrl('/api/karaoke/guest-songs-bulk'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ added: number; errors: string[] }>;
}

export async function postOtherSong(song: string): Promise<void> {
  const res = await fetch(apiUrl('/api/karaoke/other-songs'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ song }),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function postOtherSongsBulk(songs: string[]): Promise<{ added: number; errors: string[] }> {
  const res = await fetch(apiUrl('/api/karaoke/other-songs-bulk'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ songs }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ added: number; errors: string[] }>;
}

function authHeaders(token: string | null): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function postQueueReorder(ids: string[], token: string): Promise<void> {
  const res = await fetch(apiUrl('/api/karaoke/queue-reorder'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function postQueueSkip(id: string, token: string): Promise<void> {
  const res = await fetch(apiUrl('/api/karaoke/queue-skip'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function postQueueMoveToNext(id: string, token: string): Promise<void> {
  const res = await fetch(apiUrl('/api/karaoke/queue-move-to-next'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function deleteQueueEntry(id: string, token: string): Promise<void> {
  const res = await fetch(apiUrl('/api/karaoke/queue-remove'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function deleteGuestSong(id: string, token: string): Promise<void> {
  const res = await fetch(apiUrl('/api/karaoke/guest-songs-remove'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function deleteAllGuestSongs(token: string): Promise<{ removed: number }> {
  const res = await fetch(apiUrl('/api/karaoke/guest-songs-clear'), {
    method: 'POST',
    headers: authHeaders(token),
    // Empty JSON object: Fastify rejects POST+application/json with no body (400).
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ removed: number }>;
}

export async function deleteOtherSong(id: string, token: string): Promise<void> {
  const res = await fetch(apiUrl('/api/karaoke/other-songs-remove'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error(await parseError(res));
}
