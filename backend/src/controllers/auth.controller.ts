import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import authService from '../services/auth.service';
import { sendOtpSchema, verifyOtpSchema, updateProfileSchema } from '../validators';

export class AuthController {
  /**
   * POST /api/auth/send-otp
   */
  async sendOtp(req: AuthenticatedRequest, res: Response) {
    try {
      const { phone_number } = sendOtpSchema.parse(req.body);
      const result = await authService.requestCustomerOtp(phone_number);
      return sendSuccess(res, result, result.message);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to send OTP', 400);
    }
  }

  /**
   * POST /api/auth/verify-otp
   */
  async verifyOtp(req: AuthenticatedRequest, res: Response) {
    try {
      const { phone_number, otp } = verifyOtpSchema.parse(req.body);
      const result = await authService.verifyCustomerOtp(phone_number, otp);
      return sendSuccess(
        res,
        result,
        result.isNewCustomer ? 'Account created successfully' : 'Logged in successfully'
      );
    } catch (err: any) {
      return sendError(res, err.message || 'OTP verification failed', 400);
    }
  }

  /**
   * GET /api/auth/me
   */
  async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.customer) {
        return sendError(res, 'Unauthorized', 401);
      }
      const customer = await authService.getCustomerProfile(req.customer.id);
      return sendSuccess(res, customer, 'Customer profile retrieved');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to get profile', 400);
    }
  }

  /**
   * PUT /api/auth/profile
   */
  async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.customer) {
        return sendError(res, 'Unauthorized', 401);
      }
      const validatedData = updateProfileSchema.parse(req.body);
      const updated = await authService.updateCustomerProfile(req.customer.id, {
        name: validatedData.name,
        email: validatedData.email || undefined,
        address: validatedData.address || undefined,
        profile_image: validatedData.profile_image || undefined,
      });
      return sendSuccess(res, updated, 'Profile updated successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to update profile', 400);
    }
  }
}

export const authController = new AuthController();
export default authController;
