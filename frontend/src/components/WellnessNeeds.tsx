'use client';

import React from 'react';
import Link from 'next/link';
import { WellnessNeed, Product } from '@/types';

// Custom SVG Icons for the 11 Wellness Needs
function WellnessIcon({ name = 'leaf' }: { name?: string }) {
  const iconProps = "w-9 h-9 text-[#2a4d31] stroke-[1.4] transition-colors";
  
  switch (name) {
    case 'lungs':
      return (
        <svg className={iconProps} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 4v16" />
          <path d="M12 8c-3-2-7 0-7 5 0 4 3 7 7 7" />
          <path d="M12 8c3-2 7 0 7 5 0 4-3 7-7 7" />
        </svg>
      );
    case 'brain':
      return (
        <svg className={iconProps} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04" />
          <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04" />
        </svg>
      );
    case 'kidney':
      return (
        <svg className={iconProps} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M7 6c2-4 7-3 8 2 1 6-4 12-8 12-3 0-5-3-5-6 0-4 3-5 5-8z" />
          <path d="M17 6c-2-4-7-3-8 2-1 6 4 12 8 12 3 0 5-3 5-6 0-4-3-5-5-8z" />
        </svg>
      );
    case 'droplet':
      return (
        <svg className={iconProps} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          <path d="M12 11v6" />
          <path d="M9 14h6" />
        </svg>
      );
    case 'shield-plus':
      return (
        <svg className={iconProps} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <line x1="12" y1="8" x2="12" y2="14" />
          <line x1="9" y1="11" x2="15" y2="11" />
        </svg>
      );
    case 'stomach':
      return (
        <svg className={iconProps} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M9 3v4c0 3 2 5 5 5 3 0 5 2 5 5s-2 4-5 4-5-2-5-5" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    case 'liver':
      return (
        <svg className={iconProps} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M5 8c2-3 10-4 14-1 3 2 2 8 0 11-3 4-11 4-14 1C3 16 3 11 5 8z" />
        </svg>
      );
    case 'activity':
      return (
        <svg className={iconProps} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M6 4c0 5 3 7 6 7s6-2 6-7" />
          <path d="M12 11v9" />
          <path d="M8 20h8" />
        </svg>
      );
    case 'flower':
      return (
        <svg className={iconProps} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 5a3 3 0 0 0-3 3c0 2 3 4 3 4s3-2 3-4a3 3 0 0 0-3-3z" />
          <path d="M12 19a3 3 0 0 0 3-3c0-2-3-4-3-4s-3 2-3 4a3 3 0 0 0 3 3z" />
          <path d="M5 12a3 3 0 0 0 3 3c2 0 4-3 4-3s-2-3-4-3a3 3 0 0 0-3 3z" />
          <path d="M19 12a3 3 0 0 0-3-3c-2 0-4 3-4 3s2 3 4 3a3 3 0 0 0 3-3z" />
        </svg>
      );
    case 'sparkles':
      return (
        <svg className={iconProps} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="10" cy="14" r="5" />
          <line x1="19" y1="5" x2="13.6" y2="10.4" />
          <line x1="19" y1="5" x2="14" y2="5" />
          <line x1="19" y1="5" x2="19" y2="10" />
        </svg>
      );
    case 'bone':
    default:
      return (
        <svg className={iconProps} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M17 10c.7-.7 1.6-1 2.5-1a3.5 3.5 0 0 1 0 7c-.9 0-1.8-.3-2.5-1l-7 7c-.7.7-1.6 1-2.5 1a3.5 3.5 0 0 1 0-7c.9 0 1.8.3 2.5 1z" />
        </svg>
      );
  }
}

interface WellnessNeedsProps {
  wellnessNeeds?: WellnessNeed[];
  products?: Product[];
}

export default function WellnessNeeds({ wellnessNeeds = [], products = [] }: WellnessNeedsProps) {
  // Only display wellness needs that exist in the database AND have products assigned
  const activeNeeds = wellnessNeeds.filter((item) => {
    const itemName = item.name || item.title || '';
    const hasCount = (item.productCount ?? 0) > 0;
    const hasAssignedProduct = products.some(
      (p) =>
        (p.wellnessNeedId && p.wellnessNeedId === item.id) ||
        (p.wellnessNeedName && p.wellnessNeedName.toLowerCase() === itemName.toLowerCase()) ||
        (p.wellnessNeed && p.wellnessNeed.toLowerCase() === itemName.toLowerCase())
    );
    return hasCount || hasAssignedProduct;
  });

  // If no wellness needs in DB have products assigned, do not render the section
  if (activeNeeds.length === 0) {
    return null;
  }

  return (
    <section className="py-14 bg-[#fcfdfc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Decorative Leaf Flourishes */}
        <div className="flex items-center justify-center gap-3 mb-10 text-center">
          <span className="text-[#3b6040] text-lg">🌿</span>
          <h2 className="font-serif text-lg sm:text-xl md:text-2xl font-semibold tracking-[0.18em] text-[#1c3f24] uppercase">
            FIND PRODUCTS BY WELLNESS NEED
          </h2>
          <span className="text-[#3b6040] text-lg">🌿</span>
        </div>

        {/* Dynamic Wellness Need Cards Grid */}
        <div className="flex flex-wrap justify-center gap-3.5">
          {activeNeeds.map((item) => {
            const displayName = item.name || item.title || '';
            const description = item.description || item.subtitle || '';
            return (
              <Link
                key={item.id}
                href={`/shop?wellnessNeed=${encodeURIComponent(displayName)}`}
                className="group flex flex-col items-center text-center p-3.5 rounded-xl bg-white border border-[#e5ece5] hover:border-[#2a4d31] hover:shadow-md transition-all duration-300 hover:-translate-y-1 w-[140px] sm:w-[155px]"
              >
                <div className="mb-3 p-2.5 rounded-full bg-[#f4f7f4] group-hover:bg-[#ebf2ec] transition-colors">
                  <WellnessIcon name={item.icon} />
                </div>

                <h3 className="text-xs sm:text-[13px] font-bold text-[#1a3826] group-hover:text-[#254b2d] leading-snug mb-1">
                  {displayName}
                </h3>

                {description && (
                  <p className="text-[10px] text-[#697a6d] leading-tight mt-0.5 line-clamp-2">
                    {description}
                  </p>
                )}
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}
