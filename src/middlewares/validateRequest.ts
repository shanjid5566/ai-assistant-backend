import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

interface ValidationSchema {
    body?: ZodTypeAny;
    query?: ZodTypeAny;
    params?: ZodTypeAny;
}

const validateRequest = (schema: ValidationSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            if (schema.body) {
                req.body = schema.body.parse(req.body) as any;
            }

            if (schema.query) {
                req.query = schema.query.parse(req.query) as any;
            }

            if (schema.params) {
                req.params = schema.params.parse(req.params) as any;
            }

            return next();
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: error?.issues || [{ message: error?.message || 'Invalid input' }],
            });
        }
    };
};

export default validateRequest;
