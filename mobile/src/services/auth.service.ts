import api, { saveAuthToken, removeAuthToken } from './api';
import { Customer } from '../types';

export class MobileAuthService {
  /**
   * Request OTP to phone number
   */
  async sendOtp(phoneNumber: string): Promise<{ success: boolean; message: string; cooldownSeconds: number; devOtp?: string }> {
    const res = await api.post('/auth/send-otp', {
      phone_number: phoneNumber,
    });
    return res.data.data;
  }

  /**
   * Verify OTP and Login / Register Customer
   */
  async verifyOtp(phoneNumber: string, otp: string): Promise<{
    token: string;
    customer: Customer;
    isNewCustomer: boolean;
  }> {
    const res = await api.post('/auth/verify-otp', {
      phone_number: phoneNumber,
      otp,
    });
    const { token, customer, isNewCustomer } = res.data.data;
    await saveAuthToken(token);
    return { token, customer, isNewCustomer };
  }

  /**
   * Get Current Customer Profile
   */
  async getProfile(): Promise<Customer> {
    const res = await api.get('/auth/me');
    return res.data.data;
  }

  /**
   * Complete or Update Profile
   */
  async updateProfile(data: { name?: string; email?: string; address?: string; profile_image?: string }): Promise<Customer> {
    const res = await api.put('/auth/profile', data);
    return res.data.data;
  }

  /**
   * Logout customer
   */
  async logout(): Promise<void> {
    await removeAuthToken();
  }
}

export const mobileAuthService = new MobileAuthService();
export default mobileAuthService;
