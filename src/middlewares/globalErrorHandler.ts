import type { Request, Response, NextFunction } from 'express';
import config from '../config/index.js';

/**
 * Global Error Handling Middleware
 * Catches all unhandled errors and formats the response standardly.
 */
const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        message,
        errorMessages: [{ path: '', message: err.message }],
        // Hide error stack traces in production environment for security
        stack: config.env !== 'production' ? err.stack : undefined,
    });
};

export default globalErrorHandler;