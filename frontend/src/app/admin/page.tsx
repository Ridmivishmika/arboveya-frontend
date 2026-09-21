'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function AdminRootPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (user && user.role === 'Admin') {
      router.replace('/admin/products');
    } else {
      router.replace('/admin/login');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[#112417] flex flex-col items-center justify-center p-4 text-white">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#1c3f24] border border-[#2e5d38] flex items-center justify-center shadow-lg">
          <ShieldCheck className="w-7 h-7 text-emerald-400" />
        </div>
        <div>
          <h1 className="font-serif text-lg font-bold tracking-wider uppercase text-emerald-100">
            Arboveya Administration Portal
          </h1>
          <p className="text-xs text-stone-400 mt-1">Verifying administrator security session...</p>
        </div>
        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin mt-2" />
      </div>
    </div>
  );
}
