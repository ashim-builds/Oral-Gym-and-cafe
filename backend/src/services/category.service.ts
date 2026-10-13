import prisma from '../config/db';

export class CategoryService {
  /**
   * Get all active categories for mobile & public store
   */
  async getPublicCategories() {
    return await prisma.category.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            products: {
              where: { is_available: true },
            },
          },
        },
      },
    });
  }

  /**
   * Admin: Get all categories
   */
  async getAllCategoriesAdmin() {
    return await prisma.category.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  /**
   * Helper to create URL-friendly slug
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Admin: Create category
   */
  async createCategory(data: { name: string; image?: string; is_active?: boolean }) {
    let slug = this.generateSlug(data.name);
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    return await prisma.category.create({
      data: {
        name: data.name,
        slug,
        image: data.image,
        is_active: data.is_active !== undefined ? data.is_active : true,
      },
    });
  }

  /**
   * Admin: Update category
   */
  async updateCategory(id: number, data: { name?: string; image?: string; is_active?: boolean }) {
    let slug: string | undefined;
    if (data.name) {
      slug = this.generateSlug(data.name);
      const existing = await prisma.category.findFirst({
        where: { slug, id: { not: id } },
      });
      if (existing) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    return await prisma.category.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name, slug } : {}),
        ...(data.image !== undefined ? { image: data.image } : {}),
        ...(data.is_active !== undefined ? { is_active: data.is_active } : {}),
      },
    });
  }

  /**
   * Admin: Delete category
   */
  async deleteCategory(id: number) {
    const productCount = await prisma.product.count({
      where: { category_id: id },
    });
    if (productCount > 0) {
      throw new Error(`Cannot delete category with ${productCount} assigned products. Please reassign products first.`);
    }

    return await prisma.category.delete({
      where: { id },
    });
  }
}

export const categoryService = new CategoryService();
export default categoryService;
