import React, { useEffect, useState } from 'react';
import { KeyRound, Lightbulb, Lock, Sparkles } from 'lucide-react';

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

const GamePage: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [r1, setR1] = useState('');
  const [r2, setR2] = useState<string | null>(null);
  const [r3, setR3] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hintOpen, setHintOpen] = useState(false);

  useEffect(() => {
    const prev = document.title;
    document.title = TITLE;
    return () => {
      document.title = prev;
    };
  }, []);

  const clearError = () => setError(null);

  const tryRoom1 = (e: React.FormEvent) => {
    e.preventDefault();
    const n = normalizeAnswer(r1);
    if (room1.acceptedAnswers.some((a) => normalizeAnswer(a) === n)) {
      setPhase('room2');
      setHintOpen(false);
      clearError();
      setR1('');
    } else {
      setError('Não é bem isso… tenta de novo.');
    }
  };

  const tryRoom2 = () => {
    if (r2 === room2.correctId) {
      setPhase('room3');
      setHintOpen(false);
      clearError();
      setR2(null);
    } else {
      setError('Quase! Escolha outra opção.');
    }
  };

  const tryRoom3 = (e: React.FormEvent) => {
    e.preventDefault();
    const n = normalizeAnswer(r3);
    if (room3.acceptedAnswers.some((a) => normalizeAnswer(a) === n)) {
      setPhase('finale');
      setHintOpen(false);
      clearError();
    } else {
      setError('Código incorreto. Releia as pistas dos salões.');
    }
  };

  const cardClass =
    'max-w-lg w-full mx-auto rounded-2xl border border-[#3d2b1f]/15 bg-white/80 backdrop-blur-sm shadow-[0_8px_40px_rgba(61,43,31,0.08)] px-6 py-8 md:px-10 md:py-10';

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfbf7] text-[#333]">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-16">
        {phase === 'intro' && (
          <div className={`${cardClass} animate-fadeIn text-center`}>
            <div className="flex justify-center mb-6 text-[#3d2b1f]/70">
              <Lock className="w-10 h-10" strokeWidth={1.25} aria-hidden />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl text-[#3d2b1f] mb-4">{intro.title}</h1>
            <p className="text-[#333]/85 leading-relaxed mb-8">{intro.body}</p>
            <button
              type="button"
              onClick={() => {
                setPhase('room1');
                clearError();
              }}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#3d2b1f] text-[#fdfbf7] font-medium hover:bg-[#2a1f16] transition-colors"
            >
              <KeyRound className="w-5 h-5" aria-hidden />
              {intro.cta}
            </button>
          </div>
        )}

        {phase === 'room1' && (
          <div className={`${cardClass} animate-fade`}>
            <p className="text-xs uppercase tracking-[0.2em] text-[#3d2b1f]/50 mb-2">1 / 3</p>
            <h2 className="font-serif text-2xl md:text-3xl text-[#3d2b1f] mb-4">{room1.title}</h2>
            <p className="text-[#333]/90 mb-6 leading-relaxed">{room1.prompt}</p>
            <form onSubmit={tryRoom1} className="space-y-4">
              <label className="sr-only" htmlFor="game-r1">
                Resposta
              </label>
              <input
                id="game-r1"
                value={r1}
                onChange={(e) => {
                  setR1(e.target.value);
                  clearError();
                }}
                autoComplete="off"
                className="w-full px-4 py-3 rounded-xl border border-[#3d2b1f]/20 bg-[#fdfbf7] focus:outline-none focus:ring-2 focus:ring-[#3d2b1f]/30"
                placeholder="Sua resposta"
              />
              {error && phase === 'room1' && (
                <p className="text-sm text-red-800/90" role="status">
                  {error}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#3d2b1f] text-[#fdfbf7] font-medium hover:bg-[#2a1f16] transition-colors"
                >
                  Abrir a porta
                </button>
                <button
                  type="button"
                  onClick={() => setHintOpen((v) => !v)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm text-[#3d2b1f]/80 hover:text-[#3d2b1f]"
                >
                  <Lightbulb className="w-4 h-4" aria-hidden />
                  {hintOpen ? 'Esconder dica' : 'Dica'}
                </button>
              </div>
              {hintOpen && (
                <p className="text-sm text-[#3d2b1f]/75 border-l-2 border-[#3d2b1f]/30 pl-3">{room1.hint}</p>
              )}
            </form>
          </div>
        )}

        {phase === 'room2' && (
          <div className={`${cardClass} animate-fade`}>
            <p className="text-xs uppercase tracking-[0.2em] text-[#3d2b1f]/50 mb-2">2 / 3</p>
            <h2 className="font-serif text-2xl md:text-3xl text-[#3d2b1f] mb-4">{room2.title}</h2>
            <p className="text-[#333]/90 mb-6 leading-relaxed">{room2.prompt}</p>
            <div className="space-y-3 mb-6">
              {room2.options.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                    r2 === opt.id ? 'border-[#3d2b1f] bg-[#3d2b1f]/5' : 'border-[#3d2b1f]/15 hover:border-[#3d2b1f]/35'
                  }`}
                >
                  <input
                    type="radio"
                    name="room2"
                    value={opt.id}
                    checked={r2 === opt.id}
                    onChange={() => {
                      setR2(opt.id);
                      clearError();
                    }}
                    className="mt-1 accent-[#3d2b1f]"
                  />
                  <span className="text-[#333]/95">{opt.label}</span>
                </label>
              ))}
            </div>
            {error && phase === 'room2' && (
              <p className="text-sm text-red-800/90 mb-4" role="status">
                {error}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <button
                type="button"
                disabled={r2 == null}
                onClick={tryRoom2}
                className="px-6 py-3 rounded-xl bg-[#3d2b1f] text-[#fdfbf7] font-medium hover:bg-[#2a1f16] transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                Continuar
              </button>
              <button
                type="button"
                onClick={() => setHintOpen((v) => !v)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm text-[#3d2b1f]/80 hover:text-[#3d2b1f]"
              >
                <Lightbulb className="w-4 h-4" aria-hidden />
                {hintOpen ? 'Esconder dica' : 'Dica'}
              </button>
            </div>
            {hintOpen && (
              <p className="text-sm text-[#3d2b1f]/75 border-l-2 border-[#3d2b1f]/30 pl-3 mt-4">{room2.hint}</p>
            )}
          </div>
        )}

        {phase === 'room3' && (
          <div className={`${cardClass} animate-fade`}>
            <p className="text-xs uppercase tracking-[0.2em] text-[#3d2b1f]/50 mb-2">3 / 3</p>
            <h2 className="font-serif text-2xl md:text-3xl text-[#3d2b1f] mb-4">{room3.title}</h2>
            <p className="text-[#333]/90 mb-6 leading-relaxed">{room3.prompt}</p>
            <form onSubmit={tryRoom3} className="space-y-4">
              <label className="sr-only" htmlFor="game-r3">
                Código
              </label>
              <input
                id="game-r3"
                value={r3}
                onChange={(e) => {
                  setR3(e.target.value);
                  clearError();
                }}
                autoComplete="off"
                className="w-full px-4 py-3 rounded-xl border border-[#3d2b1f]/20 bg-[#fdfbf7] focus:outline-none focus:ring-2 focus:ring-[#3d2b1f]/30 tracking-widest uppercase"
                placeholder="Código"
              />
              {error && phase === 'room3' && (
                <p className="text-sm text-red-800/90" role="status">
                  {error}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#3d2b1f] text-[#fdfbf7] font-medium hover:bg-[#2a1f16] transition-colors"
                >
                  Desbloquear
                </button>
                <button
                  type="button"
                  onClick={() => setHintOpen((v) => !v)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm text-[#3d2b1f]/80 hover:text-[#3d2b1f]"
                >
                  <Lightbulb className="w-4 h-4" aria-hidden />
                  {hintOpen ? 'Esconder dica' : 'Dica'}
                </button>
              </div>
              {hintOpen && (
                <p className="text-sm text-[#3d2b1f]/75 border-l-2 border-[#3d2b1f]/30 pl-3">{room3.hint}</p>
              )}
            </form>
          </div>
        )}

        {phase === 'finale' && (
          <div className={`${cardClass} animate-fadeIn text-center`}>
            <div className="flex justify-center mb-6 text-[#3d2b1f]/70">
              <Sparkles className="w-10 h-10" strokeWidth={1.25} aria-hidden />
            </div>
            <h2 className="font-serif text-2xl md:text-3xl text-[#3d2b1f] mb-6">{finale.title}</h2>
            <div className="text-left space-y-4 text-[#333]/90 leading-relaxed mb-8">
              {finale.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <p className="font-serif italic text-[#3d2b1f]/90">{finale.signature}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default GamePage;
