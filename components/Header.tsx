import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-amber-900/30 sticky top-0 z-50 h-16 flex items-center justify-center shadow-lg shadow-black/50">
      <div className="flex items-center gap-3">
        {/* Etoile à 8 branches (Rub el Hizb) simplifiée */}
        <div className="relative w-8 h-8 flex items-center justify-center">
           <div className="absolute inset-0 bg-amber-600 rotate-45 opacity-80 rounded-sm"></div>
           <div className="absolute inset-0 bg-amber-600 rounded-sm opacity-80"></div>
           <span className="relative text-slate-900 font-bold text-lg z-10">AQ</span>
        </div>
        
        <div className="flex flex-col items-center">
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 tracking-widest uppercase" style={{ fontFamily: 'Reem Kufi' }}>
            ADAB QUEST
            </h1>
            <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
        </div>
      </div>
    </header>
  );
};