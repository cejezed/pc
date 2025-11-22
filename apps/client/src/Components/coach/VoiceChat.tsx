import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, Loader2, X, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function VoiceChat() {
    const [isConversationActive, setIsConversationActive] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'user' | 'coach', text: string }>>([]);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Silence detection refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const silenceTimerRef = useRef<number | null>(null);
    const speechDetectedRef = useRef<boolean>(false);

    // Rate limiting / Debounce
    const lastRequestTimeRef = useRef<number>(0);
    const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

    useEffect(() => {
        return () => {
            endConversation();
        };
    }, []);

    async function startConversation() {
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            setIsConversationActive(true);
            setConversationHistory([]);

            // Initialize AudioContext for silence detection
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioContext;
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;

            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            // Start monitoring silence
            monitorSilence();

            // Start first recording automatically
            startRecording(stream);
        } catch (error) {
            console.error('Error starting conversation:', error);
            setError('Geen toegang tot microfoon. Controleer je instellingen.');
        }
    }

    function monitorSilence() {
        if (!analyserRef.current || !isConversationActive) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const checkAudioLevel = () => {
            if (!analyserRef.current || !isConversationActive) return;

            analyserRef.current.getByteFrequencyData(dataArray);

            // Calculate average volume
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;

            // Thresholds
            const SILENCE_THRESHOLD = 15; // Slightly higher threshold to avoid background noise
            const SILENCE_DURATION = 2500; // 2.5 seconds of silence

            if (average > SILENCE_THRESHOLD) {
                // Speech detected
                speechDetectedRef.current = true;
                if (silenceTimerRef.current) {
                    clearTimeout(silenceTimerRef.current);
                    silenceTimerRef.current = null;
                }
            } else {
                // Silence detected
                if (speechDetectedRef.current && !silenceTimerRef.current && isRecording) {
                    // Only trigger silence timer if we previously detected speech
                    silenceTimerRef.current = setTimeout(() => {
                        if (isRecording && speechDetectedRef.current) {
                            console.log('Silence detected, stopping recording...');
                            stopRecording();
                            speechDetectedRef.current = false; // Reset for next turn
                        }
                    }, SILENCE_DURATION) as unknown as number;
                }
            }

            if (isConversationActive) {
                requestAnimationFrame(checkAudioLevel);
            }
        };

        checkAudioLevel();
    }

    function endConversation() {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
        if (audioRef.current) {
            audioRef.current.pause();
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }

        setIsConversationActive(false);
        setIsRecording(false);
        setIsSpeaking(false);
        speechDetectedRef.current = false;
    }

    function startRecording(stream?: MediaStream) {
        const activeStream = stream || streamRef.current;
        if (!activeStream) return;

        // Reset speech detection for new turn
        speechDetectedRef.current = false;
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }

        const mediaRecorder = new MediaRecorder(activeStream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            // Only process if blob has size
            if (audioBlob.size > 1000) { // Ignore very small clips
                await processAudio(audioBlob);
            } else {
                // If audio too short, just restart listening
                if (isConversationActive) startRecording();
            }
        };

        mediaRecorder.start();
        setIsRecording(true);
    }

    function stopRecording() {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }

    async function processAudio(audioBlob: Blob) {
        // Rate limiting check
        const now = Date.now();
        if (now - lastRequestTimeRef.current < MIN_REQUEST_INTERVAL) {
            console.log('Rate limit hit, ignoring request');
            if (isConversationActive) startRecording();
            return;
        }
        lastRequestTimeRef.current = now;

        setIsProcessing(true);
        setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError('Je bent niet ingelogd.');
                endConversation();
                return;
            }

            // Convert blob to base64 for sending
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);

            reader.onloadend = async () => {
                const base64Audio = reader.result as string;

                try {
                    // Send to /api/voice endpoint
                    const response = await fetch('/api/voice', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`,
                        },
                        body: JSON.stringify({
                            audio: base64Audio
                        }),
                    });

                    if (!response.ok) {
                        if (response.status === 429) {
                            throw new Error('Te veel verzoeken. Even geduld...');
                        }
                        throw new Error('Fout bij verwerken audio');
                    }

                    const data = await response.json();
                    const userText = data.transcript || '';
                    const coachText = data.reply || '';

                    setTranscript(userText);
                    setResponse(coachText);

                    // Add to conversation history
                    setConversationHistory(prev => [
                        ...prev,
                        { role: 'user', text: userText },
                        { role: 'coach', text: coachText }
                    ]);

                    setIsProcessing(false);

                    // Play TTS audio if available
                    if (data.voiceUrl && isConversationActive) {
                        playAudio(data.voiceUrl);
                    } else {
                        // If no audio response, start listening again immediately
                        if (isConversationActive) {
                            startRecording();
                        }
                    }
                } catch (err: any) {
                    console.error('API Error:', err);
                    setError(err.message || 'Er ging iets mis bij de server.');
                    setIsProcessing(false);

                    // If error, wait a bit then retry listening if active
                    if (isConversationActive) {
                        setTimeout(() => startRecording(), 3000);
                    }
                }
            };
        } catch (error) {
            console.error('Error processing audio:', error);
            setError('Fout bij verwerken audio.');
            setIsProcessing(false);
        }
    }

    function playAudio(audioUrl: string) {
        if (audioRef.current) {
            setIsSpeaking(true);
            audioRef.current.src = audioUrl;
            audioRef.current.play();

            // When audio finishes, start listening again if conversation is still active
            audioRef.current.onended = () => {
                setIsSpeaking(false);
                if (isConversationActive) {
                    // Small delay before starting to listen again
                    setTimeout(() => {
                        if (isConversationActive) {
                            startRecording();
                        }
                    }, 500);
                }
            };
        }
    }

    return (
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 w-full max-w-md mx-auto transition-all duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-zeus-accent/10 flex items-center justify-center">
                        <Mic className="w-6 h-6 text-zeus-accent" />
                    </div>
                    <div>
                        <h2 className="font-bold text-zeus-primary text-xl tracking-tight">Voice Assistant</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`w-2 h-2 rounded-full ${isConversationActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-slate-300'}`}></span>
                            <span className="text-xs text-slate-500 font-medium tracking-wide uppercase">
                                {isConversationActive ? 'Live' : 'Stand-by'}
                            </span>
                        </div>
                    </div>
                </div>
                {isConversationActive && (
                    <button
                        onClick={endConversation}
                        className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Main Content */}
            <div className="flex flex-col items-center justify-center py-6 min-h-[220px]">
                {!isConversationActive ? (
                    <button
                        onClick={startConversation}
                        className="group relative w-24 h-24 flex items-center justify-center bg-zeus-accent hover:bg-[#1D7AAC] rounded-full shadow-lg hover:shadow-xl hover:shadow-zeus-accent/20 transition-all duration-300 transform hover:-translate-y-1"
                    >
                        <Mic className="w-10 h-10 text-white" />
                        <span className="absolute -bottom-10 text-sm font-medium text-slate-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            Start gesprek
                        </span>
                    </button>
                ) : (
                    <div className="relative">
                        {/* Status Indicator */}
                        <div className="w-32 h-32 rounded-full flex items-center justify-center bg-slate-50 relative">
                            {/* Ripple effect when speaking */}
                            {isSpeaking && (
                                <>
                                    <div className="absolute inset-0 rounded-full border border-zeus-accent/20 animate-ping"></div>
                                    <div className="absolute inset-0 rounded-full border border-zeus-accent/10 animate-ping animation-delay-200"></div>
                                </>
                            )}

                            {isProcessing ? (
                                <Loader2 className="w-10 h-10 text-zeus-accent animate-spin" />
                            ) : isSpeaking ? (
                                <Volume2 className="w-10 h-10 text-zeus-accent animate-pulse" />
                            ) : (
                                <div className="flex gap-1.5 items-end h-8">
                                    <div className="w-1.5 bg-zeus-accent rounded-full animate-[bounce_1s_infinite] h-4"></div>
                                    <div className="w-1.5 bg-zeus-accent rounded-full animate-[bounce_1s_infinite] animation-delay-100 h-8"></div>
                                    <div className="w-1.5 bg-zeus-accent rounded-full animate-[bounce_1s_infinite] animation-delay-200 h-5"></div>
                                </div>
                            )}
                        </div>
                        <p className="text-center mt-8 text-sm font-medium text-slate-500 tracking-wide uppercase">
                            {isProcessing ? 'Denken...' : isSpeaking ? 'Spreken...' : 'Luisteren...'}
                        </p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mt-6 flex items-center gap-2 text-red-500 bg-red-50 px-4 py-3 rounded-xl text-sm border border-red-100 animate-in fade-in slide-in-from-bottom-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}
            </div>

            {/* Conversation History */}
            {conversationHistory.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-100 space-y-4 max-h-64 overflow-y-auto custom-scrollbar px-1">
                    {conversationHistory.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                        ? 'bg-zeus-accent text-white rounded-tr-sm'
                                        : 'bg-slate-50 text-slate-700 rounded-tl-sm border border-slate-100'
                                    }`}
                            >
                                {msg.text}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <audio ref={audioRef} className="hidden" />
        </div>
    );
}
