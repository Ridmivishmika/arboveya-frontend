'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Lock, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, logout } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const profile = await login(email.trim(), 'Admin', password);
      
      if (profile.role !== 'Admin') {
        logout();
        throw new Error('Access Denied: The authenticated account does not have administrator privileges.');
      }

      setSuccessMsg('Administrator authentication verified. Loading operations center...');

      setTimeout(() => {
        router.push('/admin/products');
      }, 700);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed. Please verify your administrative credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1c12] bg-[radial-gradient(#1c3f24_1px,transparent_1px)] [background-size:24px_24px] py-14 px-4 sm:px-6 lg:px-8 flex flex-col justify-center text-stone-100">
      <div className="max-w-md mx-auto w-full">
        
        {/* Emblem & Portal Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[#142d1b] border border-[#275331] shadow-xl mb-4">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-emerald-400/40">
              <Image
                src="/images/logo-badge.png"
                alt="Arboveya Emblem"
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-bold tracking-[0.25em] text-emerald-400 uppercase">
              Restricted Portal
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Dispensary Administration
          </h1>
          <p className="text-xs text-stone-400 mt-1.5 max-w-xs mx-auto">
            Authorized store operators, catalog moderators, and dispensary managers only.
          </p>
        </div>

        {/* Notice: No Sign-Up for Admin */}
        <div className="mb-6 p-3.5 rounded-xl bg-[#162e1e] border border-[#2b5936] text-xs text-emerald-200/90 flex items-start gap-2.5 shadow-sm">
          <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-emerald-300">Self-registration is disabled</p>
            <p className="text-[11px] text-stone-300">
              Administrative credentials cannot be registered publicly and must be provisioned internally.
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#122417] border border-[#224429] rounded-2xl p-7 sm:p-8 shadow-2xl backdrop-blur-sm">
          
          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-medium flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs font-medium flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Administrator Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@arboveya.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c1910] border border-[#2a4d32] text-white placeholder-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Master Security Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c1910] border border-[#2a4d32] text-white placeholder-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-5 py-3 rounded-xl bg-gradient-to-r from-[#1c4d28] to-[#256635] hover:from-[#235f32] hover:to-[#2c7a40] text-white font-bold text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border border-emerald-500/30"
            >
              <span>{submitting ? 'Verifying Security Session...' : 'Authenticate & Open Dashboard'}</span>
              <ArrowRight className="w-4 h-4 text-emerald-300" />
            </button>
          </form>

          {/* Direct Return to Public Store */}
          <div className="mt-6 pt-5 border-t border-[#1d3a24] text-center text-xs text-stone-400">
            <Link
              href="/"
              className="text-stone-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1 font-medium"
            >
              <span>← Return to Public Store</span>
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
