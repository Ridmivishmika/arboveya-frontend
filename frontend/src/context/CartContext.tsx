'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Product, ProductVariant, ShippingOption } from '@/types';
import { useAuth } from '@/context/AuthContext';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: ProductVariant;
  selectedShippingOption?: ShippingOption;
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
  selectedShippingMethod: ShippingOption;
  setSelectedShippingMethod: (method: ShippingOption) => void;
  availableShippingMethods: ShippingOption[];
  addToCart: (product: Product, quantity?: number, variant?: ProductVariant, shippingOption?: ShippingOption) => void;
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

  const isPrivilegedRole = user?.role === 'Seller' || user?.role === 'Admin';

  // Determine user-specific storage key; guest key if not authenticated
  const storageKey = isPrivilegedRole
    ? null
    : user?.id 
    ? `arboveya_cart_${user.id}` 
    : user?.email 
    ? `arboveya_cart_${user.email}` 
    : 'arboveya_cart_guest';

  // Whenever user changes, load their profile-specific cart or guest cart
  useEffect(() => {
    try {
      if (!storageKey || isPrivilegedRole) {
        // Privileged roles (Seller, Admin) do not have active purchasing carts
        setCart([]);
        setCoupon(null);
        loadedKeyRef.current = null;
        setIsLoaded(true);
        return;
      }

      // Check if user just signed in and had items in guest cart: migrate guest cart into user profile
      if (storageKey !== 'arboveya_cart_guest' && typeof window !== 'undefined') {
        const guestSaved = localStorage.getItem('arboveya_cart_guest');
        let guestItems: CartItem[] = [];
        if (guestSaved) {
          try {
            const parsed = JSON.parse(guestSaved);
            if (Array.isArray(parsed)) guestItems = parsed;
          } catch {}
        }

        const userSaved = localStorage.getItem(storageKey);
        let userItems: CartItem[] = [];
        if (userSaved) {
          try {
            const parsed = JSON.parse(userSaved);
            if (Array.isArray(parsed)) userItems = parsed;
          } catch {}
        }

        if (guestItems.length > 0) {
          const merged = [...userItems];
          guestItems.forEach(gItem => {
            const gVKey = gItem.selectedVariant?.weight ?? '__default__';
            const existIdx = merged.findIndex(
              m => m.product.id === gItem.product.id && (m.selectedVariant?.weight ?? '__default__') === gVKey
            );
            if (existIdx >= 0) {
              merged[existIdx].quantity += gItem.quantity;
            } else {
              merged.push(gItem);
            }
          });

          localStorage.setItem(storageKey, JSON.stringify(merged));
          localStorage.removeItem('arboveya_cart_guest');
          setCart(merged);
          loadedKeyRef.current = storageKey;
          setIsLoaded(true);
          return;
        }
      }

      // Regular load from storageKey
      if (typeof window !== 'undefined') {
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
  }, [storageKey, isPrivilegedRole]);

  // Save cart to the active user profile or guest localStorage key
  useEffect(() => {
    if (isLoaded && storageKey && loadedKeyRef.current === storageKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(cart));
      } catch (e) {
        console.error('Failed to save cart to localStorage', e);
      }
    }
  }, [cart, isLoaded, storageKey]);

  const addToCart = (product: Product, quantity = 1, variant?: ProductVariant, shippingOption?: ShippingOption) => {
    if (user?.role === 'Seller' || user?.role === 'Admin') {
      if (typeof window !== 'undefined') {
        const roleLabel = user.role === 'Admin' ? 'Administrator' : 'Seller';
        alert(`Purchasing is disabled for ${roleLabel} accounts. You can view all botanical products, but purchases are reserved for customer accounts.`);
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
        if (shippingOption) {
          updated[existingIdx].selectedShippingOption = shippingOption;
        }
        return updated;
      }
      return [...prev, { product, quantity, selectedVariant: variant, selectedShippingOption: shippingOption }];
    });

    if (shippingOption) {
      setSelectedShippingMethod(shippingOption);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('arboveya:cart-highlight'));
    }
  };

  const updateQuantity = (productId: string, quantity: number, variantWeight?: string) => {
    if (user?.role === 'Seller' || user?.role === 'Admin') {
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
    if (user?.role === 'Seller' || user?.role === 'Admin') {
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
    if (user?.role === 'Seller' || user?.role === 'Admin') return false;
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

const DEFAULT_SHIPPING_METHODS: ShippingOption[] = [
  { name: 'Standard Shipping', estimatedDeliveryTime: '3-5 business days', cost: 4.99 },
  { name: 'Express Shipping', estimatedDeliveryTime: '1-2 business days', cost: 14.99 },
  { name: 'Free Shipping', estimatedDeliveryTime: '5-7 business days', cost: 0 }
];

  // If user is a Seller or Admin, cart is strictly empty and counts are 0; guests and customers have active carts
  const activeCart = React.useMemo(() => {
    if (user?.role === 'Seller' || user?.role === 'Admin') {
      return [];
    }
    return cart;
  }, [user, cart]);

  const cartCount = activeCart.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = activeCart.reduce(
    (sum, item) => sum + (item.selectedVariant?.price ?? item.product.price) * item.quantity,
    0
  );

  const discountAmount = coupon
    ? (subtotal * coupon.discountPercent) / 100
    : 0;

  const discountedSubtotal = subtotal - discountAmount;

  // Dynamically compute available shipping methods from items in the cart
  const availableShippingMethods = React.useMemo<ShippingOption[]>(() => {
    if (activeCart.length === 0) {
      return DEFAULT_SHIPPING_METHODS;
    }

    const map = new Map<string, ShippingOption>();
    activeCart.forEach(item => {
      let opts: ShippingOption[] = [];
      if (item.product.shippingOptions) {
        try {
          const parsed = typeof item.product.shippingOptions === 'string'
            ? JSON.parse(item.product.shippingOptions)
            : item.product.shippingOptions;
          if (Array.isArray(parsed) && parsed.length > 0) {
            opts = parsed.map((o: any) => ({
              name: o.name || 'Standard Shipping',
              estimatedDeliveryTime: o.estimatedDeliveryTime || '3-5 business days',
              cost: o.name === 'Free Shipping' ? 0 : Number(o.cost) || 0
            }));
          }
        } catch {}
      }
      if (opts.length === 0) {
        const name = item.product.shippingMethod || (item.product.isFreeShipping ? 'Free Shipping' : 'Standard Shipping');
        const cost = item.product.isFreeShipping ? 0 : (Number(item.product.shippingCost) || 0);
        opts.push({
          name,
          estimatedDeliveryTime: item.product.estimatedDeliveryTime || (cost === 0 ? '5-7 business days' : '3-5 business days'),
          cost
        });
      }

      opts.forEach(o => {
        if (!map.has(o.name)) {
          map.set(o.name, o);
        } else {
          const existing = map.get(o.name)!;
          if (o.cost > existing.cost) {
            map.set(o.name, o);
          }
        }
      });
    });

    return Array.from(map.values());
  }, [activeCart]);

  const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingOption>(DEFAULT_SHIPPING_METHODS[0]);

  useEffect(() => {
    if (availableShippingMethods.length === 0) return;

    setSelectedShippingMethod(prev => {
      const match = availableShippingMethods.find(m => m.name === prev.name);
      if (match) {
        if (match.cost === prev.cost && match.estimatedDeliveryTime === prev.estimatedDeliveryTime) {
          return prev;
        }
        return match;
      }
      return availableShippingMethods[0];
    });
  }, [availableShippingMethods]);

  const shipping = activeCart.length === 0 ? 0 : (selectedShippingMethod?.cost ?? 0);

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
        selectedShippingMethod,
        setSelectedShippingMethod,
        availableShippingMethods,
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
