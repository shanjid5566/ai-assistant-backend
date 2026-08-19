import { PrismaClient, type Message } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { redis } from '../../config/redis.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined. Please add it to your .env file.');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
});

export class MessageService {
    /**
     * Save a chat message (prompt and AI response) to the database
     * @param payload Message data containing prompt and response
     * @returns Created message object
     */
    public async saveMessage(payload: any): Promise<Message> {
        const result = await prisma.message.create({
            data: payload,
        });
        
        // Cache Invalidation
        if (payload.projectId) {
            await redis.del(`project:history:${payload.projectId}`);
        }
        
        return result;
    }

    /**
     * Fetch all messages (optional: filter by project or user)
     * @returns Array of messages
     */
    public async getAllMessages(): Promise<Message[]> {
        const result = await prisma.message.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return result;
    }
}