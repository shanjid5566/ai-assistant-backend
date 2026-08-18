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
        const result = await prisma.project.create({
            data: payload,
        });
        return result;
    }

    /**
     * Fetch all active (non-archived) projects
     * @returns Array of projects
     */
    public async getAllProjects(): Promise<Project[]> {
        const result = await prisma.project.findMany({
            where: { isArchived: false },
        });
        return result;
    }
}