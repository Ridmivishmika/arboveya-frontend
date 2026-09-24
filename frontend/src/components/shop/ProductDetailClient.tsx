'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Star, 
  Check, 
  Minus, 
  Plus, 
  ShoppingBag, 
  ArrowRight, 
  Leaf, 
  ShieldCheck, 
  HeartHandshake, 
  Sparkles,
  CheckCircle2,
  Store,
  Lock,
  Globe,
  Calendar,
  Truck,
  FileText
} from 'lucide-react';
import { Product, ProductReview } from '@/types';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { submitPublicReview } from '@/lib/api';

// Customer reviews loaded directly from database

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

export default function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const { addToCart } = useCart();
  const { user, token } = useAuth();
  const router = useRouter();
  // Gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Purchase state
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'ingredients' | 'howToUse' | 'reviews'>('description');
  const [addedToast, setAddedToast] = useState(false);
  const [buyNowModal, setBuyNowModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<import('@/types').ProductVariant | undefined>(
    () => {
      if (product.variants && product.variants.length > 0) {
        return [...product.variants].sort((a, b) => a.price - b.price)[0];
      }
      return undefined;
    }
  );

  useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      const lowest = [...product.variants].sort((a, b) => a.price - b.price)[0];
      setSelectedVariant(lowest);
    }
  }, [product.variants]);

  // Available Shipping Options parsed from Product
  const availableShippingOptions = useMemo<import('@/types').ShippingOption[]>(() => {
    if (product.shippingOptions) {
      try {
        const parsed = typeof product.shippingOptions === 'string'
          ? JSON.parse(product.shippingOptions)
          : product.shippingOptions;
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((o: any) => ({
            name: o.name || 'Standard Shipping',
            estimatedDeliveryTime: o.estimatedDeliveryTime || '3-5 business days',
            cost: o.name === 'Free Shipping' ? 0 : (Number(o.cost) || 0)
          }));
        }
      } catch {}
    }
    const fallback: import('@/types').ShippingOption[] = [];
    const name = product.shippingMethod || (product.isFreeShipping ? 'Free Shipping' : 'Standard Shipping');
    const cost = product.isFreeShipping ? 0 : Number(product.shippingCost) || 0;
    fallback.push({
      name,
      estimatedDeliveryTime: product.estimatedDeliveryTime || (cost === 0 ? '5-7 business days' : '3-5 business days'),
      cost
    });
    return fallback;
  }, [product]);

  const [selectedShipping, setSelectedShipping] = useState<import('@/types').ShippingOption>(
    () => availableShippingOptions[0] || { name: 'Standard Shipping', estimatedDeliveryTime: '3-5 business days', cost: 4.99 }
  );

  useEffect(() => {
    if (availableShippingOptions.length > 0) {
      setSelectedShipping(availableShippingOptions[0]);
    }
  }, [availableShippingOptions]);

  const reviewsRef = useRef<HTMLDivElement>(null);

  const scrollToReviews = () => {
    setActiveTab('reviews');
    setTimeout(() => {
      reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  useEffect(() => {
    const fetchProductReviews = async () => {
      try {
        const res = await fetch(`http://localhost:5287/api/products/${product.id}/reviews`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const mapped: ProductReview[] = data.map((r: any) => ({
              id: r.id,
              authorName: r.authorName || r.userFullName || 'Verified Customer',
              rating: r.rating || 5,
              date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recently',
              comment: r.comment ? r.comment.replace(/^\[.*?\]\s*/, '') : '',
              verified: true
            }));
            setReviews(mapped);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch reviews for product:', err);
      }
    };

    fetchProductReviews();
  }, [product.id]);

  // Review state
  const [reviews, setReviews] = useState<ProductReview[]>(() => {
    const raw = (product as any)?.reviews;
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((r: any) => ({
        id: r.id,
        authorName: r.authorName || 'Verified Customer',
        rating: r.rating || 5,
        date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recently',
        comment: r.comment || '',
        verified: true
      }));
    }
    return [];
  });

  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user && !newReviewAuthor) {
      setNewReviewAuthor(user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '');
    }
  }, [user]);

  // Dynamic gallery images
  const galleryImages = useMemo(() => {
    const images: string[] = [];
    if (product?.imageUrl) {
      images.push(product.imageUrl);
    }
    if (product?.galleryImages) {
      const extras = product.galleryImages.split(',').map(s => s.trim()).filter(Boolean);
      images.push(...extras);
    }
    if (images.length === 0) {
      images.push('/images/moringa-capsules.jpg');
    }
    if (images.length === 1) {
      images.push(
        '/images/herbal-detox-tea.jpg',
        '/images/turmeric-curcumin.jpg',
        '/images/ashwagandha-capsules.jpg'
      );
    }
    return images;
  }, [product]);

  // Dynamic key benefits (bullet points with checkmarks)
  const keyBenefitsList = useMemo(() => {
    if (product?.keyBenefits) {
      const items = product.keyBenefits
        .split(/\r?\n/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
      if (items.length > 0) return items;
    }
    return [];
  }, [product?.keyBenefits]);

  const handleAddToCart = () => {
    if (user && (user.role === 'Seller' || user.role === 'Admin')) return;
    addToCart(product, quantity, selectedVariant, selectedShipping);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  const handleBuyNow = () => {
    if (user && (user.role === 'Seller' || user.role === 'Admin')) return;
    addToCart(product, quantity, selectedVariant, selectedShipping);
    router.push('/checkout');
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Only registered customers can submit a review. Please sign in.');
      router.push('/login');
      return;
    }
    const cleanAuthor = newReviewAuthor.trim() || user?.fullName || 'Verified Customer';
    const cleanComment = newReviewComment.trim();
    if (!cleanComment) return;

    try {
      setSubmittingReview(true);
      const created = await submitPublicReview(
        product.id,
        {
          authorName: cleanAuthor,
          rating: newReviewRating,
          comment: cleanComment,
          userId: user?.id,
          userEmail: user?.email
        },
        token || undefined
      );

      const newRev: ProductReview = {
        id: created?.id || 'rev-' + Date.now(),
        authorName: cleanAuthor,
        rating: newReviewRating,
        comment: cleanComment,
        date: 'Just now',
        verified: true
      };

      setReviews(prev => [newRev, ...prev]);
      setNewReviewComment('');
      setReviewSuccessMsg('Thank you! Your botanical review is now live! Thank you for sharing your experience.');
      setTimeout(() => setReviewSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Error submitting review:', err);
      alert(err.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const categoryName = product.categoryName || 'Supplements';
  const totalRatingSum = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
  const liveAvg = reviews.length > 0 ? totalRatingSum / reviews.length : (product.averageRating ?? product.rating ?? 0);
  const ratingValue = reviews.length > 0 ? Math.round(liveAvg) : 0;

  return (
    <div className="min-h-screen bg-white text-[#1c3f24] font-sans">
      
      {/* Top Banner: Free Shipping */}
      <div className="bg-[#24492d] text-white text-[11px] sm:text-xs tracking-wider py-2 px-4 text-center font-medium">
        Free Shipping on Orders Over $50
      </div>

      {/* Breadcrumb Navigation (Matches Screenshot 2) */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 text-xs text-[#718875] border-b border-[#f2f6f2]">
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-[#1c3f24] transition-colors">Home</Link>
          <span>&gt;</span>
          <Link href="/shop" className="hover:text-[#1c3f24] transition-colors">Shop</Link>
          <span>&gt;</span>
          <span className="text-[#516b55] font-medium">{categoryName}</span>
          <span>&gt;</span>
          <span className="text-[#1c3f24] font-semibold">{product.name}</span>
        </div>
      </nav>

      {/* Added to Cart Toast Notification */}
      {addedToast && (
        <div className="fixed top-24 right-5 z-50 bg-[#1c3f24] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-[#3b6343] animate-slideIn">
          <CheckCircle2 className="w-5 h-5 text-[#86efac]" />
          <div>
            <p className="text-xs font-bold">Added to Cart!</p>
            <p className="text-[11px] text-[#c2dec6]">{quantity}x {product.name}</p>
          </div>
          <Link
            href="/cart"
            className="ml-2 px-3 py-1 bg-[#86efac] text-[#14331b] rounded text-[10px] font-bold uppercase hover:bg-white transition-colors"
          >
            View Cart
          </Link>
        </div>
      )}

      {/* Main Product Showcase (Matches Screenshot 2) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">

          {/* ================= LEFT GALLERY (5-6 Columns) ================= */}
          <div className="lg:col-span-6 flex flex-col-reverse sm:flex-row gap-4">
            
            {/* Vertical Thumbnails Strip (Matches Screenshot 2) */}
            <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0">
              {galleryImages.map((img, idx) => {
                const isSelected = selectedImageIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#f4f7f4] border-2 transition-all flex-shrink-0 cursor-pointer ${
                      isSelected
                        ? 'border-[#24492d] shadow-sm ring-1 ring-[#24492d]'
                        : 'border-[#e4ece4] hover:border-[#ccdacc]'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                );
              })}
            </div>

            {/* Main Featured Photo Box */}
            <div className="relative flex-1 aspect-square rounded-2xl overflow-hidden bg-[#f4f7f4] border border-[#e4ece4] shadow-xs group">
              <Image
                src={galleryImages[selectedImageIndex] || galleryImages[0]}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 600px"
                className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />

              {product.isBestSeller && (
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-[#24492d] text-white shadow-md">
                  Best Seller
                </span>
              )}
            </div>
          </div>

          {/* ================= RIGHT PRODUCT INFO (6-7 Columns) ================= */}
          <div className="lg:col-span-6 space-y-6">

            {/* Title & Reviews */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold tracking-wider uppercase text-[#2d5c37]">
                  {categoryName}
                </span>
                {(selectedVariant?.weight || product.weight) && (
                  <span className="text-xs text-[#6e8a73]">
                    • {selectedVariant?.weight || product.weight}
                  </span>
                )}
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1c3f24] tracking-tight">
                {product.name}
              </h1>

              {/* Star Rating & Count (Clickable to jump directly to reviews) */}
              <div className="flex items-center gap-2 mt-2.5">
                <button
                  type="button"
                  onClick={scrollToReviews}
                  className="flex items-center text-[#24492d] gap-0.5 group cursor-pointer transition-transform hover:scale-105"
                  title="View customer reviews"
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        reviews.length > 0 && i < ratingValue
                          ? 'fill-[#24492d] text-[#24492d]'
                          : 'text-[#d6dfd7]'
                      }`}
                    />
                  ))}
                </button>
                <button
                  type="button"
                  onClick={scrollToReviews}
                  className="text-xs text-[#2E4D38] hover:text-[#1c3f24] font-semibold hover:underline transition-colors cursor-pointer"
                  title="Click to view all reviews"
                >
                  ({reviews.length} {reviews.length === 1 ? 'Customer Review' : 'Customer Reviews'})
                </button>
              </div>
            </div>

              {/* Price & Selected Weight – shows selected variant price and weight */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-2xl sm:text-3xl font-bold text-[#1c3f24]">
                ${Number(selectedVariant?.price ?? product.price).toFixed(2)}
              </span>
              {(selectedVariant?.weight || product.weight) && (
                <span className="inline-flex items-center text-xs sm:text-sm font-semibold text-[#24492d] bg-[#eef6f0] border border-[#c6dfca] px-2.5 py-1 rounded-md">
                  {selectedVariant?.weight || product.weight}
                </span>
              )}
            </div>

            {/* Botanical Origin, Condition & Delivery Badges */}
            <div className="flex items-center gap-2 flex-wrap text-[11px] pt-1">
              {product.countryOfOrigin && (
                <span className="inline-flex items-center gap-1 font-semibold text-[#24492d] bg-[#edf6ef] border border-[#bcdbc0] px-2 py-0.5 rounded-full">
                  <Globe className="w-3 h-3 text-[#24492d]" />
                  <span>Origin: {product.countryOfOrigin}</span>
                </span>
              )}
              {product.condition && (
                <span className="inline-flex items-center gap-1 font-semibold text-stone-700 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full">
                  <span>{product.condition}</span>
                </span>
              )}
              {product.isFreeShipping && (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <Truck className="w-3 h-3 text-emerald-700" />
                  <span>Free Shipping</span>
                </span>
              )}
              {product.expiryDate && (
                <span className="inline-flex items-center gap-1 text-stone-500 bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-full">
                  <Calendar className="w-3 h-3 text-stone-400" />
                  <span>Expiry: {new Date(product.expiryDate).toLocaleDateString()}</span>
                </span>
              )}
            </div>

            {/* Variant Pill Selector – buyer can select options */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#3b5940] uppercase tracking-wider">
                    Select Weight / Option
                  </p>
                  {selectedVariant && (
                    <span className="text-xs text-[#24492d] font-bold">
                      Selected: {selectedVariant.weight} &bull; ${selectedVariant.price.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {product.variants.map((v) => {
                    const isActive = selectedVariant?.weight === v.weight;
                    return (
                      <button
                        key={v.weight}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`px-3.5 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#24492d] text-white border-[#24492d] shadow-md ring-2 ring-[#24492d]/20'
                            : 'bg-white text-[#3b5940] border-[#ccdacc] hover:border-[#24492d] hover:bg-[#edf5ee]'
                        }`}
                      >
                        <span>{v.weight}</span>
                        <span className="ml-1.5 opacity-90">&bull; ${v.price.toFixed(2)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Short Description */}
            <p className="text-xs sm:text-sm text-[#4d6652] leading-relaxed">
              {product.description || null}
            </p>

            {/* Bullet Points with Green Checkmarks (Matches Screenshot 2) */}
            {keyBenefitsList.length > 0 && (
              <div className="space-y-2.5 pt-1">
                {keyBenefitsList.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs sm:text-[13px] font-medium text-[#1c3f24]">
                    <span className="w-4 h-4 rounded-full bg-[#edf6ef] text-[#24492d] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            )}

            {/* In Stock Badge */}
            <div className="flex items-center gap-2 text-xs font-semibold text-[#16a34a]">
              <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
              <span>In Stock ({selectedVariant
                ? `${selectedVariant.stockQuantity} units available`
                : product.stockQuantity > 0 ? `${product.stockQuantity} units available` : 'Ready to Ship'})
              </span>
            </div>

            {/* Buyer Delivery & Shipping Method Selector */}
            <div className="space-y-2 p-3.5 rounded-xl bg-[#f7faf7] border border-[#e0ede2]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1c3f24] flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#24492d]" />
                  Select Delivery Method:
                </span>
                <span className="text-xs font-bold text-[#24492d]">
                  {selectedShipping.cost === 0 ? 'FREE Shipping' : `+$${selectedShipping.cost.toFixed(2)} USD`}
                </span>
              </div>
              <div className={`grid gap-2 ${
                availableShippingOptions.length === 1
                  ? 'grid-cols-1'
                  : availableShippingOptions.length === 3
                  ? 'grid-cols-1 sm:grid-cols-3'
                  : 'grid-cols-1 sm:grid-cols-2'
              }`}>
                {availableShippingOptions.map((opt, idx) => {
                  const isSelected = selectedShipping.name === opt.name;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedShipping(opt)}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#24492d] bg-white ring-2 ring-[#24492d]/20 shadow-xs'
                          : 'border-[#d0dfd2] bg-white/70 hover:border-[#24492d]/50 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 w-full">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className={`w-3 h-3 rounded-full border flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'border-[#24492d] bg-[#24492d]' : 'border-stone-400 bg-white'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="text-xs font-bold text-[#1c3f24] truncate">{opt.name}</span>
                        </div>
                        <span className={`text-[11px] font-bold flex-shrink-0 ${opt.cost === 0 ? 'text-emerald-700' : 'text-[#1c3f24]'}`}>
                          {opt.cost === 0 ? 'FREE' : `$${opt.cost.toFixed(2)}`}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#557159] mt-1 pl-4.5">
                        Est: {opt.estimatedDeliveryTime}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector + Action Buttons (Disabled for Sellers and Admins, Active for Buyers & Guests) */}
            {user && (user.role === 'Seller' || user.role === 'Admin') ? (
              <div className="rounded-xl border border-[#d6dfd7] bg-[#f8faf8] p-4.5 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 text-[#24492d] font-bold text-xs uppercase tracking-wider">
                  <span className="p-1 rounded-md bg-[#edf5ee] text-[#24492d]">
                    {user.role === 'Admin' ? <ShieldCheck className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                  </span>
                  <span>{user.role === 'Admin' ? 'Admin Preview Mode' : 'Seller Preview Mode'}</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {user.role === 'Admin' 
                    ? "You are viewing this botanical product's specifications and details as an Arboveya Administrator."
                    : "You are viewing this botanical product's specifications and ingredients as an Arboveya Herbal Merchant."}
                  <strong className="text-[#1c3f24] font-semibold block mt-1">
                    Purchasing products is disabled for {user.role === 'Admin' ? 'administrator' : 'seller'} accounts.
                  </strong>
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-2.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-100 text-stone-500 text-xs font-semibold cursor-not-allowed border border-stone-200">
                    <Lock className="w-3.5 h-3.5 text-stone-400" />
                    <span>Purchase Disabled for {user.role === 'Admin' ? 'Administrators' : 'Sellers'}</span>
                  </div>
                  <Link
                    href={user.role === 'Admin' ? '/admin/products' : '/seller'}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#24492d] hover:bg-[#1a3821] text-white text-xs font-bold transition shadow-2xs"
                  >
                    {user.role === 'Admin' ? <ShieldCheck className="w-3.5 h-3.5" /> : <Store className="w-3.5 h-3.5" />}
                    <span>{user.role === 'Admin' ? 'Go to Admin Portal' : 'Go to Seller Studio'}</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  {/* Quantity Pill */}
                  <div className="flex items-center border border-[#ccdacc] rounded-lg overflow-hidden bg-white">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="p-2.5 sm:p-3 hover:bg-[#f3f7f3] text-[#3e5642] transition-colors cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center text-xs font-bold text-[#1c3f24]">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(q => q + 1)}
                      className="p-2.5 sm:p-3 hover:bg-[#f3f7f3] text-[#3e5642] transition-colors cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* ADD TO CART Button (Dark Forest Green) */}
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 py-3 px-6 rounded-lg bg-[#24492d] hover:bg-[#1a3821] text-white text-xs sm:text-sm font-bold tracking-[0.12em] uppercase shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>ADD TO CART</span>
                  </button>
                </div>

                {/* BUY IT NOW Button (Outline Button) */}
                <button
                  onClick={handleBuyNow}
                  className="w-full py-3 px-6 rounded-lg border-2 border-[#24492d] hover:bg-[#edf6ef] text-[#24492d] text-xs sm:text-sm font-bold tracking-[0.12em] uppercase transition-all cursor-pointer"
                >
                  BUY IT NOW
                </button>
              </div>
            )}

            {/* Feature Badges Row (Matches Screenshot 2: 100% Natural, No Chemicals, Vegan, Non GMO) */}
            <div className="grid grid-cols-4 gap-2 pt-6 border-t border-[#f0f4f0] text-center">
              <div className="flex flex-col items-center gap-1.5 p-2">
                <Leaf className="w-5 h-5 text-[#24492d]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3e5642]">100% Natural</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-2">
                <ShieldCheck className="w-5 h-5 text-[#24492d]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3e5642]">No Chemicals</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-2">
                <HeartHandshake className="w-5 h-5 text-[#24492d]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3e5642]">Vegan</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-2">
                <Sparkles className="w-5 h-5 text-[#24492d]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3e5642]">Non GMO</span>
              </div>
            </div>

          </div>
        </div>

        {/* ================= TABBED INFORMATION SECTION (Matches Screenshot 2) ================= */}
        <div ref={reviewsRef} className="mt-16 sm:mt-24 border-t border-[#e5ebe5] pt-8">
          
          {/* Tabs Navigation */}
          <div className="flex items-center justify-center gap-4 sm:gap-10 border-b border-[#e5ebe5] pb-3 text-xs sm:text-sm font-bold tracking-[0.12em] uppercase flex-wrap">
            {(['description', 'specifications', 'ingredients', 'howToUse', 'reviews'] as const).map((tabKey) => {
              const isActive = activeTab === tabKey;
              const labels = {
                description: 'DESCRIPTION',
                specifications: 'SPECIFICATIONS & SHIPPING',
                ingredients: 'INGREDIENTS',
                howToUse: 'HOW TO USE',
                reviews: `REVIEWS (${reviews.length})`
              };

              return (
                <button
                  key={tabKey}
                  onClick={() => setActiveTab(tabKey)}
                  className={`pb-3 transition-colors relative cursor-pointer ${
                    isActive
                      ? 'text-[#1c3f24] font-bold'
                      : 'text-[#859c89] hover:text-[#1c3f24]'
                  }`}
                >
                  <span>{labels[tabKey]}</span>
                  {isActive && (
                    <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#24492d]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content Box */}
          <div className="py-8 max-w-3xl mx-auto text-xs sm:text-sm text-[#4d6652] leading-relaxed">
            
            {/* Description Tab */}
            {activeTab === 'description' && (
              <div className="space-y-4 animate-fadeIn">
                {product.description ? (
                  <p className="whitespace-pre-line text-[#35523b]">
                    {product.description}
                  </p>
                ) : (
                  <p className="text-[#859c89] italic">No description provided for this product.</p>
                )}
              </div>
            )}

            {/* Specifications & Shipping Tab */}
            {activeTab === 'specifications' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Specifications Box */}
                <div className="p-5 rounded-xl bg-[#f7faf7] border border-[#e2eae2] space-y-4">
                  <h4 className="font-semibold text-[#1c3f24] text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#24492d]" />
                    Product Specifications
                  </h4>
                  {product.specifications ? (
                    <p className="text-sm text-[#1c3f24] leading-relaxed whitespace-pre-line">
                      {product.specifications}
                    </p>
                  ) : (
                    <p className="text-xs text-stone-500 italic">Standard botanical purity verified by Arboveya.</p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs border-t border-[#e2eae2]">
                    <div>
                      <span className="text-stone-400 font-bold block uppercase text-[10px]">Country of Origin:</span>
                      <span className="font-semibold text-[#1c3f24]">{product.countryOfOrigin || 'Sri Lanka'}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 font-bold block uppercase text-[10px]">Product Condition:</span>
                      <span className="font-semibold text-[#1c3f24]">{product.condition || 'Brand New / Fresh Harvest'}</span>
                    </div>
                    {product.manufactureDate && (
                      <div>
                        <span className="text-stone-400 font-bold block uppercase text-[10px]">Manufacture Date:</span>
                        <span className="text-[#1c3f24]">{new Date(product.manufactureDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {product.expiryDate && (
                      <div>
                        <span className="text-stone-400 font-bold block uppercase text-[10px]">Expiry / Best Before:</span>
                        <span className="text-[#1c3f24]">{new Date(product.expiryDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Schedule & Return Policy Box */}
                <div className="p-5 rounded-xl bg-[#f7faf7] border border-[#e2eae2] space-y-4">
                  <h4 className="font-semibold text-[#1c3f24] text-sm flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#24492d]" />
                    Shipping &amp; Return Policy
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-stone-400 font-bold block uppercase text-[10px] mb-2">Available Shipping Options:</span>
                      <div className={`grid gap-2.5 ${
                        availableShippingOptions.length === 1 
                          ? 'grid-cols-1' 
                          : availableShippingOptions.length === 2 
                          ? 'grid-cols-1 sm:grid-cols-2' 
                          : 'grid-cols-1 sm:grid-cols-3'
                      }`}>
                        {availableShippingOptions.map((opt, idx) => (
                          <div key={idx} className="p-3 bg-white rounded-lg border border-[#e0ede2] space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-[#1c3f24]">{opt.name}</span>
                              <span className={`text-[11px] font-bold ${opt.cost === 0 ? 'text-emerald-700' : 'text-[#1c3f24]'}`}>
                                {opt.cost === 0 ? 'FREE' : `$${opt.cost.toFixed(2)}`}
                              </span>
                            </div>
                            <p className="text-[10px] text-[#637d68]">Est: {opt.estimatedDeliveryTime}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div>
                        <span className="text-stone-400 font-bold block uppercase text-[10px]">Handling &amp; Dispatch:</span>
                        <span className="text-[#1c3f24]">{product.handlingTime || 'Within 24-48 hours'}</span>
                      </div>
                    </div>
                  </div>

                  {product.returnPolicy && (
                    <div className="pt-2 border-t border-[#e2eae2] text-xs">
                      <span className="text-stone-400 font-bold block uppercase text-[10px] mb-1">Return Policy:</span>
                      <p className="text-stone-700 leading-relaxed">{product.returnPolicy}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ingredients Tab */}
            {activeTab === 'ingredients' && (
              <div className="space-y-4 animate-fadeIn">
                <p className="font-semibold text-[#1c3f24]">Botanical Ingredients & Formula:</p>
                {product.ingredients ? (
                  <div className="p-5 rounded-xl bg-[#f7faf7] border border-[#e2eae2] space-y-3">
                    <p className="text-sm text-[#1c3f24] font-medium leading-relaxed whitespace-pre-line">
                      {product.ingredients}
                    </p>
                  </div>
                ) : (
                  <p className="text-[#859c89] italic">No ingredients specified for this product.</p>
                )}
              </div>
            )}

            {/* How To Use Tab */}
            {activeTab === 'howToUse' && (
              <div className="space-y-4 animate-fadeIn">
                <p className="font-semibold text-[#1c3f24]">Recommended Daily Ritual & Directions:</p>
                {product.howToUse ? (
                  <div className="p-5 rounded-xl bg-[#f7faf7] border border-[#e2eae2] space-y-3">
                    <p className="text-sm text-[#1c3f24] leading-relaxed whitespace-pre-line">
                      {product.howToUse}
                    </p>
                  </div>
                ) : (
                  <p className="text-[#859c89] italic">No usage instructions provided for this product.</p>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e5ebe5]">
                  <div>
                    <h3 className="font-serif text-sm sm:text-base font-bold text-[#1c3f24]">
                      Customer Reviews & Experiences ({reviews.length})
                    </h3>
                    <p className="text-xs text-[#637d68]">
                      Authentic ratings and holistic wellness reviews from verified purchasers.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#edf5ee] px-3 py-1 rounded-full text-xs font-semibold text-[#24492d] self-start sm:self-auto">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Customer Reviews</span>
                  </div>
                </div>

                {reviews.length === 0 ? (
                  <div className="py-12 text-center text-stone-400 bg-[#fafcfa] rounded-2xl border border-stone-200/60 p-6">
                    <p className="text-sm font-medium text-stone-600">
                      No reviews published yet for this botanical remedy.
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                      Verified customers can review their remedies in the Buyer Dashboard.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 divide-y divide-[#f0f4f0]">
                    {reviews.map((rev, idx) => (
                      <div key={rev.id || idx} className="pt-4 first:pt-0 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#1c3f24]">{rev.authorName}</span>
                            {rev.verified && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-[#16a34a] font-semibold bg-[#ecf7ed] px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Verified Customer</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#859c89]">{rev.date}</span>
                        </div>
                        <div className="flex items-center text-[#24492d]">
                          {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-[#24492d] text-[#24492d]" />
                          ))}
                        </div>
                        <p className="text-xs text-[#4d6652] leading-relaxed">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Write a Review Section (Registered Customers Only) */}
                {user ? (
                  <div className="mt-8 pt-6 border-t border-[#e5ebe5]">
                    <h4 className="font-serif text-sm font-bold text-[#1c3f24] mb-3">
                      Write a Review
                    </h4>

                    {reviewSuccessMsg && (
                      <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{reviewSuccessMsg}</span>
                      </div>
                    )}

                    <form onSubmit={handleAddReview} className="space-y-3.5 bg-[#fbfdfb] p-4 rounded-xl border border-[#e2eae2]">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                            Your Rating
                          </label>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setNewReviewRating(star)}
                                className="p-1 -ml-1 text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                              >
                                <Star
                                  className={`w-5 h-5 ${
                                    star <= newReviewRating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-stone-300'
                                  }`}
                                />
                              </button>
                            ))}
                            <span className="text-xs font-bold text-stone-600 ml-1.5">
                              {newReviewRating} / 5 Stars
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1 sm:w-1/2">
                          <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                            Your Name
                          </label>
                          <input
                            type="text"
                            value={newReviewAuthor}
                            onChange={(e) => setNewReviewAuthor(e.target.value)}
                            placeholder="Your name or nickname"
                            required
                            className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                          Review Feedback
                        </label>
                        <textarea
                          value={newReviewComment}
                          onChange={(e) => setNewReviewComment(e.target.value)}
                          placeholder="How did this botanical remedy feel or work for you?"
                          rows={3}
                          required
                          className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d] resize-none"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="px-5 py-2 rounded-lg bg-[#24492d] hover:bg-[#1a3821] text-white text-xs font-bold uppercase tracking-wider shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
                        >
                          {submittingReview ? 'Submitting...' : 'Submit Review'}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="mt-8 pt-6 border-t border-[#e5ebe5]">
                    <div className="p-4 rounded-xl bg-[#f8faf8] border border-[#e2eae2] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                      <div className="flex items-center gap-2.5">
                        <Lock className="w-4 h-4 text-[#4a6b51] shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-[#1c3f24]">
                            Reviews are available only for registered customers
                          </p>
                          <p className="text-[11px] text-[#637d68]">
                            Please sign in or create an account to share your experience with this remedy.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href="/login"
                          className="px-3.5 py-1.5 rounded-lg bg-[#24492d] hover:bg-[#1a3821] text-white text-[11px] font-bold uppercase tracking-wider transition-colors"
                        >
                          Sign In
                        </Link>
                        <Link
                          href="/register"
                          className="px-3.5 py-1.5 rounded-lg border border-[#24492d] text-[#24492d] hover:bg-[#edf5ee] text-[11px] font-bold uppercase tracking-wider transition-colors"
                        >
                          Register
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* ================= YOU MAY ALSO LIKE SECTION (Matches Screenshot 2) ================= */}
        <div className="mt-16 sm:mt-24 border-t border-[#e5ebe5] pt-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-[0.1em] text-[#1c3f24] uppercase">
              YOU MAY ALSO LIKE
            </h2>
            <Link
              href="/shop"
              className="text-xs font-bold text-[#24492d] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {relatedProducts.map((rel) => {
              const hasRelReviews = (rel.reviewCount ?? 0) > 0;
              const relRating = hasRelReviews ? Math.round(rel.averageRating ?? rel.rating ?? 0) : 0;
              const relLowestVariant = rel.variants && rel.variants.length > 0
                ? [...rel.variants].sort((a, b) => a.price - b.price)[0]
                : undefined;
              const relDisplayPrice = relLowestVariant ? relLowestVariant.price : rel.price;
              const relDisplayWeight = relLowestVariant ? relLowestVariant.weight : rel.weight;

              return (
                <Link
                  key={rel.id}
                  href={`/shop/${rel.id}`}
                  className="group flex flex-col justify-between"
                >
                  <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-[#f4f7f4] border border-[#e4ece4] mb-3 group-hover:border-[#24492d]/40 transition-all">
                    {rel.imageUrl ? (
                      <Image
                        src={rel.imageUrl}
                        alt={rel.name}
                        fill
                        sizes="250px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#75947b]">
                        <Leaf className="w-8 h-8" />
                      </div>
                    )}
                    {rel.isBestSeller && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-[#24492d] text-white shadow-sm">
                        Best Seller
                      </span>
                    )}
                  </div>
                  <h4 className="font-serif text-sm font-bold text-[#1c3f24] group-hover:text-[#2c5c36] transition-colors line-clamp-1">
                    {rel.name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <p className="text-xs font-bold text-[#1c3f24]">
                      ${Number(relDisplayPrice).toFixed(2)}
                    </p>
                    {relDisplayWeight && (
                      <span className="text-[10px] font-semibold text-[#24492d] bg-[#edf5ee] border border-[#d2e4d5] px-1.5 py-0.5 rounded">
                        {relDisplayWeight}
                      </span>
                    )}
                    {rel.variants && rel.variants.length > 1 && (
                      <span className="text-[10px] text-[#6b8570]">({rel.variants.length} options)</span>
                    )}
                  </div>
                  <div className="flex items-center text-[#24492d] mt-1 gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < relRating
                            ? 'fill-[#24492d] text-[#24492d]'
                            : 'text-[#d6dfd7]'
                        }`}
                      />
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

      </div>

      {/* Quick Buy Now Modal */}
      {buyNowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-[#dbe6dc] text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#edf6ef] text-[#24492d] flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#1c3f24]">Instant Botanical Checkout</h3>
            <p className="text-xs text-[#526a57]">
              Proceed to checkout {quantity}x <span className="font-bold text-[#1c3f24]">{product.name}</span>
              {selectedVariant && ` (${selectedVariant.weight})`} for ${ (Number(selectedVariant?.price ?? product.price) * quantity).toFixed(2)} USD.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setBuyNowModal(false)}
                className="px-4 py-2 rounded-lg border border-[#ccdacc] text-xs font-semibold text-[#4d6b53] hover:bg-[#f2f6f3]"
              >
                Continue Shopping
              </button>
              <Link
                href="/cart"
                className="px-5 py-2 rounded-lg bg-[#24492d] hover:bg-[#1a3821] text-white text-xs font-bold uppercase tracking-wider shadow-sm"
              >
                Go to Cart
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
