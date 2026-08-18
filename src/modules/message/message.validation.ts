import { z } from 'zod';

const createMessageSchema = {
    body: z.object({
        prompt: z.string({ message: 'Prompt is required' }).min(1, 'Prompt cannot be empty'),
        response: z.string({ message: 'Response is required' }),
        projectId: z.string().optional(),
        userId: z.string().optional(),
    }),
};

export const MessageValidation = {
    createMessageSchema,
};