import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import branchRoutes from './branch.routes';
import orderRoutes from './order.routes';
import businessRoutes from './business.routes';
import adminRoutes from './admin.routes';
import notificationRoutes from './notification.routes';

import uploadController, { multerUpload } from '../controllers/upload.controller';

const router = Router();

// Mount API Modules
router.use('/auth', authRoutes);
router.use('/', productRoutes); // /products, /products/featured, /categories
router.use('/branches', branchRoutes);
router.use('/orders', orderRoutes);
router.use('/', businessRoutes); // /business/details, /owner/details
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);

// Public upload endpoints
router.post('/upload', multerUpload.single('file'), (req, res) => uploadController.uploadFile(req, res));
router.post('/upload-base64', (req, res) => uploadController.uploadBase64(req, res));

export default router;

