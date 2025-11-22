
import React, { useState } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { QuestLog } from './components/QuestLog';
import { MurabbiChat } from './components/MurabbiChat';
import { GuildSection } from './components/GuildSection';
import { QuranReader } from './components/QuranReader';
import { UserState, Quest, ChatMessage } from './types';

// Mock Data Initiation
const initialUser: UserState = {
  noor: 1250,
  level: 3,
  streak: 14,
  name: "Karim",
  title: "Chercheur de Lumière",
  quranProgress: 5
};

const initialQuests: Quest[] = [
  { id: '1', title: 'Aube Dorée', description: 'Accomplir la prière du Fajr à l\'heure.', category: 'heart', xp: 100, completed: false, type: 'checkin', reference: "Les deux rak'at du Fajr valent mieux que ce monde et ce qu'il contient. (Muslim)" },
  { id: '2', title: 'Maîtrise de soi', description: 'Ne dire aucun mot négatif pendant 4h.', category: 'mind', xp: 50, completed: true, type: 'declarative', reference: "Que celui qui croit en Allah et au Jour Dernier dise du bien ou garde le silence. (Bukhari)" },
];

const initialChat: ChatMessage[] = [
  { id: 'init', sender: 'murabbi', text: 'As-salamu alaykum Karim. Ta lumière brille aujourd\'hui. Sur quoi souhaites-tu travailler ?', timestamp: new Date() }
];

const App: React.FC = () => {
  const [view, setView] = useState('dashboard');
  const [user, setUser] = useState<UserState>(initialUser);
  const [quests, setQuests] = useState<Quest[]>(initialQuests);
  const [messages, setMessages] = useState<ChatMessage[]>(initialChat);
  const [isQuranOpen, setIsQuranOpen] = useState(false);
  const [hasJoinedRaid, setHasJoinedRaid] = useState(false);

  const handleQuestComplete = (id: string) => {
    setQuests(prev => prev.map(q => {
      if (q.id === id) {
        setUser(u => ({ ...u, noor: u.noor + q.xp }));
        return { ...q, completed: true };
      }
      return q;
    }));
  };

  const handleAddXp = (amount: number) => {
    setUser(u => ({ ...u, noor: u.noor + amount }));
  };

  const handleAddQuest = (newQuest: Quest) => {
    setQuests(prev => [newQuest, ...prev]);
  };

  const handleSendMessage = (msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  };

  const handleJoinRaid = () => {
    if (!hasJoinedRaid) {
      setHasJoinedRaid(true);
      // Animation logic is handled inside GuildSection, just simple state here
      handleAddXp(50); // Bonus for joining
    }
  };

  const renderView = () => {
    switch(view) {
      case 'dashboard':
        return <Dashboard user={user} />;
      case 'quests':
        return <QuestLog quests={quests} onComplete={handleQuestComplete} onAddQuest={handleAddQuest} />;
      case 'chat':
        return <MurabbiChat messages={messages} onSendMessage={handleSendMessage} />;
      case 'guild':
        return <GuildSection onJoinRaid={handleJoinRaid} hasJoined={hasJoinedRaid} />;
      default:
        return <Dashboard user={user} />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden font-sans text-slate-100">
      <Header />
      
      <main className="flex-grow overflow-hidden relative">
        {renderView()}
        
        {/* Floating Action Button for Quran */}
        {!isQuranOpen && (
          <button 
            onClick={() => setIsQuranOpen(true)}
            className="absolute bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-emerald-700 to-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center justify-center z-40 border border-emerald-300/30 hover:scale-110 transition-transform"
          >
            <span className="text-2xl">📖</span>
          </button>
        )}
      </main>
      
      <Navigation currentView={view} onChangeView={setView} />

      {/* Full Screen Overlays */}
      {isQuranOpen && <QuranReader onClose={() => setIsQuranOpen(false)} onAddXp={handleAddXp} />}
    </div>
  );
};

export default App;
