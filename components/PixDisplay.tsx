import React, { useState } from 'react';

interface PixDisplayProps {
  title: string;
  pixCode: string;
  isPixConfigured: boolean;
}

const PixDisplay: React.FC<PixDisplayProps> = ({ title, pixCode, isPixConfigured }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <main className="min-h-[100dvh] bg-black flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl animate-fadeIn">
        <div className="bg-white/5 border border-white/10 rounded-3xl px-5 py-7 sm:px-8 sm:py-8 md:px-12 md:py-10 text-center">
          <div className="mb-6 text-[#e6d5c3] opacity-80">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-11 w-11 mx-auto" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>

          <h1 className="text-4xl sm:text-5xl font-serif text-[#e6d5c3] tracking-tight mb-7">
            {title}
          </h1>

          <div className="mb-6 inline-block">
            <div className="bg-white p-3 rounded-xl shadow-xl">
              <div className="w-48 h-48 sm:w-56 sm:h-56">
                {isPixConfigured ? (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(pixCode)}`}
                    alt="QR Code PIX"
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded text-gray-400 text-xs text-center p-3">
                    Código PIX ainda não configurado
                  </div>
                )}
              </div>
            </div>
          </div>

          {isPixConfigured ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Código PIX copia e cola"
                className="mx-auto flex w-fit max-w-full justify-center rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-center text-sm leading-relaxed text-white/90 outline-none transition-colors hover:border-[#e6d5c3]/50 focus:border-[#e6d5c3]/70"
              >
                <span className="break-all">{pixCode}</span>
              </button>

              <button
                onClick={handleCopy}
                className={`w-full py-4 rounded-xl font-bold text-base shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-[#8b5e3c] text-white hover:bg-[#a67d5c]'
                }`}
              >
                {copied ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Código copiado!
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copiar código PIX
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl">
              <p className="text-yellow-200 text-sm">
                O código PIX ainda não foi configurado.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default PixDisplay;
