'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BlogPost } from '@/types';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Clock, 
  Share2, 
  Check, 
  Leaf, 
  Edit3, 
  Trash2, 
  ArrowRight, 
  Tag, 
  BookOpen, 
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ChevronRight,
  X,
  PenTool,
  Upload,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Eye,
  Type,
  Info,
  CheckCircle2
} from 'lucide-react';
import { getBlogById, getPublishedBlogs, resolveBackendImageUrl, deleteBlog, updateBlog, uploadBlogImage } from '@/lib/api';
import BlogRenderer, { stripBlogFormatting } from '@/components/blog/BlogRenderer';

export default function BlogPostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const blogId = params?.id as string;

  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formCategories, setFormCategories] = useState<string[]>(['Wellness']);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formContent, setFormContent] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [editorTab, setEditorTab] = useState<'write' | 'preview'>('write');
  const [selectedFontSize, setSelectedFontSize] = useState<string>('normal');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Fetch blog data
  useEffect(() => {
    if (!blogId) return;

    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('arboveya_token') : '') || undefined;
        const data = await getBlogById(blogId, authToken);
        if (!isMounted) return;

        if (!data) {
          setError('Blog article not found or awaiting approval.');
          setLoading(false);
          return;
        }

        setBlog(data);
        setImageError(false);

        // Fetch other published blogs for the "More Articles" section
        try {
          const allPublished = await getPublishedBlogs();
          if (isMounted) {
            setRelatedBlogs(allPublished.filter(b => b.id !== data.id).slice(0, 3));
          }
        } catch {
          // ignore related blogs error
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to load article.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [blogId, token]);

  // Reading time estimate (200 wpm)
  const readingTime = useMemo(() => {
    if (!blog?.content) return 1;
    const plain = stripBlogFormatting(blog.content);
    const words = plain.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  }, [blog?.content]);

  // Share link handler
  const handleShare = async () => {
    try {
      if (typeof window !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // ignore
    }
  };

  // Open Edit Modal
  const handleOpenEdit = () => {
    if (!blog) return;
    setFormTitle(blog.title);
    let cats: string[] = [];
    if (blog.categories && blog.categories.length > 0) {
      cats = [...blog.categories];
    } else if (blog.category) {
      cats = blog.category.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (cats.length === 0) cats = ['Wellness'];
    setFormCategories(cats);
    setCustomCategoryInput('');
    setFormImageUrl(blog.imageUrl || '');
    setFormContent(blog.content || '');
    setEditorTab('write');
    setSelectedFontSize('normal');
    setStatusMessage(null);
    setUploadError(null);
    setShowEditModal(true);
  };

  // Text formatting helpers for Blog content
  const applyFormatting = (prefix: string, suffix: string = '', defaultText: string = 'text') => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = formContent;
    const selectedText = text.substring(start, end);

    const insertText = selectedText ? `${prefix}${selectedText}${suffix}` : `${prefix}${defaultText}${suffix}`;
    const updated = text.substring(0, start) + insertText + text.substring(end);
    setFormContent(updated);

    setTimeout(() => {
      el.focus();
      if (selectedText) {
        el.setSelectionRange(start + prefix.length, end + prefix.length);
      } else {
        el.setSelectionRange(start + prefix.length, start + prefix.length + defaultText.length);
      }
    }, 0);
  };

  const applyLinePrefix = (prefix: string, defaultText: string = 'Heading text') => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = formContent;

    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = text.indexOf('\n', end);
    const actualLineEnd = lineEnd === -1 ? text.length : lineEnd;

    const currentLine = text.substring(lineStart, actualLineEnd);
    const cleanedLine = currentLine.replace(/^(#+\s*|>\s*|[-*]\s*|\d+\.\s*)/, '');
    const newText = prefix ? `${prefix} ${cleanedLine || defaultText}` : cleanedLine;

    const updated = text.substring(0, lineStart) + newText + text.substring(actualLineEnd);
    setFormContent(updated);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(lineStart + newText.length, lineStart + newText.length);
    }, 0);
  };

  const applyFontSize = (size: string) => {
    setSelectedFontSize(size);
    if (size === 'h1') applyLinePrefix('#', 'Main Title');
    else if (size === 'h2') applyLinePrefix('##', 'Subheading');
    else if (size === 'h3') applyLinePrefix('###', 'Section Heading');
    else if (size === 'small') applyFormatting('<small>', '</small>', 'Small text note');
    else applyLinePrefix('', '');
  };

  const toggleFormCategory = (cat: string) => {
    setFormCategories((prev) => {
      if (prev.includes(cat)) {
        if (prev.length <= 1) return prev;
        return prev.filter(c => c !== cat);
      } else {
        return [...prev, cat];
      }
    });
  };

  const handleAddFormCustomCategory = () => {
    const trimmed = customCategoryInput.trim();
    if (!trimmed) return;
    if (!formCategories.includes(trimmed)) {
      setFormCategories(prev => [...prev, trimmed]);
    }
    setCustomCategoryInput('');
  };

  // Image Upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5MB limit');
      return;
    }

    setUploadingImage(true);
    setUploadError(null);

    try {
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('arboveya_token') : '') || undefined;
      const uploadedUrl = await uploadBlogImage(file, authToken);
      setFormImageUrl(uploadedUrl);
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Submit Updated Blog
  const handleUpdateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blog) return;
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('arboveya_token') : '') || '';
    if (!authToken) {
      alert('Please log in to edit this blog.');
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    const finalCategoryString = formCategories.join(', ');

    try {
      const updated = await updateBlog(
        blog.id,
        {
          title: formTitle.trim(),
          content: formContent.trim(),
          category: finalCategoryString,
          categories: formCategories,
          imageUrl: formImageUrl.trim(),
        },
        authToken
      );

      setBlog(updated);
      setImageError(false);
      setShowEditModal(false);
      setStatusMessage({ text: 'Article updated successfully!', type: 'success' });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'Failed to update article', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!blog) return;
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('arboveya_token') : '') || '';
    if (!authToken) {
      alert('Please log in to delete this article.');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to delete "${blog.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteBlog(blog.id, authToken);
      router.push('/blog');
    } catch (err: any) {
      alert(err?.message || 'Failed to delete blog');
      setIsDeleting(false);
    }
  };

  const isAuthorOrAdmin = user && blog && (user.id === blog.authorId || user.role === 'Admin');

  // Status badge for author/admin review
  const renderStatusBadge = () => {
    if (!blog) return null;
    if (blog.isApproved) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Published</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full uppercase tracking-wider">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        <span>Pending Review</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-[#fdfbf7] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-full border-3 border-[#2E4D38] border-t-transparent animate-spin mb-4" />
        <p className="text-stone-600 font-medium text-sm">Loading wellness article...</p>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-[70vh] bg-[#fdfbf7] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-4">
          <AlertCircle className="w-8 h-8 text-stone-400" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-stone-900 mb-2">Article Not Found</h1>
        <p className="text-stone-500 text-sm max-w-md mb-6">
          {error || "The article you are looking for doesn't exist, has been removed, or is awaiting moderator approval."}
        </p>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#2E4D38] text-white font-semibold text-sm hover:bg-[#243f2e] transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all articles</span>
        </Link>
      </div>
    );
  }

  const categoryList = blog.categories && blog.categories.length > 0 
    ? blog.categories 
    : [blog.category || 'Wellness'];

  const formattedDate = new Date(blog.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-[#fcfbfa] text-stone-800 pb-20">
      {/* Top Header / Breadcrumb Bar */}
      <div className="border-b border-stone-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-stone-600 hover:text-[#2E4D38] transition group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Blogs</span>
          </Link>

          {/* Breadcrumb path for desktop */}
          <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-stone-400">
            <Link href="/" className="hover:text-stone-700 transition">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/blog" className="hover:text-stone-700 transition">Blog</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#2E4D38] font-medium truncate max-w-[150px]">{categoryList[0]}</span>
          </nav>

          {/* Quick Actions (Share, Edit, Delete) */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-200 bg-white text-stone-700 hover:border-[#2E4D38] hover:text-[#2E4D38] text-xs font-semibold transition cursor-pointer shadow-2xs"
              title="Share article"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </>
              )}
            </button>

            {isAuthorOrAdmin && (
              <>
                <button
                  type="button"
                  onClick={handleOpenEdit}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#2E4D38] text-white text-xs font-semibold hover:bg-[#243f2e] transition shadow-2xs cursor-pointer"
                  title="Edit this blog"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition shadow-2xs cursor-pointer disabled:opacity-50"
                  title="Delete this blog"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Floating Status / Success Toast */}
      {statusMessage && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className={`p-4 rounded-xl flex items-center gap-3 text-xs sm:text-sm font-medium shadow-sm ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Article Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {/* Categories Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {categoryList.map((cat, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#2E4D38] bg-[#eef4ee] border border-[#cfe2d1] px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs"
            >
              <Tag className="w-3 h-3 text-[#2E4D38]" />
              {cat}
            </span>
          ))}
          {isAuthorOrAdmin && renderStatusBadge()}
        </div>

        {/* Article Headline */}
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-stone-900 leading-[1.2] tracking-tight mb-6 break-words">
          {blog.title}
        </h1>

        {/* Author & Publication Meta Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-stone-200/80 mb-8">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#2E4D38] to-[#1c3524] text-white flex items-center justify-center font-bold font-serif text-base shadow-sm ring-2 ring-white">
              {blog.authorName ? blog.authorName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div>
              <p className="font-semibold text-stone-900 text-sm sm:text-base">
                {blog.authorName || 'Arboveya Contributor'}
              </p>
              <p className="text-xs text-stone-500 flex items-center gap-2 flex-wrap">
                <span>{blog.authorRole === 'Seller' ? 'Herbal Artisan & Seller' : 'Wellness Enthusiast'}</span>
                {blog.authorRole === 'Seller' && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-stone-300" />
                )}
                {blog.authorRole === 'Seller' && (
                  <span className="text-emerald-700 font-semibold">Verified Seller</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-stone-500 font-medium">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-stone-400" />
              {formattedDate}
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-stone-300" />
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-stone-400" />
              {readingTime} min read
            </span>
          </div>
        </div>

        {/* Featured Hero Image */}
        {blog.imageUrl && !imageError ? (
          <div className="relative aspect-[16/9] sm:aspect-[21/10] w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border border-stone-200/70 mb-10 bg-stone-100">
            <Image
              src={resolveBackendImageUrl(blog.imageUrl)}
              alt={blog.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 896px"
              className="object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="relative w-full rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#edf5ee] via-[#f7faf7] to-[#e6efe7] border border-[#cfe2d1] p-8 sm:p-12 mb-10 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-white border border-[#bed8c2] flex items-center justify-center text-[#2E4D38] shadow-xs mb-4">
              <Leaf className="w-8 h-8 text-[#2E4D38]" />
            </div>
            <p className="font-serif text-lg sm:text-xl font-bold text-[#1c3f24] max-w-lg mb-2">
              Natural Wellness & Herbal Knowledge
            </p>
            <p className="text-xs text-stone-500 max-w-md">
              Published on the Arboveya botanical journal for holistic well-being.
            </p>
          </div>
        )}

        {/* Article Body Content */}
        <article className="prose prose-stone prose-lg max-w-none text-stone-700 leading-relaxed font-sans mb-14">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-12 border border-stone-200/80 shadow-xs">
            <BlogRenderer content={blog.content} />
          </div>
        </article>

        {/* Author Bio Box */}
        <div className="bg-[#f5f8f5] rounded-2xl p-6 sm:p-8 border border-[#cbe0ce] flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-14 shadow-2xs">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2E4D38] to-[#1c3524] text-white flex items-center justify-center font-serif text-2xl font-bold flex-shrink-0 shadow-sm">
            {blog.authorName ? blog.authorName.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="text-center sm:text-left flex-1 min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1 flex-wrap">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                {blog.authorName || 'Arboveya Author'}
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white border border-[#cfe2d1] text-[#2E4D38]">
                {blog.authorRole === 'Seller' ? 'Registered Seller' : 'Author'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-3">
              Contributing articles and guides to empower the Arboveya community with genuine botanical insights, authentic Ayurvedic practices, and conscious wellness remedies.
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-4 text-xs font-semibold text-[#2E4D38]">
              <Link href="/blog" className="hover:underline flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Explore all articles</span>
              </Link>
              <span>•</span>
              <Link href="/shop" className="hover:underline flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Visit Herbal Marketplace</span>
              </Link>
            </div>
          </div>
        </div>

        {/* More Articles to Explore */}
        {relatedBlogs.length > 0 && (
          <section className="pt-8 border-t border-stone-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
                  More Articles to Explore
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  Continue reading stories from our botanical journal
                </p>
              </div>
              <Link
                href="/blog"
                className="text-xs sm:text-sm font-bold text-[#2E4D38] hover:text-[#1c3524] flex items-center gap-1 transition"
              >
                <span>View all</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedBlogs.map((item) => (
                <Link
                  key={item.id}
                  href={`/blog/${item.id}`}
                  className="group bg-white rounded-2xl border border-stone-200/80 overflow-hidden hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="relative aspect-[16/10] bg-stone-100 overflow-hidden">
                    {item.imageUrl ? (
                      <Image
                        src={resolveBackendImageUrl(item.imageUrl)}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 300px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-[#f4f7f4] text-center">
                        <Leaf className="w-6 h-6 text-[#2E4D38] mb-1.5 opacity-60" />
                        <span className="text-xs font-serif font-bold text-[#1c3f24] line-clamp-2">
                          {item.title}
                        </span>
                      </div>
                    )}
                    <span className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-xs text-[#2E4D38] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                      {item.category || 'Wellness'}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif text-sm font-bold text-stone-900 group-hover:text-[#2E4D38] transition line-clamp-2 leading-snug mb-2">
                        {item.title}
                      </h3>
                      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed mb-3">
                        {stripBlogFormatting(item.content)}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-[#2E4D38] font-bold">
                      <span>Read article</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* EDIT BLOG MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
              <div className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-[#2E4D38]" />
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Edit Blog Post
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {user?.role === 'Seller' && (
              <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Seller Publishing Policy:</strong> For changes to appear publicly, an administrator may review updated content.
                </div>
              </div>
            )}

            <form onSubmit={handleUpdateBlog} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Blog Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. The Healing Power of Gotu Kola"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                />
              </div>

              {/* Multi-category Selector */}
              <div className="space-y-2 p-3.5 bg-[#fbfdfb] border border-stone-200 rounded-xl">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="block text-xs font-semibold text-stone-700">
                    Categories (Select one or more) *
                  </label>
                  <span className="text-[11px] font-bold text-[#2E4D38] bg-[#edf5ee] px-2.5 py-0.5 rounded-full border border-[#bcd2bf]">
                    {formCategories.length} {formCategories.length === 1 ? 'Category' : 'Categories'} Selected
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-0.5">
                  {Array.from(new Set([
                    'Wellness',
                    'Herbal Remedies',
                    'Ayurveda',
                    'Herbal Tea',
                    'Skincare',
                    'Nutrition',
                    'Mindfulness',
                    'Tea Rituals',
                    'Plant Nutrition',
                    ...formCategories
                  ])).map((cat) => {
                    const isSelected = formCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleFormCategory(cat)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                          isSelected
                            ? 'bg-[#2E4D38] text-white border-[#2E4D38]'
                            : 'bg-white text-stone-700 border-stone-200 hover:border-[#2E4D38]/40 hover:bg-[#edf5ee]'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFormCustomCategory();
                      }
                    }}
                    placeholder="Or type custom category and click Add..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#2E4D38]"
                  />
                  <button
                    type="button"
                    onClick={handleAddFormCustomCategory}
                    disabled={!customCategoryInput.trim()}
                    className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Cover Image Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-stone-700">
                    Featured Image / Cover (Optional)
                  </label>
                  {formImageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormImageUrl('')}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                    >
                      Remove Image
                    </button>
                  )}
                </div>

                {formImageUrl ? (
                  <div className="relative aspect-[16/7] w-full rounded-xl overflow-hidden bg-stone-100 border border-stone-200 group shadow-2xs">
                    <Image
                      src={resolveBackendImageUrl(formImageUrl)}
                      alt={formTitle || 'Blog cover preview'}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-white/95 text-stone-800 text-xs font-semibold hover:bg-white shadow-xs transition cursor-pointer"
                      >
                        Change Image
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormImageUrl('')}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shadow-xs transition cursor-pointer"
                      >
                        Clear Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[16/7] w-full rounded-xl bg-[#f4f7f4] border-2 border-dashed border-[#ccdccd] flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-white text-[#24492d] flex items-center justify-center mb-1.5 shadow-2xs">
                      <Leaf className="w-5 h-5 opacity-70" />
                    </div>
                    <span className="text-xs font-serif font-bold text-[#1c3f24] line-clamp-1 break-words">
                      {formTitle || 'No Image Added (Will display blog title)'}
                    </span>
                    <span className="text-[10px] text-stone-400 mt-0.5">
                      Upload an image from your device below, or leave blank to display title banner
                    </span>
                  </div>
                )}

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full py-2.5 px-3 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#2E4D38]" />
                        <span>Uploading image...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-stone-600" />
                        <span>Upload Image from Device</span>
                      </>
                    )}
                  </button>
                  {uploadError && (
                    <p className="text-[11px] text-rose-600 mt-1">{uploadError}</p>
                  )}
                </div>
              </div>

              {/* Write & Preview Tabs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setEditorTab('write')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        editorTab === 'write' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorTab('preview')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                        editorTab === 'preview' ? 'bg-white text-[#2E4D38] shadow-2xs' : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Live Preview</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-stone-400">
                    {formContent.length} characters
                  </span>
                </div>

                {editorTab === 'write' ? (
                  <div className="space-y-1.5">
                    {/* Rich Formatting Toolbar */}
                    <div className="flex flex-wrap items-center gap-1 p-2 bg-[#f9faf9] border border-stone-200 rounded-xl">
                      <div className="flex items-center gap-1 border-r border-stone-200 pr-2 mr-1">
                        <Type className="w-3.5 h-3.5 text-stone-500" />
                        <select
                          value={selectedFontSize}
                          onChange={(e) => applyFontSize(e.target.value)}
                          className="text-xs bg-white border border-stone-200 rounded-md px-1.5 py-0.5 text-stone-700 focus:outline-none"
                          title="Font size / Heading level"
                        >
                          <option value="normal">Normal Body</option>
                          <option value="h1">Heading 1 (Main)</option>
                          <option value="h2">Heading 2 (Sub)</option>
                          <option value="h3">Heading 3 (Section)</option>
                          <option value="small">Small Note</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => applyFormatting('**', '**', 'bold text')}
                        className="p-1.5 hover:bg-stone-200 rounded text-stone-700 transition cursor-pointer"
                        title="Bold (**text**)"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormatting('*', '*', 'italic text')}
                        className="p-1.5 hover:bg-stone-200 rounded text-stone-700 transition cursor-pointer"
                        title="Italic (*text*)"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormatting('<u>', '</u>', 'underlined text')}
                        className="p-1.5 hover:bg-stone-200 rounded text-stone-700 transition cursor-pointer"
                        title="Underline"
                      >
                        <Underline className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormatting('~~', '~~', 'strikethrough text')}
                        className="p-1.5 hover:bg-stone-200 rounded text-stone-700 transition cursor-pointer"
                        title="Strikethrough (~~text~~)"
                      >
                        <Strikethrough className="w-3.5 h-3.5" />
                      </button>

                      <div className="w-[1px] h-4 bg-stone-200 mx-1" />

                      <button
                        type="button"
                        onClick={() => applyLinePrefix('#', 'Main Heading')}
                        className="p-1.5 hover:bg-stone-200 rounded text-stone-700 transition cursor-pointer"
                        title="Heading 1 (# Heading)"
                      >
                        <Heading1 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => applyLinePrefix('##', 'Subheading')}
                        className="p-1.5 hover:bg-stone-200 rounded text-stone-700 transition cursor-pointer"
                        title="Heading 2 (## Heading)"
                      >
                        <Heading2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => applyLinePrefix('###', 'Section Heading')}
                        className="p-1.5 hover:bg-stone-200 rounded text-stone-700 transition cursor-pointer"
                        title="Heading 3 (### Heading)"
                      >
                        <Heading3 className="w-3.5 h-3.5" />
                      </button>

                      <div className="w-[1px] h-4 bg-stone-200 mx-1" />

                      <button
                        type="button"
                        onClick={() => applyLinePrefix('- ', 'List item')}
                        className="p-1.5 hover:bg-stone-200 rounded text-stone-700 transition cursor-pointer"
                        title="Bullet List (- item)"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => applyLinePrefix('1. ', 'Ordered item')}
                        className="p-1.5 hover:bg-stone-200 rounded text-stone-700 transition cursor-pointer"
                        title="Numbered List (1. item)"
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => applyLinePrefix('> ', 'Quote line')}
                        className="p-1.5 hover:bg-stone-200 rounded text-stone-700 transition cursor-pointer"
                        title="Quote (> Quote)"
                      >
                        <Quote className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => applyLinePrefix('---', '')}
                        className="p-1.5 hover:bg-stone-200 rounded text-stone-700 transition cursor-pointer"
                        title="Horizontal Divider (---)"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      ref={textareaRef}
                      required
                      rows={12}
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder="Write your article content here..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38] font-mono leading-relaxed resize-y"
                    />
                  </div>
                ) : (
                  <div className="border border-stone-200 rounded-xl p-5 min-h-[300px] max-h-[500px] overflow-y-auto bg-white">
                    <BlogRenderer content={formContent || '*No content to preview yet.*'} />
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#2E4D38] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#243f2e] transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Updating...' : 'Save & Update Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
