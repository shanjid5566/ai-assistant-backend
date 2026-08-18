import axios from 'axios';
import config from '../../config/index.js';
import { MessageService } from '../message/message.service.js';

interface AIStrategy {
    provider: 'GROQ' | 'OPENROUTER' | 'GEMINI';
    model: string;
}

export class AIService {
    private messageService: MessageService;

    constructor() {
        this.messageService = new MessageService();
    }

    private fallbackStrategies: AIStrategy[] = [
        { provider: 'GROQ', model: 'groq/compound' },
        { provider: 'GROQ', model: 'groq/compound-mini' },
        { provider: 'OPENROUTER', model: 'meta-llama/llama-3-8b-instruct:free' },
        { provider: 'OPENROUTER', model: 'google/gemma-7b-it:free' },
        { provider: 'GEMINI', model: 'gemini-1.5-flash' }
    ];

    /**
     * Process prompt, get real AI response, and save to database
     */
    public async generateResponse(prompt: string, projectId?: string, userId?: string): Promise<any> {
        let aiResponse = '';

        for (const strategy of this.fallbackStrategies) {
            const keys = this.getKeysForProvider(strategy.provider);
            if (!keys || keys.length === 0 || keys[0] === '') continue;

            for (const key of keys) {
                try {
                    console.log(`[AI Engine] Attempting ${strategy.provider} - Model: ${strategy.model}`);
                    aiResponse = await this.callProvider(strategy, key.trim(), prompt);
                    if (aiResponse) break; // Break key loop on success
                } catch (error: any) {
                    const errorMessage = error.response?.data?.error?.message || error.message;
                    console.error(`[AI Engine] Key failed for ${strategy.provider} (${strategy.model}): ${errorMessage}`);
                }
            }

            if (aiResponse) break; // Break strategy loop if response is found
        }

        if (!aiResponse) {
            throw new Error('All AI models and providers are currently unavailable or rate-limited.');
        }

        // Save the prompt and real AI response into the Message table automatically
        const savedMessage = await this.messageService.saveMessage({
            prompt,
            response: aiResponse,
            projectId: projectId || null,
            userId: userId || null,
        });

        return savedMessage;
    }

    private getKeysForProvider(provider: string): string[] {
        switch (provider) {
            case 'GROQ': return config.ai_keys.groq;
            case 'OPENROUTER': return config.ai_keys.openrouter;
            case 'GEMINI': return config.ai_keys.gemini;
            default: return [];
        }
    }

    private async callProvider(strategy: AIStrategy, apiKey: string, prompt: string): Promise<string> {
        if (strategy.provider === 'GROQ') {
            const response = await axios.post(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    model: strategy.model,
                    messages: [{ role: 'user', content: prompt }],
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            return response.data.choices[0].message.content;
        }

        if (strategy.provider === 'OPENROUTER') {
            const response = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    model: strategy.model,
                    messages: [{ role: 'user', content: prompt }],
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            return response.data.choices[0].message.content;
        }

        if (strategy.provider === 'GEMINI') {
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/${strategy.model}:generateContent?key=${apiKey}`,
                {
                    contents: [{ parts: [{ text: prompt }] }],
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            return response.data.candidates[0].content.parts[0].text;
        }

        throw new Error('Unsupported Provider');
    }
}