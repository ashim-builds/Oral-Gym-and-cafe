import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticateCustomer } from '../middleware/auth.middleware';

const router = Router();

router.post('/send-otp', (req, res) => authController.sendOtp(req, res));
router.post('/verify-otp', (req, res) => authController.verifyOtp(req, res));
router.get('/me', authenticateCustomer, (req, res) => authController.getMe(req, res));
router.put('/profile', authenticateCustomer, (req, res) => authController.updateProfile(req, res));

export default router;
