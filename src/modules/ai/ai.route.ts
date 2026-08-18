import { Router } from 'express';
import { AIController } from './ai.controller.js';
import validateRequest from '../../middlewares/validateRequest.js';
import { AIValidation } from './ai.validation.js';

export class AIRoutes {
    public router: Router;
    private aiController: AIController;

    constructor() {
        this.router = Router();
        this.aiController = new AIController();
        this.initializeRoutes();
    }

    /**
     * Bind controller methods and validations to specific route endpoints
     */
    private initializeRoutes() {
        // POST /api/v1/ai/generate
        this.router.post(
            '/generate',
            validateRequest(AIValidation.promptSchema),
            this.aiController.generateCode
        );

        // POST /api/v1/ai/plan
        this.router.post(
            '/plan',
            validateRequest(AIValidation.promptSchema),
            this.aiController.generatePlan
        );
    }
}

export default AIRoutes;