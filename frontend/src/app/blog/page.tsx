'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BlogPost } from '@/types';
import { 
  BookOpen, 
  PenTool, 
  Plus, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  Search, 
  X, 
  ArrowRight,
  ShieldCheck,
  Tag,
  Share2,
  Lock,
  UserPlus,
  LogIn,
  FileText,
  Sparkles,
  Info,
  Upload,
  ImageIcon,
  Loader2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Type,
  List,
  ListOrdered,
  Quote,
  Minus,
  Eye,
  Check
} from 'lucide-react';
import { uploadBlogImage, API_BASE_URL, resolveBackendImageUrl } from '@/lib/api';
import BlogRenderer, { stripBlogFormatting } from '@/components/blog/BlogRenderer';

const CATEGORIES = ['All', 'Wellness', 'Herbal Tea', 'Skincare', 'Nutrition', 'Mindfulness'];

function BlogContent() {
  const searchParams = useSearchParams();
  const { user, token } = useAuth();

  // Tab State: 'published' or 'my-articles'
  const [activeTab, setActiveTab] = useState<'published' | 'my-articles'>('published');

  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [myBlogs, setMyBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [myBlogsLoading, setMyBlogsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [readingBlog, setReadingBlog] = useState<BlogPost | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Wellness');
  const [formCategories, setFormCategories] = useState<string[]>(['Wellness']);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('/images/blog-moringa.jpg');
  const [formContent, setFormContent] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [editorTab, setEditorTab] = useState<'write' | 'preview'>('write');
  const [selectedFontSize, setSelectedFontSize] = useState<string>('normal');

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

    const lastNewline = text.lastIndexOf('\n', start - 1);
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
    const nextNewline = text.indexOf('\n', end);
    const lineEnd = nextNewline === -1 ? text.length : nextNewline;

    const currentLine = text.substring(lineStart, lineEnd);

    if (!currentLine.trim()) {
      const replacement = `${prefix}${defaultText}`;
      const updated = text.substring(0, lineStart) + replacement + text.substring(lineEnd);
      setFormContent(updated);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length + defaultText.length);
      }, 0);
      return;
    }

    let newLine = currentLine;
    if (prefix.startsWith('#')) {
      newLine = currentLine.replace(/^#{1,6}\s+/, '');
    }
    const replacement = `${prefix}${newLine}`;
    const updated = text.substring(0, lineStart) + replacement + text.substring(lineEnd);
    setFormContent(updated);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(lineStart, lineStart + replacement.length);
    }, 0);
  };

  const applyFontSize = (size: string) => {
    setSelectedFontSize(size);
    if (size === 'h1') {
      applyLinePrefix('# ', 'Large Title');
    } else if (size === 'h2') {
      applyLinePrefix('## ', 'Section Heading');
    } else if (size === 'h3') {
      applyLinePrefix('### ', 'Subheading');
    } else if (size === 'small') {
      applyFormatting('<span class="text-xs text-stone-500">', '</span>', 'small note text');
    } else if (size === 'normal') {
      const el = textareaRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const text = formContent;
      const lastNewline = text.lastIndexOf('\n', start - 1);
      const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
      const nextNewline = text.indexOf('\n', end);
      const lineEnd = nextNewline === -1 ? text.length : nextNewline;
      const currentLine = text.substring(lineStart, lineEnd);
      const cleaned = currentLine.replace(/^#{1,6}\s+/, '');
      const updated = text.substring(0, lineStart) + cleaned + text.substring(lineEnd);
      setFormContent(updated);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        applyFormatting('**', '**', 'bold text');
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        applyFormatting('*', '*', 'italic text');
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        applyFormatting('<u>', '</u>', 'underlined text');
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size exceeds 10MB limit.');
      return;
    }

    try {
      setUploadingImage(true);
      setUploadError(null);
      const authToken = token || localStorage.getItem('arboveya_token') || '';
      const url = await uploadBlogImage(file, authToken);
      setFormImageUrl(url);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Fetch published blogs from backend
  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/blogs`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setBlogs(data);
      }
    } catch (err) {
      console.warn('Failed to fetch blogs from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's own blogs
  const fetchMyBlogs = async () => {
    const authToken = token || localStorage.getItem('arboveya_token') || '';
    if (!authToken) return;
    setMyBlogsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/blogs/my-blogs`, {
        headers: { Authorization: 'Bearer ' + authToken },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setMyBlogs(data);
      }
    } catch (err) {
      console.warn('Failed to fetch user blogs:', err);
    } finally {
      setMyBlogsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  useEffect(() => {
    if (user) {
      fetchMyBlogs();
    } else {
      setMyBlogs([]);
      if (activeTab === 'my-articles') {
        setActiveTab('published');
      }
    }
  }, [user]);

  // Check if returning with intent to write an article
  useEffect(() => {
    if (searchParams.get('action') === 'write') {
      if (user) {
        setEditingBlog(null);
        setFormTitle('');
        setFormCategory('Wellness');
        setFormCategories(['Wellness']);
        setCustomCategoryInput('');
        setFormImageUrl('/images/blog-moringa.jpg');
        setFormContent('');
        setShowCreateModal(true);
      } else {
        setShowAuthModal(true);
      }
    }
  }, [searchParams, user]);

  // Filter published blogs by search & category
  const filteredBlogs = blogs.filter((blog) => {
    const matchesCategory = selectedCategory === 'All' || 
      (blog.category?.toLowerCase().includes(selectedCategory.toLowerCase())) ||
      (blog.categories?.some(c => c.toLowerCase() === selectedCategory.toLowerCase()));
    const matchesSearch = !search || 
      blog.title.toLowerCase().includes(search.toLowerCase()) || 
      blog.content.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filter user blogs by search & category
  const filteredMyBlogs = myBlogs.filter((blog) => {
    const matchesCategory = selectedCategory === 'All' || 
      (blog.category?.toLowerCase().includes(selectedCategory.toLowerCase())) ||
      (blog.categories?.some(c => c.toLowerCase() === selectedCategory.toLowerCase()));
    const matchesSearch = !search || 
      blog.title.toLowerCase().includes(search.toLowerCase()) || 
      blog.content.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFormCategory = (cat: string) => {
    setFormCategories((prev) => {
      if (prev.includes(cat)) {
        if (prev.length <= 1) return prev;
        const updated = prev.filter(c => c !== cat);
        setFormCategory(updated[0] || 'Wellness');
        return updated;
      } else {
        const updated = [...prev, cat];
        setFormCategory(updated[0] || cat);
        return updated;
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

  // Open Create Modal (Protected)
  const handleOpenCreate = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setEditingBlog(null);
    setFormTitle('');
    setFormCategory('Wellness');
    setFormCategories(['Wellness']);
    setCustomCategoryInput('');
    setFormImageUrl('/images/blog-moringa.jpg');
    setFormContent('');
    setEditorTab('write');
    setSelectedFontSize('normal');
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (blog: BlogPost) => {
    setEditingBlog(blog);
    setFormTitle(blog.title);
    let cats: string[] = [];
    if (blog.categories && blog.categories.length > 0) {
      cats = [...blog.categories];
    } else if (blog.category) {
      cats = blog.category.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (cats.length === 0) cats = ['Wellness'];
    setFormCategories(cats);
    setFormCategory(cats[0] || 'Wellness');
    setCustomCategoryInput('');
    setFormImageUrl(blog.imageUrl || '/images/blog-moringa.jpg');
    setFormContent(blog.content);
    setEditorTab('write');
    setSelectedFontSize('normal');
    setShowCreateModal(true);
  };

  // Handle Submit (Create or Update)
  const handleSubmitBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setSubmitting(true);
    setStatusMessage(null);

    const authToken = token || localStorage.getItem('arboveya_token') || '';
    const finalCategoryString = formCategories.join(', ');

    try {
      if (editingBlog) {
        // Update Blog
        const res = await fetch(`${API_BASE_URL}/blogs/${editingBlog.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + authToken,
          },
          body: JSON.stringify({
            title: formTitle.trim(),
            content: formContent.trim(),
            category: finalCategoryString,
            categories: formCategories,
            imageUrl: formImageUrl.trim(),
          }),
        });

        if (res.ok) {
          const updated = await res.json();
          setShowCreateModal(false);
          setEditingBlog(null);
          
          if (user.role === 'Admin') {
            setStatusMessage({ text: 'Blog post updated successfully!', type: 'success' });
          } else if (user.role === 'Seller') {
            setStatusMessage({
              text: 'Blog post updated! Note: As a seller, your post requires Admin approval and an approved seller profile before displaying publicly.',
              type: 'info',
            });
          } else {
            setStatusMessage({
              text: 'Blog post updated! Since changes were made, it has been submitted for Admin review before re-publishing.',
              type: 'info',
            });
          }
          
          fetchBlogs();
          fetchMyBlogs();
        } else {
          const err = await res.json().catch(() => ({}));
          alert(err.message || 'Failed to update blog post.');
        }
      } else {
        // Create Blog
        const res = await fetch(`${API_BASE_URL}/blogs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + authToken,
          },
          body: JSON.stringify({
            title: formTitle.trim(),
            content: formContent.trim(),
            category: finalCategoryString,
            categories: formCategories,
            imageUrl: formImageUrl.trim(),
          }),
        });

        if (res.ok) {
          const created = await res.json();
          setShowCreateModal(false);
          
          if (user.role === 'Admin') {
            setStatusMessage({ text: 'Blog post published successfully!', type: 'success' });
          } else if (user.role === 'Seller') {
            setStatusMessage({
              text: 'Thank you! Your blog post has been submitted. For sellers, both your seller profile and blog post must be approved by the admin before it goes live on the blog.',
              type: 'success',
            });
          } else {
            setStatusMessage({
              text: 'Thank you! Your blog post has been submitted for Admin approval. It will appear on the blog once approved.',
              type: 'success',
            });
          }
          
          fetchBlogs();
          fetchMyBlogs();
        } else {
          const err = await res.json().catch(() => ({}));
          alert(err.message || 'Failed to create blog post.');
        }
      }
    } catch (err) {
      alert('Network error communicating with backend.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleDeleteBlog = async (blog: BlogPost) => {
    if (!confirm(`Are you sure you want to delete "${blog.title}"?`)) return;

    const authToken = token || localStorage.getItem('arboveya_token') || '';
    try {
      const res = await fetch(`${API_BASE_URL}/blogs/${blog.id}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + authToken },
      });

      if (res.ok) {
        setBlogs((prev) => prev.filter((b) => b.id !== blog.id));
        setMyBlogs((prev) => prev.filter((b) => b.id !== blog.id));
        setStatusMessage({ text: `Blog post "${blog.title}" deleted successfully.`, type: 'success' });
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to delete blog post.');
      }
    } catch (err) {
      alert('Network error deleting blog.');
    }
  };

  // Helper to render blog post approval status badge
  const renderStatusBadge = (blog: BlogPost) => {
    const isSeller = blog.authorRole === 'Seller';
    const sellerApproved = blog.authorIsSellerApproved;
    const blogApproved = blog.isApproved;

    if (blogApproved && (!isSeller || sellerApproved)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Published</span>
        </span>
      );
    }

    if (blogApproved && isSeller && !sellerApproved) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200" title="Blog approved, but waiting for seller profile approval to publish">
          <Clock className="w-3.5 h-3.5" />
          <span>Awaiting Profile Approval</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
        <Clock className="w-3.5 h-3.5" />
        <span>Pending Admin Review</span>
      </span>
    );
  };

  return (
    <div className="bg-white min-h-screen">
      {/* BLOG MAIN CONTENT */}
      <section className="pt-8 pb-6 px-4 sm:px-6 lg:px-8 text-center max-w-7xl mx-auto">
        {/* Hero Featured Banner Image */}
        <div className="relative w-full aspect-[21/9] sm:aspect-[24/9] md:aspect-[3/1] rounded-2xl overflow-hidden shadow-sm border border-stone-200/80 bg-stone-100 mb-8">
          <Image
            src="/images/blog-hero-banner.jpg"
            alt="Herbal tea and botanical wellness journal"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-6 left-6 sm:left-10 text-left text-white max-w-md">
            <span className="text-xs uppercase tracking-widest font-semibold text-emerald-300">Herbal Wisdom & Remedies</span>
            <h2 className="font-serif text-xl sm:text-2xl font-bold mt-1">Holistic Wellness Chronicles</h2>
            <p className="text-xs text-stone-200 mt-1 line-clamp-2">Authentic insights shared by our certified herbalists and registered botanical community.</p>
          </div>
        </div>

        {/* Navigation Tabs (All vs My Articles) */}
        {user && (
          <div className="flex items-center justify-center gap-3 mb-6">
            <button
              onClick={() => setActiveTab('published')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'published'
                  ? 'bg-[#2E4D38] text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Published Blogs ({blogs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('my-articles')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'my-articles'
                  ? 'bg-[#2E4D38] text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>My Submitted Blogs ({myBlogs.length})</span>
            </button>
          </div>
        )}

        {/* Action & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-stone-200">
          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wider transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#2E4D38] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search and Add Button */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search blogs..."
                className="w-full pl-9 pr-3 py-2 rounded-full border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/20 focus:border-[#2E4D38]"
              />
            </div>

            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#2E4D38] text-white text-xs font-semibold rounded-full hover:bg-[#243f2e] transition shadow-xs cursor-pointer flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Write Blog</span>
            </button>
          </div>
        </div>
      </section>

      {/* Status Notice Toast */}
      {statusMessage && (
        <div className="max-w-6xl mx-auto px-4 mb-8">
          <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : statusMessage.type === 'info'
              ? 'bg-blue-50 border border-blue-200 text-blue-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="p-1 hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. TAB: MY SUBMITTED BLOGS */}
      {activeTab === 'my-articles' && user && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="mb-6 p-4 rounded-2xl bg-[#edf5ee] border border-[#bcd2bf] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Info className="w-5 h-5 text-[#2E4D38] flex-shrink-0 mt-0.5" />
              <div className="text-xs text-[#1c3f24]">
                <strong className="block font-bold">Editorial Approval Workflow</strong>
                <span>
                  {user.role === 'Seller' 
                    ? 'As an herbal seller, both your seller profile and submitted blogs require administrator review before publishing publicly.' 
                    : 'All submitted blogs are reviewed by our editorial team. Once approved, they will immediately appear on the public blog.'}
                </span>
              </div>
            </div>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-1.5 rounded-full bg-[#2E4D38] text-white text-xs font-semibold hover:bg-[#243f2e] transition whitespace-nowrap"
            >
              + Submit Another Blog
            </button>
          </div>

          {myBlogsLoading ? (
            <div className="py-20 text-center text-stone-400 text-sm">
              Loading your submitted blogs...
            </div>
          ) : filteredMyBlogs.length === 0 ? (
            <div className="py-16 text-center text-stone-500 bg-stone-50 rounded-2xl border border-stone-200">
              <FileText className="w-10 h-10 mx-auto text-stone-300 mb-2" />
              <p className="font-serif text-lg text-stone-700 mb-1">No blogs submitted yet</p>
              <p className="text-xs text-stone-400 mb-4">Share your botanical expertise with the Arboveya community!</p>
              <button
                onClick={handleOpenCreate}
                className="px-5 py-2 bg-[#2E4D38] text-white text-xs font-semibold rounded-full hover:bg-[#243f2e] transition"
              >
                Write Your First Blog
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMyBlogs.map((blog) => (
                <div
                  key={blog.id}
                  className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:shadow-md transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
                      <Image
                        src={resolveBackendImageUrl(blog.imageUrl, '/images/blog-moringa.jpg')}
                        alt={blog.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {renderStatusBadge(blog)}
                        <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                          {blog.category || 'Wellness'}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          {new Date(blog.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <h3 
                        onClick={() => setReadingBlog(blog)}
                        className="font-serif text-base font-bold text-stone-900 hover:text-[#2E4D38] cursor-pointer"
                      >
                        {blog.title}
                      </h3>
                      <p className="text-xs text-stone-500 line-clamp-1 mt-1 max-w-xl">
                        {stripBlogFormatting(blog.content)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => setReadingBlog(blog)}
                      className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold transition"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => handleOpenEdit(blog)}
                      className="px-3 py-1.5 rounded-xl bg-[#2E4D38] text-white hover:bg-[#243f2e] text-xs font-semibold transition flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteBlog(blog)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 3. TAB: ALL PUBLISHED BLOGS GRID */}
      {activeTab === 'published' && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {loading ? (
            <div className="py-20 text-center text-stone-400 text-sm">
              Loading botanical wellness blogs...
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="py-20 text-center text-stone-500">
              <BookOpen className="w-10 h-10 mx-auto text-stone-300 mb-3" />
              <p className="font-serif text-lg text-stone-700 mb-1">No published blogs found</p>
              <p className="text-xs text-stone-400 mb-4">Be the first to share an herbal wellness insight!</p>
              <button
                onClick={handleOpenCreate}
                className="px-5 py-2 bg-[#2E4D38] text-white text-xs font-semibold rounded-full hover:bg-[#243f2e] transition cursor-pointer"
              >
                Write First Blog
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
              {filteredBlogs.map((blog) => {
                const isAuthorOrAdmin = user && (user.id === blog.authorId || user.role === 'Admin');
                const formattedDate = new Date(blog.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <article
                    key={blog.id}
                    className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col group"
                  >
                    {/* Card Thumbnail */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
                      <Image
                        src={resolveBackendImageUrl(blog.imageUrl, '/images/blog-moringa.jpg')}
                        alt={blog.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-104 transition-transform duration-500"
                      />
                      {blog.category && (
                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-[#2E4D38] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
                          {blog.category}
                        </span>
                      )}

                      {/* Quick Edit/Delete toolbar if author or admin */}
                      {isAuthorOrAdmin && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-xs p-1 rounded-lg shadow-xs">
                          <button
                            onClick={() => handleOpenEdit(blog)}
                            title="Edit Blog"
                            className="p-1 hover:bg-stone-100 rounded text-stone-600 hover:text-[#2E4D38] transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBlog(blog)}
                            title="Delete Blog"
                            className="p-1 hover:bg-rose-50 rounded text-stone-400 hover:text-rose-600 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Title */}
                        <h2 
                          onClick={() => setReadingBlog(blog)}
                          className="font-serif text-lg sm:text-xl font-bold text-stone-900 leading-snug mb-2 group-hover:text-[#2E4D38] transition-colors cursor-pointer"
                        >
                          {blog.title}
                        </h2>

                        {/* Meta */}
                        <div className="flex items-center gap-2 text-xs text-stone-400 mb-3 font-medium">
                          <span>{formattedDate}</span>
                          <span>•</span>
                          <span className="text-[#2E4D38]">{blog.category || 'Wellness'}</span>
                          {blog.authorName && (
                            <>
                              <span>•</span>
                              <span className="text-stone-500 truncate max-w-[120px]">{blog.authorName}</span>
                            </>
                          )}
                        </div>

                        {/* Excerpt */}
                        <p className="text-stone-600 text-xs sm:text-sm leading-relaxed line-clamp-3 mb-6">
                          {stripBlogFormatting(blog.content)}
                        </p>
                      </div>

                      {/* Read More link button */}
                      <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                        <button
                          onClick={() => setReadingBlog(blog)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2E4D38] hover:text-[#1c3524] transition uppercase tracking-wider cursor-pointer"
                        >
                          <span>Read Full Blog</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 4. MODAL: AUTHENTICATION REQUIRED TO WRITE BLOG */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-stone-200">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-[#edf5ee] text-[#2E4D38] flex items-center justify-center">
                <PenTool className="w-6 h-6" />
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="font-serif text-xl font-bold text-[#1c3f24] mb-5">
              Registration Required to Author Blogs
            </h3>

            <div className="space-y-3">
              <Link
                href="/register?redirect=/blog?action=write"
                className="w-full py-3 px-4 rounded-xl bg-[#2E4D38] hover:bg-[#243f2e] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-sm text-center"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register as Buyer or Seller</span>
              </Link>

              <Link
                href="/login?redirect=/blog?action=write"
                className="w-full py-3 px-4 rounded-xl border border-[#2E4D38] text-[#2E4D38] hover:bg-[#edf5ee] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition text-center"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Existing Account</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: WRITE / EDIT BLOG POST */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
              <div className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-[#2E4D38]" />
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  {editingBlog ? 'Edit Blog Post' : 'Submit New Blog'}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Seller profile dual-approval guidance */}
            {user?.role === 'Seller' && (
              <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Seller Publishing Policy:</strong> You can submit blogs anytime! For your post to appear publicly, an administrator must approve both your seller profile and this blog post.
                </div>
              </div>
            )}

            {user?.role === 'Customer' && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Buyer Author:</strong> Your blog will be submitted to the admin moderation queue and will go live once reviewed and approved.
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitBlog} className="space-y-4">
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

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-stone-700">
                  Featured Image / Cover *
                </label>

                  {/* Live Top Preview of Selected / Uploaded Image */}
                  {formImageUrl && (
                    <div className="relative aspect-[16/7] w-full rounded-xl overflow-hidden bg-stone-100 border border-stone-200 group shadow-2xs">
                      <Image
                        src={resolveBackendImageUrl(formImageUrl, '/images/blog-moringa.jpg')}
                        alt="Blog cover preview"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-white/95 text-stone-800 text-xs font-semibold hover:bg-white shadow-xs transition"
                        >
                          Change Image
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Upload and URL controls */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 text-xs font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2E4D38]" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 text-[#2E4D38]" />
                          <span>Upload From Device</span>
                        </>
                      )}
                    </button>

                    <input
                      type="text"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="Or paste image URL (https://...)"
                      className="flex-1 px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                    />
                  </div>

                  {uploadError && (
                    <p className="text-[11px] text-rose-600 font-medium">{uploadError}</p>
                  )}

                  {/* Botanical Presets */}
                  <div className="pt-1">
                    <span className="text-[11px] text-stone-400 block mb-1.5">Or select botanical preset:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'Moringa', url: '/images/blog-moringa.jpg' },
                        { label: 'Chamomile Brew', url: '/images/blog-herbal-tea.jpg' },
                        { label: 'Skincare Cream', url: '/images/blog-skincare.jpg' },
                        { label: 'Detox Tea', url: '/images/herbal-detox-tea.jpg' },
                        { label: 'Aloe Vera', url: '/images/aloe-vera-gel.jpg' },
                      ].map((preset) => (
                        <button
                          key={preset.url}
                          type="button"
                          onClick={() => setFormImageUrl(preset.url)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] border transition cursor-pointer ${
                            formImageUrl === preset.url
                              ? 'bg-[#2E4D38] text-white border-[#2E4D38]'
                              : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              {/* Blog Content with Formatting Toolbar */}
              <div>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <label className="block text-xs font-semibold text-stone-700">
                    Blog Content *
                  </label>

                  {/* Mode switcher tabs: Write / Preview */}
                  <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                    <button
                      type="button"
                      onClick={() => setEditorTab('write')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                        editorTab === 'write'
                          ? 'bg-white text-[#2E4D38] shadow-xs'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>Write</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorTab('preview')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                        editorTab === 'preview'
                          ? 'bg-white text-[#2E4D38] shadow-xs'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>

                {/* Formatting Toolbar (shown when in Write mode) */}
                <div className="border border-stone-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#2E4D38]/30 focus-within:border-[#2E4D38] transition bg-white shadow-2xs">
                  <div className="flex items-center flex-wrap gap-1 px-2.5 py-1.5 bg-stone-50/90 border-b border-stone-200 text-stone-700 text-xs">
                    {/* Font Size Change Dropdown */}
                    <div className="flex items-center gap-1 mr-1">
                      <Type className="w-3.5 h-3.5 text-stone-400" />
                      <select
                        value={selectedFontSize}
                        onChange={(e) => applyFontSize(e.target.value)}
                        className="text-xs bg-white border border-stone-200 rounded-md px-2 py-1 text-stone-700 font-medium focus:outline-none focus:border-[#2E4D38] cursor-pointer"
                        title="Change Font Size / Heading"
                      >
                        <option value="normal">Normal Body (15px)</option>
                        <option value="h1">Heading 1 - Large Title (28px)</option>
                        <option value="h2">Heading 2 - Section (22px)</option>
                        <option value="h3">Heading 3 - Subheading (18px)</option>
                        <option value="small">Small Note (12px)</option>
                      </select>
                    </div>

                    <div className="h-4 w-px bg-stone-300 mx-0.5" />

                    {/* Bold */}
                    <button
                      type="button"
                      onClick={() => applyFormatting('**', '**', 'bold text')}
                      className="p-1.5 rounded hover:bg-stone-200/80 text-stone-700 transition cursor-pointer"
                      title="Bold (Ctrl+B)"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>

                    {/* Italic */}
                    <button
                      type="button"
                      onClick={() => applyFormatting('*', '*', 'italic text')}
                      className="p-1.5 rounded hover:bg-stone-200/80 text-stone-700 transition cursor-pointer"
                      title="Italic (Ctrl+I)"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>

                    {/* Underline */}
                    <button
                      type="button"
                      onClick={() => applyFormatting('<u>', '</u>', 'underlined text')}
                      className="p-1.5 rounded hover:bg-stone-200/80 text-stone-700 transition cursor-pointer"
                      title="Underline (Ctrl+U)"
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>

                    {/* Strikethrough */}
                    <button
                      type="button"
                      onClick={() => applyFormatting('~~', '~~', 'strikethrough text')}
                      className="p-1.5 rounded hover:bg-stone-200/80 text-stone-700 transition cursor-pointer"
                      title="Strikethrough"
                    >
                      <Strikethrough className="w-3.5 h-3.5" />
                    </button>

                    <div className="h-4 w-px bg-stone-300 mx-0.5" />

                    {/* Bullet List */}
                    <button
                      type="button"
                      onClick={() => applyLinePrefix('- ', 'List item')}
                      className="p-1.5 rounded hover:bg-stone-200/80 text-stone-700 transition cursor-pointer"
                      title="Bulleted List"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>

                    {/* Numbered List */}
                    <button
                      type="button"
                      onClick={() => applyLinePrefix('1. ', 'First step')}
                      className="p-1.5 rounded hover:bg-stone-200/80 text-stone-700 transition cursor-pointer"
                      title="Numbered List"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>

                    {/* Quote */}
                    <button
                      type="button"
                      onClick={() => applyLinePrefix('> ', 'Herbal wisdom or quote')}
                      className="p-1.5 rounded hover:bg-stone-200/80 text-stone-700 transition cursor-pointer"
                      title="Quote"
                    >
                      <Quote className="w-3.5 h-3.5" />
                    </button>

                    {/* Divider Line */}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = formContent ? `${formContent}\n\n---\n\n` : '---\n\n';
                        setFormContent(updated);
                      }}
                      className="p-1.5 rounded hover:bg-stone-200/80 text-stone-700 transition cursor-pointer"
                      title="Horizontal Divider"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Editor body: Write or Preview */}
                  {editorTab === 'write' ? (
                    <textarea
                      ref={textareaRef}
                      required
                      rows={9}
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Share your botanical experiences, herbal knowledge, wellness recipes, or health tips...&#10;&#10;Use the toolbar above or shortcuts:&#10;• Ctrl+B for Bold&#10;• Ctrl+I for Italic&#10;• Ctrl+U for Underline&#10;• Change Font Size from the dropdown"
                      className="w-full px-3.5 py-3 text-sm focus:outline-none leading-relaxed font-sans placeholder:text-stone-400 border-0 bg-transparent resize-y"
                    />
                  ) : (
                    <div className="p-4 sm:p-5 min-h-[220px] max-h-[380px] overflow-y-auto bg-stone-50/40">
                      {formContent.trim() ? (
                        <BlogRenderer content={formContent} />
                      ) : (
                        <p className="text-stone-400 italic text-sm text-center py-10">
                          Your live formatted preview will appear here as you write...
                        </p>
                      )}
                    </div>
                  )}

                  {/* Character, word count and shortcut tips */}
                  <div className="px-3.5 py-2 bg-stone-50/60 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400 flex-wrap gap-2">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-[#2E4D38]" />
                      <span>Highlight text and click Bold, Italic, or pick Font Size</span>
                    </span>
                    <span className="font-medium text-stone-500">
                      {formContent.trim() ? formContent.trim().split(/\s+/).length : 0} words • {formContent.length} chars
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#2E4D38] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#243f2e] transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Submitting...' : editingBlog ? 'Update & Re-Submit' : 'Submit for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: READ FULL BLOG (IMAGE DISPLAYED FROM THE TOP) */}
      {readingBlog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[92vh] overflow-y-auto overflow-hidden">
            {/* Top Featured Hero Image */}
            <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full bg-stone-100 overflow-hidden">
              <Image
                src={resolveBackendImageUrl(readingBlog.imageUrl, '/images/blog-moringa.jpg')}
                alt={readingBlog.title}
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
              <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 max-w-md">
                {readingBlog.categories && readingBlog.categories.length > 0 ? (
                  readingBlog.categories.map((c, i) => (
                    <span key={i} className="text-xs font-bold text-white bg-[#2E4D38]/90 backdrop-blur-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="text-xs font-bold text-white bg-[#2E4D38]/90 backdrop-blur-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    {readingBlog.category || 'Wellness'}
                  </span>
                )}
              </div>
              <button
                onClick={() => setReadingBlog(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-xs transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-snug mb-3">
                {readingBlog.title}
              </h2>

              <div className="flex items-center justify-between pb-5 mb-6 border-b border-stone-100 flex-wrap gap-3">
                <div className="flex items-center gap-3 text-xs text-stone-500">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#2E4D38] flex items-center justify-center font-bold text-xs">
                    {readingBlog.authorName ? readingBlog.authorName.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div>
                    <p className="font-semibold text-stone-800">{readingBlog.authorName || 'Arboveya Author'}</p>
                    <p className="text-[11px] text-stone-400">
                      {new Date(readingBlog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                {renderStatusBadge(readingBlog)}
              </div>

              <div className="text-stone-700 text-sm sm:text-base leading-relaxed">
                <BlogRenderer content={readingBlog.content} />
              </div>

              <div className="mt-8 pt-4 border-t border-stone-100 flex items-center justify-between">
                <button
                  onClick={() => setReadingBlog(null)}
                  className="px-5 py-2 rounded-xl bg-stone-100 text-xs font-semibold text-stone-700 hover:bg-stone-200 transition"
                >
                  Close Blog
                </button>

              {user && (user.id === readingBlog.authorId || user.role === 'Admin') && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const b = readingBlog;
                      setReadingBlog(null);
                      handleOpenEdit(b);
                    }}
                    className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
                  >
                    Edit Post
                  </button>
                  <button
                    onClick={() => {
                      const b = readingBlog;
                      setReadingBlog(null);
                      handleDeleteBlog(b);
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition"
                  >
                    Delete Post
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Blog...</div>}>
      <BlogContent />
    </Suspense>
  );
}