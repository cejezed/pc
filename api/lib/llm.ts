import OpenAI from 'openai';
import { toFile } from 'openai/uploads';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function callLLM(
    systemPrompt: string,
    userPrompt: string
): Promise<string> {
    // Using OpenAI GPT-4o as a stand-in for Claude 3.5 Sonnet until Anthropic key is available
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        max_tokens: 500,
    });

    return completion.choices[0].message.content || '';
}

// Voice transcription with Whisper
export async function transcribeAudio(audioBlob: Blob, mimeType: string = 'audio/webm'): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set');
    }

    // Determine extension
    const extension = mimeType.split('/')[1]?.split(';')[0] || 'webm';
    const filename = `audio.${extension}`;

    const formData = new FormData();
    formData.append('file', audioBlob, filename);
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI Whisper API Error:', errorText);
        throw new Error(`Whisper API failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.text;
}

// Text-to-speech with OpenAI TTS
export async function generateSpeech(text: string): Promise<ArrayBuffer> {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set');
    }

    const response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'nova', // warm, natural voice
        input: text,
        speed: 1.0,
    });

    return await response.arrayBuffer();
}
