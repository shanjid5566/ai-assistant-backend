import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import validateRequest from '../../middlewares/validateRequest.js';
import { AuthValidation } from './auth.validation.js';

export class AuthRoutes {
    public router: Router;
    private authController: AuthController;

    constructor() {
        this.router = Router();
        this.authController = new AuthController();
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(
            '/register',
            validateRequest(AuthValidation.registerSchema),
            this.authController.register
        );

        this.router.post(
            '/login',
            validateRequest(AuthValidation.loginSchema),
            this.authController.login
        );

        this.router.post(
            '/github',
            // no validation schema for mock
            this.authController.githubLogin
        );

        this.router.post(
            '/send-otp',
            this.authController.sendOtp
        );

        this.router.post(
            '/verify-otp',
            this.authController.verifyOtp
        );

        this.router.post(
            '/reset-password',
            this.authController.resetPassword
        );
    }
}

export default AuthRoutes;
