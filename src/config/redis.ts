import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

class RedisClient {
    private static instance: Redis;

    public static getInstance(): Redis {
        if (!RedisClient.instance) {
            RedisClient.instance = new Redis(redisUrl, {
                retryStrategy(times) {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
                maxRetriesPerRequest: 3,
            });

            RedisClient.instance.on('connect', () => {
                console.log('✅ Redis Connected successfully');
            });

            RedisClient.instance.on('error', (err) => {
                console.error('❌ Redis Connection Error:', err);
            });
        }

        return RedisClient.instance;
    }
}

export const redis = RedisClient.getInstance();
