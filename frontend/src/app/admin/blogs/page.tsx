'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { BlogPost } from '@/types';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Trash2, 
  RefreshCw, 
  User, 
  Search, 
  ArrowLeft,
  ShieldCheck,
  Eye,
  AlertCircle,
  Check,
  X,
  Store,
  UserCheck
} from 'lucide-react';

export default function AdminBlogsPage() {
  const { user, token } = useAuth();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchBlogs = async () => {
    setLoading(true);
    const authToken = token || localStorage.getItem('arboveya_token') || '';
    try {
      let url = 'http://localhost:5287/api/blogs/moderation';
      if (filter === 'pending') url += '?isApproved=false';
      if (filter === 'approved') url += '?isApproved=true';

      const res = await fetch(url, {
        headers: { Authorization: 'Bearer ' + authToken },
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        setBlogs(data);
      } else {
        const pubRes = await fetch('http://localhost:5287/api/blogs');
        if (pubRes.ok) {
          const pubData = await pubRes.json();
          setBlogs(pubData);
        }
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [filter]);

  // Handle Moderation (Approve or Reject Blog)
  const handleModerate = async (id: string, isApproved: boolean) => {
    setActionLoading(id);
    setMsg(null);
    const authToken = token || localStorage.getItem('arboveya_token') || '';

    try {
      const res = await fetch('http://localhost:5287/api/blogs/' + id + '/moderation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + authToken,
        },
        body: JSON.stringify({ isApproved }),
      });

      if (res.ok) {
        setBlogs((prev) =>
          prev.map((b) => (b.id === id ? { ...b, isApproved } : b))
        );
        if (selectedBlog?.id === id) {
          setSelectedBlog((prev) => prev ? { ...prev, isApproved } : null);
        }
        setMsg({
          text: isApproved ? 'Blog post approved!' : 'Blog post un-published.',
          type: 'success',
        });
        if (filter !== 'all') {
          setBlogs((prev) => prev.filter((b) => b.id !== id));
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to moderate blog post.');
      }
    } catch (err) {
      alert('Network error communicating with backend.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Approve Seller Profile directly from Blog Moderation
  const handleApproveSeller = async (authorId: string, authorName?: string) => {
    setActionLoading(authorId);
    setMsg(null);
    const authToken = token || localStorage.getItem('arboveya_token') || '';

    try {
      const res = await fetch(`http://localhost:5287/api/admin/sellers/${authorId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + authToken,
        },
        body: JSON.stringify({ isApproved: true }),
      });

      if (res.ok) {
        setBlogs((prev) =>
          prev.map((b) => (b.authorId === authorId ? { ...b, authorIsSellerApproved: true } : b))
        );
        if (selectedBlog?.authorId === authorId) {
          setSelectedBlog((prev) => prev ? { ...prev, authorIsSellerApproved: true } : null);
        }
        setMsg({
          text: `Seller profile for ${authorName || 'author'} approved successfully!`,
          type: 'success',
        });
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to approve seller profile.');
      }
    } catch (err) {
      alert('Network error communicating with backend.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string, title: string) => {
    if (!confirm('Are you sure you want to permanently delete "' + title + '"?')) return;

    setActionLoading(id);
    const authToken = token || localStorage.getItem('arboveya_token') || '';

    try {
      const res = await fetch('http://localhost:5287/api/blogs/' + id, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + authToken },
      });

      if (res.ok) {
        setBlogs((prev) => prev.filter((b) => b.id !== id));
        setMsg({ text: 'Blog post "' + title + '" deleted.', type: 'success' });
        if (selectedBlog?.id === id) setSelectedBlog(null);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to delete blog post.');
      }
    } catch (err) {
      alert('Network error communicating with backend.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredBlogs = blogs.filter((b) =>
    !search ||
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.content.toLowerCase().includes(search.toLowerCase()) ||
    (b.authorName && b.authorName.toLowerCase().includes(search.toLowerCase()))
  );

  const pendingCount = blogs.filter((b) => !b.isApproved).length;

  return (
    <div className="min-h-screen bg-[#FBFBFA] pb-16">
      <AdminHeader activeTab="blogs" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#2E4D38] font-semibold mb-1">
              <Link href="/admin/products" className="hover:underline">Admin Portal</Link>
              <span>/</span>
              <span>Blog Moderation</span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-stone-900 flex items-center gap-3">
              <span>Blogs Moderation</span>
              {pendingCount > 0 && filter === 'pending' && (
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-sans px-2.5 py-0.5 rounded-full font-bold">
                  {pendingCount} Pending
                </span>
              )}
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Review, approve, or remove blogs submitted by registered buyers and sellers. Note: For sellers, both profile and blog require approval.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/blog"
              target="_blank"
              className="px-3.5 py-2 bg-[#2E4D38] text-white rounded-xl text-xs font-semibold hover:bg-[#243f2e] transition shadow-xs flex items-center gap-1.5"
            >
              <span>View Live Blog &rarr;</span>
            </Link>
          </div>
        </div>

        {/* Status Toast */}
        {msg && (
          <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between ${
            msg.type === 'success' 
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}>
            <span>{msg.text}</span>
            <button onClick={() => setMsg(null)} className="p-1 hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Toolbar & Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                filter === 'pending'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Review</span>
            </button>

            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                filter === 'approved'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approved / Published</span>
            </button>

            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                filter === 'all'
                  ? 'bg-stone-800 text-white shadow-2xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <span>All Blogs</span>
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, content, author..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30"
              />
            </div>
            <button
              onClick={fetchBlogs}
              className="p-2 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-50 cursor-pointer"
              title="Refresh queue"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table List */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-20 text-center text-stone-400 text-sm">
              Loading blog submissions...
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="py-20 text-center text-stone-500">
              <BookOpen className="w-10 h-10 mx-auto text-stone-300 mb-2" />
              <p className="font-serif text-lg font-bold text-stone-800">No blogs match criteria</p>
              <p className="text-xs text-stone-400">All submissions are current and reviewed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Blog</th>
                    <th className="py-3.5 px-6">Author & Role</th>
                    <th className="py-3.5 px-6">Category</th>
                    <th className="py-3.5 px-6">Publication Status</th>
                    <th className="py-3.5 px-6">Date</th>
                    <th className="py-3.5 px-6 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredBlogs.map((blog) => {
                    const isSeller = blog.authorRole === 'Seller';
                    const sellerApproved = blog.authorIsSellerApproved;
                    const blogApproved = blog.isApproved;
                    const isLive = blogApproved && (!isSeller || sellerApproved);

                    return (
                      <tr key={blog.id} className="hover:bg-stone-50/60 transition">
                        {/* Article Info */}
                        <td className="py-4 px-6 max-w-xs">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-xl bg-stone-100 overflow-hidden flex-shrink-0 border border-stone-200">
                              <Image
                                src={blog.imageUrl || '/images/blog-moringa.jpg'}
                                alt={blog.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-stone-900 truncate text-xs sm:text-sm">
                                {blog.title}
                              </p>
                              <p className="text-xs text-stone-400 line-clamp-1 mt-0.5">
                                {blog.content}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Author & Role */}
                        <td className="py-4 px-6 text-xs">
                          <div className="space-y-1">
                            <p className="font-semibold text-stone-800">{blog.authorName || 'Registered User'}</p>
                            <p className="text-stone-400 text-[11px]">{blog.authorEmail || 'N/A'}</p>
                            
                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                              {isSeller ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#edf5ee] text-[#1c3f24] border border-[#bcd2bf]">
                                  <Store className="w-3 h-3 text-[#24492d]" />
                                  <span>Seller</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  <User className="w-3 h-3" />
                                  <span>Registered Buyer</span>
                                </span>
                              )}

                              {isSeller && (
                                sellerApproved ? (
                                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                    Profile Approved
                                  </span>
                                ) : (
                                  <div className="inline-flex items-center gap-1">
                                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                      Profile Pending
                                    </span>
                                    <button
                                      onClick={() => handleApproveSeller(blog.authorId, blog.authorName)}
                                      disabled={actionLoading === blog.authorId}
                                      className="text-[10px] font-bold px-2 py-0.5 bg-[#2E4D38] text-white rounded hover:bg-[#243f2e] transition shadow-2xs disabled:opacity-50"
                                      title="Approve seller merchant profile now"
                                    >
                                      Approve Profile
                                    </button>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-4 px-6">
                          <span className="text-xs font-semibold px-2.5 py-1 bg-stone-100 rounded-full text-stone-700">
                            {blog.category || 'Wellness'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6">
                          {isLive ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Published & Live</span>
                            </span>
                          ) : blogApproved && isSeller && !sellerApproved ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200" title="Blog approved, but waiting on seller profile approval before publishing publicly">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Awaiting Seller Profile</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Pending Blog Review</span>
                            </span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-4 px-6 text-xs text-stone-500 whitespace-nowrap">
                          {new Date(blog.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Preview modal */}
                            <button
                              onClick={() => setSelectedBlog(blog)}
                              title="Inspect Article"
                              className="p-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Toggle Approval */}
                            {!blog.isApproved ? (
                              <button
                                disabled={actionLoading === blog.id}
                                onClick={() => handleModerate(blog.id, true)}
                                className="px-3 py-1.5 rounded-lg bg-[#2E4D38] text-white text-xs font-semibold hover:bg-[#243f2e] transition shadow-xs flex items-center gap-1 disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve Blog</span>
                              </button>
                            ) : (
                              <button
                                disabled={actionLoading === blog.id}
                                onClick={() => handleModerate(blog.id, false)}
                                className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold hover:bg-amber-200 transition disabled:opacity-50"
                              >
                                <span>Unpublish</span>
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              disabled={actionLoading === blog.id}
                              onClick={() => handleDelete(blog.id, blog.title)}
                              title="Delete Article"
                              className="p-2 rounded-lg border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 transition disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Preview Full Article Modal */}
      {selectedBlog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[92vh] overflow-y-auto overflow-hidden">
            {/* Top Featured Hero Image (Display from top) */}
            <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full bg-stone-100 overflow-hidden">
              <Image
                src={selectedBlog.imageUrl || '/images/blog-moringa.jpg'}
                alt={selectedBlog.title}
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
              <div className="absolute top-4 left-4">
                <span className="text-xs font-bold text-white bg-[#2E4D38]/90 backdrop-blur-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  {selectedBlog.category || 'Wellness'}
                </span>
              </div>
              <button
                onClick={() => setSelectedBlog(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-xs transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8">
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">
                {selectedBlog.title}
              </h2>

              <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100 flex-wrap gap-2 text-xs">
                <div className="text-stone-500">
                  <span className="font-semibold text-stone-800">
                    Author: {selectedBlog.authorName || 'User'} ({selectedBlog.authorEmail || 'N/A'})
                  </span>
                  <span className="mx-2">•</span>
                  <span>
                    {new Date(selectedBlog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                {selectedBlog.authorRole === 'Seller' && !selectedBlog.authorIsSellerApproved && (
                  <button
                    onClick={() => handleApproveSeller(selectedBlog.authorId, selectedBlog.authorName)}
                    className="px-3 py-1 bg-[#2E4D38] text-white text-xs font-bold rounded-lg hover:bg-[#243f2e] transition"
                  >
                    Approve Seller Profile Now
                  </button>
                )}
              </div>

            <div className="text-stone-700 text-sm leading-relaxed space-y-4 whitespace-pre-line font-serif sm:font-sans">
              {selectedBlog.content}
            </div>

            {/* Moderation actions inside modal */}
            <div className="mt-8 pt-4 border-t border-stone-100 flex items-center justify-between">
              <button
                onClick={() => setSelectedBlog(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 text-xs font-semibold text-stone-700 hover:bg-stone-200"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {!selectedBlog.isApproved ? (
                  <button
                    onClick={() => {
                      handleModerate(selectedBlog.id, true);
                      setSelectedBlog(null);
                    }}
                    className="px-5 py-2 rounded-xl bg-[#2E4D38] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#243f2e]"
                  >
                    Approve Blog
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleModerate(selectedBlog.id, false);
                      setSelectedBlog(null);
                    }}
                    className="px-5 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-amber-700"
                  >
                    Unpublish
                  </button>
                )}
                <button
                  onClick={() => {
                    handleDelete(selectedBlog.id, selectedBlog.title);
                    setSelectedBlog(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}