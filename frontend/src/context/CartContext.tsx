'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Product, ProductVariant } from '@/types';
import { useAuth } from '@/context/AuthContext';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: ProductVariant;
}

export interface Coupon {
  code: string;
  discountPercent: number;
}

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  subtotal: number;
  discountAmount: number;
  shipping: number;
  total: number;
  coupon: Coupon | null;
  couponError: string | null;
  couponSuccess: string | null;
  addToCart: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  updateQuantity: (productId: string, quantity: number, variantWeight?: string) => void;
  removeFromCart: (productId: string, variantWeight?: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
}

const VALID_COUPONS: Record<string, number> = {
  'HERBAL10': 10,
  'ARBOVEYA10': 10,
  'NATURE15': 15,
  'WELLNESS20': 20
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const loadedKeyRef = React.useRef<string | null>(null);

  // Determine user-specific storage key; strictly null if not authenticated
  const storageKey = user?.id 
    ? `arboveya_cart_${user.id}` 
    : user?.email 
    ? `arboveya_cart_${user.email}` 
    : null;

  // Whenever user changes, load their profile-specific cart or clear completely
  useEffect(() => {
    try {
      // Clear legacy guest cart
      if (typeof window !== 'undefined') {
        localStorage.removeItem('arboveya_cart_guest');
      }

      if (!storageKey) {
        // Without sign in, cart is strictly empty
        setCart([]);
        setCoupon(null);
        loadedKeyRef.current = null;
      } else {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setCart(parsed);
          } else {
            setCart([]);
          }
        } else {
          setCart([]);
        }
        loadedKeyRef.current = storageKey;
      }
    } catch (e) {
      setCart([]);
      loadedKeyRef.current = storageKey;
    }
    setIsLoaded(true);
  }, [storageKey]);

  // Save cart to the active user profile localStorage key
  useEffect(() => {
    if (isLoaded && storageKey && loadedKeyRef.current === storageKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(cart));
      } catch (e) {
        console.error('Failed to save cart to localStorage', e);
      }
    }
  }, [cart, isLoaded, storageKey]);

  const addToCart = (product: Product, quantity = 1, variant?: ProductVariant) => {
    if (!user) {
      if (typeof window !== 'undefined') {
        alert('Please sign in first to add botanical products to your cart.');
        const returnUrl = encodeURIComponent(window.location.pathname);
        router.push(`/login?redirect=${returnUrl}`);
      }
      return;
    }

    if (user.role === 'Seller') {
      if (typeof window !== 'undefined') {
        alert('Purchasing is disabled for Seller accounts. As an herbal merchant, you can view all botanical products, but purchases are reserved for customer accounts.');
      }
      return;
    }

    setCart(prev => {
      // Match by product id AND variant weight so different variants are separate cart rows
      const variantKey = variant?.weight ?? '__default__';
      const existingIdx = prev.findIndex(
        item => item.product.id === product.id && (item.selectedVariant?.weight ?? '__default__') === variantKey
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      }
      return [...prev, { product, quantity, selectedVariant: variant }];
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('arboveya:cart-highlight'));
    }
  };

  const updateQuantity = (productId: string, quantity: number, variantWeight?: string) => {
    if (!user) {
      setCart([]);
      return;
    }
    const vKey = variantWeight ?? '__default__';
    if (quantity <= 0) {
      removeFromCart(productId, variantWeight);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId && (item.selectedVariant?.weight ?? '__default__') === vKey
          ? { ...item, quantity }
          : item
      )
    );
  };

  const removeFromCart = (productId: string, variantWeight?: string) => {
    if (!user) {
      setCart([]);
      return;
    }
    const vKey = variantWeight ?? '__default__';
    setCart(prev => prev.filter(item =>
      !(item.product.id === productId && (item.selectedVariant?.weight ?? '__default__') === vKey)
    ));
  };

  const clearCart = () => {
    setCart([]);
    setCoupon(null);
    setCouponSuccess(null);
    setCouponError(null);
    if (typeof window !== 'undefined') {
      if (storageKey) {
        localStorage.removeItem(storageKey);
      }
      localStorage.removeItem('arboveya_cart_guest');
    }
  };

  const applyCoupon = (code: string): boolean => {
    if (!user) return false;
    const cleanCode = code.trim().toUpperCase();
    if (VALID_COUPONS[cleanCode]) {
      setCoupon({
        code: cleanCode,
        discountPercent: VALID_COUPONS[cleanCode]
      });
      setCouponSuccess(`Coupon ${cleanCode} applied! (${VALID_COUPONS[cleanCode]}% OFF)`);
      setCouponError(null);
      return true;
    } else {
      setCouponError('Invalid coupon code. Try HERBAL10 or WELLNESS20');
      setCouponSuccess(null);
      return false;
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponSuccess(null);
    setCouponError(null);
  };

  // If no user is signed in or user is a Seller, cart is strictly empty and counts are 0
  const activeCart = user && user.role !== 'Seller' ? cart : [];
  const cartCount = activeCart.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = activeCart.reduce(
    (sum, item) => sum + (item.selectedVariant?.price ?? item.product.price) * item.quantity,
    0
  );

  const discountAmount = coupon
    ? (subtotal * coupon.discountPercent) / 100
    : 0;

  const discountedSubtotal = subtotal - discountAmount;

  // Free shipping over $50, otherwise $5.00 (free if cart is empty)
  const shipping = activeCart.length === 0 ? 0 : discountedSubtotal >= 50 ? 0 : 5.00;

  const total = discountedSubtotal + shipping;

  return (
    <CartContext.Provider
      value={{
        cart: activeCart,
        cartCount,
        subtotal,
        discountAmount,
        shipping,
        total,
        coupon,
        couponError,
        couponSuccess,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
