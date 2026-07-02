/**
 * Analytics Cache - In-memory cache with 5-minute TTL
 * Prevents db_termination errors and repeated AI calls
 */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// In-memory cache store
const cache = new Map();

/**
 * Get cached analytics for a user
 * @param {string} userId - User ID (clerk ID or UUID)
 * @returns {object|null} - Cached data or null if expired/missing
 */
export function getCachedAnalytics(userId) {
    const cached = cache.get(userId);

    if (!cached) {
        return null;
    }

    // Check if cache has expired
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
        cache.delete(userId);
        return null;
    }

    return cached.data;
}

/**
 * Store analytics in cache
 * @param {string} userId - User ID
 * @param {object} data - Analytics data to cache
 */
export function setCachedAnalytics(userId, data) {
    cache.set(userId, {
        data,
        timestamp: Date.now()
    });
}

/**
 * Invalidate cache for a user (call when user data changes)
 * @param {string} userId - User ID
 */
export function invalidateCache(userId) {
    cache.delete(userId);
}

/**
 * Clear entire cache (for debugging/testing)
 */
export function clearAllCache() {
    cache.clear();
}

/**
 * Get cache stats (for debugging)
 */
export function getCacheStats() {
    return {
        size: cache.size,
        ttlMs: CACHE_TTL_MS,
        entries: Array.from(cache.keys())
    };
}
