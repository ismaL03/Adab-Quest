import React from 'react';
import { UserState } from '../types';

interface DashboardProps {
  user: UserState;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const nextLevelXp = user.level * 1000;
  const progress = (user.noor % 1000) / 1000 * 100;

  return (
    <div className="flex flex-col items-center justify-start h-full py-6 px-4 animate-fade-in bg-arabesque overflow-y-auto">
      
      {/* Bannière Titre */}
      <div className="text-center mb-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-24 bg-amber-500/10 blur-3xl rounded-full"></div>
        <h2 className="text-amber-500 text-xs font-bold tracking-[0.2em] uppercase mb-2">Niveau {user.level}</h2>
        <h1 className="text-4xl text-amber-100 font-bold glow-text" style={{ fontFamily: 'Reem Kufi' }}>{user.title}</h1>
      </div>

      {/* Avatar Oriental */}
      <div className="relative w-72 h-72 mb-10 flex items-center justify-center">
        {/* Arches rotatives */}
        <div className="absolute inset-0 border border-amber-500/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
        <div className="absolute inset-4 border border-cyan-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
        
        {/* The Core Soul Avatar */}
        <div className="relative w-52 h-52 bg-gradient-to-b from-slate-800 to-slate-900 rounded-full border-2 border-amber-500/50 flex items-center justify-center shadow-[0_0_50px_rgba(217,119,6,0.2)] overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
           
           {/* Silhouette mystique */}
           <svg className="w-32 h-32 text-amber-100 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]" viewBox="0 0 24 24" fill="currentColor">
             <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2M12 22C16.97 22 21 17.97 21 13C21 10.88 20.27 8.93 19.05 7.39C18.77 8.3 18.13 9.09 17.28 9.61C16.26 10.24 15.19 10.5 14.39 9.94C13.63 9.4 13.33 8.5 13.14 7.91C13 7.44 12.9 7 12 7C11.1 7 11 7.44 10.86 7.91C10.67 8.5 10.37 9.4 9.61 9.94C8.81 10.5 7.74 10.24 6.72 9.61C5.87 9.09 5.23 8.3 4.95 7.39C3.73 8.93 3 10.88 3 13C3 17.97 7.03 22 12 22Z" />
           </svg>
        </div>
        
        {/* Orbes flottants */}
        <div className="absolute top-0 w-3 h-3 bg-amber-400 rounded-full blur-[1px] animate-bounce shadow-[0_0_10px_rgba(251,191,36,0.8)]"></div>
      </div>

      {/* Stats Cards - Style Tablette d'Argile/Or */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-6">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-700/30 rounded-xl p-4 flex flex-col items-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>
          <span className="text-amber-500/80 text-xs uppercase tracking-wider mb-1 font-serif">Lumière (Noor)</span>
          <span className="text-3xl font-bold text-white font-serif">{user.noor}</span>
        </div>
        
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-700/30 rounded-xl p-4 flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
          <span className="text-cyan-500/80 text-xs uppercase tracking-wider mb-1 font-serif">Constance (Silsila)</span>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-white font-serif">{user.streak}</span>
            <span className="text-sm text-cyan-400">Jours</span>
          </div>
        </div>
      </div>

      {/* Progress Bar Ornée */}
      <div className="w-full max-w-md">
        <div className="flex justify-between text-xs text-amber-200/60 mb-2 font-serif">
          <span>Prochaine Ascension</span>
          <span>{user.noor} / {nextLevelXp}</span>
        </div>
        <div className="h-3 bg-slate-900 border border-amber-900/50 rounded-full overflow-hidden relative p-[1px]">
          <div 
            className="h-full bg-gradient-to-r from-amber-700 via-amber-500 to-yellow-400 rounded-full transition-all duration-1000 relative"
            style={{ width: `${progress}%` }}
          >
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-20"></div>
          </div>
        </div>
      </div>
      
      {/* Citation du jour */}
      <div className="mt-10 max-w-md text-center relative p-6">
         <span className="absolute top-0 left-0 text-4xl text-amber-800 font-serif">“</span>
         <p className="text-slate-300 italic font-serif text-lg">
           Celui qui n'a pas de compassion envers les autres ne recevra pas de compassion.
         </p>
         <span className="absolute bottom-0 right-0 text-4xl text-amber-800 font-serif">”</span>
         <p className="text-amber-600 text-xs mt-2 uppercase tracking-widest">- Hadith</p>
      </div>
    </div>
  );
};