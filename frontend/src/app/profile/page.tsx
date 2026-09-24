'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Package, 
  ShoppingBag, 
  MapPin, 
  Phone, 
  Globe, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  User, 
  Sparkles,
  ArrowRight,
  LogOut,
  PenTool,
  Truck,
  UserCheck,
  LogIn
} from 'lucide-react';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  payHereOrderId: string;
  customerName: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  shippingMethod?: string;
  shippingCost?: number;
  shippedAt?: string;
  items?: OrderItem[];
}

import { API_BASE_URL } from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const handleSignOut = () => {
    logout();
    window.location.replace('/');
  };

  useEffect(() => {
    if (!user) {
      setLoadingOrders(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const emailQuery = user?.email ? `?email=${encodeURIComponent(user.email)}` : '';
        const res = await fetch(`${API_BASE_URL}/orders/my-orders${emailQuery}`, {
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(Array.isArray(data) ? data : []);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.warn('Orders fetch error', err);
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center py-20">
        <div className="text-center text-xs font-medium text-stone-500">
          Loading Account Profile...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
        <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200 p-8 sm:p-10 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center mx-auto shadow-xs">
            <UserCheck className="w-8 h-8" />
          </div>

          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              Account Profile
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
              Please sign in to view your profile details, past orders, and account settings.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/login?redirect=/profile"
              className="w-full py-3 px-5 rounded-xl bg-[#24492d] hover:bg-[#1a3821] text-white text-xs font-bold tracking-wider uppercase shadow-sm transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Profile</span>
            </Link>

            <Link
              href="/register?redirect=/profile"
              className="w-full py-3 px-5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold tracking-wider uppercase transition flex items-center justify-center gap-2"
            >
              <span>Register Account</span>
            </Link>

            <div>
              <Link href="/" className="text-xs text-stone-500 hover:text-stone-900 underline">
                Return to Store Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFA] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Banner */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#EBF1ED] border-2 border-[#2E4D38] flex items-center justify-center text-[#2E4D38] text-2xl font-bold font-serif shadow-xs">
              {user?.firstName?.charAt(0) || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-[#2E4D38] bg-[#EBF1ED] px-2.5 py-0.5 rounded-full">
                  Customer Account
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
                {user?.fullName || `${user?.firstName || 'Valued'} ${user?.lastName || 'Customer'}`}
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/blog"
              className="px-4 py-2.5 rounded-xl border border-[#2E4D38] text-[#2E4D38] bg-emerald-50/50 text-xs font-bold uppercase tracking-wider hover:bg-emerald-100/60 transition shadow-xs flex items-center gap-2"
            >
              <PenTool className="w-4 h-4" />
              <span>Write Blog</span>
            </Link>
            <Link
              href="/shop"
              className="px-4 py-2.5 rounded-xl bg-[#2E4D38] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#253f2e] transition shadow-sm flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Continue Shopping</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="px-4 py-2.5 rounded-xl border border-stone-300 hover:border-rose-300 hover:bg-rose-50 text-stone-700 hover:text-rose-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Orders History */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
                <div>
                  <h2 className="font-serif text-lg font-bold text-stone-900">Recent Herbal Orders</h2>
                  <p className="text-xs text-stone-500">Track and view past botanical wellness deliveries.</p>
                </div>
                <span className="text-xs font-semibold text-[#2E4D38] bg-[#F4F6F4] px-3 py-1 rounded-lg">
                  {orders.length} Order(s)
                </span>
              </div>

              {loadingOrders ? (
                <div className="py-12 text-center text-stone-400 text-xs">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center text-stone-400">
                  <Package className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                  <p className="text-sm font-medium text-stone-600">No orders placed yet</p>
                  <Link href="/shop" className="text-xs text-[#2E4D38] font-bold hover:underline mt-1 inline-block">
                    Explore Herbal Catalog &rarr;
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 rounded-xl border border-stone-200/80 hover:border-[#2E4D38]/40 transition bg-[#FBFBFA]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-stone-900">
                            {order.payHereOrderId || order.id}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                            {order.orderStatus || 'Delivered'}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                            {order.paymentStatus || 'Paid'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          <span>
                            {new Date(order.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </p>

                        <div className="mt-1.5 flex items-center gap-1 text-xs text-stone-600">
                          <Truck className="w-3.5 h-3.5 text-[#2E4D38]" />
                          <span className="font-semibold text-[#2E4D38]">{order.shippingMethod || 'Standard Shipping'}</span>
                          <span className="text-[11px] text-stone-500">
                            ({order.shippingCost === 0 || !order.shippingCost ? 'Free Shipping' : `$${order.shippingCost.toFixed(2)}`})
                          </span>
                        </div>

                        {order.trackingNumber && (
                          <div className="mt-2 flex items-center gap-2 text-[11px] text-[#1c3f24] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <Truck className="w-3.5 h-3.5 text-emerald-700" />
                            <span>
                              <strong>{order.shippingCarrier || 'Courier'}:</strong> {order.trackingNumber}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-right">
                          <div className="text-sm font-bold text-[#2E4D38]">
                            ${order.totalAmount?.toFixed(2) || '67.97'}
                          </div>
                          <div className="text-[11px] text-stone-400">Total Charged</div>
                        </div>

                        <Link
                          href="/shop"
                          className="p-2 text-stone-400 hover:text-[#2E4D38] rounded-lg hover:bg-stone-100 transition"
                          title="Reorder or view product"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Loyalty & Wellness Perks */}
            <div className="bg-gradient-to-br from-[#2E4D38] to-[#1e3626] rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Arboveya Member Club</span>
                </div>
                <h3 className="text-lg font-serif font-bold">10% Off Your Next Botanical Order</h3>
                <p className="text-xs text-stone-300 mt-0.5">Use promo code <strong className="text-white font-mono bg-white/20 px-1.5 py-0.5 rounded">HERBAL10</strong> in your cart.</p>
              </div>
              <Link
                href="/cart"
                className="px-4 py-2 rounded-xl bg-white text-[#2E4D38] text-xs font-bold uppercase tracking-wider hover:bg-stone-100 transition shadow-xs flex-shrink-0"
              >
                Go to Cart
              </Link>
            </div>
          </div>

          {/* Right Column: Profile & Addresses */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
              <h2 className="font-serif text-lg font-bold text-stone-900 pb-2 border-b border-stone-100">
                Shipping & Contact Info
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5 text-stone-600">
                  <MapPin className="w-4 h-4 text-[#2E4D38] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-stone-900 font-semibold">Delivery Address:</strong>
                    <span>{user?.address || '78 Gardenia Boulevard, Suite 300'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-stone-600">
                  <Phone className="w-4 h-4 text-[#2E4D38] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-stone-900 font-semibold">Phone Contact:</strong>
                    <span>{user?.phoneNumber || '+1 (800) 555-1234'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-stone-600">
                  <Globe className="w-4 h-4 text-[#2E4D38] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-stone-900 font-semibold">Nationality:</strong>
                    <span>{user?.nationality || 'United States'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <Link
                  href="/contact"
                  className="block text-center py-2 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold hover:bg-stone-50 transition"
                >
                  Need Support? Contact Concierge
                </Link>
              </div>
            </div>

            {/* Switch to Seller Callout */}
            <div className="p-5 rounded-2xl bg-[#F4F6F4] border border-[#2E4D38]/20 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2E4D38]">Are you a producer?</span>
              <h4 className="text-sm font-bold text-stone-900">Sell Your Herbs on Arboveya</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Registered herbalists and growers can publish organic teas, oils, and wellness remedies.
              </p>
              <Link
                href="/register?role=Seller&redirect=/seller"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2E4D38] hover:underline pt-1"
              >
                <span>Register as an Herbal Merchant</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
