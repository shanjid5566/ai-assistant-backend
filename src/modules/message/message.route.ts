import { Router } from 'express';
import { MessageController } from './message.controller.js';
import validateRequest from '../../middlewares/validateRequest.js';
import { MessageValidation } from './message.validation.js';

export class MessageRoutes {
    public router: Router;
    private messageController: MessageController;

    constructor() {
        this.router = Router();
        this.messageController = new MessageController();
        this.initializeRoutes();
    }

    /**
     * Bind controller methods and validations to specific route endpoints
     */
    private initializeRoutes() {
        // POST /api/v1/messages/save
        this.router.post(
            '/save',
            validateRequest(MessageValidation.createMessageSchema),
            this.messageController.saveMessage
        );

        // GET /api/v1/messages
        this.router.get('/', this.messageController.getAllMessages);
    }
}

export default MessageRoutes;