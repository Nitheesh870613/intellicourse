/**
 * YouTube Video Metadata Fetcher
 * 
 * Fetches detailed statistics (views, likes, comments) for videos.
 */

/**
 * Get video metadata including statistics
 * @param {string[]} videoIds - Array of YouTube video IDs
 * @returns {Promise<Array>} - Array of video metadata objects
 */
export async function getVideoMetadata(videoIds) {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
        console.warn('YOUTUBE_API_KEY not configured');
        return [];
    }

    if (!videoIds || videoIds.length === 0) {
        return [];
    }

    try {
        const url = new URL('https://www.googleapis.com/youtube/v3/videos');
        url.searchParams.set('part', 'snippet,statistics,contentDetails');
        url.searchParams.set('id', videoIds.join(','));
        url.searchParams.set('key', apiKey);

        const response = await fetch(url.toString());

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('YouTube metadata error:', response.status, error);
            return [];
        }

        const data = await response.json();

        if (!data.items || !Array.isArray(data.items)) {
            return [];
        }

        return data.items.map(item => ({
            videoId: item.id,
            title: item.snippet?.title || 'Untitled',
            description: item.snippet?.description || '',
            channelTitle: item.snippet?.channelTitle || '',
            publishedAt: item.snippet?.publishedAt || null,
            thumbnail: item.snippet?.thumbnails?.medium?.url || null,
            duration: item.contentDetails?.duration || null,
            views: Number(item.statistics?.viewCount || 0),
            likes: Number(item.statistics?.likeCount || 0),
            comments: Number(item.statistics?.commentCount || 0),
        }));
    } catch (error) {
        console.error('YouTube metadata error:', error.message);
        return [];
    }
}
