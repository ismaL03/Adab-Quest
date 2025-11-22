import React from 'react';
import ReactMarkdown from 'react-markdown';
import { GroundingChunk } from '../types';

interface ResultsSectionProps {
  isLoading: boolean;
  resultText: string | null;
  sources: GroundingChunk[];
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({ isLoading, resultText, sources }) => {
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-3">
            <div className="h-40 bg-gray-200 rounded-xl"></div>
            <div className="h-40 bg-gray-200 rounded-xl"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <p className="text-center text-gray-500 mt-8 animate-bounce">
          Interrogation des compagnies aériennes et hôtels en temps réel...
        </p>
      </div>
    );
  }

  if (!resultText) return null;

  return (
    <div className="max-w-7xl mx-auto py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content - AI Summary */}
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex items-center mb-6">
          <span className="bg-pink-100 text-pink-800 text-xs font-semibold px-2.5 py-0.5 rounded mr-2">IA</span>
          <h2 className="text-2xl font-bold text-gray-900">Résultats de votre recherche</h2>
        </div>
        
        <div className="prose prose-pink max-w-none prose-headings:text-gray-800 prose-p:text-gray-600 prose-li:text-gray-600">
          <ReactMarkdown>{resultText}</ReactMarkdown>
        </div>
      </div>

      {/* Sidebar - Sources & Booking Links */}
      <div className="lg:col-span-1 space-y-6">
        {/* Booking Sources Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Réserver directement
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Prix trouvés sur ces sites officiels. Cliquez pour vérifier la disponibilité.
          </p>
          
          {sources && sources.length > 0 ? (
            <div className="space-y-3">
              {sources.map((source, idx) => {
                // Filter out empty or generic sources if needed
                if (!source.web?.uri) return null;
                
                return (
                  <a 
                    key={idx}
                    href={source.web.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 rounded-xl border border-gray-200 hover:border-pink-500 hover:shadow-md transition-all group bg-gray-50 hover:bg-white"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-800 truncate pr-2">
                         {source.web.title || new URL(source.web.uri).hostname}
                      </span>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </div>
                    <div className="text-xs text-gray-400 mt-1 truncate">
                      {source.web.uri}
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl">
              Sources directes non disponibles. Veuillez consulter le résumé pour les détails.
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100">
             <div className="bg-blue-50 p-4 rounded-xl">
                <h4 className="text-blue-800 font-bold text-sm mb-1">Garantie du meilleur prix</h4>
                <p className="text-blue-600 text-xs">
                  Nous comparons des centaines de sites pour vous garantir le tarif le plus bas.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};