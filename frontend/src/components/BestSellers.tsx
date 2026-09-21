'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Star } from 'lucide-react';
import { Product } from '@/types';

interface BestSellersProps {
  products: Product[];
}


function resolveProductImage(url?: string | null): string {
  if (!url) return '/images/herbal-detox-tea.jpg';
  const trimmed = url.trim();
  if (trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return '/images/herbal-detox-tea.jpg';
}

export default function BestSellers({ products }: BestSellersProps) {
  const [wishlist, setWishlist] = useState<{ [key: string]: boolean }>({});

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setWishlist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-white border-t border-[#ebf0eb]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Leaf Icons */}
        <div className="flex items-center justify-center gap-3 mb-8 text-center">
          <span className="text-[#3b6040] text-lg">🌿</span>
          <h2 className="font-serif text-lg sm:text-xl md:text-2xl font-semibold tracking-[0.2em] text-[#1c3f24] uppercase">
            BEST SELLERS
          </h2>
          <span className="text-[#3b6040] text-lg">🌿</span>
        </div>

        {/* Centered Products Grid */}
        <div className="flex flex-wrap items-stretch justify-center gap-4 sm:gap-5">
          {products.slice(0, 6).map((product) => {
            const isWishlisted = !!wishlist[product.id];
            const lowestVariant = product.variants && product.variants.length > 0
              ? [...product.variants].sort((a, b) => a.price - b.price)[0]
              : undefined;
            const displayPrice = lowestVariant ? lowestVariant.price : product.price;
            const displayWeight = lowestVariant ? lowestVariant.weight : product.weight;

            return (
              <div
                key={product.id}
                className="group relative bg-white border border-[#e2eae2] rounded-xl p-3.5 flex flex-col justify-between hover:shadow-lg hover:border-[#2f5436] transition-all duration-300 min-h-[170px] w-full max-w-[280px] sm:w-[190px] md:w-[200px] flex-shrink-0"
              >
                {/* Top Badge & Wishlist row */}
                <div className="flex items-center justify-between h-5 mb-1 z-10">
                  {product.isBestSeller ? (
                    <span className="bg-[#2a4d31] text-white text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-xs">
                      BEST SELLER
                    </span>
                  ) : <span />}

                  <button
                    onClick={(e) => toggleWishlist(product.id, e)}
                    className="p-1 text-[#a3b3a5] hover:text-[#c43a3a] transition-colors"
                    aria-label="Add to wishlist"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-[#c43a3a] text-[#c43a3a]' : ''}`}
                    />
                  </button>
                </div>

                {/* Card Body: Left image + Right details */}
                <Link
                  href={`/shop/${product.id}`}
                  className="flex items-center gap-2 flex-1 my-1 group-hover:opacity-95 transition-opacity"
                >
                  {/* Left: Product Image */}
                  <div className="relative w-16 h-20 flex-shrink-0 flex items-center justify-center">
                    <Image
                      src={resolveProductImage(product.imageUrl)}
                      alt={product.name}
                      fill
                      sizes="64px"
                      className="object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Right: Product Details */}
                  <div className="flex-1 flex flex-col justify-center space-y-1">
                    <h3 className="font-sans font-bold text-[11px] text-[#1c3f24] tracking-wide leading-tight uppercase group-hover:text-[#2c5c36] transition-colors">
                      {product.name}
                    </h3>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-[#1a3826]">
                        ${displayPrice.toFixed(2)}
                      </span>
                      {displayWeight && (
                        <span className="text-[10px] font-medium text-[#24492d] bg-[#edf5ee] px-1.5 py-0.2 rounded border border-[#d2e2d4]">
                          {displayWeight}
                        </span>
                      )}
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center gap-0.5 text-[9px]">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-2.5 h-2.5 ${
                              (product.reviewCount ?? 0) > 0 && i < Math.round(product.averageRating || 0)
                                ? 'fill-[#24492d] text-[#24492d]'
                                : 'text-[#d6dfd7]'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-[9px] text-[#718274]">
                      ({product.reviewCount || 0} {product.reviewCount === 1 ? 'Review' : 'Reviews'})
                    </span>
                  </div>
                </Link>

              </div>
            );
          })}
        </div>

        {/* Shop All Products Button in Middle */}
        <div className="mt-8 text-center">
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
