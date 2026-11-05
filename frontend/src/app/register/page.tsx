'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { ALLOWED_BUYER_COUNTRIES, getCountryByNameOrCode, validatePhoneNumber, DEFAULT_COUNTRY, CountryInfo } from '@/lib/countries';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();

  const redirectParam = searchParams.get('redirect') || searchParams.get('returnUrl');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(DEFAULT_COUNTRY);
  const [nationality, setNationality] = useState(DEFAULT_COUNTRY.name);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [phoneValidation, setPhoneValidation] = useState<{ isValid: boolean; message?: string } | null>(null);

  const handleCountryChange = (countryName: string) => {
    const c = getCountryByNameOrCode(countryName);
    setSelectedCountry(c);
    setNationality(c.name);
    if (phoneNumber) {
      const res = validatePhoneNumber(c, phoneNumber);
      setPhoneValidation({ isValid: res.isValid, message: res.message });
    }
  };

  const handlePhoneChange = (val: string) => {
    setPhoneNumber(val);
    setPhoneTouched(true);
    const res = validatePhoneNumber(selectedCountry, val);
    setPhoneValidation({ isValid: res.isValid, message: res.message });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const phoneCheck = validatePhoneNumber(selectedCountry, phoneNumber);
    if (!phoneCheck.isValid) {
      setPhoneTouched(true);
      setPhoneValidation({ isValid: false, message: phoneCheck.message });
      setErrorMsg(phoneCheck.message || 'Please enter a valid phone number.');
      setSubmitting(false);
      return;
    }
    const finalPhone = phoneCheck.fullInternationalNumber;

    const addressParts = [
      addressLine1.trim(),
      addressLine2.trim() || null,
      city.trim() || null,
      zipCode.trim() || null
    ].filter(Boolean);
    const streetAddress = [addressLine1.trim(), addressLine2.trim()].filter(Boolean).join(', ');
    const compiledAddress = addressParts.join(', ');

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('arboveya_shipping_pref', JSON.stringify({
          streetAddress: streetAddress || addressLine1.trim(),
          address: streetAddress || addressLine1.trim(),
          city: city.trim(),
          zipCode: zipCode.trim(),
          country: nationality
        }));
      } catch (_) {}
    }

    try {
      await register({
        firstName,
        lastName,
        email,
        password,
        role: 'Customer',
        address: streetAddress || addressLine1.trim(),
        city: city.trim(),
        zipCode: zipCode.trim(),
        nationality,
        phoneNumber: finalPhone
      });

      setSuccessMsg('Buyer account registered successfully! Welcome to Arboveya.');

      setTimeout(() => {
        if (redirectParam) {
          router.push(redirectParam);
        } else {
          router.push('/');
        }
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Registration failed. Please check the provided information.');
    } finally {
      setSubmitting(false);
    }
  };

  const loginUrl = `/login?${new URLSearchParams({
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
            Create Buyer Account
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-sm mx-auto">
            {redirectParam?.includes('checkout')
              ? 'Please register to complete your purchase and secure your delivery details.'
              : redirectParam?.includes('blog')
              ? 'Create your free account to publish herbal blogs and engage with the botanical community.'
              : 'Sign up to shop genuine herbal formulations, track orders, and build your wellness cabinet.'}
          </p>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
              />
            </div>

            {/* Buyer Delivery Address */}
            <div className="pt-2 border-t border-stone-200">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                required
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Apartment, Suite, Unit, Building (Optional)
              </label>
              <input
                type="text"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">ZIP / Postal Code *</label>
                <input
                  type="text"
                  required
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                />
              </div>
            </div>

            {/* Buyer Country Selector (Europe, Americas, Oceania) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Country / Region *</label>
                <select
                  value={selectedCountry.code}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                >
                  {ALLOWED_BUYER_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Contact Phone Number *
                </label>
                <div className="flex gap-2">
                  <span className="inline-flex items-center px-3 rounded-xl border border-stone-300 bg-stone-50 text-xs font-bold text-stone-600">
                    {selectedCountry.dialCode}
                  </span>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className={`flex-1 px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                      phoneTouched && phoneValidation && !phoneValidation.isValid
                        ? 'border-rose-400 focus:ring-rose-200'
                        : 'border-stone-300 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]'
                    }`}
                  />
                </div>
                {phoneTouched && phoneValidation && !phoneValidation.isValid && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    {phoneValidation.message}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 py-3.5 rounded-xl bg-[#2E4D38] hover:bg-[#223d2b] text-white text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>
                {submitting ? 'Creating Account...' : 'Register Buyer Account'}
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
