import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import authService from '../services/auth.service';
import productService from '../services/product.service';
import categoryService from '../services/category.service';
import orderService from '../services/order.service';
import branchService from '../services/branch.service';
import customerService from '../services/customer.service';
import businessService from '../services/business.service';
import ownerService from '../services/owner.service';
import prisma from '../config/db';
import { appCache } from '../utils/cache';
import {
  adminLoginSchema,
  createProductSchema,
  createCategorySchema,
  branchSchema,
} from '../validators';

export class AdminController {
  // ----------------------------------------------------
  // Admin Auth
  // ----------------------------------------------------
  async login(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password } = adminLoginSchema.parse(req.body);
      const result = await authService.adminLogin(email, password);
      return sendSuccess(res, result, 'Admin login successful');
    } catch (err: any) {
      return sendError(res, err.message || 'Login failed', 401);
    }
  }

  async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.admin) return sendError(res, 'Unauthorized', 401);
      const profile = await authService.getAdminProfile(req.admin.id);
      return sendSuccess(res, profile, 'Admin profile fetched');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch admin profile', 400);
    }
  }

  // ----------------------------------------------------
  // Dashboard Analytics
  // ----------------------------------------------------
  async getDashboard(req: AuthenticatedRequest, res: Response) {
    try {
      const stats = await orderService.getAdminDashboardStats();
      return sendSuccess(res, stats, 'Dashboard analytics fetched');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to get dashboard stats', 400);
    }
  }

  // ----------------------------------------------------
  // Products Management
  // ----------------------------------------------------
  async getProducts(req: AuthenticatedRequest, res: Response) {
    try {
      const category_id = req.query.category_id ? parseInt(req.query.category_id as string, 10) : undefined;
      const search = req.query.search ? String(req.query.search) : undefined;
      const is_available = req.query.is_available !== undefined ? req.query.is_available === 'true' : undefined;
      const out_of_stock = req.query.out_of_stock === 'true';
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const result = await productService.getAllProductsAdmin({
        category_id,
        search,
        is_available,
        out_of_stock,
        page,
        limit,
      });

      return sendSuccess(res, result.products, 'Products retrieved', 200, result.pagination);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to get products', 400);
    }
  }

  async getProductById(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const product = await productService.getProductById(id);
      return sendSuccess(res, product, 'Product fetched');
    } catch (err: any) {
      return sendError(res, err.message || 'Product not found', 404);
    }
  }

  async createProduct(req: AuthenticatedRequest, res: Response) {
    try {
      const validated = createProductSchema.parse(req.body);
      const product = await productService.createProduct({
        category_id: validated.category_id ?? undefined,
        name: validated.name,
        description: validated.description,
        price: validated.price,
        discount_price: validated.discount_price ?? undefined,
        stock_quantity: validated.stock_quantity,
        main_image: validated.main_image,
        is_available: validated.is_available,
        is_featured: validated.is_featured,
        images: validated.images,
      });
      appCache.invalidatePrefix('products');
      return sendSuccess(res, product, 'Product created successfully', 201);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to create product', 400);
    }
  }

  async updateProduct(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const product = await productService.updateProduct(id, req.body);
      appCache.invalidatePrefix('products');
      return sendSuccess(res, product, 'Product updated successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to update product', 400);
    }
  }

  async deleteProduct(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(String(req.params.id), 10);
      await productService.deleteProduct(id);
      appCache.invalidatePrefix('products');
      return sendSuccess(res, { id }, 'Product deleted successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to delete product', 400);
    }
  }

  // ----------------------------------------------------
  // Category Management
  // ----------------------------------------------------
  async getCategories(req: AuthenticatedRequest, res: Response) {
    try {
      const categories = await categoryService.getAllCategoriesAdmin();
      return sendSuccess(res, categories, 'Categories fetched');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to get categories', 400);
    }
  }

  async createCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const validated = createCategorySchema.parse(req.body);
      const category = await categoryService.createCategory({
        name: validated.name,
        image: validated.image || undefined,
        is_active: validated.is_active,
      });
      appCache.invalidatePrefix('categories');
      appCache.invalidatePrefix('products');
      return sendSuccess(res, category, 'Category created successfully', 201);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to create category', 400);
    }
  }

  async updateCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const category = await categoryService.updateCategory(id, {
        name: req.body.name,
        image: req.body.image || undefined,
        is_active: req.body.is_active,
      });
      appCache.invalidatePrefix('categories');
      appCache.invalidatePrefix('products');
      return sendSuccess(res, category, 'Category updated successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to update category', 400);
    }
  }

  async deleteCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(String(req.params.id), 10);
      await categoryService.deleteCategory(id);
      appCache.invalidatePrefix('categories');
      appCache.invalidatePrefix('products');
      return sendSuccess(res, { id }, 'Category deleted successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to delete category', 400);
    }
  }

  // ----------------------------------------------------
  // Order Management
  // ----------------------------------------------------
  async getOrders(req: AuthenticatedRequest, res: Response) {
    try {
      const order_status = (req.query.order_status || req.query.status) as any;
      const payment_status = req.query.payment_status as any;
      const order_type = req.query.order_type as any;
      const search = req.query.search ? String(req.query.search) : undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const result = await orderService.getAllOrdersAdmin({
        order_status: order_status && order_status !== 'ALL' ? order_status : undefined,
        payment_status,
        order_type,
        search,
        page,
        limit,
      });

      return sendSuccess(res, { orders: result.orders, pagination: result.pagination }, 'Orders fetched', 200, result.pagination);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch orders', 400);
    }
  }

  async getOrderById(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const order = await orderService.getOrderByIdAdmin(id);
      return sendSuccess(res, order, 'Order fetched');
    } catch (err: any) {
      return sendError(res, err.message || 'Order not found', 404);
    }
  }

  async updateOrderStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const { order_status, payment_status, notes } = req.body;
      const updated = await orderService.updateOrderStatusAdmin(id, {
        order_status,
        payment_status,
        notes,
      });
      return sendSuccess(res, updated, 'Order status updated successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to update order status', 400);
    }
  }

  // ----------------------------------------------------
  // Branch Management (Single ordering branch validation)
  // ----------------------------------------------------
  async getBranches(req: AuthenticatedRequest, res: Response) {
    try {
      const branches = await branchService.getAllBranchesAdmin();
      return sendSuccess(res, branches, 'Branches fetched');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch branches', 400);
    }
  }

  async createBranch(req: AuthenticatedRequest, res: Response) {
    try {
      const validated = branchSchema.parse(req.body);
      const branch = await branchService.createBranch({
        name: validated.name,
        description: validated.description ?? undefined,
        address: validated.address,
        phone: validated.phone ?? undefined,
        latitude: validated.latitude ?? undefined,
        longitude: validated.longitude ?? undefined,
        map_url: validated.map_url ?? undefined,
        opening_hours: validated.opening_hours ?? undefined,
        image: validated.image ?? undefined,
        can_order: validated.can_order,
        is_active: validated.is_active,
      });
      appCache.invalidatePrefix('branches');
      return sendSuccess(res, branch, 'Branch created successfully', 201);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to create branch', 400);
    }
  }

  async updateBranch(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const branch = await branchService.updateBranch(id, req.body);
      appCache.invalidatePrefix('branches');
      return sendSuccess(res, branch, 'Branch updated successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to update branch', 400);
    }
  }

  async deleteBranch(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(String(req.params.id), 10);
      await branchService.deleteBranch(id);
      appCache.invalidatePrefix('branches');
      return sendSuccess(res, { id }, 'Branch deleted successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to delete branch', 400);
    }
  }

  // ----------------------------------------------------
  // Customer Management
  // ----------------------------------------------------
  async getCustomers(req: AuthenticatedRequest, res: Response) {
    try {
      const search = req.query.search ? String(req.query.search) : undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;

      const result = await customerService.getAllCustomersAdmin({ search, page, limit });
      return sendSuccess(res, result.customers, 'Customers fetched', 200, result.pagination);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch customers', 400);
    }
  }

  async getCustomerById(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const customer = await customerService.getCustomerByIdAdmin(id);
      return sendSuccess(res, customer, 'Customer details fetched');
    } catch (err: any) {
      return sendError(res, err.message || 'Customer not found', 404);
    }
  }

  async deleteCustomer(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(String(req.params.id), 10);
      await customerService.deleteCustomerAdmin(id);
      return sendSuccess(res, null, 'Customer deleted successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to delete customer', 400);
    }
  }


  // ----------------------------------------------------
  // Business & Owner Settings
  // ----------------------------------------------------
  async updateBusiness(req: AuthenticatedRequest, res: Response) {
    try {
      const business = await businessService.updateBusinessDetails(req.body);
      appCache.invalidatePrefix('business');
      return sendSuccess(res, business, 'Business details updated');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to update business', 400);
    }
  }

  async updateOwner(req: AuthenticatedRequest, res: Response) {
    try {
      const owner = await ownerService.updateOwnerDetails(req.body);
      appCache.invalidatePrefix('owner');
      return sendSuccess(res, owner, 'Owner details updated');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to update owner', 400);
    }
  }

  // ----------------------------------------------------
  // System Settings
  // ----------------------------------------------------
  async getSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const settings = await prisma.setting.findMany();
      return sendSuccess(res, settings, 'Settings fetched');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch settings', 400);
    }
  }

  async updateSetting(req: AuthenticatedRequest, res: Response) {
    try {
      const { key, value, description } = req.body;
      const setting = await prisma.setting.upsert({
        where: { key },
        update: { value, ...(description ? { description } : {}) },
        create: { key, value, description },
      });
      appCache.invalidatePrefix('settings');
      appCache.invalidatePrefix('business');
      return sendSuccess(res, setting, 'Setting updated successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to update setting', 400);
    }
  }
}

export const adminController = new AdminController();
export default adminController;
