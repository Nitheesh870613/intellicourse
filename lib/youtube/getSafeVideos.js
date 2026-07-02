
/**
 * PHASE 5: SAFE ORCHESTRATION
 * 
 * Pipeline:
 * searchVideos → validateVideos → embedProbe → rankVideos → select top 2
 * 
 * If < 2 valid videos:
 * { "videos": [], "status": "NO_SAFE_VIDEOS" }
 * 
 * Cache key format: yt_videos:${userId}:${courseId}:${moduleIndex}:${hash(moduleTitle)}
 * TTL: 24 hours
 */

import { searchYouTubeIds } from "./searchVideos";
import { validateByAPI } from "./validateVideos";
import { batchEmbedProbe } from "./embedProbe";
import { rankVideos } from "./rankVideos";
import {
    makeVideoCacheKey,
    getCachedVideos,
    setCachedVideos
} from "./videoCache";

/**
 * Get safe, verified YouTube videos for a module
 * 
 * @param {string} courseTitle - The course title
 * @param {string} moduleTitle - The module title
 * @param {object} context - Context for caching
 * @param {string} context.userId - User ID for cache isolation
 * @param {string} context.courseId - Course ID for cache isolation
 * @param {number} context.moduleIndex - 0-based module index
 * @returns {Promise<{videos: Array, status: string}>} Result with videos and status
 */
export async function getSafeYouTubeVideos(courseTitle, moduleTitle, context = {}) {
    const { userId = 'anonymous', courseId = 'default', moduleIndex = 0 } = context;

    console.log(`🔍 Pipeline Start: "${courseTitle} - ${moduleTitle}" (User: ${userId}, Course: ${courseId}, Module: ${moduleIndex})`);

    // Step 0: Check cache first
    const cacheKey = makeVideoCacheKey(userId, courseId, moduleIndex, moduleTitle);
    const cached = await getCachedVideos(cacheKey);

    if (cached && cached.length > 0) {
        return {
            videos: cached,
            status: "OK",
            cached: true
        };
    }

    // Phase 1: Search (get 25 video IDs)
    const videoIds = await searchYouTubeIds(courseTitle, moduleTitle);

    if (videoIds.length === 0) {
        console.log(`⚠️ Phase 1 Failed: No video IDs found`);
        return getNoVideosResponse();
    }

    // Phase 2: API Validation (strict metadata checks)
    const apiValidated = await validateByAPI(videoIds);

    if (apiValidated.length === 0) {
        console.log(`⚠️ Phase 2 Failed: All videos rejected by validation`);
        return getNoVideosResponse();
    }

    // Phase 3: Limit candidates to top 10 to avoid throttling
    const candidates = apiValidated.slice(0, 10);

    // Phase 4: Embed Probe (verify actual playability)
    const embedValidated = await batchEmbedProbe(candidates);

    if (embedValidated.length === 0) {
        console.log(`⚠️ Phase 3 Failed: All videos failed embed probe`);
        return getNoVideosResponse();
    }

    // Phase 5: Rank and select top 2
    const rankedVideos = rankVideos(embedValidated);

    if (rankedVideos.length === 0) {
        console.log(`⚠️ Phase 4 Failed: No videos after ranking`);
        return getNoVideosResponse();
    }

    // Store in cache
    await setCachedVideos(cacheKey, rankedVideos);

    console.log(`✅ Pipeline Complete: ${rankedVideos.length} verified videos for module ${moduleIndex}`);

    return {
        videos: rankedVideos,
        status: "OK",
        cached: false
    };
}

/**
 * Get response for when no safe videos are available
 * @returns {{videos: Array, status: string}}
 */
function getNoVideosResponse() {
    return {
        videos: [],
        status: "NO_SAFE_VIDEOS"
    };
}

/**
 * Legacy wrapper for backwards compatibility
 * Maps old single-query signature to new context-aware signature
 * 
 * @deprecated Use getSafeYouTubeVideos with context instead
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of videos (legacy format)
 */
export async function getSafeYouTubeVideosLegacy(query) {
    const result = await getSafeYouTubeVideos(query, query, {
        userId: 'legacy',
        courseId: 'legacy',
        moduleIndex: 0
    });

    // Convert to legacy format
    if (result.status === "NO_SAFE_VIDEOS" || result.videos.length === 0) {
        return [{
            title: "No verified videos available for this module yet.",
            url: null
        }];
    }

    // Map to legacy format
    return result.videos.map(v => ({
        title: v.title,
        url: `https://www.youtube.com/watch?v=${v.videoId}`,
        embedUrl: v.embedUrl,
        channelTitle: v.channel,
        views: v.views,
        likes: v.likes,
        thumbnail: v.thumbnail
    }));
}
