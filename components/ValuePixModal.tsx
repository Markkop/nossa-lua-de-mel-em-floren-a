import React, { useState, useEffect } from 'react';
import { getPixCode, hasPixCode } from '../pixConfig';

interface ValuePixModalProps {
  amount: number;
  onClose: () => void;
}

const ValuePixModal: React.FC<ValuePixModalProps> = ({ amount, onClose }) => {
  const [copied, setCopied] = useState(false);
  const pixCode = getPixCode(amount);
  const isPixConfigured = hasPixCode(amount);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-black/95 backdrop-blur-md animate-fade"
      onClick={handleBackdropClick}
    >
      {/* Close button */}
      <button 
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-6 right-6 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="w-full max-w-xl px-8 animate-fadeIn">
        <div className="bg-white/5 border border-white/10 rounded-3xl px-8 py-8 md:px-12 md:py-10 max-w-xl mx-auto text-center">
          {/* Heart icon */}
          <div className="mb-6 text-[#e6d5c3] opacity-80">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          
          <h3 className="text-5xl font-serif text-[#e6d5c3] tracking-tight mb-3">
            Grazie Mille
          </h3>
          <p className="text-white/60 mb-8 italic text-lg font-light">
            Todo o valor arrecadado contribuirá com a nossa lua de mel.
          </p>
          
          {/* QR Code container */}
          <div className="mb-6 inline-block">
            <div className="bg-white p-3 rounded-xl shadow-xl">
              <div className="w-40 h-40">
                {isPixConfigured ? (
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCode)}`}
                    alt="QR Code PIX"
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded text-gray-400 text-xs text-center p-2">
                    QR Code será exibido quando o código PIX for configurado
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Amount info */}
          <div className="mb-6">
            <div className="text-2xl font-bold text-white">
              R$ {amount.toLocaleString('pt-BR')}
            </div>
          </div>

          {/* Copy button */}
          {isPixConfigured ? (
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Código Copiado!
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copiar Código PIX
                </>
              )}
            </button>
          ) : (
            <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl">
              <p className="text-yellow-200 text-sm">
                O código PIX para este valor ainda não foi configurado.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValuePixModal;
