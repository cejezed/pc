import OpenAI from 'openai';

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
    // In Node.js, we need to use FormData from a library
    const FormData = require('form-data');
    const form = new FormData();

    // Convert Blob to Buffer for Node.js
    const buffer = Buffer.from(await audioBlob.arrayBuffer());
    form.append('file', buffer, {
        filename: 'audio.webm',
        contentType: 'audio/webm',
    });
    form.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            ...form.getHeaders(),
        },
        body: form,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Whisper API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as { text: string };
    return data.text;
}

// Text-to-speech with OpenAI TTS
export async function generateSpeech(text: string): Promise<ArrayBuffer> {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'tts-1',
            voice: 'nova', // warm, natural voice
            input: text,
            speed: 1.0,
        }),
    });

    if (!response.ok) {
        throw new Error(`TTS API error: ${response.statusText}`);
    }

    return await response.arrayBuffer();
}
