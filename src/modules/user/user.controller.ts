import type { Request, Response } from 'express';
import { UserService } from './user.service.js';
import catchAsync from '../../shared/catchAsync.js';

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    /**
     * Handles the onboarding data submission
     */
    public saveOnboardingData = catchAsync(async (req: Request, res: Response) => {
        const result = await this.userService.saveOnboardingData(req.body);

        res.status(200).json({
            success: true,
            message: 'User onboarding data saved successfully',
            data: result,
        });
    });

    public getProfile = catchAsync(async (req: Request, res: Response) => {
        // In reality, get email from JWT payload (req.user)
        const email = req.query.email as string;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email query parameter is required for now' });
        }
        
        const result = await this.userService.getProfile(email);
        res.status(200).json({
            success: true,
            message: 'User profile fetched successfully',
            data: result,
        });
    });

    public updateProfile = catchAsync(async (req: Request, res: Response) => {
        // In reality, get email from JWT payload (req.user)
        const email = req.body.email as string;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email field is required for now' });
        }

        const result = await this.userService.updateProfile(email, req.body);
        res.status(200).json({
            success: true,
            message: 'User profile updated successfully',
            data: result,
        });
    });
}

export default UserController;