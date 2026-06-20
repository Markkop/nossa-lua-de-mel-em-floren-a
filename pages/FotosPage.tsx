import React, {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  Lock,
  LogOut,
  RefreshCw,
  X,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface GalleryPhoto {
  id: string;
  filename: string;
  camera: 'Canon EOS R6m2' | 'Canon EOS R6';
  width: number;
  height: number;
}

interface GallerySection {
  id: 'camera-1' | 'camera-2';
  title: string;
  camera: GalleryPhoto['camera'];
  count: number;
  photos: GalleryPhoto[];
}

interface GalleryManifest {
  version: string;
  generatedAt: string;
  total: number;
  sections: GallerySection[];
}

interface JustifiedRow {
  height: number;
  photos: Array<GalleryPhoto & { displayWidth: number }>;
}

const BATCH_SIZE = 80;
const GAP = 6;
const MAX_ZOOM = 4;
const DOUBLE_TAP_ZOOM = 2.5;
const SWIPE_DISTANCE = 50;

interface ImageTransform {
  scale: number;
  x: number;
  y: number;
}

interface PointerPosition {
  x: number;
  y: number;
}

interface GestureState {
  mode: 'idle' | 'swipe' | 'pan' | 'pinch';
  startPoint: PointerPosition;
  startTransform: ImageTransform;
  hadMultiplePointers: boolean;
  pinchDistance: number;
  pinchMidpoint: PointerPosition;
}

const RESET_TRANSFORM: ImageTransform = { scale: 1, x: 0, y: 0 };

function distanceBetween(first: PointerPosition, second: PointerPosition): number {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function midpoint(first: PointerPosition, second: PointerPosition): PointerPosition {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
}

function mediaUrl(photoId: string, retry = 0, variant: 'full' | 'thumbnail' = 'full'): string {
  const params = new URLSearchParams({ action: 'media', id: photoId });
  if (variant === 'thumbnail') params.set('variant', variant);
  if (retry) params.set('retry', String(retry));
  return `/api/photos?${params.toString()}`;
}

function calculateRows(
  photos: GalleryPhoto[],
  containerWidth: number,
  targetHeight: number,
): JustifiedRow[] {
  if (containerWidth <= 0) return [];
  const rows: JustifiedRow[] = [];
  let current: GalleryPhoto[] = [];
  let ratioSum = 0;

  const commitRow = (isLast: boolean) => {
    if (current.length === 0) return;
    const gapsWidth = GAP * Math.max(0, current.length - 1);
    const justifiedHeight = (containerWidth - gapsWidth) / ratioSum;
    const height = isLast ? Math.min(targetHeight, justifiedHeight) : justifiedHeight;
    rows.push({
      height,
      photos: current.map((photo) => ({
        ...photo,
        displayWidth: height * (photo.width / photo.height),
      })),
    });
    current = [];
    ratioSum = 0;
  };

  photos.forEach((photo) => {
    current.push(photo);
    ratioSum += photo.width / photo.height;
    const projectedWidth = ratioSum * targetHeight + GAP * (current.length - 1);
    if (projectedWidth >= containerWidth) commitRow(false);
  });

  commitRow(true);
  return rows;
}

const GalleryImage: React.FC<{
  photo: GalleryPhoto;
  onOpen: () => void;
  style: React.CSSProperties;
}> = ({ photo, onOpen, style }) => {
  const [retry, setRetry] = useState(0);
  const [failed, setFailed] = useState(false);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative overflow-hidden bg-[#e8dfd4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5e3c] focus-visible:ring-offset-2"
      style={style}
      aria-label={`Abrir ${photo.filename}`}
    >
      <img
        src={mediaUrl(photo.id, retry, 'thumbnail')}
        alt="Foto do casamento de Yosha e Mark"
        width={photo.width}
        height={photo.height}
        loading="lazy"
        decoding="async"
        draggable={false}
        onLoad={() => setFailed(false)}
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.015] ${
          failed ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <span className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
      {failed && (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#6f5948]">
          <RefreshCw className="h-5 w-5" />
          <span
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              setFailed(false);
              setRetry((value) => value + 1);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.stopPropagation();
                setFailed(false);
                setRetry((value) => value + 1);
              }
            }}
            className="text-xs uppercase tracking-[0.18em]"
          >
            Tentar novamente
          </span>
        </span>
      )}
    </button>
  );
};

const JustifiedGallery: React.FC<{
  photos: GalleryPhoto[];
  onOpen: (photo: GalleryPhoto) => void;
}> = ({ photos, onOpen }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || visibleCount >= photos.length) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((count) => Math.min(count + BATCH_SIZE, photos.length));
        }
      },
      { rootMargin: '800px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [photos.length, visibleCount]);

  const visiblePhotos = photos.slice(0, visibleCount);
  const targetHeight = containerWidth < 640 ? 150 : containerWidth < 1024 ? 205 : 245;
  const rows = useMemo(
    () => calculateRows(visiblePhotos, containerWidth, targetHeight),
    [containerWidth, targetHeight, visiblePhotos],
  );

  return (
    <div ref={containerRef}>
      <div className="space-y-[6px]">
        {rows.map((row, rowIndex) => (
          <div key={`${row.photos[0]?.id}-${rowIndex}`} className="flex gap-[6px] overflow-hidden">
            {row.photos.map((photo) => (
              <GalleryImage
                key={photo.id}
                photo={photo}
                onOpen={() => onOpen(photo)}
                style={{
                  width: `${photo.displayWidth}px`,
                  height: `${row.height}px`,
                  flexGrow: 0,
                  flexShrink: rowIndex === rows.length - 1 ? 0 : 1,
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div ref={sentinelRef} className="flex h-24 items-center justify-center">
        {visibleCount < photos.length && (
          <span className="text-xs uppercase tracking-[0.24em] text-[#8b735f]">
            Carregando mais momentos...
          </span>
        )}
      </div>
    </div>
  );
};

const PhotoLightbox: React.FC<{
  photos: GalleryPhoto[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}> = ({ photos, index, onIndexChange, onClose }) => {
  const [retry, setRetry] = useState(0);
  const [failed, setFailed] = useState(false);
  const [transform, setTransform] = useState<ImageTransform>(RESET_TRANSFORM);
  const stageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const pointers = useRef<Map<number, PointerPosition>>(new Map());
  const transformRef = useRef<ImageTransform>(RESET_TRANSFORM);
  const lastTap = useRef<{ time: number; point: PointerPosition } | null>(null);
  const gesture = useRef<GestureState>({
    mode: 'idle',
    startPoint: { x: 0, y: 0 },
    startTransform: RESET_TRANSFORM,
    hadMultiplePointers: false,
    pinchDistance: 0,
    pinchMidpoint: { x: 0, y: 0 },
  });
  const current = photos[index];

  const applyTransform = useCallback((next: ImageTransform) => {
    transformRef.current = next;
    setTransform(next);
  }, []);

  const clampTransform = useCallback((next: ImageTransform): ImageTransform => {
    const stage = stageRef.current;
    const image = imageRef.current;
    if (!stage || !image || next.scale <= 1) return RESET_TRANSFORM;

    const maxX = Math.max(0, (image.clientWidth * next.scale - stage.clientWidth) / 2);
    const maxY = Math.max(0, (image.clientHeight * next.scale - stage.clientHeight) / 2);
    return {
      scale: next.scale,
      x: Math.max(-maxX, Math.min(maxX, next.x)),
      y: Math.max(-maxY, Math.min(maxY, next.y)),
    };
  }, []);

  const zoomAroundPoint = useCallback(
    (scale: number, point: PointerPosition, initial = transformRef.current) => {
      const stage = stageRef.current;
      if (!stage || scale <= 1) {
        applyTransform(RESET_TRANSFORM);
        return;
      }

      const bounds = stage.getBoundingClientRect();
      const relativePoint = {
        x: point.x - bounds.left - bounds.width / 2,
        y: point.y - bounds.top - bounds.height / 2,
      };
      const ratio = scale / initial.scale;
      applyTransform(
        clampTransform({
          scale,
          x: relativePoint.x - (relativePoint.x - initial.x) * ratio,
          y: relativePoint.y - (relativePoint.y - initial.y) * ratio,
        }),
      );
    },
    [applyTransform, clampTransform],
  );

  const goPrevious = useCallback(() => {
    setFailed(false);
    setRetry(0);
    onIndexChange(index === 0 ? photos.length - 1 : index - 1);
  }, [index, onIndexChange, photos.length]);

  const goNext = useCallback(() => {
    setFailed(false);
    setRetry(0);
    onIndexChange(index === photos.length - 1 ? 0 : index + 1);
  }, [index, onIndexChange, photos.length]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') goPrevious();
      if (event.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [goNext, goPrevious, onClose]);

  useEffect(() => {
    pointers.current.clear();
    gesture.current.mode = 'idle';
    lastTap.current = null;
    applyTransform(RESET_TRANSFORM);
  }, [applyTransform, current.id]);

  useEffect(() => {
    const handleResize = () => applyTransform(clampTransform(transformRef.current));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [applyTransform, clampTransform]);

  useEffect(() => {
    const adjacent = [
      photos[(index - 1 + photos.length) % photos.length],
      photos[(index + 1) % photos.length],
    ];
    adjacent.forEach((photo) => {
      const image = new Image();
      image.src = mediaUrl(photo.id);
    });
  }, [index, photos]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (
      event.pointerType === 'mouse' ||
      (event.target as HTMLElement).closest('button, a')
    ) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, point);

    if (pointers.current.size === 1) {
      gesture.current = {
        mode: transformRef.current.scale > 1 ? 'pan' : 'swipe',
        startPoint: point,
        startTransform: transformRef.current,
        hadMultiplePointers: false,
        pinchDistance: 0,
        pinchMidpoint: point,
      };
      return;
    }

    const [first, second] = Array.from(pointers.current.values()) as [
      PointerPosition,
      PointerPosition,
    ];
    gesture.current.mode = 'pinch';
    gesture.current.hadMultiplePointers = true;
    gesture.current.startTransform = transformRef.current;
    gesture.current.pinchDistance = distanceBetween(first, second);
    gesture.current.pinchMidpoint = midpoint(first, second);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    const point = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, point);

    if (pointers.current.size >= 2 && gesture.current.mode === 'pinch') {
      const [first, second] = Array.from(pointers.current.values()) as [
        PointerPosition,
        PointerPosition,
      ];
      const currentDistance = distanceBetween(first, second);
      if (gesture.current.pinchDistance === 0) return;

      const scale = Math.max(
        1,
        Math.min(
          MAX_ZOOM,
          gesture.current.startTransform.scale *
            (currentDistance / gesture.current.pinchDistance),
        ),
      );
      const currentMidpoint = midpoint(first, second);
      const stage = stageRef.current;
      if (!stage) return;
      const bounds = stage.getBoundingClientRect();
      const startMidpoint = {
        x: gesture.current.pinchMidpoint.x - bounds.left - bounds.width / 2,
        y: gesture.current.pinchMidpoint.y - bounds.top - bounds.height / 2,
      };
      const movedMidpoint = {
        x: currentMidpoint.x - bounds.left - bounds.width / 2,
        y: currentMidpoint.y - bounds.top - bounds.height / 2,
      };
      const ratio = scale / gesture.current.startTransform.scale;
      applyTransform(
        clampTransform({
          scale,
          x:
            movedMidpoint.x -
            (startMidpoint.x - gesture.current.startTransform.x) * ratio,
          y:
            movedMidpoint.y -
            (startMidpoint.y - gesture.current.startTransform.y) * ratio,
        }),
      );
      return;
    }

    if (pointers.current.size === 1 && gesture.current.mode === 'pan') {
      applyTransform(
        clampTransform({
          ...gesture.current.startTransform,
          x: gesture.current.startTransform.x + point.x - gesture.current.startPoint.x,
          y: gesture.current.startTransform.y + point.y - gesture.current.startPoint.y,
        }),
      );
    }
  };

  const finishPointer = (event: React.PointerEvent<HTMLDivElement>, cancelled = false) => {
    const point = { x: event.clientX, y: event.clientY };
    const state = gesture.current;
    const wasLastPointer = pointers.current.size === 1;
    const movedX = point.x - state.startPoint.x;
    const movedY = point.y - state.startPoint.y;
    const isTap = Math.hypot(movedX, movedY) < 12;

    if (
      !cancelled &&
      wasLastPointer &&
      state.mode === 'swipe' &&
      !state.hadMultiplePointers &&
      Math.abs(movedX) >= SWIPE_DISTANCE &&
      Math.abs(movedX) > Math.abs(movedY) * 1.2
    ) {
      if (movedX > 0) goPrevious();
      else goNext();
    } else if (!cancelled && wasLastPointer && isTap && !state.hadMultiplePointers) {
      const now = performance.now();
      const previousTap = lastTap.current;
      if (
        previousTap &&
        now - previousTap.time < 300 &&
        distanceBetween(previousTap.point, point) < 32
      ) {
        if (transformRef.current.scale > 1) applyTransform(RESET_TRANSFORM);
        else zoomAroundPoint(DOUBLE_TAP_ZOOM, point);
        lastTap.current = null;
      } else {
        lastTap.current = { time: now, point };
      }
    }

    pointers.current.delete(event.pointerId);
    if (pointers.current.size === 1) {
      const remainingPoint = Array.from(pointers.current.values())[0] as PointerPosition;
      gesture.current.mode = transformRef.current.scale > 1 ? 'pan' : 'idle';
      gesture.current.startPoint = remainingPoint;
      gesture.current.startTransform = transformRef.current;
      gesture.current.hadMultiplePointers = true;
      return;
    }

    if (pointers.current.size === 0) {
      gesture.current.mode = 'idle';
      if (transformRef.current.scale <= 1) applyTransform(RESET_TRANSFORM);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col text-white"
      style={{ backgroundColor: 'rgba(18, 15, 13, 0.985)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Visualização da foto"
    >
      <div className="flex h-16 shrink-0 items-center justify-between px-4 md:px-7">
        <p className="text-sm tracking-[0.16em] text-white/70">
          {index + 1} / {photos.length}
        </p>
        <div className="flex items-center gap-2">
          <a
            href={`${mediaUrl(current.id)}&download=1`}
            className="rounded-full p-3 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Baixar foto"
          >
            <Download className="h-5 w-5" />
          </a>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-full p-3 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div
        ref={stageRef}
        className="relative flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden px-3 pb-5 md:px-20"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => finishPointer(event)}
        onPointerCancel={(event) => finishPointer(event, true)}
      >
        <button
          type="button"
          onClick={goPrevious}
          className="absolute left-2 z-10 hidden rounded-full bg-white/10 p-3 transition hover:bg-white/20 md:block"
          aria-label="Foto anterior"
        >
          <ChevronLeft className="h-7 w-7" />
        </button>

        {failed ? (
          <button
            type="button"
            onClick={() => {
              setFailed(false);
              setRetry((value) => value + 1);
            }}
            className="flex flex-col items-center gap-3 text-white/70"
          >
            <RefreshCw className="h-7 w-7" />
            <span className="text-sm uppercase tracking-[0.18em]">Tentar novamente</span>
          </button>
        ) : (
          <img
            ref={imageRef}
            key={`${current.id}-${retry}`}
            src={mediaUrl(current.id, retry)}
            alt="Foto do casamento de Yosha e Mark"
            width={current.width}
            height={current.height}
            decoding="async"
            onError={() => setFailed(true)}
            className="max-h-full max-w-full select-none object-contain shadow-2xl will-change-transform"
            style={{
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
              transition: gesture.current.mode === 'idle' ? 'transform 180ms ease-out' : 'none',
            }}
            draggable={false}
          />
        )}

        <button
          type="button"
          onClick={goNext}
          className="absolute right-2 z-10 hidden rounded-full bg-white/10 p-3 transition hover:bg-white/20 md:block"
          aria-label="Próxima foto"
        >
          <ChevronRight className="h-7 w-7" />
        </button>
      </div>

      <div className="shrink-0 pb-5 text-center md:hidden">
        <p className="text-xs uppercase tracking-[0.18em] text-white/45">
          Deslize para navegar · pinça ou toque duas vezes para ampliar
        </p>
      </div>
    </div>
  );
};

const FotosPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'checking' | 'login' | 'loading' | 'ready' | 'error'>(
    'checking',
  );
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [manifest, setManifest] = useState<GalleryManifest | null>(null);
  const lastFocusedElement = useRef<HTMLElement | null>(null);
  const wasLightboxOpen = useRef(false);

  const loadManifest = useCallback(async () => {
    setStatus('loading');
    setMessage('');
    const response = await fetch('/api/photos?action=manifest');
    if (response.status === 401) {
      setStatus('login');
      setMessage('Sua sessão expirou. Digite a senha novamente.');
      return;
    }
    if (!response.ok) throw new Error('Não foi possível carregar as fotos.');
    setManifest((await response.json()) as GalleryManifest);
    setStatus('ready');
  }, []);

  useEffect(() => {
    fetch('/api/photos?action=session')
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const session = (await response.json()) as { authenticated: boolean };
        if (session.authenticated) await loadManifest();
        else setStatus('login');
      })
      .catch(() => {
        setStatus('error');
        setMessage('Não foi possível verificar o acesso à galeria.');
      });
  }, [loadManifest]);

  const allPhotos = useMemo(
    () => manifest?.sections.flatMap((section) => section.photos) ?? [],
    [manifest],
  );
  const photoIndex = useMemo(
    () => new Map(allPhotos.map((photo, index) => [photo.id, index])),
    [allPhotos],
  );
  const selectedPhotoId = useMemo(
    () => new URLSearchParams(location.search).get('foto'),
    [location.search],
  );
  const lightboxIndex = selectedPhotoId ? photoIndex.get(selectedPhotoId) ?? null : null;

  const navigateToPhoto = useCallback(
    (photoId: string, replace: boolean) => {
      const search = new URLSearchParams(location.search);
      search.set('foto', photoId);
      const existingState =
        location.state && typeof location.state === 'object' ? location.state : {};
      const nextState = replace
        ? location.state
        : { ...existingState, photoLightbox: true };
      navigate(
        { pathname: location.pathname, search: `?${search.toString()}` },
        {
          replace,
          preventScrollReset: true,
          state: nextState,
        },
      );
    },
    [location.pathname, location.search, location.state, navigate],
  );

  const openPhoto = useCallback(
    (photo: GalleryPhoto) => {
      lastFocusedElement.current = document.activeElement as HTMLElement | null;
      navigateToPhoto(photo.id, false);
    },
    [navigateToPhoto],
  );

  const changePhoto = useCallback(
    (nextIndex: number) => {
      const photo = allPhotos[nextIndex];
      if (photo) navigateToPhoto(photo.id, true);
    },
    [allPhotos, navigateToPhoto],
  );

  const closeLightbox = useCallback(() => {
    const state = location.state as { photoLightbox?: boolean } | null;
    if (state?.photoLightbox) {
      navigate(-1);
      return;
    }

    const search = new URLSearchParams(location.search);
    search.delete('foto');
    navigate(
      { pathname: location.pathname, search: search.toString() ? `?${search.toString()}` : '' },
      { replace: true, preventScrollReset: true },
    );
  }, [location.pathname, location.search, location.state, navigate]);

  useEffect(() => {
    if (status !== 'ready' || !selectedPhotoId || photoIndex.has(selectedPhotoId)) return;
    const search = new URLSearchParams(location.search);
    search.delete('foto');
    navigate(
      { pathname: location.pathname, search: search.toString() ? `?${search.toString()}` : '' },
      { replace: true, preventScrollReset: true },
    );
  }, [location.pathname, location.search, navigate, photoIndex, selectedPhotoId, status]);

  useEffect(() => {
    const isOpen = lightboxIndex !== null;
    if (wasLightboxOpen.current && !isOpen) {
      const element = lastFocusedElement.current;
      window.requestAnimationFrame(() => element?.focus());
      lastFocusedElement.current = null;
    }
    wasLightboxOpen.current = isOpen;
  }, [lightboxIndex]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    setStatus('loading');
    try {
      const response = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatus('login');
        setMessage(body.error ?? 'Não foi possível entrar.');
        return;
      }
      setPassword('');
      await loadManifest();
    } catch {
      setStatus('login');
      setMessage('Não foi possível entrar. Verifique sua conexão.');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/photos', { method: 'DELETE' });
    setManifest(null);
    setStatus('login');
    setMessage('');
  };

  if (status === 'checking' || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f4ed] text-[#654d3b]">
        <div className="text-center">
          <div className="mx-auto mb-5 h-8 w-8 animate-spin rounded-full border-2 border-[#b99a7a] border-t-transparent" />
          <p className="text-xs uppercase tracking-[0.28em]">Preparando a galeria</p>
        </div>
      </div>
    );
  }

  if (status === 'login') {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#2e2119] px-5 py-12">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_top_left,#d9bea4,transparent_42%),radial-gradient(circle_at_bottom_right,#8b5e3c,transparent_40%)]" />
        <form
          onSubmit={handleLogin}
          className="relative w-full max-w-md rounded-[2rem] border border-white/15 bg-[#f8f4ed] px-7 py-10 text-center shadow-2xl md:px-11 md:py-12"
        >
          <div className="mx-auto mb-7 flex h-14 w-14 items-center justify-center rounded-full border border-[#b99a7a]/45 text-[#8b5e3c]">
            <Lock className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.32em] text-[#9a7657]">
            Yosha & Mark
          </p>
          <h1 className="mb-4 font-serif text-4xl text-[#3d2b1f]">Fotos do nosso casamento</h1>
          <p className="mb-8 text-sm font-light leading-relaxed text-[#766557]">
            Esta galeria é reservada aos nossos convidados.
          </p>
          <label htmlFor="gallery-password" className="sr-only">
            Senha da galeria
          </label>
          <input
            id="gallery-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="Digite a senha"
            className="w-full rounded-xl border border-[#c9b39f] bg-white px-4 py-3.5 text-center text-[#3d2b1f] outline-none transition placeholder:text-[#a9998b] focus:border-[#8b5e3c] focus:ring-2 focus:ring-[#8b5e3c]/15"
            autoFocus
          />
          {message && <p className="mt-3 text-sm text-[#a0443e]">{message}</p>}
          <button
            type="submit"
            disabled={!password}
            className="mt-5 w-full rounded-xl bg-[#3d2b1f] px-5 py-3.5 text-sm font-bold uppercase tracking-[0.2em] text-white transition hover:bg-[#573c2b] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Entrar
          </button>
          <a
            href="/"
            className="mt-7 inline-block text-xs uppercase tracking-[0.2em] text-[#8b735f] hover:text-[#3d2b1f]"
          >
            Voltar ao início
          </a>
        </form>
      </main>
    );
  }

  if (status === 'error' || !manifest) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f4ed] px-5 text-center">
        <div>
          <p className="mb-5 text-[#6b5442]">{message || 'A galeria está indisponível.'}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-[#3d2b1f] px-5 py-3 text-sm text-white"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f4ed] text-[#3d2b1f]">
      <header className="border-b border-[#8b5e3c]/15 px-5 pb-16 pt-7 md:px-10 md:pb-24">
        <nav className="mx-auto flex max-w-[1600px] items-center justify-between">
          <a href="/" className="font-serif text-xl text-[#3d2b1f]">
            Y & M
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#7b6655] transition hover:text-[#3d2b1f]"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </nav>
        <div className="mx-auto mt-16 max-w-4xl text-center md:mt-24">
          <div className="mb-6 inline-flex items-center gap-3 text-[#9a7657]">
            <span className="h-px w-10 bg-current opacity-40" />
            <Camera className="h-5 w-5" strokeWidth={1.3} />
            <span className="h-px w-10 bg-current opacity-40" />
          </div>
          <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.36em] text-[#9a7657]">
            18.04.2026 · Florianópolis
          </p>
          <h1 className="font-serif text-5xl leading-[1.05] md:text-7xl">
            Fotos do nosso casamento
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-base font-light leading-relaxed text-[#796858] md:text-lg">
            Um registro de cada abraço, sorriso e passo de dança que fez parte desse dia.
          </p>
          <p className="mt-8 text-xs uppercase tracking-[0.25em] text-[#9a8879]">
            {manifest.total.toLocaleString('pt-BR')} fotografias
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1800px] px-2 py-16 md:px-6 md:py-24">
        {manifest.sections.map((section, sectionIndex) => (
          <section key={section.id} className={sectionIndex === 0 ? '' : 'mt-28 md:mt-40'}>
            <div className="mx-auto mb-10 max-w-[1600px] px-3 md:mb-14">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#9a7657]">
                {section.camera}
              </p>
              <div className="flex flex-col justify-between gap-3 border-b border-[#8b5e3c]/20 pb-6 sm:flex-row sm:items-end">
                <h2 className="font-serif text-4xl md:text-5xl">{section.title}</h2>
                <p className="text-sm font-light text-[#8b735f]">
                  {section.count.toLocaleString('pt-BR')} fotos
                </p>
              </div>
            </div>
            <JustifiedGallery
              photos={section.photos}
              onOpen={openPhoto}
            />
          </section>
        ))}
      </main>

      <footer className="bg-[#3d2b1f] px-5 py-20 text-center text-white">
        <p className="font-serif text-4xl text-[#e6d5c3]">Com amor, Yosha & Mark</p>
        <p className="mt-8 text-xs uppercase tracking-[0.2em] text-white/55">
          Fotografias por{' '}
          <a
            href="https://www.instagram.com/nathachajaquesfotografia/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#e6d5c3] underline decoration-[#e6d5c3]/35 underline-offset-4 transition hover:text-white"
          >
            Natacha Jaques Fotografia
          </a>
        </p>
        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-white/55">
          Quer um site de casamento personalizado,
          <span className="block">sem taxa sobre presentes e dentro do orçamento?</span>
          <a
            href="https://wa.me/5548996792216"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block text-[#e6d5c3] underline decoration-[#e6d5c3]/35 underline-offset-4 transition hover:text-white"
          >
            Entre em contato!
          </a>
        </p>
      </footer>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={allPhotos}
          index={lightboxIndex}
          onIndexChange={changePhoto}
          onClose={closeLightbox}
        />
      )}
    </div>
  );
};

export default FotosPage;
