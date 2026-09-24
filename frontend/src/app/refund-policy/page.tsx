import { Metadata } from 'next';
import Link from 'next/link';
import { RotateCcw, PackageCheck, AlertCircle, ArrowLeft, Clock, Truck, HelpCircle, CheckCircle2, DollarSign } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Refund & Return Policy | Arboveya Herbal Apothecary',
  description: 'Understand Arboveya 30-day refund, return, and replacement policy for pure botanical products, teas, oils, and remedies.',
};

export default function RefundPolicyPage() {
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
            <RotateCcw className="w-3.5 h-3.5" />
            Customer Satisfaction Guarantee
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#f7f4ea] mb-4">
            Refund & Return Policy
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
              Thank You for Shopping at Arboveya
            </h2>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
              We value your satisfaction and strive to provide you with the best online botanical shopping experience possible. If, for any reason, you are not completely satisfied with your purchase, we are here to help.
            </p>
          </div>

          {/* Returns */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#eaf3eb] text-[#1c3f24] flex items-center justify-center border border-[#cbe2cd]">
                <PackageCheck className="w-4 h-4" />
              </span>
              <h3 className="font-serif text-lg font-bold text-[#1c3f24]">
                1. Returns
              </h3>
            </div>
            <div className="pl-11 space-y-3 text-stone-600 text-sm sm:text-base leading-relaxed">
              <p>
                We accept returns within <strong className="text-stone-800">30 days</strong> from the date of purchase.
              </p>
              <div className="p-4 rounded-xl bg-[#f8faf8] border border-[#e2ece2] space-y-2">
                <p className="font-semibold text-[#1c3f24] text-xs sm:text-sm uppercase tracking-wider">
                  Eligibility Criteria for Returns:
                </p>
                <ul className="space-y-1.5 text-xs sm:text-sm text-stone-700 list-disc pl-5">
                  <li>Your item must be unused, unadulterated, and in the same condition that you received it.</li>
                  <li>The item must be in its original packaging with safety seals intact.</li>
                  <li>A proof of purchase or order confirmation number must be provided.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Refunds */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#eaf3eb] text-[#1c3f24] flex items-center justify-center border border-[#cbe2cd]">
                <DollarSign className="w-4 h-4" />
              </span>
              <h3 className="font-serif text-lg font-bold text-[#1c3f24]">
                2. Refunds
              </h3>
            </div>
            <div className="pl-11 space-y-3 text-stone-600 text-sm sm:text-base leading-relaxed">
              <p>
                Once we receive your return and inspect the item, we will notify you by email of the status of your refund.
              </p>
              <p>
                If your return is approved, we will initiate a refund to your original method of payment (credit/debit card or PayPal). Please note that the refund amount will <strong className="text-stone-800">exclude any shipping charges</strong> incurred during the initial purchase.
              </p>
            </div>
          </section>

          {/* Exchanges */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#eaf3eb] text-[#1c3f24] flex items-center justify-center border border-[#cbe2cd]">
                <RotateCcw className="w-4 h-4" />
              </span>
              <h3 className="font-serif text-lg font-bold text-[#1c3f24]">
                3. Exchanges
              </h3>
            </div>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed pl-11">
              If you would like to exchange your item for a different size, blend, or style, please contact our customer support team within <strong className="text-stone-800">30 days</strong> of receiving your order. We will provide you with further instructions on how to proceed with the exchange.
            </p>
          </section>

          {/* Non-Returnable Items */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200">
                <AlertCircle className="w-4 h-4" />
              </span>
              <h3 className="font-serif text-lg font-bold text-[#1c3f24]">
                4. Non-Returnable Items
              </h3>
            </div>
            <div className="pl-11 space-y-3 text-stone-600 text-sm sm:text-base leading-relaxed">
              <p>Certain items are non-returnable and non-refundable for hygiene, safety, and regulatory compliance reasons:</p>
              <ul className="space-y-2 pl-5 list-disc text-stone-700">
                <li><strong className="text-stone-800">Gift cards</strong> or digital vouchers.</li>
                <li><strong className="text-stone-800">Downloadable digital guides</strong> or wellness lifestyle eBooks.</li>
                <li><strong className="text-stone-800">Personalized or custom-formulated botanical blends</strong> prepared to order.</li>
                <li><strong className="text-stone-800">Perishable goods</strong> and opened herbal infusions or tinctures where safety seals have been broken.</li>
              </ul>
            </div>
          </section>

          {/* Damaged or Defective Items */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#eaf3eb] text-[#1c3f24] flex items-center justify-center border border-[#cbe2cd]">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <h3 className="font-serif text-lg font-bold text-[#1c3f24]">
                5. Damaged or Defective Items
              </h3>
            </div>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed pl-11">
              In the unfortunate event that your botanical package arrives damaged or defective in transit, please contact us immediately upon arrival. We will arrange for an expedited replacement or issue a full refund, depending on your preference and product availability.
            </p>
          </section>

          {/* Return Shipping */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#eaf3eb] text-[#1c3f24] flex items-center justify-center border border-[#cbe2cd]">
                <Truck className="w-4 h-4" />
              </span>
              <h3 className="font-serif text-lg font-bold text-[#1c3f24]">
                6. Return Shipping
              </h3>
            </div>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed pl-11">
              You will be responsible for paying the shipping costs for returning your item unless the return is due to our error (e.g., incorrect item shipped, defective product, or transit breakage). In such cases, we will gladly provide you with a prepaid return shipping label.
            </p>
          </section>

          {/* Processing Time */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#eaf3eb] text-[#1c3f24] flex items-center justify-center border border-[#cbe2cd]">
                <Clock className="w-4 h-4" />
              </span>
              <h3 className="font-serif text-lg font-bold text-[#1c3f24]">
                7. Processing Time
              </h3>
            </div>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed pl-11">
              Refunds and exchanges will be processed within <strong className="text-stone-800">5 to 7 business days</strong> after we receive your returned package at our fulfillment center. Please note that it may take additional time for the credit to post to your statement, depending on your bank or payment provider.
            </p>
          </section>

          {/* Contact Us */}
          <div className="mt-10 p-6 rounded-xl bg-[#f4f8f4] border border-[#d2e5d5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-serif text-base font-bold text-[#1c3f24]">
                Need Help with a Return or Refund?
              </h4>
              <p className="text-xs sm:text-sm text-[#4d6652]">
                Our apothecary customer support team is here to assist you and ensure your shopping experience is pleasant and worry-free.
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
              <Link href="/privacy-policy" className="text-[#1c3f24] hover:underline font-semibold">
                Privacy Policy →
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
