
/**
 * YouTube Video Cache (Course + Module Specific)
 * 
 * Cache key format: yt_videos:${userId}:${courseId}:${moduleIndex}:${hash(moduleTitle)}
 * TTL: 24 hours
 * 
 * ❗ NEVER cache by topic alone
 * ❗ NEVER share cache across users
 */

import crypto from 'crypto';

// In-memory cache for fast access (same pattern as courseCache.js)
const memoryCache = new Map();
const cacheTimestamps = new Map();

// Cache TTL: 24 hours
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_TTL_SECONDS = 24 * 60 * 60;

/**
 * Generate a short hash from a string
 * @param {string} str - String to hash
 * @returns {string} First 8 characters of SHA256 hash
 */
function shortHash(str) {
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 8);
}

/**
 * Generate cache key for video lookup
 * Format: yt_videos:${userId}:${courseId}:${moduleIndex}:${hash(moduleTitle)}
 * 
 * @param {string} userId - User ID for isolation
 * @param {string} courseId - Course ID (hash of topic + creation time)
 * @param {number} moduleIndex - 0-based module index
 * @param {string} moduleTitle - Module title for hashing
 * @returns {string} Cache key
 */
export function makeVideoCacheKey(userId, courseId, moduleIndex, moduleTitle) {
    const titleHash = shortHash(moduleTitle || 'untitled');
    return `yt_videos:${userId}:${courseId}:${moduleIndex}:${titleHash}`;
}

/**
 * Generate a unique course ID
 * @param {string} topic - Course topic
 * @param {number} timestamp - Creation timestamp (optional, defaults to now)
 * @returns {string} Course ID
 */
export function generateCourseId(topic, timestamp = Date.now()) {
    return shortHash(`${topic}:${timestamp}`);
}

/**
 * Check if cached entry is still valid (within TTL)
 * @param {string} key - Cache key
 * @returns {boolean}
 */
function isExpired(key) {
    const timestamp = cacheTimestamps.get(key);
    if (!timestamp) return true;
    return Date.now() - timestamp > CACHE_TTL_MS;
}

/**
 * Get cached videos for a module
 * @param {string} key - Cache key
 * @returns {Promise<Array|null>} Cached videos or null
 */
export async function getCachedVideos(key) {
    // Check memory cache first
    if (memoryCache.has(key) && !isExpired(key)) {
        console.log(`✅ Video Cache HIT (memory): ${key}`);
        return memoryCache.get(key);
    }

    // Try Redis if configured
    if (process.env.REDIS_URL) {
        try {
            const { default: redis } = await import('@/lib/redis');
            if (redis) {
                const cached = await redis.get(key);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    // Populate memory cache
                    memoryCache.set(key, parsed);
                    cacheTimestamps.set(key, Date.now());
                    console.log(`✅ Video Cache HIT (Redis): ${key}`);
                    return parsed;
                }
            }
        } catch (e) {
            console.log('Redis video cache check failed:', e.message);
        }
    }

    console.log(`❌ Video Cache MISS: ${key}`);
    return null;
}

/**
 * Store videos in cache
 * @param {string} key - Cache key
 * @param {Array} videos - Videos to cache
 */
export async function setCachedVideos(key, videos) {
    // Store in memory
    memoryCache.set(key, videos);
    cacheTimestamps.set(key, Date.now());
    console.log(`💾 Video Cache SET (memory): ${key}`);

    // Store in Redis if configured
    if (process.env.REDIS_URL) {
        try {
            const { default: redis } = await import('@/lib/redis');
            if (redis) {
                await redis.set(key, JSON.stringify(videos), 'EX', CACHE_TTL_SECONDS);
                console.log(`💾 Video Cache SET (Redis): ${key}`);
            }
        } catch (e) {
            console.log('Redis video cache set failed:', e.message);
        }
    }
}

/**
 * Invalidate all module video caches for a course
 * Called when a course is regenerated
 * 
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID to invalidate
 */
export async function invalidateCourseVideos(userId, courseId) {
    const prefix = `yt_videos:${userId}:${courseId}:`;

    // Clear from memory cache
    for (const key of memoryCache.keys()) {
        if (key.startsWith(prefix)) {
            memoryCache.delete(key);
            cacheTimestamps.delete(key);
        }
    }

    // Clear from Redis if configured
    if (process.env.REDIS_URL) {
        try {
            const { default: redis } = await import('@/lib/redis');
            if (redis) {
                // Use SCAN to find and delete matching keys
                const keys = await redis.keys(`${prefix}*`);
                if (keys.length > 0) {
                    await redis.del(...keys);
                    console.log(`🗑️ Invalidated ${keys.length} video cache entries for course ${courseId}`);
                }
            }
        } catch (e) {
            console.log('Redis video cache invalidation failed:', e.message);
        }
    }
}

/**
 * Get cache statistics
 */
export function getVideoCacheStats() {
    return {
        memoryEntries: memoryCache.size,
        keys: Array.from(memoryCache.keys()).slice(0, 10) // First 10 for debugging
    };
}
