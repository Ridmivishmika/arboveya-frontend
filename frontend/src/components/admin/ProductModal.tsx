'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  X, 
  Sparkles, 
  AlertCircle, 
  Upload, 
  Check, 
  ImageIcon, 
  Package, 
  DollarSign, 
  ListChecks, 
  FlaskConical, 
  BookOpen, 
  Star, 
  Layers, 
  PlusCircle, 
  Plus,
  Trash2, 
  Weight,
  Globe,
  Calendar,
  Truck,
  FileText,
  RotateCcw
} from 'lucide-react';
import { Product, Category, WellnessNeed, CreateProductInput, UpdateProductInput, ProductVariant } from '@/types';
import { uploadProductImage, uploadMultipleProductImages, resolveBackendImageUrl } from '@/lib/api';

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
  // Base fields
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [wellnessNeedId, setWellnessNeedId] = useState('');
  const [description, setDescription] = useState('');
  const [keyBenefits, setKeyBenefits] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [howToUse, setHowToUse] = useState('');
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Photos state (up to 10 photos uploaded from device)
  const [photos, setPhotos] = useState<string[]>([]);

  // New Botanical & Commercial Attributes
  const [countryOfOrigin, setCountryOfOrigin] = useState('Sri Lanka');
  const [condition, setCondition] = useState('Brand New / Fresh Harvest');
  const [manufactureDate, setManufactureDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [specifications, setSpecifications] = useState('');

  // Shipping & Schedule Options
  const [shippingOptions, setShippingOptions] = useState<Array<{
    name: string;
    estimatedDeliveryTime: string;
    cost: number;
  }>>([
    { name: 'Standard Shipping', estimatedDeliveryTime: '3-5 business days', cost: 4.99 },
    { name: 'Express Shipping', estimatedDeliveryTime: '1-2 business days', cost: 14.99 },
    { name: 'Free Shipping', estimatedDeliveryTime: '5-7 business days', cost: 0 }
  ]);
  const [handlingTime, setHandlingTime] = useState('1 business day');
  const [returnPolicy, setReturnPolicy] = useState('30-Day Return Window. Buyer pays return shipping for change of mind. Items must be unopened.');

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
      setKeyBenefits(initialData.keyBenefits || '');
      setIngredients(initialData.ingredients || '');
      setHowToUse(initialData.howToUse || '');
      setIsBestSeller(Boolean(initialData.isBestSeller));

      // Photos
      const loadedPhotos: string[] = [];
      if (initialData.imageUrl) {
        loadedPhotos.push(initialData.imageUrl);
      }
      if (initialData.galleryImages) {
        const extra = initialData.galleryImages.split(',').map(s => s.trim()).filter(Boolean);
        extra.forEach(url => {
          if (!loadedPhotos.includes(url)) loadedPhotos.push(url);
        });
      }
      setPhotos(loadedPhotos);

      // New Attributes
      setCountryOfOrigin(initialData.countryOfOrigin || 'Sri Lanka');
      setCondition(initialData.condition || 'Brand New / Fresh Harvest');
      setManufactureDate(initialData.manufactureDate ? initialData.manufactureDate.split('T')[0] : '');
      setExpiryDate(initialData.expiryDate ? initialData.expiryDate.split('T')[0] : '');
      setSpecifications(initialData.specifications || '');
      setHandlingTime(initialData.handlingTime || '1 business day');
      setReturnPolicy(initialData.returnPolicy || '30-Day Return Window. Buyer pays return shipping. Items must be unopened.');

      // Parse multi-shipping methods
      let parsedOptions: any[] = [];
      if (initialData.shippingOptions) {
        try {
          parsedOptions = typeof initialData.shippingOptions === 'string'
            ? JSON.parse(initialData.shippingOptions)
            : initialData.shippingOptions;
        } catch {
          parsedOptions = [];
        }
      }
      if (Array.isArray(parsedOptions) && parsedOptions.length > 0) {
        setShippingOptions(parsedOptions.map((o: any) => ({
          name: o.name || 'Standard Shipping',
          estimatedDeliveryTime: o.estimatedDeliveryTime || '3-5 business days',
          cost: o.name === 'Free Shipping' ? 0 : (Number(o.cost) || 0)
        })));
      } else {
        const defaultList: any[] = [];
        const isFree = initialData.isFreeShipping || Number(initialData.shippingCost || 0) === 0;
        const methodName = initialData.shippingMethod || (isFree ? 'Free Shipping' : 'Standard Shipping');
        const costVal = isFree ? 0 : (Number(initialData.shippingCost) || 0);
        defaultList.push({
          name: methodName,
          estimatedDeliveryTime: initialData.estimatedDeliveryTime || (costVal === 0 ? '5-7 business days' : '3-5 business days'),
          cost: costVal
        });
        setShippingOptions(defaultList);
      }

      // Variants
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
      setKeyBenefits('');
      setIngredients('');
      setHowToUse('');
      setIsBestSeller(false);
      setPhotos([]);
      setCountryOfOrigin('Sri Lanka');
      setCondition('Brand New / Fresh Harvest');
      setManufactureDate('');
      setExpiryDate('');
      setSpecifications('');
      setShippingOptions([
        { name: 'Standard Shipping', estimatedDeliveryTime: '3-5 business days', cost: 4.99 },
        { name: 'Express Shipping', estimatedDeliveryTime: '1-2 business days', cost: 14.99 },
        { name: 'Free Shipping', estimatedDeliveryTime: '5-7 business days', cost: 0 }
      ]);
      setHandlingTime('1 business day');
      setReturnPolicy('30-Day Return Window. Buyer pays return shipping. Items must be unopened.');
      setVariants([{ weight: '100g', price: 24.99, stockQuantity: 50 }]);
    }
    setError(null);
  }, [initialData, mode, isOpen, categories]);

  if (!isOpen) return null;

  // Handle Multi-photo upload from device (up to 10 photos)
  const handleDeviceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    if (photos.length + files.length > 10) {
      setError(`You can upload a maximum of 10 photos. You already have ${photos.length} photo(s).`);
      return;
    }

    try {
      setUploadingImage(true);
      setError(null);

      // Attempt multiple upload via backend API
      let newUrls: string[] = [];
      try {
        newUrls = await uploadMultipleProductImages(files);
      } catch {
        // Fallback to sequential single uploads
        for (const file of files) {
          try {
            const url = await uploadProductImage(file);
            newUrls.push(url);
          } catch {
            const localPreview = URL.createObjectURL(file);
            newUrls.push(localPreview);
          }
        }
      }

      setPhotos(prev => [...prev, ...newUrls].slice(0, 10));
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError('Could not complete image upload. Please try again.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSetPrimaryPhoto = (index: number) => {
    if (index === 0) return;
    setPhotos(prev => {
      const copy = [...prev];
      const selected = copy.splice(index, 1)[0];
      return [selected, ...copy];
    });
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== index));
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

    const primaryImage = photos[0] || undefined;
    const galleryString = photos.length > 1 ? photos.slice(1).join(',') : undefined;

    if (shippingOptions.length === 0) {
      setError('Please add at least one shipping method for this product.');
      return;
    }

    const primaryShipping = shippingOptions[0];
    const hasFree = shippingOptions.some(o => o.name === 'Free Shipping' || Number(o.cost) === 0);

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
        imageUrl: primaryImage,
        galleryImages: galleryString,
        keyBenefits: keyBenefits.trim() || undefined,
        ingredients: ingredients.trim() || undefined,
        howToUse: howToUse.trim() || undefined,
        isBestSeller: isSeller ? false : isBestSeller,
        countryOfOrigin: countryOfOrigin.trim() || undefined,
        condition: condition.trim() || undefined,
        manufactureDate: manufactureDate ? new Date(manufactureDate).toISOString() : undefined,
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
        specifications: specifications.trim() || undefined,
        shippingMethod: primaryShipping.name,
        estimatedDeliveryTime: primaryShipping.estimatedDeliveryTime,
        handlingTime: handlingTime.trim() || undefined,
        isFreeShipping: hasFree,
        shippingCost: primaryShipping.name === 'Free Shipping' ? 0 : Number(primaryShipping.cost) || 0,
        returnPolicy: returnPolicy.trim() || undefined,
        shippingOptions: JSON.stringify(shippingOptions),
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
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-[#dbe6dc] overflow-hidden my-auto max-h-[92vh] flex flex-col"
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
                {subtitle || 'Provide botanical specifications, device photos, origin dates, and delivery schedule.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-[#edf5ee] transition-colors cursor-pointer"
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

        {/* Notice for Sellers */}
        {isSeller && mode === 'edit' && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center gap-2.5 text-amber-900 text-xs flex-shrink-0">
            <RotateCcw className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Admin Approval Notice:</strong> Editing product details will submit the product for Admin re-approval before changes are shown live on the marketplace.
            </span>
          </div>
        )}

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">

          {/* Section 1: Product Name */}
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
              placeholder="e.g. Pure Organic Moringa Oleifera Capsules"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#ccdacc] bg-[#fafcfa] text-[#1c3f24] text-sm focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d] transition-all"
            />
          </div>

          {/* Section 2: Category & Wellness Need Row */}
          {isSeller ? (
            <div className="p-3.5 bg-[#f4f8f4] border border-[#d2e4d5] rounded-xl flex items-start gap-2.5">
              <Layers className="w-4 h-4 text-[#24492d] mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-[#1c3f24]">Category &amp; Wellness Need Managed by Admin</h4>
                <p className="text-[11px] text-[#556e59] mt-0.5 leading-relaxed">
                  Appropriate classifications will be verified and assigned by Arboveya Administrators during product review.
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

          {/* Section 3: Device Photos Upload (Max 10 photos - No URL input, No Presets) */}
          <div className="space-y-3 p-4 rounded-xl bg-[#f7faf7] border border-[#d8e8dc]">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <label className="block text-xs font-bold text-[#1c3f24] flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#24492d]" />
                  Product Photos ({photos.length}/10 uploaded)
                </label>
                <p className="text-[11px] text-[#55735c] mt-0.5">
                  Upload up to 10 photos from your device or drive. The first photo is the primary storefront image.
                </p>
              </div>
              <button
                type="button"
                disabled={photos.length >= 10 || uploadingImage}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs font-semibold bg-[#24492d] hover:bg-[#1a3821] text-white px-3.5 py-1.5 rounded-lg shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingImage ? 'Uploading Photos...' : 'Upload Photos from Device'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleDeviceUpload}
                className="hidden"
              />
            </div>

            {/* Photo Gallery Grid */}
            {photos.length === 0 ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-[#b8dabf] rounded-xl bg-white text-center cursor-pointer hover:bg-[#f2f8f3] transition-colors"
              >
                <Upload className="w-7 h-7 mx-auto text-[#436e4b] mb-1.5" />
                <p className="text-xs font-semibold text-[#1c3f24]">Click to upload photos from your device</p>
                <p className="text-[11px] text-[#698870] mt-0.5">PNG, JPG, WebP, AVIF up to 10MB each (max 10 photos)</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                {photos.map((photoUrl, idx) => {
                  const isMain = idx === 0;
                  return (
                    <div 
                      key={idx}
                      className={`relative rounded-xl overflow-hidden border-2 bg-white shadow-2xs group flex flex-col ${
                        isMain ? 'border-[#24492d]' : 'border-stone-200'
                      }`}
                    >
                      <div className="relative aspect-square w-full">
                        <Image
                          src={resolveBackendImageUrl(photoUrl)}
                          alt={`Product photo ${idx + 1}`}
                          fill
                          sizes="140px"
                          className="object-cover"
                        />
                        {isMain && (
                          <div className="absolute top-1.5 left-1.5 bg-[#24492d] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                            Main Photo
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-1.5 right-1.5 p-1 bg-white/90 hover:bg-red-500 hover:text-white text-stone-600 rounded-full shadow-xs transition-colors cursor-pointer"
                          title="Remove photo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      {!isMain && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryPhoto(idx)}
                          className="w-full py-1 text-[10px] font-semibold text-[#24492d] bg-[#edf5ee] hover:bg-[#deede0] transition-colors text-center border-t border-stone-200 cursor-pointer"
                        >
                          Set as Main
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 4: Origin, Condition & Dates */}
          <div className="space-y-3 p-4 rounded-xl bg-[#fafcfa] border border-[#d8e6da]">
            <div className="flex items-center gap-2 pb-1 border-b border-[#e6efe7]">
              <Globe className="w-4 h-4 text-[#24492d]" />
              <h4 className="text-xs font-bold text-[#1c3f24]">Botanical Origin, Condition &amp; Lifecycle Dates</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Country of Origin */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[#1c3f24]">
                  Country of Origin <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={countryOfOrigin}
                  onChange={(e) => setCountryOfOrigin(e.target.value)}
                  placeholder="e.g. Sri Lanka, India, Madagascar"
                  className="w-full px-3 py-2 rounded-lg border border-[#ccdacc] bg-white text-[#1c3f24] text-xs focus:outline-none focus:ring-1 focus:ring-[#24492d]"
                />
              </div>

              {/* Product Condition */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[#1c3f24]">
                  Product Condition
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#ccdacc] bg-white text-[#1c3f24] text-xs focus:outline-none focus:ring-1 focus:ring-[#24492d] cursor-pointer"
                >
                  <option value="Brand New / Fresh Harvest">Brand New / Fresh Harvest</option>
                  <option value="Certified Organic Harvest">Certified Organic Harvest</option>
                  <option value="Grade A Artisanal Batch">Grade A Artisanal Batch</option>
                  <option value="New / Sealed Container">New / Sealed Container</option>
                </select>
              </div>

              {/* Manufacture Date */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[#1c3f24] flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#24492d]" />
                  Manufacture Date
                </label>
                <input
                  type="date"
                  value={manufactureDate}
                  onChange={(e) => setManufactureDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#ccdacc] bg-white text-[#1c3f24] text-xs focus:outline-none focus:ring-1 focus:ring-[#24492d]"
                />
              </div>

              {/* Expiry Date */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[#1c3f24] flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#24492d]" />
                  Expiry Date / Best Before
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#ccdacc] bg-white text-[#1c3f24] text-xs focus:outline-none focus:ring-1 focus:ring-[#24492d]"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Weight, Pricing & Stock Options (Without Lowest pill badge in chart) */}
          <div className="space-y-3 p-4 rounded-xl bg-[#f0f7f1] border border-[#c9dece]">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <label className="block text-xs font-bold text-[#1c3f24] flex items-center gap-1.5">
                  <Weight className="w-3.5 h-3.5 text-[#24492d]" />
                  Weight, Pricing &amp; Stock Options <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-[#5c7561] mt-0.5">
                  Add weight variations with individual prices. The lowest price will be displayed as the base storefront price on the homepage.
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

            {/* Variant Rows (Note: "Lowest" pill badge removed per user request) */}
            <div className="space-y-2">
              {variants.map((v, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-lg border border-[#ccdacc] shadow-2xs">
                  {/* Weight Input */}
                  <div className="sm:col-span-5">
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
              ))}
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

          {/* Section 6: Shipping, Delivery Schedule & Returns */}
          <div className="space-y-4 p-4 rounded-xl bg-[#f4f9f5] border border-[#d2e5d6]">
            <div className="flex items-center justify-between pb-1 border-b border-[#e0ede2] flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#24492d]" />
                <div>
                  <h4 className="text-xs font-bold text-[#1c3f24]">Shipping Methods &amp; Delivery Schedule</h4>
                  <p className="text-[10px] text-[#557159]">Configure one or more delivery options with estimated delivery times and costs for buyers.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const currentNames = shippingOptions.map(o => o.name);
                  const available = ['Standard Shipping', 'Express Shipping', 'Free Shipping'].find(n => !currentNames.includes(n));
                  const newName = available || 'Standard Shipping';
                  setShippingOptions(prev => [
                    ...prev,
                    {
                      name: newName,
                      estimatedDeliveryTime: newName === 'Express Shipping' ? '1-2 business days' : newName === 'Free Shipping' ? '5-7 business days' : '3-5 business days',
                      cost: newName === 'Free Shipping' ? 0 : newName === 'Express Shipping' ? 14.99 : 4.99
                    }
                  ]);
                }}
                className="px-2.5 py-1 text-[11px] font-bold text-[#24492d] bg-white border border-[#24492d] rounded-lg hover:bg-[#edf5ee] transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Shipping Method</span>
              </button>
            </div>

            {/* Methods list */}
            <div className="space-y-2.5">
              {shippingOptions.map((opt, optIdx) => (
                <div key={optIdx} className="p-3 bg-white rounded-lg border border-[#ccdacc] grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  {/* Method Dropdown */}
                  <div className="sm:col-span-4 space-y-1">
                    <label className="block text-[10px] font-bold text-[#38533e] uppercase">
                      Shipping Method
                    </label>
                    <select
                      value={opt.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = [...shippingOptions];
                        updated[optIdx] = {
                          ...updated[optIdx],
                          name: val,
                          cost: val === 'Free Shipping' ? 0 : updated[optIdx].cost === 0 ? 4.99 : updated[optIdx].cost,
                          estimatedDeliveryTime: updated[optIdx].estimatedDeliveryTime || (val === 'Express Shipping' ? '1-2 business days' : val === 'Free Shipping' ? '5-7 business days' : '3-5 business days')
                        };
                        setShippingOptions(updated);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#ccdacc] bg-[#fafcfa] text-[#1c3f24] text-xs focus:outline-none focus:ring-1 focus:ring-[#24492d] cursor-pointer"
                    >
                      <option value="Standard Shipping">Standard Shipping</option>
                      <option value="Express Shipping">Express Shipping</option>
                      <option value="Free Shipping">Free Shipping</option>
                    </select>
                  </div>

                  {/* Estimated Delivery Time */}
                  <div className="sm:col-span-4 space-y-1">
                    <label className="block text-[10px] font-bold text-[#38533e] uppercase">
                      Estimated Delivery Time
                    </label>
                    <input
                      type="text"
                      required
                      value={opt.estimatedDeliveryTime}
                      onChange={(e) => {
                        const updated = [...shippingOptions];
                        updated[optIdx] = { ...updated[optIdx], estimatedDeliveryTime: e.target.value };
                        setShippingOptions(updated);
                      }}
                      placeholder="e.g. 3-5 business days"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#ccdacc] bg-[#fafcfa] text-[#1c3f24] text-xs focus:outline-none focus:ring-1 focus:ring-[#24492d]"
                    />
                  </div>

                  {/* Shipping Cost ($) */}
                  <div className="sm:col-span-3 space-y-1">
                    <label className="block text-[10px] font-bold text-[#38533e] uppercase">
                      Delivery Cost ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        disabled={opt.name === 'Free Shipping'}
                        value={opt.name === 'Free Shipping' ? '0' : opt.cost}
                        onChange={(e) => {
                          const updated = [...shippingOptions];
                          updated[optIdx] = { ...updated[optIdx], cost: parseFloat(e.target.value) || 0 };
                          setShippingOptions(updated);
                        }}
                        placeholder="4.99"
                        className={`w-full pl-6 pr-2 py-1.5 rounded-lg border border-[#ccdacc] text-[#1c3f24] text-xs focus:outline-none focus:ring-1 focus:ring-[#24492d] ${
                          opt.name === 'Free Shipping' ? 'bg-stone-100 text-stone-500 cursor-not-allowed' : 'bg-[#fafcfa]'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Delete button */}
                  <div className="sm:col-span-1 flex justify-center pb-0.5">
                    <button
                      type="button"
                      disabled={shippingOptions.length <= 1}
                      onClick={() => {
                        if (shippingOptions.length > 1) {
                          setShippingOptions(prev => prev.filter((_, i) => i !== optIdx));
                        }
                      }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        shippingOptions.length <= 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-red-400 hover:text-red-600 hover:bg-red-50'
                      }`}
                      title={shippingOptions.length <= 1 ? 'At least one shipping method is required' : 'Remove method'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Handling Time & Return Policy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[#e0ede2]">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[#1c3f24]">
                  Handling &amp; Dispatch Time
                </label>
                <input
                  type="text"
                  value={handlingTime}
                  onChange={(e) => setHandlingTime(e.target.value)}
                  placeholder="e.g. Dispatched within 24 hours"
                  className="w-full px-3 py-2 rounded-lg border border-[#ccdacc] bg-white text-[#1c3f24] text-xs focus:outline-none focus:ring-1 focus:ring-[#24492d]"
                />
              </div>

            {/* Return Policy */}
            <div className="space-y-1 pt-1">
              <label className="block text-[11px] font-semibold text-[#1c3f24]">
                Return Shipping &amp; Policy Details
              </label>
              <textarea
                rows={2}
                value={returnPolicy}
                onChange={(e) => setReturnPolicy(e.target.value)}
                placeholder="Describe return window, eligible conditions, and who pays return postage..."
                className="w-full px-3 py-1.5 rounded-lg border border-[#ccdacc] bg-white text-[#1c3f24] text-xs focus:outline-none focus:ring-1 focus:ring-[#24492d] resize-none"
              />
            </div>
          </div>
          </div>

          {/* Section 7: Product Specifications */}
          <div className="space-y-1.5">
            <label htmlFor="prod-specs" className="block text-xs font-semibold text-[#1c3f24] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#24492d]" />
              Product Specifications &amp; Technical Details
            </label>
            <textarea
              id="prod-specs"
              rows={2}
              value={specifications}
              onChange={(e) => setSpecifications(e.target.value)}
              placeholder="e.g. Form: Vegetable Capsules | Extraction Ratio: 10:1 | Packaging: Amber Glass Bottle | Certified Organic USDA"
              className="w-full px-3.5 py-2 rounded-lg border border-[#ccdacc] bg-[#fafcfa] text-[#1c3f24] text-xs focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d] transition-all resize-none"
            />
          </div>

          {/* Section 8: Best Seller Checkbox for Admin */}
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

          {/* Section 9: Overview & Description */}
          <div className="space-y-1.5">
            <label htmlFor="prod-desc" className="block text-xs font-semibold text-[#1c3f24]">
              Product Overview &amp; Summary
            </label>
            <textarea
              id="prod-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe therapeutic virtues, purity guarantees, and traditional heritage..."
              className="w-full px-3.5 py-2 rounded-lg border border-[#ccdacc] bg-[#fafcfa] text-[#1c3f24] text-xs focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d] transition-all resize-none"
            />
          </div>

          {/* Section 10: Key Benefits */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="prod-benefits" className="block text-xs font-semibold text-[#1c3f24] flex items-center gap-1.5">
                <ListChecks className="w-3.5 h-3.5 text-[#24492d]" />
                Key Benefits (One benefit per line)
              </label>
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

          {/* Section 11: Ingredients */}
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

          {/* Section 12: How To Use */}
          <div className="space-y-1.5">
            <label htmlFor="prod-howtouse" className="block text-xs font-semibold text-[#1c3f24] flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#24492d]" />
              How To Use &amp; Dosage Directions
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
              {photos[0] ? (
                <Image
                  src={resolveBackendImageUrl(photos[0])}
                  alt={name || 'Preview'}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-400">
                  <ImageIcon className="w-5 h-5" />
                </div>
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
                    <span className="text-[10px] text-stone-500">
                      • {countryOfOrigin || 'Origin'}
                    </span>
                    {shippingOptions.some(o => o.name === 'Free Shipping' || o.cost === 0) && (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded">
                        Free Delivery
                      </span>
                    )}
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
              className="px-5 py-2.5 rounded-lg border border-[#ccdacc] text-[#3e5642] hover:bg-[#f3f7f3] text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingImage}
              className="px-6 py-2.5 rounded-lg bg-[#24492d] hover:bg-[#1a3821] text-white text-xs font-bold tracking-wider uppercase shadow-md transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
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
