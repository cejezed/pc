import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CoachingCards } from './CoachingCards';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function Coach() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'SYSTEM ONLINE. Personal Coach v2.0 initialized. Accessing health and business metrics... Ready for input.',
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'insights'>('chat');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const fetchHistory = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching history:', error);
                return;
            }

            if (data && data.length > 0) {
                const history: Message[] = data.map((msg) => ({
                    id: msg.id,
                    role: msg.role === 'coach' ? 'assistant' : 'user',
                    content: msg.text,
                    timestamp: new Date(msg.created_at),
                }));
                setMessages(history);
            }
        };

        fetchHistory();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Niet ingelogd');

            const response = await fetch('/api/coach', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ message: userMessage.content }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API Error:', response.status, errorData);
                throw new Error(errorData.error || `API Error: ${response.status}`);
            }

            const data = await response.json();

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, botMessage]);
        } catch (error: any) {
            console.error('Coach error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Error: ${error.message || 'Onbekende fout'}`,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto p-4 text-[#C5C6C7]">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 p-6 zeus-card rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#FF6B00] opacity-80"></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="p-3 bg-[#1F2833] rounded-2xl border border-[#2d3436] shadow-[0_0_15px_rgba(255,107,0,0.2)]">
                        <Sparkles className="w-6 h-6 text-[#FF6B00]" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-wider text-white mb-1 font-['Orbitron',sans-serif]">
                            AI <span className="text-[#FF6B00]">COACH</span>
                        </h1>
                        <p className="text-[#66FCF1] text-xs uppercase tracking-[0.2em] font-semibold opacity-80">
                            System Online • v2.0
                        </p>
                    </div>
                </div>
                <div className="hidden md:block">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#FF6B00] bg-[#FF6B00]/10 px-3 py-1 rounded border border-[#FF6B00]/20">
                        <div className="w-2 h-2 bg-[#FF6B00] rounded-full animate-pulse"></div>
                        CONNECTED
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 p-1 overflow-x-auto">
                {[
                    { id: 'chat', label: 'CHAT' },
                    { id: 'insights', label: 'INZICHTEN' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-6 py-3 font-bold text-sm tracking-wider rounded-xl transition-all duration-300 uppercase whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-[#FF6B00] text-white shadow-[0_0_20px_rgba(255,107,0,0.4)] translate-y-[-2px]'
                            : 'bg-[#1F2833] text-gray-400 hover:text-white hover:bg-[#2d3436] border border-transparent hover:border-[#FF6B00]/30'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto zeus-card rounded-3xl p-6 border border-[#2d3436]">
                {activeTab === 'chat' && (
                    <div className="flex flex-col h-full">
                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto mb-6 space-y-6 pr-4 scrollbar-thin scrollbar-thumb-[#FF6B00] scrollbar-track-[#0B0C10]">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="w-10 h-10 rounded-xl bg-[#1F2833] border border-[#FF6B00]/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(255,107,0,0.1)]">
                                            <Bot className="w-5 h-5 text-[#FF6B00]" />
                                        </div>
                                    )}

                                    <div
                                        className={`max-w-[80%] p-5 rounded-2xl backdrop-blur-sm ${msg.role === 'user'
                                            ? 'bg-[#FF6B00] text-white rounded-tr-none shadow-[0_4px_15px_rgba(255,107,0,0.3)]'
                                            : 'bg-[#1F2833] border border-[#2d3436] text-[#C5C6C7] rounded-tl-none'
                                            }`}
                                    >
                                        <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
                                        <span className={`text-[10px] mt-3 block uppercase tracking-wider font-mono opacity-60 ${msg.role === 'user' ? 'text-white' : 'text-[#FF6B00]'
                                            }`}>
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    {msg.role === 'user' && (
                                        <div className="w-10 h-10 rounded-xl bg-[#1F2833] border border-gray-700 flex items-center justify-center flex-shrink-0">
                                            <User className="w-5 h-5 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-4 justify-start">
                                    <div className="w-10 h-10 rounded-xl bg-[#1F2833] border border-[#FF6B00]/30 flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-5 h-5 text-[#FF6B00]" />
                                    </div>
                                    <div className="bg-[#1F2833] border border-[#2d3436] p-5 rounded-2xl rounded-tl-none flex items-center gap-3">
                                        <Loader2 className="w-4 h-4 animate-spin text-[#FF6B00]" />
                                        <span className="text-xs font-mono text-[#FF6B00] tracking-widest uppercase">Processing...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="bg-[#0B0C10] p-2 rounded-2xl border border-[#2d3436] shadow-inner flex items-end gap-2 relative group focus-within:border-[#FF6B00] transition-colors duration-300">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="TYPE COMMAND..."
                                className="flex-1 p-4 max-h-32 min-h-[60px] bg-transparent border-none focus:ring-0 resize-none text-white placeholder-gray-600 font-mono text-sm"
                                rows={1}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="p-4 bg-[#FF6B00] text-white rounded-xl hover:bg-[#ff8533] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 mb-1 shadow-[0_0_15px_rgba(255,107,0,0.3)] hover:shadow-[0_0_25px_rgba(255,107,0,0.5)]"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'insights' && (
                    <div className="p-4">
                        <CoachingCards />
                    </div>
                )}
            </div>
        </div>
    );
}
