import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import catchAsync from '../../shared/catchAsync.js';

export class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    public register = catchAsync(async (req: Request, res: Response) => {
        const result = await this.authService.register(req.body);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: result,
        });
    });

    public login = catchAsync(async (req: Request, res: Response) => {
        const result = await this.authService.login(req.body);

        res.status(200).json({
            success: true,
            message: 'User logged in successfully',
            data: result,
        });
    });
}

export default AuthController;
