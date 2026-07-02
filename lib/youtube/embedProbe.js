
/**
 * PHASE 3: EMBED PROBE (CRITICAL FIX)
 * 
 * For each validated video, probes the embed URL to detect:
 * - "Video unavailable"
 * - "This video is private"
 * - "Playback restricted"
 * - HTTP 403 / 410 responses
 * 
 * This eliminates unavailable embeds permanently.
 * Results are cached for 24 hours.
 */

import { cache } from "@/lib/cache";

const EMBED_FAILURE_MARKERS = [
    "Video unavailable",
    "This video is unavailable",
    "This video is private",
    "Playback on other websites has been disabled",
    "Playback restricted",
    "Sign in to confirm your age",
    "Post-live processing",
    "This video has been removed",
    "This video is no longer available"
];

/**
 * Probe a YouTube embed URL to verify playability
 * @param {string} videoId - The YouTube video ID
 * @returns {Promise<boolean>} True if video is playable, false otherwise
 */
export async function embedProbe(videoId) {
    if (!videoId) return false;

    const CACHE_KEY = `yt_embed_ok:${videoId}`;
    const TTL_SECONDS = 60 * 60 * 24; // 24 hours

    // 1. Check Cache first
    try {
        const cached = await cache.get(CACHE_KEY);
        if (cached !== null) {
            return cached === true;
        }
    } catch (e) {
        // Cache miss or error, proceed with probe
    }

    // 2. Probe the embed URL
    try {
        const res = await fetch(
            `https://www.youtube.com/embed/${videoId}`,
            {
                method: "GET",
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.5"
                }
            }
        );

        // Check for HTTP error codes (403, 410, etc.)
        if (!res.ok) {
            console.log(`🚫 Probe Failed [${videoId}]: HTTP ${res.status}`);
            await cache.set(CACHE_KEY, false, TTL_SECONDS);
            return false;
        }

        // Specifically handle 403 Forbidden and 410 Gone
        if (res.status === 403 || res.status === 410) {
            console.log(`🚫 Probe Failed [${videoId}]: HTTP ${res.status} (Forbidden/Gone)`);
            await cache.set(CACHE_KEY, false, TTL_SECONDS);
            return false;
        }

        const html = await res.text();

        // 3. Detect failure markers in HTML
        const isUnavailable = EMBED_FAILURE_MARKERS.some(
            marker => html.includes(marker)
        );

        const isValid = !isUnavailable;

        // 4. Cache the result
        await cache.set(CACHE_KEY, isValid, TTL_SECONDS);

        if (!isValid) {
            // Find which marker triggered the rejection for debugging
            const matchedMarker = EMBED_FAILURE_MARKERS.find(m => html.includes(m));
            console.log(`🚫 Probe Failed [${videoId}]: "${matchedMarker}"`);
        }

        return isValid;
    } catch (error) {
        console.error(`⚠️ Probe Error [${videoId}]:`, error.message);
        // On network error, treat as fail for safety
        // Don't cache network errors - they might be temporary
        return false;
    }
}

/**
 * Batch probe multiple videos
 * @param {Array<object>} videos - Array of video objects with 'id' field
 * @returns {Promise<Array<object>>} Videos that passed embed probing
 */
export async function batchEmbedProbe(videos) {
    if (!videos || videos.length === 0) return [];

    const results = [];

    for (const video of videos) {
        const videoId = video.id;
        const isValid = await embedProbe(videoId);

        if (isValid) {
            results.push(video);
        }
    }

    console.log(`🎥 Phase 3: Embed verified ${results.length}/${videos.length} videos`);
    return results;
}
