'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  X, 
  Sparkles, 
  AlertCircle, 
  Image as ImageIcon, 
  Check, 
  Upload, 
  Trash2, 
  Loader2, 
  Link as LinkIcon 
} from 'lucide-react';
import { WellnessNeed, CreateWellnessNeedInput, UpdateWellnessNeedInput } from '@/types';
import { uploadWellnessNeedImage, resolveBackendImageUrl } from '@/lib/api';

interface WellnessNeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWellnessNeedInput | UpdateWellnessNeedInput) => Promise<void>;
  initialData?: WellnessNeed | null;
  mode: 'create' | 'edit';
}

export default function WellnessNeedModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode
}: WellnessNeedModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setName(initialData.name || initialData.title || '');
      setDescription(initialData.description || initialData.subtitle || '');
      setImageUrl(initialData.imageUrl || '');
      setShowUrlInput(Boolean(initialData.imageUrl));
    } else {
      setName('');
      setDescription('');
      setImageUrl('');
      setShowUrlInput(false);
    }
    setError(null);
  }, [initialData, mode, isOpen]);

  const handleDeviceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (.png, .jpg, .webp, .svg, .avif).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image file size exceeds the 10MB limit.');
      return;
    }

    try {
      setUploadingImage(true);
      setError(null);
      const uploadedUrl = await uploadWellnessNeedImage(file);
      setImageUrl(uploadedUrl);
    } catch (err: any) {
      console.error('Failed to upload wellness need image:', err);
      setError(err.message || 'Failed to upload image to server. Please try again.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
        icon: initialData?.icon || undefined,
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#ccdacc] bg-[#fafcfa] text-[#1c3f24] text-sm focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d] transition-all"
            />
          </div>

          {/* Image (Upload from device or Add URL) */}
          <div className="space-y-3 p-4 rounded-xl bg-[#f7faf7] border border-[#d8e8dc]">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-[#1c3f24] flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#24492d]" />
                  Image
                </label>
                <p className="text-[11px] text-[#55735c] mt-0.5">
                  Upload an image from your device or provide an image link.
                </p>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleDeviceUpload}
                className="hidden"
              />
            </div>

            {/* Active Image Preview or Upload Zone */}
            {imageUrl.trim() ? (
              <div className="p-3.5 bg-white rounded-xl border border-[#ccdacc] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#24492d]/30 bg-[#edf4ee] shadow-xs flex items-center justify-center flex-shrink-0">
                    <Image
                      src={resolveBackendImageUrl(imageUrl.trim())}
                      alt="Wellness Need Preview"
                      fill
                      unoptimized
                      className="object-cover"
                      onError={() => {}}
                    />
                  </div>

                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <Check className="w-3 h-3" /> Image Selected
                    </span>
                    <p className="text-[10px] text-[#637d68] mt-1 truncate" title={imageUrl}>
                      {imageUrl.startsWith('data:') ? 'Local preview' : imageUrl}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    disabled={uploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-[#edf5ee] hover:bg-[#deede0] text-[#24492d] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Change</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Remove image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => !uploadingImage && fileInputRef.current?.click()}
                className="p-5 border-2 border-dashed border-[#b8dabf] rounded-xl bg-white text-center cursor-pointer hover:bg-[#f2f8f3] hover:border-[#24492d] transition-all group"
              >
                {uploadingImage ? (
                  <div className="py-2 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-7 h-7 text-[#24492d] animate-spin" />
                    <p className="text-xs font-semibold text-[#1c3f24]">Uploading from device...</p>
                    <p className="text-[10px] text-stone-500">Please wait while the image is being processed</p>
                  </div>
                ) : (
                  <div className="py-1">
                    <div className="w-10 h-10 mx-auto rounded-full bg-[#edf5ee] text-[#24492d] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-[#1c3f24]">Click to upload photo from your device</p>
                    <p className="text-[11px] text-[#698870] mt-0.5">PNG, JPG, WebP, AVIF, SVG up to 10MB</p>
                  </div>
                )}
              </div>
            )}

            {/* Direct URL Input Toggle / Field */}
            <div className="pt-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#6b8270] font-medium">Or enter image URL:</span>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(prev => !prev)}
                  className="text-[10px] text-[#24492d] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <LinkIcon className="w-2.5 h-2.5" />
                  {showUrlInput ? 'Hide URL input' : 'Enter image URL'}
                </button>
              </div>

              {showUrlInput && (
                <div className="pt-1 animate-fadeIn">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#ccdacc] bg-white text-[#1c3f24] focus:outline-none focus:ring-1 focus:ring-[#24492d]"
                  />
                </div>
              )}
            </div>
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
