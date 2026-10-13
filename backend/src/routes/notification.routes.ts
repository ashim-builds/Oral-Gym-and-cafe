import { Router } from 'express';
import notificationController from '../controllers/notification.controller';
import { authenticateCustomer, authenticateAdmin, optionalCustomerAuth } from '../middleware/auth.middleware';

const router = Router();

// Register push token (Authenticated customer, admin or guest)
router.post('/register-token', optionalCustomerAuth, (req, res) =>
  notificationController.registerPushToken(req, res)
);

// Customer notification endpoints
router.get('/customer', authenticateCustomer, (req, res) =>
  notificationController.getCustomerNotifications(req, res)
);
router.put('/customer/read-all', authenticateCustomer, (req, res) =>
  notificationController.markAllAsReadCustomer(req, res)
);

// Admin notification endpoints
router.get('/admin', authenticateAdmin, (req, res) =>
  notificationController.getAdminNotifications(req, res)
);
router.put('/admin/read-all', authenticateAdmin, (req, res) =>
  notificationController.markAllAsReadAdmin(req, res)
);

// Mark individual notification read
router.put('/:id/read', (req, res) => notificationController.markAsRead(req, res));

export default router;
