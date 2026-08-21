import { PrismaClient, type Project } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined. Please add it to your .env file.');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
});

export class ProjectService {
    /**
     * Create a new project workspace in the database
     * @param payload Project details
     * @returns Created project object
     */
    public async createProject(payload: any): Promise<Project> {
        let { name, description, userId, ipAddress, email } = payload;
        
        if (email && !userId) {
            const user = await prisma.user.findUnique({ where: { email } });
            if (user) {
                userId = user.id;
            }
        }

        const result = await prisma.project.create({
            data: { name, description, userId, ipAddress },
        });
        return result;
    }

    /**
     * Fetch all active (non-archived) projects
     * @returns Array of projects
     */
    public async getAllProjects(email?: string): Promise<Project[]> {
        const whereClause: any = { isArchived: false };
        
        if (email) {
            const user = await prisma.user.findUnique({ where: { email } });
            if (user) {
                whereClause.userId = user.id;
            } else {
                // If user not found, they have no projects
                return [];
            }
        } else {
            // For guest users, maybe filter by ipAddress or don't return anything
            // Since DevCore requires login for projects usually, let's just return [] if no email
            return [];
        }

        const result = await prisma.project.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' }
        });
        return result;
    }

    /**
     * Delete a project by ID (soft delete or hard delete)
     */
    public async deleteProject(id: string): Promise<Project> {
        return await prisma.project.update({
            where: { id },
            data: { isArchived: true }
        });
    }
}