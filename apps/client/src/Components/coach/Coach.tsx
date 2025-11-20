import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CoachingCards } from './CoachingCards';
import { QuickMoment } from './QuickMoment';
import { VoiceChat } from './VoiceChat';

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
            content: 'Hoi! Ik ben je Personal Coach. Ik heb inzicht in je gezondheid, gewoontes en zakelijke voortgang. Waar kan ik je vandaag mee helpen?',
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'insights' | 'capture' | 'voice'>('chat');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const fetchHistory = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data, error } = await supabase
                .from('coach_messages')
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
                    role: msg.role as 'user' | 'assistant',
                    content: msg.content,
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

            if (!response.ok) throw new Error('Fout bij ophalen antwoord');

            const data = await response.json();

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error('Coach error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Sorry, ik kon even geen verbinding maken. Probeer het later nog eens.',
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
        <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto p-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 p-4 bg-gradient-to-r from-brikx-teal to-teal-600 rounded-2xl text-white shadow-lg">
                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                    <Sparkles className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Personal Coach</h1>
                    <p className="text-teal-100 text-sm">Jouw slimme assistent voor gezondheid & business</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('chat')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'chat'
                            ? 'text-brikx-teal border-b-2 border-brikx-teal'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Chat
                </button>
                <button
                    onClick={() => setActiveTab('insights')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'insights'
                            ? 'text-brikx-teal border-b-2 border-brikx-teal'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Inzichten
                </button>
                <button
                    onClick={() => setActiveTab('capture')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'capture'
                            ? 'text-brikx-teal border-b-2 border-brikx-teal'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Snel Vastleggen
                </button>
                <button
                    onClick={() => setActiveTab('voice')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'voice'
                            ? 'text-brikx-teal border-b-2 border-brikx-teal'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Spraak
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'chat' && (
                    <div className="flex flex-col h-full">
                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                                            <Bot className="w-5 h-5 text-brikx-teal" />
                                        </div>
                                    )}

                                    <div
                                        className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${msg.role === 'user'
                                            ? 'bg-brikx-teal text-white rounded-tr-none'
                                            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                                            }`}
                                    >
                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                        <span className={`text-[10px] mt-2 block ${msg.role === 'user' ? 'text-teal-100' : 'text-gray-400'}`}>
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    {msg.role === 'user' && (
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                            <User className="w-5 h-5 text-gray-600" />
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3 justify-start">
                                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-5 h-5 text-brikx-teal" />
                                    </div>
                                    <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-brikx-teal" />
                                        <span className="text-sm text-gray-500">Aan het nadenken...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-lg flex items-end gap-2">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Stel een vraag over je gezondheid, werk of planning..."
                                className="flex-1 p-3 max-h-32 min-h-[50px] bg-transparent border-none focus:ring-0 resize-none text-gray-800 placeholder-gray-400"
                                rows={1}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="p-3 bg-brikx-teal text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-1"
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

                {activeTab === 'capture' && (
                    <div className="p-4 max-w-2xl mx-auto">
                        <QuickMoment />
                    </div>
                )}

                {activeTab === 'voice' && (
                    <div className="p-4 max-w-2xl mx-auto">
                        <VoiceChat />
                    </div>
                )}
            </div>
        </div>
    );
}
