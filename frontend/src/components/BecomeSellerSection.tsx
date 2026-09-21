'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Store, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Leaf, Package } from 'lucide-react';

export default function BecomeSellerSection() {
  const { user } = useAuth();

  const sellerDestination = user?.role === 'Seller' 
    ? '/seller' 
    : '/register?role=Seller&redirect=/seller';

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-[#f4f7f4] to-[#edf3ed] border-y border-[#dbe6dc] relative overflow-hidden">
      {/* Subtle leaf ambient background marks */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#2E4D38]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-[#2E4D38]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-white rounded-3xl border border-[#d6e3d7] shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Decorative & Visual Panel */}
          <div className="lg:col-span-5 bg-[#1f3d27] text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.15),transparent_70%)] pointer-events-none" />
            
            <div>
              {/* Feature Icon Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#a3e6b5] text-xs font-bold tracking-wider uppercase mb-6 shadow-inner">
                <Store className="w-4 h-4 text-[#a3e6b5]" />
                <span>Become a Seller</span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-snug tracking-tight mb-4 text-white">
                Share Your Botanical Harvest with the World
              </h2>

              <p className="text-sm text-[#c5d8c8] leading-relaxed mb-6 font-normal">
                Join Arboveya’s certified botanical marketplace. Whether you craft artisanal herbal teas, cold-pressed botanical oils, or organic tinctures, our platform connects you with wellness seekers looking for authenticity.
              </p>
            </div>

            {/* Quick stats / Highlights */}
            <div className="pt-6 border-t border-white/15 grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-bold text-lg text-white font-serif">100%</p>
                <p className="text-[#a8c2ab]">Curated Herbal Focus</p>
              </div>
              <div>
                <p className="font-bold text-lg text-white font-serif">Instant</p>
                <p className="text-[#a8c2ab]">Product Add Dashboard</p>
              </div>
            </div>
          </div>

          {/* Right Action & Benefits Panel */}
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#edf5ee] text-[#24492d] flex items-center justify-center shadow-xs">
                  <Leaf className="w-5 h-5 text-[#2E4D38]" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#1c3f24]">
                    Dedicated Seller Experience
                  </h3>
                  <p className="text-xs text-stone-500">
                    Built specifically for botanical producers and herbal craftsmen
                  </p>
                </div>
              </div>

              {/* Benefits Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#f8faf8] border border-[#e3ede3]">
                  <CheckCircle2 className="w-5 h-5 text-[#2E4D38] flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-[#1c3f24]">Product Add Dashboard</p>
                    <p className="text-stone-500 mt-0.5">Submit new botanical products, set prices, stock counts, and herbal benefits.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#f8faf8] border border-[#e3ede3]">
                  <CheckCircle2 className="w-5 h-5 text-[#2E4D38] flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-[#1c3f24]">Direct Customer Reach</p>
                    <p className="text-stone-500 mt-0.5">Reach health-conscious buyers actively seeking authentic Ayurvedic and herbal items.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#f8faf8] border border-[#e3ede3]">
                  <CheckCircle2 className="w-5 h-5 text-[#2E4D38] flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-[#1c3f24]">Transparent Admin Approval</p>
                    <p className="text-stone-500 mt-0.5">Real-time status tracking for every submitted product with direct feedback.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#f8faf8] border border-[#e3ede3]">
                  <CheckCircle2 className="w-5 h-5 text-[#2E4D38] flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-[#1c3f24]">Verified Artisan Badge</p>
                    <p className="text-stone-500 mt-0.5">Build trust with customers through certified herbal vendor credentials.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-8 mt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center gap-4">
              <Link
                href={sellerDestination}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#24492d] hover:bg-[#1a3821] text-white text-xs font-bold tracking-[0.12em] uppercase shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
              >
                <Store className="w-4 h-4 text-[#a3e6b5] group-hover:scale-110 transition-transform" />
                <span>Become a Seller</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/login?role=Seller&redirect=/seller"
                className="text-xs font-bold text-[#2E4D38] hover:underline py-2"
              >
                Already a seller? Log in here &rarr;
              </Link>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
