import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Heart } from 'lucide-react';

const YEAR = 2026;
const MONTH_INDEX = 3; // April
const MONTH_LABEL = 'Abril 2026';

/** Days with heart + popover content (wedding weekend). */
const HIGHLIGHT_DAYS = new Set([17, 18, 19]);

const EVENTS: Record<number, { weekday: string; items: string[] }> = {
  17: {
    weekday: 'Sexta-feira',
    items: [
      'Aniversário do Noivo',
      'Check-in 14:00',
      'Cidade Dorme (será gravado!)',
      'Tragam comidinhas',
    ],
  },
  18: {
    weekday: 'Sábado',
    items: [
      'Almoço coletivo',
      'Cerimônia 16:00',
      'Festa até duas da manhã',
      'After até o amanhecer',
    ],
  },
  19: {
    weekday: 'Domingo',
    items: ['Almoço Coletivo', 'Checkout 18:00'],
  },
};

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const MARGIN = 8;
const GAP = 8;

function buildMonthGrid(): (number | null)[] {
  const first = new Date(YEAR, MONTH_INDEX, 1);
  const startPad = first.getDay(); // 0 = Sunday
  const daysInMonth = new Date(YEAR, MONTH_INDEX + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** Hover tooltips only on real mouse + hover; avoids touch “double tap” (mouseenter then click toggles closed). */
function useFinePointerHover(): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const sync = () => setOk(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return ok;
}

const WeddingWeekendCalendar: React.FC = () => {
  const hoverUi = useFinePointerHover();
  const [openDay, setOpenDay] = useState<number | null>(null);
  const leaveTimerRef = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const floatingRef = useRef<HTMLDivElement | null>(null);

  const clearLeaveTimer = () => {
    if (leaveTimerRef.current != null) {
      window.clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    clearLeaveTimer();
    leaveTimerRef.current = window.setTimeout(() => setOpenDay(null), 180);
  };

  const openForHover = (day: number) => {
    clearLeaveTimer();
    setOpenDay(day);
  };

  /** Tap / click: open this day or close if already open (no hover race on touch). */
  const onDayActivate = (day: number) => {
    setOpenDay((prev) => (prev === day ? null : day));
  };

  const updateFloatingPosition = useCallback(() => {
    const btn = anchorRef.current;
    const pop = floatingRef.current;
    if (!btn || !pop) return;

    const r = btn.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const maxW = Math.min(18 * 16, vw - MARGIN * 2);
    const maxH = Math.max(160, vh - MARGIN * 2);
    pop.style.maxWidth = `${maxW}px`;
    pop.style.width = `${maxW}px`;
    pop.style.maxHeight = `${maxH}px`;
    pop.style.overflowY = 'auto';

    const popW = pop.offsetWidth;
    const popH = pop.offsetHeight;

    let left = r.left + r.width / 2 - popW / 2;
    left = Math.max(MARGIN, Math.min(left, vw - popW - MARGIN));

    let top = r.bottom + GAP;
    if (top + popH > vh - MARGIN) {
      top = r.top - popH - GAP;
    }
    top = Math.max(MARGIN, Math.min(top, vh - popH - MARGIN));

    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
  }, []);

  useLayoutEffect(() => {
    if (openDay == null) return;
    updateFloatingPosition();
    const id = requestAnimationFrame(() => updateFloatingPosition());
    return () => cancelAnimationFrame(id);
  }, [openDay, updateFloatingPosition]);

  useLayoutEffect(() => {
    if (openDay == null) return;
    const onWin = () => updateFloatingPosition();
    window.addEventListener('resize', onWin);
    window.addEventListener('scroll', onWin, true);
    const ro = new ResizeObserver(onWin);
    const el = floatingRef.current;
    if (el) ro.observe(el);
    const t = window.setTimeout(() => updateFloatingPosition(), 0);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', onWin);
      window.removeEventListener('scroll', onWin, true);
      ro.disconnect();
    };
  }, [openDay, updateFloatingPosition]);

  useEffect(() => {
    const onDocPointerDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || floatingRef.current?.contains(t)) return;
      setOpenDay(null);
    };
    document.addEventListener('mousedown', onDocPointerDown);
    document.addEventListener('touchstart', onDocPointerDown);
    return () => {
      document.removeEventListener('mousedown', onDocPointerDown);
      document.removeEventListener('touchstart', onDocPointerDown);
    };
  }, []);

  useEffect(
    () => () => {
      if (leaveTimerRef.current != null) window.clearTimeout(leaveTimerRef.current);
    },
    [],
  );

  const grid = useMemo(() => buildMonthGrid(), []);

  const openMeta = openDay != null ? EVENTS[openDay] : null;

  const popoverEl =
    openDay != null && openMeta && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={floatingRef}
            className="fixed z-[200] rounded-xl border border-[#3d2b1f]/15 bg-[#fdfbf7] px-3 py-2.5 text-left shadow-[0_12px_40px_rgba(61,43,31,0.15)] animate-fadeIn pointer-events-auto box-border"
            style={{ top: 0, left: 0 }}
            role="dialog"
            aria-label={`Programa do dia ${openDay}`}
            onMouseEnter={() => hoverUi && openDay != null && openForHover(openDay)}
            onMouseLeave={() => hoverUi && scheduleClose()}
          >
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#3d2b1f]/50 mb-1.5">
              {openDay} de abril · {openMeta.weekday}
            </p>
            <ul className="space-y-1 text-sm text-[#333]/95 leading-snug">
              {openMeta.items.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="text-[#a0522d] shrink-0" aria-hidden>
                    ·
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className="w-full max-w-sm mx-auto">
      {popoverEl}
      <p className="text-center text-xs uppercase tracking-[0.18em] text-[#3d2b1f]/55 mb-3">
        {MONTH_LABEL}
      </p>
      <div
        className="rounded-2xl border border-[#3d2b1f]/12 bg-white/70 backdrop-blur-sm p-3 shadow-[0_6px_28px_rgba(61,43,31,0.07)]"
        role="grid"
        aria-label={`Calendário de ${MONTH_LABEL}`}
      >
        <div className="grid grid-cols-7 gap-1 mb-2" role="row">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="text-center text-[10px] font-medium text-[#3d2b1f]/45 py-1"
              role="columnheader"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((day, i) => {
            if (day === null) {
              return <div key={`e-${i}`} className="aspect-square min-h-[2.25rem]" aria-hidden />;
            }
            const isHeart = HIGHLIGHT_DAYS.has(day);
            const isOpen = openDay === day;
            const meta = EVENTS[day];

            if (!isHeart) {
              return (
                <div
                  key={day}
                  className="aspect-square min-h-[2.25rem] flex items-center justify-center rounded-lg text-sm text-[#333]/35 tabular-nums"
                  aria-hidden
                >
                  {day}
                </div>
              );
            }

            return (
              <div
                key={day}
                className="relative aspect-square min-h-[2.25rem] flex items-center justify-center"
                onMouseEnter={() => hoverUi && openForHover(day)}
                onMouseLeave={() => hoverUi && scheduleClose()}
              >
                <button
                  ref={openDay === day ? anchorRef : undefined}
                  type="button"
                  className={[
                    'relative z-[1] w-full h-full min-h-[2.25rem] flex flex-col items-center justify-center gap-0.5 rounded-xl border transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-[#3d2b1f]/35 focus:ring-offset-2 focus:ring-offset-[#fdfbf7]',
                    isOpen
                      ? 'border-[#8b4513]/45 bg-[#3d2b1f]/10 shadow-inner'
                      : 'border-[#3d2b1f]/18 bg-[#fdfbf7]/90 hover:border-[#3d2b1f]/35 hover:bg-[#3d2b1f]/[0.06]',
                  ].join(' ')}
                  aria-expanded={isOpen}
                  aria-haspopup="dialog"
                  aria-label={`${day} de abril, ${meta.weekday}. Toque para ver o programa.`}
                  onClick={() => onDayActivate(day)}
                >
                  <Heart
                    className="w-4 h-4 text-[#a0522d] fill-[#c17f59]/35 shrink-0"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <span className="text-[11px] font-semibold text-[#3d2b1f] tabular-nums leading-none">
                    {day}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeddingWeekendCalendar;
