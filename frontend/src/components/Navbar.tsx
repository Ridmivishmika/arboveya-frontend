'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { 
  ShoppingBag, 
  Menu, 
  X, 
  Store, 
  LogOut, 
  LogIn, 
  PenTool, 
  Plus, 
  ChevronDown, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  User,
  ArrowLeft,
  Package,
  BookOpen,
  Building2
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

interface NavbarProps {
  cartCount?: number;
}

export default function Navbar({ cartCount: propCount }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { cartCount: liveCount } = useCart();
  const { user, logout } = useAuth();
  const cartCount = propCount !== undefined ? propCount : liveCount;
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [cartHighlighted, setCartHighlighted] = useState(false);

  useEffect(() => {
    const handleCartHighlight = () => {
      setCartHighlighted(true);
      setTimeout(() => setCartHighlighted(false), 2500);
    };

    window.addEventListener('arboveya:cart-highlight', handleCartHighlight);
    return () => window.removeEventListener('arboveya:cart-highlight', handleCartHighlight);
  }, []);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Seller Dashboard Tab State
  const [sellerTab, setSellerTab] = useState<'products' | 'articles' | 'orders' | 'payouts'>('products');

  useEffect(() => {
    const handleSellerTabChanged = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail === 'products' || customEvent.detail === 'articles' || customEvent.detail === 'orders' || customEvent.detail === 'payouts') {
        setSellerTab(customEvent.detail);
      }
    };
    window.addEventListener('arboveya:seller-tab-changed', handleSellerTabChanged as EventListener);
    return () => window.removeEventListener('arboveya:seller-tab-changed', handleSellerTabChanged as EventListener);
  }, []);

  const handleSellerProductsClick = () => {
    setSellerTab('products');
    if (pathname === '/seller') {
      window.dispatchEvent(new CustomEvent('arboveya:set-seller-tab', { detail: 'products' }));
    } else {
      router.push('/seller?tab=products');
    }
  };

  const handleSellerArticlesClick = () => {
    setSellerTab('articles');
    if (pathname === '/seller') {
      window.dispatchEvent(new CustomEvent('arboveya:set-seller-tab', { detail: 'articles' }));
    } else {
      router.push('/seller?tab=articles');
    }
  };

  const handleSellerOrdersClick = () => {
    setSellerTab('orders');
    if (pathname === '/seller') {
      window.dispatchEvent(new CustomEvent('arboveya:set-seller-tab', { detail: 'orders' }));
    } else {
      router.push('/seller?tab=orders');
    }
  };

  const handleSellerPayoutsClick = () => {
    setSellerTab('payouts');
    if (pathname === '/seller') {
      window.dispatchEvent(new CustomEvent('arboveya:set-seller-tab', { detail: 'payouts' }));
    } else {
      router.push('/seller?tab=payouts');
    }
  };

  // Buyer Dashboard Tab State
  const [buyerTab, setBuyerTab] = useState<'orders' | 'articles' | 'cart'>('orders');

  useEffect(() => {
    const handleBuyerTabChanged = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail === 'orders' || customEvent.detail === 'articles' || customEvent.detail === 'cart') {
        setBuyerTab(customEvent.detail);
      }
    };
    window.addEventListener('arboveya:buyer-tab-changed', handleBuyerTabChanged as EventListener);
    return () => window.removeEventListener('arboveya:buyer-tab-changed', handleBuyerTabChanged as EventListener);
  }, []);

  const handleBuyerOrdersClick = () => {
    setBuyerTab('orders');
    if (pathname === '/buyer') {
      window.dispatchEvent(new CustomEvent('arboveya:set-buyer-tab', { detail: 'orders' }));
    } else {
      router.push('/buyer?tab=orders');
    }
  };

  const handleBuyerArticlesClick = () => {
    setBuyerTab('articles');
    if (pathname === '/buyer') {
      window.dispatchEvent(new CustomEvent('arboveya:set-buyer-tab', { detail: 'articles' }));
    } else {
      router.push('/buyer?tab=articles');
    }
  };

  const handleBuyerCartClick = () => {
    setBuyerTab('cart');
    if (pathname === '/buyer') {
      window.dispatchEvent(new CustomEvent('arboveya:set-buyer-tab', { detail: 'cart' }));
    } else {
      router.push('/buyer?tab=cart');
    }
  };


  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  // Close dropdown on route change
  useEffect(() => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = () => {
    logout();
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
    window.location.replace('/');
  };

  const isSellerStudio = pathname?.startsWith('/seller');
  const isBuyerPortal = pathname?.startsWith('/buyer');
  const isAdminPortal = pathname?.startsWith('/admin');

  // Admin pages have their dedicated AdminHeader component with store navigation
  if (isAdminPortal) {
    return null;
  }

  // =========================================================================
  // 1. SELLER STUDIO DASHBOARD NAVBAR
  // =========================================================================
  if (isSellerStudio) {
    const sellerInitial = user?.firstName ? user.firstName.charAt(0).toUpperCase() : (user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'R');
    const sellerDisplayName = user?.fullName || `${user?.firstName || 'Herbal'} ${user?.lastName || 'Artisan'}`.trim();
    const isApproved = user?.isSellerApproved ?? false;

    return (
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#e5ebe5] transition-all shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3">
          
          {/* Brand Emblem & Seller Dashboard Title */}
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
                Seller Dashboard
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Tabs & Actions (Large screens) */}
          <div className="hidden lg:flex items-center gap-2 sm:gap-2.5 justify-end">
            
            {/* Single button navigating back to main store & main navbar */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#bcd2bf] bg-[#edf5ee] hover:bg-[#dcebdd] text-[#1c3f24] text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Return to main Arboveya store and main navigation bar"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Arboveya Store</span>
            </Link>

            {/* Products Tab Button */}
            <button
              onClick={handleSellerProductsClick}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-2xs cursor-pointer ${
                sellerTab === 'products'
                  ? 'bg-[#2E4D38] text-white shadow-xs'
                  : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
              }`}
              title="Products"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Products</span>
            </button>

            {/* Articles Tab Button */}
            <button
              onClick={handleSellerArticlesClick}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-2xs cursor-pointer ${
                sellerTab === 'articles'
                  ? 'bg-[#2E4D38] text-white shadow-xs'
                  : 'border border-[#2E4D38] text-[#2E4D38] bg-emerald-50/70 hover:bg-emerald-100'
              }`}
              title="Blogs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Blogs</span>
            </button>

            {/* Orders Tab Button */}
            <button
              onClick={handleSellerOrdersClick}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-2xs cursor-pointer ${
                sellerTab === 'orders'
                  ? 'bg-[#2E4D38] text-white shadow-xs'
                  : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
              }`}
              title="Customer Orders"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Orders</span>
            </button>

            {/* Bank & Payouts Tab Button */}
            <button
              onClick={handleSellerPayoutsClick}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-2xs cursor-pointer ${
                sellerTab === 'payouts'
                  ? 'bg-[#2E4D38] text-white shadow-xs'
                  : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
              }`}
              title="Bank Account & Payouts"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Bank & Payouts</span>
            </button>

            {/* Profile Dropdown Trigger */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 py-1 px-2.5 rounded-full border border-[#ccdacc] bg-[#f7faf7] hover:bg-[#eef4ee] text-xs font-semibold text-[#1c3f24] transition shadow-2xs cursor-pointer"
                title="Click to view seller profile"
              >
                <div className="w-7 h-7 rounded-full bg-[#24492d] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {sellerInitial}
                </div>
                <span className="max-w-[110px] truncate hidden xl:inline">{sellerDisplayName}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-stone-500 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Details Popover */}
              {profileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-stone-200 p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#2E4D38] bg-[#edf5ee] px-2.5 py-0.5 rounded-full">
                        Herbal Merchant
                      </span>
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approved Seller</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          <span>Profile Pending Admin Approval</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-serif text-lg font-bold text-stone-900 leading-tight">
                        {sellerDisplayName}
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {user?.email}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-stone-100">
                      <button
                        onClick={handleSignOut}
                        className="w-full py-2 px-3 rounded-xl border border-stone-200 hover:border-rose-300 hover:bg-rose-50 text-stone-600 hover:text-rose-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Standalone Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#ccdacc] hover:border-rose-300 hover:bg-rose-50 text-stone-600 hover:text-rose-700 text-xs font-semibold transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Sign Out</span>
            </button>

            {/* Cart Icon */}
            <button
              onClick={handleBuyerCartClick}
              className={`relative p-2 rounded-xl transition-all duration-300 cursor-pointer ${
                cartHighlighted
                  ? 'bg-emerald-100 text-[#24492d] ring-4 ring-emerald-400/70 shadow-lg scale-110 animate-bounce'
                  : buyerTab === 'cart'
                  ? 'bg-[#edf5ee] text-[#24492d] ring-2 ring-[#24492d]/40'
                  : 'text-[#1c3f24] hover:text-[#2d5c37]'
              }`}
              aria-label="Shopping Cart"
              title="Your Cart & Checkout in Buyer Dashboard"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.75]" />
              {cartCount > 0 && (
                <span className={`absolute -top-1 -right-1 bg-[#24492d] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-xs transition-all duration-300 ${
                  cartHighlighted ? 'bg-emerald-600 ring-2 ring-white scale-125 animate-pulse' : ''
                }`}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile & Tablet Controls (Below lg breakpoint) */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* Quick Cart button */}
            <button
              onClick={handleBuyerCartClick}
              className="relative p-2 rounded-xl border border-stone-200 bg-stone-50 text-[#1c3f24] transition-all cursor-pointer"
              aria-label="Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#24492d] text-white text-[10px] font-bold min-w-[16px] h-[16px] px-0.5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-[#1c3f24] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2E4D38]"
              aria-label="Toggle seller navigation menu"
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
              
              {/* Merchant Identity Card */}
              <div className="p-3.5 rounded-2xl bg-[#f4f8f4] border border-[#d5e5d7] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#24492d] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {sellerInitial}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-stone-900">{sellerDisplayName}</span>
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-[#edf5ee] text-[#1c3f24]">
                        Merchant
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-500 block truncate">{user?.email}</span>
                  </div>
                </div>

                <div>
                  {isApproved ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Approved</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      <Clock className="w-3 h-3" />
                      <span>Pending</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Navigation Tabs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    handleSellerProductsClick();
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                    sellerTab === 'products'
                      ? 'bg-[#2E4D38] text-white shadow-xs'
                      : 'border border-stone-200 bg-stone-50/70 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Products</span>
                </button>

                <button
                  onClick={() => {
                    handleSellerArticlesClick();
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                    sellerTab === 'articles'
                      ? 'bg-[#2E4D38] text-white shadow-xs'
                      : 'border border-stone-200 bg-stone-50/70 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Blogs</span>
                </button>

                <button
                  onClick={() => {
                    handleSellerOrdersClick();
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                    sellerTab === 'orders'
                      ? 'bg-[#2E4D38] text-white shadow-xs'
                      : 'border border-stone-200 bg-stone-50/70 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Orders</span>
                </button>

                <button
                  onClick={() => {
                    handleSellerPayoutsClick();
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                    sellerTab === 'payouts'
                      ? 'bg-[#2E4D38] text-white shadow-xs'
                      : 'border border-stone-200 bg-stone-50/70 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Bank & Payouts</span>
                </button>
              </div>

              {/* Additional Actions */}
              <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row items-center gap-2">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-[#bcd2bf] bg-[#edf5ee] hover:bg-[#dcebdd] text-[#1c3f24] text-xs font-bold transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Arboveya Store</span>
                </Link>

                <button
                  onClick={handleSignOut}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-600" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    );
  }

  // =========================================================================
  // 2. BUYER DASHBOARD NAVBAR
  // =========================================================================
  if (isBuyerPortal) {
    const buyerInitial = user?.firstName ? user.firstName.charAt(0).toUpperCase() : (user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'V');
    const buyerDisplayName = user?.fullName || `${user?.firstName || 'Valued'} ${user?.lastName || 'Customer'}`.trim();

    return (
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#e5ebe5] transition-all shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3">
          
          {/* Brand Emblem & Buyer Dashboard Title */}
          <Link href="/buyer" className="flex items-center gap-3 flex-shrink-0 group">
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
                Buyer Dashboard
              </span>
            </div>
          </Link>

          {/* Desktop Navigation (Large screens) */}
          <div className="hidden lg:flex items-center gap-2 sm:gap-2.5 justify-end">
            
            {/* Single Store button */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#bcd2bf] bg-[#edf5ee] hover:bg-[#dcebdd] text-[#1c3f24] text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Return to main Arboveya store"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Arboveya Store</span>
            </Link>

            {/* Orders Nav Button */}
            <button
              onClick={handleBuyerOrdersClick}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-2xs cursor-pointer ${
                buyerTab === 'orders'
                  ? 'bg-[#2E4D38] text-white shadow-xs'
                  : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
              }`}
              title="Recent Orders"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Orders</span>
            </button>

            {/* Articles Tab Button */}
            <button
              onClick={handleBuyerArticlesClick}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-2xs cursor-pointer ${
                buyerTab === 'articles'
                  ? 'bg-[#2E4D38] text-white shadow-xs'
                  : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
              }`}
              title="Blogs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Blogs</span>
            </button>

            {/* Cart & Checkout Tab Button */}
            <button
              onClick={handleBuyerCartClick}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-2xs cursor-pointer ${
                buyerTab === 'cart'
                  ? 'bg-[#2E4D38] text-white shadow-xs'
                  : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
              }`}
              title="View Cart & Checkout"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Cart & Checkout</span>
              {cartCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#24492d] text-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Profile Dropdown Trigger */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 py-1 px-2.5 rounded-full border border-[#ccdacc] bg-[#f7faf7] hover:bg-[#eef4ee] text-xs font-semibold text-[#1c3f24] transition shadow-2xs cursor-pointer"
                title="Click to view profile"
              >
                <div className="w-7 h-7 rounded-full bg-[#24492d] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {buyerInitial}
                </div>
                <span className="max-w-[110px] truncate hidden xl:inline">{buyerDisplayName}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-stone-500 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Details Popover */}
              {profileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-stone-200 p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#2E4D38] bg-[#edf5ee] px-2.5 py-0.5 rounded-full">
                        Registered Buyer
                      </span>
                    </div>

                    <div>
                      <h4 className="font-serif text-lg font-bold text-stone-900 leading-tight">
                        {buyerDisplayName}
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {user?.email}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-stone-100">
                      <button
                        onClick={handleSignOut}
                        className="w-full py-2 px-3 rounded-xl border border-stone-200 hover:border-rose-300 hover:bg-rose-50 text-stone-600 hover:text-rose-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Standalone Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#ccdacc] hover:border-rose-300 hover:bg-rose-50 text-stone-600 hover:text-rose-700 text-xs font-semibold transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Sign Out</span>
            </button>
          </div>

          {/* Mobile & Tablet Controls (Below lg breakpoint) */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* Quick Cart button */}
            <button
              onClick={handleBuyerCartClick}
              className="relative p-2 rounded-xl border border-stone-200 bg-stone-50 text-[#1c3f24] transition-all cursor-pointer"
              aria-label="Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#24492d] text-white text-[10px] font-bold min-w-[16px] h-[16px] px-0.5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-[#1c3f24] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2E4D38]"
              aria-label="Toggle buyer navigation menu"
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
              
              {/* Buyer Profile Card */}
              <div className="p-3.5 rounded-2xl bg-[#f4f8f4] border border-[#d5e5d7] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#24492d] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {buyerInitial}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-stone-900">{buyerDisplayName}</span>
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                        Buyer
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

              {/* Navigation Tabs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    handleBuyerOrdersClick();
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                    buyerTab === 'orders'
                      ? 'bg-[#2E4D38] text-white shadow-xs'
                      : 'border border-stone-200 bg-stone-50/70 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Orders</span>
                </button>

                <button
                  onClick={() => {
                    handleBuyerArticlesClick();
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                    buyerTab === 'articles'
                      ? 'bg-[#2E4D38] text-white shadow-xs'
                      : 'border border-stone-200 bg-stone-50/70 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Blogs</span>
                </button>

                <button
                  onClick={() => {
                    handleBuyerCartClick();
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                    buyerTab === 'cart'
                      ? 'bg-[#2E4D38] text-white shadow-xs'
                      : 'border border-stone-200 bg-stone-50/70 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Cart ({cartCount})</span>
                </button>
              </div>

              {/* Return to store link */}
              <div className="pt-2 border-t border-stone-100">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-[#bcd2bf] bg-[#edf5ee] hover:bg-[#dcebdd] text-[#1c3f24] text-xs font-bold transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Arboveya Store</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    );
  }

  // =========================================================================
  // 3. MAIN STOREFRONT RETAIL NAVBAR
  // =========================================================================
  const profileDestination = !user 
    ? '/login' 
    : user.role === 'Admin'
    ? '/admin/products'
    : user.role === 'Seller' 
    ? '/seller' 
    : '/buyer';

  const isHomeActive = pathname === '/';
  const isShopActive = pathname?.startsWith('/shop');
  const isAboutActive = pathname?.startsWith('/about');
  const isBlogActive = pathname?.startsWith('/blog');
  const isContactActive = pathname?.startsWith('/contact');

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#e5ebe5] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#2a4d31]/20 shadow-sm group-hover:scale-105 transition-transform">
            <Image
              src="/images/logo-badge.png"
              alt="Arboveya Logo Emblem"
              fill
              sizes="40px"
              className="object-cover"
              priority
            />
          </div>
          <span className="font-serif text-xl sm:text-2xl font-bold tracking-[0.2em] text-[#1c3f24] group-hover:text-[#2d5c37] transition-colors">
            ARBOVEYA
          </span>
        </Link>

        {/* Desktop Navigation Links with Dynamic Active Underline */}
        <nav className="hidden md:flex items-center space-x-6 lg:space-x-7 text-sm font-medium text-[#2d3a30]">
          <Link
            href="/"
            className={`pb-1 transition-all ${
              isHomeActive
                ? 'text-[#1c3f24] font-bold border-b-2 border-[#1c3f24]'
                : 'hover:text-[#1c3f24] border-b-2 border-transparent hover:border-[#1c3f24]/30'
            }`}
          >
            Home
          </Link>
          <Link
            href="/shop"
            className={`pb-1 transition-all ${
              isShopActive
                ? 'text-[#1c3f24] font-bold border-b-2 border-[#1c3f24]'
                : 'hover:text-[#1c3f24] border-b-2 border-transparent hover:border-[#1c3f24]/30'
            }`}
          >
            Shop
          </Link>
          <Link
            href="/about"
            className={`pb-1 transition-all ${
              isAboutActive
                ? 'text-[#1c3f24] font-bold border-b-2 border-[#1c3f24]'
                : 'hover:text-[#1c3f24] border-b-2 border-transparent hover:border-[#1c3f24]/30'
            }`}
          >
            About Us
          </Link>
          <Link
            href="/blog"
            className={`pb-1 transition-all ${
              isBlogActive
                ? 'text-[#1c3f24] font-bold border-b-2 border-[#1c3f24]'
                : 'hover:text-[#1c3f24] border-b-2 border-transparent hover:border-[#1c3f24]/30'
            }`}
          >
            Blogs
          </Link>
          <Link
            href="/contact"
            className={`pb-1 transition-all ${
              isContactActive
                ? 'text-[#1c3f24] font-bold border-b-2 border-[#1c3f24]'
                : 'hover:text-[#1c3f24] border-b-2 border-transparent hover:border-[#1c3f24]/30'
            }`}
          >
            Contact
          </Link>

          {/* Role Portal Shortcut */}
          {user && user.role === 'Customer' && (
            <Link
              href="/buyer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#24492d]/30 bg-[#edf5ee] hover:bg-[#dcebdd] text-[#1c3f24] text-xs font-bold transition shadow-2xs"
            >
              <User className="w-3.5 h-3.5 text-[#24492d]" />
              <span>Buyer Portal</span>
            </Link>
          )}

          {user && user.role === 'Seller' && (
            <Link
              href="/seller"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#24492d]/30 bg-[#edf5ee] hover:bg-[#dcebdd] text-[#1c3f24] text-xs font-bold transition shadow-2xs"
            >
              <Store className="w-3.5 h-3.5 text-[#24492d]" />
              <span>Seller Studio</span>
            </Link>
          )}

          {user && user.role === 'Admin' && (
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#24492d]/30 bg-[#edf5ee] hover:bg-[#dcebdd] text-[#1c3f24] text-xs font-bold transition shadow-2xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#24492d]" />
              <span>Admin Dashboard</span>
            </Link>
          )}

          
        </nav>

        {/* Right Controls */}
        <div className="flex items-center space-x-3 sm:space-x-4 text-[#243d2b]">
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href={profileDestination}
                className="flex items-center gap-2 py-1 px-2.5 rounded-full bg-[#f4f7f4] hover:bg-[#edf2ed] transition text-xs font-semibold text-[#1c3f24]"
                title={`Logged in as ${user.fullName || user.firstName} (${user.role})`}
              >
                <div className="w-6 h-6 rounded-full bg-[#24492d] text-white flex items-center justify-center font-bold text-[11px]">
                  {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="max-w-[110px] truncate hidden sm:inline">
                  {user.fullName || user.firstName}
                </span>
              </Link>

              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#ccdacc] hover:border-rose-300 hover:bg-rose-50 text-stone-600 hover:text-rose-700 text-xs font-semibold transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#1c3f24] hover:bg-[#f0f4f0] transition"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Cart Icon with Live Count (Customers & Guests only) */}
          {(!user || (user.role !== 'Seller' && user.role !== 'Admin')) && (
            <Link
              href="/cart"
              className={`relative p-2 rounded-xl transition-all duration-300 ${
                cartHighlighted
                  ? 'bg-emerald-100 text-[#24492d] ring-4 ring-emerald-400/70 shadow-lg scale-110 animate-bounce'
                  : 'text-[#1c3f24] hover:text-[#2d5c37]'
              }`}
              aria-label="Shopping Cart"
              title="Your Cart"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.75]" />
              {cartCount > 0 && (
                <span className={`absolute -top-1 -right-1 bg-[#24492d] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-xs transition-all duration-300 ${
                  cartHighlighted ? 'bg-emerald-600 ring-2 ring-white scale-125 animate-pulse' : ''
                }`}>
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#1c3f24] hover:text-[#2d5c37] focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#e5ebe5] px-4 pt-2 pb-6 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-base font-medium ${
              isHomeActive ? 'text-[#1c3f24] font-bold bg-[#edf5ee]' : 'text-stone-700 hover:bg-stone-50'
            }`}
          >
            Home
          </Link>
          <Link
            href="/shop"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-base font-medium ${
              isShopActive ? 'text-[#1c3f24] font-bold bg-[#edf5ee]' : 'text-stone-700 hover:bg-stone-50'
            }`}
          >
            Shop
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-base font-medium ${
              isAboutActive ? 'text-[#1c3f24] font-bold bg-[#edf5ee]' : 'text-stone-700 hover:bg-stone-50'
            }`}
          >
            About Us
          </Link>
          <Link
            href="/blog"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-base font-medium ${
              isBlogActive ? 'text-[#1c3f24] font-bold bg-[#edf5ee]' : 'text-stone-700 hover:bg-stone-50'
            }`}
          >
            Blogs
          </Link>
          <Link
            href="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-base font-medium ${
              isContactActive ? 'text-[#1c3f24] font-bold bg-[#edf5ee]' : 'text-stone-700 hover:bg-stone-50'
            }`}
          >
            Contact
          </Link>

          {user && user.role === 'Customer' && (
            <Link
              href="/buyer"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-[#1c3f24] bg-[#edf5ee]"
            >
              Buyer Portal
            </Link>
          )}

          {user && user.role === 'Seller' && (
            <Link
              href="/seller"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-[#1c3f24] bg-[#edf5ee]"
            >
              Seller Studio
            </Link>
          )}

          {user && user.role === 'Admin' && (
            <Link
              href="/admin/products"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-[#1c3f24] bg-[#edf5ee]"
            >
              Admin Dashboard
            </Link>
          )}

          

          {user ? (
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-stone-800">
                {user.fullName || user.firstName}
              </span>
              <button
                onClick={handleSignOut}
                className="text-xs text-rose-600 font-bold uppercase tracking-wider"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-stone-100">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2.5 text-center text-sm font-bold bg-[#24492d] text-white rounded-xl"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}