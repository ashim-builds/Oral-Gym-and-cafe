import prisma from '../config/db';

export class CustomerService {
  /**
   * Admin: List all customers with total order counts (safe: never includes OTP hash)
   */
  async getAllCustomersAdmin(query: { search?: string; page?: number; limit?: number }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 30;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search && query.search.trim()) {
      const search = query.search.trim();
      where.OR = [
        { name: { contains: search } },
        { phone_number: { contains: search } },
        { email: { contains: search } },
        { address: { contains: search } },
      ];
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          phone_number: true,
          name: true,
          email: true,
          address: true,
          profile_image: true,
          created_at: true,
          updated_at: true,
          _count: {
            select: { orders: true },
          },
        },
      }),
    ]);

    return {
      customers: customers.map((c) => ({
        id: c.id,
        phone_number: c.phone_number,
        name: c.name,
        email: c.email,
        address: c.address,
        profile_image: c.profile_image,
        total_orders: c._count.orders,
        created_at: c.created_at,
        updated_at: c.updated_at,
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
   * Admin: Get customer details with their orders
   */
  async getCustomerByIdAdmin(customerId: number) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        phone_number: true,
        name: true,
        email: true,
        address: true,
        profile_image: true,
        created_at: true,
        updated_at: true,
        orders: {
          orderBy: { created_at: 'desc' },
          include: {
            branch: { select: { name: true } },
            items: true,
          },
        },
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    return {
      ...customer,
      orders: customer.orders.map((o) => ({
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
    };
  }

  /**
   * Admin: Delete customer and associated records
   */
  async deleteCustomerAdmin(customerId: number) {
    return await prisma.$transaction(async (tx) => {
      const orders = await tx.order.findMany({
        where: { customer_id: customerId },
        select: { id: true },
      });
      const orderIds = orders.map((o) => o.id);

      if (orderIds.length > 0) {
        await tx.orderItem.deleteMany({
          where: { order_id: { in: orderIds } },
        });
        await tx.order.deleteMany({
          where: { id: { in: orderIds } },
        });
      }

      await tx.notification.deleteMany({
        where: { customer_id: customerId },
      });
      await tx.pushToken.deleteMany({
        where: { customer_id: customerId },
      });

      return await tx.customer.delete({
        where: { id: customerId },
      });
    });
  }
}

export const customerService = new CustomerService();
export default customerService;

