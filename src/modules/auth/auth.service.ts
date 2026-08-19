import { PrismaClient, type User } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined. Please add it to your .env file.');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
});

export class AuthService {
    public async register(payload: any): Promise<User> {
        // In a real app, hash password here
        const user = await prisma.user.create({
            data: payload,
        });
        return user;
    }

    public async login(payload: any): Promise<User | null> {
        const user = await prisma.user.findUnique({
            where: {
                email: payload.email,
            },
        });
        
        if (!user || user.password !== payload.password) {
            throw new Error('Invalid email or password');
        }

        return user;
    }

    public async resetPassword(email: string, newPassword: string): Promise<User> {
        const user = await prisma.user.update({
            where: { email },
            data: { password: newPassword },
        });
        return user;
    }
}
