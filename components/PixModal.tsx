
import React from 'react';
import { GiftOption } from '../types';
import { PIX_KEY } from '../constants';

interface PixModalProps {
  gift: GiftOption | null;
  onClose: () => void;
}

const PixModal: React.FC<PixModalProps> = ({ gift, onClose }) => {
  if (!gift) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl transform transition-all">
        <div className="p-6 text-center">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <h3 className="text-2xl font-serif text-[#8b5e3c] mb-2">Contribuir com {gift.title}</h3>
          <p className="text-gray-600 mb-6 italic">Muito obrigado por fazer parte do nosso sonho!</p>
          
          <div className="bg-gray-50 p-6 rounded-xl border-2 border-dashed border-[#e6d5c3] mb-6 flex flex-col items-center">
            <div className="w-48 h-48 bg-white p-2 rounded-lg shadow-inner mb-4">
              {/* Using a placeholder QR code generator */}
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126360014br.gov.bcb.pix0114${encodeURIComponent(PIX_KEY)}520400005303986540${gift.amount}.005802BR5915HoneymoonCouple6008Florence62070503***6304`}
                alt="QR Code PIX"
                className="w-full h-full"
              />
            </div>
            <div className="text-sm text-gray-500 uppercase tracking-widest font-bold">Valor: R$ {gift.amount},00</div>
          </div>

          <div className="space-y-4">
            <div className="bg-[#fdfbf7] border border-[#e6d5c3] p-3 rounded-lg flex flex-col items-center">
              <span className="text-[10px] text-gray-400 uppercase font-bold mb-1">Chave PIX</span>
              <code className="text-[#8b5e3c] font-bold">{PIX_KEY}</code>
            </div>
            
            <button 
              onClick={() => {
                navigator.clipboard.writeText(PIX_KEY);
                alert("Chave PIX copiada!");
              }}
              className="w-full py-3 bg-[#8b5e3c] text-white rounded-lg font-bold hover:bg-[#6f4b30] transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copiar Chave
            </button>
            
            <p className="text-xs text-gray-400 mt-4 italic">
              Este é um QR Code de simulação para o seu presente de casamento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PixModal;
