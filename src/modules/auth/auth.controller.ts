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

    // Mock GitHub integration
    public githubLogin = catchAsync(async (req: Request, res: Response) => {
        // In reality, you'd exchange code for token, fetch GH user data & repos, auto-detect stack
        const mockAutoDetectedData = {
            id: 'mock-github-id',
            email: 'githubuser@example.com',
            firstName: 'GitHub',
            lastName: 'User',
            domainFocus: 'WEB',
            preferredStack: ['react', 'typescript', 'node'], // Auto-detected
        };

        res.status(200).json({
            success: true,
            message: 'GitHub connected & stack auto-detected successfully',
            data: mockAutoDetectedData,
        });
    });
}

export default AuthController;
