'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, MessageCircle, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { submitContactMessage } from '@/lib/api';
import { SiteSettings } from '@/types';

interface ContactClientProps {
  initialSettings?: SiteSettings;
}

export default function ContactClient({ initialSettings }: ContactClientProps) {
  const { user, token } = useAuth();

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // UI States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pre-populate fields based on signed-in user
  useEffect(() => {
    if (user) {
      if (!name) {
        setName(user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim());
      }
      if (!email && user.email) {
        setEmail(user.email);
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (!cleanName) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }
    if (!cleanSubject) {
      setErrorMessage('Please specify an inquiry subject.');
      return;
    }
    if (!cleanMessage) {
      setErrorMessage('Please enter your message.');
      return;
    }

    try {
      setLoading(true);
      await submitContactMessage(
        {
          name: cleanName,
          email: cleanEmail,
          userType: user?.role === 'Seller' ? 'Seller' : user?.role === 'Customer' ? 'Buyer' : 'General',
          subject: cleanSubject,
          message: cleanMessage,
        },
        token || undefined
      );

      setSuccessMessage('Thank you! Your message has been sent successfully. We will get back to you as soon as possible.');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send your message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const contactEmail = 'arboveya@gmail.com';
  const contactPhone = '0717981355';
  const contactWhatsApp = '0717981355';
  const contactAddress = 'Sri Lanka';

  return (
    <div className="bg-white min-h-screen text-[#1c3f24] selection:bg-[#24492d] selection:text-white">
      {/* Centered Page Header - No breadcrumb as requested */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-8 sm:pb-12 text-center">
        <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-wider text-stone-900 uppercase">
          CONTACT US
        </h1>
      </div>

      {/* Main 2-Column Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-7">
            <h2 className="font-serif text-lg sm:text-xl font-bold tracking-wider text-stone-900 uppercase mb-2">
              WE&apos;D LOVE TO HEAR FROM YOU
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm leading-relaxed mb-6">
              Have a question or need help? Send us a message and we&apos;ll get back to you as soon as possible.
            </p>

            {/* Notification Banners */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-5 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-950 mb-0.5">Message Sent</p>
                  <p>{successMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs sm:text-sm text-stone-600 mb-1.5 font-medium">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 sm:py-3 text-xs sm:text-sm rounded border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#24492d] focus:border-[#24492d] transition"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs sm:text-sm text-stone-600 mb-1.5 font-medium">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 sm:py-3 text-xs sm:text-sm rounded border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#24492d] focus:border-[#24492d] transition"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs sm:text-sm text-stone-600 mb-1.5 font-medium">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 sm:py-3 text-xs sm:text-sm rounded border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#24492d] focus:border-[#24492d] transition"
                />
              </div>

              {/* Your Message */}
              <div>
                <label className="block text-xs sm:text-sm text-stone-600 mb-1.5 font-medium">
                  Your Message
                </label>
                <textarea
                  required
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-2.5 sm:py-3 text-xs sm:text-sm rounded border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#24492d] focus:border-[#24492d] transition resize-y"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#24492d] hover:bg-[#1a3821] text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>SENDING...</span>
                    </>
                  ) : (
                    <span>SEND MESSAGE</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Contact Details & Map */}
          <div className="lg:col-span-5 space-y-6 sm:space-y-7 lg:pl-4">
            
            {/* EMAIL US */}
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-full bg-[#f0f5f1] border border-[#d6e5d8] text-[#24492d] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-1">
                  EMAIL US
                </h3>
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-xs sm:text-sm text-stone-600 hover:text-[#24492d] transition-colors"
                >
                  {contactEmail}
                </a>
              </div>
            </div>

            {/* CALL US */}
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-full bg-[#f0f5f1] border border-[#d6e5d8] text-[#24492d] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-1">
                  CALL US
                </h3>
                <a
                  href={`tel:${contactPhone}`}
                  className="text-xs sm:text-sm text-stone-600 hover:text-[#24492d] transition-colors"
                >
                  {contactPhone}
                </a>
              </div>
            </div>

            {/* WHATSAPP */}
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-full bg-[#f0f5f1] border border-[#d6e5d8] text-[#24492d] flex items-center justify-center flex-shrink-0 mt-0.5">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-1">
                  WHATSAPP
                </h3>
                <a
                  href="https://wa.me/94717981355"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-stone-600 hover:text-[#24492d] transition-colors"
                >
                  {contactWhatsApp}
                </a>
              </div>
            </div>

            {/* ADDRESS */}
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-full bg-[#f0f5f1] border border-[#d6e5d8] text-[#24492d] flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-1">
                  ADDRESS
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                  {contactAddress}
                </p>
              </div>
            </div>

            {/* Map Embed showing Sri Lanka */}
            <div className="pt-2">
              <div className="w-full h-56 sm:h-64 rounded-xl overflow-hidden border border-stone-200 shadow-xs relative bg-stone-100">
                <iframe
                  title="Arboveya Location Map"
                  src="https://maps.google.com/maps?q=Sri%20Lanka&t=&z=8&ie=UTF8&iwloc=&output=embed"
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
