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
}

export default UserController;