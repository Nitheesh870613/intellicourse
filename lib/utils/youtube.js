/**
 * YouTube URL validation and utility functions
 */

/**
 * Validates if a URL is a valid YouTube URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if valid YouTube URL
 */
export function isValidYouTubeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;
  return youtubeRegex.test(url);
}

/**
 * Extracts video ID from YouTube URL
 * @param {string} url - YouTube URL
 * @returns {string|null} - Video ID or null if invalid
 */
export function extractYouTubeVideoId(url) {
  if (!isValidYouTubeUrl(url)) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

/**
 * Converts YouTube URL to embed URL
 * @param {string} url - YouTube URL
 * @returns {string|null} - Embed URL or null if invalid
 */
export function getYouTubeEmbedUrl(url) {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Validates an array of YouTube URLs
 * @param {string[]} urls - Array of URLs to validate
 * @returns {object} - { valid: string[], invalid: string[] }
 */
export function validateYouTubeUrls(urls) {
  if (!Array.isArray(urls)) return { valid: [], invalid: [] };
  
  const valid = [];
  const invalid = [];
  
  urls.forEach(url => {
    if (isValidYouTubeUrl(url)) {
      valid.push(url);
    } else {
      invalid.push(url);
    }
  });
  
  return { valid, invalid };
}

/**
 * Normalizes YouTube URLs to a consistent format
 * @param {string[]} urls - Array of YouTube URLs
 * @returns {string[]} - Array of normalized URLs
 */
export function normalizeYouTubeUrls(urls) {
  if (!Array.isArray(urls)) return [];
  
  return urls
    .filter(url => isValidYouTubeUrl(url))
    .map(url => {
      const videoId = extractYouTubeVideoId(url);
      return videoId ? `https://www.youtube.com/watch?v=${videoId}` : url;
    })
    .filter((url, index, array) => array.indexOf(url) === index); // Remove duplicates
}

