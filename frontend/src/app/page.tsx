export const dynamic = 'force-dynamic';
import React from 'react';
import HeroSection from '@/components/HeroSection';
import ValueBanner from '@/components/ValueBanner';
import WellnessNeeds from '@/components/WellnessNeeds';
import BestSellers from '@/components/BestSellers';
import ProductTypeSection from '@/components/ProductTypeSection';
import TrustBadges from '@/components/TrustBadges';
import { getSiteSettings, getProducts, getCategories, getWellnessNeeds } from '@/lib/api';

export default async function HomePage() {
  const [siteSettings, products, categories, wellnessNeeds] = await Promise.all([
    getSiteSettings(),
    getProducts(),
    getCategories(),
    getWellnessNeeds()
  ]);

  return (
    <div className="w-full">
      {/* 1. Hero Section */}
      <HeroSection
        heroText={siteSettings.homePageHeroText}
        description={siteSettings.aboutUsContent}
      />

      {/* 2. Value Proposition Green Banner */}
      <ValueBanner />

      {/* 3. Find Products by Wellness Need (Only shown if wellness need exists in DB and has assigned products) */}
      <WellnessNeeds wellnessNeeds={wellnessNeeds} products={products} />

      {/* 4. Best Sellers */}
      <BestSellers products={products} />

      {/* 5. Shop by Product Type (Dynamically linked to backend categories) */}
      <ProductTypeSection categories={categories} />

      {/* 6. Trust & Quality Banner */}
      <TrustBadges />
    </div>
  );
}