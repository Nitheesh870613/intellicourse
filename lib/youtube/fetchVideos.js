/**
 * YouTube Video Fetcher
 * 
 * Fetches real YouTube videos using the YouTube Data API v3.
 * Returns embeddable video URLs for course modules.
 */

/**
 * Fetch YouTube videos for a given search query
 * @param {string} query - Search query (e.g., module title + topic)
 * @param {number} maxResults - Maximum number of videos to return (default: 3)
 * @returns {Promise<Array<{title: string, url: string}>>} - Array of video objects
 */
export async function fetchYouTubeVideos(query, maxResults = 3) {
    try {
        const apiKey = process.env.YOUTUBE_API_KEY;

        if (!apiKey) {
            console.warn('YOUTUBE_API_KEY not configured - skipping video fetch');
            return [];
        }

        const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
        searchUrl.searchParams.set('part', 'snippet');
        searchUrl.searchParams.set('q', query);
        searchUrl.searchParams.set('maxResults', String(maxResults));
        searchUrl.searchParams.set('key', apiKey);
        searchUrl.searchParams.set('type', 'video');
        searchUrl.searchParams.set('videoEmbeddable', 'true');
        searchUrl.searchParams.set('safeSearch', 'strict');

        const response = await fetch(searchUrl.toString());

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('YouTube API error:', response.status, errorData);
            return [];
        }

        const data = await response.json();

        if (!data.items || !Array.isArray(data.items)) {
            return [];
        }

        return data.items.map(item => ({
            title: item.snippet?.title || 'Untitled Video',
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            thumbnail: item.snippet?.thumbnails?.medium?.url || null,
            channelTitle: item.snippet?.channelTitle || '',
        }));
    } catch (error) {
        console.error('YouTube fetch error:', error.message);
        return [];
    }
}

/**
 * Convert a regular YouTube URL to an embed URL
 * @param {string} url - YouTube watch URL
 * @returns {string} - Embed URL
 */
export function getEmbedUrl(url) {
    if (!url) return '';

    // Already an embed URL
    if (url.includes('/embed/')) {
        return url;
    }

    // Standard watch URL
    if (url.includes('watch?v=')) {
        return url.replace('watch?v=', 'embed/');
    }

    // Short URL (youtu.be)
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) {
        return `https://www.youtube.com/embed/${shortMatch[1]}`;
    }

    // Try to extract video ID from any URL format
    const idMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (idMatch) {
        return `https://www.youtube.com/embed/${idMatch[1]}`;
    }

    return url;
}

/**
 * Validate and fix YouTube URLs in a videos array
 * @param {Array} videos - Array of video objects with url property
 * @returns {Array} - Array with validated/fixed URLs
 */
export function validateVideoUrls(videos) {
    if (!Array.isArray(videos)) return [];

    return videos
        .filter(v => v && v.url)
        .map(v => ({
            ...v,
            url: v.url,
            embedUrl: getEmbedUrl(v.url),
        }));
}

/**
 * Fetch videos for a module if not already present
 * @param {object} module - Module object with title
 * @param {string} courseTopic - Course topic for better search results
 * @returns {Promise<Array>} - Videos array
 */
export async function ensureModuleVideos(module, courseTopic = '') {
    // If module already has valid videos, return them
    if (module.videos && Array.isArray(module.videos) && module.videos.length > 0) {
        // Validate existing videos
        const valid = module.videos.filter(v => v && v.url && v.url.includes('youtube'));
        if (valid.length > 0) {
            return validateVideoUrls(valid);
        }
    }

    // Fetch new videos based on module title
    const searchQuery = courseTopic
        ? `${module.title} ${courseTopic} tutorial`
        : `${module.title} tutorial explanation`;

    const videos = await fetchYouTubeVideos(searchQuery, 3);
    return validateVideoUrls(videos);
}
