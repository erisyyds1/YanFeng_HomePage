import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { sendMessageToDify } from '../services/difyService';
import { ChatMessage } from '../types';

const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'model', text: '你好呀！我是檐枫动漫社的社娘檐枫娘，想知道什么都可以问我哦！' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await sendMessageToDify(input);
      const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 border-4 border-[var(--theme-border)] bg-[var(--theme-primary)] text-white ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageCircle size={32} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm h-[500px] flex flex-col bg-[var(--theme-secondary)] border-4 border-[var(--theme-border)] rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          
          {/* Header */}
          <div className="bg-[var(--theme-primary)] p-4 flex justify-between items-center text-white border-b-4 border-[var(--theme-border)]">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="animate-spin-slow" />
              <h3 className="font-bold font-retro text-lg">社团小助手</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full p-1 transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-checker-pattern/10">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] p-3 rounded-xl border-2 border-[var(--theme-border)] text-sm shadow-[2px_2px_0px_var(--theme-border)] ${
                    msg.role === 'user' 
                      ? 'bg-[var(--theme-accent)] text-white rounded-br-none' 
                      : 'bg-white text-black rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-xl rounded-bl-none border-2 border-[var(--theme-border)] text-xs text-gray-500 flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-[var(--theme-secondary)] border-t-4 border-[var(--theme-border)] flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="问问关于GMA或者招新的事..."
              className="flex-1 border-2 border-[var(--theme-border)] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] text-[var(--theme-border)]"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              aria-label="发送消息"
              className="bg-[var(--theme-primary)] text-white p-2 rounded-lg border-2 border-[var(--theme-border)] hover:bg-opacity-90 disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatAssistant;
