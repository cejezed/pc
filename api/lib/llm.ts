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
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set');
    }

    // Convert Blob to File-like object for OpenAI SDK
    const file = await toFile(audioBlob, 'audio.webm', { type: 'audio/webm' });

    const response = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
    });

    return response.text;
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
