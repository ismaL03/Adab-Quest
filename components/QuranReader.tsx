
import React, { useState, useEffect, useRef } from 'react';
import { Surah, Ayah, QuranSettings } from '../types';

interface QuranReaderProps {
  onClose: () => void;
  onAddXp: (amount: number) => void;
}

// Data for Settings
const RECITERS = [
  { id: 'ar.alafasy', name: 'Mishary Alafasy', style: 'Hafs' },
  { id: 'ar.husary', name: 'Mahmoud Al Husary', style: 'Hafs' },
  { id: 'ar.abdulbasitmurattal', name: 'Abdul Basit', style: 'Hafs' },
  { id: 'ar.yassinaljazairi', name: 'Yassin Al Jazairi', style: 'Warsh' }, 
];

const TRANSLATIONS = [
  { id: 'fr.hamidullah', name: 'Français (Hamidullah)', type: 'translation' },
  { id: 'en.sahih', name: 'English (Sahih Int.)', type: 'translation' },
  { id: 'ar.muyassar', name: 'Tafsir Al-Muyassar', type: 'tafsir' } 
];

// --- ADVANCED UTILS ---

// Normalize Arabic: Remove all diacritics, tatweel, and normalize alifs
const normalizeArabic = (text: string) => {
  return text
    .replace(/[\u064B-\u065F\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g, '') // Remove vowels/diacritics
    .replace(/ٱ/g, 'ا') // Normalize Aleph Wasla
    .replace(/[أإآ]/g, 'ا') // Normalize Aleph Hamza
    .replace(/ة/g, 'ه') // Normalize Ta Marbuta to Ha (often silent at end)
    .replace(/ى/g, 'ي') // Normalize Alif Maqsura
    .replace(/[^\u0600-\u06FF\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')
    .trim();
};

// Levenshtein Distance for Fuzzy Matching (To tolerate slight accent differences)
const getLevenshteinDistance = (a: string, b: string) => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const getSimilarity = (s1: string, s2: string) => {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.length === 0) return 1.0;
  return (longer.length - getLevenshteinDistance(longer, shorter)) / longer.length;
};

export const QuranReader: React.FC<QuranReaderProps> = ({ onClose, onAddXp }) => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [currentSurah, setCurrentSurah] = useState<Surah | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'list' | 'read' | 'quiz'>('list');
  
  // Settings State
  const [settings, setSettings] = useState<QuranSettings>({
    reciterId: 'ar.alafasy',
    translationId: 'fr.hamidullah',
    autoPlay: true
  });
  const [showSettings, setShowSettings] = useState(false);

  // Audio Player State
  const [currentAudioIndex, setCurrentAudioIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeAyahRef = useRef<HTMLDivElement | null>(null);

  // Quiz State
  const [quizAyah, setQuizAyah] = useState<Ayah | null>(null);
  const [isQuizRevealed, setIsQuizRevealed] = useState(false);
  const [nextQuizAyahs, setNextQuizAyahs] = useState<Ayah[]>([]);

  // --- PRO TARTEEL AI STATE ---
  const [isListening, setIsListening] = useState(false);
  const [recitingAyahIndex, setRecitingAyahIndex] = useState<number | null>(null);
  const [correctWordIndices, setCorrectWordIndices] = useState<number[]>([]);
  const [errorWordIndex, setErrorWordIndex] = useState<number | null>(null);
  const [micVolume, setMicVolume] = useState(0);
  
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Fetch Surah List on Mount
  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const res = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await res.json();
        if (data.code === 200) {
          setSurahs(data.data);
        }
      } catch (e) {
        console.error("Error fetching Quran", e);
      }
    };
    fetchSurahs();
  }, []);

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
        if (microphoneStreamRef.current) {
            microphoneStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
    };
  }, []);

  // Fetch Ayahs with Dynamic Settings
  const selectSurah = async (surah: Surah, targetView: 'read' | 'quiz' = 'read') => {
    setIsLoading(true);
    setCurrentSurah(surah);
    setCurrentAudioIndex(null);
    setIsPlaying(false);
    setIsQuizRevealed(false);
    setQuizAyah(null);
    stopListening();
    
    try {
      const res = await fetch(`https://api.alquran.cloud/v1/surah/${surah.number}/editions/quran-uthmani,${settings.translationId},${settings.reciterId}`);
      const data = await res.json();
      
      if (data.code === 200) {
        const arabicData = data.data[0].ayahs;
        const secondaryData = data.data[1].ayahs; 
        const audioData = data.data[2].ayahs;

        const mergedAyahs: Ayah[] = arabicData.map((ayah: any, index: number) => ({
          number: ayah.number,
          text: ayah.text,
          numberInSurah: ayah.numberInSurah,
          juz: ayah.juz,
          page: ayah.page,
          secondaryText: secondaryData[index].text,
          audio: audioData[index].audio
        }));

        setAyahs(mergedAyahs);
        
        if (targetView === 'quiz') {
            startQuiz(mergedAyahs);
        }
        setView(targetView);
      }
    } catch (e) {
       console.error("Error fetching Ayahs", e);
    } finally {
      setIsLoading(false);
    }
  };

  const startQuiz = (loadedAyahs: Ayah[]) => {
      if (loadedAyahs.length < 2) return;
      const randomIndex = Math.floor(Math.random() * (loadedAyahs.length - 2));
      setQuizAyah(loadedAyahs[randomIndex]);
      setNextQuizAyahs([loadedAyahs[randomIndex + 1], loadedAyahs[randomIndex + 2]].filter(Boolean));
      setIsQuizRevealed(false);
  };

  const handleValidateReading = () => {
      onAddXp(100);
      onClose(); 
  };

  // --- AUDIO PLAYER LOGIC ---
  useEffect(() => {
    if (currentAudioIndex !== null && ayahs[currentAudioIndex]?.audio) {
      if (!audioRef.current) {
        audioRef.current = new Audio(ayahs[currentAudioIndex].audio);
      } else {
        audioRef.current.src = ayahs[currentAudioIndex].audio!;
      }
      
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log("Playback error", e));
      }

      audioRef.current.onended = () => {
        if (settings.autoPlay && currentAudioIndex < ayahs.length - 1) {
          setCurrentAudioIndex(prev => prev! + 1);
        } else {
          setIsPlaying(false);
        }
      };
    } else if (audioRef.current) {
      audioRef.current.pause();
    }

    if (currentAudioIndex !== null && activeAyahRef.current) {
      activeAyahRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

  }, [currentAudioIndex, ayahs, settings.reciterId]); 

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.play().catch(e => console.log(e));
      else audioRef.current.pause();
    }
  }, [isPlaying]);

  const togglePlayAyah = (index: number) => {
    stopListening(); // Stop mic if playing audio
    if (currentAudioIndex === index) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentAudioIndex(index);
      setIsPlaying(true);
    }
  };

  // --- PRO TARTEEL LOGIC ---

  const playErrorBeep = () => {
      try {
        const ctx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.3);
        
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch(e) {
          console.error("Audio API error", e);
      }
  };

  const setupAudioAnalysis = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } 
        });
        microphoneStreamRef.current = stream;
        
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const updateVolume = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for(let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            setMicVolume(average);
            animationFrameRef.current = requestAnimationFrame(updateVolume);
        };
        updateVolume();
        
      } catch (e) {
          console.error("Error accessing microphone", e);
          alert("Impossible d'accéder au microphone. Vérifiez vos permissions.");
      }
  };

  const startListening = async (index: number) => {
      // Stop audio if playing
      setIsPlaying(false);
      if (audioRef.current) audioRef.current.pause();

      // Check browser support
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
          alert("Votre navigateur ne supporte pas la reconnaissance vocale. Essayez Chrome.");
          return;
      }

      await setupAudioAnalysis();

      setRecitingAyahIndex(index);
      setCorrectWordIndices([]);
      setErrorWordIndex(null);
      setIsListening(true);

      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-SA';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      const ayahText = ayahs[index].text;
      const ayahWords = ayahText.split(' ');
      const normalizedAyahWords = ayahWords.map(w => normalizeArabic(w));
      
      let currentWordPointer = 0;

      recognition.onresult = (event: any) => {
          // Noise Gate: If volume is too low, ignore this result frame (likely background noise)
          if (micVolume < 10) return;

          const results = Array.from(event.results);
          const transcript = results
            .map((result: any) => result[0].transcript)
            .join(' ');
          
          const normalizedTranscript = normalizeArabic(transcript);
          const spokenWords = normalizedTranscript.split(' ');
          const lastSpokenWord = spokenWords[spokenWords.length - 1];

          if (currentWordPointer < normalizedAyahWords.length) {
             const expectedWord = normalizedAyahWords[currentWordPointer];
             
             // Calculate Similarity (Fuzzy Matching)
             // > 0.75 is Good, > 0.5 is OK, < 0.5 is Wrong
             const similarity = getSimilarity(expectedWord, lastSpokenWord);

             if (similarity > 0.7) {
                 // Success
                 setCorrectWordIndices(prev => {
                     if (!prev.includes(currentWordPointer)) return [...prev, currentWordPointer];
                     return prev;
                 });
                 setErrorWordIndex(null);
                 currentWordPointer++;
             } else if (lastSpokenWord.length >= 3) {
                 // If the user said a word that is clearly distinct and long enough, trigger warning
                 // Only trigger error if the word is totally off and it's a 'final' result or consistent
                 
                 // Check if maybe they skipped a word (check next word)
                 if (currentWordPointer + 1 < normalizedAyahWords.length) {
                     const nextWordSim = getSimilarity(normalizedAyahWords[currentWordPointer + 1], lastSpokenWord);
                     if (nextWordSim > 0.8) {
                         // They skipped a word! Beep!
                         playErrorBeep();
                         setErrorWordIndex(currentWordPointer); // Highlight the skipped word
                         return;
                     }
                 }

                 // Strict error checking
                 if (similarity < 0.4) {
                     setErrorWordIndex(currentWordPointer);
                     // Debounce beep slightly to avoid chaos
                     if (event.results[event.results.length - 1].isFinal) {
                        playErrorBeep();
                     }
                 }
             }
          }
      };

      recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
              setIsListening(false);
          }
      };

      recognition.onend = () => {
          if (isListening && currentWordPointer < normalizedAyahWords.length) {
              // Auto-restart logic if needed, or just stop
              try {
                recognition.start();
              } catch(e) {
                  setIsListening(false);
              }
          } else {
              setIsListening(false);
              if (microphoneStreamRef.current) {
                 microphoneStreamRef.current.getTracks().forEach(t => t.stop());
              }
          }
      };

      recognitionRef.current = recognition;
      recognition.start();
  };

  const stopListening = () => {
      if (recognitionRef.current) {
          recognitionRef.current.stop();
      }
      if (microphoneStreamRef.current) {
          microphoneStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
      }
      setIsListening(false);
      setRecitingAyahIndex(null);
      setErrorWordIndex(null);
  };

  const startRandomQuiz = () => {
      if (surahs.length === 0) return;
      const randomSurah = surahs[Math.floor(Math.random() * surahs.length)];
      selectSurah(randomSurah, 'quiz');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-fade-in">
      {/* Header Navigation */}
      <div className="bg-slate-900 border-b border-amber-900/30 p-4 flex items-center justify-between shadow-lg z-20 relative">
        <div className="flex items-center gap-2">
            <button onClick={view !== 'list' ? () => { setView('list'); setIsPlaying(false); stopListening(); } : onClose} className="text-slate-400 hover:text-white p-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h2 className="text-amber-100 text-lg font-serif font-bold truncate max-w-[150px]">
            {view === 'list' ? 'Le Noble Coran' : view === 'quiz' ? 'Hifz Test' : currentSurah?.englishName}
            </h2>
        </div>
        
        <div className="flex items-center gap-2">
            {view === 'list' && (
                <button 
                    onClick={startRandomQuiz}
                    className="bg-amber-900/30 hover:bg-amber-800 text-amber-500 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border border-amber-700/30"
                >
                    <span>🎲</span>
                    <span>Quiz</span>
                </button>
            )}

            <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-slate-400 hover:text-amber-500 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
        </div>

        {/* Settings Dropdown */}
        {showSettings && (
            <div className="absolute top-16 right-4 w-72 bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl p-4 z-50 animate-slide-up">
                <h3 className="text-amber-500 font-serif mb-3 text-sm uppercase tracking-wider">Préférences</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Récitateur</label>
                        <select 
                            value={settings.reciterId}
                            onChange={(e) => setSettings({...settings, reciterId: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-lg p-2 outline-none focus:border-amber-500"
                        >
                            {RECITERS.map(r => (
                                <option key={r.id} value={r.id}>{r.name} ({r.style})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Traduction / Tafsir</label>
                        <select 
                            value={settings.translationId}
                            onChange={(e) => setSettings({...settings, translationId: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-lg p-2 outline-none focus:border-amber-500"
                        >
                            {TRANSLATIONS.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-slate-800 text-center">
                    <button 
                        onClick={() => {
                            setShowSettings(false);
                            if(currentSurah) selectSurah(currentSurah, view === 'quiz' ? 'quiz' : 'read'); 
                        }} 
                        className="text-xs text-cyan-400 hover:text-white"
                    >
                        Appliquer et Fermer
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-arabesque scroll-smooth">
        
        {/* VIEW: SURAH LIST */}
        {view === 'list' && (
          <div className="p-4 space-y-3 max-w-2xl mx-auto">
             <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 mb-6 border border-amber-500/20 shadow-lg text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>
                <p className="text-amber-500 text-xs uppercase tracking-widest mb-2">Dernière Lecture</p>
                <h3 className="text-3xl text-white font-serif mb-1">Al-Mulk</h3>
                <p className="text-slate-400 text-sm">Verset 12 • Juz 29</p>
             </div>

             {surahs.map((s) => (
               <div 
                 key={s.number}
                 onClick={() => selectSurah(s)}
                 className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-4 rounded-xl hover:border-amber-600/50 hover:bg-slate-800 transition-all cursor-pointer group"
               >
                  <div className="flex items-center gap-4">
                     <div className="relative w-10 h-10 flex items-center justify-center">
                        <div className="absolute inset-0 bg-slate-800 rounded-lg rotate-45 group-hover:bg-amber-900/30 transition-colors border border-slate-700 group-hover:border-amber-500/50"></div>
                        <span className="relative text-sm font-bold text-slate-300 group-hover:text-amber-400 z-10">{s.number}</span>
                     </div>
                     <div>
                       <h3 className="text-slate-200 font-medium group-hover:text-amber-100">{s.englishName}</h3>
                       <p className="text-slate-500 text-xs">{s.englishNameTranslation} • {s.numberOfAyahs} Ayats</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="font-arabic text-xl text-amber-500/80 mb-1">{s.name.replace('سُورَةُ ', '')}</div>
                     <span className="text-[10px] text-slate-600 uppercase tracking-wider">{s.revelationType}</span>
                  </div>
               </div>
             ))}
          </div>
        )}

        {/* VIEW: QUIZ MODE */}
        {view === 'quiz' && !isLoading && quizAyah && (
            <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 py-10">
                <div className="text-center mb-8">
                    <span className="bg-amber-900/40 text-amber-500 border border-amber-500/30 px-3 py-1 rounded-full text-xs uppercase tracking-wider">Hifz Test</span>
                    <h3 className="text-slate-300 mt-4 font-serif text-xl">Complétez la suite...</h3>
                    <p className="text-slate-500 text-sm">{currentSurah?.englishName} • Verset {quizAyah.numberInSurah}</p>
                </div>

                <div className="w-full max-w-2xl bg-slate-900/50 border border-slate-800 p-8 rounded-3xl relative mb-8">
                     <p className="font-arabic text-3xl sm:text-5xl text-center leading-[4rem] sm:leading-[5.5rem] text-slate-200 mb-6" dir="rtl">
                        {quizAyah.text}
                     </p>
                     
                     <div className={`transition-all duration-700 overflow-hidden ${isQuizRevealed ? 'max-h-96 opacity-100 mt-8 pt-8 border-t border-dashed border-slate-700' : 'max-h-0 opacity-0'}`}>
                        {nextQuizAyahs.map(ayah => (
                            <div key={ayah.number} className="mb-4 text-center">
                                <p className="font-arabic text-2xl sm:text-4xl text-amber-100/80 leading-[3.5rem]" dir="rtl">
                                    {ayah.text}
                                    <span className="text-base text-amber-600 mx-2">({ayah.numberInSurah})</span>
                                </p>
                            </div>
                        ))}
                     </div>
                </div>

                <div className="flex gap-4">
                    {!isQuizRevealed ? (
                        <button 
                            onClick={() => setIsQuizRevealed(true)}
                            className="bg-cyan-700 hover:bg-cyan-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-transform active:scale-95"
                        >
                            Révéler la suite
                        </button>
                    ) : (
                        <div className="flex gap-3">
                             <button 
                                onClick={() => startQuiz(ayahs)} 
                                className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                            >
                                Question suivante
                            </button>
                            <button 
                                onClick={startRandomQuiz} 
                                className="bg-amber-700 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-colors"
                            >
                                Nouvelle Sourate
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* VIEW: READER (TARTEEL STYLE) */}
        {view === 'read' && (
          <div className="pb-32">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-[60vh]">
                <div className="w-16 h-16 border-4 border-amber-900/30 border-t-amber-500 rounded-full animate-spin mb-4"></div>
                <p className="text-amber-500/60 animate-pulse">Ouverture du Moushaf...</p>
              </div>
            ) : (
              <div className="px-4 py-8 max-w-3xl mx-auto">
                <div className="text-center mb-12 p-6 bg-slate-900/50 rounded-3xl border border-amber-900/20">
                   <p className="font-arabic text-4xl text-amber-500/90 leading-loose">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
                </div>
                
                <div className="space-y-12">
                  {ayahs.map((ayah, index) => {
                    const isActive = currentAudioIndex === index || recitingAyahIndex === index;
                    const isRecitingThis = recitingAyahIndex === index;
                    
                    return (
                      <div 
                        key={ayah.number} 
                        ref={isActive ? activeAyahRef : null}
                        className={`relative group transition-all duration-500 rounded-2xl p-4 ${isActive ? 'bg-slate-800/60 ring-1 ring-amber-500/30' : ''}`}
                      >
                        {/* Action Bar (Play & Mic) */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2 opacity-20 group-hover:opacity-100 transition-opacity z-10">
                           <button 
                             onClick={() => togglePlayAyah(index)}
                             className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-lg ${isActive && isPlaying ? 'bg-amber-500 text-black' : 'bg-slate-700 text-slate-300 hover:bg-amber-600 hover:text-white'}`}
                           >
                             {isActive && isPlaying ? (
                               <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                             ) : (
                               <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                             )}
                           </button>
                           
                           <button 
                             onClick={() => isRecitingThis ? stopListening() : startListening(index)}
                             className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-lg ${isRecitingThis ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-700 text-slate-300 hover:bg-emerald-600 hover:text-white'}`}
                           >
                              {isRecitingThis ? (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                              )}
                           </button>
                        </div>

                        {/* Arabic Text (Split into words for Tarteel Highlighting) */}
                        <div className="mb-6 text-right relative" dir="rtl">
                          {ayah.text.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '').trim().split(' ').map((word, wIndex) => {
                              const isCorrect = isRecitingThis && correctWordIndices.includes(wIndex);
                              const isError = isRecitingThis && errorWordIndex === wIndex;
                              
                              return (
                                <span 
                                    key={wIndex} 
                                    className={`font-arabic text-3xl sm:text-4xl inline-block mx-1 transition-all duration-300 px-1 rounded ${
                                        isCorrect 
                                        ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)] scale-110' 
                                        : isError 
                                          ? 'text-red-500 bg-red-900/20 shake'
                                          : isActive && !isRecitingThis ? 'text-amber-100' : 'text-slate-200'
                                    }`}
                                >
                                    {word}
                                </span>
                              );
                          })}
                          <span className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 border border-amber-700/50 rounded-full text-lg text-amber-600 mr-3 align-middle bg-slate-900/50 font-sans">
                            {ayah.numberInSurah}
                          </span>
                        </div>
                        
                        {/* Visualizer inside the active card */}
                        {isRecitingThis && (
                            <div className="h-8 w-full flex items-end justify-center gap-1 mb-4 opacity-80">
                                {Array.from({ length: 20 }).map((_, i) => {
                                    // Create a symmetric wave based on volume
                                    const height = Math.min(100, Math.max(10, micVolume * (Math.sin(i * 0.5) + 1.5)));
                                    return (
                                        <div 
                                            key={i} 
                                            className="w-1 bg-emerald-500 rounded-full transition-all duration-75"
                                            style={{ height: `${height}%`, opacity: height > 20 ? 1 : 0.3 }}
                                        ></div>
                                    );
                                })}
                            </div>
                        )}
                        
                        {/* Translation/Tafsir */}
                        <div className="text-left pl-0 sm:pl-8 border-l-2 border-slate-800 group-hover:border-amber-500/30 transition-colors">
                          <p className={`text-base sm:text-lg leading-relaxed ${isActive ? 'text-amber-200/90' : 'text-slate-400'}`} dir={settings.translationId.startsWith('ar') ? 'rtl' : 'ltr'}>
                            {ayah.secondaryText}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Validation */}
                <div className="mt-16 flex justify-center pb-10">
                  <button 
                    onClick={handleValidateReading}
                    className="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-8 py-4 rounded-full font-bold shadow-lg hover:shadow-amber-600/20 hover:scale-105 transition-all flex items-center gap-2 active:scale-95"
                  >
                    <span>Valider la lecture</span>
                    <span className="bg-black/20 px-2 py-0.5 rounded text-sm text-amber-200">+100 XP</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky Audio Player (Bottom) - Only show if audio playing, not mic */}
      {currentAudioIndex !== null && view === 'read' && !isListening && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-slate-900/90 backdrop-blur-xl border border-amber-500/30 p-3 rounded-2xl shadow-[0_5px_30px_rgba(0,0,0,0.5)] flex items-center gap-4 z-50 animate-slide-up">
           <div className="w-12 h-12 bg-amber-600/20 rounded-xl flex items-center justify-center border border-amber-500/30">
             <div className="flex gap-0.5 items-end h-4">
                <div className={`w-1 bg-amber-500 rounded-t-sm ${isPlaying ? 'animate-[bounce_1s_infinite]' : 'h-2'}`}></div>
                <div className={`w-1 bg-amber-500 rounded-t-sm ${isPlaying ? 'animate-[bounce_1.2s_infinite]' : 'h-3'}`}></div>
                <div className={`w-1 bg-amber-500 rounded-t-sm ${isPlaying ? 'animate-[bounce_0.8s_infinite]' : 'h-1'}`}></div>
             </div>
           </div>
           
           <div className="flex-1 min-w-0">
             <p className="text-white text-sm font-bold truncate">Verset {ayahs[currentAudioIndex].numberInSurah}</p>
             <p className="text-slate-400 text-xs truncate">{currentSurah?.englishName}</p>
           </div>

           <div className="flex items-center gap-2">
              <button 
                onClick={() => currentAudioIndex > 0 && setCurrentAudioIndex(currentAudioIndex - 1)}
                className="text-slate-400 hover:text-white p-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>
              </button>
              
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 bg-amber-500 text-slate-900 rounded-full flex items-center justify-center hover:bg-amber-400 transition-colors shadow-lg"
              >
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                ) : (
                  <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                )}
              </button>
              
              <button 
                onClick={() => currentAudioIndex < ayahs.length - 1 && setCurrentAudioIndex(currentAudioIndex + 1)}
                className="text-slate-400 hover:text-white p-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>
              </button>
           </div>
        </div>
      )}
      
      {/* Tarteel Status Indicator */}
      {isListening && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl border border-slate-700 p-3 rounded-full shadow-2xl z-50 animate-slide-up flex items-center gap-4">
              <div className="flex items-center gap-2 px-2">
                 <div className={`w-3 h-3 rounded-full ${micVolume > 20 ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></div>
                 <span className="text-slate-200 text-xs font-bold uppercase tracking-wide">Écoute Active</span>
              </div>
              <div className="h-4 w-[1px] bg-slate-700"></div>
              <button onClick={stopListening} className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1 rounded-full text-xs transition-colors">
                 Arrêter
              </button>
          </div>
      )}
    </div>
  );
};
