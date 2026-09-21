'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Sparkles, AlertCircle, Image as ImageIcon, Check } from 'lucide-react';
import { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCategoryInput | UpdateCategoryInput) => Promise<void>;
  initialData?: Category | null;
  mode: 'create' | 'edit';
}

const PRESET_IMAGES = [
  { label: 'Detox Tea', url: '/images/herbal-detox-tea.jpg' },
  { label: 'Moringa', url: '/images/moringa-capsules.jpg' },
  { label: 'Turmeric', url: '/images/turmeric-curcumin.jpg' },
  { label: 'Hair Oil', url: '/images/herbal-hair-oil.jpg' },
  { label: 'Ashwagandha', url: '/images/ashwagandha-capsules.jpg' },
  { label: 'Immunity Kit', url: '/images/wellness-immunity-kit.jpg' }
];

export default function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode
}: CategoryModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setImageUrl(initialData.imageUrl || '');
    } else {
      setName('');
      setDescription('');
      setImageUrl('');
    }
    setError(null);
  }, [initialData, mode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }
    if (name.trim().length > 100) {
      setError('Category name cannot exceed 100 characters.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save category. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#dbe6dc] overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#173a20] to-[#254f2f] text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/10 text-[#d8c28c]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold tracking-wide">
                {mode === 'create' ? 'Create New Category' : 'Edit Category'}
              </h2>
              <p className="text-xs text-[#c2d6c6]">
                {mode === 'create' 
                  ? 'Add a new wellness product classification with circular icon' 
                  : `Updating "${initialData?.name}"`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Round Image Preview & URL Input */}
          <div className="space-y-3 p-4 rounded-xl bg-[#f7faf7] border border-[#e2ede3]">
            <label className="block text-xs font-semibold text-[#1c3f24]">
              Category Image <span className="text-gray-400 font-normal">(Displays in round badge on store)</span>
            </label>

            <div className="flex items-center gap-4">
              {/* Circular Preview */}
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#24492d] bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                {imageUrl.trim() ? (
                  <Image
                    src={imageUrl.trim()}
                    alt="Category Round Preview"
                    fill
                    sizes="64px"
                    className="object-cover"
                    onError={() => {}}
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-[#9eb6a2]" />
                )}
              </div>

              {/* URL Input */}
              <div className="flex-1 space-y-1">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste image URL (https://... or /images/...)"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#ccdacc] bg-white text-[#1c3f24] focus:outline-none focus:ring-1 focus:ring-[#24492d] focus:border-[#24492d]"
                />
                <p className="text-[10px] text-[#6b8270]">
                  Enter a URL or pick one of the quick presets below:
                </p>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_IMAGES.map((preset) => {
                const isSelected = imageUrl === preset.url;
                return (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setImageUrl(preset.url)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-[#24492d] text-white'
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

          {/* Category Name */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="category-name" className="font-semibold text-[#1c3f24]">
                Category Name <span className="text-red-500">*</span>
              </label>
              <span className={`text-[11px] ${name.length > 90 ? 'text-amber-600 font-bold' : 'text-gray-400'}`}>
                {name.length}/100
              </span>
            </div>
            <input
              id="category-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Ceylon Herbal Teas"
              maxLength={100}
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#ccdacc] bg-[#fafcfa] text-[#1c3f24] text-sm focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d] transition-all"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="category-desc" className="block text-xs font-semibold text-[#1c3f24]">
              Description <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              id="category-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the therapeutic benefits, ingredients, and product types within this category..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#ccdacc] bg-[#fafcfa] text-[#1c3f24] text-sm focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d] transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#edf2ed]">
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
              disabled={submitting}
              className="px-6 py-2.5 rounded-lg bg-[#24492d] hover:bg-[#1a3821] text-white text-xs font-bold tracking-wider uppercase shadow-md transition-all flex items-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{mode === 'create' ? 'Create Category' : 'Save Changes'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
