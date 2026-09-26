'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Store,
  UserCheck,
  HelpCircle,
  Sparkles,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { submitContactMessage } from '@/lib/api';
import { SiteSettings } from '@/types';

interface ContactClientProps {
  initialSettings?: SiteSettings;
}

export default function ContactClient({ initialSettings }: ContactClientProps) {
  const { user, token } = useAuth();

  // Role Selection ('Buyer' | 'Seller' | 'General')
  const [userType, setUserType] = useState<'Buyer' | 'Seller' | 'General'>('Buyer');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // UI States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedInquiry, setSubmittedInquiry] = useState<any | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Pre-populate fields based on signed-in user
  useEffect(() => {
    if (user) {
      if (!name) {
        setName(user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim());
      }
      if (!email) {
        setEmail(user.email || '');
      }
      if (!phone && user.phoneNumber) {
        setPhone(user.phoneNumber);
      }
      if (user.role === 'Seller') {
        setUserType('Seller');
      } else if (user.role === 'Customer') {
        setUserType('Buyer');
      }
    }
  }, [user]);

  // Topic Options tailored to selected role
  const topicOptions = userType === 'Buyer'
    ? [
      'Order Tracking & Delivery Status',
      'Botanical Guidance & Product Recommendation',
      'Ingredient Purity & Allergy Advice',
      'Returns, Exchanges & Guarantee',
      'General Customer Care'
    ]
    : userType === 'Seller'
      ? [
        'Seller Account & Verification Status',
        'Botanical Listing Approval Support',
        'Merchant Commission & Payouts',
        'Packaging & Herbal Compliance Guidelines',
        'Technical Assistance with Seller Studio'
      ]
      : [
        'Wholesale & Bulk Botanical Sourcing',
        'Herbal Partnership Proposal',
        'Brand Collaboration & Press Inquiry',
        'General Feedback & Suggestions'
      ];

  const handleSelectCategory = (cat: string) => {
    setCategory(cat);
    if (!subject || topicOptions.includes(subject)) {
      setSubject(cat);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (!cleanName) {
      setErrorMessage('Please enter your name.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }
    if (!cleanSubject) {
      setErrorMessage('Please select or specify an inquiry subject.');
      return;
    }
    if (!cleanMessage || cleanMessage.length < 10) {
      setErrorMessage('Please provide a detailed message (at least 10 characters).');
      return;
    }

    try {
      setLoading(true);
      const result = await submitContactMessage(
        {
          name: cleanName,
          email: cleanEmail,
          phoneNumber: phone.trim() || undefined,
          userType: userType,
          subject: cleanSubject,
          message: cleanMessage
        },
        token || undefined
      );

      setSubmittedInquiry(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch your inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedInquiry(null);
    setMessage('');
    setSubject('');
    setCategory('');
    setErrorMessage(null);
  };

  const faqs = [
    {
      q: 'How long does it take for Arboveya care specialists to respond?',
      a: 'All inquiries sent through this form are immediately transmitted to our administrative headquarters. Inquiries from both buyers and registered sellers are prioritized and usually answered within 2 to 4 business hours.'
    },
    {
      q: 'I am a Seller. Can I get help with product approvals or documentation?',
      a: 'Yes! Select the "Herbal Seller / Merchant" tab when submitting your message. Our merchant compliance team will inspect your inquiry, review pending listings, and assist with laboratory certifications.'
    },
    {
      q: 'Where do replies go once I submit a message?',
      a: 'Our administrators receive your message directly in our central mailbox. Our staff will reply directly to the email address you provided in the form.'
    },
    {
      q: 'Can sellers purchase products from Arboveya store?',
      a: 'Seller accounts are designated specifically for herbal merchants to list, manage, and distribute authentic remedies. Purchasing products is reserved for customer (buyer) accounts. Sellers can freely inspect all product specifications and customer reviews in preview mode.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8faf8] text-[#1c3f24] selection:bg-[#24492d] selection:text-white pb-20">

      {/* 1. Botanical Header & Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1c3f24] via-[#24492d] to-[#1c3f24] text-white pt-16 pb-24 sm:pt-20 sm:pb-28">
        {/* Subtle decorative background circles */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold uppercase tracking-widest text-emerald-200 mb-6">
            <span>🌿</span>
            <span>Customer & Seller Support Center</span>
            <span>🌿</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            We're Here to Nurture Your Journey
          </h1>

          <p className="text-emerald-100/90 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-light">
            Whether you are a valued customer seeking herbal guidance, an apothecary seller managing products, or a prospective wholesale partner — our administrative team is at your service.
          </p>
        </div>
      </section>

      {/* 2. Main Content Grid (Contact Info Cards + Interactive Form) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Quick Contact Info Cards */}
          <div className="lg:col-span-4 space-y-5">

            {/* Direct Admin Mail Card */}
            <div className="bg-white rounded-2xl p-6 border border-[#e2eae2] shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#edf5ee] text-[#24492d] flex items-center justify-center mb-4">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#1c3f24] mb-1">
                Direct Administrator Desk
              </h3>
              <p className="text-xs text-stone-500 mb-3 leading-relaxed">
                Messages submitted through this portal reach our executive team directly.
              </p>
              <a
                href="mailto:care@arboveya.com"
                className="text-xs font-bold text-[#24492d] hover:underline flex items-center gap-1.5"
              >
                <span>arboveya@gmmail.com</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Hotline & WhatsApp */}
            <div className="bg-white rounded-2xl p-6 border border-[#e2eae2] shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#edf5ee] text-[#24492d] flex items-center justify-center mb-4">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#1c3f24] mb-1">
                Herbal Support Hotline
              </h3>
              <p className="text-xs text-stone-500 mb-3 leading-relaxed">
                Available Monday through Sunday for urgent orders or seller guidance.
              </p>
              <div className="space-y-1">
                <div className="text-xs font-bold text-[#1c3f24]">
                  {initialSettings?.whatsAppNumber || '+1 (800) 456-7890'}
                </div>
                <div className="text-[11px] text-stone-400">
                  Hours: 6:00 AM – 12:00 PM EST
                </div>
              </div>
            </div>

            {/* Apothecary Location */}
            <div className="bg-white rounded-2xl p-6 border border-[#e2eae2] shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#edf5ee] text-[#24492d] flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#1c3f24] mb-1">
                Botanical Sanctuary
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Arboveya Herbal<br />
                Thalaramba<br />
                Matara, Sri Lanka
              </p>
            </div>

            {/* Response Guarantee Badge */}
            <div className="rounded-2xl p-5 bg-[#edf5ee]/70 border border-[#bcd2bf] flex items-start gap-3.5">
              <ShieldCheck className="w-5 h-5 text-[#24492d] flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-[#1c3f24] uppercase tracking-wide">
                  24-Hour Reply Assurance
                </div>
                <div className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                  Every inquiry receives dedicated care from our botanists and platform administrators.
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Contact Form & Submission State */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl p-6 sm:p-10 border border-[#e2eae2] shadow-sm">

              {submittedInquiry ? (
                /* Success Screen State */
                <div className="py-12 px-4 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#15803d] flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>

                  <div className="space-y-2 max-w-lg mx-auto">
                    <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#edf5ee] text-[#24492d]">
                      Inquiry Dispatched
                    </span>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1c3f24]">
                      Thank You, {submittedInquiry.name || 'Friend'}!
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      Your inquiry has been successfully transmitted to the Arboveya Administration mailbox. A confirmation notice was logged and our specialists will reply directly to <strong className="text-[#1c3f24]">{submittedInquiry.email}</strong>.
                    </p>
                  </div>

                  {/* Summary Card */}
                  <div className="max-w-md mx-auto bg-[#fafcfa] border border-[#dce6dc] rounded-xl p-4 text-left text-xs space-y-2.5">
                    <div className="flex justify-between items-center border-b border-[#edf3ed] pb-2">
                      <span className="text-stone-500">Inquiry ID:</span>
                      <span className="font-mono font-bold text-[#1c3f24]">{submittedInquiry.id}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-[#edf3ed] pb-2">
                      <span className="text-stone-500">Sender Category:</span>
                      <span className="font-bold text-[#24492d]">{submittedInquiry.userType} Inquiry</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-[#edf3ed] pb-2">
                      <span className="text-stone-500">Subject:</span>
                      <span className="font-medium text-[#1c3f24] truncate max-w-[200px]">{submittedInquiry.subject}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-stone-500">Status:</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Dispatched to Admin
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={handleResetForm}
                      className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#24492d] hover:bg-[#1a3821] text-white text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer"
                    >
                      Send Another Message
                    </button>
                    <Link
                      href="/shop"
                      className="w-full sm:w-auto px-6 py-3 rounded-lg border border-[#24492d] text-[#24492d] hover:bg-[#edf5ee] text-xs font-bold uppercase tracking-wider transition text-center cursor-pointer"
                    >
                      Return to Botanical Shop
                    </Link>
                  </div>
                </div>
              ) : (
                /* Contact Form */
                <div>
                  <div className="mb-8">
                    <h2 className="font-serif text-2xl font-bold text-[#1c3f24] mb-2">
                      Send a Message to Arboveya
                    </h2>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      Select whether you are a buyer or herbal seller so we can direct your inquiry to the right specialist.
                    </p>
                  </div>

                  {/* Role Selector Tabs (Buyer vs Seller vs General) */}
                  <div className="mb-8">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4b6350] mb-2.5">
                      I am contacting as:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                      {/* Buyer Tab */}
                      <button
                        type="button"
                        onClick={() => {
                          setUserType('Buyer');
                          setCategory('');
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${userType === 'Buyer'
                            ? 'border-[#24492d] bg-[#edf5ee] text-[#1c3f24] ring-2 ring-[#24492d]/20 shadow-xs'
                            : 'border-[#e0eae0] bg-white text-stone-600 hover:border-[#bcd2bf] hover:bg-[#fafcfa]'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-base">🌿</span>
                          {userType === 'Buyer' && (
                            <span className="w-2 h-2 rounded-full bg-[#24492d]" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wide">
                            Buyer / Customer
                          </div>
                          <div className="text-[10px] text-stone-500 mt-0.5">
                            Orders, guidance & botanical care
                          </div>
                        </div>
                      </button>

                      {/* Seller Tab */}
                      <button
                        type="button"
                        onClick={() => {
                          setUserType('Seller');
                          setCategory('');
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${userType === 'Seller'
                            ? 'border-[#24492d] bg-[#edf5ee] text-[#1c3f24] ring-2 ring-[#24492d]/20 shadow-xs'
                            : 'border-[#e0eae0] bg-white text-stone-600 hover:border-[#bcd2bf] hover:bg-[#fafcfa]'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-base">🏪</span>
                          {userType === 'Seller' && (
                            <span className="w-2 h-2 rounded-full bg-[#24492d]" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wide">
                            Herbal Seller
                          </div>
                          <div className="text-[10px] text-stone-500 mt-0.5">
                            Seller account, listings & payouts
                          </div>
                        </div>
                      </button>

                      {/* General / Wholesale Tab */}
                      <button
                        type="button"
                        onClick={() => {
                          setUserType('General');
                          setCategory('');
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${userType === 'General'
                            ? 'border-[#24492d] bg-[#edf5ee] text-[#1c3f24] ring-2 ring-[#24492d]/20 shadow-xs'
                            : 'border-[#e0eae0] bg-white text-stone-600 hover:border-[#bcd2bf] hover:bg-[#fafcfa]'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-base">✉️</span>
                          {userType === 'General' && (
                            <span className="w-2 h-2 rounded-full bg-[#24492d]" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wide">
                            General Inquiry
                          </div>
                          <div className="text-[10px] text-stone-500 mt-0.5">
                            Wholesale, herbs & partnerships
                          </div>
                        </div>
                      </button>

                    </div>
                  </div>

                  {/* Form Submission */}
                  <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Error Banner */}
                    {errorMessage && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {/* Name & Email Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#1c3f24] mb-1.5">
                          Your Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Elena Rostova"
                          className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-[#ccdacc] bg-white focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d] transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1c3f24] mb-1.5">
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-[#ccdacc] bg-white focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d] transition"
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-xs font-semibold text-[#1c3f24] mb-1.5">
                        Phone Number <span className="text-stone-400 font-normal text-[11px]">(Optional, for WhatsApp or callback)</span>
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-[#ccdacc] bg-white focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d] transition"
                      />
                    </div>

                    {/* Quick Topic Selector Pills */}
                    <div>
                      <label className="block text-xs font-semibold text-[#1c3f24] mb-2">
                        Common Inquiry Topics:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {topicOptions.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleSelectCategory(opt)}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition cursor-pointer ${category === opt || subject === opt
                                ? 'bg-[#24492d] text-white shadow-2xs'
                                : 'bg-[#f0f4f0] text-stone-700 hover:bg-[#e2eae2]'
                              }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Subject Line */}
                    <div>
                      <label className="block text-xs font-semibold text-[#1c3f24] mb-1.5">
                        Subject Line <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Brief summary of your inquiry"
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-[#ccdacc] bg-white focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d] transition"
                      />
                    </div>

                    {/* Message Area */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-semibold text-[#1c3f24]">
                          Inquiry Message <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] text-stone-400">
                          {message.length} / 4000 characters
                        </span>
                      </div>
                      <textarea
                        required
                        rows={5}
                        maxLength={4000}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={
                          userType === 'Buyer'
                            ? 'Please describe your order, product concern, or health consultation query with as much detail as possible...'
                            : userType === 'Seller'
                              ? 'Please provide your merchant store name, listing title, or verification details you need assistance with...'
                              : 'Please describe your wholesale requirements or partnership proposal...'
                        }
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-[#ccdacc] bg-white focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d] transition resize-y"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-6 rounded-lg bg-[#24492d] hover:bg-[#1a3821] text-white text-xs sm:text-sm font-bold tracking-wider uppercase transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Dispatching to Admin Desk...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Send Message to Admin</span>
                          </>
                        )}
                      </button>
                      <p className="text-[11px] text-stone-400 text-center mt-2">
                        Your message is securely transmitted directly to the Arboveya administrator.
                      </p>
                    </div>

                  </form>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

      {/* 3. Frequently Asked Questions Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="text-center mb-10">
          <span className="text-xs font-bold tracking-widest text-[#2d5c37] uppercase mb-2 block">
            Got Questions?
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1c3f24]">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="border border-[#e2eae2] rounded-xl bg-white overflow-hidden shadow-2xs transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#f9fbf9] transition-colors"
                >
                  <span className="font-serif text-sm font-bold text-[#1c3f24]">
                    {faq.q}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${isOpen ? 'rotate-180 text-[#24492d]' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 pt-1 text-xs text-stone-600 leading-relaxed border-t border-[#f0f4f0] bg-[#fafcfa]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
