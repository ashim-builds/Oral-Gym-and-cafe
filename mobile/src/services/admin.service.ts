import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './api';

const ADMIN_TOKEN_KEY = 'oral_gym_admin_jwt_token';

export async function saveAdminToken(token: string): Promise<void> {
  try {
    if (await SecureStore.isAvailableAsync()) {
      await SecureStore.setItemAsync(ADMIN_TOKEN_KEY, token);
    } else {
      await AsyncStorage.setItem(ADMIN_TOKEN_KEY, token);
    }
  } catch {
    await AsyncStorage.setItem(ADMIN_TOKEN_KEY, token);
  }
}

export async function getAdminToken(): Promise<string | null> {
  try {
    if (await SecureStore.isAvailableAsync()) {
      const token = await SecureStore.getItemAsync(ADMIN_TOKEN_KEY);
      if (token) return token;
    }
    return await AsyncStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return await AsyncStorage.getItem(ADMIN_TOKEN_KEY);
  }
}

export async function removeAdminToken(): Promise<void> {
  try {
    if (await SecureStore.isAvailableAsync()) {
      await SecureStore.deleteItemAsync(ADMIN_TOKEN_KEY);
    }
    await AsyncStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    await AsyncStorage.removeItem(ADMIN_TOKEN_KEY);
  }
}

// Axios instance with Admin Authorization Header
export const adminApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

adminApi.interceptors.request.use(async (config) => {
  const token = await getAdminToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export class MobileAdminService {
  async login(email: string, passwordPlain: string) {
    const res = await adminApi.post('/admin/auth/login', {
      email,
      password: passwordPlain,
    });
    const { token, admin } = res.data.data;
    await saveAdminToken(token);
    return { token, admin };
  }

  async logout() {
    await removeAdminToken();
  }

  async getDashboard() {
    const res = await adminApi.get('/admin/dashboard');
    return res.data.data;
  }

  // Products
  async getProducts(params?: any) {
    const res = await adminApi.get('/admin/products', { params });
    return res.data.data;
  }

  async createProduct(data: any) {
    const res = await adminApi.post('/admin/products', data);
    return res.data.data;
  }

  async updateProduct(id: number, data: any) {
    const res = await adminApi.put(`/admin/products/${id}`, data);
    return res.data.data;
  }

  async deleteProduct(id: number) {
    const res = await adminApi.delete(`/admin/products/${id}`);
    return res.data.data;
  }

  // Categories
  async getCategories() {
    const res = await adminApi.get('/admin/categories');
    return res.data.data;
  }

  async createCategory(data: any) {
    const res = await adminApi.post('/admin/categories', data);
    return res.data.data;
  }

  async updateCategory(id: number, data: any) {
    const res = await adminApi.put(`/admin/categories/${id}`, data);
    return res.data.data;
  }

  async deleteCategory(id: number) {
    const res = await adminApi.delete(`/admin/categories/${id}`);
    return res.data.data;
  }

  // Orders
  async getOrders(params?: any) {
    const res = await adminApi.get('/admin/orders', { params });
    return res.data.data;
  }

  async updateOrderStatus(id: number, data: { order_status?: string; payment_status?: string; notes?: string }) {
    const res = await adminApi.put(`/admin/orders/${id}/status`, data);
    return res.data.data;
  }

  // Branches
  async getBranches() {
    const res = await adminApi.get('/admin/branches');
    return res.data.data;
  }

  async createBranch(data: any) {
    const res = await adminApi.post('/admin/branches', data);
    return res.data.data;
  }

  async updateBranch(id: number, data: any) {
    const res = await adminApi.put(`/admin/branches/${id}`, data);
    return res.data.data;
  }

  async deleteBranch(id: number) {
    const res = await adminApi.delete(`/admin/branches/${id}`);
    return res.data.data;
  }

  // Customers
  async getCustomers(params?: any) {
    const res = await adminApi.get('/admin/customers', { params });
    return res.data.data;
  }

  async getCustomerById(id: number) {
    const res = await adminApi.get(`/admin/customers/${id}`);
    return res.data.data;
  }

  async deleteCustomer(id: number) {
    const res = await adminApi.delete(`/admin/customers/${id}`);
    return res.data.data;
  }


  // Business & Owner
  async updateBusiness(data: any) {
    const res = await adminApi.put('/admin/business', data);
    return res.data.data;
  }

  async updateOwner(data: any) {
    const res = await adminApi.put('/admin/owner', data);
    return res.data.data;
  }

  // Settings
  async getSettings() {
    const res = await adminApi.get('/admin/settings');
    return res.data.data;
  }

  async updateSetting(key: string, value: string, description?: string) {
    const res = await adminApi.put('/admin/settings', { key, value, description });
    return res.data.data;
  }
}

export const mobileAdminService = new MobileAdminService();
export default mobileAdminService;
