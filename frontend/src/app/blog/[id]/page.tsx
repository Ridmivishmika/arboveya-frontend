'use client';

import React, { useState, useEffect } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { getBlogById, getPublishedBlogs, resolveBackendImageUrl, deleteBlog } from '@/lib/api';
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

  // Fetch blog data
  useEffect(() => {
    if (!blogId) return;

    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const data = await getBlogById(blogId, token || undefined);
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
  const readingTime = React.useMemo(() => {
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

  // Delete handler
  const handleDelete = async () => {
    if (!blog || !token) return;
    const confirmed = window.confirm(`Are you sure you want to delete "${blog.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteBlog(blog.id, token);
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
                <Link
                  href={`/blog?edit=${blog.id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#2E4D38] text-white text-xs font-semibold hover:bg-[#243f2e] transition shadow-2xs"
                  title="Edit this blog"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Edit</span>
                </Link>
                <button
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
    </div>
  );
}

