'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface FooterProps {
  facebookLink?: string;
  whatsAppNumber?: string;
}

export default function Footer({
  facebookLink = "https://facebook.com/arboveya",
  whatsAppNumber = "+94 77 123 4567"
}: FooterProps) {
  const pathname = usePathname();
  if (pathname?.startsWith('/seller') || pathname?.startsWith('/buyer') || pathname?.startsWith('/admin')) {
    return null;
  }
  return (
    <footer className="bg-[#142d1a] text-white pt-14 pb-8 border-t border-[#204229]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#254d30]">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-full overflow-hidden border border-white/20">
                <Image
                  src="/images/logo-badge.png"
                  alt="Arboveya Logo"
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              </div>
              <div>
                <span className="font-serif text-2xl font-bold tracking-[0.2em] text-[#f2edd9]">
                  ARBOVEYA
                </span>
                <p className="text-[10px] tracking-[0.15em] text-[#c5a66a] uppercase">
                  Nature&apos;s Healing, Perfected
                </p>
              </div>
            </div>

            <p className="text-sm text-[#b2c8b8] leading-relaxed max-w-sm">
              Dedicated to authentic herbal wellness, crafted from nature&apos;s purest botanical harvests to rejuvenate mind, body, and vitality.
            </p>

            <div className="pt-2 text-xs text-[#a3bda9] space-y-1">
              <p>WhatsApp: <span className="text-white font-medium">{whatsAppNumber}</span></p>
              <p>Facebook: <a href={facebookLink} target="_blank" rel="noopener noreferrer" className="text-[#d8b877] hover:underline">fb.com/arboveya</a></p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-semibold tracking-[0.15em] text-[#e8dfc7] uppercase">
              Explore
            </h4>
            <ul className="space-y-2 text-xs text-[#b0c6b6]">
              <li><Link href="/shop" className="hover:text-white transition-colors">Catalog & Shop</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">Our Philosophy</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Herbal Insights & Blogs</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Care</Link></li>
            </ul>
          </div>

          {/* Wellness Focus */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-semibold tracking-[0.15em] text-[#e8dfc7] uppercase">
              Wellness Needs
            </h4>
            <ul className="space-y-2 text-xs text-[#b0c6b6]">
              <li><Link href="/shop?need=immune-support" className="hover:text-white transition-colors">Immune Support</Link></li>
              <li><Link href="/shop?need=stress-relaxation" className="hover:text-white transition-colors">Stress & Sleep</Link></li>
              <li><Link href="/shop?need=digestive-health" className="hover:text-white transition-colors">Digestive Balance</Link></li>
              <li><Link href="/shop?need=respiratory-health" className="hover:text-white transition-colors">Respiratory Care</Link></li>
            </ul>
          </div>

          {/* Newsletter Form */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-semibold tracking-[0.15em] text-[#e8dfc7] uppercase">
              Stay Connected
            </h4>
            <p className="text-xs text-[#a8c2af] leading-relaxed">
              Receive holistic herbal wisdom and exclusive wellness offers directly.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-3 py-2 text-xs bg-[#1d3d25] border border-[#2f5d3a] rounded-sm text-white placeholder-[#789680] focus:outline-none focus:border-[#d4af37]"
              />
              <button
                type="submit"
                className="w-full py-2 bg-[#2d5c36] hover:bg-[#386e42] text-[#f4efe0] text-xs font-bold tracking-[0.12em] rounded-sm transition-colors uppercase"
              >
                Subscribe
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#7e9984] gap-4">
          <p>© {new Date().getFullYear()} Arboveya. All Rights Reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white">Terms of Service</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}

