import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Enhanced AI Course Generator API
 * 
 * Generates comprehensive course content with:
 * 1. Level-based content depth (Beginner/Intermediate/Advanced)
 * 2. Structured modules with key points, explanations, and examples
 * 3. YouTube video integration with search optimization
 * 4. Exportable note-style content
 */

// Search YouTube for educational videos
async function searchYouTubeVideos(query, apiKey, maxResults = 2) {
  try {
    const params = new URLSearchParams({
      key: apiKey,
      q: query,
      part: 'snippet',
      type: 'video',
      maxResults: String(maxResults),
      safeSearch: 'moderate',
      // Optimize for educational content
      videoDuration: 'medium', // 4-20 minutes
      videoDefinition: 'high',
      order: 'relevance'
    });

    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
    if (!response.ok) return [];

    const data = await response.json();
    return (data.items || []).map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail: item.snippet.thumbnails?.medium?.url,
      channelTitle: item.snippet.channelTitle,
      description: item.snippet.description
    }));
  } catch (error) {
    console.error('YouTube search error:', error);
    return [];
  }
}

// Generate level-specific prompts for different difficulty levels
function generateLevelPrompt(topic, level) {
  const basePrompt = `Generate a comprehensive course on "${topic}" for ${level} level learners.`;
  
  const levelSpecificInstructions = {
    'Beginner': `
      - Use simple, clear language that anyone can understand
      - Focus on fundamental concepts and basic understanding
      - Include plenty of real-world analogies and simple examples
      - Avoid technical jargon, or explain it clearly when necessary
      - Structure content to build confidence and understanding gradually
      - Provide practical, hands-on examples that beginners can follow
    `,
    'Intermediate': `
      - Include technical details and industry terminology
      - Add practical applications and real-world use cases
      - Include formulas, processes, and methodologies where relevant
      - Assume some prior knowledge but explain advanced concepts clearly
      - Focus on practical skills and implementation details
      - Include best practices and common pitfalls to avoid
    `,
    'Advanced': `
      - Use professional terminology and advanced concepts
      - Include complex examples, case studies, and research findings
      - Discuss cutting-edge developments and future trends
      - Assume strong foundational knowledge
      - Focus on optimization, advanced techniques, and expert-level insights
      - Include theoretical foundations and mathematical concepts where applicable
    `
  };

  return basePrompt + levelSpecificInstructions[level];
}

// Main course generation function with enhanced AI prompting
async function generateCourseWithAI(topic, level, includeVideos, preferredLanguage) {
  console.log('Generating enhanced course:', { topic, level, includeVideos, preferredLanguage });

  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  try {
    const levelPrompt = generateLevelPrompt(topic, level);
    
    // Enhanced prompt for structured course generation
    const prompt = `${levelPrompt}

Create a comprehensive course with the following JSON structure:

{
  "title": "Engaging course title appropriate for ${level} level",
  "overview": "2-3 sentence course overview explaining what students will learn and achieve",
  "level": "${level}",
  "estimatedDuration": "Realistic time estimate (e.g., '4-6 hours', '2-3 weeks')",
  "modules": [
    {
      "id": "module-1",
      "title": "Module title",
      "description": "Brief module description (1-2 sentences)",
      "keyPoints": [
        "Specific learning point 1",
        "Specific learning point 2",
        "Specific learning point 3",
        "Specific learning point 4"
      ],
      "explanation": "Detailed explanation (5-8 sentences) covering the module content in depth. Adjust complexity based on ${level} level. Include relevant details, processes, and concepts that students need to understand.",
      "example": "Practical example or analogy that helps explain the concept. Make it relatable and easy to understand for ${level} learners.",
      "videoSearchTerms": "Specific search terms for finding relevant YouTube videos about this module"
    }
  ]
}

Requirements:
- Generate 4-6 modules that logically progress from basic to advanced concepts
- Each module should build upon previous knowledge
- Adjust explanation depth and complexity for ${level} level learners
- Include practical examples and analogies appropriate for the level
- Make keyPoints specific and actionable
- Ensure explanations are educational and comprehensive
- Include video search terms that will find relevant educational content

Topic: ${topic}
Level: ${level}

Return ONLY valid JSON, no additional text.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('Gemini response received, parsing...');

    // Parse JSON response
    let courseData;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        courseData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      throw new Error('Failed to parse AI response');
    }

    // Validate response structure
    if (!courseData.title || !courseData.modules || !Array.isArray(courseData.modules)) {
      throw new Error('Invalid course structure from AI');
    }

    // Add YouTube videos if requested
    if (includeVideos && process.env.YOUTUBE_API_KEY) {
      console.log('Adding YouTube videos to modules...');
      
      for (const module of courseData.modules) {
        try {
          // Create enhanced search queries for better video discovery
          const searchQueries = [
            module.videoSearchTerms || `${topic} ${module.title}`,
            `${topic} tutorial ${level.toLowerCase()}`,
            `learn ${topic} ${module.title.replace(/^Module \d+:?\s*/, '')}`
          ];

          let videos = [];
          for (const query of searchQueries) {
            if (videos.length < 2) { // Limit to 2 videos per module
              const searchResults = await searchYouTubeVideos(query, process.env.YOUTUBE_API_KEY, 2 - videos.length);
              videos = [...videos, ...searchResults];
            }
          }

          // Remove duplicates and limit to 2 videos
          const uniqueVideos = videos.filter((video, index, arr) => 
            arr.findIndex(v => v.id === video.id) === index
          ).slice(0, 2);

          if (uniqueVideos.length > 0) {
            module.videos = uniqueVideos;
          }
        } catch (videoError) {
          console.warn(`Failed to add videos for module ${module.title}:`, videoError);
        }
      }
    }

    return courseData;

  } catch (error) {
    console.error('Course generation error:', error);
    throw error;
  }
}

// POST endpoint for course generation
export async function POST(request) {
  try {
    const { 
      topic, 
      level = 'Beginner',
      includeVideos = true,
      preferredLanguage = 'auto'
    } = await request.json();

    if (!topic || !topic.trim()) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Validate level
    const validLevels = ['Beginner', 'Intermediate', 'Advanced'];
    if (!validLevels.includes(level)) {
      return NextResponse.json({ error: 'Invalid difficulty level' }, { status: 400 });
    }

    console.log('Starting enhanced course generation:', { topic, level, includeVideos });

    const courseData = await generateCourseWithAI(topic, level, includeVideos, preferredLanguage);

    // Add metadata for export functionality
    courseData.metadata = {
      generatedAt: new Date().toISOString(),
      level: level,
      topic: topic,
      includeVideos: includeVideos,
      preferredLanguage: preferredLanguage
    };

    console.log('Course generation completed successfully');
    return NextResponse.json(courseData);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate course' }, 
      { status: 500 }
    );
  }
}
