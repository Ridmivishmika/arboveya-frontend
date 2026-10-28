'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';

interface FooterProps {
  facebookLink?: string;
  whatsAppNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export default function Footer({
  facebookLink,
  whatsAppNumber,
  email,
  phone,
  address
}: FooterProps) {
  const pathname = usePathname();
  if (pathname?.startsWith('/seller') || pathname?.startsWith('/buyer') || pathname?.startsWith('/admin')) {
    return null;
  }

  const effectiveFacebook = facebookLink || process.env.NEXT_PUBLIC_FACEBOOK_LINK || "https://facebook.com";
  const effectiveWhatsApp = whatsAppNumber || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || process.env.NEXT_PUBLIC_CONTACT_PHONE || "";
  const effectivePhone = phone || process.env.NEXT_PUBLIC_CONTACT_PHONE || "";
  const effectiveEmail = email || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "arboveya@gmail.com";
  const effectiveAddress = address || process.env.NEXT_PUBLIC_CONTACT_ADDRESS || "Sri Lanka";

  // WhatsApp wa.me link requires country code (94 for Sri Lanka without leading zero)
  const cleanDigits = effectiveWhatsApp.replace(/[^0-9]/g, '');
  const waLinkDigits = cleanDigits.startsWith('0')
    ? `94${cleanDigits.substring(1)}`
    : cleanDigits.startsWith('94')
      ? cleanDigits
      : `94${cleanDigits}`;

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

            {/* Direct Connect & Social Icons: Facebook, WhatsApp, Phone, Email */}
            <div className="pt-2">
              <div className="flex items-center gap-3">
                {/* Facebook Logo */}
                <a
                  href={effectiveFacebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#1c3f24] hover:bg-[#254d30] border border-[#2e5936] hover:border-[#427b4d] flex items-center justify-center text-[#e8dfc7] hover:text-white transition-all shadow-xs hover:scale-110 group cursor-pointer"
                  aria-label="Facebook"
                  title="Follow Arboveya on Facebook"
                >
                  <svg className="w-4 h-4 fill-current group-hover:text-[#1877F2] transition-colors" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>

                {/* WhatsApp Logo */}
                <a
                  href={`https://wa.me/${waLinkDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#1c3f24] hover:bg-[#254d30] border border-[#2e5936] hover:border-[#427b4d] flex items-center justify-center text-[#e8dfc7] hover:text-white transition-all shadow-xs hover:scale-110 group cursor-pointer"
                  aria-label="WhatsApp"
                  title={`Chat with Arboveya on WhatsApp (${effectiveWhatsApp})`}
                >
                  <MessageCircle className="w-4 h-4 group-hover:text-[#25D366] transition-colors" />
                </a>

                {/* Call Phone Logo */}
                {effectivePhone && (
                  <a
                    href={`tel:${effectivePhone.replace(/[^0-9+]/g, '')}`}
                    className="w-10 h-10 rounded-full bg-[#1c3f24] hover:bg-[#254d30] border border-[#2e5936] hover:border-[#427b4d] flex items-center justify-center text-[#e8dfc7] hover:text-white transition-all shadow-xs hover:scale-110 group cursor-pointer"
                    aria-label="Phone"
                    title={`Call Us: ${effectivePhone}`}
                  >
                    <Phone className="w-4 h-4 group-hover:text-[#c5a66a] transition-colors" />
                  </a>
                )}

                {/* Email Logo */}
                {effectiveEmail && (
                  <a
                    href={`mailto:${effectiveEmail}`}
                    className="w-10 h-10 rounded-full bg-[#1c3f24] hover:bg-[#254d30] border border-[#2e5936] hover:border-[#427b4d] flex items-center justify-center text-[#e8dfc7] hover:text-white transition-all shadow-xs hover:scale-110 group cursor-pointer"
                    aria-label="Email"
                    title={`Email Us: ${effectiveEmail}`}
                  >
                    <Mail className="w-4 h-4 group-hover:text-[#c5a66a] transition-colors" />
                  </a>
                )}
              </div>

              {/* Botanical Sanctuary Address */}
              <div className="flex items-start gap-2 pt-3 text-xs text-[#a3bda9]">
                <MapPin className="w-3.5 h-3.5 text-[#c5a66a] flex-shrink-0 mt-0.5" />
                <span className="text-[#b2c8b8] leading-relaxed">
                  {effectiveAddress}
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
              <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
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

        </div>

        {/* Bottom Copyright, Powered by Vian Tech & Policies */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-[#8da894] gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <p>© {new Date().getFullYear()} Arboveya. All Rights Reserved.</p>
            <span className="hidden sm:inline text-[#2d5236]">•</span>
            <p className="text-[#a3bda9]">
              Powered by{" "}
              <a
                href="https://www.vian-tech.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#e8dfc7] hover:text-white transition-colors"
              >
                Vian Tech
              </a>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
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


