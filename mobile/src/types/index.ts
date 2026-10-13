export type AuthState = 'LOADING' | 'FIRST_TIME' | 'GUEST' | 'AUTHENTICATED';

export interface Customer {
  id: number;
  phone_number: string;
  name: string | null;
  email: string | null;
  address: string | null;
  profile_image: string | null;
  total_orders?: number;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  is_active: boolean;
  _count?: {
    products: number;
  };
}

export interface ProductImage {
  id: number;
  image_url: string;
  sort_order: number;
}

export interface Product {
  id: number;
  category_id: number;
  category?: Category;
  name: string;
  slug: string;
  description: string;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  main_image: string;
  is_available: boolean;
  is_featured: boolean;
  is_in_stock: boolean;
  images?: ProductImage[];
}

export interface Branch {
  id: number;
  name: string;
  description: string | null;
  address: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  map_url?: string | null;
  opening_hours: string | null;
  image: string | null;
  can_order: boolean;
  is_active: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type PaymentMethod = 'CASH_ON_DELIVERY' | 'CASH_ON_PICKUP';
export type PaymentStatus = 'PENDING' | 'PAID';
export type OrderType = 'DELIVERY' | 'PICKUP';

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
  product?: {
    id: number;
    name: string;
    main_image: string;
  };
}

export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  branch_id: number;
  customer_name: string;
  customer_phone: string;
  delivery_address: string | null;
  order_type: OrderType;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  subtotal: number;
  delivery_charge: number;
  total_amount: number;
  notes: string | null;
  created_at: string;
  items: OrderItem[];
  branch?: {
    id: number;
    name: string;
    address: string;
    phone: string | null;
  };
}

export interface BusinessInfo {
  id: number;
  name: string;
  tagline?: string | null;
  logo: string | null;
  hero_banner: string | null;
  description: string;
  history: string | null;
  mission: string | null;
  vision: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  social_links?: any;
}

export interface OwnerInfo {
  id: number;
  name: string;
  photo: string | null;
  position: string;
  biography: string;
  experience: string | null;
  contact: string | null;
  email?: string | null;
  social_links?: any;
}
