import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import orderService from '../services/order.service';
import { createOrderSchema } from '../validators';
import prisma from '../config/db';
import { ENV } from '../config/env';

export class OrderController {
  /**
   * POST /api/orders
   * Place an order (Requires Customer Authentication)
   */
  async createOrder(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.customer) {
        return sendError(res, 'Authentication required to place an order.', 401);
      }

      const validatedData = createOrderSchema.parse(req.body);

      const order = await orderService.createOrder({
        customerId: req.customer.id,
        order_type: validatedData.order_type,
        payment_method: validatedData.payment_method,
        delivery_address: validatedData.delivery_address || undefined,
        customer_name: validatedData.customer_name,
        customer_phone: validatedData.customer_phone,
        notes: validatedData.notes || undefined,
        items: validatedData.items,
      });

      return sendSuccess(res, order, 'Order placed successfully! We will prepare your items.', 201);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to place order', 400);
    }
  }

  /**
   * GET /api/orders
   * Get all orders for the current authenticated customer
   */
  async getMyOrders(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.customer) {
        return sendError(res, 'Authentication required to view order history.', 401);
      }

      const orders = await orderService.getCustomerOrders(req.customer.id);
      return sendSuccess(res, orders, 'Customer orders fetched successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch orders', 400);
    }
  }

  /**
   * GET /api/orders/:id
   * Get single order details for current authenticated customer
   */
  async getOrderById(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.customer) {
        return sendError(res, 'Authentication required', 401);
      }

      const orderId = parseInt(String(req.params.id), 10);
      if (isNaN(orderId)) {
        return sendError(res, 'Invalid order ID', 400);
      }

      const order = await orderService.getCustomerOrderById(req.customer.id, orderId);
      return sendSuccess(res, order, 'Order details fetched successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Order not found', 404);
    }
  }

  /**
   * POST /api/orders/preview
   * Preview checkout calculation without placing order (revalidates stock and latest prices)
   */
  async previewCheckout(req: AuthenticatedRequest, res: Response) {
    try {
      const { items, order_type } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return sendError(res, 'Cart is empty', 400);
      }

      const activeBranch = await prisma.branch.findFirst({
        where: { is_active: true, can_order: true },
      });

      let subtotal = 0;
      const previewItems: any[] = [];
      const stockErrors: string[] = [];

      for (const item of items) {
        const product = await prisma.product.findUnique({
          where: { id: parseInt(item.product_id, 10) },
        });

        if (!product || !product.is_available) {
          stockErrors.push(`Item ID ${item.product_id} is no longer available.`);
          continue;
        }

        const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
        if (product.stock_quantity < quantity) {
          stockErrors.push(
            `"${product.name}" only has ${product.stock_quantity} units in stock (you requested ${quantity}).`
          );
        }

        const unitPrice = product.discount_price ? Number(product.discount_price) : Number(product.price);
        const itemSubtotal = unitPrice * quantity;
        subtotal += itemSubtotal;

        previewItems.push({
          product_id: product.id,
          name: product.name,
          main_image: product.main_image,
          unit_price: unitPrice,
          original_price: Number(product.price),
          quantity,
          subtotal: itemSubtotal,
          available_stock: product.stock_quantity,
        });
      }

      const deliveryCharge = order_type === 'DELIVERY' ? ENV.DEFAULT_DELIVERY_CHARGE : 0;
      const totalAmount = subtotal + deliveryCharge;

      return sendSuccess(res, {
        subtotal,
        delivery_charge: deliveryCharge,
        total_amount: totalAmount,
        items: previewItems,
        stock_errors: stockErrors,
        can_place_order: stockErrors.length === 0 && !!activeBranch,
        active_branch: activeBranch,
      });
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to calculate checkout preview', 400);
    }
  }
}

export const orderController = new OrderController();
export default orderController;
