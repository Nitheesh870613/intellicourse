import redis from './redis';

/**
 * Cache utility for JSON data
 */
export const cache = {
    /**
     * Get data from cache
     * @param {string} key 
     * @returns {Promise<any | null>}
     */
    async get(key) {
        if (!redis) return null;
        try {
            const data = await redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Redis get error:', error);
            return null;
        }
    },

    /**
     * Set data in cache
     * @param {string} key 
     * @param {any} value 
     * @param {number} ttlSeconds 
     */
    async set(key, value, ttlSeconds = 300) {
        if (!redis) return;
        try {
            const data = JSON.stringify(value);
            await redis.setex(key, ttlSeconds, data);
        } catch (error) {
            console.error('Redis set error:', error);
        }
    },

    /**
     * Delete data from cache
     * @param {string} key 
     */
    async del(key) {
        if (!redis) return;
        try {
            await redis.del(key);
        } catch (error) {
            console.error('Redis del error:', error);
        }
    }
};
