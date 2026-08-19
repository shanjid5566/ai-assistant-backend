import { PrismaClient, type User } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined. Please add it to your .env file.');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
});

export class UserService {
    /**
     * Save or update user onboarding preferences
     * @param payload User onboarding data
     * @returns Created or updated user object
     */
    public async saveOnboardingData(payload: any): Promise<User> {
        // Using upsert so if a user with the email exists, it updates; otherwise, it creates.
        const result = await prisma.user.upsert({
            where: {
                email: payload.email,
            },
            update: payload,
            create: payload,
        });
        
        return result;
    }

    public async getProfile(email: string): Promise<User | null> {
        return await prisma.user.findUnique({
            where: { email },
        });
    }

    public async updateProfile(email: string, payload: Partial<User>): Promise<User> {
        return await prisma.user.update({
            where: { email },
            data: payload,
        });
    }
}