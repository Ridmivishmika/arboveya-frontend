'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { 
  Star, 
  ChevronRight, 
  ChevronLeft, 
  ShoppingBag, 
  Check, 
  Leaf, 
  ShieldCheck, 
  Award, 
  Truck, 
  X,
  Eye 
} from 'lucide-react';
import { Product, Category, WellnessNeed } from '@/types';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { resolveBackendImageUrl } from '@/lib/api';

interface ShopClientProps {
  initialProducts: Product[];
  initialCategories: Category[];
  initialWellnessNeeds?: WellnessNeed[];
  initialCategoryParam?: string;
  initialWellnessNeedParam?: string;
}

export default function ShopClient({
  initialProducts,
  initialCategories,
  initialWellnessNeeds = [],
  initialCategoryParam = 'All Products',
  initialWellnessNeedParam = 'All Wellness Needs'
}: ShopClientProps) {
  const searchParams = useSearchParams();
  const { addToCart } = useCart();
  const { user } = useAuth();

  // State
  const [products] = useState<Product[]>(initialProducts);
  const [categories] = useState<Category[]>(initialCategories);
  const [wellnessNeeds] = useState<WellnessNeed[]>(initialWellnessNeeds);

  // Compute dynamic price ceiling from actual product lowest-variant prices
  const catalogMaxPrice = useMemo(() => {
    if (products.length === 0) return 100;
    const highestPrice = products.reduce((max, p) => {
      const lowestVariantPrice = p.variants && p.variants.length > 0
        ? Math.min(...p.variants.map(v => v.price))
        : p.price;
      return Math.max(max, lowestVariantPrice);
    }, 0);
    // Round up to nearest 10 for a clean slider max
    return Math.ceil(highestPrice / 10) * 10 || 100;
  }, [products]);

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategoryParam);
  const [selectedWellnessNeed, setSelectedWellnessNeed] = useState<string>(initialWellnessNeedParam);
  const [maxPrice, setMaxPrice] = useState<number>(() => {
    // Will be reset after catalogMaxPrice is computed; start at a high value
    return 9999;
  });
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [addedToCartId, setAddedToCartId] = useState<string | null>(null);

  const itemsPerPage = 12;

  // Keep maxPrice in sync when catalogMaxPrice first resolves
  useEffect(() => {
    setMaxPrice(catalogMaxPrice);
  }, [catalogMaxPrice]);

  // Sync with searchParams on mount or navigation
  useEffect(() => {
    const categoryParam = searchParams.get('category') || searchParams.get('categoryId');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
    const wellnessNeedParam = searchParams.get('wellnessNeed') || searchParams.get('need');
    if (wellnessNeedParam) {
      setSelectedWellnessNeed(wellnessNeedParam);
    }
  }, [searchParams]);

  // Helper to extract a display wellness need for product cards
  const getProductWellnessNeed = (product: Product): string => {
    return product.wellnessNeedName || product.wellnessNeed || 'General Wellness';
  };

  // Build category list with item counts
  const categoryListWithCounts = useMemo(() => {
    const list = [
      { name: 'All Products', count: products.length }
    ];

    categories.forEach((cat) => {
      const count = products.filter(
        (p) =>
          (p.categoryId && p.categoryId === cat.id) ||
          (p.categoryName && p.categoryName.toLowerCase() === cat.name.toLowerCase())
      ).length;

      list.push({
        name: cat.name,
        count
      });
    });

    return list;
  }, [categories, products]);

  // Build wellness needs list with counts - ONLY if wellness need exists in backend AND has products assigned
  const wellnessNeedsWithCounts = useMemo(() => {
    const result: { name: string; count: number }[] = [];

    wellnessNeeds.forEach((item) => {
      const itemName = item.name || item.title;
      if (!itemName) return;

      const matchingProducts = products.filter(
        (p) =>
          (p.wellnessNeedId && p.wellnessNeedId === item.id) ||
          (p.wellnessNeedName && p.wellnessNeedName.toLowerCase() === itemName.toLowerCase()) ||
          (p.wellnessNeed && p.wellnessNeed.toLowerCase() === itemName.toLowerCase())
      );

      const count = matchingProducts.length > 0 ? matchingProducts.length : (item.productCount ?? 0);

      // STRICT RULE: Only display if it has products assigned (> 0)
      if (count > 0) {
        result.push({
          name: itemName,
          count
        });
      }
    });

    return result;
  }, [wellnessNeeds, products]);

  // Handle Category selection
  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setCurrentPage(1);
  };

  // Handle Wellness Need selection
  const handleWellnessNeedSelect = (needName: string) => {
    setSelectedWellnessNeed(needName);
    setCurrentPage(1);
  };

  // Handle Rating checkbox toggle
  const handleRatingToggle = (stars: number) => {
    setSelectedRatings((prev) => {
      const next = prev.includes(stars)
        ? prev.filter((s) => s !== stars)
        : [...prev, stars];
      return next;
    });
    setCurrentPage(1);
  };

  // Quick Add to Cart handler
  const handleAddToCart = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (user && (user.role === 'Seller' || user.role === 'Admin')) return;

    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const lowestVariant = product.variants && product.variants.length > 0
      ? [...product.variants].sort((a, b) => a.price - b.price)[0]
      : undefined;

    addToCart(product, 1, lowestVariant);
    setAddedToCartId(productId);
    setTimeout(() => {
      setAddedToCartId(null);
    }, 1500);
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // 1. Category filter
      if (selectedCategory !== 'All Products') {
        const matchesCategory =
          (product.categoryId && product.categoryId === selectedCategory) ||
          (product.categoryName && product.categoryName.toLowerCase() === selectedCategory.toLowerCase());
        if (!matchesCategory) return false;
      }

      // 2. Wellness Need filter
      if (selectedWellnessNeed !== 'All Wellness Needs') {
        const matchesWellness =
          (product.wellnessNeedId && product.wellnessNeedId === selectedWellnessNeed) ||
          (product.wellnessNeedName && product.wellnessNeedName.toLowerCase() === selectedWellnessNeed.toLowerCase()) ||
          (product.wellnessNeed && product.wellnessNeed.toLowerCase() === selectedWellnessNeed.toLowerCase());
        if (!matchesWellness) return false;
      }

      // 3. Price filter — use lowest variant price for comparison
      if (maxPrice < catalogMaxPrice) {
        const lowestPrice = product.variants && product.variants.length > 0
          ? Math.min(...product.variants.map(v => v.price))
          : product.price;
        if (lowestPrice > maxPrice) return false;
      }

      // 4. Rating filter
      if (selectedRatings.length > 0) {
        const hasReviews = (product.reviewCount ?? 0) > 0;
        const rating = hasReviews ? Math.round(product.averageRating ?? product.rating ?? 0) : 0;
        if (!selectedRatings.includes(rating)) return false;
      }

      return true;
    });
  }, [products, selectedCategory, selectedWellnessNeed, maxPrice, selectedRatings]);

  // Sort products
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    switch (sortBy) {
      case 'price-low':
        return list.sort((a, b) => a.price - b.price);
      case 'price-high':
        return list.sort((a, b) => b.price - a.price);
      case 'alphabetical':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'featured':
      default:
        return list.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
    }
  }, [filteredProducts, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const displayedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedProducts.slice(start, start + itemsPerPage);
  }, [sortedProducts, currentPage, itemsPerPage]);

  // Rating counts for display
  const ratingCounts = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0 };
    products.forEach((p) => {
      const hasReviews = (p.reviewCount ?? 0) > 0;
      if (hasReviews) {
        const r = Math.round(p.averageRating ?? p.rating ?? 0);
        if (counts[r] !== undefined) {
          counts[r]++;
        }
      }
    });
    return counts;
  }, [products]);

  const isFiltered = selectedCategory !== 'All Products' || selectedWellnessNeed !== 'All Wellness Needs' || maxPrice < catalogMaxPrice || selectedRatings.length > 0;

  return (
    <div className="w-full bg-[#fbfdfb] min-h-screen">
      
      {/* Top Breadcrumbs */}
      <div className="border-b border-[#e9efe9] bg-white/70 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center text-xs text-[#526b56] gap-2">
          <Link href="/" className="hover:text-[#1c3f24] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-[#9ab39d]" />
          <span className="font-semibold text-[#1c3f24]">Shop All Botanicals</span>
          {selectedCategory !== 'All Products' && (
            <>
              <ChevronRight className="w-3 h-3 text-[#9ab39d]" />
              <span className="font-bold text-[#24492d]">{selectedCategory}</span>
            </>
          )}
          {selectedWellnessNeed !== 'All Wellness Needs' && (
            <>
              <ChevronRight className="w-3 h-3 text-[#9ab39d]" />
              <span className="font-bold text-[#24492d]">{selectedWellnessNeed}</span>
            </>
          )}
        </div>
      </div>

      {/* Main Layout Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
          
          {/* ================= LEFT SIDEBAR ================= */}
          <aside className="w-full md:w-64 flex-shrink-0 space-y-8 bg-white p-5 rounded-2xl border border-[#e8efe8] shadow-2xs">
            
            {/* Filter by Category */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#e5ece5]">
                <h3 className="font-sans text-xs font-bold tracking-[0.15em] text-[#1c3f24] uppercase">
                  CATEGORIES
                </h3>
                {selectedCategory !== 'All Products' && (
                  <button
                    onClick={() => handleCategorySelect('All Products')}
                    className="text-[11px] text-[#557359] hover:text-[#1c3f24] hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {categoryListWithCounts.map(({ name, count }) => {
                  const isSelected = selectedCategory.toLowerCase() === name.toLowerCase();
                  return (
                    <button
                      key={name}
                      onClick={() => handleCategorySelect(name)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'bg-[#24492d] text-white font-bold shadow-xs'
                          : 'text-[#4a634f] hover:bg-[#f0f5f0] hover:text-[#1c3f24]'
                      }`}
                    >
                      <span className="truncate">{name}</span>
                      <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-[#859c89]'}`}>
                        ({count})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter by Wellness Need (ONLY shown if wellness need exists in backend AND has products assigned) */}
            {wellnessNeedsWithCounts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#e5ece5]">
                  <h3 className="font-sans text-xs font-bold tracking-[0.15em] text-[#1c3f24] uppercase">
                    WELLNESS NEED
                  </h3>
                  {selectedWellnessNeed !== 'All Wellness Needs' && (
                    <button
                      onClick={() => handleWellnessNeedSelect('All Wellness Needs')}
                      className="text-[11px] text-[#557359] hover:text-[#1c3f24] hover:underline cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => handleWellnessNeedSelect('All Wellness Needs')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                      selectedWellnessNeed === 'All Wellness Needs'
                        ? 'bg-[#24492d] text-white font-bold shadow-xs'
                        : 'text-[#4a634f] hover:bg-[#f0f5f0] hover:text-[#1c3f24]'
                    }`}
                  >
                    <span>All Wellness Needs</span>
                    <span className={`text-[10px] ${selectedWellnessNeed === 'All Wellness Needs' ? 'text-white/80' : 'text-[#859c89]'}`}>
                      ({products.length})
                    </span>
                  </button>
                  {wellnessNeedsWithCounts.map(({ name, count }) => {
                    const isSelected = selectedWellnessNeed.toLowerCase() === name.toLowerCase();
                    return (
                      <button
                        key={name}
                        onClick={() => handleWellnessNeedSelect(name)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                          isSelected
                            ? 'bg-[#24492d] text-white font-bold shadow-xs'
                            : 'text-[#4a634f] hover:bg-[#f0f5f0] hover:text-[#1c3f24]'
                        }`}
                      >
                        <span className="truncate">{name}</span>
                        <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-[#859c89]'}`}>
                          ({count})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Filter by Price */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#e5ece5]">
                <h3 className="font-sans text-xs font-bold tracking-[0.15em] text-[#1c3f24] uppercase">
                  FILTER BY PRICE
                </h3>
                {maxPrice < catalogMaxPrice && (
                  <button
                    onClick={() => {
                      setMaxPrice(catalogMaxPrice);
                      setCurrentPage(1);
                    }}
                    className="text-[11px] text-[#557359] hover:text-[#1c3f24] hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[#4a634f]">
                  <span>$0</span>
                  <span className="font-bold text-[#1c3f24]">${maxPrice}{maxPrice >= catalogMaxPrice ? '+' : ''}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={catalogMaxPrice}
                  step={catalogMaxPrice > 200 ? 10 : 5}
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full accent-[#24492d] cursor-pointer"
                />
                <div className="flex items-center justify-between text-[11px] text-[#718875]">
                  <span>$0</span>
                  <span>${catalogMaxPrice}+</span>
                </div>
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-4">
              <h3 className="font-sans text-xs font-bold tracking-[0.15em] text-[#1c3f24] uppercase pb-2 border-b border-[#e5ece5]">
                RATING
              </h3>
              <div className="space-y-2.5">
                {[5, 4, 3, 2].map((stars) => {
                  const isChecked = selectedRatings.includes(stars);
                  return (
                    <label
                      key={stars}
                      className="flex items-center justify-between text-xs text-[#4a634f] cursor-pointer hover:text-[#1c3f24] group"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleRatingToggle(stars)}
                          className="rounded border-[#ccdacc] text-[#24492d] focus:ring-[#24492d] cursor-pointer"
                        />
                        <div className="flex items-center text-[#24492d]">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < stars
                                  ? 'fill-[#24492d] text-[#24492d]'
                                  : 'text-[#d6dfd7]'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-[#859c89]">
                        ({ratingCounts[stars] || 0})
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

          </aside>

          {/* ================= RIGHT CATALOG AREA ================= */}
          <main className="flex-1 w-full space-y-6">
            
            {/* Active Filter Banner when category is selected */}
            {selectedCategory !== 'All Products' && (
              <div className="flex items-center justify-between bg-[#edf6ef] border border-[#d2e4d5] px-4 py-2.5 rounded-xl text-xs text-[#1c3f24] animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="text-[#557359]">Filtered by Category:</span>
                  <span className="font-bold text-[#1c3f24] px-2.5 py-0.5 rounded-md bg-white border border-[#c4dbc8] shadow-2xs">
                    {selectedCategory}
                  </span>
                  <span className="text-[11px] text-[#557359]">
                    ({filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found)
                  </span>
                </div>
                <button
                  onClick={() => handleCategorySelect('All Products')}
                  className="font-bold text-[#24492d] hover:text-[#132c19] hover:underline text-xs flex items-center gap-1 cursor-pointer bg-white/70 hover:bg-white px-2.5 py-1 rounded-md transition-all shadow-2xs"
                >
                  <span>Clear Category Filter</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Active Filter Banner when wellness need is selected */}
            {selectedWellnessNeed !== 'All Wellness Needs' && (
              <div className="flex items-center justify-between bg-[#edf6ef] border border-[#d2e4d5] px-4 py-2.5 rounded-xl text-xs text-[#1c3f24] animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="text-[#557359]">Filtered by Wellness Need:</span>
                  <span className="font-bold text-[#1c3f24] px-2.5 py-0.5 rounded-md bg-white border border-[#c4dbc8] shadow-2xs">
                    {selectedWellnessNeed}
                  </span>
                  <span className="text-[11px] text-[#557359]">
                    ({filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found)
                  </span>
                </div>
                <button
                  onClick={() => handleWellnessNeedSelect('All Wellness Needs')}
                  className="font-bold text-[#24492d] hover:text-[#132c19] hover:underline text-xs flex items-center gap-1 cursor-pointer bg-white/70 hover:bg-white px-2.5 py-1 rounded-md transition-all shadow-2xs"
                >
                  <span>Clear Wellness Filter</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#f0f4f0]">
              <p className="text-xs text-[#627a66]">
                Showing{' '}
                <span className="font-semibold text-[#1c3f24]">
                  {displayedProducts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
                  {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
                </span>{' '}
                of <span className="font-semibold text-[#1c3f24]">{filteredProducts.length}</span> results
                {selectedCategory !== 'All Products' && (
                  <span className="text-[#516b55]"> in <strong className="text-[#1c3f24]">{selectedCategory}</strong></span>
                )}
                {selectedWellnessNeed !== 'All Wellness Needs' && (
                  <span className="text-[#516b55]"> for <strong className="text-[#1c3f24]">{selectedWellnessNeed}</strong></span>
                )}
              </p>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2 text-xs">
                <label htmlFor="shop-sort" className="text-[#627a66]">Sort by:</label>
                <select
                  id="shop-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-[#ccdacc] bg-white text-[#1c3f24] font-medium text-xs focus:outline-none focus:ring-1 focus:ring-[#24492d] cursor-pointer"
                >
                  <option value="featured">Featured / Best Sellers</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="alphabetical">Alphabetical: A-Z</option>
                </select>
              </div>
            </div>

            {/* Empty State */}
            {displayedProducts.length === 0 ? (
              <div className="py-20 text-center space-y-3 bg-[#fafcfa] rounded-2xl border border-[#e8efe8] p-8">
                <Leaf className="w-10 h-10 text-[#718875] mx-auto opacity-60" />
                <h3 className="font-serif text-lg font-bold text-[#1c3f24]">
                  {selectedWellnessNeed !== 'All Wellness Needs' ? `No products found for "${selectedWellnessNeed}"` : selectedCategory !== 'All Products' ? `No products found in "${selectedCategory}"` : 'No products match your criteria'}
                </h3>
                <p className="text-xs text-[#627a66] max-w-sm mx-auto">
                  {isFiltered 
                    ? "Try clearing your filters or viewing our full botanical catalog."
                    : "No products available in this category yet."}
                </p>
                <button
                  onClick={() => {
                    handleCategorySelect('All Products');
                    handleWellnessNeedSelect('All Wellness Needs');
                    setMaxPrice(100);
                    setSelectedRatings([]);
                  }}
                  className="px-5 py-2.5 bg-[#24492d] text-white text-xs font-bold uppercase rounded-lg hover:bg-[#1a3821] transition-colors cursor-pointer shadow-xs"
                >
                  Show All Products
                </button>
              </div>
            ) : (
              /* 4-Column Product Grid */
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
                {displayedProducts.map((product) => {
                  const isAdded = addedToCartId === product.id;
                  const hasReviews = (product.reviewCount ?? 0) > 0;
                  const ratingVal = hasReviews ? Math.round(product.averageRating ?? product.rating ?? 0) : 0;
                  const lowestVariant = product.variants && product.variants.length > 0
                    ? [...product.variants].sort((a, b) => a.price - b.price)[0]
                    : undefined;
                  const displayPrice = lowestVariant ? lowestVariant.price : product.price;
                  const displayWeight = lowestVariant ? lowestVariant.weight : product.weight;

                  return (
                    <div
                      key={product.id}
                      className="group flex flex-col justify-between text-left"
                    >
                      {/* Product Image Container */}
                      <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-[#f4f7f4] border border-[#e4ece4] mb-3 group-hover:border-[#24492d]/40 transition-all">
                        <Link href={`/shop/${product.id}`} className="block w-full h-full relative">
                          {product.imageUrl ? (
                            <Image
                              src={resolveBackendImageUrl(product.imageUrl, '/images/gotu-kola-tea.jpg')}
                              alt={product.name}
                              fill
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#75947b]">
                              <Leaf className="w-8 h-8" />
                            </div>
                          )}

                          {/* Best Seller Badge */}
                          {product.isBestSeller && (
                            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-[#24492d] text-white shadow-sm z-10">
                              Best Seller
                            </span>
                          )}
                        </Link>

                        {/* Quick Add / View Overlay on Hover (Separate from Link) */}
                        <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/50 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                          {user && (user.role === 'Seller' || user.role === 'Admin') ? (
                            <Link
                              href={`/shop/${product.id}`}
                              className="w-full py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5 bg-white text-[#1c3f24] hover:bg-[#24492d] hover:text-white"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Details</span>
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleAddToCart(e, product.id)}
                              className={`w-full py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                isAdded 
                                   ? 'bg-[#15803d] text-white' 
                                  : 'bg-white text-[#1c3f24] hover:bg-[#24492d] hover:text-white'
                              }`}
                            >
                              {isAdded ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Added!</span>
                                </>
                              ) : (
                                <>
                                  <ShoppingBag className="w-3.5 h-3.5" />
                                  <span>Quick Add</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Product Info Link */}
                      <Link href={`/shop/${product.id}`} className="block group-hover:opacity-95">
                        {/* Category & Wellness Need */}
                        <div className="flex items-center gap-1 text-[10px] text-[#718875] font-medium tracking-wide uppercase truncate mb-0.5">
                          <span>{product.categoryName || 'Botanical'}</span>
                          <span>•</span>
                          <span className="text-[#24492d] font-semibold">{getProductWellnessNeed(product)}</span>
                        </div>

                        {/* Title */}
                        <h3 className="font-serif text-sm sm:text-[15px] font-bold text-[#1c3f24] group-hover:text-[#2c5c36] transition-colors line-clamp-1">
                          {product.name}
                        </h3>

                        {/* Price & Weight - Default displays lowest variant value with weight */}
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-[#1c3f24]">
                            ${Number(displayPrice).toFixed(2)}
                          </span>
                          {displayWeight && (
                            <span className="text-[11px] font-semibold text-[#24492d] bg-[#edf5ee] border border-[#d2e4d5] px-1.5 py-0.5 rounded">
                              {displayWeight}
                            </span>
                          )}
                          {product.variants && product.variants.length > 1 && (
                            <span className="text-[10px] text-[#6b8570]">
                              ({product.variants.length} options)
                            </span>
                          )}
                        </div>

                        {/* Stars */}
                        <div className="flex items-center text-[#24492d] mt-1 gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < ratingVal
                                  ? 'fill-[#24492d] text-[#24492d]'
                                  : 'text-[#d6dfd7]'
                              }`}
                            />
                          ))}
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-[#ccdacc] text-[#3b5940] hover:bg-[#edf5ee] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isActive = currentPage === pageNum;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#24492d] text-white shadow-xs'
                          : 'border border-[#ccdacc] text-[#3b5940] hover:bg-[#edf5ee]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-[#ccdacc] text-[#3b5940] hover:bg-[#edf5ee] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* ================= BOTTOM DARK GREEN TRUST BANNER ================= */}
      <section className="bg-[#24492d] text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
            
            {/* 100% Natural */}
            <div className="flex items-center space-x-3 justify-center md:justify-start">
              <div className="p-2.5 rounded-full bg-white/10 flex-shrink-0 text-[#86efac]">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-wider uppercase">
                  100% Natural
                </h4>
                <p className="text-[11px] text-[#c0d6c4]">
                  Pure &amp; Organic
                </p>
              </div>
            </div>

            {/* No Chemicals */}
            <div className="flex items-center space-x-3 justify-center md:justify-start">
              <div className="p-2.5 rounded-full bg-white/10 flex-shrink-0 text-[#86efac]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-wider uppercase">
                  No Chemicals
                </h4>
                <p className="text-[11px] text-[#c0d6c4]">
                  Safe &amp; Clean
                </p>
              </div>
            </div>

            {/* Premium Quality */}
            <div className="flex items-center space-x-3 justify-center md:justify-start">
              <div className="p-2.5 rounded-full bg-white/10 flex-shrink-0 text-[#86efac]">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-wider uppercase">
                  Premium Quality
                </h4>
                <p className="text-[11px] text-[#c0d6c4]">
                  Top Standards
                </p>
              </div>
            </div>

            {/* Worldwide Shipping */}
            <div className="flex items-center space-x-3 justify-center md:justify-start">
              <div className="p-2.5 rounded-full bg-white/10 flex-shrink-0 text-[#86efac]">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-wider uppercase">
                  Worldwide Shipping
                </h4>
                <p className="text-[11px] text-[#c0d6c4]">
                  Fast &amp; Reliable
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
