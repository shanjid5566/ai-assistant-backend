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

    public generatePlan = catchAsync(async (req: Request, res: Response) => {
        const { prompt, projectId, userId } = req.body;
        
        // Extract IP address (handles proxies as well)
        let ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        if (Array.isArray(ipAddress)) ipAddress = ipAddress[0];
        if (typeof ipAddress === 'string') ipAddress = ipAddress.split(',')[0].trim();
        
        const result = await this.aiService.generatePlan(prompt, ipAddress as string, projectId, userId);
        
        res.status(200).json({
            success: true,
            message: 'AI plan generated successfully',
            data: result,
        });
    });
}
