import { z } from 'zod';

export const sendOtpSchema = z.object({
  phone_number: z.string().min(8, 'Phone number must be at least 8 digits').max(20, 'Phone number is too long'),
});

export const verifyOtpSchema = z.object({
  phone_number: z.string().min(8, 'Phone number must be at least 8 digits'),
  otp: z.string().length(6, 'Verification code must be 6 digits'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  address: z.string().max(255).optional().nullable(),
  profile_image: z.string().url().optional().nullable().or(z.literal('')),
});

export const createOrderSchema = z.object({
  order_type: z.enum(['DELIVERY', 'PICKUP']),
  payment_method: z.enum(['CASH_ON_DELIVERY', 'CASH_ON_PICKUP']),
  delivery_address: z.string().optional().nullable(),
  customer_name: z.string().optional(),
  customer_phone: z.string().optional(),
  notes: z.string().max(500).optional().nullable(),
  items: z.array(
    z.object({
      product_id: z.number().int().positive('Invalid product ID'),
      quantity: z.number().int().positive('Quantity must be at least 1'),
    })
  ).min(1, 'Order must contain at least one item'),
});

export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Category name required'),
  image: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

export const createProductSchema = z.object({
  category_id: z.number().int().positive().optional().nullable(),
  name: z.string().min(2, 'Product name is required'),
  description: z.string().min(5, 'Description is required'),
  price: z.number().positive('Price must be greater than 0'),
  discount_price: z.number().positive().optional().nullable(),
  stock_quantity: z.number().int().min(0, 'Stock cannot be negative'),
  main_image: z.string().min(1, 'Main image is required'),
  is_available: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  images: z.array(z.string()).optional(),
});

export const branchSchema = z.object({
  name: z.string().min(2, 'Branch name is required'),
  description: z.string().optional().nullable(),
  address: z.string().min(3, 'Address is required'),
  phone: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  map_url: z.string().optional().nullable(),
  opening_hours: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  can_order: z.boolean().optional(),
  is_active: z.boolean().optional(),
});
