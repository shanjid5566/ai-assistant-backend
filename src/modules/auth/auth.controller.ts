import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import catchAsync from '../../shared/catchAsync.js';
import { sendEmail } from '../../config/email.js';
import { redis } from '../../config/redis.js';
import axios from 'axios';

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

    // ---------------------------------------------
    // GITHUB OAUTH
    // ---------------------------------------------
    public githubRedirect = catchAsync(async (req: Request, res: Response) => {
        const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_CALLBACK_URL}&scope=user:email`;
        res.redirect(url);
    });

    public githubCallback = catchAsync(async (req: Request, res: Response) => {
        const code = req.query.code as string;
        if (!code) throw new Error('No code provided');

        // Get Access Token
        const { data: tokenData } = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: process.env.GITHUB_CALLBACK_URL,
        }, { headers: { Accept: 'application/json' } });

        if (tokenData.error) throw new Error(tokenData.error_description || 'Failed to get GitHub token');

        // Get User Profile
        const { data: profile } = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        // Get Emails (Primary)
        const { data: emails } = await axios.get('https://api.github.com/user/emails', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const primaryEmail = emails.find((e: any) => e.primary)?.email || profile.email;

        if (!primaryEmail) throw new Error('No email found from GitHub');

        // Create or get user
        const user = await this.authService.oAuthLogin({
            email: primaryEmail,
            firstName: profile.name || profile.login,
        });

        // Redirect to frontend or send token
        res.status(200).json({ success: true, message: 'GitHub login successful', data: user });
    });

    // ---------------------------------------------
    // GOOGLE OAUTH
    // ---------------------------------------------
    public googleRedirect = catchAsync(async (req: Request, res: Response) => {
        const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_CALLBACK_URL}&response_type=code&scope=profile email`;
        res.redirect(url);
    });

    public googleCallback = catchAsync(async (req: Request, res: Response) => {
        const code = req.query.code as string;
        if (!code) throw new Error('No code provided');

        // Get Access Token
        const { data: tokenData } = await axios.post('https://oauth2.googleapis.com/token', {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            code,
            redirect_uri: process.env.GOOGLE_CALLBACK_URL,
            grant_type: 'authorization_code',
        });

        // Get User Profile
        const { data: profile } = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        // Create or get user
        const user = await this.authService.oAuthLogin({
            email: profile.email,
            firstName: profile.given_name,
            lastName: profile.family_name,
        });

        // Redirect to frontend or send token
        res.status(200).json({ success: true, message: 'Google login successful', data: user });
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
