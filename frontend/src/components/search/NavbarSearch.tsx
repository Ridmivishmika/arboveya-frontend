'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X, Loader2, ArrowRight, Sparkles, Tag, ShoppingBag } from 'lucide-react';
import { Product } from '@/types';
import { getProducts, resolveBackendImageUrl } from '@/lib/api';

interface NavbarSearchProps {
  placeholder?: string;
  variant?: 'desktop' | 'mobile-bar' | 'mobile-drawer';
  autoFocus?: boolean;
  onClose?: () => void;
}

export default function NavbarSearch({
  placeholder = 'Search botanicals, remedies...',
  variant = 'desktop',
  autoFocus = false,
  onClose,
}: NavbarSearchProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on route change
  useEffect(() => {
    setIsOpen(false);
    setSelectedIndex(-1);
  }, [pathname]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  // Debounced search fetching
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const items = await getProducts({ search: trimmed, pageSize: 6 });
        setResults(items || []);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (err) {
        console.warn('Navbar search error:', err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query]);

  // Navigate to shop catalog with query parameter
  const executeSearch = useCallback((searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    setIsOpen(false);
    onClose?.();
    router.push(`/shop?q=${encodeURIComponent(trimmed)}`);
  }, [router, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && results[selectedIndex]) {
      const selectedProduct = results[selectedIndex];
      setIsOpen(false);
      onClose?.();
      router.push(`/shop/${selectedProduct.id}`);
      return;
    }
    executeSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Keyboard navigation inside search dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
      return;
    }

    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    }
  };

  // Format product lowest price
  const formatPrice = (p: Product) => {
    if (p.variants && p.variants.length > 0) {
      const lowest = Math.min(...p.variants.map((v) => v.price));
      return `$${lowest.toFixed(2)}`;
    }
    return `$${Number(p.price || 0).toFixed(2)}`;
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center w-full"
        role="search"
      >
        <div className="relative w-full flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim().length >= 2) {
                setIsOpen(true);
              }
            }}
            onFocus={() => {
              if (query.trim().length >= 2 && results.length > 0) {
                setIsOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
            autoFocus={autoFocus}
            placeholder={placeholder}
            autoComplete="off"
            spellCheck="false"
            className={`w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 outline-none
              bg-[#f7faf7] hover:bg-[#f1f6f1] focus:bg-white
              border border-[#cddccd] hover:border-[#adc7b0] focus:border-[#24492d]
              text-[#18311d] placeholder:text-[#6b8570]
              focus:ring-2 focus:ring-[#24492d]/15 shadow-2xs`}
          />

          {/* Left search icon button */}
          <button
            type="submit"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#46694c] hover:text-[#1c3f24] transition-colors p-0.5 cursor-pointer"
            title="Search"
          >
            <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* Right action controls */}
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-[#24492d] mr-1" />
            )}

            {query && !isLoading && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition cursor-pointer"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

          </div>
        </div>
      </form>

      {/* Autocomplete Results Dropdown */}
      {isOpen && query.trim().length >= 2 && (
        <div
          className={`absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-[#d6e3d7] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 ${
            variant === 'mobile-drawer' ? 'max-h-[360px]' : 'max-h-[440px]'
          } flex flex-col`}
        >
          {/* Dropdown Header */}
          <div className="px-4 py-2 bg-[#f4f8f4] border-b border-[#e2ece2] flex items-center justify-between text-[11px] font-semibold text-[#2f4f34]">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#24492d]" />
              Matching Botanicals ({results.length})
            </span>
            <span className="text-[10px] text-[#6d8a71] hidden sm:inline">
              Press Enter to view all
            </span>
          </div>

          {/* Results List */}
          <div className="overflow-y-auto divide-y divide-[#edf3ed] flex-1">
            {results.length > 0 ? (
              results.map((product, idx) => {
                const isSelected = selectedIndex === idx;
                const lowestPrice = formatPrice(product);
                const categoryBadge = product.categoryName || product.wellnessNeedName;

                return (
                  <Link
                    key={product.id}
                    href={`/shop/${product.id}`}
                    onClick={() => {
                      setIsOpen(false);
                      onClose?.();
                    }}
                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors group cursor-pointer ${
                      isSelected ? 'bg-[#edf5ee]' : 'hover:bg-[#f6faf6]'
                    }`}
                  >
                    {/* Thumbnail Image */}
                    <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-[#d6e2d7] bg-[#f9faf9] flex-shrink-0">
                      <Image
                        src={resolveBackendImageUrl(product.imageUrl)}
                        alt={product.name}
                        fill
                        sizes="44px"
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    {/* Product Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs sm:text-sm font-semibold text-stone-900 group-hover:text-[#1c3f24] truncate transition-colors">
                          {product.name}
                        </h4>
                        <span className="text-xs font-bold text-[#1c3f24] flex-shrink-0">
                          {lowestPrice}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        {categoryBadge && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#edf5ee] text-[#24492d] border border-[#dbe8dc] truncate max-w-[150px]">
                            <Tag className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="truncate">{categoryBadge}</span>
                          </span>
                        )}
                        {product.weight && (
                          <span className="text-[10px] text-stone-500">
                            {product.weight}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : !isLoading ? (
              <div className="p-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#edf5ee] text-[#24492d] flex items-center justify-center mx-auto">
                  <Search className="w-5 h-5 opacity-70" />
                </div>
                <p className="text-xs font-semibold text-stone-800">
                  No botanicals found for &ldquo;{query}&rdquo;
                </p>
                <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                  Try checking your spelling or search using another herbal category or benefit.
                </p>
                <button
                  type="button"
                  onClick={() => executeSearch('')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#24492d] hover:underline pt-1 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Browse full catalog</span>
                </button>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#24492d]" />
                <span>Searching botanical store...</span>
              </div>
            )}
          </div>

          {/* Dropdown Footer: See all results */}
          {results.length > 0 && (
            <div className="p-2.5 bg-[#f7faf7] border-t border-[#e2ece2] flex items-center justify-between">
              <button
                type="button"
                onClick={() => executeSearch(query)}
                className="w-full py-2 px-3 rounded-xl bg-[#24492d] hover:bg-[#1a3821] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>View all results for &ldquo;{query}&rdquo;</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
