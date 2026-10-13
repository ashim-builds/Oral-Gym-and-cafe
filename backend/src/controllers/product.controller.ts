import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import productService from '../services/product.service';
import categoryService from '../services/category.service';

export class ProductController {
  /**
   * GET /api/products
   */
  async getProducts(req: Request, res: Response) {
    try {
      const category_id = req.query.category_id ? parseInt(req.query.category_id as string, 10) : undefined;
      const search = req.query.search ? String(req.query.search) : undefined;
      const featured = req.query.featured !== undefined ? req.query.featured === 'true' : undefined;
      const in_stock_only = req.query.in_stock_only === 'true';
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const sort_by = req.query.sort_by as any;

      const result = await productService.getPublicProducts({
        category_id,
        search,
        featured,
        in_stock_only,
        page,
        limit,
        sort_by,
      });

      return sendSuccess(res, result.products, 'Products fetched successfully', 200, result.pagination);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch products', 400);
    }
  }

  /**
   * GET /api/products/featured
   */
  async getFeaturedProducts(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 8;
      const products = await productService.getFeaturedProducts(limit);
      return sendSuccess(res, products, 'Featured products fetched');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch featured products', 400);
    }
  }

  /**
   * GET /api/products/:id
   */
  async getProductById(req: Request, res: Response) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return sendError(res, 'Invalid product ID', 400);
      }
      const product = await productService.getProductById(id);
      return sendSuccess(res, product, 'Product fetched successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Product not found', 404);
    }
  }

  /**
   * GET /api/categories
   */
  async getCategories(req: Request, res: Response) {
    try {
      const categories = await categoryService.getPublicCategories();
      return sendSuccess(res, categories, 'Categories fetched successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch categories', 400);
    }
  }
}

export const productController = new ProductController();
export default productController;
