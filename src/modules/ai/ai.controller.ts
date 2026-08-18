import { AIService } from './ai.service.js';
import catchAsync from '../../shared/catchAsync.js';
import type { Request, Response } from 'express';

export class AIController {
    private aiService = new AIService();

public generateCode = catchAsync(async (req: Request, res: Response) => {
        const { prompt, projectId, userId } = req.body;
        
        const result = await this.aiService.generateResponse(prompt, projectId, userId);
        
        res.status(200).json({
            success: true,
            message: 'AI response generated and saved successfully',
            data: result,
        });
    });
}
