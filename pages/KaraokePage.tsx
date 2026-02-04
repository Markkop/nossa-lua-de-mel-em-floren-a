import React, { useEffect, useMemo, useRef, useState } from 'react';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { draggable, dropTargetForElements, monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { reorder } from '@atlaskit/pragmatic-drag-and-drop/reorder';

type KaraokeEntry = {
  id: string;
  name: string;
  song: string;
};

type OtherSong = {
  id: string;
  song: string;
};

type NameSuggestion = {
  id: string;
  name: string;
  song?: string;
  kind: 'name' | 'pair';
};

type SongSuggestion = {
  id: string;
  song: string;
  fromGuest: boolean;
};

const createId = () => `karaoke-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;

const normalizeText = (value: string) => value.trim().replace(/\s+/g, ' ');
const makeKey = (name: string, song: string) => `${normalizeText(name)}::${normalizeText(song)}`;

type QueueRowProps = {
  item: KaraokeEntry;
  index: number;
  isDragging: boolean;
  isOver: boolean;
  onSkip: (id: string) => void;
  onRemove: (id: string) => void;
};

const QueueRow: React.FC<QueueRowProps> = ({ item, index, isDragging, isOver, onSkip, onRemove }) => {
  const rowRef = useRef<HTMLTableRowElement | null>(null);
  const handleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const row = rowRef.current;
    const handle = handleRef.current;
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
  }, [item.id]);

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
      <td className="py-3 px-4">
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusTone}`}>
          {statusLabel}
        </span>
      </td>
      <td className="py-3 px-4 text-[#3d2b1f] font-medium">{item.name}</td>
      <td className="py-3 px-4 text-gray-600">{item.song}</td>
      <td className="py-3 px-4">
        <div className="flex items-center justify-end gap-2">
          <button
            ref={handleRef}
            type="button"
            className="h-9 w-9 rounded-full border border-[#8b5e3c]/30 text-[#8b5e3c] hover:bg-[#8b5e3c]/10 transition-colors cursor-grab active:cursor-grabbing"
            title="Arrastar para reordenar"
            aria-label="Arrastar para reordenar"
          >
            ⇅
          </button>
          <button
            type="button"
            onClick={() => onSkip(item.id)}
            className="h-9 px-4 rounded-full border border-[#8b5e3c]/30 text-[#8b5e3c] hover:bg-[#8b5e3c]/10 transition-colors text-xs font-semibold uppercase tracking-wide"
          >
            Pular
          </button>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="h-9 px-4 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors text-xs font-semibold uppercase tracking-wide"
          >
            Excluir
          </button>
        </div>
      </td>
    </tr>
  );
};

const KaraokePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'guest' | 'queue' | 'other'>('queue');
  const [guestSongs, setGuestSongs] = useState<KaraokeEntry[]>([]);
  const [otherSongs, setOtherSongs] = useState<OtherSong[]>([]);
  const [queue, setQueue] = useState<KaraokeEntry[]>([]);
  const [queueName, setQueueName] = useState('');
  const [queueSong, setQueueSong] = useState('');
  const [queueError, setQueueError] = useState('');
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [isOtherModalOpen, setIsOtherModalOpen] = useState(false);
  const [singleGuestName, setSingleGuestName] = useState('');
  const [singleGuestSong, setSingleGuestSong] = useState('');
  const [singleGuestError, setSingleGuestError] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [bulkAddedCount, setBulkAddedCount] = useState<number | null>(null);
  const [singleOtherSong, setSingleOtherSong] = useState('');
  const [singleOtherError, setSingleOtherError] = useState('');
  const [otherBulkText, setOtherBulkText] = useState('');
  const [otherBulkErrors, setOtherBulkErrors] = useState<string[]>([]);
  const [otherBulkAddedCount, setOtherBulkAddedCount] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [guestActionMessage, setGuestActionMessage] = useState<string | null>(null);
  const [guestActionTone, setGuestActionTone] = useState<'success' | 'error'>('success');
  const guestActionTimer = useRef<number | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const songInputRef = useRef<HTMLInputElement | null>(null);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isSongFocused, setIsSongFocused] = useState(false);
  const [nameHighlightIndex, setNameHighlightIndex] = useState(-1);
  const [songHighlightIndex, setSongHighlightIndex] = useState(-1);

  const guestKeys = useMemo(() => new Set(guestSongs.map((entry) => makeKey(entry.name, entry.song))), [guestSongs]);
  const otherSongKeys = useMemo(
    () => new Set(otherSongs.map((entry) => normalizeText(entry.song).toLowerCase())),
    [otherSongs]
  );
  const queueKeys = useMemo(() => new Set(queue.map((entry) => makeKey(entry.name, entry.song))), [queue]);
  const nameSuggestions = useMemo<NameSuggestion[]>(() => {
    const query = normalizeText(queueName).toLowerCase();
    if (!query) return [];
    const matches = guestSongs.filter((entry) => entry.name.toLowerCase().includes(query));
    const uniqueNames = new Map<string, string>();
    matches.forEach((entry) => {
      const key = normalizeText(entry.name).toLowerCase();
      if (!uniqueNames.has(key)) {
        uniqueNames.set(key, entry.name);
      }
    });
    const nameOnly: NameSuggestion[] = Array.from(uniqueNames.values()).map((name) => ({
      id: `name-${name.toLowerCase()}`,
      name,
      kind: 'name',
    }));
    const nameWithSong: NameSuggestion[] = matches.map((entry) => ({
      id: `pair-${entry.id}`,
      name: entry.name,
      song: entry.song,
      kind: 'pair',
    }));
    return [...nameOnly, ...nameWithSong];
  }, [guestSongs, queueName]);

  const songSuggestions = useMemo<SongSuggestion[]>(() => {
    const query = normalizeText(queueSong).toLowerCase();
    if (!query) return [];
    const seen = new Set<string>();
    const suggestions: SongSuggestion[] = [];
    guestSongs.forEach((entry) => {
      if (!entry.song.toLowerCase().includes(query)) return;
      const key = normalizeText(entry.song).toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      suggestions.push({ id: `guest-${entry.id}`, song: entry.song, fromGuest: true });
    });
    otherSongs.forEach((entry) => {
      if (!entry.song.toLowerCase().includes(query)) return;
      const key = normalizeText(entry.song).toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      suggestions.push({ id: `other-${entry.id}`, song: entry.song, fromGuest: false });
    });
    return suggestions;
  }, [guestSongs, otherSongs, queueSong]);

  useEffect(() => {
    setNameHighlightIndex(-1);
  }, [queueName]);

  useEffect(() => {
    setSongHighlightIndex(-1);
  }, [queueSong]);

  useEffect(() => {
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
        setQueue((prev) => {
          const startIndex = prev.findIndex((item) => item.id === sourceId);
          const finishIndex = prev.findIndex((item) => item.id === targetId);
          if (startIndex === -1 || finishIndex === -1) return prev;
          return reorder({ list: prev, startIndex, finishIndex });
        });
      },
      onDragEnd: () => {
        setDraggingId(null);
        setOverId(null);
      },
    });
  }, []);

  const addQueueEntry = (
    rawName: string,
    rawSong: string,
    options: { clearInputs?: boolean; showErrors?: boolean } = {}
  ) => {
    const name = normalizeText(rawName);
    const song = normalizeText(rawSong);
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
    setQueue((prev) => [...prev, { id: createId(), name, song }]);
    if (options.clearInputs !== false) {
      setQueueName('');
      setQueueSong('');
    }
    setQueueError('');
    return true;
  };

  const handleAddQueue = () => {
    addQueueEntry(queueName, queueSong);
  };

  const pushGuestMessage = (message: string, tone: 'success' | 'error') => {
    setGuestActionMessage(message);
    setGuestActionTone(tone);
    if (guestActionTimer.current) {
      window.clearTimeout(guestActionTimer.current);
    }
    guestActionTimer.current = window.setTimeout(() => {
      setGuestActionMessage(null);
    }, 2500);
  };

  const handleAddGuestToQueue = (entry: KaraokeEntry) => {
    const key = makeKey(entry.name, entry.song);
    if (queueKeys.has(key)) {
      pushGuestMessage('Essa inscrição já está na fila.', 'error');
      return;
    }
    setQueue((prev) => [...prev, { id: createId(), name: entry.name, song: entry.song }]);
    pushGuestMessage('Adicionado à fila!', 'success');
  };

  const handleRemoveGuest = (id: string) => {
    setGuestSongs((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSkipQueue = (id: string) => {
    setQueue((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index === -1 || prev.length < 2) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.push(item);
      return next;
    });
  };

  const handleRemoveQueue = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
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
      setQueueSong(suggestion.song);
      const added = addQueueEntry(suggestion.name, suggestion.song);
      if (added) {
        setIsNameFocused(false);
        setIsSongFocused(false);
        setNameHighlightIndex(-1);
        setSongHighlightIndex(-1);
      }
    }
  };

  const handleSelectSongSuggestion = (suggestion: SongSuggestion) => {
    setQueueSong(suggestion.song);
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

  const handleAddGuestSingle = () => {
    const name = normalizeText(singleGuestName);
    const song = normalizeText(singleGuestSong);
    if (!name || !song) {
      setSingleGuestError('Preencha convidado e música para adicionar.');
      return;
    }
    const key = makeKey(name, song);
    if (guestKeys.has(key)) {
      setSingleGuestError('Essa combinação já foi adicionada.');
      return;
    }
    setGuestSongs((prev) => [...prev, { id: createId(), name, song }]);
    setSingleGuestName('');
    setSingleGuestSong('');
    setSingleGuestError('');
  };

  const handleAddOtherSingle = () => {
    const song = normalizeText(singleOtherSong);
    if (!song) {
      setSingleOtherError('Preencha a música para adicionar.');
      return;
    }
    const key = song.toLowerCase();
    if (otherSongKeys.has(key)) {
      setSingleOtherError('Essa música já foi adicionada.');
      return;
    }
    setOtherSongs((prev) => [...prev, { id: createId(), song }]);
    setSingleOtherSong('');
    setSingleOtherError('');
  };

  const handleAddOtherBulk = () => {
    const lines = otherBulkText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const errors: string[] = [];
    const additions: OtherSong[] = [];
    const nextKeys = new Set(otherSongKeys);

    lines.forEach((line, index) => {
      const song = normalizeText(line);
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
      additions.push({ id: createId(), song });
    });

    if (additions.length > 0) {
      setOtherSongs((prev) => [...prev, ...additions]);
    }
    setOtherBulkErrors(errors);
    setOtherBulkAddedCount(additions.length);
    if (additions.length > 0) {
      setOtherBulkText('');
    }
    if (additions.length > 0 && errors.length === 0) {
      closeOtherModal();
    }
  };

  const handleRemoveOther = (id: string) => {
    setOtherSongs((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddGuestBulk = () => {
    const lines = bulkText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const errors: string[] = [];
    const additions: KaraokeEntry[] = [];
    const nextKeys = new Set(guestKeys);

    lines.forEach((line, index) => {
      const [rawName, ...rest] = line.split(':');
      const rawSong = rest.join(':');
      const name = normalizeText(rawName || '');
      const song = normalizeText(rawSong || '');
      if (!rawName || rest.length === 0) {
        errors.push(`Linha ${index + 1}: use o formato "Convidado: Música".`);
        return;
      }
      if (!name || !song) {
        errors.push(`Linha ${index + 1}: convidado e música são obrigatórios.`);
        return;
      }
      const key = makeKey(name, song);
      if (nextKeys.has(key)) {
        errors.push(`Linha ${index + 1}: já existe (duplicada).`);
        return;
      }
      nextKeys.add(key);
      additions.push({ id: createId(), name, song });
    });

    if (additions.length > 0) {
      setGuestSongs((prev) => [...prev, ...additions]);
    }
    setBulkErrors(errors);
    setBulkAddedCount(additions.length);
    if (additions.length > 0) {
      setBulkText('');
    }
    if (additions.length > 0 && errors.length === 0) {
      closeGuestModal();
    }
  };

  const closeGuestModal = () => {
    setIsGuestModalOpen(false);
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 md:px-10 py-6 border-b border-[#8b5e3c]/10 bg-[#fbf7f1]">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('queue')}
                  className={`px-5 py-2 rounded-full text-sm font-semibold uppercase tracking-wide transition-colors ${
                    activeTab === 'queue'
                      ? 'bg-[#8b5e3c] text-white'
                      : 'border border-[#8b5e3c]/30 text-[#8b5e3c] hover:bg-[#8b5e3c]/10'
                  }`}
                >
                  Inscrições
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('guest')}
                  className={`px-5 py-2 rounded-full text-sm font-semibold uppercase tracking-wide transition-colors ${
                    activeTab === 'guest'
                      ? 'bg-[#8b5e3c] text-white'
                      : 'border border-[#8b5e3c]/30 text-[#8b5e3c] hover:bg-[#8b5e3c]/10'
                  }`}
                >
                  Músicas dos Convidados
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('other')}
                  className={`px-5 py-2 rounded-full text-sm font-semibold uppercase tracking-wide transition-colors ${
                    activeTab === 'other'
                      ? 'bg-[#8b5e3c] text-white'
                      : 'border border-[#8b5e3c]/30 text-[#8b5e3c] hover:bg-[#8b5e3c]/10'
                  }`}
                >
                  Outras músicas
                </button>
              </div>
              {activeTab === 'guest' && (
                <button
                  type="button"
                  onClick={() => setIsGuestModalOpen(true)}
                  className="h-11 w-11 rounded-full bg-[#8b5e3c] text-white text-2xl font-light shadow-lg hover:bg-[#6f4b30] transition-colors"
                  aria-label="Adicionar músicas dos convidados"
                  title="Adicionar músicas dos convidados"
                >
                  +
                </button>
              )}
              {activeTab === 'other' && (
                <button
                  type="button"
                  onClick={() => setIsOtherModalOpen(true)}
                  className="h-11 w-11 rounded-full bg-[#8b5e3c] text-white text-2xl font-light shadow-lg hover:bg-[#6f4b30] transition-colors"
                  aria-label="Adicionar outras músicas"
                  title="Adicionar outras músicas"
                >
                  +
                </button>
              )}
            </div>

            <div className="px-6 md:px-10 py-8">
              {activeTab === 'guest' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-3xl md:text-4xl font-serif text-[#3d2b1f] mb-3">Músicas dos Convidados</h2>
                    <p className="text-sm text-gray-500">Veja as sugestões já registradas para inspirar a noite.</p>
                  </div>

                  {guestActionMessage && (
                    <div
                      className={`text-sm rounded-xl px-4 py-3 border ${
                        guestActionTone === 'success'
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                          : 'text-rose-700 bg-rose-50 border-rose-100'
                      }`}
                    >
                      {guestActionMessage}
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[#8b5e3c]/20">
                          <th className="text-left py-3 px-4 text-[#3d2b1f] font-serif font-normal text-sm">Convidado</th>
                          <th className="text-left py-3 px-4 text-[#3d2b1f] font-serif font-normal text-sm">Música</th>
                          <th className="text-right py-3 px-4 text-[#3d2b1f] font-serif font-normal text-sm">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {guestSongs.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-8 px-4 text-center text-gray-500 text-sm">
                              Nenhuma música adicionada ainda. Clique no + para começar.
                            </td>
                          </tr>
                        ) : (
                          guestSongs.map((entry) => (
                            <tr key={entry.id} className="border-b border-[#8b5e3c]/10 hover:bg-[#8b5e3c]/5 transition-colors">
                              <td className="py-3 px-4 text-[#3d2b1f] font-medium">{entry.name}</td>
                              <td className="py-3 px-4 text-gray-600">{entry.song}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleAddGuestToQueue(entry)}
                                    className="h-9 px-4 rounded-full border border-[#8b5e3c]/30 text-[#8b5e3c] hover:bg-[#8b5e3c]/10 transition-colors text-xs font-semibold uppercase tracking-wide"
                                  >
                                    Para fila
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveGuest(entry.id)}
                                    className="h-9 px-4 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors text-xs font-semibold uppercase tracking-wide"
                                  >
                                    Excluir
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'other' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-3xl md:text-4xl font-serif text-[#3d2b1f] mb-3">Outras músicas</h2>
                    <p className="text-sm text-gray-500">Lista livre para outras sugestões sem convidado específico.</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[#8b5e3c]/20">
                          <th className="text-left py-3 px-4 text-[#3d2b1f] font-serif font-normal text-sm">Música</th>
                          <th className="text-right py-3 px-4 text-[#3d2b1f] font-serif font-normal text-sm">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {otherSongs.length === 0 ? (
                          <tr>
                            <td colSpan={2} className="py-8 px-4 text-center text-gray-500 text-sm">
                              Nenhuma música adicionada ainda. Clique no + para começar.
                            </td>
                          </tr>
                        ) : (
                          otherSongs.map((entry) => (
                            <tr key={entry.id} className="border-b border-[#8b5e3c]/10 hover:bg-[#8b5e3c]/5 transition-colors">
                              <td className="py-3 px-4 text-[#3d2b1f] font-medium">{entry.song}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-end">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOther(entry.id)}
                                    className="h-9 px-4 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors text-xs font-semibold uppercase tracking-wide"
                                  >
                                    Excluir
                                  </button>
                                </div>
                              </td>
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
                    <h2 className="text-3xl md:text-4xl font-serif text-[#3d2b1f] mb-3">Inscrições</h2>
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
                          className="w-full px-4 py-3 rounded-xl border border-[#8b5e3c]/20 focus:outline-none focus:ring-2 focus:ring-[#8b5e3c]/30 text-sm"
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
                                    <span className="text-xs text-gray-500">{suggestion.song}</span>
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
                          onChange={(event) => {
                            setQueueSong(event.target.value);
                            setQueueError('');
                          }}
                          onFocus={() => setIsSongFocused(true)}
                          onBlur={() => {
                            window.setTimeout(() => setIsSongFocused(false), 120);
                          }}
                          onKeyDown={handleSongKeyDown}
                          placeholder="Nome da música e artista"
                          className="w-full px-4 py-3 rounded-xl border border-[#8b5e3c]/20 focus:outline-none focus:ring-2 focus:ring-[#8b5e3c]/30 text-sm"
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
                                    {suggestion.song}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        type="submit"
                        className="w-full md:w-auto px-6 py-3 rounded-xl bg-[#8b5e3c] text-white font-semibold text-sm uppercase tracking-wide hover:bg-[#6f4b30] transition-colors"
                      >
                        Entrar na fila
                      </button>
                    </form>
                    {queueError && <p className="mt-3 text-sm text-rose-600">{queueError}</p>}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[#8b5e3c]/20">
                          <th className="text-left py-3 px-4 text-[#3d2b1f] font-serif font-normal text-sm">Status</th>
                          <th className="text-left py-3 px-4 text-[#3d2b1f] font-serif font-normal text-sm">Convidado</th>
                          <th className="text-left py-3 px-4 text-[#3d2b1f] font-serif font-normal text-sm">Música</th>
                          <th className="text-right py-3 px-4 text-[#3d2b1f] font-serif font-normal text-sm">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {queue.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 px-4 text-center text-gray-500 text-sm">
                              A fila está vazia no momento.
                            </td>
                          </tr>
                        ) : (
                          queue.map((entry, index) => (
                            <QueueRow
                              key={entry.id}
                              item={entry}
                              index={index}
                              isDragging={draggingId === entry.id}
                              isOver={overId === entry.id}
                              onSkip={handleSkipQueue}
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
                  handleAddGuestSingle();
                }}
                className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end mb-6"
              >
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-gray-500">Convidado</label>
                  <input
                    value={singleGuestName}
                    onChange={(event) => {
                      setSingleGuestName(event.target.value);
                      setSingleGuestError('');
                    }}
                    placeholder="Nome do convidado"
                    className="w-full px-4 py-3 rounded-xl border border-[#8b5e3c]/20 focus:outline-none focus:ring-2 focus:ring-[#8b5e3c]/30 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-gray-500">Música</label>
                  <input
                    value={singleGuestSong}
                    onChange={(event) => {
                      setSingleGuestSong(event.target.value);
                      setSingleGuestError('');
                    }}
                    placeholder="Nome da música e artista"
                    className="w-full px-4 py-3 rounded-xl border border-[#8b5e3c]/20 focus:outline-none focus:ring-2 focus:ring-[#8b5e3c]/30 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full md:w-auto px-5 py-3 rounded-xl bg-[#8b5e3c] text-white font-semibold text-sm uppercase tracking-wide hover:bg-[#6f4b30] transition-colors"
                >
                  Adicionar
                </button>
              </form>
              {singleGuestError && <p className="text-sm text-rose-600 mb-6">{singleGuestError}</p>}

              <div className="border-t border-[#8b5e3c]/10 pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-serif text-[#3d2b1f]">Adicionar em lote</h4>
                  <button
                    type="button"
                    onClick={handleAddGuestBulk}
                    className="px-4 py-2 rounded-full border border-[#8b5e3c]/30 text-[#8b5e3c] hover:bg-[#8b5e3c]/10 transition-colors text-xs font-semibold uppercase tracking-wide"
                  >
                    Importar linhas
                  </button>
                </div>
                <textarea
                  value={bulkText}
                  onChange={(event) => setBulkText(event.target.value)}
                  placeholder={`Mateus Ramos Batschauer: Não é sério - Charlie Brown Jr.\nTaciana Floriani: Aquarela - Toquinho`}
                  className="w-full min-h-[160px] px-4 py-3 rounded-xl border border-[#8b5e3c]/20 focus:outline-none focus:ring-2 focus:ring-[#8b5e3c]/30 text-sm"
                />
                <div className="mt-4 space-y-3">
                  {bulkAddedCount !== null && (
                    <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3">
                      {bulkAddedCount === 0
                        ? 'Nenhuma nova música adicionada.'
                        : `${bulkAddedCount} música${bulkAddedCount === 1 ? '' : 's'} adicionada${bulkAddedCount === 1 ? '' : 's'} com sucesso.`}
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
                  handleAddOtherSingle();
                }}
                className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end mb-6"
              >
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-gray-500">Música</label>
                  <input
                    value={singleOtherSong}
                    onChange={(event) => {
                      setSingleOtherSong(event.target.value);
                      setSingleOtherError('');
                    }}
                    placeholder="Nome da música e artista"
                    className="w-full px-4 py-3 rounded-xl border border-[#8b5e3c]/20 focus:outline-none focus:ring-2 focus:ring-[#8b5e3c]/30 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full md:w-auto px-5 py-3 rounded-xl bg-[#8b5e3c] text-white font-semibold text-sm uppercase tracking-wide hover:bg-[#6f4b30] transition-colors"
                >
                  Adicionar
                </button>
              </form>
              {singleOtherError && <p className="text-sm text-rose-600 mb-6">{singleOtherError}</p>}

              <div className="border-t border-[#8b5e3c]/10 pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-serif text-[#3d2b1f]">Adicionar em lote</h4>
                  <button
                    type="button"
                    onClick={handleAddOtherBulk}
                    className="px-4 py-2 rounded-full border border-[#8b5e3c]/30 text-[#8b5e3c] hover:bg-[#8b5e3c]/10 transition-colors text-xs font-semibold uppercase tracking-wide"
                  >
                    Importar linhas
                  </button>
                </div>
                <textarea
                  value={otherBulkText}
                  onChange={(event) => setOtherBulkText(event.target.value)}
                  placeholder={`Não é sério - Charlie Brown Jr.\nAquarela - Toquinho`}
                  className="w-full min-h-[160px] px-4 py-3 rounded-xl border border-[#8b5e3c]/20 focus:outline-none focus:ring-2 focus:ring-[#8b5e3c]/30 text-sm"
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
    </div>
  );
};

export default KaraokePage;
