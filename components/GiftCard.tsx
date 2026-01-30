
import React from 'react';
import { GiftOption } from '../types';

interface GiftCardProps {
  gift: GiftOption;
  onSelect: (gift: GiftOption) => void;
  onSelectGallery: (gift: GiftOption) => void;
}

const GiftCard: React.FC<GiftCardProps> = ({ gift, onSelect, onSelectGallery }) => {
  return (
    <div 
      onClick={() => onSelectGallery(gift)}
      className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-[#f0e6da] flex flex-col h-full transform hover:-translate-y-2 cursor-pointer"
    >
      <div className="relative h-64 overflow-hidden">
        <img 
          src={gift.imageUrl} 
          alt={gift.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
      
      <div className="p-8 flex-grow flex flex-col justify-between">
        <div>
          <h3 className="text-2xl font-serif text-[#3d2b1f] mb-3 group-hover:text-[#8b5e3c] transition-colors">{gift.title}</h3>
          <p className="text-gray-600 leading-relaxed text-sm mb-6">{gift.description}</p>
        </div>
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onSelectGallery(gift);
          }}
          className="w-full py-4 bg-[#fdfbf7] border-2 border-[#8b5e3c] text-[#8b5e3c] font-bold rounded-xl hover:bg-[#8b5e3c] hover:text-white transition-all duration-300 active:scale-95"
        >
          Contribuir para esse momento
        </button>
      </div>
    </div>
  );
};

export default GiftCard;
