import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Loader2, Phone, PhoneOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function VoiceChat() {
    const [isConversationActive, setIsConversationActive] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');
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

    useEffect(() => {
        return () => {
            endConversation();
        };
    }, []);

    async function startConversation() {
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
            alert('Kon microfoon niet starten. Geef toestemming voor microfoon toegang.');
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
            const SILENCE_THRESHOLD = 10; // Adjust based on testing
            const SILENCE_DURATION = 2000; // 2 seconds of silence to trigger stop

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
            await processAudio(audioBlob);
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
        setIsProcessing(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert('Niet ingelogd');
                endConversation();
                return;
            }

            // Convert blob to base64 for sending
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);

            reader.onloadend = async () => {
                const base64Audio = reader.result as string;

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
            };
        } catch (error) {
            console.error('Error processing audio:', error);
            // alert('Fout bij verwerken audio. Probeer opnieuw.'); // Optional: disable alert to avoid interruption
            setIsProcessing(false);

            // Continue conversation if still active
            if (isConversationActive) {
                setTimeout(() => startRecording(), 1000);
            }
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
        <div className="zeus-card rounded-3xl p-8 border border-[#2d3436] relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B00] opacity-5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-white tracking-wider font-['Orbitron',sans-serif] flex items-center gap-2">
                    <div className="w-1 h-6 bg-[#FF6B00]"></div>
                    VOICE <span className="text-[#FF6B00]">LINK</span>
                </h2>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConversationActive ? 'bg-[#FF6B00] zeus-glow' : 'bg-gray-600'}`}></div>
                    <span className="text-[10px] font-mono text-gray-400 tracking-widest">
                        {isConversationActive ? 'LIVE' : 'OFFLINE'}
                    </span>
                </div>
            </div>

            {/* Conversation Button */}
            <div className="flex flex-col items-center gap-6 mb-8 relative">
                {/* Ring Animation */}
                {isConversationActive && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-[#FF6B00]/30 rounded-full animate-ping pointer-events-none"></div>
                )}

                {!isConversationActive ? (
                    <button
                        onClick={startConversation}
                        className="w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 bg-[#1F2833] hover:bg-[#2d3436] border-2 border-[#FF6B00] text-[#FF6B00] shadow-[0_0_20px_rgba(255,107,0,0.2)] hover:shadow-[0_0_40px_rgba(255,107,0,0.4)] group z-10"
                    >
                        <Phone className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    </button>
                ) : (
                    <button
                        onClick={endConversation}
                        className="w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 bg-[#FF6B00]/10 hover:bg-[#FF6B00]/20 border-2 border-[#FF6B00] text-[#FF6B00] shadow-[0_0_30px_rgba(255,107,0,0.3)] z-10 relative"
                    >
                        <PhoneOff className="w-8 h-8" />
                        {/* Inner glow pulse */}
                        <div className="absolute inset-0 rounded-full bg-[#FF6B00] opacity-20 animate-pulse"></div>
                    </button>
                )}

                <div className="text-center z-10">
                    <p className="text-sm font-mono text-[#66FCF1] tracking-widest uppercase mb-2">
                        {!isConversationActive
                            ? 'INITIALIZE LINK'
                            : isProcessing
                                ? 'PROCESSING DATA...'
                                : isSpeaking
                                    ? 'INCOMING TRANSMISSION...'
                                    : isRecording
                                        ? 'LISTENING...'
                                        : 'STANDBY...'}
                    </p>

                    {/* Visualizer Bars (Fake) */}
                    {isConversationActive && (
                        <div className="flex items-center justify-center gap-1 h-8">
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-1 bg-[#FF6B00] rounded-full transition-all duration-100 ${(isSpeaking || isRecording) ? 'animate-[bounce_1s_infinite]' : 'h-1 opacity-30'
                                        }`}
                                    style={{
                                        height: (isSpeaking || isRecording) ? `${Math.random() * 20 + 10}px` : '4px',
                                        animationDelay: `${i * 0.1}s`
                                    }}
                                ></div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Conversation History */}
            {conversationHistory.length > 0 && (
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#FF6B00] scrollbar-track-[#0B0C10] border-t border-[#2d3436] pt-6">
                    {conversationHistory.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`p-4 rounded-xl border ${msg.role === 'user'
                                ? 'bg-[#FF6B00]/10 border-[#FF6B00]/30 ml-8 text-right'
                                : 'bg-[#1F2833] border-[#2d3436] mr-8'
                                }`}
                        >
                            <p className="text-[10px] font-mono text-[#66FCF1] mb-2 uppercase tracking-wider opacity-70">
                                {msg.role === 'user' ? 'USER INPUT' : 'AI RESPONSE'}
                            </p>
                            <p className="text-sm text-[#C5C6C7] leading-relaxed">{msg.text}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Hidden audio player for TTS */}
            <audio ref={audioRef} className="hidden" />
        </div>
    );
}
