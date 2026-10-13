import { Request } from 'express';

export interface CustomerTokenPayload {
  id: number;
  phone_number: string;
  type: 'customer';
}

export interface AdminTokenPayload {
  id: number;
  email: string;
  role: string;
  type: 'admin';
}

export interface AuthenticatedRequest extends Request {
  customer?: CustomerTokenPayload;
  admin?: AdminTokenPayload;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: any;
  meta?: any;
}
