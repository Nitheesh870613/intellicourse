/**
 * Course Generation Cache
 * 
 * Implements a hybrid caching system:
 * 1. In-memory Map (ultra-fast for hot data)
 * 2. Optional Redis (persists across restarts)
 * 
 * Prevents duplicate LLM calls and DB entries for identical course requests.
 */

import crypto from 'crypto';

// In-memory cache for fast access
const memoryCache = new Map();

// Cache TTL in milliseconds (24 hours)
const CACHE_TTL = 24 * 60 * 60 * 1000;

// Track cache entry timestamps for TTL
const cacheTimestamps = new Map();

/**
 * Normalize input parameters for consistent cache keys
 * @param {object} input - Raw input from request
 * @returns {object} - Normalized input
 */
function normalizeInput(input) {
    return {
        topic: (input.topic || '').trim().toLowerCase(),
        difficulty: (input.difficulty || 'intermediate').toLowerCase(),
        moduleCount: parseInt(input.moduleCount || input.modules || 5),
        includeQuiz: Boolean(input.includeQuiz),
        includeVideos: Boolean(input.includeVideos),
    };
}

/**
 * Generate deterministic cache key from normalized input
 * @param {object} input - Request input parameters
 * @param {string} userId - User ID for isolation
 * @returns {string} - SHA256 hash-based cache key
 */
export function makeCacheKey(input, userId = 'global') {
    const normalized = normalizeInput(input);
    const keyData = {
        userId,
        ...normalized,
    };
    const str = JSON.stringify(keyData);
    const hash = crypto.createHash('sha256').update(str).digest('hex');
    return `course_cache:${userId}:${hash.substring(0, 16)}`;
}

/**
 * Check if cached entry is still valid (within TTL)
 * @param {string} key - Cache key
 * @returns {boolean}
 */
function isExpired(key) {
    const timestamp = cacheTimestamps.get(key);
    if (!timestamp) return true;
    return Date.now() - timestamp > CACHE_TTL;
}

/**
 * Get cached course data
 * @param {string} key - Cache key
 * @returns {Promise<object|null>} - Cached course or null
 */
export async function getCachedCourse(key) {
    // Check memory cache first
    if (memoryCache.has(key) && !isExpired(key)) {
        console.log(`✅ Cache HIT (memory): ${key}`);
        return memoryCache.get(key);
    }

    // Optional: Check Redis if configured
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
                    console.log(`✅ Cache HIT (Redis): ${key}`);
                    return parsed;
                }
            }
        } catch (e) {
            console.log('Redis cache check failed:', e.message);
        }
    }

    console.log(`❌ Cache MISS: ${key}`);
    return null;
}

/**
 * Store course in cache
 * @param {string} key - Cache key
 * @param {object} course - Course data to cache
 */
export async function setCachedCourse(key, course) {
    // Store in memory
    memoryCache.set(key, course);
    cacheTimestamps.set(key, Date.now());
    console.log(`💾 Cache SET (memory): ${key}`);

    // Optional: Store in Redis if configured
    if (process.env.REDIS_URL) {
        try {
            const { default: redis } = await import('@/lib/redis');
            if (redis) {
                await redis.set(key, JSON.stringify(course), 'EX', Math.floor(CACHE_TTL / 1000));
                console.log(`💾 Cache SET (Redis): ${key}`);
            }
        } catch (e) {
            console.log('Redis cache set failed:', e.message);
        }
    }
}

/**
 * Invalidate cache entry
 * @param {string} key - Cache key to invalidate
 */
export async function invalidateCache(key) {
    memoryCache.delete(key);
    cacheTimestamps.delete(key);

    if (process.env.REDIS_URL) {
        try {
            const { default: redis } = await import('@/lib/redis');
            if (redis) {
                await redis.del(key);
            }
        } catch (e) {
            // Ignore Redis errors
        }
    }
}

/**
 * Clear all course cache entries
 */
export function clearAllCache() {
    memoryCache.clear();
    cacheTimestamps.clear();
    console.log('🗑️ All course cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
    return {
        memoryEntries: memoryCache.size,
        oldestEntry: Math.min(...Array.from(cacheTimestamps.values())) || null,
        newestEntry: Math.max(...Array.from(cacheTimestamps.values())) || null,
    };
}
