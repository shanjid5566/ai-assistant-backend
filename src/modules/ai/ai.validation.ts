import { z } from 'zod';

export const AIValidation = {
    promptSchema: {
        body: z.object({
            prompt: z.string().min(1, 'Prompt is required'),
            projectId: z.string().optional(),
            userId: z.string().optional(),
        }),
    },
};