'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserCheck, Store, ArrowRight, CheckCircle2, Leaf, AlertCircle } from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();

  const roleParam = searchParams.get('role');
  const redirectParam = searchParams.get('redirect');

  const [selectedRole, setSelectedRole] = useState<'Customer' | 'Seller'>('Customer');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (roleParam && roleParam.toLowerCase() === 'seller') {
      setSelectedRole('Seller');
    } else {
      setSelectedRole('Customer');
    }
  }, [roleParam]);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [nationality, setNationality] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      await register({
        firstName,
        lastName,
        email,
        password,
        role: selectedRole,
        address,
        nationality,
        phoneNumber
      });

      setSuccessMsg(
        selectedRole === 'Seller'
          ? 'Seller account created successfully! Opening your Seller Product Dashboard...'
          : 'Account registered successfully! Welcome to Arboveya.'
      );

      setTimeout(() => {
        if (redirectParam) {
          router.push(redirectParam);
        } else if (selectedRole === 'Seller') {
          router.push('/seller');
        } else {
          router.push('/buyer');
        }
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Registration failed. Please check the provided information.');
    } finally {
      setSubmitting(false);
    }
  };

  const loginUrl = `/login?${new URLSearchParams({
    ...(selectedRole ? { role: selectedRole } : {}),
    ...(redirectParam ? { redirect: redirectParam } : {})
  }).toString()}`;

  return (
    <div className="min-h-screen bg-[#FBFBFA] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-xl mx-auto w-full">
        {/* Brand header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#1c3f24] text-white flex items-center justify-center font-serif text-lg font-bold shadow-sm">
              A
            </div>
            <span className="font-serif text-2xl font-bold tracking-[0.18em] text-[#1c3f24]">
              ARBOVEYA
            </span>
          </Link>
          <h1 className="text-2xl font-serif font-bold text-stone-900">
            {selectedRole === 'Seller' ? 'Join as an Herbal Seller' : 'Create Your Account'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-sm mx-auto">
            {redirectParam?.includes('checkout')
              ? 'Please register or log in to complete your purchase and secure your delivery details.'
              : redirectParam?.includes('blog')
              ? 'Create your free account to publish herbal blogs and engage with the botanical community.'
              : selectedRole === 'Seller'
              ? 'Register your botanical studio or farm to showcase handcrafted Ayurvedic preparations.'
              : 'Sign up to shop genuine herbal formulations, track orders, and build your wellness cabinet.'}
          </p>
        </div>

        {/* Account Type Selector Tabs (Only Customer and Seller) */}
        <div className="grid grid-cols-2 gap-2 bg-stone-100/90 p-1.5 rounded-2xl mb-6 border border-stone-200">
          <button
            type="button"
            onClick={() => setSelectedRole('Customer')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              selectedRole === 'Customer'
                ? 'bg-[#2E4D38] text-white shadow-sm'
                : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Buyer (Customer)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('Seller')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              selectedRole === 'Seller'
                ? 'bg-[#2E4D38] text-white shadow-sm'
                : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Herbal Seller</span>
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-7 sm:p-8 shadow-sm">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {selectedRole === 'Seller' && (
            <div className="mb-6 p-4 rounded-xl bg-[#edf5ee] border border-[#bcd2bf] text-[#1c3f24] text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Leaf className="w-4 h-4 text-[#2E4D38]" />
                <span>Seller Product Add Dashboard Included</span>
              </div>
              <p className="text-[12px] text-stone-600">
                After completing registration, you will have immediate access to your Seller Dashboard to add new botanical products, configure stock, and track admin review.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Maria"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Santos"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={selectedRole === 'Seller' ? 'seller@botanicals.com' : 'you@example.com'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {selectedRole === 'Seller' ? 'Business / Botanical Studio Address *' : 'Delivery Address *'}
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Botanical Avenue, Suite 4"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Nationality / Country *</label>
                <input
                  type="text"
                  required
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  placeholder="e.g. Sri Lankan / USA"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 0771234567"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 py-3.5 rounded-xl bg-[#2E4D38] hover:bg-[#223d2b] text-white text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>
                {submitting
                  ? 'Creating Account...'
                  : selectedRole === 'Seller'
                  ? 'Register as Seller & Open Dashboard'
                  : 'Register Account & Continue'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Toggle to Sign In */}
          <div className="mt-6 pt-5 border-t border-stone-100 text-center text-xs text-stone-500">
            <p>
              Already have an account?{' '}
              <Link
                href={loginUrl}
                className="font-bold text-[#2E4D38] hover:underline cursor-pointer ml-1"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
