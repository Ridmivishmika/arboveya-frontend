'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Mail, Phone, MapPin, MessageCircle, ExternalLink } from 'lucide-react';

interface FooterProps {
  facebookLink?: string;
  whatsAppNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export default function Footer({
  facebookLink = "https://facebook.com/arboveya",
  whatsAppNumber = "+94 70 602 6251",
  email = "arboveya@gmail.com",
  phone = "+94 71 798 1355",
  address = "Arboveya, Thalaramba, Matara, Sri Lanka"
}: FooterProps) {
  const pathname = usePathname();
  if (pathname?.startsWith('/seller') || pathname?.startsWith('/buyer') || pathname?.startsWith('/admin')) {
    return null;
  }

  const effectiveFacebook = facebookLink || "https://facebook.com/arboveya";
  const effectiveWhatsApp = whatsAppNumber || "+94 70 602 6251";
  const cleanWhatsAppDigits = effectiveWhatsApp.replace(/[^0-9]/g, '');
  const cleanPhoneDigits = (phone || '').replace(/[^0-9]/g, '');

  return (
    <footer className="bg-[#142d1a] text-white pt-14 pb-8 border-t border-[#204229]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#254d30]">

          {/* Brand Info & Interactive Contact Links */}
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
                <p className="text-[10px] tracking-[0.15em] text-[#c5a66a] uppercase font-semibold">
                  Nature&apos;s Healing, Perfected
                </p>
              </div>
            </div>

            <p className="text-sm text-[#b2c8b8] leading-relaxed max-w-sm">
              Dedicated to authentic herbal wellness, crafted from nature&apos;s purest botanical harvests to rejuvenate mind, body, and vitality.
            </p>

            {/* Direct Connect & Social Links: Facebook, WhatsApp, Phone, Email */}
            <div className="pt-2 space-y-2 text-xs">

              {/* Follow us on Facebook */}
              <div>
                <a
                  href={effectiveFacebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-[#1c3f24] hover:bg-[#254d30] border border-[#2e5936] text-[#e8dfc7] hover:text-white transition-all shadow-xs group w-full sm:w-auto"
                >
                  <svg className="w-4 h-4 fill-[#1877F2] bg-white rounded-full p-0.5 flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span className="font-medium">Follow us on Facebook</span>
                  <ExternalLink className="w-3 h-3 text-[#7e9984] group-hover:text-white transition-colors ml-auto sm:ml-1" />
                </a>
              </div>

              {/* Chat on WhatsApp */}
              <div>
                <a
                  href={`https://wa.me/${cleanWhatsAppDigits || '94706026251'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-[#1c3f24] hover:bg-[#254d30] border border-[#2e5936] text-[#e8dfc7] hover:text-white transition-all shadow-xs group w-full sm:w-auto"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366] flex-shrink-0" />
                  <span className="font-medium">
                    Chat on WhatsApp: <span className="text-white font-semibold">{effectiveWhatsApp}</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-[#7e9984] group-hover:text-white transition-colors ml-auto sm:ml-1" />
                </a>
              </div>

              {/* Call Us Phone */}
              <div>
                <a
                  href={`tel:${cleanPhoneDigits ? `+${cleanPhoneDigits}` : '+94717981355'}`}
                  className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-[#1c3f24] hover:bg-[#254d30] border border-[#2e5936] text-[#e8dfc7] hover:text-white transition-all shadow-xs group w-full sm:w-auto"
                >
                  <Phone className="w-4 h-4 text-[#c5a66a] flex-shrink-0" />
                  <span className="font-medium">
                    Call Us: <span className="text-white font-semibold">{phone}</span>
                  </span>
                </a>
              </div>

              {/* Email Us */}
              <div>
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-[#1c3f24] hover:bg-[#254d30] border border-[#2e5936] text-[#e8dfc7] hover:text-white transition-all shadow-xs group w-full sm:w-auto"
                >
                  <Mail className="w-4 h-4 text-[#c5a66a] flex-shrink-0" />
                  <span className="font-medium">
                    Email Us: <span className="text-white font-semibold">{email}</span>
                  </span>
                </a>
              </div>

              {/* Botanical Sanctuary Address */}
              <div className="flex items-start gap-2.5 pt-1.5 text-xs text-[#a3bda9]">
                <MapPin className="w-4 h-4 text-[#c5a66a] flex-shrink-0 mt-0.5" />
                <span className="text-[#b2c8b8] leading-relaxed">
                  {address}
                </span>
              </div>

            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-semibold tracking-[0.15em] text-[#e8dfc7] uppercase">
              Explore
            </h4>
            <ul className="space-y-2 text-xs text-[#b0c6b6]">
              <li><Link href="/shop" className="hover:text-white transition-colors">Shop</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blogs</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-white transition-colors font-medium text-[#d8e5db]">Privacy Policy</Link></li>
              <li><Link href="/terms-and-conditions" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
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
          {/* <div className="space-y-3">
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
                className="w-full py-2 bg-[#2d5c36] hover:bg-[#386e42] text-[#f4efe0] text-xs font-bold tracking-[0.12em] rounded-sm transition-colors uppercase cursor-pointer"
              >
                Subscribe
              </button>
            </form>
          </div> */}

        </div>

        {/* Bottom Copyright, Powered by Vian Tech & Policies */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-[#8da894] gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <p>© {new Date().getFullYear()} Arboveya. All Rights Reserved.</p>
            <span className="hidden sm:inline text-[#2d5236]">•</span>
            <p className="text-[#a3bda9]">
              Powered by <span className="font-semibold text-[#e8dfc7] tracking-wide">Vian Tech</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/privacy-policy" className="hover:text-white transition-colors font-medium text-[#d8e5db]">Privacy Policy</Link>
            <span className="text-[#2d5236]">•</span>
            <Link href="/terms-and-conditions" className="hover:text-white transition-colors">Terms & Conditions</Link>
            <span className="text-[#2d5236]">•</span>
            <Link href="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}


