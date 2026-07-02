
/**
 * PHASE 2: METADATA VALIDATION
 * 
 * For each videoId, validates:
 * - status.embeddable === true
 * - status.privacyStatus === "public"
 * - contentDetails.regionRestriction NOT blocking IN
 * - statistics.viewCount > 1000
 * - NOT liveStream (liveBroadcastContent !== "live" or "upcoming")
 * - NOT ageRestricted
 * 
 * Rejects videos failing any rule.
 */

/**
 * Validate videos via YouTube Data API
 * @param {Array<{videoId: string}>} videoIdObjects - Array of videoId objects from search
 * @returns {Promise<Array>} Array of validated video objects with full metadata
 */
export async function validateByAPI(videoIdObjects) {
    if (!videoIdObjects || !videoIdObjects.length) return [];
    if (!process.env.YOUTUBE_API_KEY) return [];

    // Extract just the IDs
    const videoIds = videoIdObjects.map(obj => obj.videoId).filter(Boolean);
    if (videoIds.length === 0) return [];

    try {
        const res = await fetch(
            "https://www.googleapis.com/youtube/v3/videos?" +
            new URLSearchParams({
                part: "snippet,status,statistics,contentDetails",
                id: videoIds.join(","),
                key: process.env.YOUTUBE_API_KEY,
            })
        );

        if (!res.ok) {
            console.error(`❌ YouTube Validation Error: ${res.statusText}`);
            return [];
        }

        const data = await res.json();
        if (!data.items) return [];

        const validatedVideos = [];
        const rejectedCount = { total: 0, reasons: {} };

        for (const video of data.items) {
            const status = video.status || {};
            const details = video.contentDetails || {};
            const stats = video.statistics || {};
            const snippet = video.snippet || {};
            const contentRating = details.contentRating || {};

            const reasons = [];

            // Rule 1: Must be embeddable
            if (status.embeddable !== true) {
                reasons.push("not embeddable");
            }

            // Rule 2: Must be public
            if (status.privacyStatus !== "public") {
                reasons.push("not public");
            }

            // Rule 3: Region restriction check - must be available in IN (India)
            if (details.regionRestriction) {
                const blocked = details.regionRestriction.blocked || [];
                const allowed = details.regionRestriction.allowed || [];

                // If blocked list exists and includes IN, reject
                if (blocked.includes("IN")) {
                    reasons.push("blocked in IN region");
                }

                // If allowed list exists and doesn't include IN, reject
                if (allowed.length > 0 && !allowed.includes("IN")) {
                    reasons.push("not allowed in IN region");
                }
            }

            // Rule 4: View count must be > 1000
            const viewCount = Number(stats.viewCount || 0);
            if (viewCount <= 1000) {
                reasons.push(`low views (${viewCount})`);
            }

            // Rule 5: Not a live stream
            if (snippet.liveBroadcastContent && snippet.liveBroadcastContent !== "none") {
                reasons.push(`live broadcast (${snippet.liveBroadcastContent})`);
            }

            // Rule 6: Not age restricted
            if (contentRating.ytRating === "ytAgeRestricted") {
                reasons.push("age restricted");
            }

            // Rule 7: Block YouTube Shorts (defense in depth)
            const title = (snippet.title || "").toLowerCase();
            const description = (snippet.description || "").toLowerCase();
            if (title.includes("#shorts") || description.includes("#shorts")) {
                reasons.push("YouTube Short");
            }

            // Decision
            if (reasons.length === 0) {
                validatedVideos.push(video);
            } else {
                rejectedCount.total++;
                reasons.forEach(r => {
                    rejectedCount.reasons[r] = (rejectedCount.reasons[r] || 0) + 1;
                });

                if (process.env.NODE_ENV === "development") {
                    console.log(`🚫 Rejected [${video.id}]: ${reasons.join(", ")}`);
                }
            }
        }

        console.log(`✨ Phase 2: Validated ${validatedVideos.length}/${data.items.length} videos`);

        if (rejectedCount.total > 0 && process.env.NODE_ENV === "development") {
            console.log(`   Rejection breakdown:`, rejectedCount.reasons);
        }

        return validatedVideos;
    } catch (error) {
        console.error("❌ YouTube Validation Failed:", error);
        return [];
    }
}
