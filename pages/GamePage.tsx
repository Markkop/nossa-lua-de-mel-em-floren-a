import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { KeyRound, Lock, Shield, Sparkles } from 'lucide-react';

import WeddingWeekendCalendar from '../components/WeddingWeekendCalendar';
import {
  finale,
  intro,
  normalizeAnswer,
  room1,
  room2,
  room3,
  type GamePhase,
} from '../escapeRoomConfig';

const TITLE = 'Um segredo | Yosha e Mark';

const ROOM2_OPTION_IDS = room2.options.map((o) => o.id);

/** Texto compartilhado ao “mandar estrelinha” (missão do grupo). */
const SHARE_ESTRELINHA_TEXT = '✨';

/** Debug: `/missao?step=finale` abre direto na tela final. */
function isStepFinaleSearch(search: string): boolean {
  return new URLSearchParams(search).get('step') === 'finale';
}

const GamePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [phase, setPhase] = useState<GamePhase>(() =>
    typeof window !== 'undefined' && isStepFinaleSearch(window.location.search) ? 'finale' : 'intro',
  );
  const [r1, setR1] = useState('');
  const [r2, setR2] = useState<string | null>(null);
  const [r3, setR3] = useState('');
  const [error, setError] = useState<string | null>(null);
  /** Carta virada para o verso (texto) após acerto no salão atual. */
  const [salonFlipped, setSalonFlipped] = useState(false);

  const introCtaRef = useRef<HTMLButtonElement>(null);
  const answerInputRef = useRef<HTMLInputElement>(null);
  const continueAfterFlipRef = useRef<HTMLButtonElement>(null);
  const room2FirstRadioRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const prev = document.title;
    document.title = TITLE;
    return () => {
      document.title = prev;
    };
  }, []);

  /** Foco no CTA da intro ao entrar. */
  useEffect(() => {
    if (phase !== 'intro') return;
    const t = window.requestAnimationFrame(() => introCtaRef.current?.focus());
    return () => window.cancelAnimationFrame(t);
  }, [phase]);

  /** Foco no campo de resposta (salões I e III). */
  useEffect(() => {
    if (salonFlipped) return;
    if (phase === 'room1' || phase === 'room3') {
      const t = window.setTimeout(() => answerInputRef.current?.focus(), 0);
      return () => window.clearTimeout(t);
    }
  }, [phase, salonFlipped]);

  /** Foco no primeiro rádio do salão II. */
  useEffect(() => {
    if (phase !== 'room2' || salonFlipped) return;
    const t = window.setTimeout(() => room2FirstRadioRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [phase, salonFlipped]);

  /** Após virar a carta, foco no Continuar (tecla Enter confirma). */
  useEffect(() => {
    if (!salonFlipped) return;
    if (phase !== 'room1' && phase !== 'room2' && phase !== 'room3') return;
    const t = window.setTimeout(() => continueAfterFlipRef.current?.focus(), 480);
    return () => window.clearTimeout(t);
  }, [salonFlipped, phase]);

  /** Sincroniza `?step=finale` (ex.: navegação client-side ou colar URL). */
  useEffect(() => {
    if (searchParams.get('step') !== 'finale') return;
    setPhase('finale');
    setSalonFlipped(false);
    setR1('');
    setR2(null);
    setR3('');
    setError(null);
  }, [searchParams]);

  const clearError = () => setError(null);

  const resetGame = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('step');
        return next;
      },
      { replace: true },
    );
    setPhase('intro');
    setR1('');
    setR2(null);
    setR3('');
    setError(null);
    setSalonFlipped(false);
  };

  const shareEstrelinha = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ text: SHARE_ESTRELINHA_TEXT });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(SHARE_ESTRELINHA_TEXT);
      }
    } catch (err) {
      const e = err as { name?: string };
      if (e?.name === 'AbortError') return;
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(SHARE_ESTRELINHA_TEXT);
        }
      } catch {
        /* ignore */
      }
    }
  };

  const handleRoom2KeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
      return;
    }
    const tgt = e.target as HTMLElement;
    if (tgt.tagName === 'BUTTON') return;
    const opts = ROOM2_OPTION_IDS;
    if (r2 == null) {
      e.preventDefault();
      setR2(opts[0]);
      clearError();
      return;
    }
    const idx = opts.indexOf(r2);
    if (idx < 0) return;
    e.preventDefault();
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      setR2(opts[(idx + 1) % opts.length]);
    } else {
      setR2(opts[(idx - 1 + opts.length) % opts.length]);
    }
    clearError();
  };

  const tryRoom1 = (e: React.FormEvent) => {
    e.preventDefault();
    const n = normalizeAnswer(r1);
    if (room1.acceptedAnswers.some((a) => normalizeAnswer(a) === n)) {
      clearError();
      setR1('');
      setSalonFlipped(true);
    } else {
      setError('Não é bem isso… tenta de novo.');
    }
  };

  const tryRoom2 = () => {
    if (r2 === room2.correctId) {
      clearError();
      setR2(null);
      setSalonFlipped(true);
    } else {
      setError('Quase! Escolha outra opção.');
    }
  };

  const tryRoom3 = (e: React.FormEvent) => {
    e.preventDefault();
    const n = normalizeAnswer(r3);
    if (room3.acceptedAnswers.some((a) => normalizeAnswer(a) === n)) {
      clearError();
      setSalonFlipped(true);
    } else {
      setError('Código incorreto. Releia as pistas dos salões.');
    }
  };

  const cardClass =
    'rounded-2xl border border-[#3d2b1f]/15 bg-white/80 backdrop-blur-sm shadow-[0_8px_40px_rgba(61,43,31,0.08)] px-6 py-8 md:px-10 md:py-10';

  const flipWrapClass = 'max-w-lg w-full mx-auto flip-card-perspective animate-fade';

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfbf7] text-[#333]">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-16">
        {phase === 'intro' && (
          <div className={`max-w-lg w-full mx-auto ${cardClass} animate-fadeIn text-center`}>
            <div className="flex justify-center mb-6 text-[#3d2b1f]/70">
              <Lock className="w-10 h-10" strokeWidth={1.25} aria-hidden />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl text-[#3d2b1f] mb-4">{intro.title}</h1>
            <p className="text-[#333]/85 leading-relaxed mb-8">{intro.body}</p>
            <button
              ref={introCtaRef}
              type="button"
              onClick={() => {
                setPhase('room1');
                setSalonFlipped(false);
                clearError();
              }}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#3d2b1f] text-[#fdfbf7] font-medium hover:bg-[#2a1f16] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3d2b1f]/40 focus:ring-offset-2 focus:ring-offset-[#fdfbf7]"
            >
              <KeyRound className="w-5 h-5" aria-hidden />
              {intro.cta}
            </button>
          </div>
        )}

        {phase === 'room1' && (
          <div className={flipWrapClass} role="region" aria-label="Salão I">
            <div className={`flip-card-inner ${salonFlipped ? 'flipped' : ''}`}>
              <div className={`flip-card-face flip-card-front ${cardClass}`}>
                <p className="text-xs uppercase tracking-[0.2em] text-[#3d2b1f]/50 mb-2">1 / 3</p>
                <h2 id="room1-heading" className="font-serif text-2xl md:text-3xl text-[#3d2b1f] mb-4">
                  {room1.title}
                </h2>
                <p className="text-[#333]/90 mb-6 leading-relaxed">{room1.prompt}</p>
                <form onSubmit={tryRoom1} className="space-y-4" aria-labelledby="room1-heading">
                  <label className="sr-only" htmlFor="game-r1">
                    Resposta
                  </label>
                  <input
                    ref={answerInputRef}
                    id="game-r1"
                    value={r1}
                    onChange={(e) => {
                      setR1(e.target.value);
                      clearError();
                    }}
                    autoComplete="off"
                    className="w-full px-4 py-3 rounded-xl border border-[#3d2b1f]/20 bg-[#fdfbf7] focus:outline-none focus:ring-2 focus:ring-[#3d2b1f]/30"
                    placeholder="Sua resposta"
                    enterKeyHint="go"
                  />
                  {error && (
                    <p className="text-sm text-red-800/90" role="status">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-[#3d2b1f] text-[#fdfbf7] font-medium hover:bg-[#2a1f16] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3d2b1f]/40 focus:ring-offset-2 focus:ring-offset-[#fdfbf7]"
                  >
                    Abrir a porta
                  </button>
                </form>
              </div>
              <div className={`flip-card-face flip-card-back ${cardClass}`}>
                <p className="text-center text-[#333]/90 leading-relaxed text-sm md:text-base flex-1 flex items-center" role="status">
                  {room1.flavorText}
                </p>
                <button
                  ref={continueAfterFlipRef}
                  type="button"
                  onClick={() => {
                    setSalonFlipped(false);
                    setPhase('room2');
                  }}
                  className="mt-6 w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#3d2b1f] text-[#fdfbf7] font-medium hover:bg-[#2a1f16] transition-colors self-center focus:outline-none focus:ring-2 focus:ring-[#3d2b1f]/40 focus:ring-offset-2 focus:ring-offset-[#fdfbf7]"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}

        {phase === 'room2' && (
          <div className={flipWrapClass} role="region" aria-label="Salão II">
            <div className={`flip-card-inner ${salonFlipped ? 'flipped' : ''}`}>
              <div className={`flip-card-face flip-card-front ${cardClass}`}>
                <p className="text-xs uppercase tracking-[0.2em] text-[#3d2b1f]/50 mb-2">2 / 3</p>
                <h2 id="room2-heading" className="font-serif text-2xl md:text-3xl text-[#3d2b1f] mb-4">
                  {room2.title}
                </h2>
                <p className="text-[#333]/90 mb-6 leading-relaxed">{room2.prompt}</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    tryRoom2();
                  }}
                  onKeyDownCapture={handleRoom2KeyDown}
                  className="flex flex-col"
                  aria-labelledby="room2-heading"
                >
                  <div className="space-y-3 mb-6" role="radiogroup" aria-labelledby="room2-heading">
                    {room2.options.map((opt, i) => (
                      <label
                        key={opt.id}
                        className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                          r2 === opt.id ? 'border-[#3d2b1f] bg-[#3d2b1f]/5' : 'border-[#3d2b1f]/15 hover:border-[#3d2b1f]/35'
                        }`}
                      >
                        <input
                          ref={i === 0 ? room2FirstRadioRef : undefined}
                          type="radio"
                          name="room2"
                          value={opt.id}
                          checked={r2 === opt.id}
                          onChange={() => {
                            setR2(opt.id);
                            clearError();
                          }}
                          className="mt-1 accent-[#3d2b1f] focus:outline-none focus:ring-2 focus:ring-[#3d2b1f]/40 focus:ring-offset-2 focus:ring-offset-[#fdfbf7] rounded-full"
                        />
                        <span className="text-[#333]/95">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  {error && (
                    <p className="text-sm text-red-800/90 mb-4" role="status">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={r2 == null}
                    className="px-6 py-3 rounded-xl bg-[#3d2b1f] text-[#fdfbf7] font-medium hover:bg-[#2a1f16] transition-colors disabled:opacity-40 disabled:pointer-events-none self-start focus:outline-none focus:ring-2 focus:ring-[#3d2b1f]/40 focus:ring-offset-2 focus:ring-offset-[#fdfbf7] disabled:focus:ring-0"
                  >
                    Continuar
                  </button>
                </form>
              </div>
              <div className={`flip-card-face flip-card-back ${cardClass}`}>
                <p className="text-center text-[#333]/90 leading-relaxed text-sm md:text-base flex-1 flex items-center" role="status">
                  {room2.flavorText}
                </p>
                <button
                  ref={continueAfterFlipRef}
                  type="button"
                  onClick={() => {
                    setSalonFlipped(false);
                    setPhase('room3');
                  }}
                  className="mt-6 w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#3d2b1f] text-[#fdfbf7] font-medium hover:bg-[#2a1f16] transition-colors self-center focus:outline-none focus:ring-2 focus:ring-[#3d2b1f]/40 focus:ring-offset-2 focus:ring-offset-[#fdfbf7]"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}

        {phase === 'room3' && (
          <div className={flipWrapClass} role="region" aria-label="Salão III">
            <div className={`flip-card-inner ${salonFlipped ? 'flipped' : ''}`}>
              <div className={`flip-card-face flip-card-front ${cardClass}`}>
                <p className="text-xs uppercase tracking-[0.2em] text-[#3d2b1f]/50 mb-2">3 / 3</p>
                <h2 id="room3-heading" className="font-serif text-2xl md:text-3xl text-[#3d2b1f] mb-4">
                  {room3.title}
                </h2>
                <p className="text-[#333]/90 mb-6 leading-relaxed">{room3.prompt}</p>
                <form onSubmit={tryRoom3} className="space-y-4" aria-labelledby="room3-heading">
                  <label className="sr-only" htmlFor="game-r3">
                    Código
                  </label>
                  <input
                    ref={answerInputRef}
                    id="game-r3"
                    value={r3}
                    onChange={(e) => {
                      setR3(e.target.value);
                      clearError();
                    }}
                    autoComplete="off"
                    className="w-full px-4 py-3 rounded-xl border border-[#3d2b1f]/20 bg-[#fdfbf7] focus:outline-none focus:ring-2 focus:ring-[#3d2b1f]/30 tracking-widest uppercase"
                    placeholder="Código"
                    enterKeyHint="go"
                  />
                  {error && (
                    <p className="text-sm text-red-800/90" role="status">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-[#3d2b1f] text-[#fdfbf7] font-medium hover:bg-[#2a1f16] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3d2b1f]/40 focus:ring-offset-2 focus:ring-offset-[#fdfbf7]"
                  >
                    Desbloquear
                  </button>
                </form>
              </div>
              <div className={`flip-card-face flip-card-back ${cardClass}`}>
                <p className="text-center text-[#333]/90 leading-relaxed text-sm md:text-base flex-1 flex items-center" role="status">
                  {room3.flavorText}
                </p>
                <button
                  ref={continueAfterFlipRef}
                  type="button"
                  onClick={() => {
                    setSalonFlipped(false);
                    setPhase('finale');
                  }}
                  className="mt-6 w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#3d2b1f] text-[#fdfbf7] font-medium hover:bg-[#2a1f16] transition-colors self-center focus:outline-none focus:ring-2 focus:ring-[#3d2b1f]/40 focus:ring-offset-2 focus:ring-offset-[#fdfbf7]"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}

        {phase === 'finale' && (
          <div
            className={`max-w-lg md:max-w-3xl lg:max-w-4xl w-full mx-auto ${cardClass} animate-fadeIn text-center`}
          >
            <div className="flex justify-center mb-6 text-[#3d2b1f]/70">
              <Shield className="w-10 h-10" strokeWidth={1.25} aria-hidden />
            </div>
            <h2 className="font-serif text-2xl md:text-3xl text-[#3d2b1f] mb-6">{finale.title}</h2>
            <p className="text-left text-[#333]/90 leading-relaxed mb-6">{finale.opening}</p>
            <p className="text-left text-[#333]/90 leading-relaxed mb-6">{finale.scheduleIntro}</p>
            <div className="mb-10">
              <WeddingWeekendCalendar />
            </div>
            <div className="text-left space-y-4 text-[#333]/90 leading-relaxed mb-8">
              {finale.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <p className="font-serif italic text-[#3d2b1f]/90 mb-8">{finale.signature}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                type="button"
                onClick={resetGame}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-[#3d2b1f]/35 bg-[#fdfbf7] text-[#3d2b1f] font-medium hover:bg-[#3d2b1f]/5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#3d2b1f]/40 focus:ring-offset-2 focus:ring-offset-[#fdfbf7]"
              >
                Recomeçar
              </button>
              <button
                type="button"
                onClick={() => void shareEstrelinha()}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-[#3d2b1f] text-[#fdfbf7] font-medium hover:bg-[#2a1f16] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3d2b1f]/40 focus:ring-offset-2 focus:ring-offset-[#fdfbf7]"
              >
                <Sparkles className="w-5 h-5 shrink-0" strokeWidth={1.75} aria-hidden />
                Mandar estrelinha
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default GamePage;
