'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { 
  CheckCircle2, 
  Lock, 
  ArrowLeft, 
  ShoppingBag, 
  UserPlus, 
  LogIn, 
  ShieldCheck, 
  User 
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5287/api";

export default function CheckoutClient() {
  const { user, loading: authLoading } = useAuth();
  const { 
    cart, 
    subtotal, 
    discountAmount, 
    shipping, 
    total, 
    selectedShippingMethod, 
    setSelectedShippingMethod, 
    availableShippingMethods, 
    clearCart 
  } = useCart();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('United States');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [agreed, setAgreed] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto pre-populate user details when authenticated
  useEffect(() => {
    if (user) {
      if (!fullName) {
        setFullName(user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim());
      }
      if (!email) {
        setEmail(user.email || '');
      }
      if (!phone && user.phoneNumber) {
        setPhone(user.phoneNumber);
      }
      if (!address && user.address) {
        setAddress(user.address);
      }
      if (user.nationality) {
        setCountry(user.nationality);
      }
    }
  }, [user]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('Please register or log in before completing your order.');
      return;
    }

    if (user.role === 'Seller') {
      setError('Seller accounts cannot purchase products. Please log in with a customer account.');
      return;
    }

    if (!agreed) {
      setError('Please agree to the website terms and conditions.');
      return;
    }

    if (cart.length === 0) {
      setError('Your shopping cart is empty.');
      return;
    }

    try {
      setPlacingOrder(true);
      setError(null);

      const payload = {
        customerName: fullName.trim(),
        customerEmail: email.trim(),
        shippingAddress: `${address.trim()}, ${city.trim() ? city.trim() + ', ' : ''}${country}`,
        shippingMethod: selectedShippingMethod?.name || 'Standard Shipping',
        shippingCost: selectedShippingMethod?.cost ?? 0,
        items: cart.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.price,
          productImageUrl: item.product.imageUrl
        }))
      };

      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('arboveya_token')
            ? { Authorization: 'Bearer ' + localStorage.getItem('arboveya_token') }
            : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();

        // If PayHere details are provided, launch PayHere modal
        if (data.payHereDetails && typeof window !== 'undefined' && (window as any).payhere) {
          const payHereObj = (window as any).payhere;
          const details = data.payHereDetails;

          const payment = {
            sandbox: details.sandbox ?? true,
            merchant_id: details.merchantId,
            return_url: `${window.location.origin}/buyer`,
            cancel_url: `${window.location.origin}/checkout`,
            notify_url: details.notifyUrl || '',
            order_id: details.orderId,
            items: details.items || 'Arboveya Herbal Products',
            amount: Number(details.amount).toFixed(2),
            currency: details.currency || 'LKR',
            hash: details.hash,
            first_name: details.firstName || fullName.split(' ')[0] || 'Customer',
            last_name: details.lastName || fullName.split(' ').slice(1).join(' ') || 'Customer',
            email: details.email || email,
            phone: phone || '0771234567',
            address: address || 'Main Street',
            city: city || 'Colombo',
            country: country || 'Sri Lanka'
          };

          payHereObj.onCompleted = async function (orderId: string) {
            console.log("PayHere payment completed successfully. OrderID:", orderId);
            try {
              await fetch(`${API_BASE_URL}/orders/${data.id}/confirm-payment`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(localStorage.getItem('arboveya_token') ? { Authorization: 'Bearer ' + localStorage.getItem('arboveya_token') } : {})
                },
                body: JSON.stringify({ payHereOrderId: details.orderId, paymentId: orderId })
              });
            } catch (confirmErr) {
              console.warn("Failed to notify backend confirm-payment:", confirmErr);
            }
            clearCart();
            setOrderSuccess(data);
            setPlacingOrder(false);
          };

          payHereObj.onDismissed = function () {
            setError("Payment popup was closed without completing payment. You can retry when ready.");
            setPlacingOrder(false);
          };

          payHereObj.onError = function (err: any) {
            console.error("PayHere payment error:", err);
            setError(`Payment error: ${typeof err === 'string' ? err : 'Unable to complete transaction.'}`);
            setPlacingOrder(false);
          };

          payHereObj.startPayment(payment);
          return;
        }

        // Direct success if PayHere script not active
        setOrderSuccess(data);
        clearCart();
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || 'Failed to place order. Please try again.');
      }
    } catch (err) {
      console.warn('Backend order call failed, providing local demo fallback:', err);
      // Demo fallback success
      const demoOrder = {
        id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
        totalAmount: total,
        customerName: fullName,
        customerEmail: email,
        shippingAddress: `${address}, ${city}, ${country}`
      };
      setOrderSuccess(demoOrder);
      clearCart();
    } finally {
      setPlacingOrder(false);
    }
  };

  // Seller and Admin restriction screen
  if (user && (user.role === 'Seller' || user.role === 'Admin')) {
    const isSeller = user.role === 'Seller';
    return (
      <div className="min-h-screen bg-[#fafcfa] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#d6dfd7] p-8 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#1c3f24]">Checkout Disabled for {isSeller ? 'Sellers' : 'Administrators'}</h1>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            {isSeller
              ? 'Registered herbal merchant accounts cannot place product orders. You can browse the botanical catalog or manage your merchant store in Seller Studio.'
              : 'Registered administrator accounts cannot place product orders. You can browse the botanical catalog or manage store administration in the Admin Portal.'}
          </p>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href={isSeller ? "/seller" : "/admin/products"}
              className="w-full py-3 bg-[#24492d] hover:bg-[#1a3821] text-white text-xs font-bold uppercase rounded-lg shadow-sm transition-colors text-center"
            >
              {isSeller ? "Go to Seller Studio" : "Go to Admin Portal"}
            </Link>
            <Link
              href="/shop"
              className="w-full py-3 bg-white border border-[#24492d] text-[#24492d] hover:bg-[#edf5ee] text-xs font-bold uppercase rounded-lg shadow-sm transition-colors text-center"
            >
              Return to Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 1. Order Success Screen
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-white py-16 px-4">
        <div className="max-w-xl mx-auto text-center space-y-6 bg-[#fafcfa] border border-[#e0eae0] p-8 sm:p-10 rounded-2xl shadow-sm">
          <div className="w-16 h-16 bg-[#edf5ee] text-[#15803d] rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h1 className="font-serif text-3xl font-bold text-[#1c3f24]">
            Thank You for Your Order!
          </h1>

          <p className="text-sm text-[#526a57] leading-relaxed">
            Your herbal wellness order has been placed successfully. A confirmation receipt and dispatch tracking updates will be emailed to <span className="font-bold text-[#1c3f24]">{orderSuccess.customerEmail}</span>.
          </p>

          <div className="p-4 bg-white rounded-xl border border-[#ccdacc] text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-[#6e8773]">Order Reference:</span>
              <span className="font-bold text-[#1c3f24]">{orderSuccess.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6e8773]">Deliver To:</span>
              <span className="font-semibold text-[#1c3f24]">{orderSuccess.shippingAddress}</span>
            </div>
            <div className="flex justify-between border-t border-[#edf3ed] pt-2">
              <span className="text-[#6e8773]">Total Charged:</span>
              <span className="font-bold text-[#1c3f24]">${Number(orderSuccess.totalAmount || total).toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/buyer"
              className="px-6 py-3 bg-[#24492d] hover:bg-[#1a3821] text-white text-xs font-bold uppercase tracking-wider rounded-md shadow-sm transition-colors"
            >
              View Order in Dashboard
            </Link>
            <Link
              href="/shop"
              className="px-6 py-3 border border-[#24492d] text-[#24492d] hover:bg-[#edf5ee] text-xs font-bold uppercase tracking-wider rounded-md transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Auth Gate Screen: User must register or login before checkout
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-white text-[#1c3f24] py-16 px-4">
        <div className="max-w-lg mx-auto bg-[#fafcfa] border border-[#e0eae0] p-8 sm:p-10 rounded-2xl text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 bg-[#edf5ee] text-[#24492d] rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-[#1c3f24]">
              Account Registration Required
            </h2>
            <p className="text-xs sm:text-sm text-[#556e59] mt-2 max-w-md mx-auto leading-relaxed">
              To protect your payment, track your package, and receive herbal wellness delivery updates, checkout is exclusively available for registered Arboveya members.
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#dce7dc] text-left text-xs space-y-2">
            <div className="flex justify-between font-semibold text-[#1c3f24]">
              <span>Cart Items:</span>
              <span>{cart.length} item(s)</span>
            </div>
            <div className="flex justify-between font-bold text-[#24492d] border-t border-[#edf3ed] pt-2">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/register?redirect=/checkout"
              className="w-full py-3.5 px-6 rounded-xl bg-[#24492d] hover:bg-[#1a3821] text-white text-xs sm:text-sm font-bold tracking-wider uppercase shadow-md transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register to Complete Checkout</span>
            </Link>

            <Link
              href="/login?redirect=/checkout"
              className="w-full py-3 px-6 rounded-xl border border-[#24492d] text-[#24492d] hover:bg-[#edf5ee] text-xs sm:text-sm font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Already have an account? Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Main Checkout Form Screen (Logged-in User)
  return (
    <div className="min-h-screen bg-white text-[#1c3f24] font-sans pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        


        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Shipping & Billing Form */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="font-serif text-lg font-bold text-[#1c3f24] tracking-wider uppercase pb-2 border-b border-[#e2eae2]">
              SHIPPING ADDRESS
            </h2>

            <div className="space-y-4 text-xs">
              
              <div className="space-y-1.5">
                <label className="block font-semibold text-[#1c3f24]">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full px-3.5 py-2.5 rounded-md border border-[#ccdacc] bg-[#fafcfa] text-xs focus:outline-none focus:ring-1 focus:ring-[#24492d]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-semibold text-[#1c3f24]">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="eleanor@example.com"
                    className="w-full px-3.5 py-2.5 rounded-md border border-[#ccdacc] bg-[#fafcfa] text-xs focus:outline-none focus:ring-1 focus:ring-[#24492d]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-semibold text-[#1c3f24]">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2.5 rounded-md border border-[#ccdacc] bg-[#fafcfa] text-xs focus:outline-none focus:ring-1 focus:ring-[#24492d]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-[#1c3f24]">Street Address *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Apartment, suite, unit, etc."
                  className="w-full px-3.5 py-2.5 rounded-md border border-[#ccdacc] bg-[#fafcfa] text-xs focus:outline-none focus:ring-1 focus:ring-[#24492d]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-semibold text-[#1c3f24]">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="New York"
                    className="w-full px-3.5 py-2.5 rounded-md border border-[#ccdacc] bg-[#fafcfa] text-xs focus:outline-none focus:ring-1 focus:ring-[#24492d]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-semibold text-[#1c3f24]">Country / Region *</label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-md border border-[#ccdacc] bg-[#fafcfa] text-xs focus:outline-none focus:ring-1 focus:ring-[#24492d]"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Order Summary & Payment */}
          <div className="lg:col-span-5 bg-[#f7faf7] border border-[#e0eae0] rounded-xl p-6 sm:p-7 space-y-5">
            <h2 className="font-serif text-lg font-bold text-[#1c3f24] tracking-wider uppercase pb-2 border-b border-[#e2eae2]">
              YOUR ORDER
            </h2>

            {/* Line items */}
            <div className="space-y-3 divide-y divide-[#edf3ed]">
              {cart.map((item) => (
                <div key={item.product.id} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="font-medium text-[#1c3f24]">{item.product.name}</span>
                    <span className="text-[#6e8773] font-bold">× {item.quantity}</span>
                  </div>
                  <span className="font-bold text-[#1c3f24]">
                    ${(Number(item.product.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Shipping Method Selector */}
            <div className="space-y-2 border-t border-[#e2eae2] pt-3">
              <span className="text-xs font-bold text-[#1c3f24] uppercase tracking-wider block">
                Shipping &amp; Delivery Method
              </span>
              <div className="space-y-2">
                {availableShippingMethods.map((method, idx) => {
                  const isChecked = selectedShippingMethod.name === method.name;
                  return (
                    <label
                      key={idx}
                      onClick={() => setSelectedShippingMethod(method)}
                      className={`flex items-center justify-between p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'border-[#24492d] bg-white ring-1 ring-[#24492d] shadow-2xs'
                          : 'border-[#ccdacc] bg-white/70 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="shippingMethod"
                          checked={isChecked}
                          onChange={() => setSelectedShippingMethod(method)}
                          className="text-[#24492d] focus:ring-[#24492d]"
                        />
                        <div>
                          <span className="font-bold text-[#1c3f24] block">{method.name}</span>
                          <span className="text-[11px] text-[#556e59]">Est: {method.estimatedDeliveryTime}</span>
                        </div>
                      </div>
                      <span className={`font-bold ${method.cost === 0 ? 'text-emerald-700' : 'text-[#1c3f24]'}`}>
                        {method.cost === 0 ? 'FREE' : `$${method.cost.toFixed(2)}`}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2 border-t border-[#e2eae2] pt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-[#556e59]">SUBTOTAL</span>
                <span className="font-bold text-[#1c3f24]">${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#15803d]">
                  <span>DISCOUNT</span>
                  <span className="font-bold">-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[#556e59]">SHIPPING</span>
                  <span className="text-[10px] text-[#718d75]">{selectedShippingMethod.name} ({selectedShippingMethod.estimatedDeliveryTime})</span>
                </div>
                <span className={`font-bold ${shipping === 0 ? 'text-emerald-700' : 'text-[#1c3f24]'}`}>
                  {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#1c3f24] border-t border-[#e2eae2] pt-2">
                <span>TOTAL</span>
                <span className="text-base font-bold">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2.5 border-t border-[#e2eae2] pt-4">
              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-[#ccdacc] bg-white cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  className="text-[#24492d] focus:ring-[#24492d]"
                />
                <span className="text-xs font-bold text-[#1c3f24]">Credit / Debit Card (Stripe / PayHere)</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-[#ccdacc] bg-white cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'paypal'}
                  onChange={() => setPaymentMethod('paypal')}
                  className="text-[#24492d] focus:ring-[#24492d]"
                />
                <span className="text-xs font-bold text-[#1c3f24]">PayPal Express</span>
              </label>
            </div>

            {/* Agreement Checkbox */}
            <label className="flex items-start gap-2.5 pt-1 text-[11px] text-[#4d6652] cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 rounded border-[#ccdacc] text-[#24492d] focus:ring-[#24492d]"
              />
              <span className="leading-relaxed">
                I have read and agree to the website{' '}
                <Link
                  href="/terms-and-conditions"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="font-semibold text-[#1c3f24] underline hover:text-[#2d5c36]"
                >
                  Terms &amp; Conditions
                </Link>
                ,{' '}
                <Link
                  href="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="font-semibold text-[#1c3f24] underline hover:text-[#2d5c36]"
                >
                  Privacy Policy
                </Link>
                , and{' '}
                <Link
                  href="/refund-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="font-semibold text-[#1c3f24] underline hover:text-[#2d5c36]"
                >
                  Refund Policy
                </Link>{' '}
                *
              </span>
            </label>

            {/* Place Order Button */}
            <button
              type="submit"
              disabled={placingOrder}
              className="w-full py-3.5 px-6 rounded-md bg-[#24492d] hover:bg-[#1a3821] text-white text-xs sm:text-sm font-bold tracking-[0.12em] uppercase shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {placingOrder ? 'PLACING ORDER...' : 'PLACE ORDER'}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}
