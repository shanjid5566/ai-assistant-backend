import { z } from 'zod';

const registerSchema = {
    body: z.object({
        firstName: z.string().min(1, 'First name is required'),
        lastName: z.string().min(1, 'Last name is required'),
        email: z.string().email(),
        password: z.string().min(8, 'Password must be at least 8 characters long'),
    }),
};

const loginSchema = {
    body: z.object({
        email: z.string().email(),
        password: z.string().min(1, 'Password is required'),
    }),
};

export const AuthValidation = {
    registerSchema,
    loginSchema,
};
