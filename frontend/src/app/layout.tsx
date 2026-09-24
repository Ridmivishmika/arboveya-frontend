import type { Metadata } from 'next';
import Script from 'next/script';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getSiteSettings } from '@/lib/api';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Arboveya — Nature's Healing, Perfected",
  description: "Premium herbal wellness products crafted from nature's finest ingredients to support a healthier and balanced lifestyle.",
  icons: {
    icon: '/images/logo-badge.png',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteSettings = await getSiteSettings();

  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-white text-[#1a2e20] antialiased">
        <AuthProvider>
        <CartProvider>
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer
          facebookLink={siteSettings.facebookLink}
          whatsAppNumber={siteSettings.whatsAppNumber}
        />
        </CartProvider>
        </AuthProvider>
        <Script
          src="https://www.payhere.lk/lib/payhere.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
