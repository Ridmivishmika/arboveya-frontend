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
  RotateCcw,
  Tag,
  Clock
} from 'lucide-react';
import { Product, Category, WellnessNeed, CreateProductInput, UpdateProductInput, ProductVariant } from '@/types';
import { uploadProductImage, uploadMultipleProductImages, resolveBackendImageUrl } from '@/lib/api';
import { parseOfferTiers, ProductOfferTier } from '@/lib/offerUtils';

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

interface ModalVariant extends ProductVariant {
  isCustomWeight?: boolean;
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
  const [variants, setVariants] = useState<ModalVariant[]>([]);

  // Photos state (up to 10 photos uploaded from device)
  const [photos, setPhotos] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // New Botanical & Commercial Attributes
  const [countryOfOrigin, setCountryOfOrigin] = useState('Sri Lanka');
  const [condition, setCondition] = useState('Brand New / Fresh Harvest');
  const [expirationDate, setExpirationDate] = useState('');
  const [whenToUse, setWhenToUse] = useState('');
  const [specifications, setSpecifications] = useState('');

  // Discounts & Promotional Offers: Only Buy 2, Buy 3, Buy more than 3
  const [hasDiscount, setHasDiscount] = useState(false);
  const [buy2Active, setBuy2Active] = useState(true);
  const [buy2Percentage, setBuy2Percentage] = useState<number | ''>(10);
  const [buy3Active, setBuy3Active] = useState(true);
  const [buy3Percentage, setBuy3Percentage] = useState<number | ''>(15);
  const [buyMoreActive, setBuyMoreActive] = useState(true);
  const [buyMorePercentage, setBuyMorePercentage] = useState<number | ''>(20);

  // Handling & Delivery Presets
  const HANDLING_TIME_PRESETS = [
    '1 business day',
    '2 business days',
    '3 business days',
    '4 business days',
    '5 business days'
  ];

  const ESTIMATED_DELIVERY_PRESETS = [
    '5-7 business days',
    '7-14 business days',
    '14-21 business days'
  ];

  const UNIT_PRESETS: Record<'weight' | 'pieces' | 'leaves' | 'custom', string[]> = {
    weight: ['50g', '100g', '250g', '500g', '1kg'],
    pieces: ['10 pcs', '30 pcs', '60 pcs', '100 pcs', '120 pcs'],
    leaves: ['25 Leaves', '50 Leaves', '100 Leaves', '1 Bunch', '3 Bunches'],
    custom: ['50g', '100g', '250g', '500g', '1kg', '1 Pack', '2 Pack Bundle', '100ml', '250ml', '500ml']
  };

  // Unit Type for Variants (Weight, Pieces, Leaves, Custom)
  const [unitType, setUnitType] = useState<'weight' | 'pieces' | 'leaves' | 'custom'>('weight');
  const [customUnitInput, setCustomUnitInput] = useState('');
  const [savedCustomUnit, setSavedCustomUnit] = useState('');
  const [unitSavedSuccess, setUnitSavedSuccess] = useState(false);
  const [inlineCustomWeight, setInlineCustomWeight] = useState('');

  // Shipping & Schedule Options
  const [shippingOptions, setShippingOptions] = useState<Array<{
    name: string;
    estimatedDeliveryTime: string;
    cost: number;
    isCustomDelivery?: boolean;
  }>>([
    { name: 'Standard Shipping', estimatedDeliveryTime: '5-7 business days', cost: 4.99, isCustomDelivery: false },
    { name: 'Express Shipping', estimatedDeliveryTime: '5-7 business days', cost: 14.99, isCustomDelivery: false },
    { name: 'Free Shipping', estimatedDeliveryTime: '7-14 business days', cost: 0, isCustomDelivery: false }
  ]);
  const [handlingTime, setHandlingTime] = useState('1 business day');
  const [handlingPreset, setHandlingPreset] = useState('1 business day');
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
      setWhenToUse(initialData.whenToUse || '');
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
      setExpirationDate(initialData.expirationDate || (initialData.expiryDate ? initialData.expiryDate.split('T')[0] : ''));
      setSpecifications(initialData.specifications || '');
      const initialH = initialData.handlingTime || '1 business day';
      setHandlingTime(initialH);
      if (HANDLING_TIME_PRESETS.includes(initialH)) {
        setHandlingPreset(initialH);
      } else {
        setHandlingPreset('Custom');
      }
      setReturnPolicy(initialData.returnPolicy || '30-Day Return Window. Buyer pays return shipping. Items must be unopened.');

      // Discounts & Offers: parse Buy 2, Buy 3, Buy more than 3
      const existingOffer = initialData.offerName || '';
      const existingDiscount = Number(initialData.discountPercentage || 0);
      const parsedTiers = parseOfferTiers(existingOffer, existingDiscount);
      const hasD = parsedTiers.length > 0 || existingDiscount > 0 || Boolean(existingOffer);
      setHasDiscount(hasD);

      const t2 = parsedTiers.find(t => t.id === 'buy2');
      const t3 = parsedTiers.find(t => t.id === 'buy3');
      const tMore = parsedTiers.find(t => t.id === 'buyMore');

      if (hasD) {
        setBuy2Active(Boolean(t2));
        setBuy2Percentage(t2 ? t2.percentage : 10);

        setBuy3Active(Boolean(t3));
        setBuy3Percentage(t3 ? t3.percentage : 15);

        setBuyMoreActive(Boolean(tMore));
        setBuyMorePercentage(tMore ? tMore.percentage : 20);
      } else {
        setBuy2Active(true);
        setBuy2Percentage(10);
        setBuy3Active(true);
        setBuy3Percentage(15);
        setBuyMoreActive(true);
        setBuyMorePercentage(20);
      }

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
        setShippingOptions(parsedOptions.map((o: any) => {
          const isPreset = ESTIMATED_DELIVERY_PRESETS.includes(o.estimatedDeliveryTime);
          return {
            name: o.name || 'Standard Shipping',
            estimatedDeliveryTime: o.estimatedDeliveryTime || '5-7 business days',
            cost: o.name === 'Free Shipping' ? 0 : (Number(o.cost) || 0),
            isCustomDelivery: !isPreset && Boolean(o.estimatedDeliveryTime)
          };
        }));
      } else {
        const defaultList: any[] = [];
        const isFree = initialData.isFreeShipping || Number(initialData.shippingCost || 0) === 0;
        const methodName = initialData.shippingMethod || (isFree ? 'Free Shipping' : 'Standard Shipping');
        const costVal = isFree ? 0 : (Number(initialData.shippingCost) || 0);
        const estTime = initialData.estimatedDeliveryTime || (costVal === 0 ? '7-14 business days' : '5-7 business days');
        const isPreset = ESTIMATED_DELIVERY_PRESETS.includes(estTime);
        defaultList.push({
          name: methodName,
          estimatedDeliveryTime: estTime,
          cost: costVal,
          isCustomDelivery: !isPreset && Boolean(estTime)
        });
        setShippingOptions(defaultList);
      }

      // Variants & Unit Type inference
      const loadedVariants = (initialData.variants && initialData.variants.length > 0)
        ? initialData.variants.map(v => {
            const isPreset = UNIT_PRESETS.weight.includes(v.weight) || UNIT_PRESETS.pieces.includes(v.weight) || UNIT_PRESETS.leaves.includes(v.weight) || UNIT_PRESETS.custom.includes(v.weight);
            return { ...v, isCustomWeight: !isPreset };
          })
        : [{
            weight: initialData.weight || '100g',
            price: Number(initialData.price) || 24.99,
            stockQuantity: Number(initialData.stockQuantity) || 50,
            isCustomWeight: false
          }];
      setVariants(loadedVariants);

      const firstOpt = (loadedVariants[0]?.weight || initialData.weight || '').toLowerCase();
      if (firstOpt.includes('pc') || firstOpt.includes('capsule') || firstOpt.includes('tablet')) {
        setUnitType('pieces');
      } else if (firstOpt.includes('leaf') || firstOpt.includes('leaves') || firstOpt.includes('bunch')) {
        setUnitType('leaves');
      } else if (firstOpt.includes('pack') || firstOpt.includes('bottle') || firstOpt.includes('ml') || firstOpt.includes('box') || firstOpt.includes('liter')) {
        setUnitType('custom');
        setSavedCustomUnit(loadedVariants[0]?.weight || '');
        setCustomUnitInput(loadedVariants[0]?.weight || '');
      } else {
        setUnitType('weight');
      }
    } else {
      setName('');
      setCategoryId(categories[0]?.id || '');
      setWellnessNeedId('');
      setDescription('');
      setKeyBenefits('');
      setIngredients('');
      setHowToUse('');
      setWhenToUse('');
      setIsBestSeller(false);
      setPhotos([]);
      setCountryOfOrigin('Sri Lanka');
      setCondition('Brand New / Fresh Harvest');
      setExpirationDate('');
      setHasDiscount(false);
      setBuy2Active(true);
      setBuy2Percentage(10);
      setBuy3Active(true);
      setBuy3Percentage(15);
      setBuyMoreActive(true);
      setBuyMorePercentage(20);
      setUnitType('weight');
      setSpecifications('');
      setShippingOptions([
        { name: 'Standard Shipping', estimatedDeliveryTime: '5-7 business days', cost: 4.99, isCustomDelivery: false },
        { name: 'Express Shipping', estimatedDeliveryTime: '5-7 business days', cost: 14.99, isCustomDelivery: false },
        { name: 'Free Shipping', estimatedDeliveryTime: '7-14 business days', cost: 0, isCustomDelivery: false }
      ]);
      setHandlingTime('1 business day');
      setHandlingPreset('1 business day');
      setCustomUnitInput('');
      setSavedCustomUnit('');
      setUnitSavedSuccess(false);
      setInlineCustomWeight('');
      setReturnPolicy('30-Day Return Window. Buyer pays return shipping. Items must be unopened.');
      setVariants([{ weight: '100g', price: 24.99, stockQuantity: 50, isCustomWeight: false }]);
    }
    setError(null);
  }, [initialData, mode, isOpen, categories]);

  if (!isOpen) return null;

  // Process image files (from file input or drag-and-drop)
  const processFilesUpload = async (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      setError('Please select or drop valid image files (PNG, JPG, WebP, AVIF).');
      return;
    }

    if (photos.length + imageFiles.length > 10) {
      setError(`You can upload a maximum of 10 photos. You already have ${photos.length} photo(s).`);
      return;
    }

    try {
      setUploadingImage(true);
      setError(null);

      let newUrls: string[] = [];
      try {
        newUrls = await uploadMultipleProductImages(imageFiles);
      } catch {
        for (const file of imageFiles) {
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

  const handleDeviceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) processFilesUpload(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
    if (droppedFiles.length > 0) {
      processFilesUpload(droppedFiles);
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

  const handleAddVariantWithWeight = (weightName: string) => {
    if (!weightName.trim()) return;
    const isPreset = UNIT_PRESETS[unitType].includes(weightName.trim());
    if (variants.length === 1 && (!variants[0].weight || variants[0].weight.trim() === '')) {
      setVariants([{ ...variants[0], weight: weightName.trim(), isCustomWeight: !isPreset } as any]);
    } else {
      setVariants(prev => [
        ...prev,
        {
          weight: weightName.trim(),
          price: prev.length > 0 ? prev[prev.length - 1].price : 24.99,
          stockQuantity: 50,
          isCustomWeight: !isPreset
        } as any
      ]);
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

    const primaryImage = photos[0] || undefined;
    const galleryString = photos.length > 1 ? photos.slice(1).join(',') : undefined;

    if (shippingOptions.length === 0) {
      setError('Please add at least one shipping method for this product.');
      return;
    }

    for (const opt of shippingOptions) {
      if (!opt.estimatedDeliveryTime || !opt.estimatedDeliveryTime.trim()) {
        setError(`Please specify an estimated delivery time for "${opt.name}".`);
        return;
      }
    }

    const resolvedHandlingTime = handlingPreset === 'Custom' ? handlingTime.trim() : handlingPreset;
    if (!resolvedHandlingTime) {
      setError('Please specify a valid handling and dispatch time.');
      return;
    }

    const primaryShipping = shippingOptions[0];
    const hasFree = shippingOptions.some(o => o.name === 'Free Shipping' || Number(o.cost) === 0);

    const activeOfferStrings: string[] = [];
    if (buy2Active && Number(buy2Percentage) > 0) {
      activeOfferStrings.push(`Buy 2 Get ${buy2Percentage}% Off`);
    }
    if (buy3Active && Number(buy3Percentage) > 0) {
      activeOfferStrings.push(`Buy 3 Get ${buy3Percentage}% Off`);
    }
    if (buyMoreActive && Number(buyMorePercentage) > 0) {
      activeOfferStrings.push(`Buy more than 3 Get ${buyMorePercentage}% Off`);
    }

    if (hasDiscount && activeOfferStrings.length === 0) {
      setError('Please select at least one offer option (Buy 2, Buy 3, or Buy more than 3) with a valid percentage, or disable the offer option.');
      return;
    }

    const resolvedOfferName = hasDiscount && activeOfferStrings.length > 0 ? activeOfferStrings.join(' | ') : undefined;
    const resolvedDiscount = hasDiscount && activeOfferStrings.length > 0
      ? Math.max(
          buy2Active ? Number(buy2Percentage) || 0 : 0,
          buy3Active ? Number(buy3Percentage) || 0 : 0,
          buyMoreActive ? Number(buyMorePercentage) || 0 : 0
        )
      : 0;

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
        whenToUse: whenToUse.trim() || undefined,
        isBestSeller: isSeller ? false : isBestSeller,
        countryOfOrigin: countryOfOrigin.trim() || undefined,
        condition: condition.trim() || undefined,
        expirationDate: expirationDate.trim() || undefined,
        offerName: resolvedOfferName,
        discountPercentage: resolvedDiscount,
        specifications: specifications.trim() || undefined,
        shippingMethod: primaryShipping.name,
        estimatedDeliveryTime: primaryShipping.estimatedDeliveryTime.trim(),
        handlingTime: resolvedHandlingTime,
        isFreeShipping: hasFree,
        shippingCost: primaryShipping.name === 'Free Shipping' ? 0 : Number(primaryShipping.cost) || 0,
        returnPolicy: returnPolicy.trim() || undefined,
        shippingOptions: JSON.stringify(shippingOptions.map(o => ({
          name: o.name,
          estimatedDeliveryTime: o.estimatedDeliveryTime.trim(),
          cost: o.name === 'Free Shipping' ? 0 : Number(o.cost) || 0
        }))),
        variants: sortedVariants.map(v => ({
          weight: v.weight.trim(),
          price: Number(v.price),
          stockQuantity: Number(v.stockQuantity)
        }))
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

            {/* Photo Gallery Grid with Drag and Drop Support */}
            {photos.length === 0 ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#24492d] bg-[#ebf6ed] ring-2 ring-[#24492d]/30 scale-[1.01]'
                    : 'border-[#b8dabf] bg-white hover:bg-[#f2f8f3]'
                }`}
              >
                <Upload className={`w-7 h-7 mx-auto mb-1.5 transition-transform ${isDragging ? 'text-[#1c3f24] -translate-y-1' : 'text-[#436e4b]'}`} />
                <p className="text-xs font-semibold text-[#1c3f24]">
                  {isDragging ? 'Drop botanical images here to upload' : 'Click or Drag & Drop photos here to upload'}
                </p>
                <p className="text-[11px] text-[#698870] mt-0.5">PNG, JPG, WebP, AVIF up to 10MB each (max 10 photos)</p>
              </div>
            ) : (
              <div 
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1 p-2 rounded-xl transition-colors ${
                  isDragging ? 'bg-[#eaf4eb] ring-2 ring-[#24492d] ring-dashed' : ''
                }`}
              >
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

                {/* Drag and Drop Card to Add More (up to 10 photos) */}
                {photos.length < 10 && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-all ${
                      isDragging 
                        ? 'border-[#24492d] bg-[#dbeedd] scale-105' 
                        : 'border-[#b8dabf] bg-[#fafcfa] hover:bg-[#edf5ee]'
                    }`}
                  >
                    <Upload className="w-5 h-5 text-[#436e4b] mb-1" />
                    <span className="text-[10px] font-bold text-[#1c3f24] leading-tight">
                      {isDragging ? 'Drop here' : 'Add Photo'}
                    </span>
                    <span className="text-[9px] text-[#698870]">Drag &amp; drop</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 4: Botanical Origin, Condition & Expiration Date */}
          <div className="space-y-3 p-4 rounded-xl bg-[#fafcfa] border border-[#d8e6da]">
            <div className="flex items-center gap-2 pb-1 border-b border-[#e6efe7]">
              <Globe className="w-4 h-4 text-[#24492d]" />
              <h4 className="text-xs font-bold text-[#1c3f24]">Botanical Origin, Condition &amp; Expiration Date</h4>
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

              {/* Expiration Date - Text field per request (Manufacture Date removed) */}
              <div className="space-y-1 sm:col-span-2">
                <label className="block text-[11px] font-semibold text-[#1c3f24] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#24492d]" />
                  Expiration Date
                </label>
                <input
                  type="text"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  placeholder="e.g. 24 Months from packaging, Best before Dec 2026, or MM/YYYY"
                  className="w-full px-3 py-2 rounded-lg border border-[#ccdacc] bg-white text-[#1c3f24] text-xs focus:outline-none focus:ring-1 focus:ring-[#24492d]"
                />
                <p className="text-[10px] text-[#5d7762]">
                  Enter the expiration period, shelf life, or best before date in text format for customers.
                </p>
              </div>
            </div>
          </div>

          {/* Section 5: Weight, Pricing & Stock Options with Unit Type Selection */}
          <div className="space-y-3.5 p-4 rounded-xl bg-[#f0f7f1] border border-[#c9dece]">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <label className="block text-xs font-bold text-[#1c3f24] flex items-center gap-1.5">
                  <Weight className="w-3.5 h-3.5 text-[#24492d]" />
                  Pricing &amp; Stock Options <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-[#5c7561] mt-0.5">
                  Select your measurement unit below (Weight, Pieces, Leaves, or Custom). Then configure your options, price, and stock units.
                </p>
              </div>
            </div>

            {/* Step 1: Unit Type Selector */}
            <div className="space-y-2.5 bg-white p-3.5 rounded-xl border border-[#c6dfca] shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <label htmlFor="unit-type-select" className="block text-[11px] font-bold text-[#1c3f24] uppercase tracking-wide">
                    Select Pricing &amp; Measurement Unit:
                  </label>
                  <p className="text-[10px] text-[#5c7561] mt-0.5">
                    Select whether you quantify by Weight, Pieces, Leaves, or Custom.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    id="unit-type-select"
                    value={unitType}
                    onChange={(e) => {
                      const newType = e.target.value as 'weight' | 'pieces' | 'leaves' | 'custom';
                      setUnitType(newType);
                      // Update single/initial row to match the selected unit type if default
                      if (variants.length === 1 && (!variants[0].weight || variants[0].weight === '100g' || variants[0].weight === '30 pcs' || variants[0].weight === '25 Leaves' || variants[0].weight === '1 Pack')) {
                        const defaultVal =
                          newType === 'weight' ? '100g'
                          : newType === 'pieces' ? '30 pcs'
                          : newType === 'leaves' ? '25 Leaves'
                          : (customUnitInput.trim() ? `1 ${customUnitInput.trim()}` : '');
                        setVariants([{
                          ...variants[0],
                          weight: defaultVal,
                          isCustomWeight: newType === 'custom'
                        }]);
                      }
                    }}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-lg border border-[#24492d]/50 bg-[#fafcfa] text-[#1c3f24] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#24492d]/25 cursor-pointer shadow-2xs"
                  >
                    <option value="weight">Weight (g / kg)</option>
                    <option value="pieces">Pieces (pcs / count / capsules)</option>
                    <option value="leaves">Leaves (Leaves / Bunch)</option>
                    <option value="custom">Custom / Other (Editable)</option>
                  </select>

                  {/* Directly editable custom unit input when Custom is selected */}
                  {unitType === 'custom' && (
                    <input
                      type="text"
                      value={customUnitInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomUnitInput(val);
                        setSavedCustomUnit(val);
                      }}
                      placeholder="Type custom unit (e.g. Liter, Bottles, Capsules)..."
                      className="w-full sm:w-56 px-3 py-2 rounded-lg border border-[#24492d] bg-[#f7fbf8] text-[#1c3f24] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#24492d]/30 shadow-2xs animate-fadeIn"
                      autoFocus
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Column Headers - Only 4 columns: [Unit Name] Option, Price (USD $), Stock Units, Remove */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-[10px] font-bold text-[#45634b] uppercase px-1">
              <div className="col-span-5">
                {unitType === 'weight'
                  ? 'Weight Option (e.g. 50g, 100g, 1kg)'
                  : unitType === 'pieces'
                  ? 'Pieces Option (e.g. 30 pcs, 60 capsules)'
                  : unitType === 'leaves'
                  ? 'Leaves Option (e.g. 25 Leaves, 1 Bunch)'
                  : `${customUnitInput.trim() ? `${customUnitInput.trim()} Option` : 'Custom Option'}`}
              </div>
              <div className="col-span-3">Price (USD $)</div>
              <div className="col-span-3">Stock Units</div>
              <div className="col-span-1 text-center">Remove</div>
            </div>

            {/* Variant Rows */}
            <div className="space-y-2">
              {variants.map((v, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-lg border border-[#ccdacc] shadow-2xs">
                  {/* Single Clean Editable Field */}
                  <div className="sm:col-span-5 space-y-1">
                    <label className="block sm:hidden text-[10px] font-bold text-[#45634b] mb-1">
                      {unitType === 'weight'
                        ? 'Weight Option (e.g. 50g, 100g, 1kg)'
                        : unitType === 'pieces'
                        ? 'Pieces Option (e.g. 30 pcs, 60 capsules)'
                        : unitType === 'leaves'
                        ? 'Leaves Option (e.g. 25 Leaves, 1 Bunch)'
                        : `${customUnitInput.trim() ? `${customUnitInput.trim()} Option` : 'Custom Option'}`}
                    </label>
                    <input
                      type="text"
                      required
                      value={v.weight}
                      onChange={e => {
                        const updated = [...variants];
                        updated[idx] = {
                          ...updated[idx],
                          weight: e.target.value
                        };
                        setVariants(updated);
                      }}
                      placeholder={
                        unitType === 'weight'
                          ? 'e.g. 50g, 100g, 1kg'
                          : unitType === 'pieces'
                          ? 'e.g. 30 pcs, 60 capsules'
                          : unitType === 'leaves'
                          ? 'e.g. 25 Leaves, 1 Bunch'
                          : customUnitInput.trim()
                          ? `e.g. 1 ${customUnitInput.trim()}, 2 ${customUnitInput.trim()}`
                          : 'e.g. 1 Liter, 2 Liters'
                      }
                      className="w-full px-3 py-2 rounded-lg border border-[#ccdacc] bg-white text-[#1c3f24] text-xs focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d]"
                    />
                  </div>

                  {/* Price Input */}
                  <div className="sm:col-span-3">
                    <label className="block sm:hidden text-[10px] font-bold text-[#45634b] mb-1">Price (USD $)</label>
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
                    <label className="block sm:hidden text-[10px] font-bold text-[#45634b] mb-1">Stock Units</label>
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
                      onClick={() => {
                        if (variants.length > 1) {
                          setVariants(prev => prev.filter((_, i) => i !== idx));
                        } else {
                          // Clear the single row so seller can reset it cleanly
                          setVariants([{ weight: '', price: 0, stockQuantity: 0 }]);
                        }
                      }}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title={variants.length <= 1 ? 'Clear this row' : 'Remove this row'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Button to add more rows */}
            <div className="pt-1 flex items-center justify-between flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const defaultOptionName =
                    unitType === 'weight'
                      ? (UNIT_PRESETS.weight.find(p => !variants.some(v => v.weight === p)) || '')
                      : unitType === 'pieces'
                      ? (UNIT_PRESETS.pieces.find(p => !variants.some(v => v.weight === p)) || '')
                      : unitType === 'leaves'
                      ? (UNIT_PRESETS.leaves.find(p => !variants.some(v => v.weight === p)) || '')
                      : (customUnitInput.trim() ? `2 ${customUnitInput.trim()}` : '');

                  setVariants(prev => [
                    ...prev,
                    {
                      weight: defaultOptionName,
                      price: prev.length > 0 && prev[prev.length - 1].price ? prev[prev.length - 1].price : 24.99,
                      stockQuantity: 50,
                      isCustomWeight: unitType === 'custom'
                    }
                  ]);
                }}
                className="px-4 py-2 rounded-lg bg-white border border-[#24492d] hover:bg-[#edf5ee] text-[#24492d] text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Row</span>
              </button>

              <span className="text-[11px] text-[#5c7561]">
                {variants.length} {variants.length === 1 ? 'row configured' : 'rows configured'}
              </span>
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

          {/* Section: Discounts & Promotional Offers (Optional for Sellers & Admins) */}
          <div className="space-y-3.5 p-4 rounded-xl bg-[#fffcf5] border border-[#f3e3be]">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Tag className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-950">Discounts &amp; Promotional Offers (Optional)</h4>
                  <p className="text-[10px] text-amber-800">Set volume offers like "Buy 2 Get 10% Off" where item quantity and discount percentage can be customized.</p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none bg-white px-3 py-1.5 rounded-lg border border-amber-300 shadow-2xs hover:bg-amber-50/50 transition-colors">
                <input
                  type="checkbox"
                  checked={hasDiscount}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setHasDiscount(checked);
                    if (checked) {
                      if (!buy2Active && !buy3Active && !buyMoreActive) {
                        setBuy2Active(true);
                        setBuy2Percentage(10);
                        setBuy3Active(true);
                        setBuy3Percentage(15);
                        setBuyMoreActive(true);
                        setBuyMorePercentage(20);
                      }
                    }
                  }}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300 cursor-pointer"
                />
                <span className="text-xs font-bold text-amber-900">
                  {hasDiscount ? 'Promotional Offers Enabled' : 'Add Promotional Offers'}
                </span>
              </label>
            </div>

            {hasDiscount && (
              <div className="space-y-3.5 pt-2 border-t border-amber-200/80 animate-fadeIn">
                <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Select Multiple Promotional Offers (Percentage Only is Editable):</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Sellers can select one, two, or all three offer options below. Offer names are standardized, and only the discount percentage (%) is editable.
                  </p>
                </div>

                {/* 3 Offer Option Cards: Buy 2, Buy 3, Buy more than 3 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Option 1: Buy 2 */}
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    buy2Active 
                      ? 'bg-white border-amber-400 shadow-xs ring-1 ring-amber-400/30' 
                      : 'bg-stone-50 border-stone-200 opacity-70'
                  }`}>
                    <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={buy2Active}
                          onChange={(e) => setBuy2Active(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-amber-950">Buy 2 Offer</span>
                      </label>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                        Qty: 2
                      </span>
                    </div>

                    <div className="mt-2.5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
                        <span>Buy 2 Get</span>
                        <div className="relative w-24">
                          <input
                            type="number"
                            min="1"
                            max="90"
                            disabled={!buy2Active}
                            value={buy2Percentage}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : Math.max(1, Math.min(90, parseInt(e.target.value, 10) || 0));
                              setBuy2Percentage(val);
                            }}
                            className="w-full px-2 py-1 pr-7 rounded-lg border border-amber-300 bg-[#fffcf5] text-amber-950 text-xs font-bold text-right focus:outline-none focus:ring-2 focus:ring-amber-500/30 disabled:bg-stone-100 disabled:text-stone-400"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-800 pointer-events-none">
                            %
                          </span>
                        </div>
                        <span>Off</span>
                      </div>

                      <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-100 text-[11px] text-amber-900 font-semibold flex items-center justify-between">
                        <span className="text-stone-500 font-normal">Offer Name:</span>
                        <span className="font-bold">Buy 2 Get {buy2Percentage || 0}% Off</span>
                      </div>
                    </div>
                  </div>

                  {/* Option 2: Buy 3 */}
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    buy3Active 
                      ? 'bg-white border-amber-400 shadow-xs ring-1 ring-amber-400/30' 
                      : 'bg-stone-50 border-stone-200 opacity-70'
                  }`}>
                    <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={buy3Active}
                          onChange={(e) => setBuy3Active(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-amber-950">Buy 3 Offer</span>
                      </label>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                        Qty: 3
                      </span>
                    </div>

                    <div className="mt-2.5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
                        <span>Buy 3 Get</span>
                        <div className="relative w-24">
                          <input
                            type="number"
                            min="1"
                            max="90"
                            disabled={!buy3Active}
                            value={buy3Percentage}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : Math.max(1, Math.min(90, parseInt(e.target.value, 10) || 0));
                              setBuy3Percentage(val);
                            }}
                            className="w-full px-2 py-1 pr-7 rounded-lg border border-amber-300 bg-[#fffcf5] text-amber-950 text-xs font-bold text-right focus:outline-none focus:ring-2 focus:ring-amber-500/30 disabled:bg-stone-100 disabled:text-stone-400"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-800 pointer-events-none">
                            %
                          </span>
                        </div>
                        <span>Off</span>
                      </div>

                      <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-100 text-[11px] text-amber-900 font-semibold flex items-center justify-between">
                        <span className="text-stone-500 font-normal">Offer Name:</span>
                        <span className="font-bold">Buy 3 Get {buy3Percentage || 0}% Off</span>
                      </div>
                    </div>
                  </div>

                  {/* Option 3: Buy more than 3 */}
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    buyMoreActive 
                      ? 'bg-white border-amber-400 shadow-xs ring-1 ring-amber-400/30' 
                      : 'bg-stone-50 border-stone-200 opacity-70'
                  }`}>
                    <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={buyMoreActive}
                          onChange={(e) => setBuyMoreActive(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-amber-950">Buy &gt; 3 Offer</span>
                      </label>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                        Qty: 4+ (e.g. 10)
                      </span>
                    </div>

                    <div className="mt-2.5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
                        <span>Buy &gt; 3 Get</span>
                        <div className="relative w-24">
                          <input
                            type="number"
                            min="1"
                            max="90"
                            disabled={!buyMoreActive}
                            value={buyMorePercentage}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : Math.max(1, Math.min(90, parseInt(e.target.value, 10) || 0));
                              setBuyMorePercentage(val);
                            }}
                            className="w-full px-2 py-1 pr-7 rounded-lg border border-amber-300 bg-[#fffcf5] text-amber-950 text-xs font-bold text-right focus:outline-none focus:ring-2 focus:ring-amber-500/30 disabled:bg-stone-100 disabled:text-stone-400"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-800 pointer-events-none">
                            %
                          </span>
                        </div>
                        <span>Off</span>
                      </div>

                      <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-100 text-[11px] text-amber-900 font-semibold flex items-center justify-between">
                        <span className="text-stone-500 font-normal">Offer Name:</span>
                        <span className="font-bold">Buy more than 3 Get {buyMorePercentage || 0}% Off</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Handling Live Calculation & Simulation Preview */}
                {(() => {
                  const lowestP = variants.length > 0
                    ? Math.min(...variants.map(v => Number(v.price) || 0))
                    : 24.99;

                  const p2 = buy2Active ? Number(buy2Percentage) || 0 : 0;
                  const p3 = buy3Active ? Number(buy3Percentage) || 0 : p2;
                  const pMore = buyMoreActive ? Number(buyMorePercentage) || 0 : (buy3Active ? p3 : p2);

                  const u2 = p2 > 0 ? lowestP * (1 - p2 / 100) : lowestP;
                  const tot2 = u2 * 2;
                  const sav2 = (lowestP * 2) - tot2;

                  const u3 = p3 > 0 ? lowestP * (1 - p3 / 100) : lowestP;
                  const tot3 = u3 * 3;
                  const sav3 = (lowestP * 3) - tot3;

                  const u10 = pMore > 0 ? lowestP * (1 - pMore / 100) : lowestP;
                  const tot10 = u10 * 10;
                  const sav10 = (lowestP * 10) - tot10;

                  return (
                    <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2.5 text-xs text-amber-950">
                      <div className="flex items-center justify-between flex-wrap gap-1 font-bold text-[11px] text-amber-900">
                        <span className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-amber-700" />
                          Live Price Calculation Preview Across Purchase Quantities:
                        </span>
                        <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-black">
                          Automatic Multi-Tier Logic
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                        {/* 1 Item */}
                        <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                          <span className="block text-[10px] text-stone-500 font-semibold uppercase">1 Item (Qty 1):</span>
                          <span className="text-sm font-bold text-stone-800">${lowestP.toFixed(2)}</span>
                          <span className="text-[10px] text-stone-500 block mt-0.5">Regular price (no offer)</span>
                        </div>

                        {/* 2 Items */}
                        <div className={`p-2.5 bg-white rounded-lg border ${buy2Active ? 'border-amber-300 ring-1 ring-amber-300' : 'border-stone-200'}`}>
                          <span className="block text-[10px] text-amber-900 font-bold uppercase">2 Items (Qty 2):</span>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-sm font-black text-amber-950">${tot2.toFixed(2)}</span>
                            {p2 > 0 && <span className="text-[10px] text-stone-400 line-through">${(lowestP * 2).toFixed(2)}</span>}
                          </div>
                          <span className="text-[10px] text-amber-800 font-semibold block mt-0.5">
                            {buy2Active ? `$${u2.toFixed(2)} each (Save $${sav2.toFixed(2)})` : 'No Buy 2 offer active'}
                          </span>
                        </div>

                        {/* 3 Items */}
                        <div className={`p-2.5 bg-white rounded-lg border ${buy3Active ? 'border-amber-400 ring-1 ring-amber-400' : 'border-stone-200'}`}>
                          <span className="block text-[10px] text-amber-900 font-bold uppercase">3 Items (Qty 3):</span>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-sm font-black text-amber-950">${tot3.toFixed(2)}</span>
                            {p3 > 0 && <span className="text-[10px] text-stone-400 line-through">${(lowestP * 3).toFixed(2)}</span>}
                          </div>
                          <span className="text-[10px] text-amber-800 font-semibold block mt-0.5">
                            {buy3Active ? `$${u3.toFixed(2)} each (Save $${sav3.toFixed(2)})` : p2 > 0 ? `Uses Buy 2: $${u2.toFixed(2)} each` : 'No offer active'}
                          </span>
                        </div>

                        {/* 10 Items Demonstration */}
                        <div className={`p-2.5 bg-white rounded-lg border ${buyMoreActive ? 'border-emerald-400 ring-2 ring-emerald-400/30' : 'border-stone-200'}`}>
                          <div className="flex items-center justify-between">
                            <span className="block text-[10px] text-emerald-800 font-black uppercase">10 Items (Qty 10):</span>
                            {buyMoreActive && <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold">Buy &gt; 3 Active</span>}
                          </div>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-sm font-black text-emerald-900">${tot10.toFixed(2)}</span>
                            {pMore > 0 && <span className="text-[10px] text-stone-400 line-through">${(lowestP * 10).toFixed(2)}</span>}
                          </div>
                          <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                            ${u10.toFixed(2)} each (Buyer saves ${sav10.toFixed(2)} total!)
                          </span>
                        </div>
                      </div>

                      <p className="text-[10px] text-amber-800 font-medium pt-0.5 flex items-center gap-1">
                        <span>✨</span>
                        <span>Even if a customer selects 10 products, the <strong>Buy more than 3</strong> offer applies to all 10 items accurately during checkout.</span>
                      </p>
                    </div>
                  );
                })()}
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
                      estimatedDeliveryTime: newName === 'Free Shipping' ? '7-14 business days' : '5-7 business days',
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
                          estimatedDeliveryTime: updated[optIdx].estimatedDeliveryTime || (val === 'Free Shipping' ? '7-14 business days' : '5-7 business days')
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

                  {/* Estimated Delivery Time Dropdown with Presets & Custom Input */}
                  <div className="sm:col-span-4 space-y-1">
                    <label className="block text-[10px] font-bold text-[#38533e] uppercase">
                      Estimated Delivery Time
                    </label>
                    {(() => {
                      const isCustom = (opt as any).isCustomDelivery || !ESTIMATED_DELIVERY_PRESETS.includes(opt.estimatedDeliveryTime);
                      const selectedVal = isCustom ? 'Custom' : opt.estimatedDeliveryTime;

                      return (
                        <div className="space-y-1">
                          <select
                            value={selectedVal}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = [...shippingOptions];
                              if (val === 'Custom') {
                                updated[optIdx] = {
                                  ...updated[optIdx],
                                  isCustomDelivery: true
                                };
                              } else {
                                updated[optIdx] = {
                                  ...updated[optIdx],
                                  estimatedDeliveryTime: val,
                                  isCustomDelivery: false
                                };
                              }
                              setShippingOptions(updated);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#ccdacc] bg-[#fafcfa] text-[#1c3f24] text-xs focus:outline-none focus:ring-1 focus:ring-[#24492d] cursor-pointer"
                          >
                            {ESTIMATED_DELIVERY_PRESETS.map((preset) => (
                              <option key={preset} value={preset}>{preset}</option>
                            ))}
                            <option value="Custom">Custom Estimate...</option>
                          </select>

                          {isCustom && (
                            <input
                              type="text"
                              required
                              value={opt.estimatedDeliveryTime}
                              onChange={(e) => {
                                const updated = [...shippingOptions];
                                updated[optIdx] = {
                                  ...updated[optIdx],
                                  estimatedDeliveryTime: e.target.value,
                                  isCustomDelivery: true
                                };
                                setShippingOptions(updated);
                              }}
                              placeholder="e.g. 2-4 business days, 1-3 weeks"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-[#24492d]/50 bg-white text-[#1c3f24] text-xs focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 animate-fadeIn"
                              autoFocus={!opt.estimatedDeliveryTime}
                            />
                          )}
                        </div>
                      );
                    })()}
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
                <select
                  value={handlingPreset}
                  onChange={(e) => {
                    const val = e.target.value;
                    setHandlingPreset(val);
                    if (val !== 'Custom') {
                      setHandlingTime(val);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-[#ccdacc] bg-white text-[#1c3f24] text-xs focus:outline-none focus:ring-1 focus:ring-[#24492d] cursor-pointer"
                >
                  {HANDLING_TIME_PRESETS.map((preset) => (
                    <option key={preset} value={preset}>{preset}</option>
                  ))}
                  <option value="Custom">Custom (Enter your own days)...</option>
                </select>

                {handlingPreset === 'Custom' && (
                  <div className="mt-1.5 animate-fadeIn">
                    <input
                      type="text"
                      required
                      value={handlingTime}
                      onChange={(e) => setHandlingTime(e.target.value)}
                      placeholder="e.g. 6 business days, Same day dispatch..."
                      className="w-full px-3 py-2 rounded-lg border border-[#24492d]/50 bg-[#fafcfa] text-[#1c3f24] text-xs focus:outline-none focus:ring-2 focus:ring-[#24492d]/20"
                      autoFocus
                    />
                    <p className="text-[10px] text-[#557159] mt-0.5">Specify your custom handling schedule for buyers.</p>
                  </div>
                )}
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

          {/* Section 7: Product Specifications (Technical Details removed per request) */}
          <div className="space-y-1.5">
            <label htmlFor="prod-specs" className="block text-xs font-semibold text-[#1c3f24] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#24492d]" />
              Product Specifications
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

          {/* Section 12: How To Use & When To Use */}
          <div className="space-y-3">
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
                placeholder="e.g. Take 2 capsules daily with a glass of warm water or as recommended by an Ayurvedic physician."
                className="w-full px-3.5 py-2 rounded-lg border border-[#ccdacc] bg-[#fafcfa] text-[#1c3f24] text-xs focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d] transition-all resize-none"
              />
            </div>

            {/* When To Use Field with Presets & Custom Text input */}
            <div className="p-3.5 rounded-xl bg-[#fafcfa] border border-[#d8e6da] space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <label className="block text-xs font-semibold text-[#1c3f24] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#24492d]" />
                  When To Use
                </label>
                <span className="text-[10px] text-[#557159]">Suggested meal timing for buyers</span>
              </div>

              {/* Preset timing chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {['Before Meal', 'After Meal', 'With Meal', 'Empty Stomach', 'Morning & Night', 'Anytime'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setWhenToUse(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                      whenToUse === preset
                        ? 'bg-[#24492d] text-white border-[#24492d] shadow-2xs'
                        : 'bg-white hover:bg-[#edf5ee] text-[#1c3f24] border-[#ccdacc]'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Text input to allow custom or fine-tuned value */}
              <input
                type="text"
                value={whenToUse}
                onChange={(e) => setWhenToUse(e.target.value)}
                placeholder="e.g. Before Meal, After Meal, 30 mins before breakfast, or custom timing..."
                className="w-full px-3 py-2 rounded-lg border border-[#ccdacc] bg-white text-[#1c3f24] text-xs focus:outline-none focus:ring-1 focus:ring-[#24492d]"
              />
            </div>
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
                const activeTiers = hasDiscount ? [
                  buy2Active && Number(buy2Percentage) > 0 ? `Buy 2 Get ${buy2Percentage}% Off` : null,
                  buy3Active && Number(buy3Percentage) > 0 ? `Buy 3 Get ${buy3Percentage}% Off` : null,
                  buyMoreActive && Number(buyMorePercentage) > 0 ? `Buy more than 3 Get ${buyMorePercentage}% Off` : null
                ].filter(Boolean) as string[] : [];

                return (
                  <div className="space-y-1 mt-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#1c3f24]">
                        ${pPrice.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-[#556e59]">
                        ({pWeight})
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#e3ede5] text-[#24492d] font-semibold">
                        Stock: {pStock}
                      </span>
                      {activeTiers.map((t) => (
                        <span key={t} className="text-[9px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                          🏷️ {t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-stone-500 flex-wrap">
                      <span>• Origin: {countryOfOrigin || 'Origin'}</span>
                      {expirationDate && (
                        <span>• Exp: {expirationDate}</span>
                      )}
                      {whenToUse && (
                        <span className="text-[#24492d] font-medium">• Timing: {whenToUse}</span>
                      )}
                      {shippingOptions.some(o => o.name === 'Free Shipping' || o.cost === 0) && (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded">
                          Free Delivery
                        </span>
                      )}
                    </div>
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
