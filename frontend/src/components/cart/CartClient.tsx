'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Minus, 
  Plus, 
  X, 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck, 
  Tag, 
  Check, 
  Sparkles,
  Lock,
  UserPlus,
  LogIn
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function CartClient() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    cart,
    subtotal,
    discountAmount,
    total,
    coupon,
    couponError,
    couponSuccess,
    updateQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    applyCoupon(couponInput);
  };

  const handleProceedToCheckout = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    router.push('/checkout');
  };

  const isFreeShipping = subtotal >= 50;

  return (
    <div className="min-h-screen bg-white text-[#1c3f24] font-sans">
      
      {/* Top Banner: Free Shipping Notification */}
      <div className="bg-[#24492d] text-white text-[11px] sm:text-xs tracking-wider py-2 px-4 text-center font-medium">
        Free Shipping on Orders Over $50
      </div>

      

      {/* Cart Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {user && user.role === 'Seller' ? (
          /* Seller Account Notice State */
          <div className="py-16 text-center space-y-4 bg-[#f8faf8] rounded-2xl border border-[#d6dfd7] p-8 max-w-lg mx-auto shadow-2xs">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-xs">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#1c3f24]">
              Purchasing Disabled for Sellers
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Your account is registered as an <strong>Arboveya Herbal Merchant</strong>. Purchasing products is disabled for seller accounts. You can browse and inspect all store products or manage your merchant inventory.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/seller"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-[#24492d] hover:bg-[#1a3821] text-white text-xs font-bold tracking-wider uppercase rounded-md shadow-sm transition-colors"
              >
                Go to Seller Studio
              </Link>
              <Link
                href="/shop"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-white border border-[#24492d] text-[#24492d] hover:bg-[#edf5ee] text-xs font-bold tracking-wider uppercase rounded-md shadow-sm transition-colors"
              >
                Browse Store Products
              </Link>
            </div>
          </div>
        ) : cart.length === 0 ? (
          /* Empty Cart State */
          <div className="py-20 text-center space-y-4 bg-[#fafcfa] rounded-2xl border border-[#e5ebe5] p-8 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#edf5ee] text-[#24492d] flex items-center justify-center mx-auto shadow-xs">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#1c3f24]">
              Your Cart is Currently Empty
            </h2>
            <p className="text-xs sm:text-sm text-[#556e59] leading-relaxed">
              Explore our certified organic botanicals, herbal teas, and traditional remedies to fill your sanctuary with wellness.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-7 py-3.5 bg-[#24492d] hover:bg-[#1a3821] text-white text-xs font-bold tracking-wider uppercase rounded-md shadow-sm transition-colors"
            >
              EXPLORE OUR BOTANICALS
            </Link>
          </div>
        ) : (
          /* Populated Cart */
          <div className="space-y-8">
            
            {/* Table of Cart Items */}
            <div className="overflow-x-auto border-b border-[#ccdacc]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#ccdacc] text-[11px] font-bold tracking-wider text-[#1c3f24] uppercase">
                    <th className="py-4 px-2 sm:px-4">PRODUCT</th>
                    <th className="py-4 px-2 sm:px-4 text-center">PRICE</th>
                    <th className="py-4 px-2 sm:px-4 text-center">QUANTITY</th>
                    <th className="py-4 px-2 sm:px-4 text-right">TOTAL</th>
                    <th className="py-4 px-2 sm:px-4 text-right">REMOVE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5ebe5]">
                  {cart.map((item) => {
                    const linePrice = item.selectedVariant?.price ?? Number(item.product.price);
                    const lineTotal = linePrice * item.quantity;
                    const vKey = item.selectedVariant?.weight;
                    return (
                      <tr key={`${item.product.id}_${vKey ?? 'default'}`} className="hover:bg-[#fafcfa] transition-colors">
                        
                        {/* Product Thumbnail & Details */}
                        <td className="py-5 px-2 sm:px-4">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-[#edf3ed] flex-shrink-0 border border-[#ccdacc]">
                              <Image
                                src={item.product.imageUrl || '/images/gotu-kola-tea.jpg'}
                                alt={item.product.name}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <Link
                                href={`/shop/${item.product.id}`}
                                className="font-bold text-xs sm:text-sm text-[#1c3f24] hover:underline block line-clamp-2"
                              >
                                {item.product.name}
                              </Link>
                              {item.selectedVariant ? (
                                <span className="text-[11px] text-[#69826e] block mt-0.5">
                                  {item.selectedVariant.weight}
                                </span>
                              ) : item.product.weight ? (
                                <span className="text-[11px] text-[#69826e] block mt-0.5">
                                  {item.product.weight}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        {/* Price Column */}
                        <td className="py-5 px-2 sm:px-4 text-center text-xs sm:text-sm font-semibold text-[#1c3f24]">
                          ${linePrice.toFixed(2)}
                        </td>

                        {/* Quantity Column */}
                        <td className="py-5 px-2 sm:px-4 text-center">
                          <div className="inline-flex items-center border border-[#ccdacc] rounded-lg overflow-hidden bg-white shadow-2xs">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1, vKey)}
                              className="p-2 sm:p-2.5 hover:bg-[#f3f7f3] text-[#3e5642] transition-colors cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 sm:w-10 text-center text-xs font-bold text-[#1c3f24]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1, vKey)}
                              className="p-2 sm:p-2.5 hover:bg-[#f3f7f3] text-[#3e5642] transition-colors cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* Total Column */}
                        <td className="py-5 px-2 sm:px-4 text-right text-xs sm:text-sm font-bold text-[#1c3f24]">
                          ${lineTotal.toFixed(2)}
                        </td>

                        {/* Remove Action Button */}
                        <td className="py-5 px-2 sm:px-4 text-right">
                          <button
                            onClick={() => removeFromCart(item.product.id, vKey)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            title="Remove item"
                            aria-label="Remove item"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Section: Coupon and Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4 items-start">
              
              {/* Left Column: Coupon Code */}
              <div className="lg:col-span-6 space-y-3">
                <form onSubmit={handleApplyCoupon} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Coupon Code"
                    className="flex-1 max-w-xs px-4 py-2.5 rounded-md border border-[#ccdacc] bg-white text-xs sm:text-sm text-[#1c3f24] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#24492d] focus:border-[#24492d]"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#24492d] hover:bg-[#1a3821] text-white text-xs font-bold tracking-wider uppercase rounded-md shadow-xs transition-colors cursor-pointer"
                  >
                    APPLY
                  </button>
                </form>

                {couponSuccess && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#15803d]">
                    <Check className="w-4 h-4" />
                    <span>{couponSuccess}</span>
                    <button
                      onClick={removeCoupon}
                      className="ml-2 text-gray-400 hover:text-red-600 text-xs underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="text-xs text-red-600 font-medium">{couponError}</p>
                )}
                {!coupon && (
                  <p className="text-[11px] text-[#637d68]">
                    Tip: Use coupon <span className="font-bold text-[#24492d]">HERBAL10</span> for 10% off!
                  </p>
                )}
              </div>

              {/* Right Column: Order Summary Card */}
              <div className="lg:col-span-6 bg-[#f7faf7] border border-[#e0eae0] rounded-xl p-6 sm:p-7 space-y-4">
                
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-bold text-[#1c3f24] uppercase tracking-wider">SUBTOTAL</span>
                  <span className="font-bold text-[#1c3f24]">${subtotal.toFixed(2)}</span>
                </div>

                {coupon && (
                  <div className="flex items-center justify-between text-xs sm:text-sm text-[#15803d]">
                    <span className="font-medium">DISCOUNT ({coupon.discountPercent}%)</span>
                    <span className="font-bold">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs sm:text-sm border-t border-[#e2eae2] pt-3 text-[#526a57]">
                  <span className="font-bold uppercase tracking-wider text-[#1c3f24]">SHIPPING</span>
                  <span className="text-xs text-[#526a57]">
                    {isFreeShipping ? (
                      <span className="font-bold text-[#15803d]">FREE (Orders over $50)</span>
                    ) : (
                      'Calculated at checkout'
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm sm:text-base border-t border-[#e2eae2] pt-4 font-bold text-[#1c3f24]">
                  <span className="uppercase tracking-wider font-bold">TOTAL</span>
                  <span className="text-lg font-bold">${total.toFixed(2)}</span>
                </div>

                {/* Checkout Button */}
                <div className="space-y-2.5 pt-2">
                  <button
                    onClick={handleProceedToCheckout}
                    className="w-full py-3.5 px-6 rounded-md bg-[#24492d] hover:bg-[#1a3821] text-white text-xs sm:text-sm font-bold tracking-[0.12em] uppercase shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
                  >
                    <Lock className="w-4 h-4" />
                    <span>PROCEED TO CHECKOUT</span>
                  </button>

                  <Link
                    href="/shop"
                    className="w-full py-3 px-6 rounded-md border border-[#24492d] text-[#24492d] hover:bg-[#edf5ee] text-xs sm:text-sm font-bold tracking-[0.12em] uppercase transition-all flex items-center justify-center gap-2 cursor-pointer text-center block"
                  >
                    CONTINUE SHOPPING
                  </Link>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>

      {/* Authentication Required Modal for Checkout */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-stone-200">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-[#edf5ee] text-[#24492d] flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="font-serif text-xl font-bold text-[#1c3f24] mb-2">
              Registration Required for Checkout
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 mb-6 leading-relaxed">
              To guarantee secure payment, order dispatch, and live shipment tracking, please register an Arboveya account or log in to continue.
            </p>

            <div className="space-y-3">
              <Link
                href="/register?redirect=/checkout"
                className="w-full py-3 px-4 rounded-xl bg-[#24492d] hover:bg-[#1a3821] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-sm text-center"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register New Account</span>
              </Link>

              <Link
                href="/login?redirect=/checkout"
                className="w-full py-3 px-4 rounded-xl border border-[#24492d] text-[#24492d] hover:bg-[#edf5ee] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition text-center"
              >
                <LogIn className="w-4 h-4" />
                <span>I Already Have an Account</span>
              </Link>
            </div>

            <p className="text-[11px] text-center text-stone-400 mt-4">
              Your cart items are saved and ready when you return.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
