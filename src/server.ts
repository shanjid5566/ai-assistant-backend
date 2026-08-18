import 'dotenv/config';
import app from './app.js';
import config from './config/index.js';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined. Please add it to your .env file.');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

class Server {
    /**
     * Start the Express server and connect to databases
     */
    public async bootstrap() {
        try {
            // Establish database connection
            await prisma.$connect();
            console.log('Database connected successfully.');

            // Start listening for incoming requests
            app.listen(config.port, () => {
                console.log(`Server is running smoothly on port ${config.port} 🚀`);
            });
        } catch (error) {
            console.error('Failed to start the server:', error);
            process.exit(1);
        }
    }
}

// Instantiate and start the server
const server = new Server();
server.bootstrap();