import { NextResponse } from 'next/server';
import { generateCompleteCourse } from '@/lib/openrouter';
import { formatCourseToStructuredJSON, validateAndEnhanceCourse } from '@/lib/utils/courseBuilder';

// Search YouTube for video IDs
async function searchYouTubeVideoIds(query, apiKey, max = 3) {
  try {
    const params = new URLSearchParams({
      key: apiKey,
      q: query,
      part: 'snippet',
      type: 'video',
      maxResults: String(Math.min(Math.max(max, 1), 5)),
      safeSearch: 'moderate',
      videoEmbeddable: 'true', // Only embeddable videos
      videoSyndicated: 'true'  // Only syndicated videos
    });
    
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
    if (!res.ok) {
      console.error('YouTube API error:', res.status, res.statusText);
      return [];
    }
    
    const data = await res.json();
    const ids = (data.items || [])
      .map((item) => item?.id?.videoId)
      .filter(Boolean);
    
    return ids;
  } catch (e) {
    console.error('YouTube search error:', e);
    return [];
  }
}

// POST /api/courses/structured - Generate course in structured JSON format
export async function POST(request) {
  try {
    // Use Clerk authentication
    const { auth } = await import('@clerk/nextjs/server');
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      topic, 
      category = 'General',
      difficulty = 'Beginner',
      duration = '3-5 hours',
      moduleCount = 5,
      includeVideos = true
    } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    console.log('🚀 Generating structured course with OpenRouter:', { topic, category, difficulty });

    // Generate course using OpenRouter's specialized models
    const courseData = await generateCompleteCourse(
      topic,
      category,
      difficulty,
      true // includeQuiz
    );

    console.log('✅ OpenRouter course generation completed');

    // Validate and enhance the course structure
    const validatedCourse = validateAndEnhanceCourse(courseData);

    // Add YouTube videos if requested
    if (includeVideos && process.env.YOUTUBE_API_KEY) {
      console.log('Searching for YouTube videos...');
      
      for (const module of validatedCourse.modules) {
        try {
          // Search for videos using module title and topic
          const searchQuery = `${topic} ${module.title} tutorial ${difficulty.toLowerCase()}`;
          const videoIds = await searchYouTubeVideoIds(searchQuery, process.env.YOUTUBE_API_KEY, 3);
          
          if (videoIds.length > 0) {
            module.videos = videoIds.map((videoId, index) => ({
              title: `${module.title} - Video ${index + 1}`,
              embed_code: `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="${module.title} - Video ${index + 1}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
            }));
            
            console.log(`Found ${videoIds.length} videos for module: ${module.title}`);
          } else {
            module.videos = [];
            console.log(`No videos found for module: ${module.title}`);
          }
          
          // Small delay to respect API rate limits
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`Error searching videos for module ${module.title}:`, error);
          module.videos = [];
        }
      }
    } else {
      // Add empty videos array if not including videos
      validatedCourse.modules.forEach(module => {
        module.videos = [];
      });
    }

    // Return the structured JSON format
    const structuredResponse = {
      course_title: validatedCourse.course_title,
      overview: validatedCourse.overview,
      modules: validatedCourse.modules.map(module => ({
        title: module.title,
        description: module.description,
        objectives: module.objectives,
        videos: module.videos || []
      }))
    };

    return NextResponse.json(structuredResponse);

  } catch (error) {
    console.error('Error generating structured course:', error);
    return NextResponse.json({ 
      error: 'Failed to generate structured course: ' + error.message 
    }, { status: 500 });
  }
}