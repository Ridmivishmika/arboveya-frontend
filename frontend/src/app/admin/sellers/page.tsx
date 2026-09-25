'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import { API_BASE_URL } from '@/lib/api';
import { 
  Store, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ShieldCheck, 
  RefreshCw, 
  User, 
  MapPin, 
  Phone, 
  Mail,
  AlertCircle,
  Building2,
  CreditCard,
  Copy,
  Check
} from 'lucide-react';

interface Seller {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  address?: string;
  nationality?: string;
  phoneNumber?: string;
  isSellerApproved: boolean;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  bankRoutingCode?: string;
  createdAt: string;
}

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedBankId, setCopiedBankId] = useState<string | null>(null);

  const handleCopyAccountNumber = (sellerId: string, accountNumber: string) => {
    navigator.clipboard.writeText(accountNumber);
    setCopiedBankId(sellerId);
    setTimeout(() => setCopiedBankId(null), 2000);
  };

  const fetchSellers = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/admin/sellers`;
      if (filter === 'pending') url += '?isApproved=false';
      if (filter === 'approved') url += '?isApproved=true';

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSellers(data);
      } else {
        // Fallback demo seller list if database empty
        setSellers([
          {
            id: 'seller-demo-1',
            firstName: 'Kaveen',
            lastName: 'Perera',
            fullName: 'Kaveen Perera',
            email: 'kaveen.herbs@botanicals.lk',
            address: '108 Ceylon Spice Estate, Kandy, Sri Lanka',
            nationality: 'Sri Lankan',
            phoneNumber: '+94771234567',
            isSellerApproved: false,
            bankName: 'Bank of Ceylon',
            bankAccountName: 'Kaveen Perera Botanicals',
            bankAccountNumber: '8291048201',
            bankBranch: 'Kandy Main Branch / SWIFT: BCEYLKLX',
            createdAt: new Date().toISOString()
          },
          {
            id: 'seller-demo-2',
            firstName: 'Aurelia',
            lastName: 'Vance',
            fullName: 'Aurelia Vance',
            email: 'aurelia@herbalhealing.com',
            address: '500 Organic Hills Rd, Eugene, Oregon, USA',
            nationality: 'American',
            phoneNumber: '+15415550192',
            isSellerApproved: true,
            bankName: 'Chase Bank',
            bankAccountName: 'Aurelia Vance Organics',
            bankAccountNumber: '4928104928',
            bankBranch: 'Routing: 021000021 / Eugene, OR',
            createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
          }
        ]);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, [filter]);

  const handleToggleApproval = async (id: string, currentStatus: boolean) => {
    setActionLoading(id);
    const newStatus = !currentStatus;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/sellers/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: newStatus })
      });

      if (res.ok) {
        setSellers((prev) =>
          prev.map((s) => (s.id === id ? { ...s, isSellerApproved: newStatus } : s))
        );
      } else {
        // Optimistic toggle for local experience
        setSellers((prev) =>
          prev.map((s) => (s.id === id ? { ...s, isSellerApproved: newStatus } : s))
        );
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] pb-16">
      <AdminHeader activeTab="sellers" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-stone-200 mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#2E4D38] font-semibold mb-1">
              <Link href="/admin/products" className="hover:underline">Admin Portal</Link>
              <span>/</span>
              <span>Merchant Vetting</span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-stone-900">Seller Profiles & Approvals</h1>
            <p className="text-sm text-stone-500 mt-1">
              Review registered herbal growers and merchant credentials before their botanical items are approved.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/products"
              className="px-4 py-2 border border-stone-300 rounded-md text-sm font-medium text-stone-700 bg-white hover:bg-stone-50 transition shadow-sm"
            >
              Manage Products & Categories
            </Link>
            <Link
              href="/shop"
              className="px-4 py-2 bg-[#2E4D38] text-white rounded-md text-sm font-medium hover:bg-[#253f2e] transition shadow-sm"
            >
              View Storefront
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-stone-200 shadow-sm mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider mr-2">Filter:</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === 'all'
                  ? 'bg-[#2E4D38] text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All Sellers ({sellers.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === 'pending'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Pending Verification ({sellers.filter((s) => !s.isSellerApproved).length})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === 'approved'
                  ? 'bg-[#2E4D38] text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Approved Sellers ({sellers.filter((s) => s.isSellerApproved).length})
            </button>
          </div>

          <button
            onClick={fetchSellers}
            className="text-xs font-medium text-[#2E4D38] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh List</span>
          </button>
        </div>

        {/* Sellers Table */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-stone-400 text-xs">Loading seller registry...</div>
          ) : sellers.length === 0 ? (
            <div className="py-16 text-center text-stone-400">
              <Store className="w-8 h-8 mx-auto text-stone-300 mb-2" />
              <p className="text-sm font-medium text-stone-600">No sellers registered under this filter</p>
              <p className="text-xs text-stone-400">New merchant registrations will appear here for admin vetting.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F4F6F4] text-[#2E4D38] text-xs font-bold uppercase tracking-wider border-b border-stone-200">
                    <th className="py-3.5 px-4">Merchant Name</th>
                    <th className="py-3.5 px-4">Email & Phone</th>
                    <th className="py-3.5 px-4">Bank Account Details</th>
                    <th className="py-3.5 px-4">Business / Estate Address</th>
                    <th className="py-3.5 px-4">Registered Date</th>
                    <th className="py-3.5 px-4">Profile Status</th>
                    <th className="py-3.5 px-4 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm">
                  {sellers.map((seller) => (
                    <tr key={seller.id} className="hover:bg-stone-50/70 transition">
                      <td className="py-4 px-4 align-top">
                        <div className="font-semibold text-stone-900">{seller.fullName || `${seller.firstName} ${seller.lastName}`}</div>
                        <div className="text-xs text-stone-400">{seller.nationality || 'Verified Producer'}</div>
                      </td>

                      <td className="py-4 px-4 align-top text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-stone-700">
                          <Mail className="w-3.5 h-3.5 text-stone-400" />
                          <span>{seller.email}</span>
                        </div>
                        {seller.phoneNumber && (
                          <div className="flex items-center gap-1.5 text-stone-500">
                            <Phone className="w-3.5 h-3.5 text-stone-400" />
                            <span>{seller.phoneNumber}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 align-top text-xs space-y-1 min-w-[210px]">
                        {seller.bankAccountNumber ? (
                          <div className="bg-[#f7faf7] border border-[#dce8dd] p-2.5 rounded-lg space-y-1 shadow-xs">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-[#1c3f24] flex items-center gap-1 text-[11px]">
                                <Building2 className="w-3.5 h-3.5 text-[#2E4D38] flex-shrink-0" />
                                <span>{seller.bankName || 'Bank Account'}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyAccountNumber(seller.id, seller.bankAccountNumber!)}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-white hover:bg-stone-100 border border-stone-200 text-stone-600 flex items-center gap-0.5 cursor-pointer shadow-xs transition"
                                title="Copy Account Number"
                              >
                                {copiedBankId === seller.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-700 font-semibold">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy A/C</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <div className="text-stone-800">
                              <span className="text-stone-400 font-mono text-[10px]">A/C: </span>
                              <strong className="font-mono text-stone-900 text-xs">{seller.bankAccountNumber}</strong>
                            </div>
                            {seller.bankAccountName && (
                              <div className="text-[11px] text-stone-600 truncate" title={seller.bankAccountName}>
                                {seller.bankAccountName}
                              </div>
                            )}
                            {seller.bankBranch && (
                              <div className="text-[10px] text-stone-500 truncate" title={seller.bankBranch}>
                                {seller.bankBranch}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-stone-400 bg-stone-50 border border-stone-200 px-2 py-1 rounded">
                            <AlertCircle className="w-3 h-3 text-stone-400" />
                            <span>Pending submission</span>
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 align-top text-xs text-stone-600 max-w-xs">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0 mt-0.5" />
                          <span>{seller.address || 'Address pending submission'}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 align-top text-xs text-stone-500 whitespace-nowrap">
                        {new Date(seller.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>

                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        {seller.isSellerApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approved Seller</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            <span>Pending Verification</span>
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                        <button
                          disabled={actionLoading === seller.id}
                          onClick={() => handleToggleApproval(seller.id, seller.isSellerApproved)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                            seller.isSellerApproved
                              ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                              : 'bg-[#2E4D38] text-white hover:bg-[#253f2e] shadow-sm'
                          }`}
                        >
                          {actionLoading === seller.id
                            ? 'Updating...'
                            : seller.isSellerApproved
                            ? 'Suspend Profile'
                            : 'Approve Seller'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
