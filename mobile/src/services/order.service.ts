import api from './api';
import { Order, OrderType, PaymentMethod } from '../types';

export interface CreateOrderPayload {
  order_type: OrderType;
  payment_method: PaymentMethod;
  delivery_address?: string;
  customer_name?: string;
  customer_phone?: string;
  notes?: string;
  items: Array<{ product_id: number; quantity: number }>;
}

export class MobileOrderService {
  /**
   * Preview checkout calculation from MySQL (checks stock & prices)
   */
  async previewCheckout(items: Array<{ product_id: number; quantity: number }>, order_type: OrderType) {
    const res = await api.post('/orders/preview', { items, order_type });
    return res.data.data;
  }

  /**
   * Place Order (Protected, Cash on Delivery / Cash on Pickup ONLY)
   */
  async placeOrder(payload: CreateOrderPayload): Promise<Order> {
    const res = await api.post('/orders', payload);
    return res.data.data;
  }

  /**
   * Get Customer Order History (Protected)
   */
  async getMyOrders(): Promise<Order[]> {
    const res = await api.get('/orders');
    return res.data.data;
  }

  /**
   * Get Single Order Details (Protected)
   */
  async getOrderById(id: number): Promise<Order> {
    const res = await api.get(`/orders/${id}`);
    return res.data.data;
  }
}

export const mobileOrderService = new MobileOrderService();
export default mobileOrderService;
