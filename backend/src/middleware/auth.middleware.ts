import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { AuthenticatedRequest, CustomerTokenPayload, AdminTokenPayload } from '../types';
import { sendError } from '../utils/response';

/**
 * Require valid Customer JWT Token
 */
export const authenticateCustomer = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Authentication required. Please verify your phone number to continue.', 401);
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as CustomerTokenPayload;
    if (decoded.type !== 'customer') {
      sendError(res, 'Invalid token type', 401);
      return;
    }
    req.customer = decoded;
    next();
  } catch (err: any) {
    sendError(res, 'Session expired or invalid. Please log in again.', 401);
    return;
  }
};

/**
 * Optional Customer JWT Token (allows guest users to proceed, but parses customer if token is provided)
 */
export const optionalCustomerAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as CustomerTokenPayload;
      if (decoded.type === 'customer') {
        req.customer = decoded;
      }
    } catch {
      // Ignore token verification failure for optional auth
    }
  }
  next();
};

/**
 * Require valid Admin JWT Token
 */
export const authenticateAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Admin authentication required', 401);
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ENV.ADMIN_JWT_SECRET) as AdminTokenPayload;
    if (decoded.type !== 'admin') {
      sendError(res, 'Invalid admin token type', 401);
      return;
    }
    req.admin = decoded;
    next();
  } catch (err: any) {
    sendError(res, 'Admin session expired or invalid. Please log in again.', 401);
    return;
  }
};
