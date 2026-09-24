import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Shield, ArrowLeft, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms and Conditions | Arboveya Herbal Apothecary',
  description: 'Review the official terms and conditions governing the use of Arboveya online apothecary, order placements, and botanical wellness services.',
};

export default function TermsAndConditionsPage() {
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
            <Shield className="w-3.5 h-3.5" />
            Legal Agreement
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#f7f4ea] mb-4">
            Terms & Conditions
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
              Welcome to Arboveya
            </h2>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
              These Terms and Conditions govern your use of our website (<strong className="text-stone-800 font-semibold">Arboveya</strong>) and the purchase and sale of products from our platform. By accessing and using our website, you agree to comply with these terms. Please read them carefully before proceeding with any transactions.
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-[#eaf3eb] text-[#1c3f24] font-bold text-xs flex items-center justify-center border border-[#cbe2cd]">
                1
              </span>
              <h3 className="font-serif text-lg font-bold text-[#1c3f24]">
                Use of the Website
              </h3>
            </div>
            <ul className="space-y-2.5 text-stone-600 text-sm sm:text-base leading-relaxed pl-10 list-disc">
              <li>
                <strong className="text-stone-800">Age Requirement:</strong> You must be at least 18 years old to use our website, register an account, or make purchases.
              </li>
              <li>
                <strong className="text-stone-800">Account Confidentiality:</strong> You are responsible for maintaining the confidentiality of your account credentials, including your username and password, and for restricting access to your computer or mobile devices.
              </li>
              <li>
                <strong className="text-stone-800">Accurate Information:</strong> You agree to provide accurate, true, and current information during the registration and checkout process.
              </li>
              <li>
                <strong className="text-stone-800">Lawful Purpose:</strong> You may not use our website for any unlawful, fraudulent, or unauthorized purposes, nor violate any laws in your jurisdiction.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-[#eaf3eb] text-[#1c3f24] font-bold text-xs flex items-center justify-center border border-[#cbe2cd]">
                2
              </span>
              <h3 className="font-serif text-lg font-bold text-[#1c3f24]">
                Product Information and Pricing
              </h3>
            </div>
            <ul className="space-y-2.5 text-stone-600 text-sm sm:text-base leading-relaxed pl-10 list-disc">
              <li>
                We strive to provide accurate botanical descriptions, batch images, origins, and pricing information. However, we do not warrant or guarantee that product descriptions or other content are entirely error-free, complete, or current.
              </li>
              <li>
                Prices for all botanical herbs, oils, teas, and accessories are subject to change without notice. Any seasonal promotions, coupons, or discounts are valid for a limited time and may be subject to specific additional terms.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-[#eaf3eb] text-[#1c3f24] font-bold text-xs flex items-center justify-center border border-[#cbe2cd]">
                3
              </span>
              <h3 className="font-serif text-lg font-bold text-[#1c3f24]">
                Orders and Payments
              </h3>
            </div>
            <ul className="space-y-2.5 text-stone-600 text-sm sm:text-base leading-relaxed pl-10 list-disc">
              <li>
                <strong className="text-stone-800">Offer to Purchase:</strong> By placing an order on our website, you are making an offer to purchase the selected products subject to these terms.
              </li>
              <li>
                <strong className="text-stone-800">Order Cancellation Rights:</strong> We reserve the right to refuse or cancel any order for any reason, including but not limited to product availability, errors in pricing or product descriptions, or suspected fraudulent activity.
              </li>
              <li>
                <strong className="text-stone-800">Payment Authorization:</strong> You agree to provide valid and up-to-date payment information and authorize Arboveya to charge the total order amount, including applicable taxes and delivery fees, to your chosen payment method.
              </li>
              <li>
                <strong className="text-stone-800">Payment Processors:</strong> We use trusted third-party payment gateways (e.g., Stripe, PayHere) to handle your transactions securely under 256-bit SSL encryption. Arboveya does not store or have access to your full credit/debit card numbers.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-[#eaf3eb] text-[#1c3f24] font-bold text-xs flex items-center justify-center border border-[#cbe2cd]">
                4
              </span>
              <h3 className="font-serif text-lg font-bold text-[#1c3f24]">
                Shipping and Delivery
              </h3>
            </div>
            <ul className="space-y-2.5 text-stone-600 text-sm sm:text-base leading-relaxed pl-10 list-disc">
              <li>
                We will make reasonable efforts to ensure timely processing, packaging, and dispatch of your botanical wellness orders.
              </li>
              <li>
                Shipping and delivery windows provided during checkout are estimates and may vary based on courier schedules, customs clearance, adverse weather, or regional delivery conditions.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-[#eaf3eb] text-[#1c3f24] font-bold text-xs flex items-center justify-center border border-[#cbe2cd]">
                5
              </span>
              <h3 className="font-serif text-lg font-bold text-[#1c3f24]">
                Returns and Refunds
              </h3>
            </div>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed pl-10">
              Our dedicated{' '}
              <Link href="/refund-policy" className="text-[#1c3f24] font-semibold underline hover:text-[#2d5c36]">
                Refund Policy
              </Link>{' '}
              governs the process, conditions, and eligibility for returning products and seeking refunds or exchanges. Please review our Refund Policy for complete guidelines.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-[#eaf3eb] text-[#1c3f24] font-bold text-xs flex items-center justify-center border border-[#cbe2cd]">
                6
              </span>
              <h3 className="font-serif text-lg font-bold text-[#1c3f24]">
                Intellectual Property
              </h3>
            </div>
            <ul className="space-y-2.5 text-stone-600 text-sm sm:text-base leading-relaxed pl-10 list-disc">
              <li>
                All content, imagery, logos, graphics, botanical articles, formulas, and digital materials on Arboveya are protected by intellectual property rights and remain the exclusive property of Arboveya or its licensors.
              </li>
              <li>
                You may not use, copy, reproduce, republish, distribute, or modify any content from our platform without our prior written consent.
              </li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-[#eaf3eb] text-[#1c3f24] font-bold text-xs flex items-center justify-center border border-[#cbe2cd]">
                7
              </span>
              <h3 className="font-serif text-lg font-bold text-[#1c3f24]">
                Limitation of Liability
              </h3>
            </div>
            <ul className="space-y-2.5 text-stone-600 text-sm sm:text-base leading-relaxed pl-10 list-disc">
              <li>
                In no event shall Arboveya, its directors, employees, herbalists, or affiliates be liable for any direct, indirect, incidental, special, or consequential damages arising out of or in connection with your use of our website or the purchase and use of our herbal products.
              </li>
              <li>
                We make no warranties or representations, express or implied, regarding specific medical cures or therapeutic guarantees. Botanical items are wellness supplements and should not replace professional medical advice.
              </li>
            </ul>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-[#eaf3eb] text-[#1c3f24] font-bold text-xs flex items-center justify-center border border-[#cbe2cd]">
                8
              </span>
              <h3 className="font-serif text-lg font-bold text-[#1c3f24]">
                Amendments and Termination
              </h3>
            </div>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed pl-10">
              We reserve the right to modify, update, or terminate these Terms and Conditions at any time without prior notice. Any updates will become effective immediately upon posting to this page. It is your responsibility to review these terms periodically for any changes.
            </p>
          </section>

          {/* Contact Box */}
          <div className="mt-10 p-6 rounded-xl bg-[#f4f8f4] border border-[#d2e5d5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-serif text-base font-bold text-[#1c3f24]">
                Questions about our Terms?
              </h4>
              <p className="text-xs sm:text-sm text-[#4d6652]">
                Our customer care and botanical apothecary team is always here to assist you.
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
              <Link href="/privacy-policy" className="text-[#1c3f24] hover:underline font-semibold">
                Privacy Policy →
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
