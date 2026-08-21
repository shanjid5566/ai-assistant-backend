import { Redis } from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

let redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
// Fix invalid redis-cli command URL if accidentally set in system environment variables
if (redisUrl.includes('redis-cli --tls -u')) {
    const match = redisUrl.match(/-u (rediss?:\/\/[^\s]+)/);
    if (match && match[1]) {
        redisUrl = match[1];
    } else {
        redisUrl = 'rediss://default:gQAAAAAAAhDKAAIgcDIyZDIwMzExMThkZTk0YzM4YjNiZDllYjJhZTliOTRhYw@glad-vervet-135370.upstash.io:6379';
    }
} else if (redisUrl.startsWith('redis://rediss://')) {
    redisUrl = redisUrl.replace('redis://', '');
}

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
