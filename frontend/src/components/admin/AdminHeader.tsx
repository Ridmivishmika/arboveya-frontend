'use client';

import React, { useState } from 'react';
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
  MessageSquare,
  Menu,
  X
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const navLinks = [
    {
      id: 'products',
      label: 'Products',
      href: '/admin/products',
      icon: Package,
      count: productCount,
      alertCount: pendingProductsCount
    },
    {
      id: 'categories',
      label: 'Categories',
      href: '/admin/categories',
      icon: FolderTree,
      count: categoryCount
    },
    {
      id: 'wellness-needs',
      label: 'Wellness Needs',
      href: '/admin/wellness-needs',
      icon: Sparkles,
      count: wellnessNeedsCount
    },
    {
      id: 'sellers',
      label: 'Sellers',
      href: '/admin/sellers',
      icon: Users
    },
    {
      id: 'blogs',
      label: 'Blogs',
      href: '/admin/blogs',
      icon: BookOpen
    },
    {
      id: 'messages',
      label: 'Inquiries',
      href: '/admin/messages',
      icon: MessageSquare,
      alertCount: unreadMessagesCount
    }
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#e5ebe5] transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3">
        
        {/* Brand Emblem & Admin Dashboard Title */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#2a4d31]/20 shadow-xs group-hover:scale-105 transition-transform">
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

        {/* Desktop Navigation Bar (Large screens) */}
        <div className="hidden lg:flex items-center gap-2 xl:gap-2.5 justify-end">
          
          {/* Live Shop Button */}
          <Link
            href="/shop"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#bcd2bf] bg-[#edf5ee] hover:bg-[#dcebdd] text-[#1c3f24] text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="View public customer store in a new tab"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Live Shop</span>
            <ExternalLink className="w-3 h-3 text-[#627d68]" />
          </Link>

          {/* Navigation Tab Links */}
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 xl:px-3.5 xl:py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-2xs ${
                  isActive
                    ? 'bg-[#2E4D38] text-white shadow-xs'
                    : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
                }`}
                title={`Manage ${item.label}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#edf5ee] text-[#1c3f24]'
                  }`}>
                    {item.count}
                  </span>
                )}
                {item.alertCount !== undefined && item.alertCount > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white animate-pulse">
                    {item.alertCount}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Admin Identity Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs shadow-2xs">
            <div className="w-5 h-5 rounded-full bg-[#24492d] text-white flex items-center justify-center font-bold text-[10px]">
              {adminInitial}
            </div>
            <span className="text-emerald-800 font-semibold truncate max-w-[110px] hidden xl:inline">
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
            <span className="hidden xl:inline">Sign Out</span>
          </button>
        </div>

        {/* Mobile & Tablet Controls (Below lg breakpoint) */}
        <div className="flex items-center gap-2 lg:hidden">
          {/* Quick Live Shop Link */}
          <Link
            href="/shop"
            target="_blank"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#bcd2bf] bg-[#edf5ee] text-[#1c3f24] text-xs font-bold"
            title="View Live Shop"
          >
            <Store className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Shop</span>
          </Link>

          {/* Pending Alerts Pill if any */}
          {(pendingProductsCount > 0 || unreadMessagesCount > 0) && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white animate-pulse">
              {(pendingProductsCount || 0) + (unreadMessagesCount || 0)} alerts
            </span>
          )}

          {/* Hamburger Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-[#1c3f24] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2E4D38]"
            aria-label="Toggle admin navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-stone-700" /> : <Menu className="w-5 h-5 text-stone-700" />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Dropdown Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/98 backdrop-blur-xl border-b border-stone-200 shadow-xl transition-all duration-200 animate-in slide-in-from-top-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">
            
            {/* Admin Profile Info Card */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#f4f8f4] border border-[#d5e5d7]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#24492d] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  {adminInitial}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-stone-900">{adminDisplayName}</span>
                    <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Admin
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 block truncate">{user?.email}</span>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 font-bold text-xs hover:bg-red-100 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-red-600" />
                <span>Exit</span>
              </button>
            </div>

            {/* Navigation Links Grid */}
            <nav className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#2E4D38] text-white shadow-xs'
                        : 'border border-stone-200/80 bg-stone-50/70 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#2E4D38]'}`} />
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.count !== undefined && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-white text-stone-600 border border-stone-200'
                        }`}>
                          {item.count}
                        </span>
                      )}
                      {item.alertCount !== undefined && item.alertCount > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white animate-pulse">
                          {item.alertCount}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Footer Actions */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-3">
              <Link
                href="/shop"
                target="_blank"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#bcd2bf] bg-[#edf5ee] hover:bg-[#dcebdd] text-[#1c3f24] text-xs font-bold transition"
              >
                <Store className="w-4 h-4" />
                <span>Open Public Storefront</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#627d68]" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
