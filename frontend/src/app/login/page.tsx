'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { forgotPassword, resetPassword } from '@/lib/api';
import { 
  UserCheck, 
  Store, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  UserPlus, 
  Info, 
  KeyRound, 
  Mail, 
  Lock, 
  X, 
  ArrowLeft,
  RefreshCw 
} from 'lucide-react';


function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const roleParam = searchParams.get('role');
  const redirectParam = searchParams.get('redirect');

  const [selectedRole, setSelectedRole] = useState<'Customer' | 'Seller'>('Customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUnregisteredError, setIsUnregisteredError] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forgot Password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [devCodeHint, setDevCodeHint] = useState<string | null>(null);

  useEffect(() => {
    if (roleParam && roleParam.toLowerCase() === 'seller') {
      setSelectedRole('Seller');
    } else if (roleParam && (roleParam.toLowerCase() === 'admin' || roleParam.toLowerCase() === 'administrator')) {
      // Admin login has moved to the private administrative portal
      router.replace('/admin/login');
    }
  }, [roleParam, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setIsUnregisteredError(false);

    try {
      const profile = await login(email, selectedRole, password);
      setSuccessMsg(`Signed in successfully as ${profile?.fullName || profile?.firstName || profile?.role || selectedRole}!`);

      setTimeout(() => {
        if (redirectParam) {
          router.push(redirectParam);
        } else if (profile?.role === 'Admin') {
          router.push('/admin/products');
        } else if (selectedRole === 'Seller' || profile?.role === 'Seller') {
          router.push('/seller');
        } else {
          router.push('/buyer');
        }
      }, 800);
    } catch (err: any) {
      const rawMessage = err?.message || 'Login failed. Please verify your credentials.';
      setErrorMsg(rawMessage);
      if (rawMessage.toLowerCase().includes('not registered') || rawMessage.toLowerCase().includes('register')) {
        setIsUnregisteredError(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenForgot = () => {
    setForgotEmail(email);
    setForgotStep('request');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotError(null);
    setForgotSuccess(null);
    setDevCodeHint(null);
    setIsForgotModalOpen(true);
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your registered email address.');
      return;
    }
    setForgotSubmitting(true);
    setForgotError(null);
    setForgotSuccess(null);
    setDevCodeHint(null);

    try {
      const res = await forgotPassword(forgotEmail.trim());
      if (res.resetCode) {
        setDevCodeHint(res.resetCode);
      }
      setForgotSuccess(res.message || 'Verification code sent to your email.');
      setForgotStep('reset');
    } catch (err: any) {
      setForgotError(err.message || 'Failed to request password reset code.');
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode.trim()) {
      setForgotError('Please enter the 6-digit verification code.');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }

    setForgotSubmitting(true);
    setForgotError(null);
    setForgotSuccess(null);

    try {
      const res = await resetPassword(forgotEmail.trim(), resetCode.trim(), newPassword);
      setForgotSuccess(res.message || 'Password successfully reset!');
      setEmail(forgotEmail.trim());
      setPassword(newPassword);

      setTimeout(() => {
        setIsForgotModalOpen(false);
        setSuccessMsg('Your password has been updated. You can now sign in!');
      }, 1500);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to reset password. Please verify the code and try again.');
    } finally {
      setForgotSubmitting(false);
    }
  };

  const registerUrl = `/register?${new URLSearchParams({
    ...(selectedRole ? { role: selectedRole } : {}),
    ...(redirectParam ? { redirect: redirectParam } : {})
  }).toString()}`;

  return (
    <div className="min-h-screen bg-[#FBFBFA] py-14 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
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
            {selectedRole === 'Seller' ? 'Sign In to Seller Dashboard' : 'Welcome Back'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-sm mx-auto">
            {redirectParam?.includes('checkout')
              ? 'Sign in to complete your checkout and use your saved delivery address.'
              : redirectParam?.includes('blog')
              ? 'Sign in to publish your herbal blog and contribute to Arboveya.'
              : selectedRole === 'Seller'
              ? 'Access your botanical catalog, add products, and manage stock.'
              : 'Sign in to view orders, track packages, and manage your wishlist.'}
          </p>
        </div>

        {/* Registered Users Only Notice */}
        <div className="mb-5 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-900 text-xs flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>Sign in is for <strong>registered users only</strong>. First time here?</span>
          </div>
          <Link
            href={registerUrl}
            className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-md transition text-[11px] whitespace-nowrap"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register First</span>
          </Link>
        </div>

        {/* Role Selector Tabs (Customer & Seller Only) */}
        <div className="grid grid-cols-2 gap-2 bg-stone-100/90 p-1.5 rounded-2xl mb-6 border border-stone-200">
          <button
            type="button"
            onClick={() => setSelectedRole('Customer')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
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
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
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
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium space-y-2.5">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
              {isUnregisteredError && (
                <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between">
                  <span className="text-stone-600 text-[11px]">You must create an account first:</span>
                  <Link
                    href={registerUrl}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E4D38] text-white font-bold text-xs hover:bg-[#223d2b] transition shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Register / Sign Up Now</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-700">Password</label>
                <button
                  type="button"
                  onClick={handleOpenForgot}
                  className="text-xs font-semibold text-[#2E4D38] hover:underline cursor-pointer transition"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your registered password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 py-3.5 rounded-xl bg-[#2E4D38] hover:bg-[#223d2b] text-white text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{submitting ? 'Verifying Account...' : `Sign In as ${selectedRole === 'Seller' ? 'Seller' : 'Buyer'}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Toggle to Register */}
          <div className="mt-6 pt-5 border-t border-stone-100 text-center text-xs text-stone-500">
            <p>
              Don&apos;t have an account yet?{' '}
              <Link
                href={registerUrl}
                className="font-bold text-[#2E4D38] hover:underline cursor-pointer ml-1"
              >
                Register first here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal (Email Verification Flow) */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-stone-200 relative">
            <button
              type="button"
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#1c3f24]/10 text-[#1c3f24] flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-serif font-bold text-stone-900">
                  {forgotStep === 'request' ? 'Forgot Password' : 'Enter Verification Code'}
                </h2>
                <p className="text-xs text-stone-500">
                  {forgotStep === 'request'
                    ? 'Use your email address to receive a secure password reset code'
                    : `Enter the code sent to ${forgotEmail}`}
                </p>
              </div>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {devCodeHint && forgotStep === 'reset' && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold">Reset Code:</span>{' '}
                  <span className="font-mono text-sm tracking-widest font-bold bg-white px-2 py-0.5 rounded border border-amber-200">
                    {devCodeHint}
                  </span>
                </div>
                <span className="text-[10px] text-amber-700">Expires in 15 min</span>
              </div>
            )}

            {forgotStep === 'request' ? (
              <form onSubmit={handleRequestCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Enter your registered account email"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                    />
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1.5">
                    We will generate and send a 6-digit verification code to this email.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={forgotSubmitting}
                  className="w-full py-3 rounded-xl bg-[#2E4D38] hover:bg-[#223d2b] text-white text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {forgotSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Verification Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.trim())}
                    placeholder="e.g. 123456"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-center font-mono text-base tracking-widest font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={forgotSubmitting}
                    className="w-full py-3 rounded-xl bg-[#2E4D38] hover:bg-[#223d2b] text-white text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {forgotSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Reset & Update Password</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep('request');
                      setForgotError(null);
                    }}
                    className="text-xs text-stone-500 hover:text-stone-800 flex items-center justify-center gap-1 py-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change email address or resend code</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
