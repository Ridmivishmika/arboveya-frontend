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
  User,
  AlertCircle
} from 'lucide-react';
import { API_BASE_URL, resolveBackendImageUrl } from '@/lib/api';

declare global {
  interface Window {
    payhere?: {
      startPayment: (payment: any) => void;
      onCompleted?: (orderId: string) => void;
      onDismissed?: () => void;
      onError?: (error: string) => void;
    };
  }
}

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
  const [country, setCountry] = useState('United States');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'payhere' | 'cod' | 'paypal' | 'card'>('payhere');
  const [payHereMode, setPayHereMode] = useState<'popup' | 'redirect'>('popup');
  const [agreed, setAgreed] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelNotice, setCancelNotice] = useState<string | null>(null);

  // Auto pre-populate user details when authenticated
  useEffect(() => {
    if (user) {
      const uName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim();
      if (!fullName) {
        setFullName(uName);
      }
      if (!email) {
        setEmail(user.email || '');
      }
      if (user.nationality) {
        setCountry(user.nationality);
      }
      if (!phone && user.phoneNumber) {
        setPhone(user.phoneNumber);
      }
      if (!address && user.address) {
        setAddress(user.address);
      }
      if (!zipCode && (user as any).zipCode) {
        setZipCode((user as any).zipCode);
      }
    }
  }, [user]);

  // Ensure PayHere 2.0 SDK script is attached to DOM
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.payhere) {
      const existingScript = document.querySelector('script[src*="payhere-2.0.js"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://www.payhere.lk/lib/payhere-2.0.js';
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, []);

  // Check for PayHere redirect return / cancel URL query params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const status = params.get('status');
      const orderId = params.get('order_id');
      if (status === 'cancel') {
        setCancelNotice('Your PayHere payment session was cancelled. You can retry anytime.');
      } else if (status === 'success' && orderId) {
        setOrderSuccess({
          payHereOrderId: orderId,
          paymentStatus: 'Paid',
          paymentMethodName: 'PayHere Secure Gateway (Redirect Mode)'
        });
        clearCart();

        try {
          const pendingId = sessionStorage.getItem(`arboveya_pending_order_${orderId}`);
          if (pendingId) {
            const actualPaymentId = params.get('payment_id') || undefined;
            fetch(`${API_BASE_URL}/orders/${pendingId}/confirm-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(localStorage.getItem('arboveya_token') ? { Authorization: 'Bearer ' + localStorage.getItem('arboveya_token') } : {})
              },
              body: JSON.stringify({
                payHereOrderId: orderId,
                paymentId: actualPaymentId
              })
            }).catch(e => console.warn('Backend payment confirmation notice:', e));
          }
        } catch {}
      }
    }
  }, [clearCart]);

  // PayHere Checkout API Form Redirect Helper
  const submitPayHereRedirect = (details: any) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = details.actionUrl || (details.sandbox ? 'https://sandbox.payhere.lk/pay/checkout' : 'https://www.payhere.lk/pay/checkout');

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://arboveya.com';
    const fields: Record<string, any> = {
      merchant_id: details.merchantId,
      return_url: `${origin}/checkout?status=success&order_id=${details.orderId}`,
      cancel_url: `${origin}/checkout?status=cancel`,
      notify_url: details.notifyUrl || '',
      first_name: details.firstName,
      last_name: details.lastName,
      email: details.email,
      phone: details.phone,
      address: details.address,
      city: details.city,
      country: details.country,
      delivery_address: details.deliveryAddress || details.address,
      delivery_city: details.deliveryCity || details.city,
      delivery_country: details.deliveryCountry || details.country,
      custom_1: details.custom1 || '',
      custom_2: details.custom2 || '',
      order_id: details.orderId,
      items: details.items,
      currency: details.currency || 'USD',
      amount: Number(details.amount).toFixed(2),
      hash: details.hash
    };

    Object.entries(fields).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        const inp = document.createElement('input');
        inp.type = 'hidden';
        inp.name = k;
        inp.value = String(v);
        form.appendChild(inp);
      }
    });

    document.body.appendChild(form);
    form.submit();
  };

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

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!phone.trim()) {
      setError('Please enter your contact phone number (required by PayHere).');
      return;
    }

    if (!country.trim()) {
      setError('Please enter your delivery country.');
      return;
    }

    if (!address.trim()) {
      setError('Please enter your delivery address.');
      return;
    }

    if (!city.trim()) {
      setError('Please enter your city.');
      return;
    }

    if (!zipCode.trim()) {
      setError('Please enter your ZIP / Postal code.');
      return;
    }

    try {
      setPlacingOrder(true);
      setError(null);
      setCancelNotice(null);

      const fullShippingAddress = [
        address.trim(),
        city.trim(),
        zipCode.trim(),
        country.trim()
      ].filter(Boolean).join(', ');

      const payload = {
        customerName: fullName.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        country: country.trim(),
        shippingAddress: fullShippingAddress,
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

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || 'Failed to initialize order with server. Please try again.');
        setPlacingOrder(false);
        return;
      }

      const orderData = await res.json();
      const details = orderData.payHereDetails;

      if (!details || !details.hash) {
        // Fallback demo confirmation if PayHere details missing
        setOrderSuccess(orderData);
        clearCart();
        setPlacingOrder(false);
        return;
      }

      // Check user preference for popup vs redirect
      if (payHereMode === 'redirect' || typeof window === 'undefined' || !window.payhere) {
        if (typeof window !== 'undefined' && details.orderId && orderData.id) {
          sessionStorage.setItem(`arboveya_pending_order_${details.orderId}`, orderData.id);
        }
        submitPayHereRedirect(details);
        return;
      }

      // PayHere Onsite Popup SDK mode
      window.payhere.onCompleted = async function onCompleted(completedOrderId: string) {
        console.log('PayHere payment completed successfully. OrderID:', completedOrderId);
        try {
          await fetch(`${API_BASE_URL}/orders/${orderData.id}/confirm-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(localStorage.getItem('arboveya_token') ? { Authorization: 'Bearer ' + localStorage.getItem('arboveya_token') } : {})
            },
            body: JSON.stringify({ 
              payHereOrderId: details.orderId, 
              paymentId: completedOrderId 
            })
          });
        } catch (e) {
          console.warn('Backend payment confirmation notice:', e);
        }

        setOrderSuccess({
          ...orderData,
          paymentStatus: 'Paid',
          paymentMethodName: `PayHere Gateway (Payment Ref: ${completedOrderId || details.orderId})`
        });
        clearCart();
        setPlacingOrder(false);
      };

      window.payhere.onDismissed = function onDismissed() {
        console.log('PayHere popup dismissed');
        setCancelNotice('PayHere checkout popup was dismissed. You can reopen it or switch to redirect mode whenever you are ready.');
        setPlacingOrder(false);
      };

      window.payhere.onError = function onError(payhereErr: string) {
        console.error('PayHere error:', payhereErr);
        setError(`PayHere Error: ${payhereErr}. If the popup is blocked, please select "Hosted Checkout Redirect".`);
        setPlacingOrder(false);
      };

      const paymentObj = {
        sandbox: details.sandbox,
        merchant_id: details.merchantId,
        return_url: details.returnUrl || '',
        cancel_url: details.cancelUrl || '',
        notify_url: details.notifyUrl,
        order_id: details.orderId,
        items: details.items,
        amount: Number(details.amount).toFixed(2),
        currency: details.currency || 'USD',
        hash: details.hash,
        first_name: details.firstName,
        last_name: details.lastName,
        email: details.email,
        phone: details.phone,
        address: details.address,
        city: details.city,
        country: details.country,
        delivery_address: details.deliveryAddress || details.address,
        delivery_city: details.deliveryCity || details.city,
        delivery_country: details.deliveryCountry || details.country,
        custom_1: details.custom1 || '',
        custom_2: details.custom2 || ''
      };

      window.payhere.startPayment(paymentObj);
    } catch (err) {
      console.warn('Checkout order submission error:', err);
      setError('An unexpected error occurred while placing your order. Please check your connection.');
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
            Your herbal wellness order has been placed successfully.
          </p>

          <div className="p-4 bg-white rounded-xl border border-[#ccdacc] text-left text-xs space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-[#6e8773]">Order Reference:</span>
              <span className="font-mono font-bold text-[#1c3f24]">{orderSuccess.payHereOrderId || orderSuccess.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6e8773]">Payment Method:</span>
              <span className="font-semibold text-[#1c3f24]">{orderSuccess.paymentMethodName || 'Credit / Debit Card'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6e8773]">Payment Status:</span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                (orderSuccess.paymentStatus || 'Paid').toLowerCase().includes('paid')
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                <CheckCircle2 className="w-3 h-3" />
                {orderSuccess.paymentStatus || 'Paid'}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-[#6e8773]">Deliver To:</span>
              <span className="font-semibold text-[#1c3f24] text-right max-w-[65%]">{orderSuccess.shippingAddress}</span>
            </div>
            <div className="flex justify-between items-center border-t border-[#edf3ed] pt-2">
              <span className="text-[#6e8773] font-medium">Total Charged:</span>
              <span className="font-bold text-sm text-[#1c3f24]">${Number(orderSuccess.totalAmount || total).toFixed(2)}</span>
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
              </div>

              {/* Country and Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-semibold text-[#1c3f24]">Country *</label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. United States, Sri Lanka, United Kingdom"
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
                    placeholder="e.g. +1 555 123 4567 or 077 123 4567"
                    className="w-full px-3.5 py-2.5 rounded-md border border-[#ccdacc] bg-[#fafcfa] text-xs focus:outline-none focus:ring-1 focus:ring-[#24492d]"
                  />
                </div>
              </div>

              {/* Street Address */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-[#1c3f24]">Street Address *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Apartment, suite, unit, building, street address"
                  className="w-full px-3.5 py-2.5 rounded-md border border-[#ccdacc] bg-[#fafcfa] text-xs focus:outline-none focus:ring-1 focus:ring-[#24492d]"
                />
              </div>

              {/* City and Zip Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-semibold text-[#1c3f24]">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. New York, London, Colombo"
                    className="w-full px-3.5 py-2.5 rounded-md border border-[#ccdacc] bg-[#fafcfa] text-xs focus:outline-none focus:ring-1 focus:ring-[#24492d]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-semibold text-[#1c3f24]">ZIP / Postal Code *</label>
                  <input
                    type="text"
                    required
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="e.g. 78701 or 00100"
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

            {/* Order Items Table */}
            <div className="overflow-x-auto rounded-xl border border-[#e0eae0] bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#edf5ee] text-[#1c3f24] font-bold border-b border-[#e0eae0]">
                    <th className="py-2.5 px-3">Item</th>
                    <th className="py-2.5 px-2 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Price</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf3ed]">
                  {cart.map((item) => (
                    <tr key={item.product.id} className="hover:bg-[#fafcfa] transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#d6dfd7] bg-[#f2f6f2] flex-shrink-0">
                            <Image
                              src={resolveBackendImageUrl(item.product.imageUrl, '/images/gotu-kola-tea.jpg')}
                              alt={item.product.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#1c3f24] line-clamp-2 leading-tight">
                              {item.product.name}
                            </p>
                            {(item.product.weight || item.product.categoryName) && (
                              <p className="text-[10px] text-stone-500 mt-0.5">
                                {item.product.weight ? `Weight: ${item.product.weight}` : item.product.categoryName}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center font-bold text-[#24492d]">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-3 text-right text-stone-600 font-medium whitespace-nowrap">
                        ${Number(item.product.price).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-[#1c3f24] whitespace-nowrap">
                        ${(Number(item.product.price) * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

            {/* Payment Method */}
            <div className="flex items-center justify-between py-2 border-t border-[#e2eae2] text-xs">
              <div className="flex items-center gap-1.5 text-[#1c3f24] font-semibold">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                <span>PayHere Secure Payment</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-stone-600">
                <span className="px-1.5 py-0.5 bg-white border border-stone-200 rounded">VISA</span>
                <span className="px-1.5 py-0.5 bg-white border border-stone-200 rounded">MC</span>
                <span className="px-1.5 py-0.5 bg-white border border-stone-200 rounded">AMEX</span>
                <span className="px-1.5 py-0.5 bg-white border border-stone-200 rounded">USD</span>
              </div>
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

            {/* Error Notice Displayed Next to Button */}
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-start gap-2 shadow-xs">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{error}</span>
              </div>
            )}

            {/* Cancel Notice from PayHere */}
            {cancelNotice && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>{cancelNotice}</span>
              </div>
            )}

            {/* Place Order Button */}
            <button
              type="submit"
              disabled={placingOrder}
              className="w-full py-3.5 px-6 rounded-md bg-[#24492d] hover:bg-[#1a3821] text-white text-xs sm:text-sm font-bold tracking-[0.12em] uppercase shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>
                {placingOrder 
                  ? 'COMMUNICATING WITH PAYHERE...' 
                  : payHereMode === 'redirect'
                  ? `Pay $${total.toFixed(2)}`
                  : `Pay $${total.toFixed(2)}`}
              </span>
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}
