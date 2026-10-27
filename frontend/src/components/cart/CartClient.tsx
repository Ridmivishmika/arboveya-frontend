'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
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
  LogIn,
  MessageSquare,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { parseOfferMinQuantity, calculateEffectivePrice } from '@/lib/offerUtils';
import { resolveBackendImageUrl, startProductConversation } from '@/lib/api';
import { Product } from '@/types';

export default function CartClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAuth();
  const {
    cart,
    subtotal,
    discountAmount,
    shipping,
    total,
    selectedShippingMethod,
    setSelectedShippingMethod,
    availableShippingMethods,
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

  // Chat with Seller state
  const [contactSellerModalOpen, setContactSellerModalOpen] = useState(false);
  const [selectedContactProduct, setSelectedContactProduct] = useState<Product | null>(null);
  const [contactSellerMessage, setContactSellerMessage] = useState('');
  const [contactSellerLoading, setContactSellerLoading] = useState(false);
  const [contactSellerError, setContactSellerError] = useState<string | null>(null);

  // Auto-open contact seller modal if user returns from login with ?contactProduct=
  useEffect(() => {
    if (searchParams) {
      const contactProdId = searchParams.get('contactProduct');
      const shouldContact = searchParams.get('contactSeller') === '1' || searchParams.get('contactSeller') === 'true' || Boolean(contactProdId);
      if (shouldContact && cart.length > 0) {
        const found = contactProdId ? cart.find(i => i.product.id === contactProdId)?.product : cart[0]?.product;
        if (found) {
          setSelectedContactProduct(found);
          if (user) {
            setContactSellerModalOpen(true);
          }
        }
      }
    }
  }, [searchParams, cart, user]);

  const handleOpenContactSeller = (product?: Product) => {
    const targetProduct = product || cart[0]?.product;
    if (!targetProduct) return;
    if (!user) {
      const returnUrl = encodeURIComponent(`/cart?contactProduct=${targetProduct.id}`);
      router.push(`/login?returnUrl=${returnUrl}`);
      return;
    }
    setSelectedContactProduct(targetProduct);
    setContactSellerError(null);
    setContactSellerModalOpen(true);
  };

  const handleSubmitContactSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContactProduct) return;
    if (!user || !token) {
      const returnUrl = encodeURIComponent(`/cart?contactProduct=${selectedContactProduct.id}`);
      router.push(`/login?returnUrl=${returnUrl}`);
      return;
    }
    const cleanMsg = contactSellerMessage.trim();
    if (!cleanMsg) {
      setContactSellerError('Please enter your question for the seller.');
      return;
    }

    try {
      setContactSellerLoading(true);
      setContactSellerError(null);
      const conv = await startProductConversation(selectedContactProduct.id, cleanMsg, token);
      setContactSellerModalOpen(false);
      setContactSellerMessage('');
      router.push(`/account/messages?id=${conv.id}`);
    } catch (err: any) {
      setContactSellerError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setContactSellerLoading(false);
    }
  };

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
      
      {/* Cart Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {user && (user.role === 'Seller' || user.role === 'Admin') ? (
          /* Seller / Admin Account Notice State */
          <div className="py-16 text-center space-y-4 bg-[#f8faf8] rounded-2xl border border-[#d6dfd7] p-8 max-w-lg mx-auto shadow-2xs">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-xs">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#1c3f24]">
              Purchasing Disabled for {user.role === 'Admin' ? 'Administrators' : 'Sellers'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {user.role === 'Admin' ? (
                <>Your account is registered as an <strong>Arboveya Administrator</strong>. Purchasing products is disabled for administrator accounts. You can inspect all store products and manage administrative operations.</>
              ) : (
                <>Your account is registered as an <strong>Arboveya Merchant</strong>. Purchasing products is disabled for seller accounts. You can browse and inspect all store products or manage your merchant inventory.</>
              )}
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={user.role === 'Admin' ? "/admin/products" : "/seller"}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-[#24492d] hover:bg-[#1a3821] text-white text-xs font-bold tracking-wider uppercase rounded-md shadow-sm transition-colors"
              >
                {user.role === 'Admin' ? 'Go to Admin Portal' : 'Go to Seller Studio'}
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
                    const rawLinePrice = item.selectedVariant?.price ?? Number(item.product.price);
                    const calc = calculateEffectivePrice(
                      rawLinePrice,
                      Number(item.product.discountPercentage) || 0,
                      item.product.offerName,
                      item.quantity
                    );
                    const linePrice = calc.unitPrice;
                    const lineTotal = calc.totalPrice;
                    const isDiscountApplied = calc.isDiscountApplied;
                    const activeTier = calc.activeTier;
                    const allTiers = calc.allTiers;
                    const vKey = item.selectedVariant?.weight;
                    return (
                      <tr key={`${item.product.id}_${vKey ?? 'default'}`} className="hover:bg-[#fafcfa] transition-colors">
                        
                        {/* Product Thumbnail & Details */}
                        <td className="py-5 px-2 sm:px-4">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-[#edf3ed] flex-shrink-0 border border-[#ccdacc]">
                              <Image
                                src={resolveBackendImageUrl(item.product.imageUrl, '/images/gotu-kola-tea.jpg')}
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
                              {allTiers.length > 0 && (
                                isDiscountApplied ? (
                                  <span className="inline-block mt-0.5 text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                                    🏷️ {activeTier?.label || item.product.offerName} (Applied to {item.quantity} items — Save ${calc.savingsTotal.toFixed(2)})
                                  </span>
                                ) : (
                                  <span className="inline-block mt-0.5 text-[9px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                    🏷️ {allTiers[0].label} (Add {allTiers[0].minQty - item.quantity} more to unlock)
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Price Column */}
                        <td className="py-5 px-2 sm:px-4 text-center text-xs sm:text-sm font-semibold text-[#1c3f24]">
                          <div>${linePrice.toFixed(2)}</div>
                          {isDiscountApplied && (
                            <div className="text-[10px] text-stone-400 line-through">
                              ${rawLinePrice.toFixed(2)}
                            </div>
                          )}
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

            {/* Bottom Section: Order Summary */}
            <div className="flex justify-end pt-4">

              {/* Order Summary Card */}
              <div className="w-full lg:max-w-md bg-[#f7faf7] border border-[#e0eae0] rounded-xl p-6 sm:p-7 space-y-4">
                
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

                {/* Shipping Method Selection */}
                <div className="border-t border-[#e2eae2] pt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm text-[#1c3f24]">
                    <span className="font-bold uppercase tracking-wider">SHIPPING METHOD</span>
                    <span className="font-bold text-xs">
                      {shipping === 0 ? (
                        <span className="text-emerald-700 font-bold">FREE</span>
                      ) : (
                        `$${shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>

                  {availableShippingMethods.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {availableShippingMethods.map((opt) => {
                        const isSelected = selectedShippingMethod?.name === opt.name;
                        return (
                          <label
                            key={opt.name}
                            className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                              isSelected
                                ? 'border-[#24492d] bg-white shadow-xs font-semibold text-[#1c3f24]'
                                : 'border-[#e0eae0] bg-white/60 hover:bg-white text-stone-600'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="cart_shipping_method"
                                checked={isSelected}
                                onChange={() => setSelectedShippingMethod(opt)}
                                className="w-3.5 h-3.5 text-[#24492d] accent-[#24492d]"
                              />
                              <div>
                                <span>{opt.name}</span>
                                {opt.estimatedDeliveryTime && (
                                  <span className="block text-[10px] text-stone-500 font-normal">
                                    Est. {opt.estimatedDeliveryTime}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-xs font-bold text-stone-800">
                              {opt.cost === 0 ? 'FREE' : `$${opt.cost.toFixed(2)}`}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
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

                  <button
                    type="button"
                    onClick={() => handleOpenContactSeller(cart[0]?.product)}
                    className="w-full py-3 px-6 rounded-md border border-[#bcd2bf] bg-[#edf5ee] hover:bg-[#dcebdd] text-[#1c3f24] text-xs sm:text-sm font-bold tracking-[0.08em] uppercase transition-all flex items-center justify-center gap-2 cursor-pointer text-center hover:border-[#24492d]"
                  >
                    <MessageSquare className="w-4 h-4 text-[#24492d]" />
                    <span>Chat with Seller</span>
                  </button>
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

            <h3 className="font-serif text-xl font-bold text-[#1c3f24] mb-5">
              Registration Required for Checkout
            </h3>

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

      {/* ================= CHAT WITH SELLER MODAL IN CART ================= */}
      {contactSellerModalOpen && selectedContactProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-[#dbe6dc] space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#e5ebe5]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#edf5ee] flex items-center justify-center text-[#24492d]">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-[#1c3f24] leading-tight">
                    Chat with Seller
                  </h3>
                  <span className="text-[11px] text-[#52785a]">
                    Ask a question about this item before checking out
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setContactSellerModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Summary Preview Card */}
            <div className="p-3 rounded-xl bg-[#f7faf7] border border-[#dbe6dc] flex items-center gap-3">
              {selectedContactProduct.imageUrl && (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white border border-[#d2ded3] flex-shrink-0">
                  <Image
                    src={resolveBackendImageUrl(selectedContactProduct.imageUrl)}
                    alt={selectedContactProduct.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs text-[#1c3f24] truncate">{selectedContactProduct.name}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-extrabold text-[#24492d]">
                    ${Number(selectedContactProduct.price).toFixed(2)} USD
                  </span>
                  {selectedContactProduct.sellerName && (
                    <span className="text-[10px] text-stone-500">Seller: {selectedContactProduct.sellerName}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Error Message if any */}
            {contactSellerError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{contactSellerError}</span>
              </div>
            )}

            {/* Question Input Form */}
            <form onSubmit={handleSubmitContactSeller} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1c3f24] mb-1.5">
                  Your Message or Question
                </label>
                <textarea
                  rows={4}
                  required
                  maxLength={4000}
                  placeholder="e.g. Hello, what is the best way to consume this herbal preparation? Do you offer combine shipping?"
                  value={contactSellerMessage}
                  onChange={(e) => setContactSellerMessage(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#cfded0] text-xs sm:text-sm text-[#1c3f24] placeholder-[#8ea894] focus:outline-none focus:ring-2 focus:ring-[#24492d] resize-none"
                />
                <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1">
                  <span>Replies appear in your Messages inbox</span>
                  <span>{contactSellerMessage.length}/4000</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e5ebe5]">
                <button
                  type="button"
                  onClick={() => setContactSellerModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={contactSellerLoading || !contactSellerMessage.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#24492d] hover:bg-[#1a3821] text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {contactSellerLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Send to Seller</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
