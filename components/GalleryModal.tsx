import React, { useState, useEffect } from 'react';
import { GiftOption } from '../types';
import { getPixCode, hasPixCode } from '../pixConfig';

interface GalleryModalProps {
  allGifts: GiftOption[];
  startingGiftIndex: number;
  onClose: () => void;
}

const GalleryModal: React.FC<GalleryModalProps> = ({ allGifts, startingGiftIndex, onClose }) => {
  const [currentGiftIndex, setCurrentGiftIndex] = useState(startingGiftIndex);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  // Reset state when starting gift changes
  useEffect(() => {
    setCurrentGiftIndex(startingGiftIndex);
    setCurrentSlideIndex(0);
    setCopied(false);
    setAnimationKey(0);
  }, [startingGiftIndex]);

  if (allGifts.length === 0) return null;

  const currentGift = allGifts[currentGiftIndex];
  const totalSlides = currentGift.gallery.length + 1; // 3 story slides + 1 thank you slide
  const isLastSlide = currentSlideIndex === totalSlides - 1;
  const isFirstSlide = currentSlideIndex === 0;
  const isFirstGift = currentGiftIndex === 0;
  const isLastGift = currentGiftIndex === allGifts.length - 1;
  const pixCode = getPixCode(currentGift.amount);
  const isPixConfigured = hasPixCode(currentGift.amount);

  // Hide prev button only on first slide of first gift
  const showPrevButton = !(isFirstSlide && isFirstGift);
  // Hide next button only on last slide of last gift
  const showNextButton = !(isLastSlide && isLastGift);

  const goNext = () => {
    if (currentSlideIndex < totalSlides - 1) {
      // Move to next slide within current gift
      setCurrentSlideIndex(currentSlideIndex + 1);
      setAnimationKey(prev => prev + 1);
    } else if (!isLastGift) {
      // On last slide, move to first slide of next gift
      setCurrentGiftIndex(currentGiftIndex + 1);
      setCurrentSlideIndex(0);
      setCopied(false);
      setAnimationKey(prev => prev + 1);
    }
  };

  const goPrev = () => {
    if (currentSlideIndex > 0) {
      // Move to previous slide within current gift
      setCurrentSlideIndex(currentSlideIndex - 1);
      setAnimationKey(prev => prev + 1);
    } else if (!isFirstGift) {
      // On first slide, move to last slide of previous gift
      const prevGift = allGifts[currentGiftIndex - 1];
      const prevGiftTotalSlides = prevGift.gallery.length + 1;
      setCurrentGiftIndex(currentGiftIndex - 1);
      setCurrentSlideIndex(prevGiftTotalSlides - 1);
      setCopied(false);
      setAnimationKey(prev => prev + 1);
    }
  };

  const handleCopy = () => {
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
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-black/95 backdrop-blur-md animate-fade"
      onClick={handleBackdropClick}
    >
      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Main content area */}
      <div className="w-full max-w-5xl px-8 pb-20">
        {!isLastSlide ? (
          // Story slides (0-2)
          <div 
            key={`slide-${animationKey}`}
            className="relative animate-fadeIn"
          >
            {/* Cinematic image container */}
            <div className="relative aspect-[21/9] md:aspect-[21/9] aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src={currentGift.gallery[currentSlideIndex].imageUrl} 
                alt={`${currentGift.title}`}
                className="w-full h-full object-cover"
              />
              {/* Gradient overlay for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
            
            {/* Caption - positioned below the image */}
            <div className="mt-8 text-center px-4">
              <p className="text-white text-lg md:text-xl font-serif italic font-light leading-relaxed max-w-2xl mx-auto">
                {currentGift.gallery[currentSlideIndex].caption}
              </p>
            </div>
          </div>
        ) : (
          // Thank you / PIX slide - "Grazie Mille"
          <div 
            key={`slide-${animationKey}`}
            className="animate-fadeIn"
          >
            <div className="bg-white/5 border border-white/10 rounded-3xl px-8 py-5 md:px-12 md:py-6 max-w-xl mx-auto text-center">
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
                Seu presente vai tornar esse momento ainda mais especial.
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

              {/* Gift info */}
              <div className="mb-6">
                <div className="text-white/30 text-[10px] font-bold tracking-[0.3em] uppercase mb-1">
                  {currentGift.title}
                </div>
                <div className="text-2xl font-bold text-white">
                  R$ {currentGift.amount.toLocaleString('pt-BR')},00
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
        )}
      </div>

      {/* Navigation area - Footer */}
      <div className="absolute bottom-6 left-0 right-0 px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Previous button - hidden on first slide of first gift */}
          <div className="w-12">
            {showPrevButton && (
              <button
                onClick={goPrev}
                className="p-3 rounded-full text-white hover:bg-white/10 transition-all active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>

          {/* Progress dots - shows current gift's slides only */}
          <div className="flex gap-2 items-center">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentSlideIndex(index);
                  setAnimationKey(prev => prev + 1);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlideIndex 
                    ? 'w-10 bg-[#8b5e3c]' 
                    : 'w-2 bg-white/10 hover:bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Next button - hidden on last slide of last gift */}
          <div className="w-12">
            {showNextButton && (
              <button
                onClick={goNext}
                className="p-3 rounded-full text-white hover:bg-white/10 transition-all active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryModal;
