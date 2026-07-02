import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const envStatus = {
      YOUTUBE_API_KEY: !!process.env.YOUTUBE_API_KEY,
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      DATABASE_URL: !!process.env.DATABASE_URL,
      NODE_ENV: process.env.NODE_ENV
    };

    // Don't expose actual keys, just whether they exist
    const details = {
      youtube_key_length: process.env.YOUTUBE_API_KEY?.length || 0,
      gemini_key_length: process.env.GEMINI_API_KEY?.length || 0,
      youtube_key_prefix: process.env.YOUTUBE_API_KEY?.substring(0, 8) + '...' || 'not set',
      gemini_key_prefix: process.env.GEMINI_API_KEY?.substring(0, 8) + '...' || 'not set'
    };

    return NextResponse.json({
      status: 'success',
      environment: envStatus,
      details: details,
      message: 'Environment check completed'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to check environment variables',
      error: error.message
    }, { status: 500 });
  }
}
