import { AIService } from './ai.service.js';
import catchAsync from '../../shared/catchAsync.js';
import type { Request, Response } from 'express';

export class AIController {
    private aiService = new AIService();

    public generateCode = catchAsync(async (req: Request, res: Response) => {
        const result = await this.aiService.generateCode(req.body.prompt);
        res.status(200).json({
            success: true,
            data: result,
        });
    });
}
