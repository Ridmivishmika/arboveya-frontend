'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Truck, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  RefreshCw, 
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Store,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getAllOrders } from '@/lib/api';
import AdminHeader from '@/components/admin/AdminHeader';
import ManageOrders from '@/components/seller/ManageOrders';

export default function AdminOrdersPage() {
  const { user, token, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    setErrorMsg(null);
    try {
      const data = await getAllOrders(token || undefined);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load orders for admin:', err);
      setErrorMsg(err.message || 'Failed to load platform orders.');
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Aggregate KPI Calculations
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const awaitingShipment = orders.filter((o) => {
      const s = (o.orderStatus || '').toLowerCase();
      const p = (o.paymentStatus || '').toLowerCase();
      return (s === 'processing' || s === 'pending') && p !== 'failed';
    }).length;
    const delivered = orders.filter((o) => (o.orderStatus || '').toLowerCase() === 'delivered').length;
    const totalRevenue = orders.reduce((sum, o) => {
      const p = (o.paymentStatus || '').toLowerCase();
      if (p === 'paid' || p === 'completed' || (o.orderStatus || '').toLowerCase() === 'delivered') {
        return sum + (Number(o.totalAmount) || 0);
      }
      return sum;
    }, 0);

    return { totalOrders, awaitingShipment, delivered, totalRevenue };
  }, [orders]);

  return (
    <div className="min-h-screen bg-[#f8faf8] flex flex-col font-sans">
      {/* 1. Admin Header Navigation */}
      <AdminHeader 
        activeTab="orders" 
        orderCount={stats.totalOrders}
        pendingOrdersCount={stats.awaitingShipment}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Page Title & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#526a57] mb-1 font-medium">
              <Link href="/admin" className="hover:text-[#1c3f24] transition-colors">Admin Dashboard</Link>
              <span>/</span>
              <span className="text-[#1c3f24] font-bold">Customer Orders &amp; Fulfillment</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1c3f24] tracking-tight">
              Order Management Console
            </h1>
            <p className="text-xs sm:text-sm text-[#526a57] mt-1">
              Admin &amp; seller order fulfillment, tracking numbers, packing slips, customer logistics, and refunds.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchOrders}
              disabled={loadingOrders}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#ccdacc] bg-white hover:bg-[#edf5ee] text-[#1c3f24] text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-50"
              title="Refresh live orders"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin text-[#24492d]' : ''}`} />
              <span>Refresh Orders</span>
            </button>

            <Link
              href="/seller?tab=orders"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#24492d] hover:bg-[#1b3b24] text-white text-xs font-bold transition shadow-sm cursor-pointer"
              title="Open Merchant Seller View"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Seller Studio Orders</span>
              <ExternalLink className="w-3 h-3 text-emerald-200" />
            </Link>
          </div>
        </div>

        {/* Quick KPI Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#dce7de] shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-wider text-[#63806a] uppercase">Total Orders</p>
              <h3 className="text-xl sm:text-2xl font-bold text-[#1c3f24] mt-0.5">{stats.totalOrders}</h3>
              <p className="text-[10px] text-[#708c76] mt-0.5">Platform orders recorded</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#edf5ee] text-[#24492d] flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#dce7de] shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-wider text-[#63806a] uppercase">Awaiting Shipment</p>
              <h3 className="text-xl sm:text-2xl font-bold text-amber-700 mt-0.5">{stats.awaitingShipment}</h3>
              <p className="text-[10px] text-[#708c76] mt-0.5">Needs tracking &amp; dispatch</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#dce7de] shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-wider text-[#63806a] uppercase">Delivered Orders</p>
              <h3 className="text-xl sm:text-2xl font-bold text-emerald-700 mt-0.5">{stats.delivered}</h3>
              <p className="text-[10px] text-[#708c76] mt-0.5">Fulfilled successfully</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#dce7de] shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-wider text-[#63806a] uppercase">Gross Order Volume</p>
              <h3 className="text-xl sm:text-2xl font-bold text-[#1c3f24] mt-0.5">
                ${stats.totalRevenue.toFixed(2)}
              </h3>
              <p className="text-[10px] text-[#708c76] mt-0.5">Completed paid orders</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#edf5ee] text-[#24492d] flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button 
              onClick={fetchOrders}
              className="px-3 py-1 bg-white border border-red-300 rounded-lg text-xs font-bold text-red-800 hover:bg-red-50 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* 2. Order Management Interactive Table & Drawer */}
        <div className="bg-white rounded-2xl border border-[#dce7de] shadow-xs overflow-hidden">
          {loadingOrders && orders.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#24492d]" />
              <p className="text-xs font-semibold text-[#1c3f24]">Loading customer orders...</p>
              <p className="text-[11px] text-stone-500">Retrieving real-time transactions and fulfillment statuses.</p>
            </div>
          ) : (
            <ManageOrders
              orders={orders}
              onRefresh={fetchOrders}
              user={user}
              token={token || undefined}
            />
          )}
        </div>
      </main>
    </div>
  );
}

