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

/** “Hoje” (células verdes) — fundos opacos para não misturar com o card branco/blur. */
const TODAY_CELL = {
  base: 'border-emerald-600/40 bg-emerald-50',
  hover:
    'hover:border-emerald-600 hover:bg-emerald-200 hover:shadow-[inset_0_0_0_1px_rgba(5,150,105,0.18)]',
  open: 'border-emerald-700 bg-emerald-300 shadow-inner',
} as const;

/** Fim de semana do casamento (17–19): tons de vermelho/rosa (opacos no hover). */
const WEEKEND_CELL = {
  base: 'border-rose-700/40 bg-rose-50',
  hover: 'hover:border-rose-600 hover:bg-rose-200 hover:shadow-[inset_0_0_0_1px_rgba(190,24,93,0.12)]',
  open: 'border-rose-800 bg-rose-300 shadow-inner',
} as const;

const MARGIN = 8;
const GAP = 8;

type MonthCell = { monthIndex: number; day: number };

function cellKey(monthIndex: number, day: number): string {
  return `${YEAR}-${monthIndex}-${day}`;
}

/** Primeiro dia do fim de semana (contagem “Faltam X dias!”). */
const FIRST_WEDDING_DAY = 17;

function daysUntilFirstWeddingDay(): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const first = new Date(YEAR, MONTH_INDEX, FIRST_WEDDING_DAY);
  return Math.round((first.getTime() - today.getTime()) / 86400000);
}

function countdownPhrase(): string {
  const d = daysUntilFirstWeddingDay();
  if (d > 1) return `Faltam ${d} dias!`;
  if (d === 1) return 'Falta 1 dia!';
  if (d === 0) return 'Faltam 0 dias!';
  return 'O fim de semana do casamento já começou!';
}

/** Abril 2026 plus dias de março (início da grelha) e maio (fim), como calendário mensal típico. */
function buildMonthGrid(): MonthCell[] {
  const first = new Date(YEAR, MONTH_INDEX, 1);
  const startPad = first.getDay(); // 0 = Sunday
  const daysInMonth = new Date(YEAR, MONTH_INDEX + 1, 0).getDate();
  const daysInPrevMonth = new Date(YEAR, MONTH_INDEX, 0).getDate();
  const cells: MonthCell[] = [];

  for (let i = 0; i < startPad; i++) {
    const day = daysInPrevMonth - startPad + 1 + i;
    cells.push({ monthIndex: MONTH_INDEX - 1, day });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ monthIndex: MONTH_INDEX, day: d });
  }
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ monthIndex: MONTH_INDEX + 1, day: nextDay++ });
  }
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
  const [openKey, setOpenKey] = useState<string | null>(null);
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
    leaveTimerRef.current = window.setTimeout(() => setOpenKey(null), 180);
  };

  const openForHover = (key: string) => {
    clearLeaveTimer();
    setOpenKey(key);
  };

  /** Tap / click: open this day or close if already open (no hover race on touch). */
  const onDayActivate = (key: string) => {
    setOpenKey((prev) => (prev === key ? null : key));
  };

  useEffect(() => {
    const onDocPointerDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || floatingRef.current?.contains(t)) return;
      setOpenKey(null);
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

  const todayKey = useMemo(() => {
    const n = new Date();
    if (n.getFullYear() !== YEAR) return null;
    return cellKey(n.getMonth(), n.getDate());
  }, []);

  const openDayApril =
    openKey != null
      ? (() => {
          const m = /^(\d+)-(\d+)-(\d+)$/.exec(openKey);
          if (!m) return null;
          const monthIndex = Number(m[2]);
          const day = Number(m[3]);
          return monthIndex === MONTH_INDEX ? day : null;
        })()
      : null;
  const openMeta = openDayApril != null ? EVENTS[openDayApril] : null;
  const openIsToday = openKey != null && todayKey != null && openKey === todayKey;
  const showTodayCountdown = Boolean(openIsToday);
  const showEventPopover = openDayApril != null && openMeta != null;
  const showAnyPopover = showTodayCountdown || showEventPopover;

  const updateFloatingPosition = useCallback(() => {
    const btn = anchorRef.current;
    const pop = floatingRef.current;
    if (!btn || !pop) return;

    const r = btn.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const maxW = Math.min(18 * 16, vw - MARGIN * 2);
    const maxH = Math.max(160, vh - MARGIN * 2);
    pop.style.maxHeight = `${maxH}px`;
    pop.style.overflowY = 'auto';

    /** Largura acompanha a linha mais longa (contagem, lista ou os dois); limitada ao viewport. */
    pop.style.width = 'max-content';
    pop.style.maxWidth = `${maxW}px`;
    pop.style.minWidth = '0';

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
    if (openKey == null) return;
    updateFloatingPosition();
    const id = requestAnimationFrame(() => updateFloatingPosition());
    return () => cancelAnimationFrame(id);
  }, [openKey, updateFloatingPosition]);

  useLayoutEffect(() => {
    if (openKey == null) return;
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
  }, [openKey, updateFloatingPosition]);

  const popoverEl =
    openKey != null && showAnyPopover && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={floatingRef}
            className="fixed z-[200] w-max max-w-[min(18rem,calc(100vw-16px))] rounded-xl border border-[#3d2b1f]/15 bg-[#fdfbf7] px-3 py-2.5 text-left shadow-[0_12px_40px_rgba(61,43,31,0.15)] animate-fadeIn pointer-events-auto box-border"
            style={{ top: 0, left: 0 }}
            role="dialog"
            aria-label={
              showTodayCountdown && showEventPopover
                ? `${countdownPhrase()} Programa do dia ${openDayApril}`
                : showTodayCountdown
                  ? countdownPhrase()
                  : showEventPopover
                    ? `Programa do dia ${openDayApril}`
                    : ''
            }
            onMouseEnter={() => hoverUi && openKey != null && openForHover(openKey)}
            onMouseLeave={() => hoverUi && scheduleClose()}
          >
            {showTodayCountdown && (
              <p
                className={[
                  'text-sm font-medium text-[#166534] leading-snug',
                  showEventPopover ? 'mb-2' : '',
                ].join(' ')}
              >
                {countdownPhrase()}
              </p>
            )}
            {showEventPopover && openMeta && (
              <>
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#3d2b1f]/50 mb-1.5">
                  {openDayApril} de abril · {openMeta.weekday}
                </p>
                <ul className="space-y-1 text-sm text-[#333]/95 leading-snug">
                  {openMeta.items.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className="text-rose-600 shrink-0" aria-hidden>
                        ·
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
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
          {grid.map((cell, i) => {
            const { monthIndex, day } = cell;
            const k = cellKey(monthIndex, day);
            const isApril = monthIndex === MONTH_INDEX;
            const isHeart = isApril && HIGHLIGHT_DAYS.has(day);
            const isToday = todayKey === k;
            const isOpen = openKey === k;

            if (!isHeart) {
              const plainText = isApril ? 'text-[#1a1a1a]' : 'text-[#a3a3a3]';
              const todayText = isApril ? 'text-[#1a1a1a]' : 'text-[#8f8f8f]';

              if (isToday) {
                return (
                  <div
                    key={`${k}-${i}`}
                    className="relative aspect-square min-h-[2.25rem] flex items-center justify-center"
                    onMouseEnter={() => hoverUi && openForHover(k)}
                    onMouseLeave={() => hoverUi && scheduleClose()}
                  >
                    <button
                      ref={openKey === k ? anchorRef : undefined}
                      type="button"
                      className={[
                        'relative z-[1] w-full h-full min-h-[2.25rem] flex items-center justify-center rounded-xl border text-sm tabular-nums transition-[background-color,border-color,box-shadow]',
                        'focus:outline-none focus:ring-2 focus:ring-emerald-800/35 focus:ring-offset-2 focus:ring-offset-[#fdfbf7]',
                        todayText,
                        isOpen
                          ? TODAY_CELL.open
                          : [TODAY_CELL.base, TODAY_CELL.hover, 'shadow-inner'].join(' '),
                      ].join(' ')}
                      aria-expanded={isOpen}
                      aria-haspopup="dialog"
                      aria-label={countdownPhrase()}
                      aria-current="date"
                      onClick={() => onDayActivate(k)}
                    >
                      {day}
                    </button>
                  </div>
                );
              }
              return (
                <div
                  key={`${k}-${i}`}
                  className={[
                    'aspect-square min-h-[2.25rem] flex items-center justify-center rounded-lg text-sm tabular-nums',
                    plainText,
                  ].join(' ')}
                  aria-hidden
                >
                  {day}
                </div>
              );
            }

            const meta = EVENTS[day];

            return (
              <div
                key={`${k}-${i}`}
                className="relative aspect-square min-h-[2.25rem] flex items-center justify-center"
                onMouseEnter={() => hoverUi && openForHover(k)}
                onMouseLeave={() => hoverUi && scheduleClose()}
              >
                <button
                  ref={openKey === k ? anchorRef : undefined}
                  type="button"
                  className={[
                    'relative z-[1] w-full h-full min-h-[2.25rem] flex flex-col items-center justify-center gap-0.5 rounded-xl border transition-[background-color,border-color,box-shadow]',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#fdfbf7]',
                    'focus:ring-rose-700/40',
                    isOpen
                      ? WEEKEND_CELL.open
                      : [WEEKEND_CELL.base, WEEKEND_CELL.hover].join(' '),
                  ].join(' ')}
                  aria-expanded={isOpen}
                  aria-haspopup="dialog"
                  aria-label={
                    isToday
                      ? `${countdownPhrase()} ${day} de abril, ${meta.weekday}. Toque para ver o programa.`
                      : `${day} de abril, ${meta.weekday}. Toque para ver o programa.`
                  }
                  aria-current={isToday ? 'date' : undefined}
                  onClick={() => onDayActivate(k)}
                >
                  <Heart
                    className="w-4 h-4 text-rose-700 fill-rose-500/40 shrink-0"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <span className="text-[11px] font-semibold text-rose-950 tabular-nums leading-none">
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
