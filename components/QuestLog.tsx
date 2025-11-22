
import React, { useState } from 'react';
import { Quest, QuestCategory, PredefinedQuest } from '../types';

interface QuestLogProps {
  quests: Quest[];
  onComplete: (id: string) => void;
  onAddQuest: (quest: Quest) => void;
}

// Bibliothèque de Quêtes Sunnah & Adab avec preuves
const QUEST_LIBRARY: PredefinedQuest[] = [
  // Cœur (Spiritualité, Ibada)
  { title: "Prière du Fajr à l'heure", description: "Accomplir la prière avant le lever du soleil.", category: 'heart', xp: 100, reference: "Les deux rak'at de l'aube valent mieux que le monde et ce qu'il contient. (Muslim)" },
  { title: "Lire Sourate Al-Mulk", description: "Protection contre le châtiment de la tombe.", category: 'heart', xp: 50, reference: "Il y a une sourate de 30 versets qui intercède pour l'homme jusqu'à ce qu'il soit pardonné. (Tirmidhi)" },
  { title: "Dhikr du Matin", description: "Prendre 5 minutes pour les invocations matinales.", category: 'heart', xp: 30, reference: "Invoquez-Moi, Je vous invoquerai. (Coran 2:152)" },
  
  // Corps (Santé, Action physique)
  { title: "Jeûne du Lundi/Jeudi", description: "Suivre la Sunnah du jeûne optionnel.", category: 'body', xp: 200, reference: "Les œuvres sont présentées le lundi et le jeudi, j'aime que mon œuvre soit présentée alors que je jeûne. (Tirmidhi)" },
  { title: "Manger avec modération", description: "1/3 nourriture, 1/3 eau, 1/3 air.", category: 'body', xp: 40, reference: "Le fils d'Adam n'a jamais rempli un récipient pire que son ventre. (Tirmidhi)" },
  { title: "Visiter un malade", description: "Droit du musulman sur son frère.", category: 'body', xp: 100, reference: "Celui qui visite un malade ne cesse d'être dans un jardin du Paradis jusqu'à ce qu'il revienne. (Muslim)" },

  // Esprit (Savoir, Comportement)
  { title: "Contrôle de la colère", description: "Se taire quand la colère monte.", category: 'mind', xp: 80, reference: "L'homme fort n'est pas celui qui terrasse ses adversaires, mais celui qui se maîtrise lors de la colère. (Bukhari)" },
  { title: "Sourire à un frère", description: "Le sourire est une aumône.", category: 'mind', xp: 15, reference: "Ton sourire face à ton frère est une aumône. (Tirmidhi)" },
  { title: "Pardonner avant de dormir", description: "Nettoyer son cœur de toute rancune.", category: 'mind', xp: 90, reference: "Qu'ils pardonnent et qu'ils tournent la page. N'aimez-vous pas qu'Allah vous pardonne ? (Coran 24:22)" },
];

export const QuestLog: React.FC<QuestLogProps> = ({ quests, onComplete, onAddQuest }) => {
  const [activeTab, setActiveTab] = useState<QuestCategory>('heart');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'library' | 'custom'>('library');
  
  // Form state for custom
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<QuestCategory>('heart');

  const filteredQuests = quests.filter(q => q.category === activeTab);

  const handleCreateCustomQuest = (e: React.FormEvent) => {
    e.preventDefault();
    const newQuest: Quest = {
      id: Date.now().toString(),
      title: newTitle,
      description: newDesc,
      category: newCategory,
      xp: 50,
      completed: false,
      type: 'declarative',
      isCustom: true,
      reference: "Intention personnelle (Niyyah)"
    };
    onAddQuest(newQuest);
    resetForm();
  };

  const handleAddLibraryQuest = (template: PredefinedQuest) => {
    const newQuest: Quest = {
      id: Date.now().toString(),
      title: template.title,
      description: template.description,
      category: template.category,
      xp: template.xp,
      completed: false,
      type: 'declarative',
      isCustom: false,
      reference: template.reference
    };
    onAddQuest(newQuest);
    setIsModalOpen(false);
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDesc('');
    setIsModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 bg-arabesque relative">
      <div className="px-6 pt-6 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-3xl text-amber-100 mb-1" style={{ fontFamily: 'Reem Kufi' }}>Le Chemin</h2>
          <p className="text-amber-500/60 text-sm font-serif italic">Forge ton destin, pas à pas.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-amber-600 to-amber-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform border border-amber-300"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex justify-center border-b border-amber-900/30 px-4 gap-2">
        {(['heart', 'body', 'mind'] as QuestCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`flex-1 pb-3 text-sm font-medium transition-all relative arch-top ${
              activeTab === cat 
                ? 'text-slate-900 bg-gradient-to-t from-amber-500 to-amber-400 font-bold' 
                : 'text-slate-500 hover:text-amber-400'
            }`}
          >
            <span className="flex items-center justify-center gap-2 pt-2">
               {cat === 'heart' && 'Cœur'}
               {cat === 'body' && 'Corps'}
               {cat === 'mind' && 'Esprit'}
            </span>
          </button>
        ))}
      </div>

      {/* Quest List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        {filteredQuests.map((quest) => (
          <div 
            key={quest.id}
            className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${
              quest.completed 
                ? 'bg-slate-900/40 border-slate-800 opacity-50 grayscale' 
                : 'bg-slate-900 border-amber-900/40 hover:border-amber-500/50 shadow-md'
            }`}
          >
            {quest.isCustom && (
               <div className="absolute top-0 right-0 bg-amber-900/50 text-[10px] px-2 py-0.5 text-amber-200 rounded-bl-lg">
                 Personnelle
               </div>
            )}
            <div className="p-4 flex items-start gap-4">
              <button
                onClick={() => !quest.completed && onComplete(quest.id)}
                disabled={quest.completed}
                className={`mt-1 min-w-[24px] h-6 rounded-full border flex items-center justify-center transition-all ${
                  quest.completed
                    ? 'bg-amber-500 border-amber-500 text-slate-900'
                    : 'border-amber-700 hover:border-amber-400 text-transparent'
                }`}
              >
                {quest.completed && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </button>

              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className={`font-serif text-lg ${quest.completed ? 'text-slate-500 line-through' : 'text-amber-50'}`}>
                    {quest.title}
                  </h3>
                  {!quest.completed && (
                     <span className="text-xs font-bold text-cyan-400 ml-2">
                    +{quest.xp}
                  </span>
                  )}
                </div>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed font-light">
                  {quest.description}
                </p>
                {quest.reference && (
                  <div className="mt-2 pt-2 border-t border-dashed border-slate-800">
                    <p className="text-[10px] text-amber-600/80 italic font-serif">
                      "{quest.reference}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredQuests.length === 0 && (
          <div className="text-center py-12 flex flex-col items-center opacity-50">
            <div className="w-16 h-16 border-2 border-dashed border-slate-700 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🌙</span>
            </div>
            <p className="text-slate-500 font-serif">Le calme règne ici.</p>
          </div>
        )}
      </div>

      {/* Modal Création de Quête */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/30 w-full max-w-lg rounded-2xl p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col max-h-[85vh]">
            
            {/* Header Modal */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
               <h3 className="text-xl font-serif text-amber-400">Nouvelle Quête</h3>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            {/* Toggle Tabs */}
            <div className="flex p-2 bg-slate-950 border-b border-slate-800">
               <button 
                 onClick={() => setModalTab('library')}
                 className={`flex-1 py-2 text-sm rounded-lg transition-colors ${modalTab === 'library' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
               >
                 📚 Bibliothèque
               </button>
               <button 
                 onClick={() => setModalTab('custom')}
                 className={`flex-1 py-2 text-sm rounded-lg transition-colors ${modalTab === 'custom' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
               >
                 ✨ Personnalisée
               </button>
            </div>

            <div className="overflow-y-auto p-6">
              {modalTab === 'library' ? (
                <div className="space-y-4">
                   <p className="text-sm text-slate-400 mb-4">Choisis une sunnah ou une bonne action à intégrer à ta journée.</p>
                   {QUEST_LIBRARY.map((template, idx) => (
                     <div key={idx} className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 rounded-xl p-4 transition-all cursor-pointer flex justify-between items-center" onClick={() => handleAddLibraryQuest(template)}>
                        <div className="flex-1 pr-4">
                           <div className="flex items-center gap-2">
                              <h4 className="text-slate-200 font-medium">{template.title}</h4>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider border ${
                                template.category === 'heart' ? 'border-pink-900 text-pink-400' :
                                template.category === 'body' ? 'border-emerald-900 text-emerald-400' :
                                'border-blue-900 text-blue-400'
                              }`}>
                                {template.category === 'heart' ? 'Cœur' : template.category === 'body' ? 'Corps' : 'Esprit'}
                              </span>
                           </div>
                           <p className="text-xs text-slate-500 mt-1">{template.description}</p>
                           {template.reference && <p className="text-[10px] text-amber-700 mt-1 italic truncate">"{template.reference}"</p>}
                        </div>
                        <div className="flex flex-col items-center text-amber-500">
                           <span className="text-lg font-bold">+{template.xp}</span>
                           <span className="text-[10px] uppercase">Noor</span>
                        </div>
                     </div>
                   ))}
                </div>
              ) : (
                <form onSubmit={handleCreateCustomQuest} className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 ml-1">Titre de la quête</label>
                    <input 
                      type="text" 
                      required
                      maxLength={40}
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Ex: Jeûner demain..." 
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 ml-1">Description</label>
                    <textarea 
                      required
                      rows={2}
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Détails du défi..." 
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1 ml-1">Catégorie</label>
                    <div className="flex gap-2">
                      {(['heart', 'body', 'mind'] as QuestCategory[]).map(cat => (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => setNewCategory(cat)}
                          className={`flex-1 py-2 rounded-lg text-xs uppercase tracking-wider border ${
                            newCategory === cat 
                              ? 'bg-amber-900/30 border-amber-500 text-amber-400' 
                              : 'bg-slate-950 border-slate-800 text-slate-500'
                          }`}
                        >
                          {cat === 'heart' ? 'Cœur' : cat === 'body' ? 'Corps' : 'Esprit'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-3 mt-4 rounded-xl bg-amber-600 text-white font-bold shadow-lg hover:bg-amber-500"
                  >
                    Créer ma Quête
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
