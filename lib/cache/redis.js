/**
 * Redis Client (Optional)
 * 
 * Provides persistent caching across server restarts.
 * Falls back gracefully if Redis is not configured.
 */

let redisClient = null;
let isConnecting = false;

/**
 * Get or create Redis client
 * @returns {Promise<object|null>} - Redis client or null if not configured
 */
export async function getRedisClient() {
    // Skip if no Redis URL configured
    if (!process.env.REDIS_URL) {
        return null;
    }

    // Return existing client
    if (redisClient) {
        return redisClient;
    }

    // Prevent multiple simultaneous connection attempts
    if (isConnecting) {
        return null;
    }

    try {
        isConnecting = true;

        // Dynamic import to avoid issues if redis not installed
        const { createClient } = await import('redis');

        redisClient = createClient({
            url: process.env.REDIS_URL,
            socket: {
                connectTimeout: 5000,
                reconnectStrategy: (retries) => {
                    if (retries > 3) {
                        console.log('Redis: Max retries reached, giving up');
                        return false;
                    }
                    return Math.min(retries * 100, 3000);
                }
            }
        });

        redisClient.on('error', (err) => {
            console.log('Redis error:', err.message);
        });

        redisClient.on('connect', () => {
            console.log('✅ Redis connected');
        });

        await redisClient.connect();
        isConnecting = false;

        return redisClient;
    } catch (error) {
        isConnecting = false;
        console.log('Redis connection failed:', error.message);
        return null;
    }
}

/**
 * Close Redis connection
 */
export async function closeRedis() {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
    }
}
