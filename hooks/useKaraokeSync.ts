import { useCallback, useEffect, useRef, useState } from 'react';

import type { KaraokeEntry, KaraokeState, OtherSong } from '@/utils/karaoke-api';
import {
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
  postQueueReorder,
  postQueueSkip,
} from '@/utils/karaoke-api';

const DJ_TOKEN_KEY = 'karaoke_dj_token';

const DEFAULT_POLL_MS = 2500;

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

  const setDjToken = useCallback((token: string) => {
    setDjTokenState(token);
    if (token) sessionStorage.setItem(DJ_TOKEN_KEY, token);
    else sessionStorage.removeItem(DJ_TOKEN_KEY);
  }, []);

  const logoutDj = useCallback(() => {
    setDjToken('');
  }, [setDjToken]);

  useEffect(() => {
    let cancelled = false;
    const pollMs = getPollIntervalMs();

    const tick = async () => {
      try {
        await refreshState();
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Não foi possível sincronizar o karaokê.');
        }
      } finally {
        if (!cancelled && !initialLoadDone.current) {
          initialLoadDone.current = true;
          setIsLoading(false);
        }
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
  }, [refreshState]);

  const loginDj = useCallback(
    async (pin: string) => {
      const token = await djLogin(pin);
      setDjToken(token);
    },
    [setDjToken]
  );

  const addQueueEntry = useCallback(async (name: string, song: string) => {
    await postQueue(name, song);
    await refreshState();
  }, [refreshState]);

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
    removeQueue,
    removeGuest,
    removeOther,
    refreshState,
  };
}
