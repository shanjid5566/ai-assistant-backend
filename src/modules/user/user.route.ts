import { Router } from 'express';
import { UserController } from './user.controller.js';
import validateRequest from '../../middlewares/validateRequest.js';
import { UserValidation } from './user.validation.js';

export class UserRoutes {
    public router: Router;
    private userController: UserController;

    constructor() {
        this.router = Router();
        this.userController = new UserController();
        this.initializeRoutes();
    }

    /**
     * Bind controller methods and validations to specific route endpoints
     */
    private initializeRoutes() {
        // POST /api/v1/users/onboarding
        this.router.post(
            '/onboarding',
            validateRequest(UserValidation.onboardingSchema),
            this.userController.saveOnboardingData
        );
    }
}

export default UserRoutes;