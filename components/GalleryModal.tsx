import React, { useState, useEffect } from 'react';
import { GiftOption } from '../types';
import ValuePixModal from './ValuePixModal';

const VALUE_OPTIONS = [50, 100, 250, 500, 1000, 2000];

interface GalleryModalProps {
  allGifts: GiftOption[];
  startingGiftIndex: number;
  onClose: () => void;
}

const CONTRIBUTION_MESSAGES = [
  "Ajude esse momento a acontecer",
  "Contribua de acordo com a sua realidade",
  "Torne esse sonho realidade",
  "Financie essa aventura",
  "Seja parte dessa história",
  "Faça essa viagem sair do papel"
];

const GalleryModal: React.FC<GalleryModalProps> = ({ allGifts, startingGiftIndex, onClose }) => {
  const [currentGiftIndex, setCurrentGiftIndex] = useState(startingGiftIndex);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  
  // Swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Reset state when starting gift changes
  useEffect(() => {
    setCurrentGiftIndex(startingGiftIndex);
    setCurrentSlideIndex(0);
    setAnimationKey(0);
    setSelectedValue(null);
  }, [startingGiftIndex]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (allGifts.length === 0) return null;

  const currentGift = allGifts[currentGiftIndex];
  const totalSlides = currentGift.gallery.length + 1; // 3 story slides + 1 thank you slide
  const isLastSlide = currentSlideIndex === totalSlides - 1;
  const isFirstSlide = currentSlideIndex === 0;
  const isFirstGift = currentGiftIndex === 0;
  const isLastGift = currentGiftIndex === allGifts.length - 1;

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
      setAnimationKey(prev => prev + 1);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Swipe handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && showNextButton) goNext();
    if (isRightSwipe && showPrevButton) goPrev();
    
    // Reset touch state
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Edge click handlers with propagation stop
  const handleLeftEdgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showPrevButton) goPrev();
  };

  const handleRightEdgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showNextButton) goNext();
  };

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-black/95 backdrop-blur-md animate-fade"
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

      {/* Desktop edge navigation - full screen edges */}
      <div className="hidden md:block">
        {showPrevButton && (
          <div 
            className="fixed left-0 inset-y-0 w-[20%] z-10 cursor-pointer opacity-40 hover:opacity-100 transition-opacity duration-200"
            onClick={handleLeftEdgeClick}
          >
            <div className="h-full w-full bg-gradient-to-r from-white/10 to-transparent relative">
              <div className="absolute inset-y-0 left-8 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </div>
          </div>
        )}
        {showNextButton && (
          <div 
            className="fixed right-0 inset-y-0 w-[20%] z-10 cursor-pointer opacity-40 hover:opacity-100 transition-opacity duration-200"
            onClick={handleRightEdgeClick}
          >
            <div className="h-full w-full bg-gradient-to-l from-white/10 to-transparent relative">
              <div className="absolute inset-y-0 right-8 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main content area with touch handlers */}
      <div 
        className="w-full max-w-5xl px-8 pb-20 relative"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Mobile edge navigation - within gallery area, invisible but clickable */}
        <div className="md:hidden">
          {showPrevButton && (
            <div 
              className="absolute left-0 top-0 bottom-0 w-[15%] z-10"
              onClick={handleLeftEdgeClick}
            />
          )}
          {showNextButton && (
            <div 
              className="absolute right-0 top-0 bottom-0 w-[15%] z-10"
              onClick={handleRightEdgeClick}
            />
          )}
        </div>

        {!isLastSlide ? (
          // Story slides (0-2)
          <div 
            key={`slide-${animationKey}`}
            className="relative animate-fadeIn"
          >
            {/* Cinematic image container */}
            <div className="relative aspect-[3/4] portrait:aspect-[3/4] landscape:md:aspect-[21/9] rounded-2xl overflow-hidden shadow-2xl max-h-[70vh] portrait:max-h-[65vh] landscape:md:max-h-none mx-auto">
              <img 
                src={currentGift.gallery[currentSlideIndex].imageUrl} 
                alt={`${currentGift.title}`}
                className="w-full h-full object-cover object-center select-none pointer-events-none"
                draggable={false}
              />
              {/* Gradient overlay for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            </div>
            
            {/* Caption - positioned below the image */}
            <div className="mt-2 md:mt-8 text-center px-4">
              <p className="text-white text-2xl md:text-xl font-serif italic font-light leading-relaxed max-w-2xl mx-auto">
                {currentGift.gallery[currentSlideIndex].caption}
                {currentGift.gallery[currentSlideIndex].emoji && (
                  <span className="not-italic ml-2">{currentGift.gallery[currentSlideIndex].emoji}</span>
                )}
              </p>
            </div>
          </div>
        ) : (
          // Thank you / PIX slide - "Grazie Mille" with value buttons
          <div 
            key={`slide-${animationKey}`}
            className="animate-fadeIn"
          >
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
                {CONTRIBUTION_MESSAGES[currentGiftIndex % CONTRIBUTION_MESSAGES.length]}
              </p>
              
              {/* Value buttons grid */}
              <div className="grid grid-cols-3 gap-3 md:gap-4">
                {VALUE_OPTIONS.map((value) => (
                  <button
                    key={value}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedValue(value);
                    }}
                    className="py-3 md:py-4 px-2 md:px-4 bg-white/10 border-2 border-[#e6d5c3]/50 text-[#e6d5c3] font-normal rounded-xl hover:bg-[#8b5e3c] hover:border-[#8b5e3c] hover:text-white transition-all duration-300 active:scale-95 text-sm md:text-base"
                  >
                    R$ {value.toLocaleString('pt-BR')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Value PIX Modal */}
        {selectedValue && (
          <ValuePixModal 
            amount={selectedValue}
            onClose={() => setSelectedValue(null)} 
          />
        )}
      </div>

      {/* Navigation area - Footer */}
      <div className="absolute bottom-6 left-0 right-0 px-8 md:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Previous button - hidden on first slide of first gift */}
          <div className="w-12">
            {showPrevButton && (
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
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
                onClick={(e) => {
                  e.stopPropagation();
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
                onClick={(e) => { e.stopPropagation(); goNext(); }}
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
