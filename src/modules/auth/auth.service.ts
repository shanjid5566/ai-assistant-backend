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
        try {
            // In a real app, hash password here
            const user = await prisma.user.create({
                data: payload,
            });
            return user;
        } catch (error: any) {
            // Prisma Unique Constraint Violation
            if (error.code === 'P2002') {
                const err = new Error('An account with this email already exists.');
                (err as any).statusCode = 400;
                throw err;
            }
            throw error;
        }
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

    public async changePassword(email: string, currentPassword: string, newPassword: string): Promise<User> {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new Error('User not found');
        if (user.password !== currentPassword) {
            const err = new Error('Incorrect current password');
            (err as any).statusCode = 400;
            throw err;
        }
        
        return await prisma.user.update({
            where: { email },
            data: { password: newPassword }
        });
    }

    public async oAuthLogin(payload: { email: string; firstName: string; lastName?: string }): Promise<User> {
        let user = await prisma.user.findUnique({
            where: { email: payload.email },
        });

        if (!user) {
            // Create user if they don't exist
            user = await prisma.user.create({
                data: {
                    email: payload.email,
                    firstName: payload.firstName,
                    lastName: payload.lastName || '',
                    password: '', // OAuth users don't have a direct password initially
                },
            });
        }

        return user;
    }
}
