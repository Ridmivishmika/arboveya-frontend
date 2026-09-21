'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Category } from '@/types';
import { Tag, Sparkles } from 'lucide-react';

interface ProductTypeSectionProps {
  categories?: Category[];
}

export default function ProductTypeSection({ categories = [] }: ProductTypeSectionProps) {
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const handleImgError = (catId: string) => {
    setImgErrors(prev => ({ ...prev, [catId]: true }));
  };

  return (
    <section className="py-14 bg-[#fbfdfa] border-t border-[#e6ede6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Centered Section Header with Leaf Icons */}
        <div className="flex items-center justify-center gap-3 mb-10 text-center">
          <span className="text-[#3b6040] text-lg">🌿</span>
          <h2 className="font-serif text-lg sm:text-xl md:text-2xl font-semibold tracking-[0.18em] text-[#1c3f24] uppercase">
            SHOP BY PRODUCT TYPE
          </h2>
          <span className="text-[#3b6040] text-lg">🌿</span>
        </div>

        {/* Centered Dynamic Categories in Round Circular Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {categories.length > 0 ? (
            categories.map((category) => {
              const hasError = imgErrors[category.id];
              const hasValidImage = category.imageUrl && !hasError && (
                category.imageUrl.startsWith('/') || category.imageUrl.startsWith('http')
              );

              return (
                <Link
                  key={category.id}
                  href={`/shop?category=${encodeURIComponent(category.name)}`}
                  className="group flex flex-col items-center gap-2.5 text-center cursor-pointer"
                >
                  {/* Circular Image Badge */}
                  <div className="relative w-18 h-18 sm:w-22 sm:h-22 rounded-full bg-[#edf4ee] border-2 border-[#ccdccd] group-hover:border-[#24492d] group-hover:scale-108 transition-all duration-300 shadow-xs overflow-hidden flex items-center justify-center">
                    {hasValidImage ? (
                      <Image
                        src={category.imageUrl!}
                        alt={category.name}
                        fill
                        sizes="88px"
                        onError={() => handleImgError(category.id)}
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <Tag className="w-7 h-7 text-[#24492d] stroke-[1.7]" />
                    )}
                  </div>

                  {/* Category Name */}
                  <span 
                    className="text-xs sm:text-[13px] font-semibold text-[#2d4b32] group-hover:text-[#193a20] capitalize transition-colors max-w-[130px] truncate" 
                    title={category.name}
                  >
                    {category.name}
                  </span>
                </Link>
              );
            })
          ) : (
            <div className="flex items-center gap-3 py-3 px-5 rounded-xl bg-[#f2f6f2] border border-[#d5e2d6] text-xs text-[#405644]">
              <Sparkles className="w-4 h-4 text-[#c7a45e]" />
              <span>Curating our pure botanical selections. Check back shortly.</span>
            </div>
          )}
        </div>

        {/* Centered SHOP ALL Button in the Middle */}
        <div className="mt-10 text-center">
          <Link
            href="/shop?category=All+Products"
            className="inline-flex items-center justify-center px-8 py-2.5 bg-[#254b2d] hover:bg-[#1b3a22] text-white text-[11px] font-bold tracking-[0.18em] rounded-xs transition-all duration-200 shadow-sm hover:shadow-md uppercase cursor-pointer"
          >
            SHOP ALL
          </Link>
        </div>

      </div>
    </section>
  );
}
