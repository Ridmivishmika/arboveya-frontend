'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, Sparkles, AlertCircle, Upload, Check, ImageIcon, Package, DollarSign, ListChecks, FlaskConical, BookOpen, Star, Layers, PlusCircle, Trash2, Weight } from 'lucide-react';
import { Product, Category, WellnessNeed, CreateProductInput, UpdateProductInput, ProductVariant } from '@/types';
import { uploadProductImage } from '@/lib/api';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateProductInput | UpdateProductInput) => Promise<void>;
  initialData?: Product | null;
  categories?: Category[];
  wellnessNeeds?: WellnessNeed[];
  mode: 'create' | 'edit';
  title?: string;
  subtitle?: string;
  submitButtonText?: string;
  hideBestSeller?: boolean;
  isSeller?: boolean;
}

const PRESET_IMAGES = [
  { label: 'Moringa Capsules', url: '/images/moringa-capsules.jpg' },
  { label: 'Herbal Detox Tea', url: '/images/herbal-detox-tea.jpg' },
  { label: 'Turmeric Curcumin', url: '/images/turmeric-curcumin.jpg' },
  { label: 'Ashwagandha', url: '/images/ashwagandha-capsules.jpg' },
  { label: 'Herbal Hair Oil', url: '/images/herbal-hair-oil.jpg' },
  { label: 'Wellness Kit', url: '/images/wellness-immunity-kit.jpg' },
  { label: 'Neem Face Wash', url: '/images/neem-skin-face.jpg' },
  { label: 'Lavender Oil', url: '/images/lavender-oil.jpg' },
  { label: 'Aloe Vera Gel', url: '/images/aloe-vera-gel.jpg' },
  { label: 'Gotu Kola Tea', url: '/images/gotu-kola-tea.jpg' },
  { label: 'Multivitamin', url: '/images/multivitamin-capsules.jpg' },
  { label: 'Stress Relief Tea', url: '/images/stress-relief-tea.jpg' },
];

export default function ProductModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  categories = [],
  wellnessNeeds = [],
  mode,
  title,
  subtitle,
  submitButtonText,
  hideBestSeller = false,
  isSeller = false
}: ProductModalProps) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [wellnessNeedId, setWellnessNeedId] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [galleryImages, setGalleryImages] = useState('');
  const [keyBenefits, setKeyBenefits] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [howToUse, setHowToUse] = useState('');
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setName(initialData.name || '');
      setCategoryId(initialData.categoryId || (categories[0]?.id ?? ''));
      setWellnessNeedId(initialData.wellnessNeedId || '');
      setDescription(initialData.description || '');
      setImageUrl(initialData.imageUrl || '');
      setGalleryImages(initialData.galleryImages || '');
      setKeyBenefits(initialData.keyBenefits || '');
      setIngredients(initialData.ingredients || '');
      setHowToUse(initialData.howToUse || '');
      setIsBestSeller(Boolean(initialData.isBestSeller));
      if (initialData.variants && initialData.variants.length > 0) {
        setVariants(initialData.variants.map(v => ({ ...v })));
      } else {
        setVariants([{
          weight: initialData.weight || '100g',
          price: Number(initialData.price) || 24.99,
          stockQuantity: Number(initialData.stockQuantity) || 50
        }]);
      }
    } else {
      setName('');
      setCategoryId(categories[0]?.id || '');
      setWellnessNeedId('');
      setDescription('');
      setImageUrl('');
      setGalleryImages('');
      setKeyBenefits('');
      setIngredients('');
      setHowToUse('');
      setIsBestSeller(false);
      setVariants([{ weight: '100g', price: 24.99, stockQuantity: 50 }]);
    }
    setError(null);
  }, [initialData, mode, isOpen, categories]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setError(null);
      const uploadedUrl = await uploadProductImage(file);
      setImageUrl(uploadedUrl);
    } catch (err: any) {
      console.error('Upload failed:', err);
      const localUrl = URL.createObjectURL(file);
      setImageUrl(localUrl);
      setError('Backend upload unavailable, using preview image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Product Name is required.');
      return;
    }

    if (!isSeller && !categoryId) {
      setError('Please select a valid category.');
      return;
    }

    const validVariants = variants.filter(v => v.weight && v.weight.trim() !== '');
    if (validVariants.length === 0) {
      setError('Please provide at least one Weight & Pricing option (e.g. 100g, $24.99).');
      return;
    }

    for (const v of validVariants) {
      const p = parseFloat(v.price as any);
      if (isNaN(p) || p < 0) {
        setError(`Please enter a valid price for weight option "${v.weight}".`);
        return;
      }
      const s = parseInt(v.stockQuantity as any, 10);
      if (isNaN(s) || s < 0) {
        setError(`Please enter a valid stock quantity for weight option "${v.weight}".`);
        return;
      }
    }

    const sortedVariants = [...validVariants].sort((a, b) => Number(a.price) - Number(b.price));
    const lowest = sortedVariants[0];
    const totalStock = validVariants.reduce((sum, v) => sum + (Number(v.stockQuantity) || 0), 0);

    try {
      setSubmitting(true);
      setError(null);

      await onSubmit({
        name: name.trim(),
        categoryId: isSeller ? (initialData?.categoryId || undefined) : (categoryId || undefined),
        wellnessNeedId: isSeller ? (initialData?.wellnessNeedId || undefined) : (wellnessNeedId || undefined),
        price: Number(lowest.price),
        stockQuantity: totalStock,
        weight: lowest.weight.trim(),
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        galleryImages: galleryImages.trim() || undefined,
        keyBenefits: keyBenefits.trim() || undefined,
        ingredients: ingredients.trim() || undefined,
        howToUse: howToUse.trim() || undefined,
        isBestSeller: isSeller ? false : isBestSeller,
        variants: sortedVariants
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save product. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategoryObj = categories.find(c => c.id === categoryId);
  const selectedWellnessNeedObj = wellnessNeeds.find(w => w.id === wellnessNeedId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#dbe6dc] overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2ede4] bg-[#f8faf8] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#24492d] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1c3f24]">
                {title || (mode === 'create' ? 'Add New Botanical Product' : `Edit: ${initialData?.name || 'Product'}`)}
              </h3>
              <p className="text-xs text-[#526a57]">
                {subtitle || 'Fill in product details, botanical benefits, ingredients, and usage directions.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-[#edf5ee] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2.5 text-red-700 text-xs flex-shrink-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">

          {/* Product Name */}
          <div className="space-y-1.5">
            <label htmlFor="prod-name" className="block text-xs font-semibold text-[#1c3f24]">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              id="prod-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Organic Moringa Oleifera Capsules"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#ccdacc] bg-[#fafcfa] text-[#1c3f24] text-sm focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d] transition-all"
            />
          </div>

          {/* Category & Wellness Need Row */}
          {isSeller ? (
            <div className="p-3 bg-[#f4f8f4] border border-[#d2e4d5] rounded-xl flex items-start gap-2.5">
              <Layers className="w-4 h-4 text-[#24492d] mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-[#1c3f24]">Category &amp; Wellness Need Managed by Admin</h4>
                <p className="text-[11px] text-[#556e59] mt-0.5 leading-relaxed">
                  Sellers do not set categories or wellness needs. Appropriate classifications will be assigned by Arboveya Administrators during product review.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="prod-cat" className="block text-xs font-semibold text-[#1c3f24]">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="prod-cat"
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#ccdacc] bg-[#fafcfa] text-[#1c3f24] text-xs focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d] transition-all cursor-pointer"
                >
                  {categories.length === 0 && (
                    <option value="">No categories available</option>
                  )}
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="prod-wellness" className="block text-xs font-semibold text-[#1c3f24]">
                  Wellness Need
                </label>
                <select
                  id="prod-wellness"
                  value={wellnessNeedId}
                  onChange={(e) => setWellnessNeedId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#ccdacc] bg-[#fafcfa] text-[#1c3f24] text-xs focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d] transition-all cursor-pointer"
                >
                  <option value="">-- None / Select Target --</option>
                  {wellnessNeeds.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name || w.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Weight, Pricing & Stock Options (Primary Pricing & Inventory) */}
          <div className="space-y-3 p-4 rounded-xl bg-[#f0f7f1] border border-[#c9dece]">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <label className="block text-xs font-bold text-[#1c3f24] flex items-center gap-1.5">
                  <Weight className="w-3.5 h-3.5 text-[#24492d]" />
                  Weight, Pricing &amp; Stock Options <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-[#5c7561] mt-0.5">
                  Add available weights with their individual price and stock. The lowest price will be displayed as the default storefront value.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setVariants(prev => [
                    ...prev,
                    { weight: '', price: prev.length > 0 ? prev[prev.length - 1].price : 24.99, stockQuantity: 50 }
                  ]);
                }}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#24492d] hover:text-[#1a3821] bg-white border border-[#24492d]/40 px-3 py-1.5 rounded-lg hover:bg-[#edf5ee] transition-all cursor-pointer shadow-2xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add Weight Option
              </button>
            </div>

            {/* Column Headers */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-[10px] font-bold text-[#45634b] uppercase px-1">
              <div className="col-span-5">Weight / Option (e.g. 50g, 100g, 250g)</div>
              <div className="col-span-3">Price (USD $)</div>
              <div className="col-span-3">Stock Units</div>
              <div className="col-span-1 text-center">Remove</div>
            </div>

            {/* Variant Rows */}
            <div className="space-y-2">
              {variants.map((v, idx) => {
                const lowestPrice = variants.length > 0
                  ? Math.min(...variants.filter(item => (item.price || 0) > 0).map(item => item.price))
                  : 0;
                const isLowest = variants.length > 1 && v.price > 0 && v.price === lowestPrice;

                return (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-lg border border-[#ccdacc] shadow-2xs">
                    {/* Weight Input */}
                    <div className="sm:col-span-5 relative">
                      <label className="block sm:hidden text-[10px] font-bold text-[#45634b] mb-1">Weight / Option</label>
                      <input
                        type="text"
                        required
                        value={v.weight}
                        onChange={e => {
                          const updated = [...variants];
                          updated[idx] = { ...updated[idx], weight: e.target.value };
                          setVariants(updated);
                        }}
                        placeholder="e.g. 50g, 100g, 250g, 1kg"
                        className="w-full px-3 py-2 rounded-lg border border-[#ccdacc] bg-[#fafcfa] text-[#1c3f24] text-xs focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d]"
                      />
                      {isLowest && (
                        <span className="hidden sm:inline-block absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold bg-[#e0efe2] text-[#24492d] px-1.5 py-0.5 rounded border border-[#b8dabf]">
                          Lowest
                        </span>
                      )}
                    </div>

                    {/* Price Input */}
                    <div className="sm:col-span-3">
                      <label className="block sm:hidden text-[10px] font-bold text-[#45634b] mb-1">Price ($ USD)</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={v.price !== undefined ? v.price : ''}
                          onChange={e => {
                            const updated = [...variants];
                            updated[idx] = { ...updated[idx], price: parseFloat(e.target.value) || 0 };
                            setVariants(updated);
                          }}
                          placeholder="24.99"
                          className="w-full pl-6 pr-2 py-2 rounded-lg border border-[#ccdacc] bg-[#fafcfa] text-[#1c3f24] text-xs focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d]"
                        />
                      </div>
                    </div>

                    {/* Stock Input */}
                    <div className="sm:col-span-3">
                      <label className="block sm:hidden text-[10px] font-bold text-[#45634b] mb-1">Stock Quantity</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={v.stockQuantity !== undefined ? v.stockQuantity : ''}
                        onChange={e => {
                          const updated = [...variants];
                          updated[idx] = { ...updated[idx], stockQuantity: parseInt(e.target.value) || 0 };
                          setVariants(updated);
                        }}
                        placeholder="50"
                        className="w-full px-3 py-2 rounded-lg border border-[#ccdacc] bg-[#fafcfa] text-[#1c3f24] text-xs focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d]"
                      />
                    </div>

                    {/* Remove Button */}
                    <div className="sm:col-span-1 flex justify-center">
                      <button
                        type="button"
                        disabled={variants.length <= 1}
                        onClick={() => {
                          if (variants.length > 1) {
                            setVariants(prev => prev.filter((_, i) => i !== idx));
                          }
                        }}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${variants.length <= 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-red-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                        title={variants.length <= 1 ? 'At least one option is required' : 'Remove this option'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Info */}
            {variants.length > 0 && (
              <div className="flex flex-wrap items-center justify-between text-[11px] text-[#3d5942] bg-[#e4f0e6] px-3 py-2 rounded-lg border border-[#c3dec7]">
                <div>
                  Default Store Display: <strong className="text-[#1c3f24]">
                    ${Math.min(...variants.map(v => v.price || 0)).toFixed(2)}
                    {variants.find(v => v.price === Math.min(...variants.map(x => x.price || 0)))?.weight
                      ? ` (${variants.find(v => v.price === Math.min(...variants.map(x => x.price || 0)))?.weight})`
                      : ''}
                  </strong>
                </div>
                <div>
                  Total Combined Stock: <strong className="text-[#1c3f24]">{variants.reduce((acc, v) => acc + (Number(v.stockQuantity) || 0), 0)} units</strong> ({variants.length} {variants.length === 1 ? 'option' : 'options'})
                </div>
              </div>
            )}
          </div>

          {/* Best Seller Checkbox for Admin */}
          {!hideBestSeller && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#fafcfa] border border-[#d6dfd7]">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isBestSeller}
                  onChange={(e) => setIsBestSeller(e.target.checked)}
                  className="w-4 h-4 rounded text-[#24492d] focus:ring-[#24492d] border-[#ccdacc] cursor-pointer"
                />
                <span className="text-xs font-bold text-[#24492d] flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-[#24492d]" />
                  Feature as Best Seller on Homepage
                </span>
              </label>
            </div>
          )}

          {/* Image Selection Area */}
          <div className="space-y-3 p-4 rounded-xl bg-[#f7faf7] border border-[#e2ede3]">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#1c3f24]">
                Product Image & Visuals
              </label>
              <span className="text-[11px] text-[#4d6b53]">Upload image or pick a preset</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Image Preview Box */}
              <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-[#24492d]/40 bg-white shadow-sm flex items-center justify-center flex-shrink-0 group">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt="Product preview"
                    fill
                    sizes="96px"
                    className="object-cover group-hover:scale-105 transition-transform"
                    onError={() => { }}
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-[#9eb6a2]" />
                )}
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Upload & URL Controls */}
              <div className="flex-1 w-full space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="px-3.5 py-1.5 rounded-lg bg-white border border-[#24492d] text-[#24492d] hover:bg-[#edf5ee] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image File</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="text-[11px] text-gray-500">or paste direct image URL below:</span>
                </div>

                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... or /images/..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#ccdacc] bg-white text-[#1c3f24] focus:outline-none focus:ring-1 focus:ring-[#24492d] focus:border-[#24492d]"
                />
              </div>
            </div>

            {/* Presets */}
            <div className="pt-2 border-t border-[#edf2ed]">
              <span className="text-[10px] font-semibold text-[#5a755f] uppercase tracking-wider block mb-1.5">
                Quick Botanical Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_IMAGES.map((preset) => {
                  const isSelected = imageUrl === preset.url;
                  return (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setImageUrl(preset.url)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all flex items-center gap-1 ${isSelected
                        ? 'bg-[#24492d] text-white shadow-xs'
                        : 'bg-white text-[#39563d] border border-[#ccdacc] hover:bg-[#edf5ee]'
                        }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gallery Images (Optional extra URLs) */}
            <div className="pt-2">
              <label className="block text-[11px] font-semibold text-[#3b5940] mb-1">
                Additional Gallery Image URLs (comma-separated):
              </label>
              <input
                type="text"
                value={galleryImages}
                onChange={(e) => setGalleryImages(e.target.value)}
                placeholder="/images/herbal-detox-tea.jpg, /images/aloe-vera-gel.jpg"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#ccdacc] bg-white text-[#1c3f24] focus:outline-none focus:ring-1 focus:ring-[#24492d]"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="prod-desc" className="block text-xs font-semibold text-[#1c3f24]">
              Product Overview & Summary
            </label>
            <textarea
              id="prod-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe therapeutic virtues, purity guarantees, and origin..."
              className="w-full px-3.5 py-2 rounded-lg border border-[#ccdacc] bg-[#fafcfa] text-[#1c3f24] text-xs focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d] transition-all resize-none"
            />
          </div>

          {/* Key Benefits (Bullet points) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="prod-benefits" className="block text-xs font-semibold text-[#1c3f24] flex items-center gap-1.5">
                <ListChecks className="w-3.5 h-3.5 text-[#24492d]" />
                Key Benefits (Shown with green checkmarks on product page)
              </label>
              <span className="text-[10px] text-[#55715a]">One benefit per line</span>
            </div>
            <textarea
              id="prod-benefits"
              rows={3}
              value={keyBenefits}
              onChange={(e) => setKeyBenefits(e.target.value)}
              placeholder="100% Certified Organic Botanicals&#10;Supports Natural Vitality and Energy&#10;Zero Artificial Preservatives or Additives&#10;Lab Tested for Purity & Potency"
              className="w-full px-3.5 py-2 rounded-lg border border-[#ccdacc] bg-[#fafcfa] text-[#1c3f24] text-xs focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d] transition-all"
            />
          </div>

          {/* Ingredients */}
          <div className="space-y-1.5">
            <label htmlFor="prod-ingredients" className="block text-xs font-semibold text-[#1c3f24] flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-[#24492d]" />
              Botanical Ingredients
            </label>
            <textarea
              id="prod-ingredients"
              rows={2}
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="e.g. Pure Organic Moringa Leaf Powder 500mg, Vegetable Cellulose (capsule)."
              className="w-full px-3.5 py-2 rounded-lg border border-[#ccdacc] bg-[#fafcfa] text-[#1c3f24] text-xs focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d] transition-all resize-none"
            />
          </div>

          {/* How To Use */}
          <div className="space-y-1.5">
            <label htmlFor="prod-howtouse" className="block text-xs font-semibold text-[#1c3f24] flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#24492d]" />
              How To Use & Dosage Directions
            </label>
            <textarea
              id="prod-howtouse"
              rows={2}
              value={howToUse}
              onChange={(e) => setHowToUse(e.target.value)}
              placeholder="e.g. Take 2 capsules daily with a glass of warm water or after morning meal."
              className="w-full px-3.5 py-2 rounded-lg border border-[#ccdacc] bg-[#fafcfa] text-[#1c3f24] text-xs focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d] transition-all resize-none"
            />
          </div>

          {/* Live Card Preview Box */}
          <div className="p-3 rounded-xl bg-[#f2f6f3] border border-[#dde8df] flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-lg bg-white overflow-hidden border border-[#d2e0d4] flex-shrink-0">
              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt={name || 'Preview'}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-[#2d5c37] tracking-wider truncate max-w-[200px]">
                  {isSeller
                    ? (initialData?.categoryName || 'Classification: Assigned by Admin')
                    : (selectedCategoryObj?.name || 'Category')}
                  {isSeller
                    ? (initialData?.wellnessNeedName ? ` • ${initialData.wellnessNeedName}` : '')
                    : (selectedWellnessNeedObj ? ` • ${selectedWellnessNeedObj.name || selectedWellnessNeedObj.title}` : '')}
                </span>
                {isBestSeller && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#24492d] text-white">
                    BEST SELLER
                  </span>
                )}
              </div>
              <h4 className="text-xs font-bold text-[#1c3f24] truncate">
                {name || 'Product Name Preview'}
              </h4>
              {(() => {
                const previewLowest = variants.length > 0
                  ? [...variants].sort((a, b) => Number(a.price || 0) - Number(b.price || 0))[0]
                  : undefined;
                const pPrice = previewLowest ? Number(previewLowest.price || 0) : 0;
                const pWeight = previewLowest?.weight || 'Standard Size';
                const pStock = variants.reduce((sum, v) => sum + (Number(v.stockQuantity) || 0), 0);

                return (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-bold text-[#1c3f24]">
                      ${pPrice.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-[#556e59]">
                      ({pWeight})
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#e3ede5] text-[#24492d] font-semibold">
                      Stock: {pStock}
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#edf2ed]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-lg border border-[#ccdacc] text-[#3e5642] hover:bg-[#f3f7f3] text-xs font-semibold tracking-wider uppercase transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingImage}
              className="px-6 py-2.5 rounded-lg bg-[#24492d] hover:bg-[#1a3821] text-white text-xs font-bold tracking-wider uppercase shadow-md transition-all flex items-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Saving Product...</span>
                </>
              ) : (
                <span>{submitButtonText || (mode === 'create' ? 'Publish Product' : 'Save Changes')}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
