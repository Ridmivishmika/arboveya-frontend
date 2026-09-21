'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, Check } from 'lucide-react';
import { WellnessNeed, CreateWellnessNeedInput, UpdateWellnessNeedInput } from '@/types';

interface WellnessNeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWellnessNeedInput | UpdateWellnessNeedInput) => Promise<void>;
  initialData?: WellnessNeed | null;
  mode: 'create' | 'edit';
}

const PRESET_ICONS = [
  { id: 'shield-plus', label: 'Immunity (Shield)' },
  { id: 'lungs', label: 'Respiratory (Lungs)' },
  { id: 'brain', label: 'Relaxation (Brain)' },
  { id: 'kidney', label: 'Kidney (Kidney)' },
  { id: 'droplet', label: 'Blood Sugar (Droplet)' },
  { id: 'stomach', label: 'Digestion (Stomach)' },
  { id: 'liver', label: 'Detox (Liver)' },
  { id: 'activity', label: 'Metabolism (Activity)' },
  { id: 'flower', label: "Women's (Flower)" },
  { id: 'sparkles', label: "Vitality (Sparkles)" },
  { id: 'bone', label: 'Joint & Bone (Bone)' },
];

export default function WellnessNeedModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode
}: WellnessNeedModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('shield-plus');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setName(initialData.name || initialData.title || '');
      setDescription(initialData.description || initialData.subtitle || '');
      setIcon(initialData.icon || 'shield-plus');
      setImageUrl(initialData.imageUrl || '');
    } else {
      setName('');
      setDescription('');
      setIcon('shield-plus');
      setImageUrl('');
    }
    setError(null);
  }, [initialData, mode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Wellness need name is required.');
      return;
    }
    if (name.trim().length > 100) {
      setError('Wellness need name cannot exceed 100 characters.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        icon: icon.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save wellness need.');
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
                {mode === 'create' ? 'Create Wellness Need' : 'Edit Wellness Need'}
              </h2>
              <p className="text-xs text-[#c2d6c6]">
                {mode === 'create' 
                  ? 'Define a new botanical therapeutic goal for customer filtering' 
                  : `Updating "${initialData?.name || initialData?.title}"`}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#c2d6c6] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1c3f24]">
              Wellness Need Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Immune Support, Stress & Relaxation"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#ccdacc] bg-[#fafcfa] text-[#1c3f24] text-sm focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d] transition-all"
            />
          </div>

          {/* Subtitle / Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1c3f24]">
              Subtitle / Therapeutic Scope (Short Description)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Boost Immunity, Stay Strong, Vital Organ Care"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#ccdacc] bg-[#fafcfa] text-[#1c3f24] text-sm focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d] transition-all"
            />
          </div>

          {/* Icon Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#1c3f24]">
              Therapeutic Icon Identifier
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_ICONS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setIcon(preset.id)}
                  className={`p-2 rounded-xl text-left border text-xs font-medium transition-all flex items-center justify-between ${
                    icon === preset.id
                      ? 'border-[#24492d] bg-[#edf5ee] text-[#1c3f24] shadow-2xs font-bold'
                      : 'border-[#dde6de] bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span className="truncate">{preset.label}</span>
                  {icon === preset.id && <Check className="w-3.5 h-3.5 text-[#24492d] flex-shrink-0" />}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Or custom icon slug (e.g. shield-plus, brain, lungs)"
              className="w-full px-3 py-1.5 rounded-lg border border-[#ccdacc] bg-white text-[#1c3f24] text-xs focus:outline-none focus:ring-1 focus:ring-[#24492d]"
            />
          </div>

          {/* Image URL (Optional) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1c3f24]">
              Banner / Thumbnail URL (Optional)
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://... or /images/..."
              className="w-full px-3.5 py-2 rounded-xl border border-[#ccdacc] bg-[#fafcfa] text-[#1c3f24] text-xs focus:outline-none focus:ring-1 focus:ring-[#24492d]"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#edf2ed]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-[#24492d] hover:bg-[#183a21] text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Saving...' : mode === 'create' ? 'Create Wellness Need' : 'Update Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
