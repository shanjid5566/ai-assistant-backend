import axios from 'axios';
import config from '../../config/index.js';
import { MessageService } from '../message/message.service.js';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not defined. Please add it to your .env file.');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

interface AIStrategy {
    provider: string;
    model: string;
}

export class AIService {
    private messageService: MessageService;

    private fallbackStrategies: AIStrategy[] = [];

    constructor() {
        this.messageService = new MessageService();

        // 1. Add OpenRouter models first (Primary)
        if (config.ai.openrouter.models && config.ai.openrouter.models.length > 0) {
            for (const model of config.ai.openrouter.models) {
                this.fallbackStrategies.push({ provider: 'OPENROUTER', model: model.trim() });
            }
        }

        // 2. Add all Groq models (Secondary)
        if (config.ai.groq.models && config.ai.groq.models.length > 0) {
            for (const model of config.ai.groq.models) {
                this.fallbackStrategies.push({ provider: 'GROQ', model: model.trim() });
            }
        }

        // 3. Add all Hugging Face models (Tertiary fallback)
        if (config.ai.hf.models && config.ai.hf.models.length > 0) {
            for (const model of config.ai.hf.models) {
                this.fallbackStrategies.push({ provider: 'HUGGINGFACE', model: model.trim() });
            }
        }
    }

    /**
     * Process prompt, get real AI response, and save to database
     */
    public async generateResponse(prompt: string, projectId?: string, userId?: string): Promise<any> {
        // Enforce 5 prompt limit for non-logged-in users
        if (!userId && projectId) {
            const messageCount = await prisma.message.count({
                where: { projectId }
            });
            if (messageCount >= 5) {
                throw new Error('Guest users can only send 5 prompts per plan. Please login to continue.');
            }
        }

        const systemPrompt = `You are an expert full-stack developer.
Unless the user explicitly specifies a different technology stack or folder structure, you MUST default to the MERN stack (MongoDB, Express, React, Node.js) with a standard production-ready folder structure (e.g., 'backend/src/...', 'frontend/src/...').
If the user specifies a different stack or structure, follow their instructions exactly.

CRITICAL: You MUST output all code files using the following XML structure so our system can parse it:
<file path="relative/path/to/file.ext">
file content here
</file>

You may provide a brief explanation outside the tags, but all actual code must be wrapped in <file> tags.`;

        let aiResponse = '';
        let usedStrategy: AIStrategy | null = null;
        let collectedErrors: string[] = [];

        for (const strategy of this.fallbackStrategies) {
            const keys = this.getKeysForProvider(strategy.provider);
            if (!keys || keys.length === 0 || keys[0] === '') continue;

            for (const key of keys) {
                try {
                    console.log(`[AI Engine] Attempting ${strategy.provider} - Model: ${strategy.model}`);
                    aiResponse = await this.callProvider(strategy, key.trim(), prompt, systemPrompt);
                    if (aiResponse) {
                        usedStrategy = strategy;
                        break; // Break key loop on success
                    }
                } catch (error: any) {
                    const errorMessage = error.response?.data?.error?.message || error.response?.data?.error || error.message;
                    console.error(`[AI Engine] Key failed for ${strategy.provider} (${strategy.model}): ${errorMessage}`);
                    collectedErrors.push(`[${strategy.model}]: ${errorMessage}`);
                }
            }

            if (aiResponse) break; // Break strategy loop if response is found
        }

        if (!aiResponse || !usedStrategy) {
            const uniqueErrors = [...new Set(collectedErrors)];
            throw new Error(`All AI models failed. Reasons: ${uniqueErrors.join(' | ')}`);
        }

        // Save the prompt and real AI response into the Message table automatically
        const savedMessage = await this.messageService.saveMessage({
            prompt,
            response: aiResponse,
            projectId: projectId || null,
            userId: userId || null,
        });

        return {
            ...savedMessage,
            usedProvider: usedStrategy.provider,
            usedModel: usedStrategy.model
        };
    }

    /**
     * Process prompt, get a structured plan, and return it (without saving to db yet)
     */
    public async generatePlan(prompt: string, ipAddress: string, projectId?: string, userId?: string): Promise<any> {
        // Enforce 1 plan limit for non-logged-in users
        if (!userId && !projectId) {
            const existingProject = await prisma.project.findFirst({
                where: { ipAddress, userId: null }
            });
            if (existingProject) {
                throw new Error("Guest users can only create 1 plan. Please login to create more.");
            }
        }

        const systemPrompt = "You are an expert AI architect. The user will give you a request. Do NOT write any code yet. Instead, generate a detailed, step-by-step technical plan for how to achieve this request. Break it down into clear, numbered logical steps.";
        
        let aiResponse = '';
        let usedStrategy: AIStrategy | null = null;
        let collectedErrors: string[] = [];

        for (const strategy of this.fallbackStrategies) {
            const keys = this.getKeysForProvider(strategy.provider);
            if (!keys || keys.length === 0 || keys[0] === '') continue;

            for (const key of keys) {
                try {
                    console.log(`[AI Engine] Attempting ${strategy.provider} - Model: ${strategy.model} (Plan Phase)`);
                    aiResponse = await this.callProvider(strategy, key.trim(), prompt, systemPrompt);
                    if (aiResponse) {
                        usedStrategy = strategy;
                        break;
                    }
                } catch (error: any) {
                    const errorMessage = error.response?.data?.error?.message || error.response?.data?.error || error.message;
                    console.error(`[AI Engine] Key failed for ${strategy.provider} (${strategy.model}): ${errorMessage}`);
                    collectedErrors.push(`[${strategy.model}]: ${errorMessage}`);
                }
            }

            if (aiResponse) break;
        }

        if (!aiResponse || !usedStrategy) {
            const uniqueErrors = [...new Set(collectedErrors)];
            throw new Error(`All AI models failed during planning. Reasons: ${uniqueErrors.join(' | ')}`);
        }

        // Save project if one doesn't exist
        let finalProjectId = projectId;
        if (!projectId) {
            const newProject = await prisma.project.create({
                data: {
                    name: 'Guest Plan - ' + new Date().toLocaleDateString(),
                    ipAddress: userId ? null : ipAddress,
                    userId: userId || null
                }
            });
            finalProjectId = newProject.id;
        }

        return {
            plan: aiResponse,
            projectId: finalProjectId,
            usedProvider: usedStrategy.provider,
            usedModel: usedStrategy.model
        };
    }

    private getKeysForProvider(provider: string): string[] {
        switch (provider) {
            case config.ai.groq.provider: return config.ai.groq.api_keys;
            case config.ai.openrouter.provider: return config.ai.openrouter.api_keys;
            case 'HUGGINGFACE': return config.ai.hf.api_keys;
            default: return [];
        }
    }

    private async callProvider(strategy: AIStrategy, apiKey: string, prompt: string, systemMessage?: string): Promise<string> {
        let fullContent = '';
        const messages: any[] = [];
        if (systemMessage) {
            messages.push({ role: 'system', content: systemMessage });
        }
        messages.push({ role: 'user', content: prompt });

        const maxContinuations = 10;
        let continuations = 0;

        while (true) {
            let response;
            let choice;

            if (strategy.provider === 'GROQ') {
                response = await axios.post(
                    'https://api.groq.com/openai/v1/chat/completions',
                    {
                        model: strategy.model,
                        messages: messages,
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                choice = response.data.choices[0];
            } else if (strategy.provider === 'HUGGINGFACE') {
                response = await axios.post(
                    'https://router.huggingface.co/v1/chat/completions',
                    {
                        model: strategy.model,
                        messages: messages,
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                choice = response.data.choices[0];
            } else if (strategy.provider === 'OPENROUTER') {
                response = await axios.post(
                    'https://openrouter.ai/api/v1/chat/completions',
                    {
                        model: strategy.model,
                        messages: messages,
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                choice = response.data.choices[0];
            } else {
                throw new Error('Unsupported Provider');
            }

            const chunk = choice.message.content || '';
            fullContent += chunk;

            // Check if generation stopped due to token limit
            if (choice.finish_reason === 'length' && continuations < maxContinuations) {
                console.log(`[AI Engine] Token limit reached for ${strategy.model}. Auto-continuing (Attempt ${continuations + 1}/${maxContinuations})...`);
                // Add the partial response to history
                messages.push({ role: 'assistant', content: chunk });
                // Ask it to continue exactly from where it left off
                messages.push({ role: 'user', content: 'You hit the output limit. Please continue exactly from where you left off in the previous response. Do not repeat anything and do not add any introductory text, just continue the code.' });
                continuations++;
            } else {
                break; // Finished normally or hit max continuations
            }
        }

        return fullContent;
    }
}