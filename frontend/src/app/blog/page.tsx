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
  Info
} from 'lucide-react';

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
  const [formImageUrl, setFormImageUrl] = useState('/images/blog-moringa.jpg');
  const [formContent, setFormContent] = useState('');

  // Fetch published blogs from backend
  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5287/api/blogs', { cache: 'no-store' });
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
      const res = await fetch('http://localhost:5287/api/blogs/my-blogs', {
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
      (blog.category?.toLowerCase() === selectedCategory.toLowerCase());
    const matchesSearch = !search || 
      blog.title.toLowerCase().includes(search.toLowerCase()) || 
      blog.content.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filter user blogs by search & category
  const filteredMyBlogs = myBlogs.filter((blog) => {
    const matchesCategory = selectedCategory === 'All' || 
      (blog.category?.toLowerCase() === selectedCategory.toLowerCase());
    const matchesSearch = !search || 
      blog.title.toLowerCase().includes(search.toLowerCase()) || 
      blog.content.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Open Create Modal (Protected)
  const handleOpenCreate = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setEditingBlog(null);
    setFormTitle('');
    setFormCategory('Wellness');
    setFormImageUrl('/images/blog-moringa.jpg');
    setFormContent('');
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (blog: BlogPost) => {
    setEditingBlog(blog);
    setFormTitle(blog.title);
    setFormCategory(blog.category || 'Wellness');
    setFormImageUrl(blog.imageUrl || '/images/blog-moringa.jpg');
    setFormContent(blog.content);
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

    try {
      if (editingBlog) {
        // Update Blog
        const res = await fetch('http://localhost:5287/api/blogs/' + editingBlog.id, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + authToken,
          },
          body: JSON.stringify({
            title: formTitle.trim(),
            content: formContent.trim(),
            category: formCategory,
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
        const res = await fetch('http://localhost:5287/api/blogs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + authToken,
          },
          body: JSON.stringify({
            title: formTitle.trim(),
            content: formContent.trim(),
            category: formCategory,
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
      const res = await fetch('http://localhost:5287/api/blogs/' + blog.id, {
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
                        src={blog.imageUrl || '/images/blog-moringa.jpg'}
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
                        {blog.content}
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
                        src={blog.imageUrl || '/images/blog-moringa.jpg'}
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
                          {blog.content}
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

            <h3 className="font-serif text-xl font-bold text-[#1c3f24] mb-2">
              Registration Required to Author Blogs
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 mb-6 leading-relaxed">
              Normal visitors can read and explore our botanical blog. To create, edit, or submit blogs, you must be a registered buyer or seller.
            </p>

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

            <p className="text-[11px] text-center text-stone-400 mt-4">
              All submitted blogs are moderated by our editorial team before publication.
            </p>
          </div>
        </div>
      )}

      {/* 5. MODAL: WRITE / EDIT BLOG POST */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-xl max-h-[90vh] overflow-y-auto">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                  >
                    <option value="Wellness">Wellness</option>
                    <option value="Herbal Tea">Herbal Tea</option>
                    <option value="Skincare">Skincare</option>
                    <option value="Nutrition">Nutrition</option>
                    <option value="Mindfulness">Mindfulness</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Image Thumbnail</label>
                  <select
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                  >
                    <option value="/images/blog-moringa.jpg">Moringa Herbal Tea</option>
                    <option value="/images/blog-herbal-tea.jpg">Chamomile Herbal Brew</option>
                    <option value="/images/blog-skincare.jpg">Botanical Skincare Cream</option>
                    <option value="/images/herbal-detox-tea.jpg">Detox Tea Loose Leaf</option>
                    <option value="/images/aloe-vera-gel.jpg">Aloe Vera Gel</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Blog Content *</label>
                <textarea
                  required
                  rows={7}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Share your botanical experiences, herbal knowledge, wellness recipes, or health tips..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38] leading-relaxed"
                />
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

      {/* 6. MODAL: READ FULL BLOG */}
      {readingBlog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <span className="text-xs font-bold text-[#2E4D38] uppercase tracking-wider">
                {readingBlog.category || 'Wellness'}
              </span>
              <button
                onClick={() => setReadingBlog(null)}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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

            <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden mb-6 shadow-xs border border-stone-200/70 bg-stone-100">
              <Image
                src={readingBlog.imageUrl || '/images/blog-moringa.jpg'}
                alt={readingBlog.title}
                fill
                className="object-cover"
              />
            </div>

            <div className="text-stone-700 text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-line font-serif sm:font-sans">
              {readingBlog.content}
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