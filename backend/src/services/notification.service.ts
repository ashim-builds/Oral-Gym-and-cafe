import prisma from '../config/db';

export class NotificationService {
  /**
   * Dispatch push notification via Expo Push API
   */
  async sendPushNotification(tokens: string[], title: string, body: string, data?: any) {
    if (!tokens || tokens.length === 0) return;

    // Filter valid Expo Push Tokens
    const validTokens = tokens.filter(
      (t) => typeof t === 'string' && (t.startsWith('ExponentPushToken') || t.startsWith('ExpoPushToken'))
    );

    if (validTokens.length === 0) return;

    const messages = validTokens.map((to) => ({
      to,
      sound: 'default',
      title,
      body,
      data: data || {},
      priority: 'high',
      channelId: 'default',
    }));

    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });
    } catch (err: any) {
      console.warn('Failed to send push notification via Expo:', err.message);
    }
  }


  /**
   * Register or update an Expo Push Token
   */
  async registerPushToken(
    token: string,
    user_type: 'CUSTOMER' | 'ADMIN' | 'GUEST',
    customer_id?: number,
    admin_id?: number,
    device_type?: string
  ) {
    if (!token) return null;

    return await prisma.pushToken.upsert({
      where: { token },
      update: {
        user_type,
        customer_id: customer_id || null,
        admin_id: admin_id || null,
        device_type: device_type || null,
      },
      create: {
        token,
        user_type,
        customer_id: customer_id || null,
        admin_id: admin_id || null,
        device_type: device_type || null,
      },
    });
  }

  /**
   * Create an in-app notification record and send push
   */
  async createNotification(params: {
    recipient_type: 'CUSTOMER' | 'ADMIN' | 'ALL';
    customer_id?: number;
    admin_id?: number;
    title: string;
    message: string;
    type?: string;
    data?: any;
    sendPush?: boolean;
  }) {
    const {
      recipient_type,
      customer_id,
      admin_id,
      title,
      message,
      type = 'SYSTEM',
      data,
      sendPush = true,
    } = params;

    const notification = await prisma.notification.create({
      data: {
        recipient_type,
        customer_id: customer_id || null,
        admin_id: admin_id || null,
        title,
        message,
        type,
        data: data || undefined,
      },
    });

    if (sendPush) {
      // Find push tokens for target recipient
      let pushTokens: string[] = [];

      if (recipient_type === 'CUSTOMER' && customer_id) {
        const records = await prisma.pushToken.findMany({
          where: { customer_id },
          select: { token: true },
        });
        pushTokens = records.map((r) => r.token);
      } else if (recipient_type === 'ADMIN') {
        const records = await prisma.pushToken.findMany({
          where: { user_type: 'ADMIN' },
          select: { token: true },
        });
        pushTokens = records.map((r) => r.token);
      } else if (recipient_type === 'ALL') {
        const records = await prisma.pushToken.findMany({
          select: { token: true },
        });
        pushTokens = records.map((r) => r.token);
      }

      if (pushTokens.length > 0) {
        this.sendPushNotification(pushTokens, title, message, data).catch(() => {});
      }
    }

    return notification;
  }

  /**
   * Helper: Order Placed -> Notify Customer and Admins
   */
  async notifyOrderPlaced(order: any) {
    const formattedTotal = Number(order.total_amount).toLocaleString();

    // 1. Notify Customer
    await this.createNotification({
      recipient_type: 'CUSTOMER',
      customer_id: order.customer_id,
      title: 'Order Placed Successfully',
      message: `Your order #${order.order_number} for NPR ${formattedTotal} has been received. Payment mode: ${order.payment_method === 'CASH_ON_PICKUP' ? 'Cash on Pickup' : 'Cash on Delivery'}.`,
      type: 'ORDER_PLACED',
      data: { order_id: order.id, order_number: order.order_number },
    });

    // 2. Notify Admins
    await this.createNotification({
      recipient_type: 'ADMIN',
      title: 'New Order Received',
      message: `Order #${order.order_number} placed by ${order.customer_name} (${order.customer_phone}) for NPR ${formattedTotal}.`,
      type: 'ORDER_PLACED',
      data: { order_id: order.id, order_number: order.order_number },
    });
  }

  /**
   * Helper: Order Status Changed -> Notify Customer
   */
  async notifyOrderStatusChanged(order: any, newStatus: string) {
    let title = `Order Status Update`;
    let body = `Your order #${order.order_number} status is now ${newStatus}.`;

    if (newStatus === 'CONFIRMED') {
      title = 'Order Confirmed';
      body = `Your order #${order.order_number} has been verified and confirmed. We are packing your items.`;
    } else if (newStatus === 'PROCESSING') {
      title = 'Preparing Your Order';
      body = `Your order #${order.order_number} is being prepared at our supplement hub.`;
    } else if (newStatus === 'READY') {
      title = order.order_type === 'PICKUP' ? 'Ready for Store Pickup' : 'Out for Delivery';
      body = order.order_type === 'PICKUP'
        ? `Your order #${order.order_number} is packed and ready for pickup at our branch!`
        : `Your order #${order.order_number} is out for delivery. Please keep cash ready.`;
    } else if (newStatus === 'COMPLETED') {
      title = 'Order Completed';
      body = `Order #${order.order_number} has been successfully delivered and paid. Thank you for choosing Orla Gym & Cafe!`;
    } else if (newStatus === 'CANCELLED') {
      title = 'Order Cancelled';
      body = `Your order #${order.order_number} was cancelled. Contact us if you have questions.`;
    }

    await this.createNotification({
      recipient_type: 'CUSTOMER',
      customer_id: order.customer_id,
      title,
      message: body,
      type: 'ORDER_STATUS',
      data: { order_id: order.id, order_number: order.order_number, new_status: newStatus },
    });
  }

  /**
   * Helper: Low Stock Alert -> Notify Admins
   */
  async notifyLowStock(product: any) {
    await this.createNotification({
      recipient_type: 'ADMIN',
      title: 'Low Stock Alert',
      message: `Product "${product.name}" is low on stock (${product.stock_quantity} units remaining). Please restock.`,
      type: 'LOW_STOCK',
      data: { product_id: product.id, product_name: product.name },
    });
  }

  /**
   * Get Customer Notifications
   */
  async getCustomerNotifications(customer_id: number) {
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { customer_id },
          { recipient_type: 'ALL' },
        ],
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        OR: [
          { customer_id, is_read: false },
          { recipient_type: 'ALL', is_read: false },
        ],
      },
    });

    return { notifications, unreadCount };
  }

  /**
   * Get Admin Notifications
   */
  async getAdminNotifications() {
    const notifications = await prisma.notification.findMany({
      where: {
        recipient_type: 'ADMIN',
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        recipient_type: 'ADMIN',
        is_read: false,
      },
    });

    return { notifications, unreadCount };
  }

  /**
   * Mark Single Notification as Read
   */
  async markAsRead(id: number) {
    return await prisma.notification.update({
      where: { id },
      data: { is_read: true },
    });
  }

  /**
   * Mark All Customer Notifications as Read
   */
  async markAllAsReadCustomer(customer_id: number) {
    return await prisma.notification.updateMany({
      where: {
        OR: [
          { customer_id, is_read: false },
          { recipient_type: 'ALL', is_read: false },
        ],
      },
      data: { is_read: true },
    });
  }

  /**
   * Mark All Admin Notifications as Read
   */
  async markAllAsReadAdmin() {
    return await prisma.notification.updateMany({
      where: {
        recipient_type: 'ADMIN',
        is_read: false,
      },
      data: { is_read: true },
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;
