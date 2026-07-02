import { NextResponse } from 'next/server';
import { getSafeYouTubeVideos } from '@/lib/youtube/getSafeVideos';
import { generateCourseId } from '@/lib/youtube/videoCache';

/**
 * YouTube Video Search API
 * 
 * Uses the new robust 5-phase pipeline:
 * Search → Validation → Embed Probe → Ranking → Cache
 * 
 * Query Parameters:
 * - q: Search query (required) - typically "${courseTitle} ${moduleTitle}"
 * - userId: User ID for cache isolation (optional, defaults to 'api')
 * - courseId: Course ID for cache isolation (optional)
 * - moduleIndex: Module index for cache isolation (optional)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const courseTitle = searchParams.get('courseTitle') || query || '';
    const moduleTitle = searchParams.get('moduleTitle') || '';
    const userId = searchParams.get('userId') || 'api';
    const courseId = searchParams.get('courseId') || generateCourseId('api-request');
    const moduleIndex = parseInt(searchParams.get('moduleIndex') || '0');

    if (!query && !courseTitle) {
      return NextResponse.json({ error: 'Missing q or courseTitle parameter' }, { status: 400 });
    }

    if (!process.env.YOUTUBE_API_KEY) {
      return NextResponse.json({ error: 'Missing YOUTUBE_API_KEY' }, { status: 500 });
    }

    const result = await getSafeYouTubeVideos(
      courseTitle,
      moduleTitle,
      {
        userId: userId,
        courseId: courseId,
        moduleIndex: moduleIndex
      }
    );

    return NextResponse.json({
      success: true,
      videos: result.videos,
      status: result.status,
      cached: result.cached || false
    }, { status: 200 });
  } catch (e) {
    console.error('YouTube API error:', e);
    return NextResponse.json({ error: 'YouTube search failed', details: e.message }, { status: 500 });
  }
}
