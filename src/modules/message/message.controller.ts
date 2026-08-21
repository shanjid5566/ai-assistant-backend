import type { Request, Response } from 'express';
import { MessageService } from './message.service.js';
import catchAsync from '../../shared/catchAsync.js';

export class MessageController {
    private messageService: MessageService;

    constructor() {
        this.messageService = new MessageService();
    }

    /**
     * Handles saving a new message
     */
    public saveMessage = catchAsync(async (req: Request, res: Response) => {
        const result = await this.messageService.saveMessage(req.body);

        res.status(201).json({
            success: true,
            message: 'Message saved successfully',
            data: result,
        });
    });

    /**
     * Handles fetching all messages
     */
    public getAllMessages = catchAsync(async (req: Request, res: Response) => {
        const projectId = req.query.projectId as string | undefined;
        const result = await this.messageService.getAllMessages(projectId);

        res.status(200).json({
            success: true,
            message: 'Messages retrieved successfully',
            data: result,
        });
    });
}

export default MessageController;