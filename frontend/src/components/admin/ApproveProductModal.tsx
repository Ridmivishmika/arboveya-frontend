'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Tag, 
  User, 
  AlertCircle, 
  Package, 
  Plus, 
  Sparkles, 
  Layers,
  DollarSign
} from 'lucide-react';
import { Product, Category, WellnessNeed } from '@/types';
import { createCategory, createWellnessNeed, resolveBackendImageUrl } from '@/lib/api';

interface ApproveProductModalProps {
  product: Product | null;
  categories: Category[];
  wellnessNeeds?: WellnessNeed[];
  isOpen: boolean;
  onClose: () => void;
  onApprove: (productId: string, categoryId: string, wellnessNeedId?: string, feedback?: string) => Promise<void>;
  onReject: (productId: string, feedback?: string) => Promise<void>;
  onCategoryCreated?: (newCategory: Category) => void;
  onWellnessNeedCreated?: (newNeed: WellnessNeed) => void;
}

export default function ApproveProductModal({
  product,
  categories,
  wellnessNeeds = [],
  isOpen,
  onClose,
  onApprove,
  onReject,
  onCategoryCreated,
  onWellnessNeedCreated
}: ApproveProductModalProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedWellnessNeedId, setSelectedWellnessNeedId] = useState<string>('');
  const [adminFeedback, setAdminFeedback] = useState<string>('Approved for public marketplace display.');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick Inline Category Creation
  const [isCreatingCat, setIsCreatingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [catSubmitting, setCatSubmitting] = useState(false);

  // Quick Inline Wellness Need Creation
  const [isCreatingNeed, setIsCreatingNeed] = useState(false);
  const [newNeedName, setNewNeedName] = useState('');
  const [needSubmitting, setNeedSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      // Default to product category if already assigned, or first available category
      if (product.categoryId) {
        setSelectedCategoryId(product.categoryId);
      } else if (categories.length > 0) {
        setSelectedCategoryId(categories[0].id);
      } else {
        setSelectedCategoryId('');
      }

      // Default to product wellness need if already assigned, or match by name/target
      if (product.wellnessNeedId) {
        setSelectedWellnessNeedId(product.wellnessNeedId);
      } else if (product.wellnessNeed) {
        const matched = wellnessNeeds.find(
          w => (w.name && w.name.toLowerCase() === product.wellnessNeed?.toLowerCase()) ||
               (w.title && w.title.toLowerCase() === product.wellnessNeed?.toLowerCase())
        );
        setSelectedWellnessNeedId(matched?.id || '');
      } else if (wellnessNeeds.length > 0) {
        setSelectedWellnessNeedId(wellnessNeeds[0].id);
      } else {
        setSelectedWellnessNeedId('');
      }

      setAdminFeedback('Approved for public marketplace display.');
      setErrorMsg(null);
      setIsCreatingCat(false);
      setNewCatName('');
      setIsCreatingNeed(false);
      setNewNeedName('');
    }
  }, [product, categories, wellnessNeeds]);

  if (!isOpen || !product) return null;

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId) {
      setErrorMsg('Please select a category for this product before approving.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await onApprove(product.id, selectedCategoryId, selectedWellnessNeedId || undefined, adminFeedback.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to approve product.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!confirm(`Are you sure you want to reject "${product.name}"?`)) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await onReject(product.id, adminFeedback.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reject product.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateNewCategory = async () => {
    if (!newCatName.trim()) return;
    setCatSubmitting(true);
    try {
      const created = await createCategory({
        name: newCatName.trim(),
        description: `Botanical category for ${newCatName.trim()}`
      });
      if (onCategoryCreated) {
        onCategoryCreated(created);
      }
      setSelectedCategoryId(created.id);
      setIsCreatingCat(false);
      setNewCatName('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create category.');
    } finally {
      setCatSubmitting(false);
    }
  };

  const handleCreateNewWellnessNeed = async () => {
    if (!newNeedName.trim()) return;
    setNeedSubmitting(true);
    try {
      const created = await createWellnessNeed({
        name: newNeedName.trim(),
        description: `Therapeutic goal for ${newNeedName.trim()}`,
        icon: 'shield-plus'
      });
      if (onWellnessNeedCreated) {
        onWellnessNeedCreated(created);
      }
      setSelectedWellnessNeedId(created.id);
      setIsCreatingNeed(false);
      setNewNeedName('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create wellness need.');
    } finally {
      setNeedSubmitting(false);
    }
  };

  const isValidImg = product.imageUrl && 
    (product.imageUrl.startsWith('/') || product.imageUrl.startsWith('http://') || product.imageUrl.startsWith('https://'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl border border-[#d6e5d8] shadow-2xl max-w-2xl w-full overflow-hidden my-8 animate-scaleIn">
        
        {/* Modal Header */}
        <div className="bg-[#17381f] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold tracking-wide">Review & Approve Product</h2>
              <p className="text-[11px] text-emerald-200/80">
                Verify seller specifications, assign botanical category, and publish to the shop catalog.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleApproveSubmit} className="p-6 space-y-5">
          
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Product Overview Card */}
          <div className="bg-[#f7faf7] border border-[#e0ebe1] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#cfe0d1] bg-white flex-shrink-0 shadow-2xs">
              {isValidImg ? (
                <Image
                  src={resolveBackendImageUrl(product.imageUrl)}
                  alt={product.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#75947b]">
                  <Package className="w-8 h-8" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Pending Review
                </span>
                {product.sellerName && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#4d6b53] font-medium">
                    <User className="w-3 h-3 text-[#24492d]" />
                    <span>Seller: <strong>{product.sellerName}</strong></span>
                  </span>
                )}
              </div>

              <h3 className="font-bold text-sm sm:text-base text-[#1c3f24] line-clamp-2">
                {product.name}
              </h3>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#526f58]">
                <span>Base Price: <strong className="text-[#1c3f24]">${Number(product.price).toFixed(2)}</strong></span>
                <span>•</span>
                <span>Total Stock: <strong className="text-[#1c3f24]">{product.stockQuantity} units</strong></span>
                {product.weight && (
                  <>
                    <span>•</span>
                    <span>Default Spec: <strong>{product.weight}</strong></span>
                  </>
                )}
              </div>

              {product.variants && product.variants.length > 0 && (
                <div className="mt-2.5">
                  <span className="text-[11px] font-bold text-[#24492d] block mb-1">Configured Weight &amp; Pricing Options:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {product.variants.map((v, i) => (
                      <span key={i} className="text-[11px] font-medium bg-[#f0f6f1] text-[#24492d] px-2 py-0.5 rounded-md border border-[#c7decb]">
                        {v.weight}: ${v.price.toFixed(2)} ({v.stockQuantity} in stock)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* New Product Attributes: Origin, Condition, Specs, Delivery */}
              <div className="mt-3 pt-2.5 border-t border-[#d8e8dc] text-xs grid grid-cols-2 sm:grid-cols-3 gap-2 text-[#35533c]">
                {product.countryOfOrigin && (
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase font-bold">Origin</span>
                    <span className="font-semibold text-[#1c3f24]">{product.countryOfOrigin}</span>
                  </div>
                )}
                {product.condition && (
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase font-bold">Condition</span>
                    <span className="font-semibold text-[#1c3f24]">{product.condition}</span>
                  </div>
                )}
                {product.shippingOptions ? (() => {
                  try {
                    const parsed = typeof product.shippingOptions === 'string'
                      ? JSON.parse(product.shippingOptions)
                      : product.shippingOptions;
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      return (
                        <div className="col-span-2 sm:col-span-3">
                          <span className="text-[10px] text-stone-400 block uppercase font-bold mb-1">
                            Seller Shipping Methods ({parsed.length})
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {parsed.map((opt: any, i: number) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-[#edf5ee] border border-[#ccdacc] text-[#1c3f24] text-[11px] font-medium">
                                {opt.name}: <strong>{Number(opt.cost) === 0 ? 'FREE' : `$${Number(opt.cost).toFixed(2)}`}</strong> ({opt.estimatedDeliveryTime})
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  } catch {}
                  return null;
                })() : (
                  <>
                    {product.shippingMethod && (
                      <div>
                        <span className="text-[10px] text-stone-400 block uppercase font-bold">Shipping Method</span>
                        <span className="font-semibold text-[#1c3f24]">{product.shippingMethod}</span>
                      </div>
                    )}
                    {product.estimatedDeliveryTime && (
                      <div>
                        <span className="text-[10px] text-stone-400 block uppercase font-bold">Est. Delivery</span>
                        <span className="font-semibold text-[#1c3f24]">{product.estimatedDeliveryTime}</span>
                      </div>
                    )}
                    {product.isFreeShipping !== undefined && (
                      <div>
                        <span className="text-[10px] text-stone-400 block uppercase font-bold">Delivery Cost</span>
                        <span className="font-semibold text-[#1c3f24]">
                          {product.isFreeShipping ? 'Free Shipping' : `$${Number(product.shippingCost || 0).toFixed(2)}`}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {product.expiryDate && (
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase font-bold">Expiry Date</span>
                    <span className="font-semibold text-[#1c3f24]">{new Date(product.expiryDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description & Ingredients details */}
          {(product.description || product.ingredients || product.howToUse || product.keyBenefits) && (
            <div className="text-xs bg-white border border-stone-200 rounded-xl p-3.5 space-y-2 max-h-36 overflow-y-auto text-stone-700">
              {product.description && (
                <div>
                  <strong className="text-stone-900 block mb-0.5">Description:</strong>
                  <p className="text-stone-600 leading-relaxed">{product.description}</p>
                </div>
              )}
              {product.ingredients && (
                <div className="pt-1.5 border-t border-stone-100">
                  <strong className="text-stone-900 block mb-0.5">Ingredients:</strong>
                  <p className="text-stone-600">{product.ingredients}</p>
                </div>
              )}
              {product.howToUse && (
                <div className="pt-1.5 border-t border-stone-100">
                  <strong className="text-stone-900 block mb-0.5">How To Use:</strong>
                  <p className="text-stone-600 whitespace-pre-line">{product.howToUse}</p>
                </div>
              )}
              {product.keyBenefits && (
                <div className="pt-1.5 border-t border-stone-100">
                  <strong className="text-stone-900 block mb-0.5">Key Benefits:</strong>
                  <p className="text-stone-600 whitespace-pre-line">{product.keyBenefits}</p>
                </div>
              )}
            </div>
          )}

          {/* Category Assignment Section (Mandatory as per request) */}
          <div className="space-y-2 bg-[#edf5ee] p-4 rounded-xl border border-[#cfe0d1]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1c3f24] flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#24492d]" />
                <span>Assign Category to Product *</span>
              </label>

              {!isCreatingCat && (
                <button
                  type="button"
                  onClick={() => setIsCreatingCat(true)}
                  className="text-[11px] font-bold text-[#24492d] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Category</span>
                </button>
              )}
            </div>

            {isCreatingCat ? (
              <div className="flex items-center gap-2 pt-1 animate-fadeIn">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Enter new category name..."
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-[#24492d] bg-white text-[#1c3f24] focus:outline-none focus:ring-2 focus:ring-[#24492d]/20"
                />
                <button
                  type="button"
                  onClick={handleCreateNewCategory}
                  disabled={catSubmitting || !newCatName.trim()}
                  className="px-3 py-2 rounded-lg bg-[#24492d] text-white text-xs font-bold hover:bg-[#1b3b24] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {catSubmitting ? 'Creating...' : 'Create & Select'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingCat(false)}
                  className="px-2 py-2 text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#bcd2bf] bg-white text-xs font-medium text-[#1c3f24] focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d]"
              >
                <option value="" disabled>-- Select a botanical category --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}

            <p className="text-[11px] text-[#55775d]">
              The product will immediately be published under this category in the public shop catalog.
            </p>
          </div>

          {/* Wellness Need Assignment Section */}
          <div className="space-y-2 bg-[#f4f7f4] p-4 rounded-xl border border-[#cfe0d1]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1c3f24] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#24492d]" />
                <span>Assign Wellness Need Target</span>
              </label>

              {!isCreatingNeed && (
                <button
                  type="button"
                  onClick={() => setIsCreatingNeed(true)}
                  className="text-[11px] font-bold text-[#24492d] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Wellness Need</span>
                </button>
              )}
            </div>

            {isCreatingNeed ? (
              <div className="flex items-center gap-2 pt-1 animate-fadeIn">
                <input
                  type="text"
                  value={newNeedName}
                  onChange={(e) => setNewNeedName(e.target.value)}
                  placeholder="Enter new wellness need..."
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-[#24492d] bg-white text-[#1c3f24] focus:outline-none focus:ring-2 focus:ring-[#24492d]/20"
                />
                <button
                  type="button"
                  onClick={handleCreateNewWellnessNeed}
                  disabled={needSubmitting || !newNeedName.trim()}
                  className="px-3 py-2 rounded-lg bg-[#24492d] text-white text-xs font-bold hover:bg-[#1b3b24] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {needSubmitting ? 'Creating...' : 'Create & Select'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingNeed(false)}
                  className="px-2 py-2 text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <select
                value={selectedWellnessNeedId}
                onChange={(e) => setSelectedWellnessNeedId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#bcd2bf] bg-white text-xs font-medium text-[#1c3f24] focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d]"
              >
                <option value="">-- None / General Wellness --</option>
                {wellnessNeeds.map((need) => (
                  <option key={need.id} value={need.id}>
                    {need.name || need.title}
                  </option>
                ))}
              </select>
            )}

            <p className="text-[11px] text-[#55775d]">
              Customers will be able to discover this product when filtering by this therapeutic wellness need.
            </p>
          </div>

          {/* Admin Feedback / Seller Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1c3f24]">
              Admin Moderation Feedback (Optional)
            </label>
            <input
              type="text"
              value={adminFeedback}
              onChange={(e) => setAdminFeedback(e.target.value)}
              placeholder="e.g. Approved for public marketplace display."
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-stone-300 bg-[#fbfdfb] text-[#1c3f24] focus:outline-none focus:ring-2 focus:ring-[#24492d]/20"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-stone-200">
            {/* Reject option */}
            <button
              type="button"
              onClick={handleRejectSubmit}
              disabled={submitting}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <XCircle className="w-4 h-4 text-red-600" />
              <span>Reject Product</span>
            </button>

            {/* Right: Cancel & Approve */}
            <div className="w-full sm:w-auto flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting || !selectedCategoryId}
                className="px-5 py-2.5 rounded-xl bg-[#24492d] hover:bg-[#183921] text-white text-xs font-bold tracking-wider uppercase shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 text-[#86efac]" />
                <span>{submitting ? 'Approving...' : 'Approve & Publish to Shop'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}