export const dynamic = 'force-dynamic';

import React from 'react';
import Image from 'next/image';
import { Sprout, ShieldCheck, Heart } from 'lucide-react';
import { getSiteSettings } from '@/lib/api';
import { SiteSettings } from '@/types';

const defaultSettings: SiteSettings = {
  aboutHeroSubtitle: 'Rooted in nature, inspired by wellness.',
  aboutUsContent:
    'Arboveya was created with a simple mission — to bring the healing power of nature to everyday life. We carefully select the finest herbs and ingredients from trusted sources to create premium wellness products that promote a healthier and balanced lifestyle.\n\nWe believe in purity, transparency, and sustainability in everything we do.',
  mission: 'To provide premium herbal wellness solutions that support healthier lifestyles worldwide.',
  vision: 'To become a trusted global herbal wellness brand.',
};

export default async function AboutUsPage() {
  const data = await getSiteSettings();

  const settings: SiteSettings = {
    aboutHeroSubtitle: data?.aboutHeroSubtitle || defaultSettings.aboutHeroSubtitle,
    aboutUsContent: data?.aboutUsContent || defaultSettings.aboutUsContent,
    mission: data?.mission || defaultSettings.mission,
    vision: data?.vision || defaultSettings.vision,
    facebookLink: data?.facebookLink,
    whatsAppNumber: data?.whatsAppNumber,
  };

  // Split story into separate paragraphs for clean typography
  const storyParagraphs = (settings.aboutUsContent || defaultSettings.aboutUsContent!)
    .split(/\n+/)
    .filter((p) => p.trim().length > 0);

  return (
    <div className="bg-white min-h-screen">
      {/* OUR STORY SECTION */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-16 sm:pb-20 md:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-14 lg:gap-16 items-center">
          {/* Left Column: Image Card */}
          <div className="relative group">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-md border border-stone-200/70 bg-stone-100">
              <Image
                src="/images/about-story-herbs.jpg"
                alt="Natural herbs, mortar and pestle, and botanical oil bottle"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover group-hover:scale-103 transition-transform duration-700 ease-out"
                priority
              />
            </div>
          </div>

          {/* Right Column: Story Text */}
          <div className="flex flex-col justify-center">
            <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-[0.16em] text-[#1c3f24] uppercase mb-6">
              OUR STORY
            </h2>

            <div className="space-y-4 text-stone-600 text-sm sm:text-base leading-relaxed">
              {storyParagraphs.map((para, idx) => (
                <p key={idx} className="text-stone-600 leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. FOUR VALUES / GUARANTEES STRIP */}
      <section className="border-y border-stone-200/80 bg-[#f9faf9] py-12 sm:py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {/* 1. Natural Ingredients */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-[#24492d] mb-3">
              {/* Arboveya Botanical A Emblem */}
              <span className="font-serif text-lg font-bold">🌿</span>
            </div>
            <h3 className="text-xs sm:text-sm font-bold tracking-wider text-stone-900 uppercase">
              NATURAL INGREDIENTS
            </h3>
            <p className="text-xs text-stone-500 mt-1 font-medium">Pure & Organic</p>
          </div>

          {/* 2. Sustainable Practices */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-[#24492d] mb-3">
              <Sprout className="w-5 h-5 text-[#24492d]" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold tracking-wider text-stone-900 uppercase">
              SUSTAINABLE PRACTICES
            </h3>
            <p className="text-xs text-stone-500 mt-1 font-medium">Eco Friendly</p>
          </div>

          {/* 3. Quality Assured */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-[#24492d] mb-3">
              <ShieldCheck className="w-5 h-5 text-[#24492d]" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold tracking-wider text-stone-900 uppercase">
              QUALITY ASSURED
            </h3>
            <p className="text-xs text-stone-500 mt-1 font-medium">Tested & Certified</p>
          </div>

          {/* 4. Made With Care */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-[#24492d] mb-3">
              <Heart className="w-5 h-5 text-[#24492d]" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold tracking-wider text-stone-900 uppercase">
              MADE WITH CARE
            </h3>
            <p className="text-xs text-stone-500 mt-1 font-medium">For Your Wellness</p>
          </div>
        </div>
      </section>

      {/* 4. OUR MISSION & OUR VISION SECTION */}
      <section className="relative overflow-hidden max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-start relative z-10">
          {/* Mission */}
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-[0.16em] text-[#1c3f24] uppercase mb-4">
              OUR MISSION
            </h2>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-md">
              {settings.mission}
            </p>
          </div>

          {/* Vision */}
          <div className="relative pr-24 sm:pr-32">
            <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-[0.16em] text-[#1c3f24] uppercase mb-4">
              OUR VISION
            </h2>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-md">
              {settings.vision}
            </p>
          </div>
        </div>

        {/* Botanical Sprig Branch Illustration at Bottom Right */}
        <div className="absolute right-0 bottom-0 pointer-events-none opacity-85 z-0 select-none hidden sm:block">
          <div className="relative w-48 sm:w-64 md:w-80 h-48 sm:h-64 md:h-80">
            <Image
              src="/images/botanical-sprig.jpg"
              alt="Botanical herbal sprig"
              fill
              className="object-contain object-bottom-right"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
