import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/oral_gym_db',
  JWT_SECRET: process.env.JWT_SECRET || 'oral_gym_customer_jwt_secret_production_ready_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '30d',
  ADMIN_JWT_SECRET: process.env.ADMIN_JWT_SECRET || 'oral_gym_admin_jwt_secret_production_ready_key_2026',
  ADMIN_JWT_EXPIRES_IN: process.env.ADMIN_JWT_EXPIRES_IN || '7d',
  
  // OTP config
  OTP_PROVIDER: process.env.OTP_PROVIDER || 'mock', // 'mock' | 'sparrow' | 'twilio' | 'custom'
  OTP_API_KEY: process.env.OTP_API_KEY || '',
  OTP_API_SECRET: process.env.OTP_API_SECRET || '',
  OTP_SENDER_ID: process.env.OTP_SENDER_ID || 'ORALGYM',
  OTP_EXPIRY_MINUTES: process.env.OTP_EXPIRY_MINUTES ? parseInt(process.env.OTP_EXPIRY_MINUTES, 10) : 5,
  OTP_RESEND_COOLDOWN_SECONDS: process.env.OTP_RESEND_COOLDOWN_SECONDS ? parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS, 10) : 30,
  OTP_MAX_ATTEMPTS: process.env.OTP_MAX_ATTEMPTS ? parseInt(process.env.OTP_MAX_ATTEMPTS, 10) : 5,
  
  DEFAULT_DELIVERY_CHARGE: process.env.DEFAULT_DELIVERY_CHARGE ? parseFloat(process.env.DEFAULT_DELIVERY_CHARGE) : 150.00,
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
};
