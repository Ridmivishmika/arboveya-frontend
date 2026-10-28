'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Eye,
  Search,
  Tag,
  SlidersHorizontal,
  ChevronDown,
  Filter
} from 'lucide-react';
import { Product, Category, WellnessNeed } from '@/types';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { resolveBackendImageUrl } from '@/lib/api';
import { parseOfferMinQuantity, parseOfferTiers } from '@/lib/offerUtils';

interface ShopClientProps {
  initialProducts: Product[];
  initialCategories: Category[];
  initialWellnessNeeds?: WellnessNeed[];
  initialCategoryParam?: string;
  initialWellnessNeedParam?: string;
  initialSearchQuery?: string;
}

export default function ShopClient({
  initialProducts,
  initialCategories,
  initialWellnessNeeds = [],
  initialCategoryParam = 'All Products',
  initialWellnessNeedParam = 'All Wellness Needs',
  initialSearchQuery = ''
}: ShopClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();
  const { user } = useAuth();

  // State
  const [products] = useState<Product[]>(initialProducts);
  const [categories] = useState<Category[]>(initialCategories);
  const [wellnessNeeds] = useState<WellnessNeed[]>(initialWellnessNeeds);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);

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

  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    if (initialCategoryParam && initialCategoryParam !== 'All Products') {
      return [initialCategoryParam];
    }
    return [];
  });
  const [selectedWellnessNeed, setSelectedWellnessNeed] = useState<string>(initialWellnessNeedParam);
  const [maxPrice, setMaxPrice] = useState<number>(() => {
    // Will be reset after catalogMaxPrice is computed; start at a high value
    return 9999;
  });
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [addedToCartId, setAddedToCartId] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);
  const [mobileCatDropdownOpen, setMobileCatDropdownOpen] = useState<boolean>(false);
  const mobileCatDropdownRef = React.useRef<HTMLDivElement | null>(null);

  // Close mobile category dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (mobileCatDropdownRef.current && !mobileCatDropdownRef.current.contains(e.target as Node)) {
        setMobileCatDropdownOpen(false);
      }
    };
    if (mobileCatDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [mobileCatDropdownOpen]);

  const activeFilterCount = useMemo(() => {
    return (selectedCategories.length > 0 ? 1 : 0) +
      (selectedWellnessNeed !== 'All Wellness Needs' ? 1 : 0) +
      (maxPrice < catalogMaxPrice ? 1 : 0) +
      (selectedRatings.length > 0 ? 1 : 0) +
      (searchQuery.trim().length > 0 ? 1 : 0);
  }, [selectedCategories, selectedWellnessNeed, maxPrice, catalogMaxPrice, selectedRatings, searchQuery]);

  const itemsPerPage = 12;

  // Keep maxPrice in sync when catalogMaxPrice first resolves
  useEffect(() => {
    setMaxPrice(catalogMaxPrice);
  }, [catalogMaxPrice]);

  // Sync with searchParams on mount or navigation
  useEffect(() => {
    const categoryParam = searchParams.get('category') || searchParams.get('categoryId');
    if (categoryParam) {
      if (categoryParam === 'All Products') {
        setSelectedCategories([]);
      } else {
        setSelectedCategories([categoryParam]);
      }
    }
    const wellnessNeedParam = searchParams.get('wellnessNeed') || searchParams.get('need');
    if (wellnessNeedParam) {
      setSelectedWellnessNeed(wellnessNeedParam);
    }
    const qParam = searchParams.get('q') || searchParams.get('search');
    if (qParam !== null) {
      setSearchQuery(qParam);
    }
  }, [searchParams]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    const params = new URLSearchParams(window.location.search);
    params.delete('q');
    params.delete('search');
    const qs = params.toString();
    router.replace(qs ? `/shop?${qs}` : '/shop', { scroll: false });
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
    const params = new URLSearchParams(window.location.search);
    if (val.trim()) {
      params.set('q', val.trim());
    } else {
      params.delete('q');
      params.delete('search');
    }
    const qs = params.toString();
    router.replace(qs ? `/shop?${qs}` : '/shop', { scroll: false });
  };

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

  // Handle Category selection / toggle (supports multi-select)
  const toggleCategory = (categoryName: string) => {
    setCurrentPage(1);
    if (categoryName === 'All Products') {
      setSelectedCategories([]);
      const params = new URLSearchParams(window.location.search);
      params.delete('category');
      params.delete('categoryId');
      const qs = params.toString();
      router.replace(qs ? `/shop?${qs}` : '/shop', { scroll: false });
      return;
    }

    setSelectedCategories((prev) => {
      const exists = prev.some((c) => c.toLowerCase() === categoryName.toLowerCase());
      const next = exists
        ? prev.filter((c) => c.toLowerCase() !== categoryName.toLowerCase())
        : [...prev, categoryName];

      const params = new URLSearchParams(window.location.search);
      if (next.length === 1) {
        params.set('category', next[0]);
      } else {
        params.delete('category');
        params.delete('categoryId');
      }
      const qs = params.toString();
      router.replace(qs ? `/shop?${qs}` : '/shop', { scroll: false });
      return next;
    });
  };

  const handleCategorySelect = (categoryName: string) => {
    toggleCategory(categoryName);
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
      // 0. Search keyword filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = product.name?.toLowerCase().includes(q);
        const matchesDesc = product.description?.toLowerCase().includes(q);
        const matchesCategory = product.categoryName?.toLowerCase().includes(q);
        const matchesWellness =
          (product.wellnessNeedName && product.wellnessNeedName.toLowerCase().includes(q)) ||
          (product.wellnessNeed && product.wellnessNeed.toLowerCase().includes(q));
        const matchesIngredients = product.ingredients?.toLowerCase().includes(q);
        const matchesBenefits = product.keyBenefits?.toLowerCase().includes(q);

        if (!matchesName && !matchesDesc && !matchesCategory && !matchesWellness && !matchesIngredients && !matchesBenefits) {
          return false;
        }
      }

      // 1. Category filter (supports multiple categories)
      if (selectedCategories.length > 0) {
        const matchesCategory = selectedCategories.some((cat) =>
          (product.categoryId && product.categoryId.toLowerCase() === cat.toLowerCase()) ||
          (product.categoryName && product.categoryName.toLowerCase() === cat.toLowerCase())
        );
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
  }, [products, selectedCategories, selectedWellnessNeed, maxPrice, selectedRatings, searchQuery]);

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

  const isFiltered = selectedCategories.length > 0 || selectedWellnessNeed !== 'All Wellness Needs' || maxPrice < catalogMaxPrice || selectedRatings.length > 0 || searchQuery.trim().length > 0;

  const renderFilterContent = () => (
    <div className="space-y-7">
      {/* Search within shop in Sidebar */}
      <div className="space-y-2 pb-4 border-b border-[#e5ece5]">
        <div className="flex items-center justify-between">
          <h3 className="font-sans text-xs font-bold tracking-[0.15em] text-[#1c3f24] uppercase flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-[#24492d]" />
            <span>SEARCH STORE</span>
          </h3>
          {searchQuery.trim() && (
            <button
              onClick={handleClearSearch}
              className="text-[11px] text-[#557359] hover:text-[#1c3f24] hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Filter botanicals..."
            className="w-full pl-8 pr-7 py-2 rounded-xl text-xs border border-[#ccdacc] bg-[#fbfdfb] text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#24492d] focus:ring-1 focus:ring-[#24492d]"
          />
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-600 rounded"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter by Category (Multi-select) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#e5ece5]">
          <h3 className="font-sans text-xs font-bold tracking-[0.15em] text-[#1c3f24] uppercase">
            CATEGORIES
          </h3>
          {selectedCategories.length > 0 && (
            <button
              onClick={() => toggleCategory('All Products')}
              className="text-[11px] text-[#557359] hover:text-[#1c3f24] hover:underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
        <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
          <button
            onClick={() => toggleCategory('All Products')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
              selectedCategories.length === 0
                ? 'bg-[#24492d] text-white font-bold shadow-xs'
                : 'text-[#4a634f] hover:bg-[#f0f5f0] hover:text-[#1c3f24]'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${
                selectedCategories.length === 0 ? 'bg-white border-white text-[#24492d]' : 'border-stone-300 bg-white'
              }`}>
                {selectedCategories.length === 0 && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
              <span className="truncate">All Products</span>
            </div>
            <span className={`text-[10px] ${selectedCategories.length === 0 ? 'text-white/80' : 'text-[#859c89]'}`}>
              ({products.length})
            </span>
          </button>

          {categoryListWithCounts.filter(c => c.name !== 'All Products').map(({ name, count }) => {
            const isSelected = selectedCategories.some(c => c.toLowerCase() === name.toLowerCase());
            return (
              <button
                key={name}
                onClick={() => toggleCategory(name)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                  isSelected
                    ? 'bg-[#24492d] text-white font-bold shadow-xs'
                    : 'text-[#4a634f] hover:bg-[#f0f5f0] hover:text-[#1c3f24]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-white border-white text-[#24492d]' : 'border-stone-300 bg-white'
                  }`}>
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                  <span className="truncate">{name}</span>
                </div>
                <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-[#859c89]'}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter by Wellness Need */}
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
          <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
            <button
              onClick={() => {
                handleWellnessNeedSelect('All Wellness Needs');
                setMobileFiltersOpen(false);
              }}
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
                  onClick={() => {
                    handleWellnessNeedSelect(name);
                    setMobileFiltersOpen(false);
                  }}
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
    </div>
  );

  return (
    <div className="w-full bg-[#fbfdfb] min-h-screen">
      
      {/* Main Layout Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
          
          {/* ================= DESKTOP LEFT SIDEBAR (hidden on mobile) ================= */}
          <aside className="hidden md:block w-64 flex-shrink-0 bg-white p-5 rounded-2xl border border-[#e8efe8] shadow-2xs sticky top-28">
            {renderFilterContent()}
          </aside>

          {/* ================= MOBILE SLIDE-OVER DRAWER (< md) ================= */}
          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end md:hidden animate-fadeIn">
              <div className="w-full max-w-xs bg-white h-full overflow-y-auto p-5 shadow-2xl flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-[#e5ece5]">
                    <h3 className="font-serif text-lg font-bold text-[#1c3f24] flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-[#24492d]" />
                      <span>Filter Catalog</span>
                    </h3>
                    <button
                      onClick={() => setMobileFiltersOpen(false)}
                      className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
                      aria-label="Close filters"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {renderFilterContent()}
                </div>
                <div className="pt-6 border-t border-[#e5ece5] mt-6">
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="w-full py-3 bg-[#24492d] hover:bg-[#1a3821] text-white text-xs font-bold uppercase rounded-xl tracking-wider shadow-sm transition"
                  >
                    View {filteredProducts.length} Results
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= RIGHT CATALOG AREA ================= */}
          <main className="flex-1 w-full space-y-5">
            
            {/* Mobile Category Dropdown with Multi-Select Options (< md) */}
            <div className="md:hidden relative" ref={mobileCatDropdownRef}>
              <button
                type="button"
                onClick={() => setMobileCatDropdownOpen(prev => !prev)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-[#ccdacc] bg-white text-xs font-semibold text-[#1c3f24] shadow-2xs hover:bg-[#fafcfa] transition cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <Filter className="w-3.5 h-3.5 text-[#24492d] flex-shrink-0" />
                  <span className="truncate">
                    {selectedCategories.length === 0 
                      ? 'All Categories' 
                      : selectedCategories.length === 1
                      ? `Category: ${selectedCategories[0]}`
                      : `${selectedCategories.length} Categories Selected`}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-stone-500 transition-transform flex-shrink-0 ${mobileCatDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {mobileCatDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white rounded-xl border border-[#ccdacc] shadow-xl p-3 max-h-72 overflow-y-auto space-y-1 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 mb-1 border-b border-stone-100 text-[11px]">
                    <span className="font-bold text-[#1c3f24]">Filter by Categories</span>
                    {selectedCategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleCategory('All Products')}
                        className="text-[#24492d] hover:underline font-semibold cursor-pointer"
                      >
                        Reset All
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      toggleCategory('All Products');
                      setMobileCatDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition cursor-pointer ${
                      selectedCategories.length === 0
                        ? 'bg-[#edf5ee] text-[#1c3f24] font-bold'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        selectedCategories.length === 0 ? 'bg-[#24492d] border-[#24492d] text-white' : 'border-stone-300 bg-white'
                      }`}>
                        {selectedCategories.length === 0 && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="truncate">All Products</span>
                    </div>
                    <span className="text-[10px] text-stone-400">({products.length})</span>
                  </button>

                  {categories.map((cat) => {
                    const isSelected = selectedCategories.some(c => c.toLowerCase() === cat.name.toLowerCase());
                    const count = products.filter(
                      (p) =>
                        (p.categoryId && p.categoryId === cat.id) ||
                        (p.categoryName && p.categoryName.toLowerCase() === cat.name.toLowerCase())
                    ).length;

                    return (
                      <button
                        key={`m_cat_${cat.id}`}
                        type="button"
                        onClick={() => toggleCategory(cat.name)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#edf5ee] text-[#1c3f24] font-bold'
                            : 'text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'bg-[#24492d] border-[#24492d] text-white' : 'border-stone-300 bg-white'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="truncate">{cat.name}</span>
                        </div>
                        <span className="text-[10px] text-stone-400">({count})</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mobile Filter & Refine Bar (< md) */}
            <div className="md:hidden flex items-center justify-between gap-3 p-3 bg-white rounded-xl border border-[#e2eae2] shadow-2xs">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#24492d] text-white text-xs font-bold uppercase tracking-wider shadow-xs cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-white text-[#24492d] text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {isFiltered && (
                <button
                  type="button"
                  onClick={() => {
                    handleClearSearch();
                    toggleCategory('All Products');
                    handleWellnessNeedSelect('All Wellness Needs');
                    setMaxPrice(catalogMaxPrice);
                    setSelectedRatings([]);
                  }}
                  className="text-xs text-[#24492d] font-semibold hover:underline cursor-pointer"
                >
                  Reset All
                </button>
              )}
            </div>
            
            {/* Active Filter Banner when search keyword is active */}
            {searchQuery.trim() && (
              <div className="flex items-center justify-between bg-[#edf6ef] border border-[#d2e4d5] px-4 py-2.5 rounded-xl text-xs text-[#1c3f24] animate-fadeIn">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#557359]">Search results for:</span>
                  <span className="font-bold text-[#1c3f24] px-2.5 py-0.5 rounded-md bg-white border border-[#c4dbc8] shadow-2xs">
                    &ldquo;{searchQuery}&rdquo;
                  </span>
                  <span className="text-[11px] text-[#557359]">
                    ({filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found)
                  </span>
                </div>
                <button
                  onClick={handleClearSearch}
                  className="font-bold text-[#24492d] hover:text-[#132c19] hover:underline text-xs flex items-center gap-1 cursor-pointer bg-white/70 hover:bg-white px-2.5 py-1 rounded-md transition-all shadow-2xs"
                >
                  <span>Clear Search</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Active Filter Banner when categories are selected */}
            {selectedCategories.length > 0 && (
              <div className="flex items-center justify-between bg-[#edf6ef] border border-[#d2e4d5] px-4 py-2.5 rounded-xl text-xs text-[#1c3f24] animate-fadeIn flex-wrap gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[#557359] text-[11px]">Categories:</span>
                  {selectedCategories.map((c) => (
                    <span key={c} className="inline-flex items-center gap-1 font-bold text-[#1c3f24] px-2 py-0.5 rounded-md bg-white border border-[#c4dbc8] shadow-2xs text-[11px]">
                      <span className="max-w-[120px] truncate">{c}</span>
                      <button onClick={() => toggleCategory(c)} className="hover:text-rose-600 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <span className="text-[11px] text-[#557359]">
                    ({filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found)
                  </span>
                </div>
                <button
                  onClick={() => toggleCategory('All Products')}
                  className="font-bold text-[#24492d] hover:text-[#132c19] hover:underline text-xs flex items-center gap-1 cursor-pointer bg-white/70 hover:bg-white px-2.5 py-1 rounded-md transition-all shadow-2xs"
                >
                  <span>Clear Categories</span>
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
                {searchQuery.trim() && (
                  <span className="text-[#516b55]"> for &ldquo;<strong className="text-[#1c3f24]">{searchQuery}</strong>&rdquo;</span>
                )}
                {selectedCategories.length > 0 && (
                  <span className="text-[#516b55]"> in <strong className="text-[#1c3f24]">{selectedCategories.join(', ')}</strong></span>
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
                  {searchQuery.trim()
                    ? `No products found matching "${searchQuery}"`
                    : selectedWellnessNeed !== 'All Wellness Needs'
                    ? `No products found for "${selectedWellnessNeed}"`
                    : selectedCategories.length > 0
                    ? `No products found in "${selectedCategories.join(', ')}"`
                    : 'No products match your criteria'}
                </h3>
                <button
                  onClick={() => {
                    handleClearSearch();
                    toggleCategory('All Products');
                    handleWellnessNeedSelect('All Wellness Needs');
                    setMaxPrice(catalogMaxPrice);
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
                  const rawPrice = lowestVariant ? lowestVariant.price : product.price;                  const tiers = parseOfferTiers(product.offerName, Number(product.discountPercentage));
                  const hasOffers = tiers.length > 0;
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

                          {/* Best Seller & Offer Badges Container */}
                          <div className="absolute top-2.5 left-2.5 right-2.5 flex flex-wrap items-start justify-between gap-1.5 z-10 pointer-events-none">
                            {product.isBestSeller && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-[#24492d] text-white shadow-sm flex-shrink-0">
                                Best Seller
                              </span>
                            )}
                            {hasOffers && (
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-amber-500 text-white shadow-sm flex items-center gap-1 max-w-full ${!product.isBestSeller ? 'ml-auto' : ''}`}>
                                <Tag className="w-2.5 h-2.5 flex-shrink-0" />
                                <span className="truncate">{tiers[0].label}</span>
                              </span>
                            )}
                          </div>
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
                      <Link href={`/shop/${product.id}`} className="block group-hover:opacity-95 min-w-0 overflow-hidden">
                        {/* Category & Wellness Need */}
                        <div className="flex items-center gap-1 text-[10px] text-[#718875] font-medium tracking-wide uppercase truncate mb-0.5 min-w-0">
                          <span className="truncate">{product.categoryName || 'Botanical'}</span>
                          <span>•</span>
                          <span className="text-[#24492d] font-semibold truncate">{getProductWellnessNeed(product)}</span>
                        </div>

                        {/* Title - wrapped neatly without boundary overflow */}
                        <h3 className="font-serif text-sm sm:text-[15px] font-bold text-[#1c3f24] group-hover:text-[#2c5c36] transition-colors line-clamp-2 break-words leading-snug" title={product.name}>
                          {product.name}
                        </h3>

                        {/* Price & Weight - Standard Product Price (Not Discount Price) */}
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-[#1c3f24]">
                            ${Number(rawPrice).toFixed(2)}
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

                        {/* All Promotional Offers Displayed With Product (Offer Name Only) */}
                        {tiers.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap mt-1.5">
                            {tiers.map((t) => (
                              <span
                                key={t.id}
                                className="text-[9px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-0.5"
                              >
                                <Tag className="w-2.5 h-2.5 text-amber-600" />
                                <span>{t.label}</span>
                              </span>
                            ))}
                          </div>
                        )}

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
