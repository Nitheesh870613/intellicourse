import Redis from 'ioredis';

const getRedisClient = () => {
    if (process.env.REDIS_URL) {
        console.log('🔌 Initializing Redis client...');
        return new Redis(process.env.REDIS_URL);
    }
    console.warn('⚠️ REDIS_URL not found, using in-memory mock for development');
    return null;
};

// Singleton pattern to prevent multiple connections in dev
const globalForRedis = globalThis;

if (!globalForRedis.redis) {
    globalForRedis.redis = getRedisClient();
}

/** @type {import('ioredis').Redis | null} */
const redis = globalForRedis.redis;

export default redis;
