import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import notificationService from '../services/notification.service';

export class NotificationController {
  /**
   * POST /api/notifications/register-token
   * Register push notification token from Expo
   */
  async registerPushToken(req: AuthenticatedRequest, res: Response) {
    try {
      const { token, device_type } = req.body;
      if (!token) {
        return sendError(res, 'Expo push token is required', 400);
      }

      let user_type: 'CUSTOMER' | 'ADMIN' | 'GUEST' = 'GUEST';
      let customer_id: number | undefined;
      let admin_id: number | undefined;

      if (req.customer) {
        user_type = 'CUSTOMER';
        customer_id = req.customer.id;
      } else if (req.admin) {
        user_type = 'ADMIN';
        admin_id = req.admin.id;
      }

      const result = await notificationService.registerPushToken(
        token,
        user_type,
        customer_id,
        admin_id,
        device_type
      );

      return sendSuccess(res, result, 'Push token registered successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to register push token', 500);
    }
  }

  /**
   * GET /api/notifications/customer
   * Get notifications for authenticated customer
   */
  async getCustomerNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.customer) {
        return sendError(res, 'Authentication required', 401);
      }

      const result = await notificationService.getCustomerNotifications(req.customer.id);
      return sendSuccess(res, result, 'Notifications retrieved successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to get notifications', 500);
    }
  }

  /**
   * GET /api/notifications/admin
   * Get notifications for admin
   */
  async getAdminNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.admin) {
        return sendError(res, 'Admin authentication required', 401);
      }

      const result = await notificationService.getAdminNotifications();
      return sendSuccess(res, result, 'Admin notifications retrieved successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to get notifications', 500);
    }
  }

  /**
   * PUT /api/notifications/:id/read
   * Mark single notification as read
   */
  async markAsRead(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) {
        return sendError(res, 'Invalid notification ID', 400);
      }

      const notification = await notificationService.markAsRead(id);
      return sendSuccess(res, notification, 'Notification marked as read');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to mark notification as read', 500);
    }
  }

  /**
   * PUT /api/notifications/customer/read-all
   * Mark all customer notifications as read
   */
  async markAllAsReadCustomer(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.customer) {
        return sendError(res, 'Authentication required', 401);
      }

      await notificationService.markAllAsReadCustomer(req.customer.id);
      return sendSuccess(res, null, 'All notifications marked as read');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to mark notifications as read', 500);
    }
  }

  /**
   * PUT /api/notifications/admin/read-all
   * Mark all admin notifications as read
   */
  async markAllAsReadAdmin(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.admin) {
        return sendError(res, 'Admin authentication required', 401);
      }

      await notificationService.markAllAsReadAdmin();
      return sendSuccess(res, null, 'All admin notifications marked as read');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to mark notifications as read', 500);
    }
  }
}

export const notificationController = new NotificationController();
export default notificationController;
