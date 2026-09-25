'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/api';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  role: 'Customer' | 'Seller' | 'Admin';
  address?: string;
  nationality?: string;
  phoneNumber?: string;
  isSellerApproved?: boolean;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  bankRoutingCode?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  login: (email: string, role?: 'Customer' | 'Seller' | 'Admin', password?: string) => Promise<UserProfile>;
  register: (data: any) => Promise<UserProfile>;
  logout: (redirectTo?: string) => void;
  updateUser: (data: Partial<UserProfile>) => void;
  refreshUser: () => Promise<UserProfile | null>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async (): Promise<UserProfile | null> => {
    const savedToken = token || (typeof window !== 'undefined' ? localStorage.getItem('arboveya_token') : null);
    if (!savedToken) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: 'Bearer ' + savedToken },
        cache: 'no-store'
      });
      if (res.ok) {
        const u = await res.json();
        const fName = u.firstName || '';
        const lName = u.lastName || '';
        const profile: UserProfile = {
          id: u.id,
          firstName: fName,
          lastName: lName,
          fullName: (fName + ' ' + lName).trim(),
          email: u.email,
          role: u.role,
          address: u.address || '',
          nationality: u.nationality || '',
          phoneNumber: u.phoneNumber || '',
          isSellerApproved: u.isSellerApproved ?? false,
          bankName: u.bankName || '',
          bankAccountName: u.bankAccountName || '',
          bankAccountNumber: u.bankAccountNumber || '',
          bankBranch: u.bankBranch || '',
          bankRoutingCode: u.bankRoutingCode || ''
        };
        setUser(profile);
        localStorage.setItem('arboveya_user', JSON.stringify(profile));
        return profile;
      }
      return null;
    } catch {
      return null;
    }
  };

      // Clean up any legacy locally saved mock data from browser storage
    useEffect(() => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('arboveya_placed_orders');
          localStorage.removeItem('arboveya_buyer_reviews');
          localStorage.removeItem('arboveya_cart_guest');
        } catch (e) {}
      }
    }, []);

  // Initial load from localStorage & fresh profile pull
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('arboveya_user');
      const savedToken = localStorage.getItem('arboveya_token');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      if (savedToken) {
        setToken(savedToken);
        fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: 'Bearer ' + savedToken },
          cache: 'no-store'
        })
        .then(res => res.ok ? res.json() : null)
        .then(u => {
          if (u) {
            const fName = u.firstName || '';
            const lName = u.lastName || '';
            const profile: UserProfile = {
              id: u.id,
              firstName: fName,
              lastName: lName,
              fullName: (fName + ' ' + lName).trim(),
              email: u.email,
              role: u.role,
              address: u.address || '',
              nationality: u.nationality || '',
              phoneNumber: u.phoneNumber || '',
              isSellerApproved: u.isSellerApproved ?? false
            };
            setUser(profile);
            localStorage.setItem('arboveya_user', JSON.stringify(profile));
          }
        })
        .catch(() => {});
      }
    } catch (e) {
      console.error('Error loading session from localStorage', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Automatic real-time sync for pending sellers: polls /api/admin/sellers every 2.5 seconds
  useEffect(() => {
    if (!user || user.role !== 'Seller' || user.isSellerApproved) return;

    const checkSellerApproval = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/sellers`, { cache: 'no-store' });
        if (res.ok) {
          const sellers = await res.json();
          const me = sellers.find((s: any) => 
            (user.id && s.id === user.id) || 
            (s.email && user.email && s.email.toLowerCase() === user.email.toLowerCase())
          );
          if (me && me.isSellerApproved === true) {
            setUser(prev => prev ? { ...prev, isSellerApproved: true } : null);
            const saved = localStorage.getItem('arboveya_user');
            if (saved) {
              const parsed = JSON.parse(saved);
              parsed.isSellerApproved = true;
              localStorage.setItem('arboveya_user', JSON.stringify(parsed));
            }
          }
        }
      } catch (err) {
        // quiet background check
      }
    };

    checkSellerApproval();
    const interval = setInterval(checkSellerApproval, 2500);
    return () => clearInterval(interval);
  }, [user?.id, user?.email, user?.role, user?.isSellerApproved]);

  const login = async (
    email: string, 
    role: 'Customer' | 'Seller' | 'Admin' = 'Customer',
    password = 'Password123!'
  ): Promise<UserProfile> => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(err.message || 'Invalid email or password.');
      }

      const data = await res.json();
      const u = data.user;
      const fName = u.firstName || '';
      const lName = u.lastName || '';
      const profile: UserProfile = {
        id: u.id,
        firstName: fName,
        lastName: lName,
        fullName: (fName + ' ' + lName).trim(),
        email: u.email,
        role: u.role,
        address: u.address || '',
        nationality: u.nationality || '',
        phoneNumber: u.phoneNumber || '',
        isSellerApproved: u.isSellerApproved ?? false,
        bankName: u.bankName || '',
        bankAccountName: u.bankAccountName || '',
        bankAccountNumber: u.bankAccountNumber || '',
        bankBranch: u.bankBranch || '',
        bankRoutingCode: u.bankRoutingCode || ''
      };

      setUser(profile);
      setToken(data.token);
      localStorage.setItem('arboveya_user', JSON.stringify(profile));
      localStorage.setItem('arboveya_token', data.token);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any): Promise<UserProfile> => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Registration failed' }));
        throw new Error(err.message || 'Registration failed.');
      }

      const resData = await res.json();
      const u = resData.user;
      const fName = u.firstName || '';
      const lName = u.lastName || '';
      const profile: UserProfile = {
        id: u.id,
        firstName: fName,
        lastName: lName,
        fullName: (fName + ' ' + lName).trim(),
        email: u.email,
        role: u.role,
        address: u.address || '',
        nationality: u.nationality || '',
        phoneNumber: u.phoneNumber || '',
        isSellerApproved: u.isSellerApproved ?? false,
        bankName: u.bankName || '',
        bankAccountName: u.bankAccountName || '',
        bankAccountNumber: u.bankAccountNumber || '',
        bankBranch: u.bankBranch || '',
        bankRoutingCode: u.bankRoutingCode || ''
      };

      setUser(profile);
      setToken(resData.token);
      localStorage.setItem('arboveya_user', JSON.stringify(profile));
      localStorage.setItem('arboveya_token', resData.token);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const logout = (redirectTo?: string) => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('arboveya_user');
      localStorage.removeItem('arboveya_token');
      if (redirectTo) {
        window.location.replace(redirectTo);
      }
    }
  };

  const updateUser = (data: Partial<UserProfile>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      localStorage.setItem('arboveya_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}