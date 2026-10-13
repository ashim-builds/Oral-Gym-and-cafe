import prisma from '../config/db';

export class BranchService {
  /**
   * Get all active branches for mobile shop / guest / public
   */
  async getPublicBranches() {
    return await prisma.branch.findMany({
      where: { is_active: true },
      orderBy: [{ can_order: 'desc' }, { name: 'asc' }],
    });
  }

  /**
   * Get single branch by ID
   */
  async getBranchById(id: number) {
    const branch = await prisma.branch.findUnique({
      where: { id },
    });
    if (!branch) {
      throw new Error('Branch not found');
    }
    return branch;
  }

  /**
   * Get the active online ordering branch
   */
  async getActiveOrderingBranch() {
    const branch = await prisma.branch.findFirst({
      where: {
        is_active: true,
        can_order: true,
      },
    });
    return branch;
  }

  /**
   * Admin: Get all branches including inactive
   */
  async getAllBranchesAdmin() {
    return await prisma.branch.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });
  }

  /**
   * Admin: Create a branch
   */
  async createBranch(data: {
    name: string;
    description?: string | null;
    address: string;
    phone?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    map_url?: string | null;
    opening_hours?: string | null;
    image?: string | null;
    can_order?: boolean;
    is_active?: boolean;
  }) {
    return await prisma.$transaction(async (tx) => {
      // If setting can_order = true, ensure only this branch has can_order = true
      if (data.can_order) {
        await tx.branch.updateMany({
          data: { can_order: false },
        });
      }

      return await tx.branch.create({
        data: {
          name: data.name,
          description: data.description,
          address: data.address,
          phone: data.phone,
          latitude: data.latitude,
          longitude: data.longitude,
          map_url: data.map_url,
          opening_hours: data.opening_hours,
          image: data.image,
          can_order: !!data.can_order,
          is_active: data.is_active !== undefined ? data.is_active : true,
        },
      });
    });
  }

  /**
   * Admin: Update branch
   */
  async updateBranch(
    id: number,
    data: {
      name?: string;
      description?: string | null;
      address?: string;
      phone?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      map_url?: string | null;
      opening_hours?: string | null;
      image?: string | null;
      can_order?: boolean;
      is_active?: boolean;
      [key: string]: any;
    }
  ) {
    const payload: Record<string, any> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.address !== undefined) payload.address = data.address;
    if (data.phone !== undefined) payload.phone = data.phone;
    if (data.latitude !== undefined) payload.latitude = data.latitude;
    if (data.longitude !== undefined) payload.longitude = data.longitude;
    if (data.map_url !== undefined) payload.map_url = data.map_url;
    if (data.opening_hours !== undefined) payload.opening_hours = data.opening_hours;
    if (data.image !== undefined) payload.image = data.image;
    if (data.can_order !== undefined) payload.can_order = Boolean(data.can_order);
    if (data.is_active !== undefined) payload.is_active = Boolean(data.is_active);

    return await prisma.$transaction(async (tx) => {
      // If setting can_order to true, remove can_order from all other branches
      if (payload.can_order) {
        await tx.branch.updateMany({
          where: { id: { not: id } },
          data: { can_order: false },
        });
      }

      return await tx.branch.update({
        where: { id },
        data: payload as any,
      });
    });
  }

  /**
   * Admin: Delete branch
   */
  async deleteBranch(id: number) {
    return await prisma.$transaction(async (tx) => {
      // Find orders for this branch if any
      const orders = await tx.order.findMany({
        where: { branch_id: id },
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

      return await tx.branch.delete({
        where: { id },
      });
    });
  }
}

export const branchService = new BranchService();
export default branchService;

