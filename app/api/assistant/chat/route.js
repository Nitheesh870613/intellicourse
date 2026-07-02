import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Groq from 'groq-sdk';

// Prevent static generation - this route must be dynamic
export const dynamic = 'force-dynamic';

// Lazy-load GROQ client to avoid build-time initialization
function getGroqClient() {
    if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is not configured');
    }
    return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

export async function POST(request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { messages } = await request.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
        }

        const groq = getGroqClient();
        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful AI learning assistant. Help users with their course content, answer questions about topics they are learning, and provide study tips and explanations. Be concise but thorough.',
                },
                ...messages.map(m => ({
                    role: m.role,
                    content: m.content,
                })),
            ],
            temperature: 0.7,
            max_tokens: 1024,
        });

        const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

        return NextResponse.json({ response });
    } catch (error) {
        console.error('Assistant chat API error:', error);
        return NextResponse.json({ error: 'Failed to get response' }, { status: 500 });
    }
}
