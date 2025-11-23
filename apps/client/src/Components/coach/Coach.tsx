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
            content: 'Welkom! Ik ben je Personal Coach. Hoe kan ik je vandaag helpen?',
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
        <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto p-4 text-zeus-text">

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
                            ? 'bg-zeus-accent text-white shadow-lg'
                            : 'bg-zeus-card text-zeus-text-secondary hover:text-zeus-text hover:bg-zeus-bg border border-zeus-border'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto zeus-card rounded-3xl p-6 border border-zeus-border">
                {activeTab === 'chat' && (
                    <div className="flex flex-col h-full">
                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto mb-6 space-y-6 pr-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="w-10 h-10 rounded-xl bg-zeus-bg border border-zeus-accent/30 flex items-center justify-center flex-shrink-0 shadow-md">
                                            <Bot className="w-5 h-5 text-zeus-accent" />
                                        </div>
                                    )}

                                    <div
                                        className={`max-w-[80%] p-5 rounded-2xl ${msg.role === 'user'
                                            ? 'bg-zeus-accent text-white rounded-tr-none shadow-lg'
                                            : 'bg-zeus-bg border border-zeus-border text-zeus-text rounded-tl-none'
                                            }`}
                                    >
                                        <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
                                        <span className={`text-[10px] mt-3 block uppercase tracking-wider font-mono opacity-60 ${msg.role === 'user' ? 'text-white' : 'text-zeus-accent'
                                            }`}>
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    {msg.role === 'user' && (
                                        <div className="w-10 h-10 rounded-xl bg-zeus-bg border border-zeus-border flex items-center justify-center flex-shrink-0">
                                            <User className="w-5 h-5 text-zeus-text-secondary" />
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-4 justify-start">
                                    <div className="w-10 h-10 rounded-xl bg-zeus-bg border border-zeus-accent/30 flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-5 h-5 text-zeus-accent" />
                                    </div>
                                    <div className="bg-zeus-bg border border-zeus-border p-5 rounded-2xl rounded-tl-none flex items-center gap-3">
                                        <Loader2 className="w-4 h-4 animate-spin text-zeus-accent" />
                                        <span className="text-xs font-mono text-zeus-accent tracking-widest uppercase">Denken...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="bg-zeus-bg p-2 rounded-2xl border border-zeus-border shadow-inner flex items-end gap-2 relative group focus-within:border-zeus-accent transition-colors duration-300">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Typ je bericht..."
                                className="flex-1 p-4 max-h-32 min-h-[60px] bg-transparent border-none focus:ring-0 resize-none text-zeus-text placeholder-zeus-text-secondary text-sm"
                                rows={1}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="p-4 bg-zeus-accent text-white rounded-xl hover:bg-zeus-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 mb-1 shadow-lg hover:shadow-xl"
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
