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

        this.router.get('/github', this.authController.githubRedirect);
        this.router.get('/github/callback', this.authController.githubCallback);

        this.router.get('/google', this.authController.googleRedirect);
        this.router.get('/google/callback', this.authController.googleCallback);

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
