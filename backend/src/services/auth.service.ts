import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { ENV } from '../config/env';
import otpService from './otp.service';
import { CustomerTokenPayload, AdminTokenPayload } from '../types';

export class AuthService {
  /**
   * Request phone OTP
   */
  async requestCustomerOtp(phone: string) {
    return await otpService.sendOtp(phone);
  }

  /**
   * Verify OTP and Login / Register customer
   */
  async verifyCustomerOtp(phone: string, otp: string) {
    const normalizedPhone = otpService.normalizePhone(phone);
    await otpService.verifyOtp(normalizedPhone, otp);

    // Check if customer exists
    let customer = await prisma.customer.findUnique({
      where: { phone_number: normalizedPhone },
    });

    let isNewCustomer = false;

    if (!customer) {
      // Create new customer account
      customer = await prisma.customer.create({
        data: {
          phone_number: normalizedPhone,
          name: null,
          email: null,
          address: null,
        },
      });
      isNewCustomer = true;
    } else {
      // If customer has no name yet, consider them new/incomplete
      if (!customer.name) {
        isNewCustomer = true;
      }
    }

    // Generate JWT token for customer
    const payload: CustomerTokenPayload = {
      id: customer.id,
      phone_number: customer.phone_number,
      type: 'customer',
    };

    const token = jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: ENV.JWT_EXPIRES_IN as any,
    });

    return {
      token,
      customer: {
        id: customer.id,
        phone_number: customer.phone_number,
        name: customer.name,
        email: customer.email,
        address: customer.address,
        profile_image: customer.profile_image,
        created_at: customer.created_at,
      },
      isNewCustomer,
    };
  }

  /**
   * Complete or update customer profile
   */
  async updateCustomerProfile(
    customerId: number,
    data: { name?: string; email?: string; address?: string; profile_image?: string }
  ) {
    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.address !== undefined ? { address: data.address } : {}),
        ...(data.profile_image !== undefined ? { profile_image: data.profile_image } : {}),
      },
    });

    return {
      id: customer.id,
      phone_number: customer.phone_number,
      name: customer.name,
      email: customer.email,
      address: customer.address,
      profile_image: customer.profile_image,
      created_at: customer.created_at,
      updated_at: customer.updated_at,
    };
  }

  /**
   * Get customer profile
   */
  async getCustomerProfile(customerId: number) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!customer) {
      throw new Error('Customer profile not found');
    }

    return {
      id: customer.id,
      phone_number: customer.phone_number,
      name: customer.name,
      email: customer.email,
      address: customer.address,
      profile_image: customer.profile_image,
      total_orders: customer._count.orders,
      created_at: customer.created_at,
      updated_at: customer.updated_at,
    };
  }

  /**
   * Admin Login
   */
  async adminLogin(email: string, passwordPlain: string) {
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!admin || !admin.is_active) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(passwordPlain, admin.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const payload: AdminTokenPayload = {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      type: 'admin',
    };

    const token = jwt.sign(payload, ENV.ADMIN_JWT_SECRET, {
      expiresIn: ENV.ADMIN_JWT_EXPIRES_IN as any,
    });

    return {
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    };
  }

  /**
   * Get Admin Profile
   */
  async getAdminProfile(adminId: number) {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        created_at: true,
      },
    });

    if (!admin) {
      throw new Error('Admin not found');
    }

    return admin;
  }
}

export const authService = new AuthService();
export default authService;
