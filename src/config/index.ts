import dotenv from 'dotenv';
import path from 'node:path';

// Load environment variables from .env file
dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
    port: process.env.PORT || 5000,
    database_url: process.env.DATABASE_URL,
    env: process.env.NODE_ENV || 'development',
    ai: {
        groq: {
            provider: 'GROQ',
            models: process.env.GROQ_MODELS ? process.env.GROQ_MODELS.split(',') : [],
            api_keys: process.env.GROQ_API_KEYS ? process.env.GROQ_API_KEYS.split(',') : [],
        },
        openrouter: {
            provider: 'OPENROUTER',
            models: process.env.OPENROUTER_MODELS ? process.env.OPENROUTER_MODELS.split(',') : [],
            api_keys: process.env.OPENROUTER_API_KEYS ? process.env.OPENROUTER_API_KEYS.split(',') : [],
        },
        hf: {
            provider: 'HUGGINGFACE',
            models: process.env.HF_MODELS ? process.env.HF_MODELS.split(',') : [],
            api_keys: process.env.HF_TOKEN ? process.env.HF_TOKEN.split(',') : [],
        }
    }
};