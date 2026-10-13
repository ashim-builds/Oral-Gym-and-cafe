import { Router } from 'express';
import orderController from '../controllers/order.controller';
import { authenticateCustomer } from '../middleware/auth.middleware';

const router = Router();

// Preview can be calculated before order placement
router.post('/preview', (req, res) => orderController.previewCheckout(req, res));

// Customer Order placement and history (Protected)
router.post('/', authenticateCustomer, (req, res) => orderController.createOrder(req, res));
router.get('/', authenticateCustomer, (req, res) => orderController.getMyOrders(req, res));
router.get('/:id', authenticateCustomer, (req, res) => orderController.getOrderById(req, res));

export default router;
