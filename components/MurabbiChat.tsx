import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { sendMessageToMurabbi } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface MurabbiChatProps {
  messages: ChatMessage[];
  onSendMessage: (msg: ChatMessage) => void;
}

export const MurabbiChat: React.FC<MurabbiChatProps> = ({ messages, onSendMessage }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date()
    };

    onSendMessage(userMsg);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => `${m.sender === 'user' ? 'Utilisateur' : 'Murabbi'}: ${m.text}`);
      const responseText = await sendMessageToMurabbi(userMsg.text, history);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'murabbi',
        text: responseText,
        timestamp: new Date()
      };
      
      onSendMessage(aiMsg);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-cyan-600 flex items-center justify-center text-white font-serif font-bold text-xl shadow-lg">
          M
        </div>
        <div>
          <h3 className="text-white font-bold">Murabbi AI</h3>
          <p className="text-xs text-emerald-400">En ligne • Coach Spirituel</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              msg.sender === 'user' 
                ? 'bg-cyan-600 text-white rounded-tr-none' 
                : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
            }`}>
              <div className="prose prose-invert prose-sm max-w-none">
                 <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
              <span className="text-[10px] opacity-50 block mt-1 text-right">
                {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-2xl rounded-tl-none px-4 py-3 border border-slate-700 flex gap-2">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-900">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Raconte ta journée..."
            className="w-full bg-slate-800 text-white rounded-full pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-slate-700 placeholder-slate-500"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1.5 p-1.5 bg-cyan-600 text-white rounded-full hover:bg-cyan-500 disabled:opacity-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </form>
    </div>
  );
};