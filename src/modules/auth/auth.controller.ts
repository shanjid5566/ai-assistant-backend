import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import catchAsync from '../../shared/catchAsync.js';
import { sendEmail } from '../../config/email.js';
import { redis } from '../../config/redis.js';

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
        // In reality, you'd exchange code for token and fetch GH user data
        const mockGithubUser = {
            id: 'mock-github-id',
            email: 'githubuser@example.com',
            firstName: 'GitHub',
            lastName: 'User',
        };

        res.status(200).json({
            success: true,
            message: 'GitHub login successful',
            data: mockGithubUser,
        });
    });

    public sendOtp = catchAsync(async (req: Request, res: Response) => {
        const { email } = req.body;
        if (!email) throw new Error('Email is required');

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Save to Redis with 10 mins expiry
        await redis.setex(`otp:${email}`, 600, otp);

        // Send Email
        const htmlTemplate = `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #6366f1; text-align: center;">Welcome to DevCore</h2>
                <p>Hello,</p>
                <p>Please use the following One-Time Password (OTP) to verify your email address. This code is valid for <strong>10 minutes</strong>.</p>
                <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; color: #1f2937;">
                    ${otp}
                </div>
                <p>If you did not request this, you can safely ignore this email.</p>
            </div>
        `;
        await sendEmail(email, 'Verify your email - DevCore', `Your OTP is ${otp}`, htmlTemplate);

        res.status(200).json({
            success: true,
            message: 'OTP sent to email successfully',
        });
    });

    public verifyOtp = catchAsync(async (req: Request, res: Response) => {
        const { email, otp } = req.body;
        if (!email || !otp) throw new Error('Email and OTP are required');

        const cachedOtp = await redis.get(`otp:${email}`);
        
        if (!cachedOtp) {
            throw new Error('OTP expired or not found');
        }

        if (cachedOtp !== otp) {
            throw new Error('Invalid OTP');
        }

        // OTP Valid - delete it
        await redis.del(`otp:${email}`);

        // Allow password reset for 10 mins
        await redis.setex(`reset_allowed:${email}`, 600, 'true');

        res.status(200).json({
            success: true,
            message: 'Email verified successfully',
        });
    });

    public resetPassword = catchAsync(async (req: Request, res: Response) => {
        const { email, newPassword } = req.body;
        if (!email || !newPassword) throw new Error('Email and new password are required');

        const isAllowed = await redis.get(`reset_allowed:${email}`);
        if (!isAllowed) {
            throw new Error('Unauthorized or session expired. Please verify OTP again.');
        }

        await this.authService.resetPassword(email, newPassword);

        // Delete reset permission
        await redis.del(`reset_allowed:${email}`);

        res.status(200).json({
            success: true,
            message: 'Password reset successfully',
        });
    });
}

export default AuthController;
