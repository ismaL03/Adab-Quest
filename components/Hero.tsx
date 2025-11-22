import React from 'react';
import { SearchForm } from './SearchForm';
import { SearchParams } from '../types';

interface HeroProps {
  onSearch: (params: SearchParams) => void;
  isLoading: boolean;
}

export const Hero: React.FC<HeroProps> = ({ onSearch, isLoading }) => {
  return (
    <div className="relative">
      <div className="relative h-[500px] w-full overflow-hidden">
        {/* Background Image */}
        <img 
          src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" 
          alt="Wing of airplane flying above clouds" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/60 to-purple-900/40"></div>
        
        {/* Text Content */}
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4 mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-4 drop-shadow-lg">
            Votre prochain voyage commence ici
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl font-light mb-8 drop-shadow-md">
            Comparez des centaines de sites de voyage en une seule recherche grâce à l'IA.
          </p>
        </div>
      </div>

      {/* Search Form (Overlapping) */}
      <SearchForm onSearch={onSearch} isLoading={isLoading} />
    </div>
  );
};