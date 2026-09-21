'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  FolderTree, 
  Users, 
  BookOpen, 
  ExternalLink, 
  LogOut, 
  ShieldCheck, 
  Store,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AdminHeaderProps {
  activeTab: 'products' | 'categories' | 'wellness-needs' | 'sellers' | 'blogs' | 'messages';
  pendingProductsCount?: number;
  productCount?: number;
  categoryCount?: number;
  wellnessNeedsCount?: number;
  unreadMessagesCount?: number;
}

export default function AdminHeader({
  activeTab,
  pendingProductsCount = 0,
  productCount,
  categoryCount,
  wellnessNeedsCount,
  unreadMessagesCount = 0
}: AdminHeaderProps) {
  const router = useRouter();
  const { user, logout, loading } = useAuth();

  React.useEffect(() => {
    if (!loading && (!user || user.role !== 'Admin')) {
      window.location.replace('/');
    }
  }, [user, loading]);

  const handleSignOut = () => {
    logout();
    window.location.replace('/');
  };

  const adminDisplayName = user?.fullName || `${user?.firstName || 'System'} ${user?.lastName || 'Admin'}`.trim();
  const adminInitial = user?.firstName ? user.firstName.charAt(0).toUpperCase() : (user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A');

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#e5ebe5] transition-all shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Brand Emblem & Admin Dashboard Title (matching Seller Dashboard style) */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#2a4d31]/20 shadow-xs">
            <Image
              src="/images/logo-badge.png"
              alt="Arboveya Logo"
              fill
              sizes="40px"
              className="object-cover"
              priority
            />
          </div>
          <div>
            <span className="font-serif text-lg sm:text-xl font-bold tracking-[0.18em] text-[#1c3f24] block leading-none">
              ARBOVEYA
            </span>
            <span className="text-[10px] font-bold tracking-widest text-[#2d5c37] uppercase mt-1 block">
              Admin Dashboard
            </span>
          </div>
        </Link>

        {/* All Navigation Tabs & Actions in Single Main Bar */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-end">
          
          {/* Live Shop Button */}
          <Link
            href="/shop"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#bcd2bf] bg-[#edf5ee] hover:bg-[#dcebdd] text-[#1c3f24] text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="View public customer store in a new tab"
          >
            <Store className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Live Shop</span>
            <ExternalLink className="w-3 h-3 text-[#627d68]" />
          </Link>

          {/* Products Tab Button */}
          <Link
            href="/admin/products"
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-2xs ${
              activeTab === 'products'
                ? 'bg-[#2E4D38] text-white shadow-xs'
                : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
            }`}
            title="Manage Products"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Products</span>
            {productCount !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === 'products' ? 'bg-white/20 text-white' : 'bg-[#edf5ee] text-[#1c3f24]'
              }`}>
                {productCount}
              </span>
            )}
            {pendingProductsCount > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white animate-pulse" title={`${pendingProductsCount} seller products pending approval`}>
                {pendingProductsCount}
              </span>
            )}
          </Link>

          {/* Categories Tab Button */}
          <Link
            href="/admin/categories"
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-2xs ${
              activeTab === 'categories'
                ? 'bg-[#2E4D38] text-white shadow-xs'
                : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
            }`}
            title="Manage Categories"
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Categories</span>
            {categoryCount !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === 'categories' ? 'bg-white/20 text-white' : 'bg-[#edf5ee] text-[#1c3f24]'
              }`}>
                {categoryCount}
              </span>
            )}
          </Link>

          {/* Wellness Needs Tab Button */}
          <Link
            href="/admin/wellness-needs"
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-2xs ${
              activeTab === 'wellness-needs'
                ? 'bg-[#2E4D38] text-white shadow-xs'
                : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
            }`}
            title="Manage Wellness Needs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Wellness Needs</span>
            {wellnessNeedsCount !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === 'wellness-needs' ? 'bg-white/20 text-white' : 'bg-[#edf5ee] text-[#1c3f24]'
              }`}>
                {wellnessNeedsCount}
              </span>
            )}
          </Link>

          {/* Sellers Tab Button */}
          <Link
            href="/admin/sellers"
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-2xs ${
              activeTab === 'sellers'
                ? 'bg-[#2E4D38] text-white shadow-xs'
                : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
            }`}
            title="Manage Sellers"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Sellers</span>
          </Link>

          {/* Blogs Tab Button */}
          <Link
            href="/admin/blogs"
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-2xs ${
              activeTab === 'blogs'
                ? 'bg-[#2E4D38] text-white shadow-xs'
                : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
            }`}
            title="Blog Moderation"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Blogs</span>
          </Link>

          {/* Inquiries / Messages Tab Button */}
          <Link
            href="/admin/messages"
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-2xs ${
              activeTab === 'messages'
                ? 'bg-[#2E4D38] text-white shadow-xs'
                : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
            }`}
            title="Customer & Seller Inquiries"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Inquiries</span>
            {unreadMessagesCount !== undefined && unreadMessagesCount > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white animate-pulse">
                {unreadMessagesCount}
              </span>
            )}
          </Link>

          {/* Admin Identity Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs shadow-2xs">
            <div className="w-5 h-5 rounded-full bg-[#24492d] text-white flex items-center justify-center font-bold text-[10px]">
              {adminInitial}
            </div>
            <span className="text-emerald-800 font-semibold truncate max-w-[120px] hidden lg:inline">
              {adminDisplayName}
            </span>
          </div>

          {/* Dedicated Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50/70 hover:bg-red-100 hover:border-red-300 text-red-700 font-bold text-xs transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Sign out of administration session"
            aria-label="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5 text-red-600" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
