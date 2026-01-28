import React from 'react';
import { Accommodation } from '../types';
import { getMarkerColor, getClusterLabel } from './map/map-shared';

interface AccommodationCardProps {
  accommodation: Accommodation;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

const AccommodationCard: React.FC<AccommodationCardProps> = ({ 
  accommodation, 
  isSelected = false,
  onSelect 
}) => {
  const clusterColor = getMarkerColor(accommodation.cluster);
  
  return (
    <div 
      onClick={() => onSelect?.(accommodation.id)}
      className={`
        group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl 
        transition-all duration-500 border flex flex-col h-full 
        transform hover:-translate-y-2 cursor-pointer
        ${isSelected ? 'ring-2 ring-[#8b5e3c] border-[#8b5e3c]' : 'border-[#f0e6da]'}
        ${accommodation.isVenue ? 'ring-2 ring-[#d4a574]' : ''}
      `}
    >
      <div className="relative h-56 overflow-hidden">
        <img 
          src={accommodation.imageUrl} 
          alt={accommodation.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Cluster Badge */}
        {getClusterLabel(accommodation.cluster) && (
          <div 
            className="absolute top-4 left-4 px-3 py-1 rounded-full text-white text-xs font-medium shadow-sm"
            style={{ backgroundColor: clusterColor }}
          >
            {getClusterLabel(accommodation.cluster)}
          </div>
        )}
        
        {/* Distance Badge */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
          <span className="text-[#8b5e3c] font-bold text-sm">{accommodation.distanceToVenue}</span>
        </div>
      </div>
      
      <div className="p-6 flex-grow flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-xl font-serif text-[#3d2b1f] group-hover:text-[#8b5e3c] transition-colors">
              {accommodation.name}
            </h3>
            {accommodation.rating && (
              <div className="flex items-center gap-1 bg-[#fdfbf7] px-2 py-1 rounded-lg shrink-0">
                <span className="text-yellow-500">★</span>
                <span className="text-sm font-bold text-[#3d2b1f]">{accommodation.rating}</span>
              </div>
            )}
          </div>
          {accommodation.ratingLabel && (
            <span className="text-xs text-gray-500">{accommodation.ratingLabel}</span>
          )}
        </div>
        
        {/* Info */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4 text-[#8b5e3c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{accommodation.address}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            {accommodation.needsCar ? (
              <>
                <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 5h8m-4 4v4m-4-8a4 4 0 01-4-4V5a2 2 0 012-2h8a2 2 0 012 2v3a4 4 0 01-4 4m-4 0h8" />
                </svg>
                <span className="text-orange-600">Necessita Uber/Carro</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="text-green-600">Vá a pé!</span>
              </>
            )}
          </div>
        </div>
        
        {/* Ideal For */}
        <div className="mb-4">
          <span className="text-xs uppercase tracking-wider text-gray-400">Ideal para</span>
          <p className="text-sm font-medium text-[#3d2b1f]">{accommodation.idealFor}</p>
        </div>
        
        {/* Description */}
        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
          {accommodation.description}
        </p>
        
        {/* Amenities */}
        <div className="flex flex-wrap gap-2 mb-6">
          {accommodation.amenities.slice(0, 4).map((amenity, idx) => (
            <span 
              key={idx} 
              className="text-xs bg-[#fdfbf7] text-[#8b5e3c] px-2 py-1 rounded-lg border border-[#f0e6da]"
            >
              {amenity}
            </span>
          ))}
          {accommodation.amenities.length > 4 && (
            <span className="text-xs text-gray-400">
              +{accommodation.amenities.length - 4}
            </span>
          )}
        </div>
        
        {/* Price Range */}
        {accommodation.priceRange && (
          <div className="mb-4">
            <span className="text-lg font-bold text-[#8b5e3c]">{accommodation.priceRange}</span>
            <span className="text-xs text-gray-400 ml-1">faixa de preço</span>
          </div>
        )}
        
        {/* Spacer */}
        <div className="flex-grow"></div>
        
        {/* Actions */}
        <div className="flex gap-3">
          {accommodation.bookingUrl ? (
            <a 
              href={accommodation.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 py-3 bg-[#8b5e3c] text-white font-bold rounded-xl hover:bg-[#6d4a2f] transition-all duration-300 text-center text-sm"
            >
              Ver no Booking
            </a>
          ) : (
            <div className="flex-1 py-3 bg-gray-100 text-gray-400 font-bold rounded-xl text-center text-sm cursor-not-allowed">
              Reserva Direta
            </div>
          )}
          <a 
            href={`https://www.google.com/maps/search/?api=1&query=${accommodation.lat},${accommodation.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="px-4 py-3 border-2 border-[#8b5e3c] text-[#8b5e3c] font-bold rounded-xl hover:bg-[#8b5e3c] hover:text-white transition-all duration-300 text-sm"
          >
            Maps
          </a>
        </div>
      </div>
    </div>
  );
};

export default AccommodationCard;
