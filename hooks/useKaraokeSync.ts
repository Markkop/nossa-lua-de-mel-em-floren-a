import { useCallback, useEffect, useRef, useState } from 'react';

import type { KaraokeEntry, KaraokeState, OtherSong } from '@/utils/karaoke-api';
import {
  deleteAllGuestSongs,
  deleteGuestSong,
  deleteOtherSong,
  deleteQueueEntry,
  djLogin,
  fetchKaraokeState,
  postGuestSong,
  postGuestSongsBulk,
  postOtherSong,
  postOtherSongsBulk,
  postQueue,
  postQueueMoveToNext,
  postQueueReorder,
  postQueueSkip,
} from '@/utils/karaoke-api';

const DJ_TOKEN_KEY = 'karaoke_dj_token';

/** Default ~1 min; override with VITE_KARAOKE_POLL_MS (milliseconds, min 1000). */
const DEFAULT_POLL_MS = 60_000;

function getPollIntervalMs(): number {
  const raw = import.meta.env.VITE_KARAOKE_POLL_MS;
  if (raw === undefined || raw === '') return DEFAULT_POLL_MS;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1000 ? n : DEFAULT_POLL_MS;
}

export function useKaraokeSync() {
  const [queue, setQueue] = useState<KaraokeEntry[]>([]);
  const [guestSongs, setGuestSongs] = useState<KaraokeEntry[]>([]);
  const [otherSongs, setOtherSongs] = useState<OtherSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [djToken, setDjTokenState] = useState(() => sessionStorage.getItem(DJ_TOKEN_KEY) ?? '');
  const initialLoadDone = useRef(false);

  const applyState = useCallback((state: KaraokeState) => {
    setQueue(state.queue);
    setGuestSongs(state.guestSongs);
    setOtherSongs(state.otherSongs);
  }, []);

  const refreshState = useCallback(async () => {
    const state = await fetchKaraokeState();
    applyState(state);
    setLoadError(null);
  }, [applyState]);

  /** Same fetch as polling; sets loadError on failure (does not throw). */
  const refreshKaraoke = useCallback(async () => {
    try {
      await refreshState();
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Não foi possível sincronizar o karaokê.');
    }
  }, [refreshState]);

  const setDjToken = useCallback((token: string) => {
    setDjTokenState(token);
    if (token) sessionStorage.setItem(DJ_TOKEN_KEY, token);
    else sessionStorage.removeItem(DJ_TOKEN_KEY);
  }, []);

  const logoutDj = useCallback(() => {
    setDjToken('');
  }, [setDjToken]);

  /** Keeps polling stable if refreshKaraoke identity changes; avoids resetting the interval on every tick. */
  const refreshKaraokeRef = useRef(refreshKaraoke);
  refreshKaraokeRef.current = refreshKaraoke;

  useEffect(() => {
    let cancelled = false;
    const pollMs = getPollIntervalMs();

    const tick = async () => {
      await refreshKaraokeRef.current();
      if (!cancelled && !initialLoadDone.current) {
        initialLoadDone.current = true;
        setIsLoading(false);
      }
    };

    void tick();
    const id = window.setInterval(() => {
      void tick();
    }, pollMs);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const loginDj = useCallback(
    async (pin: string) => {
      const token = await djLogin(pin);
      setDjToken(token);
    },
    [setDjToken]
  );

  const addQueueEntry = useCallback(async (name: string, song: string) => {
    await postQueue(name, song);
    const state = await fetchKaraokeState();
    applyState(state);
    setLoadError(null);
    return state;
  }, [applyState]);

  const addGuestSong = useCallback(async (name: string, song: string) => {
    await postGuestSong(name, song);
    await refreshState();
  }, [refreshState]);

  const addGuestBulk = useCallback(
    async (entries: { name: string; song: string }[]) => {
      const result = await postGuestSongsBulk(entries);
      await refreshState();
      return result;
    },
    [refreshState]
  );

  const addOtherSong = useCallback(async (song: string) => {
    await postOtherSong(song);
    await refreshState();
  }, [refreshState]);

  const addOtherBulk = useCallback(
    async (songs: string[]) => {
      const result = await postOtherSongsBulk(songs);
      await refreshState();
      return result;
    },
    [refreshState]
  );

  const reorderQueue = useCallback(
    async (ids: string[]) => {
      if (!djToken) throw new Error('Modo DJ necessário');
      await postQueueReorder(ids, djToken);
      await refreshState();
    },
    [djToken, refreshState]
  );

  const skipQueue = useCallback(
    async (id: string) => {
      if (!djToken) throw new Error('Modo DJ necessário');
      await postQueueSkip(id, djToken);
      await refreshState();
    },
    [djToken, refreshState]
  );

  const moveQueueToNext = useCallback(
    async (id: string) => {
      if (!djToken) throw new Error('Modo DJ necessário');
      await postQueueMoveToNext(id, djToken);
      await refreshState();
    },
    [djToken, refreshState]
  );

  const removeQueue = useCallback(
    async (id: string) => {
      if (!djToken) throw new Error('Modo DJ necessário');
      await deleteQueueEntry(id, djToken);
      await refreshState();
    },
    [djToken, refreshState]
  );

  const removeGuest = useCallback(
    async (id: string) => {
      if (!djToken) throw new Error('Modo DJ necessário');
      await deleteGuestSong(id, djToken);
      await refreshState();
    },
    [djToken, refreshState]
  );

  const removeAllGuestSongs = useCallback(async () => {
    if (!djToken) throw new Error('Modo DJ necessário');
    await deleteAllGuestSongs(djToken);
    await refreshState();
  }, [djToken, refreshState]);

  const removeOther = useCallback(
    async (id: string) => {
      if (!djToken) throw new Error('Modo DJ necessário');
      await deleteOtherSong(id, djToken);
      await refreshState();
    },
    [djToken, refreshState]
  );

  const isDj = Boolean(djToken);

  return {
    queue,
    guestSongs,
    otherSongs,
    isLoading,
    loadError,
    isDj,
    loginDj,
    logoutDj,
    setDjToken,
    addQueueEntry,
    addGuestSong,
    addGuestBulk,
    addOtherSong,
    addOtherBulk,
    reorderQueue,
    skipQueue,
    moveQueueToNext,
    removeQueue,
    removeGuest,
    removeAllGuestSongs,
    removeOther,
    refreshState,
    refreshKaraoke,
  };
}
