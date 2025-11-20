import React, { useState, useRef } from 'react';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function VoiceChat() {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
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
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Kon microfoon niet starten. Geef toestemming voor microfoon toegang.');
        }
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
                setTranscript(data.transcript || '');
                setResponse(data.reply || '');

                // Play TTS audio if available
                if (data.voiceUrl) {
                    playAudio(data.voiceUrl);
                }
            };
        } catch (error) {
            console.error('Error processing audio:', error);
            alert('Fout bij verwerken audio. Probeer opnieuw.');
        } finally {
            setIsProcessing(false);
        }
    }

    function playAudio(audioUrl: string) {
        if (audioRef.current) {
            audioRef.current.src = audioUrl;
            audioRef.current.play();
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Voice Chat</h2>

            {/* Recording Button */}
            <div className="flex flex-col items-center gap-4 mb-6">
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isRecording
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                            : 'bg-brikx-teal hover:bg-teal-700'
                        } text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
                >
                    {isProcessing ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                    ) : isRecording ? (
                        <MicOff className="w-8 h-8" />
                    ) : (
                        <Mic className="w-8 h-8" />
                    )}
                </button>
                <p className="text-sm text-gray-600">
                    {isProcessing
                        ? 'Verwerken...'
                        : isRecording
                            ? 'Klik om opname te stoppen'
                            : 'Klik om te praten'}
                </p>
            </div>

            {/* Transcript */}
            {transcript && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Jij zei:</p>
                    <p className="text-gray-800">{transcript}</p>
                </div>
            )}

            {/* Response */}
            {response && (
                <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                    <div className="flex items-center gap-2 mb-2">
                        <Volume2 className="w-4 h-4 text-brikx-teal" />
                        <p className="text-xs text-gray-500">Coach antwoord:</p>
                    </div>
                    <p className="text-gray-800">{response}</p>
                </div>
            )}

            {/* Hidden audio player for TTS */}
            <audio ref={audioRef} className="hidden" />
        </div>
    );
}
