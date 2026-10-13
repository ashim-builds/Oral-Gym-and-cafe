import crypto from 'crypto';
import prisma from '../config/db';
import { ENV } from '../config/env';

// SMS Provider Abstraction Interface
export interface ISmsProvider {
  name: string;
  sendSms(phoneNumber: string, message: string): Promise<boolean>;
}

// 1. Mock / Development SMS Provider
export class MockSmsProvider implements ISmsProvider {
  name = 'Mock SMS Provider (Dev Mode)';

  async sendSms(phoneNumber: string, message: string): Promise<boolean> {
    if (ENV.NODE_ENV !== 'production') {
      console.log(`\n========================================`);
      console.log(`📱 [DEV SMS DISPATCH] To: ${phoneNumber}`);
      console.log(`💬 Message: ${message}`);
      console.log(`========================================\n`);
    }
    return true;
  }
}

// 2. Sparrow SMS Provider (Nepal)
export class SparrowSmsProvider implements ISmsProvider {
  name = 'Sparrow SMS';

  async sendSms(phoneNumber: string, message: string): Promise<boolean> {
    if (!ENV.OTP_API_KEY) {
      console.error('[Sparrow SMS] OTP_API_KEY is not configured');
      return false;
    }
    try {
      const response = await fetch('http://api.sparrowsms.com/v2/sms/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: ENV.OTP_API_KEY,
          from: ENV.OTP_SENDER_ID || 'ORLAGYM',
          to: phoneNumber.replace(/\D/g, ''),
          text: message,
        }),
      });
      const data = await response.json();
      return (data as any)?.response_code === 200;
    } catch (err) {
      console.error('[Sparrow SMS] Failed to send SMS:', err);
      return false;
    }
  }
}

// 3. Twilio SMS Provider
export class TwilioSmsProvider implements ISmsProvider {
  name = 'Twilio SMS';

  async sendSms(phoneNumber: string, message: string): Promise<boolean> {
    if (!ENV.OTP_API_KEY || !ENV.OTP_API_SECRET) {
      console.error('[Twilio SMS] Missing API credentials');
      return false;
    }
    try {
      const accountSid = ENV.OTP_API_KEY;
      const authToken = ENV.OTP_API_SECRET;
      const from = ENV.OTP_SENDER_ID;
      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      const bodyParams = new URLSearchParams();
      bodyParams.append('To', phoneNumber);
      bodyParams.append('From', from);
      bodyParams.append('Body', message);

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });
      return res.ok;
    } catch (err) {
      console.error('[Twilio SMS] Error sending SMS:', err);
      return false;
    }
  }
}

// 4. Custom Webhook SMS Provider
export class CustomWebhookSmsProvider implements ISmsProvider {
  name = 'Custom Webhook SMS';

  async sendSms(phoneNumber: string, message: string): Promise<boolean> {
    if (!ENV.OTP_API_KEY) {
      console.error('[Custom SMS] Webhook URL (OTP_API_KEY) not set');
      return false;
    }
    try {
      const res = await fetch(ENV.OTP_API_KEY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(ENV.OTP_API_SECRET ? { Authorization: `Bearer ${ENV.OTP_API_SECRET}` } : {}),
        },
        body: JSON.stringify({
          phone: phoneNumber,
          message,
          sender: ENV.OTP_SENDER_ID,
        }),
      });
      return res.ok;
    } catch (err) {
      console.error('[Custom SMS Webhook] Error:', err);
      return false;
    }
  }
}

// Provider Factory
export function getSmsProvider(): ISmsProvider {
  const providerType = (ENV.OTP_PROVIDER || 'mock').toLowerCase();
  switch (providerType) {
    case 'sparrow':
      return new SparrowSmsProvider();
    case 'twilio':
      return new TwilioSmsProvider();
    case 'custom':
      return new CustomWebhookSmsProvider();
    case 'mock':
    default:
      return new MockSmsProvider();
  }
}

export class OtpService {
  private smsProvider: ISmsProvider;

  constructor() {
    this.smsProvider = getSmsProvider();
  }

  // Generate a random 6-digit numeric OTP
  private generateNumericOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Hash the OTP securely with SHA-256 and salt
  private hashOtp(otp: string, phone: string): string {
    return crypto
      .createHmac('sha256', ENV.JWT_SECRET)
      .update(`${phone}:${otp}`)
      .digest('hex');
  }

  // Normalize phone number
  public normalizePhone(phone: string): string {
    return phone.trim().replace(/[^\d+]/g, '');
  }

  /**
   * Request / Send OTP to a phone number
   */
  async sendOtp(rawPhone: string): Promise<{ success: boolean; message: string; cooldownSeconds: number; devOtp?: string }> {
    const phone = this.normalizePhone(rawPhone);

    if (!phone || phone.length < 8) {
      throw new Error('Please enter a valid phone number');
    }

    // Check rate limiting / resend cooldown
    const latestOtp = await prisma.otpVerification.findFirst({
      where: { phone_number: phone },
      orderBy: { created_at: 'desc' },
    });

    const now = new Date();

    if (latestOtp) {
      const timeSinceLast = (now.getTime() - new Date(latestOtp.created_at).getTime()) / 1000;
      if (timeSinceLast < ENV.OTP_RESEND_COOLDOWN_SECONDS) {
        const waitTime = Math.ceil(ENV.OTP_RESEND_COOLDOWN_SECONDS - timeSinceLast);
        throw new Error(`Please wait ${waitTime} seconds before requesting a new OTP.`);
      }

      // Check request rate limiting (max 10 requests per 10 minutes)
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      const recentCount = await prisma.otpVerification.count({
        where: {
          phone_number: phone,
          created_at: { gte: tenMinutesAgo },
        },
      });

      if (recentCount >= 8) {
        throw new Error('Too many OTP requests. Please try again after 15 minutes.');
      }
    }

    // Generate fresh OTP
    const rawOtp = this.generateNumericOtp();
    const otpHash = this.hashOtp(rawOtp, phone);
    const expiresAt = new Date(now.getTime() + ENV.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store secure hashed verification record
    await prisma.otpVerification.create({
      data: {
        phone_number: phone,
        otp_hash: otpHash,
        expires_at: expiresAt,
        attempts: 0,
        verified: false,
      },
    });

    // Send SMS via abstracted provider
    const smsMessage = `Your ${ENV.OTP_SENDER_ID || 'Orla Gym'} verification code is: ${rawOtp}. Valid for ${ENV.OTP_EXPIRY_MINUTES} minutes. Do not share this code.`;
    await this.smsProvider.sendSms(phone, smsMessage);

    return {
      success: true,
      message: `Verification code sent to ${phone}`,
      cooldownSeconds: ENV.OTP_RESEND_COOLDOWN_SECONDS,
      // For local dev convenience only (when provider is mock)
      devOtp: (ENV.NODE_ENV !== 'production' && ENV.OTP_PROVIDER === 'mock') ? rawOtp : undefined,
    };
  }

  /**
   * Verify an OTP provided by customer
   */
  async verifyOtp(rawPhone: string, inputOtp: string): Promise<boolean> {
    const phone = this.normalizePhone(rawPhone);
    const cleanOtp = inputOtp.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      throw new Error('Please enter a valid 6-digit verification code');
    }

    const latestOtp = await prisma.otpVerification.findFirst({
      where: {
        phone_number: phone,
        verified: false,
      },
      orderBy: { created_at: 'desc' },
    });

    if (!latestOtp) {
      throw new Error('No active verification code found. Please request a new OTP.');
    }

    const now = new Date();

    // Check expiration
    if (new Date(latestOtp.expires_at).getTime() < now.getTime()) {
      throw new Error('Verification code has expired. Please request a new one.');
    }

    // Check attempts limit
    if (latestOtp.attempts >= ENV.OTP_MAX_ATTEMPTS) {
      throw new Error('Maximum verification attempts exceeded. Please request a new code.');
    }

    // Increment attempts count
    await prisma.otpVerification.update({
      where: { id: latestOtp.id },
      data: { attempts: { increment: 1 } },
    });

    // Hash user input and compare
    const computedHash = this.hashOtp(cleanOtp, phone);
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(computedHash, 'utf8'),
      Buffer.from(latestOtp.otp_hash, 'utf8')
    );

    if (!isMatch) {
      const remaining = ENV.OTP_MAX_ATTEMPTS - (latestOtp.attempts + 1);
      if (remaining > 0) {
        throw new Error(`Invalid verification code. ${remaining} attempts remaining.`);
      } else {
        throw new Error('Invalid code. Maximum attempts reached. Please request a new code.');
      }
    }

    // Mark as verified & invalidate for single-use
    await prisma.otpVerification.update({
      where: { id: latestOtp.id },
      data: { verified: true },
    });

    return true;
  }
}

export const otpService = new OtpService();
export default otpService;
