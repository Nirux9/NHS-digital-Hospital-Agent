import React, { useState } from 'react';
import { Bot, X, Send, Loader2, Sparkles, ShieldAlert } from 'lucide-react';
import { askAIAssistant } from '../services/api';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const AskAssistantWidget: React.FC<{ role: string }> = ({ role }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: `Hello! I am your NHS AI Core Assistant. How can I assist you with clinical guidelines, triage questions, appointments, or hospital services today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput('');

    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const response = await askAIAssistant(userText, role);
      setMessages((prev) => [...prev, { role: 'model', text: response }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: 'I am having trouble connecting to NHS AI Core. For emergencies, please call 999 immediately.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Pill Button - Positioned carefully to not overlap footer links */}
      <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-5 z-40 no-print">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#005EB8] hover:bg-[#003087] text-white rounded-full shadow-lg border border-blue-400/40 text-xs font-extrabold transition-all transform hover:scale-105 cursor-pointer"
          >
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <span>Ask Assistant</span>
            <span className="hidden sm:inline text-[10px] text-blue-200 font-semibold">· NHS AI Core</span>
            <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse"></span>
          </button>
        )}
      </div>

      {/* Chat Drawer / Modal */}
      {isOpen && (
        <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-5 z-50 w-[92vw] sm:w-96 bg-white rounded-2xl border border-[#DCE6F0] shadow-2xl overflow-hidden flex flex-col h-[500px]">
          {/* Header */}
          <div className="bg-[#005EB8] text-white p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Bot className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-xs leading-tight">NHS AI Core Assistant</p>
                  <Sparkles className="w-3 h-3 text-cyan-300" />
                </div>
                <p className="text-[10px] text-blue-200 leading-tight">Clinical Decision Support · Live</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Safety Disclaimer Banner */}
          <div className="bg-amber-50 border-b border-amber-200/80 px-3 py-1.5 text-[10px] text-amber-900 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
            <span>AI advice guides decision support. Call 999 in medical emergencies.</span>
          </div>

          {/* Messages body */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-slate-50 text-xs">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'model' && (
                  <div className="w-6 h-6 rounded-lg bg-[#003087] text-white flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-[10px]">
                    AI
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[85%] leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-[#003087] text-white rounded-br-xs font-semibold'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-2xs font-normal'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-slate-500 text-xs py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#003087]" />
                NHS AI Core is processing...
              </div>
            )}
          </div>

          {/* Input Footer */}
          <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question or request advice..."
              className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#003087]"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="p-2 bg-[#003087] hover:bg-[#002060] text-white rounded-xl disabled:opacity-50 transition-colors shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
