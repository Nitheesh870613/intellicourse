import { google } from 'googleapis';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Initialize YouTube API client
const youtube = google.youtube({
  version: 'v3',
  auth: YOUTUBE_API_KEY
});

// Call GROQ API
async function callGroq(messages, temperature = 0.7) {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      throw new Error(`GROQ API error: ${await response.text()}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('GROQ API call failed:', error);
    throw error;
  }
}

// Step 1: Generate YouTube search queries using AI
async function generateSearchQueries(moduleContent, moduleTitle) {
  const messages = [
    {
      role: 'system',
      content: 'You are a research assistant who is an expert at finding the perfect educational YouTube video. You only output JSON.'
    },
    {
      role: 'user',
      content: `Based on the following module content, generate 3 highly specific, effective YouTube search queries that would find short (5-15 min) video supplements for this content.

MODULE TITLE: ${moduleTitle}

MODULE CONTENT (first 1000 chars):
"""
${moduleContent.substring(0, 1000)}
"""

Requirements:
- Queries should be specific and targeted
- Focus on educational, tutorial-style videos
- Prefer concise, beginner-friendly content
- Include key technical terms from the module

Output *only* a valid JSON object:
{"queries": ["query 1", "query 2", "query 3"]}`
    }
  ];

  const response = await callGroq(messages, 0.7);
  
  // Clean and parse JSON
  let jsonStr = response.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```\n?/g, '');
  }
  
  const data = JSON.parse(jsonStr);
  return data.queries;
}

// Step 2: Search YouTube for videos
async function searchYouTube(query, maxResults = 3) {
  try {
    const response = await youtube.search.list({
      part: ['snippet'],
      q: query,
      type: ['video'],
      maxResults,
      videoDefinition: 'any',
      videoDuration: 'medium', // 4-20 minutes
      relevanceLanguage: 'en',
      safeSearch: 'strict',
      order: 'relevance'
    });

    return response.data.items.map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      thumbnailUrl: item.snippet.thumbnails.medium.url
    }));
  } catch (error) {
    console.error('YouTube search error:', error);
    throw error;
  }
}

// Step 3: Get video statistics (optional - for better ranking)
async function getVideoStatistics(videoIds) {
  try {
    const response = await youtube.videos.list({
      part: ['statistics', 'contentDetails'],
      id: videoIds
    });

    return response.data.items.map(item => ({
      videoId: item.id,
      viewCount: parseInt(item.statistics.viewCount),
      likeCount: parseInt(item.statistics.likeCount),
      duration: item.contentDetails.duration
    }));
  } catch (error) {
    console.error('Video statistics error:', error);
    return [];
  }
}

// Parse ISO 8601 duration to seconds
function parseDuration(duration) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = (match[1] || '').replace('H', '');
  const minutes = (match[2] || '').replace('M', '');
  const seconds = (match[3] || '').replace('S', '');
  
  return (parseInt(hours) || 0) * 3600 + 
         (parseInt(minutes) || 0) * 60 + 
         (parseInt(seconds) || 0);
}

// Step 4: Use AI to validate and select the best video
async function selectBestVideo(moduleContent, moduleTitle, videoCandidates) {
  // Filter videos by duration (5-20 minutes)
  const validVideos = videoCandidates.filter(video => {
    if (!video.duration) return true; // Include if duration unknown
    const seconds = parseDuration(video.duration);
    return seconds >= 300 && seconds <= 1200; // 5-20 minutes
  });

  if (validVideos.length === 0) {
    console.log('No valid videos found within duration range');
    return null;
  }

  const candidatesJson = JSON.stringify(
    validVideos.map(v => ({
      videoId: v.videoId,
      title: v.title,
      description: v.description.substring(0, 200),
      channelTitle: v.channelTitle,
      viewCount: v.viewCount
    })),
    null,
    2
  );

  const messages = [
    {
      role: 'system',
      content: 'You are a content curator. Your job is to select the *single best* video from a list that matches the provided module text. You must output *only* the videoId of your choice as a plain string.'
    },
    {
      role: 'user',
      content: `I need to find the *best* supplementary video for this module:

MODULE TITLE: ${moduleTitle}

MODULE CONTENT (first 800 chars):
"""
${moduleContent.substring(0, 800)}
"""

Here is a list of candidate videos (with their titles and descriptions):

CANDIDATES (as JSON):
${candidatesJson}

Review the list carefully. Consider:
1. Relevance to the module content
2. Educational quality (based on title/description)
3. Video length (prefer 5-15 minute videos)
4. Channel credibility

Return the videoId of the *single best* match for the module text. 
Output *only* the chosen videoId as a plain string (no quotes, no JSON, just the ID).`
    }
  ];

  const response = await callGroq(messages, 0.3); // Low temperature for consistency
  const videoId = response.trim().replace(/['"]/g, '');
  
  // Validate that the returned videoId exists in our candidates
  const selectedVideo = validVideos.find(v => v.videoId === videoId);
  
  if (!selectedVideo) {
    console.warn('AI selected invalid videoId, falling back to first candidate');
    return validVideos[0]?.videoId || null;
  }
  
  return videoId;
}

// Main function: Find the best video for a module
export async function findBestVideo(moduleContent, moduleTitle) {
  try {
    console.log(`🎥 Finding best video for: ${moduleTitle}`);
    
    // Step 1: Generate search queries using AI
    console.log('  📝 Step 1: Generating search queries...');
    const queries = await generateSearchQueries(moduleContent, moduleTitle);
    console.log(`  ✅ Generated ${queries.length} search queries:`, queries);
    
    // Step 2: Search YouTube for each query
    console.log('  🔍 Step 2: Searching YouTube...');
    const searchPromises = queries.map(query => searchYouTube(query, 3));
    const searchResults = await Promise.all(searchPromises);
    
    // Flatten and deduplicate results
    const allVideos = searchResults.flat();
    const uniqueVideos = Array.from(
      new Map(allVideos.map(v => [v.videoId, v])).values()
    );
    
    console.log(`  ✅ Found ${uniqueVideos.length} unique video candidates`);
    
    if (uniqueVideos.length === 0) {
      console.log('  ⚠️ No videos found');
      return null;
    }
    
    // Step 3: Get video statistics
    console.log('  📊 Step 3: Fetching video statistics...');
    const videoIds = uniqueVideos.map(v => v.videoId);
    const statistics = await getVideoStatistics(videoIds);
    
    // Merge statistics with video data
    const enrichedVideos = uniqueVideos.map(video => {
      const stats = statistics.find(s => s.videoId === video.videoId);
      return {
        ...video,
        ...stats
      };
    });
    
    // Step 4: Use AI to select the best video
    console.log('  🤖 Step 4: AI selecting best video...');
    const selectedVideoId = await selectBestVideo(
      moduleContent,
      moduleTitle,
      enrichedVideos
    );
    
    if (!selectedVideoId) {
      console.log('  ⚠️ AI could not select a video');
      return null;
    }
    
    const selectedVideo = enrichedVideos.find(v => v.videoId === selectedVideoId);
    console.log(`  ✅ Selected video: ${selectedVideo?.title}`);
    
    return {
      videoId: selectedVideoId,
      url: `https://www.youtube.com/watch?v=${selectedVideoId}`,
      embedUrl: `https://www.youtube.com/embed/${selectedVideoId}`,
      title: selectedVideo.title,
      description: selectedVideo.description,
      channelTitle: selectedVideo.channelTitle,
      thumbnailUrl: selectedVideo.thumbnailUrl,
      viewCount: selectedVideo.viewCount,
      duration: selectedVideo.duration
    };
    
  } catch (error) {
    console.error('Video curation error:', error);
    return null; // Return null on error, don't fail the whole module
  }
}

// Batch process videos for multiple modules
export async function findVideosForModules(modules) {
  console.log(`🎬 Finding videos for ${modules.length} modules...`);
  
  const results = await Promise.all(
    modules.map(async (module) => {
      try {
        const video = await findBestVideo(module.content, module.title);
        return {
          moduleId: module.id,
          video
        };
      } catch (error) {
        console.error(`Failed to find video for module ${module.id}:`, error);
        return {
          moduleId: module.id,
          video: null
        };
      }
    })
  );
  
  console.log(`✅ Video curation complete. Found ${results.filter(r => r.video).length} videos.`);
  
  return results;
}
