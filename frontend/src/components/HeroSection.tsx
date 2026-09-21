'use client';

import React from 'react';
import Link from 'next/link';
import { Leaf } from 'lucide-react';

interface HeroSectionProps {
  heroText?: string;
  description?: string;
}

export default function HeroSection({
  description = "Premium herbal wellness products crafted from nature's finest ingredients to support a healthier and balanced lifestyle."
}: HeroSectionProps) {
  return (
    <section className="relative w-full overflow-hidden bg-[#eef3ec] bg-[url('/images/hero-banner-hd.jpg')] bg-cover bg-[center_right] sm:bg-right md:bg-center bg-no-repeat border-b border-[#254728]">
      
      {/* Mobile readability overlay */}
      <div className="md:hidden absolute inset-0 bg-white/60 backdrop-blur-[1px] z-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-md sm:max-w-lg py-14 sm:py-20 md:py-24 lg:py-28">
          
          {/* Pure Botanicals Tag */}
          <div className="inline-flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-xs border border-[#24492d]/20 text-[#17381f] text-xs font-medium shadow-2xs">
            <Leaf className="w-3.5 h-3.5 text-[#24492d]" />
            <span>100% Pure & Ethical Botanical Formulations</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-[54px] font-normal text-[#17381f] leading-[1.12] tracking-tight mb-4">
            Nature&apos;s<br />
            Healing, Perfected
          </h1>

          <p className="text-[#3b4d40] text-sm sm:text-base leading-relaxed max-w-[360px] font-normal mb-7">
            {description}
          </p>

          <div className="flex items-center gap-3.5">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-7 py-3 bg-[#24492d] hover:bg-[#1a3821] text-white text-xs font-semibold tracking-[0.14em] rounded-[3px] shadow-sm uppercase transition-all duration-200 active:scale-98"
            >
              SHOP NOW
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center px-7 py-3 bg-white/80 md:bg-transparent hover:bg-[#24492d]/5 border border-[#24492d] text-[#24492d] text-xs font-semibold tracking-[0.14em] rounded-[3px] uppercase transition-all duration-200"
            >
              LEARN MORE
            </Link>
          </div>

        </div>
      </div>

    </section>
  );
}