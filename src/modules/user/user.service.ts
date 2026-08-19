import { PrismaClient, type User } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { redis } from '../../config/redis.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined. Please add it to your .env file.');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
});

export class UserService {
    /**
     * Generate a unique Redis key for user profiles
     */
    private generateCacheKey(email: string): string {
        return `user:profile:${email}`;
    }

    /**
     * Save or update user onboarding preferences
     * Cache Invalidation applies here because data is updated.
     * @param payload User onboarding data
     * @returns Created or updated user object
     */
    public async saveOnboardingData(payload: any): Promise<User> {
        // Update main DB
        const result = await prisma.user.upsert({
            where: { email: payload.email },
            update: payload,
            create: payload,
        });
        
        // Cache Aside: Invalidate/Reset Redis cache so next fetch gets fresh data
        const cacheKey = this.generateCacheKey(payload.email);
        await redis.del(cacheKey);
        
        return result;
    }

    /**
     * Cache Aside: Fetch from Cache first, if miss -> DB -> Save to Cache
     */
    public async getProfile(email: string): Promise<User | null> {
        const cacheKey = this.generateCacheKey(email);
        
        // 1. Try to fetch from Redis
        const cachedUser = await redis.get(cacheKey);
        if (cachedUser) {
            console.log(`[Redis] Cache Hit for user: ${email}`);
            return JSON.parse(cachedUser);
        }

        console.log(`[Redis] Cache Miss. Fetching from DB for user: ${email}`);
        
        // 2. Fetch from DB
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // 3. Cache the result for future requests (e.g., cache for 1 hour = 3600 seconds)
        if (user) {
            await redis.setex(cacheKey, 3600, JSON.stringify(user));
        }

        return user;
    }

    /**
     * Cache Invalidation: Update DB and delete stale cache.
     */
    public async updateProfile(email: string, payload: Partial<User>): Promise<User> {
        const updatedUser = await prisma.user.update({
            where: { email },
            data: payload,
        });

        // Cache Aside: Reset/delete the redis cache
        const cacheKey = this.generateCacheKey(email);
        await redis.del(cacheKey);

        return updatedUser;
    }
}