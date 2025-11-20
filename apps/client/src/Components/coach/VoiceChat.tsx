import React, { useState, useRef } from 'react';
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

    async function startConversation() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            setIsConversationActive(true);
            setConversationHistory([]);

            // Start first recording automatically
            startRecording(stream);
        } catch (error) {
            console.error('Error starting conversation:', error);
            alert('Kon microfoon niet starten. Geef toestemming voor microfoon toegang.');
        }
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
        setIsConversationActive(false);
        setIsRecording(false);
        setIsSpeaking(false);
    }

    function startRecording(stream?: MediaStream) {
        const activeStream = stream || streamRef.current;
        if (!activeStream) return;

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
                        audio: base64Audio,
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
                }
            };
        } catch (error) {
            console.error('Error processing audio:', error);
            alert('Fout bij verwerken audio. Probeer opnieuw.');
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Voice Conversation</h2>

            {/* Conversation Button */}
            <div className="flex flex-col items-center gap-4 mb-6">
                {!isConversationActive ? (
                    <button
                        onClick={startConversation}
                        className="w-20 h-20 rounded-full flex items-center justify-center transition-all bg-brikx-teal hover:bg-teal-700 text-white shadow-lg"
                    >
                        <Phone className="w-8 h-8" />
                    </button>
                ) : (
                    <button
                        onClick={endConversation}
                        className="w-20 h-20 rounded-full flex items-center justify-center transition-all bg-red-500 hover:bg-red-600 text-white shadow-lg"
                    >
                        <PhoneOff className="w-8 h-8" />
                    </button>
                )}

                <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">
                        {!isConversationActive
                            ? 'Start Gesprek'
                            : isProcessing
                                ? 'Verwerken...'
                                : isSpeaking
                                    ? 'Coach spreekt...'
                                    : isRecording
                                        ? 'Luisteren...'
                                        : 'Wachten...'}
                    </p>
                    {isConversationActive && (
                        <div className="flex items-center justify-center gap-2 mt-2">
                            {isRecording && (
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            )}
                            {isSpeaking && (
                                <Volume2 className="w-4 h-4 text-brikx-teal animate-pulse" />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Conversation History */}
            {conversationHistory.length > 0 && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {conversationHistory.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`p-3 rounded-lg ${msg.role === 'user'
                                    ? 'bg-gray-50 ml-8'
                                    : 'bg-teal-50 mr-8 border border-teal-200'
                                }`}
                        >
                            <p className="text-xs text-gray-500 mb-1">
                                {msg.role === 'user' ? 'Jij:' : 'Coach:'}
                            </p>
                            <p className="text-sm text-gray-800">{msg.text}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Hidden audio player for TTS */}
            <audio ref={audioRef} className="hidden" />
        </div>
    );
}
