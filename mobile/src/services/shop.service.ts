import api from './api';
import { Product, Category, Branch, BusinessInfo, OwnerInfo } from '../types';
import swrCache from '../utils/swrCache';

export class ShopService {
  async getProducts(params?: {
    category_id?: number;
    search?: string;
    featured?: boolean;
    in_stock_only?: boolean;
    sort_by?: string;
  }): Promise<Product[]> {
    const key = `products_${JSON.stringify(params || {})}`;
    const cached = swrCache.get<Product[]>(key);

    const fetcher = async () => {
      const res = await api.get('/products', { params });
      const data = res.data.data;
      swrCache.set(key, data);
      return data;
    };

    // If cache exists, return cached data immediately and refresh in background
    if (cached) {
      fetcher().catch(() => {});
      return cached;
    }

    return await fetcher();
  }

  async getProductsWithSwr(
    params: {
      category_id?: number;
      search?: string;
      featured?: boolean;
      in_stock_only?: boolean;
      sort_by?: string;
    } | undefined,
    onData: (data: Product[], isFromCache: boolean) => void
  ): Promise<Product[]> {
    const key = `products_${JSON.stringify(params || {})}`;
    return swrCache.execute(
      key,
      async () => {
        const res = await api.get('/products', { params });
        return res.data.data;
      },
      onData
    );
  }

  async getFeaturedProducts(): Promise<Product[]> {
    const key = 'featured_products';
    const cached = swrCache.get<Product[]>(key);

    const fetcher = async () => {
      const res = await api.get('/products/featured');
      const data = res.data.data;
      swrCache.set(key, data);
      return data;
    };

    if (cached) {
      fetcher().catch(() => {});
      return cached;
    }

    return await fetcher();
  }

  async getFeaturedProductsWithSwr(
    onData: (data: Product[], isFromCache: boolean) => void
  ): Promise<Product[]> {
    return swrCache.execute(
      'featured_products',
      async () => {
        const res = await api.get('/products/featured');
        return res.data.data;
      },
      onData
    );
  }

  async getProductById(id: number): Promise<Product> {
    const key = `product_${id}`;
    const cached = swrCache.get<Product>(key);

    const fetcher = async () => {
      const res = await api.get(`/products/${id}`);
      const data = res.data.data;
      swrCache.set(key, data);
      return data;
    };

    if (cached) {
      fetcher().catch(() => {});
      return cached;
    }

    return await fetcher();
  }

  async getCategories(): Promise<Category[]> {
    const key = 'categories';
    const cached = swrCache.get<Category[]>(key);

    const fetcher = async () => {
      const res = await api.get('/categories');
      const data = res.data.data;
      swrCache.set(key, data);
      return data;
    };

    if (cached) {
      fetcher().catch(() => {});
      return cached;
    }

    return await fetcher();
  }

  async getCategoriesWithSwr(
    onData: (data: Category[], isFromCache: boolean) => void
  ): Promise<Category[]> {
    return swrCache.execute(
      'categories',
      async () => {
        const res = await api.get('/categories');
        return res.data.data;
      },
      onData
    );
  }

  async getBranches(): Promise<Branch[]> {
    const res = await api.get('/branches');
    return res.data.data;
  }

  async getOrderingBranch(): Promise<Branch> {
    const res = await api.get('/branches/ordering-branch');
    return res.data.data;
  }

  async getBusinessDetails(): Promise<BusinessInfo> {
    const key = 'business_details';
    const cached = swrCache.get<BusinessInfo>(key);

    const fetcher = async () => {
      const res = await api.get('/business/details');
      const data = res.data.data;
      swrCache.set(key, data);
      return data;
    };

    if (cached) {
      fetcher().catch(() => {});
      return cached;
    }

    return await fetcher();
  }

  async getOwnerDetails(): Promise<OwnerInfo> {
    const key = 'owner_details';
    const cached = swrCache.get<OwnerInfo>(key);

    const fetcher = async () => {
      const res = await api.get('/owner/details');
      const data = res.data.data;
      swrCache.set(key, data);
      return data;
    };

    if (cached) {
      fetcher().catch(() => {});
      return cached;
    }

    return await fetcher();
  }
}

export const shopService = new ShopService();
export default shopService;
