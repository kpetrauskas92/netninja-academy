import React, { useState, useRef, useEffect } from 'react';
import { getChatResponse } from '../services/geminiService';
import { AIChatMessage } from '../types';
import { MessageCircle, X, Send, Cpu } from 'lucide-react';

interface AITutorProps {
  isOpen: boolean;
  onClose: () => void;
}

const AITutor: React.FC<AITutorProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    { role: 'model', text: 'Greetings, Cadet! I am NetBot. Ask me anything about Binary, Hex, or Subnets!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: AIChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const historyStrings = messages.map(m => `${m.role}: ${m.text}`);
    const responseText = await getChatResponse(userMsg.text, historyStrings);

    setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-neon-card border-l border-neon-blue shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-neon-dark/50">
        <div className="flex items-center gap-2 text-neon-blue">
          <Cpu size={20} />
          <h2 className="font-bold font-mono">NetBot AI Link</h2>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X size={24} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-lg text-sm ${
              msg.role === 'user' 
                ? 'bg-neon-purple text-white rounded-br-none' 
                : 'bg-gray-800 text-gray-200 border border-neon-blue/30 rounded-bl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 p-3 rounded-lg text-xs text-neon-blue animate-pulse">
              Processing logic gates...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-neon-dark">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask for a hint..."
            className="flex-1 bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-neon-blue"
          />
          <button 
            onClick={handleSend}
            disabled={loading}
            className="bg-neon-blue text-black p-2 rounded-md hover:bg-cyan-400 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AITutor;