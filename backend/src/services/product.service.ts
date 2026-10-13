import prisma from '../config/db';

export class ProductService {
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
   * Public: Get products with filtering, search, pagination
   */
  async getPublicProducts(query: {
    category_id?: number;
    search?: string;
    featured?: boolean;
    in_stock_only?: boolean;
    page?: number;
    limit?: number;
    sort_by?: 'latest' | 'price_asc' | 'price_desc' | 'popular';
  }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 50) : 20;
    const skip = (page - 1) * limit;

    const where: any = {
      is_available: true,
    };

    if (query.category_id) {
      where.category_id = query.category_id;
    }

    if (query.featured !== undefined) {
      where.is_featured = query.featured;
    }

    if (query.in_stock_only) {
      where.stock_quantity = { gt: 0 };
    }

    if (query.search && query.search.trim()) {
      const searchTerm = query.search.trim();
      where.OR = [
        { name: { contains: searchTerm } },
        { description: { contains: searchTerm } },
      ];
    }

    let orderBy: any = { created_at: 'desc' };
    if (query.sort_by === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (query.sort_by === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (query.sort_by === 'popular') {
      orderBy = { is_featured: 'desc' };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          images: {
            orderBy: { sort_order: 'asc' },
          },
        },
      }),
    ]);

    return {
      products: products.map((p) => ({
        ...p,
        price: Number(p.price),
        discount_price: p.discount_price ? Number(p.discount_price) : null,
        is_in_stock: p.stock_quantity > 0,
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
   * Public: Get Featured Products
   */
  async getFeaturedProducts(limit = 8) {
    const products = await prisma.product.findMany({
      where: {
        is_available: true,
        is_featured: true,
      },
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return products.map((p) => ({
      ...p,
      price: Number(p.price),
      discount_price: p.discount_price ? Number(p.discount_price) : null,
      is_in_stock: p.stock_quantity > 0,
    }));
  }

  /**
   * Public / Admin: Get single product by ID or Slug
   */
  async getProductById(id: number) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: {
          orderBy: { sort_order: 'asc' },
        },
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    return {
      ...product,
      price: Number(product.price),
      discount_price: product.discount_price ? Number(product.discount_price) : null,
      is_in_stock: product.stock_quantity > 0,
    };
  }

  /**
   * Admin: Get all products with filters
   */
  async getAllProductsAdmin(query: {
    category_id?: number;
    search?: string;
    is_available?: boolean;
    out_of_stock?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.category_id) {
      where.category_id = query.category_id;
    }

    if (query.is_available !== undefined) {
      where.is_available = query.is_available;
    }

    if (query.out_of_stock) {
      where.stock_quantity = { lte: 0 };
    }

    if (query.search && query.search.trim()) {
      const searchTerm = query.search.trim();
      where.OR = [
        { name: { contains: searchTerm } },
        { description: { contains: searchTerm } },
      ];
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          category: true,
          _count: { select: { order_items: true } },
        },
      }),
    ]);

    return {
      products: products.map((p) => ({
        ...p,
        price: Number(p.price),
        discount_price: p.discount_price ? Number(p.discount_price) : null,
        is_in_stock: p.stock_quantity > 0,
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
   * Admin: Create product
   */
  async createProduct(data: {
    category_id?: number;
    name: string;
    description: string;
    price: number;
    discount_price?: number;
    stock_quantity: number;
    main_image: string;
    is_available?: boolean;
    is_featured?: boolean;
    images?: string[];
  }) {
    let slug = this.generateSlug(data.name);
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    // If category_id is provided, verify it exists. Otherwise leave null (do NOT auto-create categories)
    let resolvedCategoryId: number | null = null;
    if (data.category_id) {
      const requestedCatId = Number(data.category_id);
      const category = await prisma.category.findUnique({ where: { id: requestedCatId } });
      if (category) {
        resolvedCategoryId = category.id;
      }
    }

    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          category_id: resolvedCategoryId,
          name: data.name,
          slug,
          description: data.description,
          price: data.price,
          discount_price: data.discount_price !== undefined ? data.discount_price : null,
          stock_quantity: data.stock_quantity,
          main_image: data.main_image,
          is_available: data.is_available !== undefined ? data.is_available : true,
          is_featured: !!data.is_featured,
        },
      });

      if (data.images && data.images.length > 0) {
        await tx.productImage.createMany({
          data: data.images.map((imgUrl, idx) => ({
            product_id: product.id,
            image_url: imgUrl,
            sort_order: idx,
          })),
        });
      }

      return product;
    });
  }

  /**
   * Admin: Update product
   */
  async updateProduct(
    id: number,
    data: {
      category_id?: number;
      name?: string;
      description?: string;
      price?: number;
      discount_price?: number | null;
      stock_quantity?: number;
      main_image?: string;
      is_available?: boolean;
      is_featured?: boolean;
      images?: string[];
    }
  ) {
    let slug: string | undefined;
    if (data.name) {
      slug = this.generateSlug(data.name);
      const existing = await prisma.product.findFirst({
        where: { slug, id: { not: id } },
      });
      if (existing) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    let validCategoryId: number | null | undefined = undefined;
    if (data.category_id !== undefined) {
      if (data.category_id === null) {
        validCategoryId = null;
      } else {
        const cat = await prisma.category.findUnique({ where: { id: Number(data.category_id) } });
        validCategoryId = cat ? cat.id : null;
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id },
        data: {
          ...(validCategoryId !== undefined ? { category_id: validCategoryId } : {}),
          ...(data.name !== undefined ? { name: data.name, slug } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.price !== undefined ? { price: data.price } : {}),
          ...(data.discount_price !== undefined ? { discount_price: data.discount_price } : {}),
          ...(data.stock_quantity !== undefined ? { stock_quantity: data.stock_quantity } : {}),
          ...(data.main_image !== undefined ? { main_image: data.main_image } : {}),
          ...(data.is_available !== undefined ? { is_available: data.is_available } : {}),
          ...(data.is_featured !== undefined ? { is_featured: data.is_featured } : {}),
        },
      });

      if (data.images !== undefined) {
        await tx.productImage.deleteMany({ where: { product_id: id } });
        if (data.images.length > 0) {
          await tx.productImage.createMany({
            data: data.images.map((imgUrl, idx) => ({
              product_id: id,
              image_url: imgUrl,
              sort_order: idx,
            })),
          });
        }
      }

      return product;
    });

    return updated;
  }

  /**
   * Admin: Delete product (Clean cascade child records safely)
   */
  async deleteProduct(id: number) {
    return await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({
        where: { product_id: id },
      });
      await tx.orderItem.deleteMany({
        where: { product_id: id },
      });
      return await tx.product.delete({
        where: { id },
      });
    });
  }
}

export const productService = new ProductService();
export default productService;

