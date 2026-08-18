import dotenv from 'dotenv';
import path from 'node:path';

// Load environment variables from .env file
dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
    port: process.env.PORT || 5000,
    database_url: process.env.DATABASE_URL,
    env: process.env.NODE_ENV || 'development',
};