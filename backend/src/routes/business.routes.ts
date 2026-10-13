import { Router } from 'express';
import businessController from '../controllers/business.controller';
import { appCache } from '../utils/cache';

const router = Router();

// Store operational status & settings with 45s in-memory TTL caching
router.get('/business/details', appCache.middleware(45, 'business'), (req, res) => businessController.getBusinessDetails(req, res));
router.get('/owner/details', appCache.middleware(45, 'owner'), (req, res) => businessController.getOwnerDetails(req, res));
router.get('/settings/delivery', (req, res) => businessController.getDeliverySettings(req, res));
router.get('/business/delivery-settings', (req, res) => businessController.getDeliverySettings(req, res));

export default router;
