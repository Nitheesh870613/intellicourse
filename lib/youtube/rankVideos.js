
/**
 * PHASE 4: RANKING (DETERMINISTIC)
 * 
 * Score formula: score = (views * 0.7) + (likes * 0.3)
 * Sort descending by score.
 * Return top 2 videos per module.
 */

/**
 * Rank videos by engagement score
 * @param {Array<object>} videos - Array of validated video objects from YouTube API
 * @returns {Array<object>} Top 2 ranked videos with embed-ready format
 */
export function rankVideos(videos) {
    if (!videos || !videos.length) return [];

    const ranked = videos
        .map(v => {
            const viewCount = Number(v.statistics?.viewCount || 0);
            const likeCount = Number(v.statistics?.likeCount || 0);

            // Deterministic score: (views * 0.7) + (likes * 0.3)
            const score = (viewCount * 0.7) + (likeCount * 0.3);

            return {
                videoId: v.id,
                title: v.snippet?.title || "Untitled Video",
                channel: v.snippet?.channelTitle || "Unknown Channel",
                views: viewCount,
                likes: likeCount,
                thumbnail: v.snippet?.thumbnails?.high?.url ||
                    v.snippet?.thumbnails?.medium?.url ||
                    v.snippet?.thumbnails?.default?.url,
                // Embed-ready URL (CORRECT format per spec)
                embedUrl: `https://www.youtube.com/embed/${v.id}`,
                score: score
            };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 2); // Top 2 per module as specified

    console.log(`📊 Phase 4: Ranked and selected top ${ranked.length} videos`);

    return ranked;
}
