import { z } from 'zod';

const onboardingSchema = {
    body: z.object({
        email: z.string().email(),
        domainFocus: z.enum(['WEB', 'MOBILE']),
        experienceLevel: z.enum(['BEGINNER', 'MID_LEVEL', 'SENIOR']).optional(),
        preferredStack: z.array(z.string()).optional().default([]),
        architecture: z.string().optional(),
    }),
};

export const UserValidation = {
    onboardingSchema,
};
