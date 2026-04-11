import React, { useEffect, useMemo, useRef, useState } from 'react';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { draggable, dropTargetForElements, monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { reorder } from '@atlaskit/pragmatic-drag-and-drop/reorder';

import { GripVertical, ListEnd, Lock, LockOpen, Menu, Music, SkipForward, Youtube } from 'lucide-react';

import { useKaraokeSync } from '@/hooks/useKaraokeSync';

type KaraokeEntry = {
  id: string;
  name: string;
  song: string;
  artist: string;
  youtubeUrl: string;
};

type OtherSong = {
  id: string;
  song: string;
  artist: string;
  youtubeUrl: string;
};

type NameSuggestion = {
  id: string;
  name: string;
  song?: string;
  artist?: string;
  kind: 'name' | 'pair';
};

type SongSuggestion = {
  id: string;
  song: string;
  artist?: string;
  fromGuest: boolean;
};

const normalizeText = (value: string) => value.trim().replace(/\s+/g, ' ');
const normalizeSearchText = (value: string) =>
  normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
const normalizeImportedField = (value: string) => {
  const normalized = normalizeText(value);
  return normalized === '<empty>' || normalized === '-' ? '' : normalized;
};
const makeKey = (name: string, song: string) => `${normalizeText(name)}::${normalizeText(song)}`;
const formatSong = (song: string, artist: string) => (artist ? `${song} \u2013 ${artist}` : song);

const splitSongArtist = (value: string): { song: string; artist: string } => {
  const song = normalizeText(value);
  if (!song) return { song: '', artist: '' };

  for (const separator of [' - ', ' – ']) {
    const index = song.lastIndexOf(separator);
    if (index === -1) continue;

    const title = normalizeText(song.slice(0, index));
    const artist = normalizeText(song.slice(index + separator.length));
    if (title && artist) return { song: title, artist };
  }

  return { song, artist: '' };
};

const splitSongArtistFromParentheses = (value: string): { song: string; artist: string } => {
  const song = normalizeText(value);
  const match = song.match(/^(.*)\(([^()]+)\)$/);
  if (!match) return { song, artist: '' };

  const title = normalizeText(match[1] ?? '');
  const artist = normalizeText(match[2] ?? '');
  if (!title || !artist) return { song, artist: '' };
  return { song: title, artist };
};

const makeSongArtistKey = (song: string, artist: string) =>
  `${normalizeSearchText(song)}::${normalizeSearchText(artist)}`;

const GUEST_ADDED_TO_QUEUE_MSG = 'Adicionado à fila!';
const GUEST_REMOVED_FROM_QUEUE_MSG = 'Removido da fila!';

/** Cancels parent `px-6` on mobile so tables span the card width; desktop unchanged. */
const KARAOKE_TABLE_SCROLL_WRAP = 'overflow-x-auto -mx-6 md:mx-0';

const BtnSpinner: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg
    className={`animate-spin ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const IconTrash: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    aria-hidden
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
    />
  </svg>
);

type QueueRowProps = {
  item: KaraokeEntry;
  index: number;
  isDragging: boolean;
  isOver: boolean;
  isDj: boolean;
  dragDisabled: boolean;
  skipLoading: boolean;
  moveToNextLoading: boolean;
  removeLoading: boolean;
  onSkip: (id: string) => void;
  onMoveToNext: (id: string) => void;
  onRemove: (id: string) => void;
};

const QueueRow: React.FC<QueueRowProps> = ({
  item,
  index,
  isDragging,
  isOver,
  isDj,
  dragDisabled,
  skipLoading,
  moveToNextLoading,
  removeLoading,
  onSkip,
  onMoveToNext,
  onRemove,
}) => {
  const queueActionBusy = skipLoading || moveToNextLoading || removeLoading;
  const rowRef = useRef<HTMLTableRowElement | null>(null);
  const desktopDragRef = useRef<HTMLButtonElement | null>(null);
  const mobileDragRef = useRef<HTMLButtonElement | null>(null);
  const [isMdViewport, setIsMdViewport] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const sync = () => setIsMdViewport(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!isDj || dragDisabled) return;
    const row = rowRef.current;
    const handle = isMdViewport ? desktopDragRef.current : mobileDragRef.current;
    if (!row || !handle) return;

    return combine(
      draggable({
        element: row,
        dragHandle: handle,
        getInitialData: () => ({ id: item.id, listId: 'queue' }),
      }),
      dropTargetForElements({
        element: row,
        getData: () => ({ id: item.id, listId: 'queue' }),
        canDrop: ({ source }) => source.data.listId === 'queue',
      })
    );
  }, [isDj, dragDisabled, item.id, isMdViewport]);

  const statusLabel = index === 0 ? 'Agora' : index === 1 ? 'Próximo' : `Fila ${index + 1}`;
  const statusTone =
    index === 0 ? 'bg-[#8b5e3c] text-white' : index === 1 ? 'bg-[#e6d5c3] text-[#3d2b1f]' : 'bg-[#f3eee7] text-[#3d2b1f]';

  return (
    <tr
      ref={rowRef}
      className={[
        'border-b border-[#8b5e3c]/10 transition-colors',
        index === 0 ? 'bg-[#f7efe5]' : '',
        index === 1 ? 'bg-[#faf5ee]' : '',
        isOver ? 'bg-[#efe3d5]' : '',
        isDragging ? 'opacity-60' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <td className="hidden md:table-cell py-3 px-4 align-middle">
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusTone}`}>
          {statusLabel}
        </span>
      </td>
      <td className="py-3 px-4 align-middle text-[#3d2b1f] font-medium">
        <span
          className={`md:hidden inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold mb-2 ${statusTone}`}
        >
          {statusLabel}
        </span>
        <span className="block">{item.name}</span>
        <span className="block md:hidden text-xs text-gray-500/90 mt-0.5 leading-snug">
          {formatSong(item.song, item.artist)}
        </span>
        {isDj ? (
          <div className="md:hidden mt-3 pt-3 border-t border-[#8b5e3c]/10 flex flex-nowrap items-center gap-2">
            {item.youtubeUrl ? (
              <a
                href={item.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abrir no YouTube"
                title="Abrir no YouTube"
                className="inline-flex items-center justify-center gap-1.5 h-9 w-9 shrink-0 rounded-full border border-[#8b5e3c]/25 text-[#c23b2a] hover:bg-[#8b5e3c]/10 transition-colors"
              >
                <Youtube className="h-4 w-4" aria-hidden />
              </a>
            ) : null}
            <button
              type="button"
              disabled={queueActionBusy}
              aria-busy={moveToNextLoading}
              aria-label="Próximo na fila"
              title="Tornar o próximo da fila (logo após quem está cantando)"
              onClick={() => void onMoveToNext(item.id)}
              className="inline-flex items-center justify-center gap-1.5 h-9 w-9 shrink-0 rounded-full border border-[#8b5e3c]/25 text-[#6b4a2f] hover:bg-[#8b5e3c]/10 transition-colors text-xs font-semibold uppercase tracking-wide disabled:opacity-60 disabled:pointer-events-none"
            >
              {moveToNextLoading ? (
                <BtnSpinner className="h-3.5 w-3.5" />
              ) : (
                <SkipForward className="h-4 w-4" aria-hidden />
              )}
            </button>
            <button
              type="button"
              disabled={queueActionBusy}
              aria-busy={skipLoading}
              aria-label="Pular para o fim da fila"
              title="Pular para o fim da fila"
              onClick={() => void onSkip(item.id)}
              className="inline-flex items-center justify-center gap-1.5 h-9 w-9 shrink-0 rounded-full border border-[#8b5e3c]/30 text-[#8b5e3c] hover:bg-[#8b5e3c]/10 transition-colors text-xs font-semibold uppercase tracking-wide disabled:opacity-60 disabled:pointer-events-none"
            >
              {skipLoading ? (
                <BtnSpinner className="h-3.5 w-3.5" />
              ) : (
                <ListEnd className="h-4 w-4" aria-hidden />
              )}
            </button>
            <button
              ref={mobileDragRef}
              type="button"
              disabled={dragDisabled || queueActionBusy}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#8b5e3c]/30 p-0 text-[#8b5e3c] hover:bg-[#8b5e3c]/10 transition-colors cursor-grab active:cursor-grabbing disabled:opacity-50 disabled:cursor-not-allowed"
              title="Arrastar para reordenar"
              aria-label="Arrastar para reordenar"
            >
              <GripVertical className="h-4 w-4 shrink-0" aria-hidden strokeWidth={1.75} />
            </button>
            <button
              type="button"
              disabled={queueActionBusy}
              aria-busy={removeLoading}
              aria-label="Excluir"
              title="Excluir"
              onClick={() => void onRemove(item.id)}
              className="inline-flex items-center justify-center gap-1.5 h-9 w-9 shrink-0 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors text-xs font-semibold uppercase tracking-wide disabled:opacity-60 disabled:pointer-events-none"
            >
              {removeLoading ? (
                <BtnSpinner className="h-3.5 w-3.5" />
              ) : (
                <IconTrash className="h-4 w-4" />
              )}
            </button>
          </div>
        ) : null}
      </td>
      <td className="hidden md:table-cell py-3 px-4 align-middle text-gray-600">{formatSong(item.song, item.artist)}</td>
      {isDj ? (
        <td className="hidden md:table-cell py-3 px-4 align-middle">
          <div className="flex flex-nowrap items-center justify-end gap-2">
            {item.youtubeUrl ? (
              <a
                href={item.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abrir no YouTube"
                title="Abrir no YouTube"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#8b5e3c]/25 p-0 text-[#c23b2a] hover:bg-[#8b5e3c]/10 transition-colors"
              >
                <Youtube className="h-4 w-4 shrink-0" aria-hidden strokeWidth={1.75} />
              </a>
            ) : null}
            <button
              type="button"
              disabled={queueActionBusy}
              aria-busy={moveToNextLoading}
              aria-label="Próximo na fila"
              title="Tornar o próximo da fila (logo após quem está cantando)"
              onClick={() => void onMoveToNext(item.id)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#8b5e3c]/25 p-0 text-[#6b4a2f] hover:bg-[#8b5e3c]/10 transition-colors disabled:opacity-60 disabled:pointer-events-none"
            >
              {moveToNextLoading ? (
                <BtnSpinner className="h-3.5 w-3.5" />
              ) : (
                <SkipForward className="h-4 w-4 shrink-0" aria-hidden strokeWidth={1.75} />
              )}
            </button>
            <button
              type="button"
              disabled={queueActionBusy}
              aria-busy={skipLoading}
              aria-label="Pular para o fim da fila"
              title="Pular para o fim da fila"
              onClick={() => void onSkip(item.id)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#8b5e3c]/30 p-0 text-[#8b5e3c] hover:bg-[#8b5e3c]/10 transition-colors disabled:opacity-60 disabled:pointer-events-none"
            >
              {skipLoading ? (
                <BtnSpinner className="h-3.5 w-3.5" />
              ) : (
                <ListEnd className="h-4 w-4 shrink-0" aria-hidden strokeWidth={1.75} />
              )}
            </button>
            <button
              ref={desktopDragRef}
              type="button"
              disabled={dragDisabled || queueActionBusy}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#8b5e3c]/30 p-0 text-[#8b5e3c] hover:bg-[#8b5e3c]/10 transition-colors cursor-grab active:cursor-grabbing disabled:opacity-50 disabled:cursor-not-allowed"
              title="Arrastar para reordenar"
              aria-label="Arrastar para reordenar"
            >
              <GripVertical className="h-4 w-4 shrink-0" aria-hidden strokeWidth={1.75} />
            </button>
            <button
              type="button"
              disabled={queueActionBusy}
              aria-busy={removeLoading}
              aria-label="Excluir"
              title="Excluir"
              onClick={() => void onRemove(item.id)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rose-200 p-0 text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-60 disabled:pointer-events-none"
            >
              {removeLoading ? (
                <BtnSpinner className="h-3.5 w-3.5" />
              ) : (
                <IconTrash className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </td>
      ) : null}
    </tr>
  );
};

const KaraokePage: React.FC = () => {
  const {
    queue,
    guestSongs,
    otherSongs,
    isLoading,
    loadError,
    isDj,
    loginDj,
    logoutDj,
    addQueueEntry: apiAddQueue,
    addGuestSong: apiAddGuest,
    addGuestBulk,
    addOtherSong: apiAddOther,
    addOtherBulk,
    reorderQueue: apiReorderQueue,
    skipQueue: apiSkipQueue,
    moveQueueToNext: apiMoveQueueToNext,
    removeQueue: apiRemoveQueue,
    removeGuest: apiRemoveGuest,
    removeAllGuestSongs: apiRemoveAllGuestSongs,
    removeAllOtherSongs: apiRemoveAllOtherSongs,
    removeOther: apiRemoveOther,
    refreshKaraoke,
  } = useKaraokeSync();

  const queueRef = useRef(queue);
  queueRef.current = queue;

  const [activeTab, setActiveTab] = useState<'queue' | 'music'>('queue');
  const [musicSubTab, setMusicSubTab] = useState<'guest' | 'other'>('guest');
  const [queueName, setQueueName] = useState('');
  const [queueSong, setQueueSong] = useState('');
  const [queueError, setQueueError] = useState('');
  const [queueJoinBannerPosition, setQueueJoinBannerPosition] = useState<number | null>(null);
  const queueJoinBannerTimer = useRef<number | null>(null);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [isRemoveAllGuestConfirmOpen, setIsRemoveAllGuestConfirmOpen] = useState(false);
  const [isRemoveAllOtherConfirmOpen, setIsRemoveAllOtherConfirmOpen] = useState(false);
  const [guestQueueRemoveConfirm, setGuestQueueRemoveConfirm] = useState<{
    entry: KaraokeEntry;
    queueId: string;
    position: number;
  } | null>(null);
  const [isOtherModalOpen, setIsOtherModalOpen] = useState(false);
  const [singleGuestName, setSingleGuestName] = useState('');
  const [singleGuestSong, setSingleGuestSong] = useState('');
  const [singleGuestArtist, setSingleGuestArtist] = useState('');
  const [singleGuestYoutube, setSingleGuestYoutube] = useState('');
  const [singleGuestError, setSingleGuestError] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [bulkAddedCount, setBulkAddedCount] = useState<number | null>(null);
  const [singleOtherSong, setSingleOtherSong] = useState('');
  const [singleOtherArtist, setSingleOtherArtist] = useState('');
  const [singleOtherYoutube, setSingleOtherYoutube] = useState('');
  const [singleOtherError, setSingleOtherError] = useState('');
  const [otherBulkText, setOtherBulkText] = useState('');
  const [otherBulkErrors, setOtherBulkErrors] = useState<string[]>([]);
  const [otherBulkAddedCount, setOtherBulkAddedCount] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [guestActionMessage, setGuestActionMessage] = useState<string | null>(null);
  const [guestActionTone, setGuestActionTone] = useState<'success' | 'error'>('success');
  const [guestActionRowId, setGuestActionRowId] = useState<string | null>(null);
  const guestActionTimer = useRef<number | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const songInputRef = useRef<HTMLInputElement | null>(null);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isSongFocused, setIsSongFocused] = useState(false);
  const [nameHighlightIndex, setNameHighlightIndex] = useState(-1);
  const [songHighlightIndex, setSongHighlightIndex] = useState(-1);
  const [isDjModalOpen, setIsDjModalOpen] = useState(false);
  const djPinInputRef = useRef<HTMLInputElement | null>(null);
  const [djPinInput, setDjPinInput] = useState('');
  const [djError, setDjError] = useState('');
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isRefreshingKaraoke, setIsRefreshingKaraoke] = useState(false);

  const isBusy = (key: string) => pendingAction === key;

  const handleRefreshKaraoke = async () => {
    setIsRefreshingKaraoke(true);
    try {
      await refreshKaraoke();
    } finally {
      setIsRefreshingKaraoke(false);
    }
  };

  const guestKeys = useMemo(() => new Set(guestSongs.map((entry) => makeKey(entry.name, entry.song))), [guestSongs]);
  const visibleGuestSongs = useMemo(() => guestSongs.filter((entry) => normalizeText(entry.song) !== ''), [guestSongs]);
  const otherSongKeys = useMemo(
    () => new Set(otherSongs.map((entry) => normalizeText(entry.song).toLowerCase())),
    [otherSongs]
  );
  const queueKeys = useMemo(() => new Set(queue.map((entry) => makeKey(entry.name, entry.song))), [queue]);
  const queueKeyToId = useMemo(() => {
    const m = new Map<string, string>();
    queue.forEach((q) => m.set(makeKey(q.name, q.song), q.id));
    return m;
  }, [queue]);
  const guestYoutubeBySongArtist = useMemo(() => {
    const m = new Map<string, string>();

    guestSongs.forEach((entry) => {
      if (!entry.youtubeUrl) return;
      m.set(makeSongArtistKey(entry.song, entry.artist), entry.youtubeUrl);
    });

    return m;
  }, [guestSongs]);
  const guestYoutubeBySong = useMemo(() => {
    const counts = new Map<string, number>();
    const urls = new Map<string, string>();

    guestSongs.forEach((entry) => {
      if (!entry.youtubeUrl) return;
      const key = normalizeSearchText(entry.song);
      counts.set(key, (counts.get(key) ?? 0) + 1);
      urls.set(key, entry.youtubeUrl);
    });

    const unique = new Map<string, string>();
    counts.forEach((count, key) => {
      if (count === 1) {
        const url = urls.get(key);
        if (url) unique.set(key, url);
      }
    });

    return unique;
  }, [guestSongs]);
  const showOtherActions = isDj || otherSongs.some((entry) => Boolean(entry.youtubeUrl));
  const queueWithYoutube = useMemo(() => {
    const resolveYoutubeUrl = (entry: KaraokeEntry) => {
      if (entry.youtubeUrl) return entry.youtubeUrl;

      const candidates = [
        { song: entry.song, artist: entry.artist },
        splitSongArtist(entry.song),
        splitSongArtistFromParentheses(entry.song),
      ].filter((candidate) => candidate.song);

      for (const candidate of candidates) {
        const exact = guestYoutubeBySongArtist.get(makeSongArtistKey(candidate.song, candidate.artist));
        if (exact) return exact;
      }

      for (const candidate of candidates) {
        const songOnly = guestYoutubeBySong.get(normalizeSearchText(candidate.song));
        if (songOnly) return songOnly;
      }

      return '';
    };

    return queue.map((entry) => ({
      ...entry,
      youtubeUrl: resolveYoutubeUrl(entry),
    }));
  }, [guestSongs, guestYoutubeBySong, guestYoutubeBySongArtist, queue]);
  const nameSuggestions = useMemo<NameSuggestion[]>(() => {
    const query = normalizeSearchText(queueName);
    if (!query) return [];
    const matches = guestSongs.filter((entry) => normalizeSearchText(entry.name).includes(query));
    const grouped = new Map<string, { name: string; songs: NameSuggestion[] }>();

    matches.forEach((entry) => {
      const key = normalizeSearchText(entry.name);
      const current = grouped.get(key);
      if (!current) {
        grouped.set(key, { name: entry.name, songs: [] });
      }

      if (normalizeText(entry.song) !== '') {
        grouped.get(key)?.songs.push({
          id: `pair-${entry.id}`,
          name: entry.name,
          song: entry.song,
          artist: entry.artist,
          kind: 'pair',
        });
      }
    });

    return Array.from(grouped.values()).flatMap(({ name, songs }) => [
      {
        id: `name-${normalizeSearchText(name)}`,
        name,
        kind: 'name' as const,
      },
      ...songs,
    ]);
  }, [guestSongs, queueName]);

  const songSuggestions = useMemo<SongSuggestion[]>(() => {
    const query = normalizeText(queueSong).toLowerCase();
    if (!query) return [];
    const seen = new Set<string>();
    const suggestions: SongSuggestion[] = [];
    guestSongs.forEach((entry) => {
      if (normalizeText(entry.song) === '') return;
      if (!entry.song.toLowerCase().includes(query)) return;
      const key = normalizeText(entry.song).toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      suggestions.push({ id: `guest-${entry.id}`, song: entry.song, artist: entry.artist, fromGuest: true });
    });
    otherSongs.forEach((entry) => {
      if (!entry.song.toLowerCase().includes(query)) return;
      const key = normalizeText(entry.song).toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      suggestions.push({ id: `other-${entry.id}`, song: entry.song, artist: entry.artist, fromGuest: false });
    });
    return suggestions;
  }, [guestSongs, otherSongs, queueSong]);

  useEffect(() => {
    setNameHighlightIndex(-1);
  }, [queueName]);

  useEffect(() => {
    setSongHighlightIndex(-1);
  }, [queueSong]);

  const clearQueueJoinBanner = () => {
    if (queueJoinBannerTimer.current !== null) {
      window.clearTimeout(queueJoinBannerTimer.current);
      queueJoinBannerTimer.current = null;
    }
    setQueueJoinBannerPosition(null);
  };

  const showQueueJoinBanner = (position: number) => {
    clearQueueJoinBanner();
    setQueueJoinBannerPosition(position);
    queueJoinBannerTimer.current = window.setTimeout(() => {
      setQueueJoinBannerPosition(null);
      queueJoinBannerTimer.current = null;
    }, 4500);
  };

  useEffect(() => {
    return () => {
      if (queueJoinBannerTimer.current !== null) window.clearTimeout(queueJoinBannerTimer.current);
    };
  }, []);

  const pushGuestMessage = (message: string, tone: 'success' | 'error', anchorRowId?: string | null) => {
    setGuestActionMessage(message);
    setGuestActionTone(tone);
    setGuestActionRowId(anchorRowId ?? null);
    if (guestActionTimer.current) {
      window.clearTimeout(guestActionTimer.current);
    }
    guestActionTimer.current = window.setTimeout(() => {
      setGuestActionMessage(null);
      setGuestActionRowId(null);
    }, 2500);
  };

  useEffect(() => {
    if (!isDj || pendingAction === 'reorder') return;
    return monitorForElements({
      canMonitor: ({ source }) => source.data.listId === 'queue',
      onDragStart: ({ source }) => {
        setDraggingId(String(source.data.id ?? ''));
      },
      onDropTargetChange: ({ location }) => {
        const target = location.current.dropTargets[0];
        setOverId(target ? String(target.data.id ?? '') : null);
      },
      onDrop: ({ source, location }) => {
        const target = location.current.dropTargets[0];
        setDraggingId(null);
        setOverId(null);
        if (!target) return;
        const sourceId = String(source.data.id ?? '');
        const targetId = String(target.data.id ?? '');
        if (!sourceId || !targetId || sourceId === targetId) return;
        const prev = queueRef.current;
        const startIndex = prev.findIndex((item) => item.id === sourceId);
        const finishIndex = prev.findIndex((item) => item.id === targetId);
        if (startIndex === -1 || finishIndex === -1) return;
        const newOrder = reorder<KaraokeEntry>({ list: prev, startIndex, finishIndex });
        setPendingAction('reorder');
        void apiReorderQueue(newOrder.map((item) => item.id))
          .catch((err) => {
            pushGuestMessage(err instanceof Error ? err.message : 'Não foi possível reordenar.', 'error');
          })
          .finally(() => setPendingAction(null));
      },
    });
  }, [isDj, pendingAction, apiReorderQueue]);

  const addQueueEntry = async (rawName: string, rawSong: string, options: { clearInputs?: boolean; showErrors?: boolean } = {}) => {
    const name = normalizeText(rawName);
    const { song, artist } = splitSongArtist(rawSong);
    const showErrors = options.showErrors !== false;
    if (!name || !song) {
      if (showErrors) setQueueError('Preencha nome e música para entrar na fila.');
      return false;
    }
    const key = makeKey(name, song);
    if (queueKeys.has(key)) {
      if (showErrors) setQueueError('Essa inscrição já está na fila.');
      return false;
    }
    setPendingAction('queue');
    try {
      const state = await apiAddQueue(name, song, artist);
      const idx = state.queue.findIndex((e) => makeKey(e.name, e.song) === key);
      if (idx >= 0) showQueueJoinBanner(idx + 1);
      if (options.clearInputs !== false) {
        setQueueName('');
        setQueueSong('');
      }
      setQueueError('');
      return true;
    } catch (e) {
      clearQueueJoinBanner();
      if (showErrors) setQueueError(e instanceof Error ? e.message : 'Não foi possível entrar na fila.');
      return false;
    } finally {
      setPendingAction(null);
    }
  };

  const handleAddQueue = () => {
    void addQueueEntry(queueName, queueSong);
  };

  const handleAddGuestToQueue = async (entry: KaraokeEntry) => {
    const actionKey = `guest-fila-${entry.id}`;
    setPendingAction(actionKey);
    try {
      const state = await apiAddQueue(entry.name, entry.song, entry.artist, entry.youtubeUrl);
      const key = makeKey(entry.name, entry.song);
      const idx = state.queue.findIndex((e) => makeKey(e.name, e.song) === key);
      pushGuestMessage(
        idx >= 0 ? `Adicionado à fila! Posição #${idx + 1}.` : GUEST_ADDED_TO_QUEUE_MSG,
        'success',
        entry.id
      );
    } catch (e) {
      pushGuestMessage(e instanceof Error ? e.message : 'Erro ao adicionar à fila.', 'error', entry.id);
    } finally {
      setPendingAction(null);
    }
  };

  const handleRemoveGuestFromQueue = async (entry: KaraokeEntry, queueId: string): Promise<boolean> => {
    setPendingAction(`guest-fila-${entry.id}`);
    try {
      await apiRemoveQueue(queueId);
      pushGuestMessage(GUEST_REMOVED_FROM_QUEUE_MSG, 'success', entry.id);
      return true;
    } catch (e) {
      pushGuestMessage(e instanceof Error ? e.message : 'Erro ao remover da fila.', 'error', entry.id);
      return false;
    } finally {
      setPendingAction(null);
    }
  };

  const handleRemoveGuest = async (id: string) => {
    setPendingAction(`guest-remove-${id}`);
    try {
      await apiRemoveGuest(id);
    } catch (e) {
      pushGuestMessage(e instanceof Error ? e.message : 'Erro ao excluir.', 'error');
    } finally {
      setPendingAction(null);
    }
  };

  const handleSkipQueue = async (id: string) => {
    setPendingAction(`skip-${id}`);
    try {
      await apiSkipQueue(id);
    } catch (e) {
      pushGuestMessage(e instanceof Error ? e.message : 'Erro ao pular.', 'error');
    } finally {
      setPendingAction(null);
    }
  };

  const handleMoveQueueToNext = async (id: string) => {
    setPendingAction(`move-to-next-${id}`);
    try {
      await apiMoveQueueToNext(id);
    } catch (e) {
      pushGuestMessage(e instanceof Error ? e.message : 'Erro ao mover para o próximo.', 'error');
    } finally {
      setPendingAction(null);
    }
  };

  const handleRemoveQueue = async (id: string) => {
    setPendingAction(`remove-q-${id}`);
    try {
      await apiRemoveQueue(id);
    } catch (e) {
      pushGuestMessage(e instanceof Error ? e.message : 'Erro ao excluir.', 'error');
    } finally {
      setPendingAction(null);
    }
  };

  const handleSelectNameSuggestion = (suggestion: NameSuggestion) => {
    if (suggestion.kind === 'name') {
      setQueueName(suggestion.name);
      setQueueError('');
      setIsNameFocused(false);
      setNameHighlightIndex(-1);
      window.setTimeout(() => {
        songInputRef.current?.focus();
      }, 0);
      return;
    }
    if (suggestion.song) {
      setQueueName(suggestion.name);
      setQueueSong(formatSong(suggestion.song, suggestion.artist ?? ''));
      setQueueError('');
      setIsNameFocused(false);
      setIsSongFocused(false);
      setNameHighlightIndex(-1);
      setSongHighlightIndex(-1);
    }
  };

  const handleSelectSongSuggestion = (suggestion: SongSuggestion) => {
    setQueueSong(formatSong(suggestion.song, suggestion.artist ?? ''));
    setQueueError('');
    setIsSongFocused(false);
    setSongHighlightIndex(-1);
  };

  const handleNameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!nameSuggestions.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setNameHighlightIndex((prev) => (prev + 1 > nameSuggestions.length - 1 ? 0 : prev + 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setNameHighlightIndex((prev) => (prev - 1 < 0 ? nameSuggestions.length - 1 : prev - 1));
    }
    if (event.key === 'Enter' && nameHighlightIndex >= 0) {
      event.preventDefault();
      handleSelectNameSuggestion(nameSuggestions[nameHighlightIndex]);
    }
    if (event.key === 'Escape') {
      setIsNameFocused(false);
    }
  };

  const handleSongKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!songSuggestions.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSongHighlightIndex((prev) => (prev + 1 > songSuggestions.length - 1 ? 0 : prev + 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSongHighlightIndex((prev) => (prev - 1 < 0 ? songSuggestions.length - 1 : prev - 1));
    }
    if (event.key === 'Enter' && songHighlightIndex >= 0) {
      event.preventDefault();
      handleSelectSongSuggestion(songSuggestions[songHighlightIndex]);
    }
    if (event.key === 'Escape') {
      setIsSongFocused(false);
    }
  };

  const handleAddGuestSingle = async () => {
    const name = normalizeText(singleGuestName);
    const song = normalizeText(singleGuestSong);
    const artist = normalizeText(singleGuestArtist);
    const youtubeUrl = normalizeText(singleGuestYoutube);
    if (!name || !song) {
      setSingleGuestError('Preencha convidado e música para adicionar.');
      return;
    }
    const key = makeKey(name, song);
    if (guestKeys.has(key)) {
      setSingleGuestError('Essa combinação já foi adicionada.');
      return;
    }
    setPendingAction('guest-single');
    try {
      await apiAddGuest(name, song, artist, youtubeUrl);
      setSingleGuestName('');
      setSingleGuestSong('');
      setSingleGuestArtist('');
      setSingleGuestYoutube('');
      setSingleGuestError('');
    } catch (e) {
      setSingleGuestError(e instanceof Error ? e.message : 'Erro ao adicionar.');
    } finally {
      setPendingAction(null);
    }
  };

  const handleAddOtherSingle = async () => {
    const song = normalizeText(singleOtherSong);
    const artist = normalizeText(singleOtherArtist);
    const youtubeUrl = normalizeText(singleOtherYoutube);
    if (!song) {
      setSingleOtherError('Preencha a música para adicionar.');
      return;
    }
    const key = song.toLowerCase();
    if (otherSongKeys.has(key)) {
      setSingleOtherError('Essa música já foi adicionada.');
      return;
    }
    setPendingAction('other-single');
    try {
      await apiAddOther(song, artist, youtubeUrl);
      setSingleOtherSong('');
      setSingleOtherArtist('');
      setSingleOtherYoutube('');
      setSingleOtherError('');
    } catch (e) {
      setSingleOtherError(e instanceof Error ? e.message : 'Erro ao adicionar.');
    } finally {
      setPendingAction(null);
    }
  };

  const handleAddOtherBulk = async () => {
    const lines = otherBulkText.split(/\r?\n/).filter((line) => line.trim());
    const errors: string[] = [];
    const entriesToAdd: { song: string; artist: string; youtubeUrl: string }[] = [];
    const nextKeys = new Set(otherSongKeys);
    const firstNonEmptyLine = lines.find((line) => line.trim());
    const isTabMode = firstNonEmptyLine?.includes('\t') ?? false;

    lines.forEach((line, index) => {
      if (isTabMode) {
        const fields = line.split('\t');
        const song = normalizeImportedField(fields[0] ?? '');
        const artist = normalizeImportedField(fields[1] ?? '');
        const youtubeUrl = normalizeImportedField(fields[2] ?? '');
        const isHeaderRow =
          index === 0 &&
          [song, artist, youtubeUrl].map((value) => normalizeSearchText(value)).join('\t') ===
            'musica\tartista\tyoutube';

        if (isHeaderRow) return;
        if (!song) {
          errors.push(`Linha ${index + 1}: música inválida.`);
          return;
        }

        const key = song.toLowerCase();
        if (nextKeys.has(key)) {
          errors.push(`Linha ${index + 1}: já existe (duplicada).`);
          return;
        }

        nextKeys.add(key);
        entriesToAdd.push({ song, artist, youtubeUrl });
        return;
      }

      const { song, artist } = splitSongArtist(line);
      if (!song) {
        errors.push(`Linha ${index + 1}: música inválida.`);
        return;
      }
      const key = song.toLowerCase();
      if (nextKeys.has(key)) {
        errors.push(`Linha ${index + 1}: já existe (duplicada).`);
        return;
      }
      nextKeys.add(key);
      entriesToAdd.push({ song, artist, youtubeUrl: '' });
    });

    if (entriesToAdd.length === 0) {
      setOtherBulkErrors(errors);
      setOtherBulkAddedCount(0);
      return;
    }

    setPendingAction('other-bulk');
    try {
      const { added, errors: apiErrors } = await addOtherBulk(entriesToAdd);
      setOtherBulkErrors([...errors, ...apiErrors]);
      setOtherBulkAddedCount(added);
      if (added > 0) {
        setOtherBulkText('');
      }
      if (added > 0 && errors.length === 0 && apiErrors.length === 0) {
        closeOtherModal();
      }
    } catch (e) {
      setOtherBulkErrors([e instanceof Error ? e.message : 'Erro ao importar.']);
      setOtherBulkAddedCount(0);
    } finally {
      setPendingAction(null);
    }
  };

  const handleRemoveOther = async (id: string) => {
    setPendingAction(`other-remove-${id}`);
    try {
      await apiRemoveOther(id);
    } catch (e) {
      pushGuestMessage(e instanceof Error ? e.message : 'Erro ao excluir.', 'error');
    } finally {
      setPendingAction(null);
    }
  };

  const openRemoveAllGuestConfirm = () => {
    if (!isDj || guestSongs.length === 0) return;
    setIsRemoveAllGuestConfirmOpen(true);
  };

  const closeRemoveAllGuestConfirm = () => {
    setIsRemoveAllGuestConfirmOpen(false);
  };

  const openRemoveAllOtherConfirm = () => {
    if (!isDj || otherSongs.length === 0) return;
    setIsRemoveAllOtherConfirmOpen(true);
  };

  const closeRemoveAllOtherConfirm = () => {
    setIsRemoveAllOtherConfirmOpen(false);
  };

  const closeGuestQueueRemoveConfirm = () => {
    setGuestQueueRemoveConfirm(null);
  };

  const confirmGuestQueueRemoveFromQueue = async () => {
    if (!guestQueueRemoveConfirm) return;
    const { entry, queueId } = guestQueueRemoveConfirm;
    const ok = await handleRemoveGuestFromQueue(entry, queueId);
    if (ok) setGuestQueueRemoveConfirm(null);
  };

  const confirmRemoveAllGuestSongs = async () => {
    if (!isDj || guestSongs.length === 0) {
      closeRemoveAllGuestConfirm();
      return;
    }
    setPendingAction('guest-clear-all');
    try {
      await apiRemoveAllGuestSongs();
      closeRemoveAllGuestConfirm();
      pushGuestMessage('Todas as músicas dos convidados foram removidas.', 'success');
    } catch (e) {
      pushGuestMessage(e instanceof Error ? e.message : 'Erro ao remover.', 'error');
    } finally {
      setPendingAction(null);
    }
  };

  const confirmRemoveAllOtherSongs = async () => {
    if (!isDj || otherSongs.length === 0) {
      closeRemoveAllOtherConfirm();
      return;
    }
    setPendingAction('other-clear-all');
    try {
      await apiRemoveAllOtherSongs();
      closeRemoveAllOtherConfirm();
      pushGuestMessage('Todas as outras músicas foram removidas.', 'success');
    } catch (e) {
      pushGuestMessage(e instanceof Error ? e.message : 'Erro ao remover.', 'error');
    } finally {
      setPendingAction(null);
    }
  };

  const handleAddGuestBulk = async () => {
    const lines = bulkText.split(/\r?\n/).filter((line) => line.trim());
    const errors: string[] = [];
    const entries: { name: string; song: string; artist: string; youtubeUrl: string }[] = [];
    const nextKeys = new Set(guestKeys);
    const firstNonEmptyLine = lines.find((line) => line.trim());
    const isTabMode = firstNonEmptyLine?.includes('\t') ?? false;

    lines.forEach((line, index) => {
      if (isTabMode) {
        const fields = line.split('\t');
        const name = normalizeImportedField(fields[0] ?? '');
        const song = normalizeImportedField(fields[1] ?? '');
        const artist = normalizeImportedField(fields[2] ?? '');
        const youtubeUrl = normalizeImportedField(fields[3] ?? '');
        const isHeaderRow =
          index === 0 &&
          [name, song, artist, youtubeUrl].map((value) => normalizeSearchText(value)).join('\t') ===
            'nome\tmusica\tartista\tyoutube';

        if (isHeaderRow) return;
        if (!name) return;

        const key = makeKey(name, song);
        if (nextKeys.has(key)) {
          errors.push(`Linha ${index + 1}: já existe (duplicada).`);
          return;
        }

        nextKeys.add(key);
        entries.push({ name, song, artist, youtubeUrl });
        return;
      }

      const [rawName, ...rest] = line.split(':');
      const rawSong = rest.join(':');
      const name = normalizeImportedField(rawName || '');
      const song = normalizeImportedField(rawSong || '');
      if (!rawName || rest.length === 0) {
        errors.push(`Linha ${index + 1}: use o formato "Convidado: Música".`);
        return;
      }
      if (!name) {
        return;
      }
      const key = makeKey(name, song);
      if (nextKeys.has(key)) {
        errors.push(`Linha ${index + 1}: já existe (duplicada).`);
        return;
      }
      nextKeys.add(key);
      entries.push({ name, song, artist: '', youtubeUrl: '' });
    });

    if (entries.length === 0) {
      setBulkErrors(errors);
      setBulkAddedCount(0);
      return;
    }

    setPendingAction('guest-bulk');
    try {
      const { added, errors: apiErrors } = await addGuestBulk(entries);
      setBulkErrors([...errors, ...apiErrors]);
      setBulkAddedCount(added);
      if (added > 0) {
        setBulkText('');
      }
      if (added > 0 && errors.length === 0 && apiErrors.length === 0) {
        closeGuestModal();
      }
    } catch (e) {
      setBulkErrors([e instanceof Error ? e.message : 'Erro ao importar.']);
      setBulkAddedCount(0);
    } finally {
      setPendingAction(null);
    }
  };

  const closeGuestModal = () => {
    setIsGuestModalOpen(false);
    setIsRemoveAllGuestConfirmOpen(false);
    setGuestQueueRemoveConfirm(null);
    setSingleGuestError('');
    setBulkErrors([]);
    setBulkAddedCount(null);
  };

  const closeOtherModal = () => {
    setIsOtherModalOpen(false);
    setSingleOtherError('');
    setOtherBulkErrors([]);
    setOtherBulkAddedCount(null);
  };

  useEffect(() => {
    return () => {
      if (guestActionTimer.current) {
        window.clearTimeout(guestActionTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isDjModalOpen) return;
    const id = window.setTimeout(() => djPinInputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [isDjModalOpen]);

  const renderGuestFeedbackBanner = () => (
    <div
      className={`text-sm rounded-xl px-4 py-3 border ${
        guestActionTone === 'success'
          ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
          : 'text-rose-700 bg-rose-50 border-rose-100'
      }`}
    >
      <div className="flex flex-row flex-nowrap items-center justify-between gap-3">
        <span className="min-w-0 flex-1">{guestActionMessage}</span>
        {guestActionTone === 'success' &&
          (guestActionMessage === GUEST_ADDED_TO_QUEUE_MSG || guestActionMessage === GUEST_REMOVED_FROM_QUEUE_MSG) && (
            <button
              type="button"
              onClick={() => setActiveTab('queue')}
              className="shrink-0 font-semibold text-emerald-800 underline underline-offset-2 decoration-emerald-300 hover:text-emerald-900"
            >
              Ver fila
            </button>
          )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="relative h-[70dvh] flex items-center justify-center text-center px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Microfone em luzes de palco"
            className="w-full h-full object-cover brightness-[0.8]"
            style={{
              maskImage: 'linear-gradient(to bottom, black 0%, black 90%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 90%, transparent 100%)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#3d2b1f]/60 via-transparent via-60% to-[#fdfbf7]" />
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute bottom-0 left-0 right-0 h-[5dvh] bg-gradient-to-t from-[#fdfbf7] via-[#fdfbf7]/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-4xl animate-fadeIn">
          <div className="mb-6 inline-block bg-[#8b5e3c]/30 backdrop-blur-md px-6 py-2 rounded-full border border-white/40">
            <span className="text-white font-bold tracking-[0.2em] text-[10px] uppercase">Karaokê • Festa</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
            Karaokê dos Convidados
          </h1>
          <p className="text-xl md:text-2xl text-white font-light italic max-w-2xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
            "Escolha sua música e entre na fila para brilhar."
          </p>
        </div>
      </header>

      <section className="py-16 bg-[#fdfbf7] px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-[32px] border border-[#8b5e3c]/15 shadow-[0_30px_80px_-50px_rgba(61,43,31,0.35)] overflow-hidden">
            <div className="border-b border-[#8b5e3c]/10 bg-[#fbf7f1]">
              <div className="flex flex-wrap gap-3 items-center px-6 md:px-10 py-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('queue')}
                  aria-label="Fila"
                  title="Fila"
                  className={`inline-flex items-center justify-center rounded-full text-sm font-semibold uppercase tracking-wide transition-colors h-11 w-11 shrink-0 md:w-auto md:px-5 md:py-2 ${
                    activeTab === 'queue'
                      ? 'bg-[#8b5e3c] text-white'
                      : 'border border-[#8b5e3c]/30 text-[#8b5e3c] hover:bg-[#8b5e3c]/10'
                  }`}
                >
                  <Menu className="h-5 w-5 shrink-0 md:hidden" aria-hidden strokeWidth={2} />
                  <span className="hidden md:inline">Fila</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('music')}
                  aria-label="Músicas"
                  title="Músicas"
                  className={`inline-flex items-center justify-center rounded-full text-sm font-semibold uppercase tracking-wide transition-colors h-11 w-11 shrink-0 md:w-auto md:px-5 md:py-2 ${
                    activeTab === 'music'
                      ? 'bg-[#8b5e3c] text-white'
                      : 'border border-[#8b5e3c]/30 text-[#8b5e3c] hover:bg-[#8b5e3c]/10'
                  }`}
                >
                  <Music className="h-5 w-5 shrink-0 md:hidden" aria-hidden strokeWidth={2} />
                  <span className="hidden md:inline">Músicas</span>
                </button>
                {isDj ? (
                  <button
                    type="button"
                    onClick={() => {
                      logoutDj();
                      pushGuestMessage('Modo DJ encerrado.', 'success');
                    }}
                    aria-label="Sair do modo DJ"
                    title="Sair do modo DJ"
                    className="h-11 w-11 shrink-0 inline-flex items-center justify-center rounded-full border border-amber-600/40 text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors"
                  >
                    <LockOpen className="h-5 w-5 shrink-0" aria-hidden strokeWidth={1.75} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setDjError('');
                      setIsDjModalOpen(true);
                    }}
                    aria-label="Modo DJ"
                    title="Modo DJ"
                    className="h-11 w-11 shrink-0 inline-flex items-center justify-center rounded-full border border-[#8b5e3c]/40 text-[#8b5e3c] hover:bg-[#8b5e3c]/10 transition-colors"
                  >
                    <Lock className="h-5 w-5 shrink-0 opacity-60" aria-hidden strokeWidth={1.75} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleRefreshKaraoke()}
                  disabled={isRefreshingKaraoke}
                  aria-busy={isRefreshingKaraoke}
                  aria-label="Atualizar lista agora"
                  title="Atualizar lista agora"
                  className="h-11 w-11 shrink-0 inline-flex items-center justify-center rounded-full border border-[#8b5e3c]/35 text-[#8b5e3c] bg-white shadow-sm hover:bg-[#8b5e3c]/10 transition-colors disabled:opacity-60 disabled:pointer-events-none"
                >
                  {isRefreshingKaraoke ? (
                    <BtnSpinner className="h-5 w-5" />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {activeTab === 'music' && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-6 md:px-10 pb-4 pt-0">
                  <div className="flex flex-wrap gap-2 items-center">
                    <button
                      type="button"
                      onClick={() => setMusicSubTab('guest')}
                      className={`px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide transition-colors ${
                        musicSubTab === 'guest'
                          ? 'bg-[#8b5e3c] text-white'
                          : 'border border-[#8b5e3c]/30 text-[#8b5e3c] hover:bg-[#8b5e3c]/10'
                      }`}
                    >
                      Convidados
                    </button>
                    <button
                      type="button"
                      onClick={() => setMusicSubTab('other')}
                      className={`px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide transition-colors ${
                        musicSubTab === 'other'
                          ? 'bg-[#8b5e3c] text-white'
                          : 'border border-[#8b5e3c]/30 text-[#8b5e3c] hover:bg-[#8b5e3c]/10'
                      }`}
                    >
                      Outras
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      musicSubTab === 'guest' ? setIsGuestModalOpen(true) : setIsOtherModalOpen(true)
                    }
                    className="h-11 w-11 shrink-0 rounded-full bg-[#8b5e3c] text-white text-2xl font-light shadow-lg hover:bg-[#6f4b30] transition-colors"
                    aria-label={
                      musicSubTab === 'guest' ? 'Adicionar músicas dos convidados' : 'Adicionar outras músicas'
                    }
                    title={musicSubTab === 'guest' ? 'Adicionar músicas dos convidados' : 'Adicionar outras músicas'}
                  >
                    +
                  </button>
                </div>
              )}
            </div>

            <div className="px-6 md:px-10 py-8">
              {loadError && (
                <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {loadError}
                </div>
              )}
              {isLoading && (
                <div className="mb-6 text-center text-sm text-gray-500">Carregando dados do karaokê…</div>
              )}
              {activeTab === 'music' && musicSubTab === 'guest' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-3xl md:text-4xl font-serif text-[#3d2b1f] mb-3">Músicas dos Convidados</h2>
                    <p className="text-sm text-gray-500">Veja as sugestões já registradas para inspirar a noite.</p>
                  </div>

                  {guestActionMessage && guestActionRowId === null ? renderGuestFeedbackBanner() : null}

                  <div className={KARAOKE_TABLE_SCROLL_WRAP}>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[#8b5e3c]/20">
                          <th className="text-left py-3 px-4 text-[#3d2b1f] font-serif font-normal text-sm">Convidado</th>
                          <th className="hidden md:table-cell text-left py-3 px-4 text-[#3d2b1f] font-serif font-normal text-sm">
                            Música
                          </th>
                          <th className="text-right py-3 px-4 text-[#3d2b1f] font-serif font-normal text-sm">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleGuestSongs.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-8 px-4 text-center text-gray-500 text-sm">
                              Nenhuma música adicionada ainda. Clique no + para começar.
                            </td>
                          </tr>
                        ) : (
                          visibleGuestSongs.map((entry) => {
                            const queueKey = makeKey(entry.name, entry.song);
                            const queueEntryIdForGuest = queueKeyToId.get(queueKey);
                            const queueIndex = queueEntryIdForGuest
                              ? queue.findIndex((q) => q.id === queueEntryIdForGuest)
                              : -1;
                            const inQueue = queueIndex >= 0;
                            const queuePosition = inQueue ? queueIndex + 1 : null;
                            return (
                            <React.Fragment key={entry.id}>
                              <tr className="border-b border-[#8b5e3c]/10 hover:bg-[#8b5e3c]/5 transition-colors">
                                <td className="py-3 px-4 text-[#3d2b1f] font-medium">
                                  <span className="block">{entry.name}</span>
                                  <span className="block md:hidden text-xs text-gray-500/90 mt-0.5 leading-snug">
                                    {formatSong(entry.song, entry.artist)}
                                  </span>
                                </td>
                                <td className="hidden md:table-cell py-3 px-4 text-gray-600">
                                  {formatSong(entry.song, entry.artist)}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center justify-end gap-2">
                                    {entry.youtubeUrl ? (
                                      <a
                                        href={entry.youtubeUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Abrir no YouTube"
                                        title="Abrir no YouTube"
                                        className="inline-flex items-center justify-center gap-1.5 h-9 w-9 shrink-0 rounded-full border border-[#8b5e3c]/25 text-[#c23b2a] hover:bg-[#8b5e3c]/10 transition-colors"
                                      >
                                        <Youtube className="h-4 w-4" aria-hidden />
                                      </a>
                                    ) : null}
                                    <button
                                      type="button"
                                      disabled={isBusy(`guest-fila-${entry.id}`)}
                                      aria-busy={isBusy(`guest-fila-${entry.id}`)}
                                      aria-label={
                                        inQueue && queuePosition !== null
                                          ? `Remover da fila (#${queuePosition})`
                                          : 'Para fila'
                                      }
                                      title={
                                        inQueue && queuePosition !== null
                                          ? `Remover da fila (#${queuePosition})`
                                          : 'Para fila'
                                      }
                                      onClick={() => {
                                        if (!inQueue || !queueEntryIdForGuest || queuePosition === null) {
                                          void handleAddGuestToQueue(entry);
                                          return;
                                        }
                                        setGuestQueueRemoveConfirm({
                                          entry,
                                          queueId: queueEntryIdForGuest,
                                          position: queuePosition,
                                        });
                                      }}
                                      className="inline-flex items-center justify-center gap-1.5 h-9 min-w-[2.75rem] shrink-0 rounded-full border border-[#8b5e3c]/30 text-[#8b5e3c] hover:bg-[#8b5e3c]/10 transition-colors text-xs font-semibold uppercase tracking-wide md:min-w-[5.5rem] md:w-auto md:px-4 px-2 disabled:opacity-60 disabled:pointer-events-none"
                                    >
                                      {isBusy(`guest-fila-${entry.id}`) ? (
                                        <BtnSpinner className="h-3.5 w-3.5" />
                                      ) : (
                                        <>
                                          {inQueue && queuePosition !== null ? (
                                            <span className="tabular-nums font-semibold leading-none normal-case">
                                              {`#${queuePosition}`}
                                            </span>
                                          ) : (
                                            <>
                                              <ListEnd className="h-4 w-4 md:hidden" aria-hidden />
                                              <span className="hidden md:inline">Para fila</span>
                                            </>
                                          )}
                                        </>
                                      )}
                                    </button>
                                    {isDj && (
                                      <button
                                        type="button"
                                        disabled={isBusy(`guest-remove-${entry.id}`)}
                                        aria-busy={isBusy(`guest-remove-${entry.id}`)}
                                        aria-label="Excluir"
                                        title="Excluir"
                                        onClick={() => void handleRemoveGuest(entry.id)}
                                        className="inline-flex items-center justify-center gap-1.5 h-9 w-9 shrink-0 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors text-xs font-semibold uppercase tracking-wide md:min-w-[5.5rem] md:w-auto md:px-4 px-0 disabled:opacity-60 disabled:pointer-events-none"
                                      >
                                        {isBusy(`guest-remove-${entry.id}`) ? (
                                          <BtnSpinner className="h-3.5 w-3.5" />
                                        ) : (
                                          <>
                                            <IconTrash className="h-4 w-4 md:hidden" />
                                            <span className="hidden md:inline">Excluir</span>
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                              {guestActionMessage && guestActionRowId === entry.id ? (
                                <tr className="border-b border-[#8b5e3c]/10">
                                  <td colSpan={3} className="px-4 pb-3 pt-1">
                                    {renderGuestFeedbackBanner()}
                                  </td>
                                </tr>
                              ) : null}
                            </React.Fragment>
                          );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'music' && musicSubTab === 'other' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-3xl md:text-4xl font-serif text-[#3d2b1f] mb-3">Outras músicas</h2>
                    <p className="text-sm text-gray-500">Lista livre para outras sugestões sem convidado específico.</p>
                  </div>

                  <div className={KARAOKE_TABLE_SCROLL_WRAP}>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[#8b5e3c]/20">
                          <th className="text-left py-3 px-4 text-[#3d2b1f] font-serif font-normal text-sm">Música</th>
                          {showOtherActions ? (
                            <th className="text-right py-3 px-4 text-[#3d2b1f] font-serif font-normal text-sm">Ações</th>
                          ) : null}
                        </tr>
                      </thead>
                      <tbody>
                        {otherSongs.length === 0 ? (
                          <tr>
                            <td colSpan={showOtherActions ? 2 : 1} className="py-8 px-4 text-center text-gray-500 text-sm">
                              Nenhuma música adicionada ainda. Clique no + para começar.
                            </td>
                          </tr>
                        ) : (
                          otherSongs.map((entry) => (
                            <tr key={entry.id} className="border-b border-[#8b5e3c]/10 hover:bg-[#8b5e3c]/5 transition-colors">
                              <td className="py-3 px-4 text-[#3d2b1f] font-medium">{formatSong(entry.song, entry.artist)}</td>
                              {showOtherActions ? (
                                <td className="py-3 px-4">
                                  <div className="flex items-center justify-end gap-2">
                                    {entry.youtubeUrl ? (
                                      <a
                                        href={entry.youtubeUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Abrir no YouTube"
                                        title="Abrir no YouTube"
                                        className="inline-flex items-center justify-center gap-1.5 h-9 w-9 shrink-0 rounded-full border border-[#8b5e3c]/25 text-[#c23b2a] hover:bg-[#8b5e3c]/10 transition-colors"
                                      >
                                        <Youtube className="h-4 w-4" aria-hidden />
                                      </a>
                                    ) : null}
                                    {isDj ? (
                                      <button
                                        type="button"
                                        disabled={isBusy(`other-remove-${entry.id}`)}
                                        aria-busy={isBusy(`other-remove-${entry.id}`)}
                                        aria-label="Excluir"
                                        title="Excluir"
                                        onClick={() => void handleRemoveOther(entry.id)}
                                        className="inline-flex items-center justify-center gap-1.5 h-9 w-9 shrink-0 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors text-xs font-semibold uppercase tracking-wide md:min-w-[5.5rem] md:w-auto md:px-4 px-0 disabled:opacity-60 disabled:pointer-events-none"
                                      >
                                        {isBusy(`other-remove-${entry.id}`) ? (
                                          <BtnSpinner className="h-3.5 w-3.5" />
                                        ) : (
                                          <>
                                            <IconTrash className="h-4 w-4 md:hidden" />
                                            <span className="hidden md:inline">Excluir</span>
                                          </>
                                        )}
                                      </button>
                                    ) : null}
                                  </div>
                                </td>
                              ) : null}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'queue' && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-3xl md:text-4xl font-serif text-[#3d2b1f] mb-3">Fila</h2>
                    <p className="text-sm text-gray-500">Digite seu nome e a música para entrar na fila.</p>
                  </div>

                  <div className="bg-[#fdfbf7] border border-[#8b5e3c]/15 rounded-2xl p-5">
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        handleAddQueue();
                      }}
                      className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr_auto] gap-3 items-center"
                    >
                      <div className="relative">
                        <input
                          ref={nameInputRef}
                          value={queueName}
                          disabled={isBusy('queue')}
                          onChange={(event) => {
                            setQueueName(event.target.value);
                            setQueueError('');
                          }}
                          onFocus={() => setIsNameFocused(true)}
                          onBlur={() => {
                            window.setTimeout(() => setIsNameFocused(false), 120);
                          }}
                          onKeyDown={handleNameKeyDown}
                          placeholder="Nome do convidado"
                          className="w-full px-4 py-3 rounded-xl border border-[#8b5e3c]/20 focus:outline-none focus:ring-2 focus:ring-[#8b5e3c]/30 text-sm disabled:bg-[#f5f0ea] disabled:text-gray-500"
                        />
                        {isNameFocused && nameSuggestions.length > 0 && (
                          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-[#e6d5c3] bg-white shadow-lg max-h-56 overflow-y-auto">
                            {nameSuggestions.map((suggestion, index) => (
                              <button
                                key={suggestion.id}
                                type="button"
                                onMouseDown={(event) => event.preventDefault()}
                                onMouseEnter={() => setNameHighlightIndex(index)}
                                onClick={() => handleSelectNameSuggestion(suggestion)}
                                className={`w-full px-4 py-3 text-left transition-colors ${
                                  index === nameHighlightIndex ? 'bg-[#f3eee7]' : 'hover:bg-[#f7efe5]'
                                }`}
                              >
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-[#3d2b1f]">{suggestion.name}</span>
                                  {suggestion.kind === 'pair' && suggestion.song && (
                                    <span className="text-xs text-gray-500">
                                      {formatSong(suggestion.song, suggestion.artist ?? '')}
                                    </span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          ref={songInputRef}
                          value={queueSong}
                          disabled={isBusy('queue')}
                          onChange={(event) => {
                            setQueueSong(event.target.value);
                            setQueueError('');
                          }}
                          onFocus={() => setIsSongFocused(true)}
                          onBlur={() => {
                            window.setTimeout(() => setIsSongFocused(false), 120);
                          }}
                          onKeyDown={handleSongKeyDown}
                          placeholder="Música - Artista"
                          className="w-full px-4 py-3 rounded-xl border border-[#8b5e3c]/20 focus:outline-none focus:ring-2 focus:ring-[#8b5e3c]/30 text-sm disabled:bg-[#f5f0ea] disabled:text-gray-500"
                        />
                        {isSongFocused && songSuggestions.length > 0 && (
                          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-[#e6d5c3] bg-white shadow-lg max-h-56 overflow-y-auto">
                            {songSuggestions.map((suggestion, index) => (
                              <button
                                key={suggestion.id}
                                type="button"
                                onMouseDown={(event) => event.preventDefault()}
                                onMouseEnter={() => setSongHighlightIndex(index)}
                                onClick={() => handleSelectSongSuggestion(suggestion)}
                                className={`w-full px-4 py-3 text-left transition-colors ${
                                  index === songHighlightIndex ? 'bg-[#f3eee7]' : 'hover:bg-[#f7efe5]'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {suggestion.fromGuest && (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                      className="h-4 w-4 text-amber-600"
                                      aria-hidden="true"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M9.401 3.003a1.5 1.5 0 012.598 0l7.197 12.494a1.5 1.5 0 01-1.299 2.25H3.503a1.5 1.5 0 01-1.3-2.25L9.4 3.003zM12 8.25a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0v-4.5A.75.75 0 0012 8.25zm0 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                  <span
                                    className={`text-sm font-medium ${
                                      suggestion.fromGuest ? 'text-[#5b4639]' : 'text-[#3d2b1f]'
                                    }`}
                                  >
                                    {formatSong(suggestion.song, suggestion.artist ?? '')}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        type="submit"
                        disabled={isBusy('queue')}
                        aria-busy={isBusy('queue')}
                        className="w-full md:w-auto min-w-[10rem] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#8b5e3c] text-white font-semibold text-sm uppercase tracking-wide hover:bg-[#6f4b30] transition-colors disabled:opacity-70 disabled:pointer-events-none"
                      >
                        {isBusy('queue') ? <BtnSpinner className="h-4 w-4 text-white" /> : null}
                        {isBusy('queue') ? 'Enviando…' : 'Entrar na fila'}
                      </button>
                    </form>
                    {queueJoinBannerPosition !== null ? (
                      <p
                        role="status"
                        className="mt-3 rounded-xl border border-[#8b5e3c]/20 bg-[#f4f7ef] px-4 py-3 text-sm text-[#3d2b1f]"
                      >
                        Adicionado à fila! Posição #{queueJoinBannerPosition}.
                      </p>
                    ) : null}
                    {queueError && <p className="mt-3 text-sm text-rose-600">{queueError}</p>}
                  </div>

                  <div className={KARAOKE_TABLE_SCROLL_WRAP}>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[#8b5e3c]/20">
                          <th className="hidden md:table-cell align-middle text-left py-3 px-4 text-[#3d2b1f] font-serif font-normal text-sm">
                            Status
                          </th>
                          <th className="align-middle text-left py-3 px-4 text-[#3d2b1f] font-serif font-normal text-sm">
                            Convidado
                          </th>
                          <th className="hidden md:table-cell align-middle text-left py-3 px-4 text-[#3d2b1f] font-serif font-normal text-sm">
                            Música
                          </th>
                          {isDj ? (
                            <th className="hidden md:table-cell align-middle text-right py-3 px-4 text-[#3d2b1f] font-serif font-normal text-sm">
                              Ações
                            </th>
                          ) : null}
                        </tr>
                      </thead>
                      <tbody>
                        {queue.length === 0 ? (
                          <tr>
                            <td colSpan={isDj ? 4 : 3} className="py-8 px-4 text-center text-gray-500 text-sm">
                              A fila está vazia no momento.
                            </td>
                          </tr>
                        ) : (
                          queueWithYoutube.map((entry, index) => (
                            <QueueRow
                              key={entry.id}
                              item={entry}
                              index={index}
                              isDragging={draggingId === entry.id}
                              isOver={overId === entry.id}
                              isDj={isDj}
                              dragDisabled={pendingAction === 'reorder'}
                              skipLoading={isBusy(`skip-${entry.id}`)}
                              moveToNextLoading={isBusy(`move-to-next-${entry.id}`)}
                              removeLoading={isBusy(`remove-q-${entry.id}`)}
                              onSkip={handleSkipQueue}
                              onMoveToNext={handleMoveQueueToNext}
                              onRemove={handleRemoveQueue}
                            />
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#3d2b1f] text-white py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-2xl font-serif mb-6 italic opacity-80">Faça sua voz brilhar!</h3>
          <p className="text-5xl md:text-6xl font-serif mb-8 text-[#e6d5c3]">Yosha & Mark</p>
          <div className="flex justify-center gap-6 mb-10 opacity-40">
            <span className="w-16 h-[1px] bg-white self-center"></span>
            <span className="text-[10px] uppercase tracking-[0.4em]">Karaokê</span>
            <span className="w-16 h-[1px] bg-white self-center"></span>
          </div>
        </div>
      </footer>

      {isGuestModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={closeGuestModal}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative p-6 md:p-8">
              <button
                onClick={closeGuestModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Fechar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="text-center mb-6">
                <h3 className="text-2xl md:text-3xl font-serif text-[#8b5e3c] mb-2">Adicionar Músicas</h3>
                <p className="text-sm text-gray-500">Inclua uma música individual ou cole várias linhas de uma vez.</p>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleAddGuestSingle();
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end mb-6"
              >
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-gray-500">Convidado</label>
                  <input
                    value={singleGuestName}
                    disabled={isBusy('guest-single') || isBusy('guest-bulk') || isBusy('guest-clear-all')}
                    onChange={(event) => {
                      setSingleGuestName(event.target.value);
                      setSingleGuestError('');
                    }}
                    placeholder="Nome do convidado"
                    className="w-full px-4 py-3 rounded-xl border border-[#8b5e3c]/20 focus:outline-none focus:ring-2 focus:ring-[#8b5e3c]/30 text-sm disabled:bg-[#f5f0ea] disabled:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-gray-500">Música</label>
                  <input
                    value={singleGuestSong}
                    disabled={isBusy('guest-single') || isBusy('guest-bulk') || isBusy('guest-clear-all')}
                    onChange={(event) => {
                      setSingleGuestSong(event.target.value);
                      setSingleGuestError('');
                    }}
                    placeholder="Música"
                    className="w-full px-4 py-3 rounded-xl border border-[#8b5e3c]/20 focus:outline-none focus:ring-2 focus:ring-[#8b5e3c]/30 text-sm disabled:bg-[#f5f0ea] disabled:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-gray-500">Artista</label>
                  <input
                    value={singleGuestArtist}
                    disabled={isBusy('guest-single') || isBusy('guest-bulk') || isBusy('guest-clear-all')}
                    onChange={(event) => {
                      setSingleGuestArtist(event.target.value);
                      setSingleGuestError('');
                    }}
                    placeholder="Artista"
                    className="w-full px-4 py-3 rounded-xl border border-[#8b5e3c]/20 focus:outline-none focus:ring-2 focus:ring-[#8b5e3c]/30 text-sm disabled:bg-[#f5f0ea] disabled:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-gray-500">YouTube</label>
                  <input
                    value={singleGuestYoutube}
                    disabled={isBusy('guest-single') || isBusy('guest-bulk') || isBusy('guest-clear-all')}
                    onChange={(event) => {
                      setSingleGuestYoutube(event.target.value);
                      setSingleGuestError('');
                    }}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full px-4 py-3 rounded-xl border border-[#8b5e3c]/20 focus:outline-none focus:ring-2 focus:ring-[#8b5e3c]/30 text-sm disabled:bg-[#f5f0ea] disabled:text-gray-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isBusy('guest-single') || isBusy('guest-bulk') || isBusy('guest-clear-all')}
                  aria-busy={isBusy('guest-single')}
                  className="w-full md:col-span-2 md:w-auto md:justify-self-start min-w-[8rem] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#8b5e3c] text-white font-semibold text-sm uppercase tracking-wide hover:bg-[#6f4b30] transition-colors disabled:opacity-70 disabled:pointer-events-none"
                >
                  {isBusy('guest-single') ? <BtnSpinner className="h-4 w-4 text-white" /> : null}
                  {isBusy('guest-single') ? 'Enviando…' : 'Adicionar'}
                </button>
              </form>
              {singleGuestError && <p className="text-sm text-rose-600 mb-6">{singleGuestError}</p>}

              <div className="border-t border-[#8b5e3c]/10 pt-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h4 className="text-lg font-serif text-[#3d2b1f]">Adicionar em lote</h4>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={isBusy('guest-single') || isBusy('guest-bulk') || isBusy('guest-clear-all')}
                      aria-busy={isBusy('guest-bulk')}
                      onClick={() => void handleAddGuestBulk()}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-[#8b5e3c]/30 text-[#8b5e3c] hover:bg-[#8b5e3c]/10 transition-colors text-xs font-semibold uppercase tracking-wide disabled:opacity-60 disabled:pointer-events-none"
                    >
                      {isBusy('guest-bulk') ? <BtnSpinner className="h-3.5 w-3.5" /> : null}
                      {isBusy('guest-bulk') ? 'Importando…' : 'Importar linhas'}
                    </button>
                    {isDj ? (
                      <button
                        type="button"
                        disabled={
                          guestSongs.length === 0 ||
                          isBusy('guest-single') ||
                          isBusy('guest-bulk') ||
                          isBusy('guest-clear-all')
                        }
                        aria-busy={isBusy('guest-clear-all')}
                        onClick={openRemoveAllGuestConfirm}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors text-xs font-semibold uppercase tracking-wide disabled:opacity-60 disabled:pointer-events-none"
                      >
                        {isBusy('guest-clear-all') ? <BtnSpinner className="h-3.5 w-3.5" /> : null}
                        {isBusy('guest-clear-all') ? 'Removendo…' : 'Remover tudo'}
                      </button>
                    ) : null}
                  </div>
                </div>
                <textarea
                  value={bulkText}
                  disabled={isBusy('guest-single') || isBusy('guest-bulk') || isBusy('guest-clear-all')}
                  onChange={(event) => setBulkText(event.target.value)}
                  placeholder={`Nome\tMusica\tArtista\tYoutube\nMateus Ramos Batschauer\tNão é sério\tCharlie Brown Jr.\thttps://youtube.com/watch?v=...\nTaciana Floriani\tAquarela\tToquinho\t<empty>`}
                  className="w-full min-h-[160px] px-4 py-3 rounded-xl border border-[#8b5e3c]/20 focus:outline-none focus:ring-2 focus:ring-[#8b5e3c]/30 text-sm disabled:bg-[#f5f0ea] disabled:text-gray-500"
                />
                <div className="mt-4 space-y-3">
                  {bulkAddedCount !== null && (
                    <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3">
                      {bulkAddedCount === 0
                        ? 'Nenhuma nova linha salva.'
                        : `${bulkAddedCount} linha${bulkAddedCount === 1 ? '' : 's'} salva${bulkAddedCount === 1 ? '' : 's'} com sucesso.`}
                    </div>
                  )}
                  {bulkErrors.length > 0 && (
                    <div className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-4 py-3">
                      <p className="font-semibold mb-2">Erros encontrados:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {bulkErrors.map((error) => (
                          <li key={error}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isRemoveAllGuestConfirmOpen && (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/60"
          onClick={closeRemoveAllGuestConfirm}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl p-6 md:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-all-guest-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="remove-all-guest-title" className="text-xl font-serif text-[#3d2b1f] mb-2">
              Remover todas as músicas?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Remover todas as {guestSongs.length} música{guestSongs.length === 1 ? '' : 's'} dos convidados? Esta ação
              não pode ser desfeita.
            </p>
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeRemoveAllGuestConfirm}
                disabled={isBusy('guest-clear-all')}
                className="inline-flex items-center justify-center min-h-[2.75rem] px-5 py-2.5 rounded-xl border border-[#8b5e3c]/30 text-[#8b5e3c] hover:bg-[#8b5e3c]/10 transition-colors text-sm font-semibold uppercase tracking-wide disabled:opacity-60 disabled:pointer-events-none"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmRemoveAllGuestSongs()}
                disabled={isBusy('guest-clear-all')}
                aria-busy={isBusy('guest-clear-all')}
                className="inline-flex items-center justify-center gap-2 min-h-[2.75rem] px-5 py-2.5 rounded-xl bg-rose-600 text-white font-semibold text-sm uppercase tracking-wide hover:bg-rose-700 transition-colors disabled:opacity-70 disabled:pointer-events-none"
              >
                {isBusy('guest-clear-all') ? <BtnSpinner className="h-4 w-4 text-white" /> : null}
                {isBusy('guest-clear-all') ? 'Removendo…' : 'Remover tudo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {guestQueueRemoveConfirm && (
        <div
          className="fixed inset-0 z-[56] flex items-center justify-center p-4 bg-black/60"
          onClick={closeGuestQueueRemoveConfirm}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl p-6 md:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guest-queue-remove-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="guest-queue-remove-title" className="text-xl font-serif text-[#3d2b1f] mb-2">
              Remover da fila?
            </h3>
            <p className="text-sm text-[#3d2b1f] font-medium mb-1">
              {guestQueueRemoveConfirm.entry.name}
              <span className="text-gray-400 font-normal"> · </span>
              {formatSong(guestQueueRemoveConfirm.entry.song, guestQueueRemoveConfirm.entry.artist)}
            </p>
            <p className="text-sm text-gray-600 mb-6">
              Posição {guestQueueRemoveConfirm.position} na fila. Remover esta inscrição?
            </p>
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeGuestQueueRemoveConfirm}
                disabled={isBusy(`guest-fila-${guestQueueRemoveConfirm.entry.id}`)}
                className="inline-flex items-center justify-center min-h-[2.75rem] px-5 py-2.5 rounded-xl border border-[#8b5e3c]/30 text-[#8b5e3c] hover:bg-[#8b5e3c]/10 transition-colors text-sm font-semibold uppercase tracking-wide disabled:opacity-60 disabled:pointer-events-none"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmGuestQueueRemoveFromQueue()}
                disabled={isBusy(`guest-fila-${guestQueueRemoveConfirm.entry.id}`)}
                aria-busy={isBusy(`guest-fila-${guestQueueRemoveConfirm.entry.id}`)}
                className="inline-flex items-center justify-center gap-2 min-h-[2.75rem] px-5 py-2.5 rounded-xl bg-rose-600 text-white font-semibold text-sm uppercase tracking-wide hover:bg-rose-700 transition-colors disabled:opacity-70 disabled:pointer-events-none"
              >
                {isBusy(`guest-fila-${guestQueueRemoveConfirm.entry.id}`) ? (
                  <BtnSpinner className="h-4 w-4 text-white" />
                ) : null}
                {isBusy(`guest-fila-${guestQueueRemoveConfirm.entry.id}`) ? 'Removendo…' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isOtherModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={closeOtherModal}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative p-6 md:p-8">
              <button
                onClick={closeOtherModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Fechar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="text-center mb-6">
                <h3 className="text-2xl md:text-3xl font-serif text-[#8b5e3c] mb-2">Adicionar Outras Músicas</h3>
                <p className="text-sm text-gray-500">Inclua músicas sem convidado específico.</p>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleAddOtherSingle();
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end mb-6"
              >
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-gray-500">Música</label>
                  <input
                    value={singleOtherSong}
                    disabled={isBusy('other-single') || isBusy('other-bulk') || isBusy('other-clear-all')}
                    onChange={(event) => {
                      setSingleOtherSong(event.target.value);
                      setSingleOtherError('');
                    }}
                    placeholder="Música"
                    className="w-full px-4 py-3 rounded-xl border border-[#8b5e3c]/20 focus:outline-none focus:ring-2 focus:ring-[#8b5e3c]/30 text-sm disabled:bg-[#f5f0ea] disabled:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-gray-500">Artista</label>
                  <input
                    value={singleOtherArtist}
                    disabled={isBusy('other-single') || isBusy('other-bulk') || isBusy('other-clear-all')}
                    onChange={(event) => {
                      setSingleOtherArtist(event.target.value);
                      setSingleOtherError('');
                    }}
                    placeholder="Artista"
                    className="w-full px-4 py-3 rounded-xl border border-[#8b5e3c]/20 focus:outline-none focus:ring-2 focus:ring-[#8b5e3c]/30 text-sm disabled:bg-[#f5f0ea] disabled:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-gray-500">YouTube</label>
                  <input
                    value={singleOtherYoutube}
                    disabled={isBusy('other-single') || isBusy('other-bulk') || isBusy('other-clear-all')}
                    onChange={(event) => {
                      setSingleOtherYoutube(event.target.value);
                      setSingleOtherError('');
                    }}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full px-4 py-3 rounded-xl border border-[#8b5e3c]/20 focus:outline-none focus:ring-2 focus:ring-[#8b5e3c]/30 text-sm disabled:bg-[#f5f0ea] disabled:text-gray-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isBusy('other-single') || isBusy('other-bulk') || isBusy('other-clear-all')}
                  aria-busy={isBusy('other-single')}
                  className="w-full md:col-span-2 md:w-auto md:justify-self-start min-w-[8rem] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#8b5e3c] text-white font-semibold text-sm uppercase tracking-wide hover:bg-[#6f4b30] transition-colors disabled:opacity-70 disabled:pointer-events-none"
                >
                  {isBusy('other-single') ? <BtnSpinner className="h-4 w-4 text-white" /> : null}
                  {isBusy('other-single') ? 'Enviando…' : 'Adicionar'}
                </button>
              </form>
              {singleOtherError && <p className="text-sm text-rose-600 mb-6">{singleOtherError}</p>}

              <div className="border-t border-[#8b5e3c]/10 pt-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h4 className="text-lg font-serif text-[#3d2b1f]">Adicionar em lote</h4>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={isBusy('other-single') || isBusy('other-bulk') || isBusy('other-clear-all')}
                      aria-busy={isBusy('other-bulk')}
                      onClick={() => void handleAddOtherBulk()}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-[#8b5e3c]/30 text-[#8b5e3c] hover:bg-[#8b5e3c]/10 transition-colors text-xs font-semibold uppercase tracking-wide disabled:opacity-60 disabled:pointer-events-none"
                    >
                      {isBusy('other-bulk') ? <BtnSpinner className="h-3.5 w-3.5" /> : null}
                      {isBusy('other-bulk') ? 'Importando…' : 'Importar linhas'}
                    </button>
                    {isDj ? (
                      <button
                        type="button"
                        disabled={
                          otherSongs.length === 0 ||
                          isBusy('other-single') ||
                          isBusy('other-bulk') ||
                          isBusy('other-clear-all')
                        }
                        aria-busy={isBusy('other-clear-all')}
                        onClick={openRemoveAllOtherConfirm}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors text-xs font-semibold uppercase tracking-wide disabled:opacity-60 disabled:pointer-events-none"
                      >
                        {isBusy('other-clear-all') ? <BtnSpinner className="h-3.5 w-3.5" /> : null}
                        {isBusy('other-clear-all') ? 'Removendo…' : 'Remover tudo'}
                      </button>
                    ) : null}
                  </div>
                </div>
                <textarea
                  value={otherBulkText}
                  disabled={isBusy('other-single') || isBusy('other-bulk') || isBusy('other-clear-all')}
                  onChange={(event) => setOtherBulkText(event.target.value)}
                  placeholder={`Musica\tArtista\tYoutube\nNão é sério\tCharlie Brown Jr.\thttps://youtube.com/watch?v=...\nAquarela\tToquinho\t<empty>`}
                  className="w-full min-h-[160px] px-4 py-3 rounded-xl border border-[#8b5e3c]/20 focus:outline-none focus:ring-2 focus:ring-[#8b5e3c]/30 text-sm disabled:bg-[#f5f0ea] disabled:text-gray-500"
                />
                <div className="mt-4 space-y-3">
                  {otherBulkAddedCount !== null && (
                    <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3">
                      {otherBulkAddedCount === 0
                        ? 'Nenhuma nova música adicionada.'
                        : `${otherBulkAddedCount} música${otherBulkAddedCount === 1 ? '' : 's'} adicionada${
                            otherBulkAddedCount === 1 ? '' : 's'
                          } com sucesso.`}
                    </div>
                  )}
                  {otherBulkErrors.length > 0 && (
                    <div className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-4 py-3">
                      <p className="font-semibold mb-2">Erros encontrados:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {otherBulkErrors.map((error) => (
                          <li key={error}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isRemoveAllOtherConfirmOpen && (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/60"
          onClick={closeRemoveAllOtherConfirm}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl p-6 md:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-all-other-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="remove-all-other-title" className="text-xl font-serif text-[#3d2b1f] mb-2">
              Remover todas as músicas?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Remover todas as {otherSongs.length} música{otherSongs.length === 1 ? '' : 's'} da lista de outras músicas?
              {' '}Esta ação não pode ser desfeita.
            </p>
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeRemoveAllOtherConfirm}
                disabled={isBusy('other-clear-all')}
                className="inline-flex items-center justify-center min-h-[2.75rem] px-5 py-2.5 rounded-xl border border-[#8b5e3c]/30 text-[#8b5e3c] hover:bg-[#8b5e3c]/10 transition-colors text-sm font-semibold uppercase tracking-wide disabled:opacity-60 disabled:pointer-events-none"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmRemoveAllOtherSongs()}
                disabled={isBusy('other-clear-all')}
                aria-busy={isBusy('other-clear-all')}
                className="inline-flex items-center justify-center gap-2 min-h-[2.75rem] px-5 py-2.5 rounded-xl bg-rose-600 text-white font-semibold text-sm uppercase tracking-wide hover:bg-rose-700 transition-colors disabled:opacity-70 disabled:pointer-events-none"
              >
                {isBusy('other-clear-all') ? <BtnSpinner className="h-4 w-4 text-white" /> : null}
                {isBusy('other-clear-all') ? 'Removendo…' : 'Remover tudo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDjModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60"
          onClick={() => {
            setIsDjModalOpen(false);
            setDjError('');
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl p-6 md:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dj-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="dj-modal-title" className="text-xl font-serif text-[#8b5e3c] mb-2">
              Modo DJ
            </h3>
            <p className="text-sm text-gray-500 mb-4">Digite o PIN para gerir a fila e as listas.</p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void (async () => {
                  setPendingAction('dj-login');
                  try {
                    await loginDj(djPinInput);
                    setIsDjModalOpen(false);
                    setDjPinInput('');
                    setDjError('');
                    pushGuestMessage('Modo DJ ativado.', 'success');
                  } catch (err) {
                    setDjError(err instanceof Error ? err.message : 'PIN inválido');
                  } finally {
                    setPendingAction(null);
                  }
                })();
              }}
              className="space-y-4"
            >
              <input
                ref={djPinInputRef}
                type="password"
                autoComplete="current-password"
                value={djPinInput}
                disabled={isBusy('dj-login')}
                onChange={(event) => {
                  setDjPinInput(event.target.value);
                  setDjError('');
                }}
                placeholder="PIN"
                className="w-full px-4 py-3 rounded-xl border border-[#8b5e3c]/20 focus:outline-none focus:ring-2 focus:ring-[#8b5e3c]/30 text-sm disabled:bg-[#f5f0ea] disabled:text-gray-500"
              />
              {djError && <p className="text-sm text-rose-600">{djError}</p>}
              <button
                type="submit"
                disabled={isBusy('dj-login')}
                aria-busy={isBusy('dj-login')}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#8b5e3c] text-white font-semibold text-sm uppercase tracking-wide hover:bg-[#6f4b30] transition-colors disabled:opacity-70 disabled:pointer-events-none"
              >
                {isBusy('dj-login') ? <BtnSpinner className="h-4 w-4 text-white" /> : null}
                {isBusy('dj-login') ? 'Entrando…' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KaraokePage;
