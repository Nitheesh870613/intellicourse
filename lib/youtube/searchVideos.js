
/**
 * PHASE 1: SEARCH (IDs ONLY)
 * 
 * Fetches 20-25 video IDs from YouTube Data API.
 * Returns only video IDs - NO titles, URLs, or thumbnails.
 * 
 * Parameters:
 * - SafeSearch = strict
 * - type = video
 * - order = relevance
 * - regionCode = IN
 * - videoDuration = medium
 */

/**
 * Search YouTube for video IDs only
 * @param {string} courseTitle - The course title
 * @param {string} moduleTitle - The module title  
 * @returns {Promise<Array<{videoId: string}>>} Array of video ID objects
 */
export async function searchYouTubeIds(courseTitle, moduleTitle) {
    if (!process.env.YOUTUBE_API_KEY) {
        console.error("❌ Missing YOUTUBE_API_KEY");
        return [];
    }

    // Build query as specified: ${courseTitle} ${moduleTitle} tutorial
    const query = `${courseTitle} ${moduleTitle} tutorial`.trim();

    try {
        const res = await fetch(
            "https://www.googleapis.com/youtube/v3/search?" +
            new URLSearchParams({
                part: "id",
                q: query,
                type: "video",
                maxResults: "25",
                safeSearch: "strict",
                order: "relevance",
                regionCode: "IN",
                videoDuration: "medium",
                key: process.env.YOUTUBE_API_KEY,
            })
        );

        if (!res.ok) {
            console.error(`❌ YouTube Search Error: ${res.statusText}`);
            return [];
        }

        const data = await res.json();

        // Return only videoId objects as specified
        const videoIds = data.items
            ?.map(item => ({ videoId: item.id?.videoId }))
            .filter(item => item.videoId) || [];

        console.log(`🔍 Phase 1: Found ${videoIds.length} video IDs for "${query}"`);
        return videoIds;
    } catch (error) {
        console.error("❌ YouTube Search Failed:", error);
        return [];
    }
}
