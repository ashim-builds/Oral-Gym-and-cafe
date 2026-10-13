import { Router } from 'express';
import productController from '../controllers/product.controller';
import { appCache } from '../utils/cache';

const router = Router();

// Public routes for mobile and web with 60s in-memory TTL caching
router.get('/products', appCache.middleware(60, 'products'), (req, res) => productController.getProducts(req, res));
router.get('/products/featured', appCache.middleware(60, 'products'), (req, res) => productController.getFeaturedProducts(req, res));
router.get('/products/:id', appCache.middleware(60, 'products'), (req, res) => productController.getProductById(req, res));
router.get('/categories', appCache.middleware(60, 'categories'), (req, res) => productController.getCategories(req, res));

export default router;
