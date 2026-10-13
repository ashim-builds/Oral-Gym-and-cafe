import { OrderStatus, OrderType, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import prisma from '../config/db';
import { ENV } from '../config/env';
import notificationService from './notification.service';
import { appCache } from '../utils/cache';

export interface CheckoutItemInput {
  product_id: number;
  quantity: number;
}

export interface CreateOrderInput {
  customerId: number;
  order_type: 'DELIVERY' | 'PICKUP';
  payment_method: 'CASH_ON_DELIVERY' | 'CASH_ON_PICKUP';
  delivery_address?: string;
  customer_name?: string;
  customer_phone?: string;
  notes?: string;
  items: CheckoutItemInput[];
}

export function normalizeOrderStatus(status?: string | OrderStatus): OrderStatus | undefined {
  if (!status) return undefined;
  const s = String(status).toUpperCase().trim();
  switch (s) {
    case 'PENDING':
      return OrderStatus.PENDING;
    case 'CONFIRMED':
      return OrderStatus.CONFIRMED;
    case 'PROCESSING':
      return OrderStatus.PROCESSING;
    case 'READY':
    case 'OUT_FOR_DELIVERY':
    case 'READY_FOR_PICKUP':
      return OrderStatus.READY;
    case 'COMPLETED':
    case 'DELIVERED':
      return OrderStatus.COMPLETED;
    case 'CANCELLED':
    case 'CANCELED':
      return OrderStatus.CANCELLED;
    default:
      return undefined;
  }
}

export function normalizePaymentStatus(status?: string | PaymentStatus): PaymentStatus | undefined {
  if (!status) return undefined;
  const s = String(status).toUpperCase().trim();
  switch (s) {
    case 'PAID':
      return PaymentStatus.PAID;
    case 'PENDING':
    case 'UNPAID':
      return PaymentStatus.PENDING;
    default:
      return undefined;
  }
}

export class OrderService {
  /**
   * Helper to generate human-readable unique order number (e.g., OG-20260927-4821)
   */
  private generateOrderNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `OG-${dateStr}-${randomSuffix}`;
  }

  /**
   * Create an order (Transactional checkout with stock decrement and server-side price calculation)
   */
  async createOrder(input: CreateOrderInput) {
    if (!input.items || input.items.length === 0) {
      throw new Error('Your cart is empty');
    }

    // 1. Verify active ordering branch
    const activeBranch = await prisma.branch.findFirst({
      where: {
        is_active: true,
        can_order: true,
      },
    });

    if (!activeBranch) {
      throw new Error('Online ordering is currently unavailable. No active ordering branch is configured.');
    }

    // 2. Fetch authenticated customer details
    const customer = await prisma.customer.findUnique({
      where: { id: input.customerId },
    });

    if (!customer) {
      throw new Error('Customer account not found. Please log in again.');
    }

    const customerName = (input.customer_name || customer.name || 'Customer').trim();
    const customerPhone = (input.customer_phone || customer.phone_number).trim();
    const deliveryAddress = input.order_type === 'DELIVERY' 
      ? (input.delivery_address || customer.address || '').trim() 
      : null;

    if (input.order_type === 'DELIVERY' && (!deliveryAddress || deliveryAddress.length < 3)) {
      throw new Error('Please provide a valid delivery address for delivery orders');
    }

    // Validate payment method matches order type
    if (input.order_type === 'DELIVERY' && input.payment_method !== 'CASH_ON_DELIVERY') {
      throw new Error('Delivery orders only support Cash on Delivery');
    }

    if (input.order_type === 'PICKUP' && input.payment_method !== 'CASH_ON_PICKUP') {
      throw new Error('Pickup orders only support Cash on Pickup');
    }

    // 3. MySQL Transaction: Validate items, re-check stock, calculate prices, create order & items, decrement stock
    const result = await prisma.$transaction(async (tx) => {
      let subtotalNum = 0;
      const orderItemsToCreate: Array<{
        product_id: number;
        product_name: string;
        product_price: number;
        quantity: number;
        subtotal: number;
      }> = [];

      for (const item of input.items) {
        if (!item.product_id || item.quantity <= 0) {
          throw new Error('Invalid item or quantity in order request');
        }

        // Fetch fresh product data from MySQL
        const product = await tx.product.findUnique({
          where: { id: item.product_id },
        });

        if (!product || !product.is_available) {
          throw new Error(`Product "${product?.name || 'Selected product'}" is currently unavailable.`);
        }

        if (product.stock_quantity < item.quantity) {
          throw new Error(
            `Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, requested: ${item.quantity}.`
          );
        }

        // Determine effective price (discount price if available, else regular price)
        const unitPrice = product.discount_price ? Number(product.discount_price) : Number(product.price);
        const itemSubtotal = unitPrice * item.quantity;
        subtotalNum += itemSubtotal;

        orderItemsToCreate.push({
          product_id: product.id,
          product_name: product.name,
          product_price: unitPrice,
          quantity: item.quantity,
          subtotal: itemSubtotal,
        });

        // Decrement stock
        await tx.product.update({
          where: { id: product.id },
          data: {
            stock_quantity: { decrement: item.quantity },
          },
        });
      }

      // Calculate delivery charge from admin settings
      let configuredDeliveryCharge = ENV.DEFAULT_DELIVERY_CHARGE;
      let freeDeliveryThreshold: number | null = null;
      try {
        const settings = await tx.setting.findMany({
          where: {
            key: { in: ['delivery_fee', 'delivery_charge', 'free_delivery_threshold'] },
          },
        });
        for (const s of settings) {
          if (s.key === 'delivery_fee' || s.key === 'delivery_charge') {
            const val = parseFloat(s.value);
            if (!isNaN(val) && val >= 0) configuredDeliveryCharge = val;
          }
          if (s.key === 'free_delivery_threshold') {
            const val = parseFloat(s.value);
            if (!isNaN(val) && val > 0) freeDeliveryThreshold = val;
          }
        }
      } catch {}

      let deliveryChargeNum = 0;
      if (input.order_type === 'DELIVERY') {
        if (freeDeliveryThreshold && subtotalNum >= freeDeliveryThreshold) {
          deliveryChargeNum = 0;
        } else {
          deliveryChargeNum = configuredDeliveryCharge;
        }
      }
      const totalAmountNum = subtotalNum + deliveryChargeNum;

      // Update customer address/name if not previously saved
      if (!customer.name && customerName) {
        await tx.customer.update({
          where: { id: customer.id },
          data: { name: customerName },
        });
      }
      if (!customer.address && deliveryAddress) {
        await tx.customer.update({
          where: { id: customer.id },
          data: { address: deliveryAddress },
        });
      }

      // Generate order number
      let orderNumber = this.generateOrderNumber();
      // Ensure uniqueness
      const existingOrder = await tx.order.findUnique({ where: { order_number: orderNumber } });
      if (existingOrder) {
        orderNumber = `${orderNumber}-${Date.now().toString().slice(-4)}`;
      }

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          order_number: orderNumber,
          customer_id: customer.id,
          branch_id: activeBranch.id,
          customer_name: customerName,
          customer_phone: customerPhone,
          delivery_address: deliveryAddress,
          order_type: input.order_type as OrderType,
          payment_method: input.payment_method as PaymentMethod,
          payment_status: PaymentStatus.PENDING,
          order_status: OrderStatus.PENDING,
          subtotal: new Prisma.Decimal(subtotalNum),
          delivery_charge: new Prisma.Decimal(deliveryChargeNum),
          total_amount: new Prisma.Decimal(totalAmountNum),
          notes: input.notes?.trim() || null,
          items: {
            create: orderItemsToCreate.map((item) => ({
              product_id: item.product_id,
              product_name: item.product_name,
              product_price: new Prisma.Decimal(item.product_price),
              quantity: item.quantity,
              subtotal: new Prisma.Decimal(item.subtotal),
            })),
          },
        },
        include: {
          items: true,
          branch: true,
        },
      });

      return newOrder;
    });

    // Invalidate product catalog cache due to stock decrement
    appCache.invalidatePrefix('products');

    // Notify customer and admin in background
    notificationService.notifyOrderPlaced(result).catch((err) => {
      console.warn('Failed to send order placed notification:', err.message);
    });

    return {
      id: result.id,
      order_number: result.order_number,
      customer_id: result.customer_id,
      customer_name: result.customer_name,
      customer_phone: result.customer_phone,
      delivery_address: result.delivery_address,
      order_type: result.order_type,
      payment_method: result.payment_method,
      payment_status: result.payment_status,
      order_status: result.order_status,
      subtotal: Number(result.subtotal),
      delivery_charge: Number(result.delivery_charge),
      total_amount: Number(result.total_amount),
      notes: result.notes,
      branch: {
        id: result.branch.id,
        name: result.branch.name,
        address: result.branch.address,
        phone: result.branch.phone,
      },
      items: result.items.map((it) => ({
        id: it.id,
        product_id: it.product_id,
        product_name: it.product_name,
        product_price: Number(it.product_price),
        quantity: it.quantity,
        subtotal: Number(it.subtotal),
      })),
      created_at: result.created_at,
    };
  }

  /**
   * Customer: Get order history
   */
  async getCustomerOrders(customerId: number) {
    const orders = await prisma.order.findMany({
      where: { customer_id: customerId },
      orderBy: { created_at: 'desc' },
      include: {
        branch: {
          select: { id: true, name: true, address: true, phone: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, main_image: true },
            },
          },
        },
      },
    });

    return orders.map((o) => ({
      ...o,
      subtotal: Number(o.subtotal),
      delivery_charge: Number(o.delivery_charge),
      total_amount: Number(o.total_amount),
      items: o.items.map((it) => ({
        ...it,
        product_price: Number(it.product_price),
        subtotal: Number(it.subtotal),
      })),
    }));
  }

  /**
   * Customer: Get single order details (ownership verified)
   */
  async getCustomerOrderById(customerId: number, orderId: number) {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customer_id: customerId,
      },
      include: {
        branch: true,
        items: {
          include: {
            product: {
              select: { id: true, name: true, main_image: true, slug: true },
            },
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found or unauthorized access');
    }

    return {
      ...order,
      subtotal: Number(order.subtotal),
      delivery_charge: Number(order.delivery_charge),
      total_amount: Number(order.total_amount),
      items: order.items.map((it) => ({
        ...it,
        product_price: Number(it.product_price),
        subtotal: Number(it.subtotal),
      })),
    };
  }

  /**
   * Admin: Get all orders with search, filters, pagination
   */
  async getAllOrdersAdmin(query: {
    order_status?: OrderStatus | string;
    payment_status?: PaymentStatus | string;
    order_type?: OrderType | string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 30;
    const skip = (page - 1) * limit;

    const where: any = {};

    const targetOrderStatus = normalizeOrderStatus(query.order_status);
    if (targetOrderStatus) {
      where.order_status = targetOrderStatus;
    }
    const targetPaymentStatus = normalizePaymentStatus(query.payment_status);
    if (targetPaymentStatus) {
      where.payment_status = targetPaymentStatus;
    }
    if (query.order_type && query.order_type !== 'ALL') {
      where.order_type = query.order_type as OrderType;
    }

    if (query.search && query.search.trim()) {
      const search = query.search.trim();
      where.OR = [
        { order_number: { contains: search } },
        { customer_name: { contains: search } },
        { customer_phone: { contains: search } },
      ];
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          branch: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true, phone_number: true, email: true } },
          items: true,
        },
      }),
    ]);

    return {
      orders: orders.map((o) => ({
        ...o,
        subtotal: Number(o.subtotal),
        delivery_charge: Number(o.delivery_charge),
        total_amount: Number(o.total_amount),
        items: o.items.map((it) => ({
          ...it,
          product_price: Number(it.product_price),
          subtotal: Number(it.subtotal),
        })),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin: Get single order details
   */
  async getOrderByIdAdmin(orderId: number) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        branch: true,
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return {
      ...order,
      subtotal: Number(order.subtotal),
      delivery_charge: Number(order.delivery_charge),
      total_amount: Number(order.total_amount),
      items: order.items.map((it) => ({
        ...it,
        product_price: Number(it.product_price),
        subtotal: Number(it.subtotal),
      })),
    };
  }

  /**
   * Admin: Update order status & payment status
   */
  async updateOrderStatusAdmin(
    orderId: number,
    data: {
      order_status?: OrderStatus | string;
      payment_status?: PaymentStatus | string;
      notes?: string;
    }
  ) {
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!existingOrder) {
      throw new Error('Order not found');
    }

    const targetOrderStatus = data.order_status ? normalizeOrderStatus(data.order_status) : undefined;
    const targetPaymentStatus = data.payment_status ? normalizePaymentStatus(data.payment_status) : undefined;

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // If order is being cancelled from non-cancelled state, restore product stock
      if (
        targetOrderStatus === OrderStatus.CANCELLED &&
        existingOrder.order_status !== OrderStatus.CANCELLED
      ) {
        for (const item of existingOrder.items) {
          await tx.product.update({
            where: { id: item.product_id },
            data: {
              stock_quantity: { increment: item.quantity },
            },
          });
        }
      }

      return await tx.order.update({
        where: { id: orderId },
        data: {
          ...(targetOrderStatus ? { order_status: targetOrderStatus } : {}),
          ...(targetPaymentStatus ? { payment_status: targetPaymentStatus } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
        },
        include: {
          branch: true,
          items: true,
        },
      });
    });

    if (targetOrderStatus && existingOrder && targetOrderStatus !== existingOrder.order_status) {
      notificationService.notifyOrderStatusChanged(updatedOrder, targetOrderStatus).catch((err) => {
        console.warn('Failed to send status update notification:', err.message);
      });
    }

    return updatedOrder;
  }



  /**
   * Admin Dashboard Analytics
   */
  async getAdminDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalCustomers,
      totalProducts,
      outOfStockProducts,
      totalOrders,
      pendingOrders,
      todayOrders,
      completedOrders,
      cancelledOrders,
      revenueResult,
      recentOrders,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.product.count({ where: { is_available: true } }),
      prisma.product.count({ where: { stock_quantity: { lte: 0 } } }),
      prisma.order.count(),
      prisma.order.count({ where: { order_status: OrderStatus.PENDING } }),
      prisma.order.count({ where: { created_at: { gte: today } } }),
      prisma.order.count({ where: { order_status: OrderStatus.COMPLETED } }),
      prisma.order.count({ where: { order_status: OrderStatus.CANCELLED } }),
      prisma.order.aggregate({
        _sum: { total_amount: true },
        where: { order_status: { not: OrderStatus.CANCELLED } },
      }),
      prisma.order.findMany({
        take: 8,
        orderBy: { created_at: 'desc' },
        include: {
          customer: { select: { name: true, phone_number: true } },
          branch: { select: { name: true } },
        },
      }),
    ]);

    return {
      totalCustomers,
      totalProducts,
      outOfStockProducts,
      totalOrders,
      pendingOrders,
      todayOrders,
      completedOrders,
      cancelledOrders,
      totalOrderValue: Number(revenueResult._sum.total_amount || 0),
      recentOrders: recentOrders.map((o) => ({
        ...o,
        total_amount: Number(o.total_amount),
      })),
    };
  }
}

export const orderService = new OrderService();
export default orderService;
