import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, Product } from '../types';

import shopService from '../services/shop.service';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  itemCount: number;
  setDeliveryCharge: (charge: number) => void;
  refreshDeliverySettings: () => Promise<void>;
}

const CART_STORAGE_KEY = 'oral_gym_cart_v1';
const DEFAULT_DELIVERY_FEE = 150.0;

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [configuredDeliveryFee, setConfiguredDeliveryFee] = useState<number>(DEFAULT_DELIVERY_FEE);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<number | null>(null);

  const fetchDeliverySettings = async () => {
    try {
      const data = await shopService.getDeliverySettings();
      if (data && typeof data.delivery_charge === 'number') {
        setConfiguredDeliveryFee(data.delivery_charge);
        setFreeDeliveryThreshold(data.free_delivery_threshold);
      }
    } catch {
      // Keep default
    }
  };

  useEffect(() => {
    loadCart();
    fetchDeliverySettings();
  }, []);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const loadCart = async () => {
    try {
      const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
  };

  const saveCart = async (cartItems: CartItem[]) => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // Ignore
    }
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    if (!product.is_available || product.stock_quantity <= 0) {
      return;
    }

    setItems((prev) => {
      const existingIndex = prev.findIndex((it) => it.product.id === product.id);
      if (existingIndex > -1) {
        const newItems = [...prev];
        const newQty = Math.min(
          newItems[existingIndex].quantity + quantity,
          product.stock_quantity
        );
        newItems[existingIndex] = { ...newItems[existingIndex], quantity: newQty };
        return newItems;
      } else {
        return [...prev, { product, quantity: Math.min(quantity, product.stock_quantity) }];
      }
    });
  };

  const removeFromCart = (productId: number) => {
    setItems((prev) => prev.filter((it) => it.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((it) => {
        if (it.product.id === productId) {
          const clampedQty = Math.min(quantity, it.product.stock_quantity);
          return { ...it, quantity: clampedQty };
        }
        return it;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    AsyncStorage.removeItem(CART_STORAGE_KEY).catch(() => {});
  };

  const subtotal = items.reduce((acc, item) => {
    const price = item.product.discount_price ? Number(item.product.discount_price) : Number(item.product.price);
    return acc + price * item.quantity;
  }, 0);

  const deliveryCharge =
    freeDeliveryThreshold && subtotal >= freeDeliveryThreshold
      ? 0
      : configuredDeliveryFee;

  const totalAmount = subtotal > 0 ? subtotal + deliveryCharge : 0;
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        deliveryCharge,
        totalAmount,
        itemCount,
        setDeliveryCharge: (charge: number) => setConfiguredDeliveryFee(charge),
        refreshDeliverySettings: fetchDeliverySettings,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
};
