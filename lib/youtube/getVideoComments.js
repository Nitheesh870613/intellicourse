/**
 * YouTube Comments Fetcher
 * 
 * Fetches top comments for sentiment analysis.
 */

/**
 * Get top comments for a video
 * @param {string} videoId - YouTube video ID
 * @param {number} maxComments - Maximum comments to fetch (default: 5)
 * @returns {Promise<string[]>} - Array of comment texts
 */
export async function getTopComments(videoId, maxComments = 5) {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
        console.warn('YOUTUBE_API_KEY not configured');
        return [];
    }

    if (!videoId) {
        return [];
    }

    try {
        const url = new URL('https://www.googleapis.com/youtube/v3/commentThreads');
        url.searchParams.set('part', 'snippet');
        url.searchParams.set('videoId', videoId);
        url.searchParams.set('maxResults', String(maxComments));
        url.searchParams.set('order', 'relevance');
        url.searchParams.set('key', apiKey);

        const response = await fetch(url.toString());

        if (!response.ok) {
            // Comments may be disabled for this video
            return [];
        }

        const data = await response.json();

        if (!data.items || !Array.isArray(data.items)) {
            return [];
        }

        return data.items.map(item => {
            const comment = item.snippet?.topLevelComment?.snippet;
            return comment?.textDisplay || comment?.textOriginal || '';
        }).filter(Boolean);
    } catch (error) {
        // Comments may be disabled or unavailable
        console.log(`Comments unavailable for ${videoId}`);
        return [];
    }
}
