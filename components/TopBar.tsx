import React from 'react';

const TopBar: React.FC = () => (
  <aside className="bg-[#3d2b1f] px-4 py-3 text-center text-xs tracking-[0.08em] text-white/65">
    Quer um site de casamento personalizado como esse, sem taxa sobre presentes e dentro do orçamento?{' '}
    <a
      href="https://wa.me/5548996792216"
      target="_blank"
      rel="noopener noreferrer"
      className="uppercase text-[#e6d5c3] underline decoration-[#e6d5c3]/35 underline-offset-4 transition hover:text-white"
    >
      Entre em contato!
    </a>
  </aside>
);

export default TopBar;
