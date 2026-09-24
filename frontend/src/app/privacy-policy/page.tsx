import { Metadata } from 'next';
import Link from 'next/link';
import { Lock, ShieldCheck, ArrowLeft, Clock, Eye, Database, Share2, Cookie, RefreshCw } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | Arboveya Herbal Apothecary',
  description: 'Learn how Arboveya collects, uses, and protects your personal and transaction data when using our natural herbal store and services.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'September 2026';

  return (
    <div className="min-h-screen bg-[#faf8f4] text-stone-800">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-[#142d1a] via-[#1c3f24] to-[#24492d] text-white py-14 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#8cb896_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#b8d4be] hover:text-white transition-colors mb-6 uppercase tracking-wider"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Arboveya
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-[#c5a66a] text-xs font-medium uppercase tracking-widest mb-4">
            <Lock className="w-3.5 h-3.5" />
            Data Protection & Security
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#f7f4ea] mb-4">
            Privacy Policy
          </h1>

          <div className="flex items-center justify-center gap-2 text-xs text-[#a3bda9]">
            <Clock className="w-3.5 h-3.5" />
            <span>Effective Date & Last Updated: {lastUpdated}</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-[#e5ece5] p-6 sm:p-10 md:p-12 space-y-10">
          
          {/* Introduction */}
          <div className="border-b border-[#eef2ee] pb-8">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1c3f24] mb-3">
              Our Commitment to Your Privacy
            </h2>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
              At <strong className="text-stone-800 font-semibold">Arboveya</strong>, we are committed to protecting the privacy and security of our customers&apos; personal information. This Privacy Policy outlines how we collect, use, and safeguard your information when you visit or make a purchase on our website. By using our website, you consent to the practices described in this policy.
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#eaf3eb] text-[#1c3f24] flex items-center justify-center border border-[#cbe2cd]">
                <Database className="w-4 h-4" />
              </span>
              <h3 className="font-serif text-lg font-bold text-[#1c3f24]">
                1. Information We Collect
              </h3>
            </div>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed pl-11">
              When you visit our website, we may collect certain information about you, including:
            </p>
            <ul className="space-y-2.5 text-stone-600 text-sm sm:text-base leading-relaxed pl-16 list-disc">
              <li>
                <strong className="text-stone-800">Personal Identification Information:</strong> Such as your name, email address, physical delivery address, and phone number, provided voluntarily by you during the registration or checkout process.
              </li>
              <li>
                <strong className="text-stone-800">Payment and Billing Information:</strong> Necessary to process your orders, including billing addresses and transaction IDs. Sensitive card details are securely handled directly by trusted third-party payment processors (Stripe / PayHere) via encrypted tokens.
              </li>
              <li>
                <strong className="text-stone-800">Browsing and Technical Information:</strong> Such as your IP address, browser type, operating system, and device information, collected automatically using cookies and similar web analytics technologies.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#eaf3eb] text-[#1c3f24] flex items-center justify-center border border-[#cbe2cd]">
                <Eye className="w-4 h-4" />
              </span>
              <h3 className="font-serif text-lg font-bold text-[#1c3f24]">
                2. Use of Information
              </h3>
            </div>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed pl-11">
              We may use the collected information for the following legitimate purposes:
            </p>
            <ul className="space-y-2.5 text-stone-600 text-sm sm:text-base leading-relaxed pl-16 list-disc">
              <li>To process and fulfill your botanical orders, including packaging, invoice generation, shipping, and delivery tracking.</li>
              <li>To communicate with you regarding your purchases, provide customer support, and respond to your herbal health inquiries or requests.</li>
              <li>To personalize your shopping experience and present relevant botanical wellness recommendations and special apothecary promotions.</li>
              <li>To improve our website navigation, product catalog, and dispensary services based on your browsing patterns and feedback.</li>
              <li>To detect and prevent fraudulent transactions, unauthorized access, and abuse of our platform.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#eaf3eb] text-[#1c3f24] flex items-center justify-center border border-[#cbe2cd]">
                <Share2 className="w-4 h-4" />
              </span>
              <h3 className="font-serif text-lg font-bold text-[#1c3f24]">
                3. Information Sharing
              </h3>
            </div>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed pl-11">
              We deeply respect your privacy and <strong className="text-stone-800">do not sell, rent, trade, or otherwise transfer</strong> your personal information to third parties for marketing purposes. We only share information in the following limited circumstances:
            </p>
            <ul className="space-y-2.5 text-stone-600 text-sm sm:text-base leading-relaxed pl-16 list-disc">
              <li>
                <strong className="text-stone-800">Trusted Service Providers:</strong> We share necessary details with trusted partners who assist us in operating our website, processing secure payments, and delivering your packages (e.g. shipping carriers and courier services). These providers are contractually obligated to handle your data securely and strictly confidentially.
              </li>
              <li>
                <strong className="text-stone-800">Legal Requirements:</strong> We may disclose your information if required to do so by applicable law, court subpoenas, or in response to lawful regulatory requests.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#eaf3eb] text-[#1c3f24] flex items-center justify-center border border-[#cbe2cd]">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <h3 className="font-serif text-lg font-bold text-[#1c3f24]">
                4. Data Security
              </h3>
            </div>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed pl-11">
              We implement industry-standard technical and physical security measures, including 256-bit SSL encryption and strict server access controls, to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, please be aware that no transmission over the internet or electronic storage method is guaranteed to be 100% immune from risks, and we cannot guarantee absolute absolute immunity.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#eaf3eb] text-[#1c3f24] flex items-center justify-center border border-[#cbe2cd]">
                <Cookie className="w-4 h-4" />
              </span>
              <h3 className="font-serif text-lg font-bold text-[#1c3f24]">
                5. Cookies and Tracking Technologies
              </h3>
            </div>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed pl-11">
              We use cookies and similar technologies to enhance your browsing experience, keep your botanical cart active, analyze website traffic, and remember your preferences. You have the option to disable cookies through your individual browser settings; however, disabling them may limit some functional aspects and checkout features of our website.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#eaf3eb] text-[#1c3f24] flex items-center justify-center border border-[#cbe2cd]">
                <RefreshCw className="w-4 h-4" />
              </span>
              <h3 className="font-serif text-lg font-bold text-[#1c3f24]">
                6. Changes to This Privacy Policy
              </h3>
            </div>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed pl-11">
              We reserve the right to update or modify this Privacy Policy at any time. Any changes will be posted on this page with a revised &quot;last updated&quot; date. We encourage you to review this Privacy Policy periodically to stay informed about how we collect, use, and protect your information.
            </p>
          </section>

          {/* Contact Box */}
          <div className="mt-10 p-6 rounded-xl bg-[#f4f8f4] border border-[#d2e5d5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-serif text-base font-bold text-[#1c3f24]">
                Privacy Questions or Data Requests?
              </h4>
              <p className="text-xs sm:text-sm text-[#4d6652]">
                Contact our privacy compliance and data protection officer at any time.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#24492d] hover:bg-[#1a3821] text-white text-xs font-bold tracking-wider uppercase transition-colors shrink-0 shadow-sm"
            >
              Contact Support
            </Link>
          </div>

          {/* Related Policy Links */}
          <div className="pt-6 border-t border-[#eef2ee] flex flex-wrap items-center justify-between gap-4 text-xs text-stone-500">
            <span>Also review our related policies:</span>
            <div className="flex gap-4">
              <Link href="/terms-and-conditions" className="text-[#1c3f24] hover:underline font-semibold">
                Terms & Conditions →
              </Link>
              <Link href="/refund-policy" className="text-[#1c3f24] hover:underline font-semibold">
                Refund Policy →
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
