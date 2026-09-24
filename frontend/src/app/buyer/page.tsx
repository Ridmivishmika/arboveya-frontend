'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { BlogPost } from '@/types';
import { API_BASE_URL, uploadBlogImage, resolveBackendImageUrl } from '@/lib/api';
import { 
  Package, 
  ShoppingBag,
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  User,
  LogOut,
  PenTool,
  BookOpen,
  Edit3,
  Trash2,
  Plus,
  Minus,
  X,
  FileText,
  Eye,
  Star,
  MessageSquare,
  Lock,
  MapPin,
  Truck,
  ArrowRight,
  ArrowLeft,
  Upload,
  RefreshCw,
  LogIn
} from 'lucide-react';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface BuyerReviewRecord {
  id: string;
  productId: string;
  productName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Order {
  id: string;
  payHereOrderId?: string;
  customerName?: string;
  shippingAddress?: string;
  shippingMethod?: string;
  shippingCost?: number;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  shippedAt?: string;
  items?: OrderItem[];
  orderItems?: OrderItem[];
}

export default function BuyerDashboardPage() {
  const router = useRouter();
  const { user, logout, token, refreshUser, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'articles' | 'cart'>('orders');

  // Cart Context
  const { 
    cart, 
    cartCount, 
    subtotal, 
    discountAmount, 
    shipping, 
    total, 
    coupon, 
    couponError, 
    couponSuccess, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    applyCoupon, 
    removeCoupon 
  } = useCart();

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Blogs State
  const [myBlogs, setMyBlogs] = useState<BlogPost[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [readingBlog, setReadingBlog] = useState<BlogPost | null>(null);
  const [submittingBlog, setSubmittingBlog] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form Fields for Blog
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Wellness');
  const [formImageUrl, setFormImageUrl] = useState('/images/blog-moringa.jpg');
  const [formContent, setFormContent] = useState('');
  const [uploadingBlogImage, setUploadingBlogImage] = useState(false);
  const [blogUploadError, setBlogUploadError] = useState<string | null>(null);
  const blogFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleBlogImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setBlogUploadError('Image size exceeds 10MB limit.');
      return;
    }

    try {
      setUploadingBlogImage(true);
      setBlogUploadError(null);
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('arboveya_token') : '') || '';
      const url = await uploadBlogImage(file, authToken);
      setFormImageUrl(url);
    } catch (err: any) {
      setBlogUploadError(err.message || 'Failed to upload blog image.');
    } finally {
      setUploadingBlogImage(false);
      if (blogFileInputRef.current) blogFileInputRef.current.value = '';
    }
  };

  // Review Modal State
  const [reviewModalProduct, setReviewModalProduct] = useState<{ id: string; name: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedProductIds, setReviewedProductIds] = useState<string[]>([]);

  // Persistent buyer reviews for View / Edit / Delete
  const [buyerReviews, setBuyerReviews] = useState<Record<string, BuyerReviewRecord>>({});
  const [viewingReview, setViewingReview] = useState<BuyerReviewRecord | null>(null);
  const [editingReview, setEditingReview] = useState<BuyerReviewRecord | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [updatingReview, setUpdatingReview] = useState(false);

  // Shipping & Checkout Form State
  const [shippingFullName, setShippingFullName] = useState('');
  const [shippingEmail, setShippingEmail] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingCountry, setShippingCountry] = useState('Sri Lanka');
  const [couponInput, setCouponInput] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [buyerReviewsList, setBuyerReviewsList] = useState<BuyerReviewRecord[]>([]);

  // Fetch customer reviews directly from database
  const fetchBuyerReviews = async () => {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('arboveya_token') : '') || '';
    try {
      const params = new URLSearchParams();
      if (user?.id) params.append('userId', user.id);
      if (user?.email) params.append('email', user.email);
      const queryStr = params.toString() ? `?${params.toString()}` : '';

      const res = await fetch(`${API_BASE_URL}/reviews/my-reviews${queryStr}`, {
        headers: authToken ? { Authorization: 'Bearer ' + authToken } : {},
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const map: Record<string, BuyerReviewRecord> = {};
          const list: BuyerReviewRecord[] = [];
          data.forEach((r: any) => {
            if (r.productId) {
              const cleanComment = r.comment ? r.comment.replace(/^\[.*?\]\s*/, '') : '';
              const rec: BuyerReviewRecord = {
                id: r.id,
                productId: r.productId,
                productName: r.productName || 'Botanical Product',
                rating: r.rating || 5,
                comment: cleanComment,
                createdAt: r.createdAt || new Date().toISOString()
              };
              map[r.productId] = rec;
              list.push(rec);
            }
          });
          setBuyerReviews(map);
          setBuyerReviewsList(list);
          setReviewedProductIds(Object.keys(map));
        }
      }
    } catch (e) {
      console.warn('Error fetching buyer reviews from DB:', e);
    }
  };

  useEffect(() => {
    fetchBuyerReviews();
  }, [user?.id, user?.email]);

  // Pre-fill shipping info from authenticated user
  useEffect(() => {
    if (user) {
      setShippingFullName(user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim());
      setShippingEmail(user.email || '');
      if (user.phoneNumber) setShippingPhone(user.phoneNumber);
      if (user.address) setShippingAddress(user.address);
      if (user.nationality) setShippingCountry(user.nationality);
    }
  }, [user]);

  const handleSignOut = () => {
    logout();
    window.location.replace('/');
  };

  const fetchOrders = async () => {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('arboveya_token') : '') || '';
    setLoadingOrders(true);
    try {
      const emailQuery = user?.email ? `?email=${encodeURIComponent(user.email)}` : '';
      const res = await fetch(`${API_BASE_URL}/orders/my-orders${emailQuery}`, {
        headers: authToken ? { Authorization: 'Bearer ' + authToken } : {},
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        const normalized = Array.isArray(data) ? data.map((o: any) => ({
          ...o,
          items: o.items || o.orderItems || [],
          orderItems: o.items || o.orderItems || []
        })) : [];
        setOrders(normalized);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.warn('Orders fetch error', err);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchMyBlogs = async () => {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('arboveya_token') : '') || '';
    if (!authToken) {
      setLoadingBlogs(false);
      return;
    }
    setLoadingBlogs(true);
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
      console.warn('Failed to load user blogs:', err);
    } finally {
      setLoadingBlogs(false);
    }
  };

  // Synchronize tab state with Buyer Dashboard Navbar events & URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'articles') {
        setActiveTab('articles');
        if (params.get('write') === 'true') {
          setTimeout(() => handleOpenCreate(), 100);
        }
      } else if (tabParam === 'orders') {
        setActiveTab('orders');
      } else if (tabParam === 'cart') {
        setActiveTab('cart');
      }
    }

    const handleSetTab = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail === 'orders' || customEvent.detail === 'articles' || customEvent.detail === 'cart') {
        setActiveTab(customEvent.detail);
      }
    };

    const handleOpenWrite = () => {
      setActiveTab('articles');
      handleOpenCreate();
    };

    window.addEventListener('arboveya:set-buyer-tab', handleSetTab as EventListener);
    window.addEventListener('arboveya:open-write-article', handleOpenWrite);

    return () => {
      window.removeEventListener('arboveya:set-buyer-tab', handleSetTab as EventListener);
      window.removeEventListener('arboveya:open-write-article', handleOpenWrite);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('arboveya:buyer-tab-changed', { detail: activeTab }));
  }, [activeTab]);

  useEffect(() => {
    if (user) {
      if (refreshUser) refreshUser();
      fetchOrders();
      fetchMyBlogs();
    } else {
      setLoadingOrders(false);
      setLoadingBlogs(false);
    }
  }, [user?.id]);

  const handleOpenCreate = () => {
    setEditingBlog(null);
    setFormTitle('');
    setFormCategory('Wellness');
    setFormImageUrl('/images/blog-moringa.jpg');
    setFormContent('');
    setShowCreateModal(true);
  };

  const handleOpenEdit = (blog: BlogPost) => {
    setEditingBlog(blog);
    setFormTitle(blog.title);
    setFormCategory(blog.category || 'Wellness');
    setFormImageUrl(blog.imageUrl || '/images/blog-moringa.jpg');
    setFormContent(blog.content);
    setShowCreateModal(true);
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingBlog(true);
    setStatusMessage(null);
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('arboveya_token') : '') || '';

    try {
      const payload = {
        title: formTitle.trim(),
        content: formContent.trim(),
        category: formCategory,
        imageUrl: formImageUrl.trim() || '/images/blog-moringa.jpg',
      };

      if (editingBlog) {
        const res = await fetch(`${API_BASE_URL}/blogs/${editingBlog.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: 'Bearer ' + authToken } : {})
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const updated = await res.json();
          setMyBlogs(prev => prev.map(b => b.id === updated.id ? updated : b));
          setStatusMessage({ text: 'Blog updated successfully. Changes are now live.', type: 'success' });
          setShowCreateModal(false);
        } else {
          const err = await res.json().catch(() => ({}));
          alert(err.message || 'Failed to update blog.');
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/blogs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: 'Bearer ' + authToken } : {})
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const created = await res.json();
          setMyBlogs(prev => [created, ...prev]);
          setStatusMessage({ text: 'Blog created successfully! It is now published live.', type: 'success' });
          setShowCreateModal(false);
        } else {
          const err = await res.json().catch(() => ({}));
          alert(err.message || 'Failed to publish blog.');
        }
      }
    } catch (err) {
      alert('Network error communicating with Arboveya blog server.');
    } finally {
      setSubmittingBlog(false);
    }
  };

  const handleDeleteBlog = async (blog: BlogPost) => {
    if (!confirm(`Are you sure you want to permanently delete "${blog.title}"?`)) return;
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('arboveya_token') : '') || '';

    try {
      const res = await fetch(`${API_BASE_URL}/blogs/${blog.id}`, {
        method: 'DELETE',
        headers: authToken ? { Authorization: 'Bearer ' + authToken } : {}
      });

      if (res.ok) {
        setMyBlogs(prev => prev.filter(b => b.id !== blog.id));
        setStatusMessage({ text: `Blog "${blog.title}" deleted successfully.`, type: 'success' });
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to delete blog.');
      }
    } catch (err) {
      alert('Network error deleting blog.');
    }
  };

  // Review Handlers
  const handleOpenReview = (productId: string, productName: string) => {
    setReviewModalProduct({ id: productId, name: productName });
    setReviewRating(5);
    setReviewComment('');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalProduct) return;
    setSubmittingReview(true);

    try {
      const authorName = user?.fullName || `${user?.firstName || 'Verified'} ${user?.lastName || 'Buyer'}`.trim();
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('arboveya_token') : '') || '';

      const res = await fetch(`${API_BASE_URL}/products/${reviewModalProduct.id}/public-reviews`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: 'Bearer ' + authToken } : {})
        },
        body: JSON.stringify({
          authorName: authorName,
          userId: user?.id || null,
          userEmail: user?.email || null,
          rating: reviewRating,
          comment: reviewComment.trim()
        })
      });

      let createdId = 'rev-' + Date.now();
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data && data.id) {
          createdId = data.id;
        }
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to save review to database.');
      }

      const newRecord: BuyerReviewRecord = {
        id: createdId,
        productId: reviewModalProduct.id,
        productName: reviewModalProduct.name,
        rating: reviewRating,
        comment: reviewComment.trim().replace(/^\[.*?\]\s*/, ''),
        createdAt: new Date().toISOString()
      };

      setBuyerReviews(prev => ({ ...prev, [reviewModalProduct.id]: newRecord }));
      setBuyerReviewsList(prev => [newRecord, ...prev.filter(r => r.productId !== reviewModalProduct.id && r.id !== newRecord.id)]);
      setReviewedProductIds(prev => Array.from(new Set([...prev, reviewModalProduct.id])));
      setReviewModalProduct(null);
      setStatusMessage({
        text: `Thank you! Your verified customer review for "${reviewModalProduct.name}" is now live immediately!`,
        type: 'success'
      });

      await fetchBuyerReviews();
    } catch (err: any) {
      console.error('Review submit error:', err);
      alert(err.message || 'Failed to save review to database.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleOpenViewReview = (productId: string, productName?: string, record?: BuyerReviewRecord) => {
    const rev = record || buyerReviews[productId];
    if (rev) {
      setViewingReview({
        ...rev,
        productName: productName || rev.productName || 'Botanical Product',
        comment: rev.comment ? rev.comment.replace(/^\[.*?\]\s*/, '') : ''
      });
    }
  };

  const handleOpenEditReview = (productId: string, productName?: string, record?: BuyerReviewRecord) => {
    const rev = record || buyerReviews[productId];
    if (rev) {
      setEditingReview({
        ...rev,
        productName: productName || rev.productName || 'Botanical Product'
      });
      setEditRating(rev.rating);
      setEditComment(rev.comment ? rev.comment.replace(/^\[.*?\]\s*/, '') : '');
    }
  };

  const handleUpdateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    setUpdatingReview(true);
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('arboveya_token') : '') || '';

    try {
      const authorName = user?.fullName || `${user?.firstName || 'Verified'} ${user?.lastName || 'Buyer'}`.trim();
      const cleanComment = editComment.trim().replace(/^\[.*?\]\s*/, '');

      // 1. First try PUT to /api/reviews/{id}
      let res = await fetch(`${API_BASE_URL}/reviews/${editingReview.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: 'Bearer ' + authToken } : {})
        },
        body: JSON.stringify({
          rating: editRating,
          comment: cleanComment,
          authorName: authorName,
          productId: editingReview.productId
        })
      });

      // 2. If PUT fails, fallback to public-reviews upsert
      if (!res.ok && editingReview.productId) {
        res = await fetch(`${API_BASE_URL}/products/${editingReview.productId}/public-reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: 'Bearer ' + authToken } : {})
          },
          body: JSON.stringify({
            authorName: authorName,
            userId: user?.id || null,
            userEmail: user?.email || null,
            rating: editRating,
            comment: cleanComment
          })
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update review in database.');
      }

      const resData = await res.json().catch(() => null);
      const updatedRecord: BuyerReviewRecord = {
        ...editingReview,
        id: resData?.id || editingReview.id,
        rating: editRating,
        comment: cleanComment
      };

      setBuyerReviews(prev => ({ ...prev, [editingReview.productId]: updatedRecord }));
      setBuyerReviewsList(prev => {
        const idx = prev.findIndex(r => r.id === updatedRecord.id || r.productId === updatedRecord.productId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedRecord;
          return next;
        }
        return [updatedRecord, ...prev];
      });
      setEditingReview(null);
      setStatusMessage({
        text: `Your review for "${editingReview.productName}" has been updated successfully!`,
        type: 'success'
      });

      await fetchBuyerReviews();
    } catch (err: any) {
      console.error('Review update error:', err);
      alert(err.message || 'Failed to update review.');
    } finally {
      setUpdatingReview(false);
    }
  };

  const handleDeleteReview = async (productId: string, productName?: string, reviewId?: string) => {
    const targetName = productName || buyerReviews[productId]?.productName || 'this remedy';
    if (!confirm(`Are you sure you want to delete your review for "${targetName}"?`)) return;

    const rev = buyerReviews[productId];
    const targetId = reviewId || rev?.id;
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('arboveya_token') : '') || '';

    if (targetId) {
      try {
        await fetch(`${API_BASE_URL}/reviews/${targetId}`, {
          method: 'DELETE',
          headers: authToken ? { Authorization: 'Bearer ' + authToken } : {}
        });
      } catch (err) {
        console.warn('Backend review deletion error:', err);
      }
    }

    setBuyerReviews(prev => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });

    setBuyerReviewsList(prev => prev.filter(r => r.id !== targetId && r.productId !== productId));
    setReviewedProductIds(prev => prev.filter(id => id !== productId));
    setStatusMessage({
      text: `Your review for "${targetName}" has been deleted.`,
      type: 'success'
    });

    await fetchBuyerReviews();
  };

  // Place Order Handler for Buyer Dashboard
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setOrderError('Please agree to the botanical dispatch & quality conditions.');
      return;
    }
    if (cart.length === 0) {
      setOrderError('Your shopping cart is empty.');
      return;
    }

    try {
      setPlacingOrder(true);
      setOrderError(null);

      const payload = {
        customerName: shippingFullName.trim() || user?.fullName || 'Valued Customer',
        customerEmail: shippingEmail.trim() || user?.email || '',
        shippingAddress: `${shippingAddress.trim()}, ${shippingCity.trim() ? shippingCity.trim() + ', ' : ''}${shippingCountry}`,
        items: cart.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.price,
          productImageUrl: item.product.imageUrl
        }))
      };

      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('arboveya_token') : '') || '';

      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: 'Bearer ' + authToken } : {})
        },
        body: JSON.stringify(payload)
      });

      let orderRecord: Order;

      if (res.ok) {
        const data = await res.json();
        const resolvedItems = (data.items && data.items.length > 0)
          ? data.items
          : (data.orderItems && data.orderItems.length > 0)
          ? data.orderItems
          : cart.map(item => ({
              id: 'item-' + Math.random().toString(36).substr(2, 9),
              productId: item.product.id,
              productName: item.product.name,
              quantity: item.quantity,
              unitPrice: item.product.price,
              totalPrice: item.product.price * item.quantity
            }));

        orderRecord = {
          ...data,
          customerName: data.customerName || payload.customerName,
          shippingAddress: data.shippingAddress || payload.shippingAddress,
          totalAmount: data.totalAmount || total,
          orderStatus: data.orderStatus || 'Processing',
          paymentStatus: data.paymentStatus || 'Paid',
          createdAt: data.createdAt || new Date().toISOString(),
          items: resolvedItems,
          orderItems: resolvedItems
        };
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to place order.');
      }

      setOrders(prev => [orderRecord, ...prev]);
      clearCart();
      setActiveTab('orders');
      setStatusMessage({
        text: `Thank you! Your order #${orderRecord.payHereOrderId || orderRecord.id} has been placed successfully and is now processing.`,
        type: 'success'
      });

      await fetchOrders();
    } catch (err) {
      console.warn('Place order error:', err);
      setOrderError('Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center py-20">
        <div className="text-center text-xs font-medium text-stone-500 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#2E4D38]" />
          <span>Loading Buyer Portal...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
        <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200 p-8 sm:p-10 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#24492d] flex items-center justify-center mx-auto shadow-xs">
            <User className="w-8 h-8" />
          </div>

          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              Buyer Portal Access
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
              Please sign in to track your orders, check shipment deliveries, manage your wishlist, and post product reviews.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/login?role=Customer&redirect=/buyer"
              className="w-full py-3 px-5 rounded-xl bg-[#24492d] hover:bg-[#1a3821] text-white text-xs font-bold tracking-wider uppercase shadow-sm transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Your Account</span>
            </Link>

            <Link
              href="/register?role=Customer&redirect=/buyer"
              className="w-full py-3 px-5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold tracking-wider uppercase transition flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>Create Customer Account</span>
            </Link>

            <div>
              <Link href="/" className="text-xs text-stone-500 hover:text-stone-900 underline">
                Return to Store Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFA] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Status Message Notification */}
        {statusMessage && (
          <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="p-1 hover:opacity-75 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Browse Catalog shortcut (in-page tab buttons removed per user preference) */}
        <div className="flex items-center justify-end pb-3 border-b border-stone-200">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#2E4D38] text-[#2E4D38] hover:bg-[#edf5ee] text-xs font-bold uppercase tracking-wider transition"
          >
            <span>Browse Catalog</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* TAB 1: RECENT ORDERS & PRODUCT REVIEWS */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div>
                <h2 className="font-serif text-lg font-bold text-stone-900">Recent Herbal Orders & Reviews</h2>
                <p className="text-xs text-stone-500">Track orders and share your experience with purchased herbal remedies.</p>
              </div>
              <span className="text-xs font-semibold text-[#2E4D38] bg-[#F4F6F4] px-3 py-1 rounded-lg">
                {orders.length} Order(s)
              </span>
            </div>

            {/* Quick Cart Action if items present */}
            {cart.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-[#edf5ee] border border-[#c2dac5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4 text-[#24492d]" />
                  <span className="text-xs text-stone-700">
                    You have <strong>{cart.reduce((s, i) => s + i.quantity, 0)} herbal item(s)</strong> (${subtotal.toFixed(2)}) in your cart ready for checkout.
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('cart')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#24492d] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#1a3821] transition cursor-pointer self-start sm:self-auto"
                >
                  <span>Review Cart & Checkout</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {loadingOrders ? (
              <div className="py-12 text-center text-stone-400 text-xs">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="py-12 text-center text-stone-400">
                <Package className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                <p className="text-sm font-medium text-stone-600">No orders placed yet</p>
                <Link href="/shop" className="text-xs text-[#2E4D38] font-bold hover:underline mt-1 inline-block">
                  Explore Herbal Catalog &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-5">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-5 rounded-2xl border border-stone-200/90 hover:border-[#2E4D38]/40 transition bg-[#FBFBFA]/80 space-y-4"
                  >
                    {/* Order Header Summary */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/60">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-stone-900">
                            {order.payHereOrderId || order.id}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                            {order.orderStatus || 'Delivered'}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                            {order.paymentStatus || 'Paid'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          <span>
                            Placed on {new Date(order.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-bold text-[#2E4D38]">
                          ${order.totalAmount?.toFixed(2) || '67.97'}
                        </div>
                        <div className="text-[11px] text-stone-400">Total Paid</div>
                      </div>
                    </div>

                    {/* Shipping Method and Delivery Address Summary */}
                    <div className="p-3 bg-stone-50/80 rounded-xl border border-stone-200/60 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Shipping Method</span>
                        <div className="flex items-center gap-1.5 mt-0.5 font-semibold text-[#2E4D38]">
                          <Truck className="w-3.5 h-3.5 text-[#2E4D38]" />
                          <span>{order.shippingMethod || 'Standard Shipping'}</span>
                          <span className="text-[11px] font-normal text-stone-500">
                            ({order.shippingCost === 0 || !order.shippingCost ? 'Free' : `$${order.shippingCost.toFixed(2)}`})
                          </span>
                        </div>
                      </div>
                      {order.shippingAddress && (
                        <div>
                          <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Delivery Address</span>
                          <span className="text-stone-700 mt-0.5 block">{order.shippingAddress}</span>
                        </div>
                      )}
                    </div>

                    {/* Shipment Tracking Information Banner if Shipped */}
                    {order.trackingNumber && (
                      <div className="p-3.5 bg-[#edf5ee] border border-[#bcd6be] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#24492d] text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#1c3f24] text-xs">
                                Shipment Dispatched ({order.shippingCarrier || 'Courier Express'})
                              </span>
                              <span className="px-1.5 py-0.2 bg-[#24492d] text-white text-[9px] font-bold rounded">
                                {order.orderStatus || 'Shipped'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-stone-600 text-[11px]">Tracking Number:</span>
                              <span className="font-mono font-bold text-[#1c3f24] bg-white px-2 py-0.5 rounded border border-[#c5dec7]">
                                {order.trackingNumber}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (order.trackingNumber) {
                              navigator.clipboard.writeText(order.trackingNumber);
                              alert('Tracking number copied to clipboard: ' + order.trackingNumber);
                            }
                          }}
                          className="text-[11px] font-bold text-[#24492d] hover:text-[#1a3821] bg-white border border-[#24492d]/30 px-2.5 py-1 rounded-lg hover:bg-[#e4f0e5] transition shadow-2xs self-start sm:self-auto cursor-pointer"
                        >
                          Copy Tracking #
                        </button>
                      </div>
                    )}

                    {/* Order Items & Review Action */}
                    <div className="space-y-3 pt-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        Purchased Items (Review to help fellow shoppers):
                      </p>

                      {(() => {
                        const itemsList = (order.items && order.items.length > 0) 
                          ? order.items 
                          : (order.orderItems && order.orderItems.length > 0) 
                          ? order.orderItems 
                          : [];

                        if (itemsList.length === 0) {
                          return (
                            <p className="text-xs text-stone-400 italic py-1">Order processed.</p>
                          );
                        }

                        return itemsList.map((item) => {
                          const userReview = buyerReviews[item.productId] || buyerReviewsList.find(r => r.productId === item.productId);
                          const isReviewed = Boolean(userReview) || reviewedProductIds.includes(item.productId);

                        return (
                          <div
                            key={item.id}
                            className="p-4 rounded-xl bg-white border border-stone-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                          >
                            <div className="space-y-1">
                              <h4 className="font-serif text-sm font-bold text-stone-900">
                                {item.productName}
                              </h4>
                              <p className="text-xs text-stone-500">
                                Qty: {item.quantity} · ${item.unitPrice?.toFixed(2)} each
                              </p>

                              {isReviewed && userReview && (
                                <div className="mt-2 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100/90 space-y-1 max-w-md">
                                  <div className="flex items-center gap-1.5">
                                    <div className="flex items-center text-amber-500">
                                      {Array.from({ length: 5 }).map((_, sIdx) => (
                                        <Star
                                          key={sIdx}
                                          className={`w-3.5 h-3.5 ${
                                            sIdx < userReview.rating
                                              ? 'fill-amber-400 text-amber-400'
                                              : 'text-stone-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-[11px] font-bold text-emerald-900">
                                      Your Review ({userReview.rating}/5)
                                    </span>
                                  </div>
                                  {userReview.comment && (
                                    <p className="text-xs text-stone-700 italic line-clamp-2">
                                      "{userReview.comment}"
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="self-end sm:self-center">
                              {isReviewed ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenViewReview(item.productId, item.productName, userReview)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-bold transition shadow-2xs cursor-pointer"
                                    title="View published review"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-stone-500" />
                                    <span>View</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditReview(item.productId, item.productName, userReview)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#2E4D38]/30 bg-emerald-50 hover:bg-emerald-100 text-[#2E4D38] text-xs font-bold transition shadow-2xs cursor-pointer"
                                    title="Edit your review"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-[#2E4D38]" />
                                    <span>Edit</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteReview(item.productId, item.productName, userReview?.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition shadow-2xs cursor-pointer"
                                    title="Delete your review"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReview(item.productId, item.productName)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#2E4D38] bg-emerald-50/50 hover:bg-emerald-100 text-[#2E4D38] text-xs font-bold transition shadow-2xs cursor-pointer"
                                >
                                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                  <span>Write Review</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              ))}
            </div>
            )}

            {/* Dedicated Section: My Published Reviews & Community Feedback */}
            <div className="pt-6 border-t border-stone-200/80 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>My Published Customer Reviews</span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    All herbal reviews and ratings you have shared across Arboveya remedies.
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#2E4D38] bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg">
                  {buyerReviewsList.length} Review{buyerReviewsList.length === 1 ? '' : 's'}
                </span>
              </div>

              {buyerReviewsList.length === 0 ? (
                <div className="p-6 rounded-2xl bg-stone-50/70 border border-dashed border-stone-200 text-center">
                  <Star className="w-6 h-6 text-stone-300 mx-auto mb-1.5" />
                  <p className="text-xs font-medium text-stone-600">No customer reviews published yet.</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Share your experience on purchased products above or from any remedy page in the catalog.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {buyerReviewsList.map((rev) => (
                    <div
                      key={rev.id || rev.productId}
                      className="p-4 rounded-2xl bg-[#FBFBFA]/80 border border-stone-200/90 hover:border-[#2E4D38]/40 transition shadow-2xs flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/shop/${rev.productId}`}
                            className="font-serif text-sm font-bold text-stone-900 hover:text-[#2E4D38] hover:underline transition line-clamp-1"
                          >
                            {rev.productName}
                          </Link>
                          <span className="text-[10px] text-stone-400 whitespace-nowrap">
                            {new Date(rev.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center text-amber-500">
                            {Array.from({ length: 5 }).map((_, sIdx) => (
                              <Star
                                key={sIdx}
                                className={`w-3.5 h-3.5 ${
                                  sIdx < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-stone-700">
                            {rev.rating}/5
                          </span>
                          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full ml-auto">
                            Published Live
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-white border border-stone-200/60">
                          <p className="text-xs text-stone-700 italic line-clamp-3 leading-relaxed">
                            "{rev.comment}"
                          </p>
                        </div>
                      </div>

                      {/* Review Action Buttons: View, Edit, Delete */}
                      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                        <Link
                          href={`/shop/${rev.productId}`}
                          className="text-[11px] font-medium text-[#2E4D38] hover:underline flex items-center gap-1"
                        >
                          <span>View in Shop</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenViewReview(rev.productId, rev.productName, rev)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition cursor-pointer"
                            title="View full review"
                          >
                            <Eye className="w-3 h-3 text-stone-500" />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditReview(rev.productId, rev.productName, rev)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#2E4D38]/30 bg-emerald-50 hover:bg-emerald-100 text-[#2E4D38] text-xs font-semibold transition cursor-pointer"
                            title="Edit your review"
                          >
                            <Edit3 className="w-3 h-3 text-[#2E4D38]" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteReview(rev.productId, rev.productName, rev.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition cursor-pointer"
                            title="Delete your review"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MY BOTANICAL BLOGS (CLEAN BLOGS VIEW - NO CART SHOWN) */}
        {activeTab === 'articles' && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div>
                <h2 className="font-serif text-lg font-bold text-stone-900">My Botanical Blogs</h2>
                <p className="text-xs text-stone-500">Blogs you have submitted to Arboveya's community wellness blog.</p>
              </div>
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2E4D38] text-white text-xs font-semibold hover:bg-[#243f2e] transition shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Blog</span>
              </button>
            </div>

            {loadingBlogs ? (
              <div className="py-12 text-center text-stone-400 text-xs">Loading blogs...</div>
            ) : myBlogs.length === 0 ? (
              <div className="py-12 text-center text-stone-400">
                <FileText className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                <p className="text-sm font-medium text-stone-600">No blogs published yet</p>
                <button
                  onClick={handleOpenCreate}
                  className="text-xs text-[#2E4D38] font-bold hover:underline mt-1 inline-block cursor-pointer"
                >
                  Write Your First Blog &rarr;
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myBlogs.map((blog) => (
                  <div
                    key={blog.id}
                    className="p-5 rounded-2xl border border-stone-200/90 hover:border-[#2E4D38]/40 transition bg-[#FBFBFA]/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
                        <Image
                          src={resolveBackendImageUrl(blog.imageUrl, '/images/blog-moringa.jpg')}
                          alt={blog.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {blog.category || 'Wellness'}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                            Live on Blog
                          </span>
                        </div>
                        <h3 className="font-serif font-bold text-sm text-stone-900 mt-1">
                          {blog.title}
                        </h3>
                        <p className="text-xs text-stone-400 mt-0.5">
                          Published {new Date(blog.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => setReadingBlog(blog)}
                        className="p-2 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 transition cursor-pointer"
                        title="Read Blog"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(blog)}
                        className="p-2 rounded-lg bg-[#2E4D38] text-white hover:bg-[#243f2e] transition cursor-pointer"
                        title="Edit Blog"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBlog(blog)}
                        className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
                        title="Delete Blog"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: VIEW FULL CART, SHIPPING ADDRESS & PLACE ORDER */}
        {activeTab === 'cart' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div>
                <h2 className="font-serif text-xl font-bold text-stone-900">Cart & Botanical Checkout</h2>
                <p className="text-xs text-stone-500">Review your herbal remedies, confirm delivery details, and place your order directly.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('orders')}
                  className="px-3.5 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold transition cursor-pointer"
                >
                  &larr; Back to Orders
                </button>
              </div>
            </div>

            {cart.length === 0 ? (
              <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#edf5ee] text-[#24492d] flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900">Your Botanical Cart is Empty</h3>
                  <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                    Explore our wildcrafted tinctures, Ayurvedic brews, and single-origin wellness botanicals to add remedies to your cart.
                  </p>
                </div>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#24492d] hover:bg-[#1a3821] text-white text-xs font-bold uppercase tracking-wider transition"
                >
                  <span>Explore Herbal Catalog</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Cart Items & Shipping Address Form */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Cart Items List */}
                  <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                      <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-[#2E4D38]" />
                        <span>Your Herbal Remedies ({cart.reduce((s, i) => s + i.quantity, 0)} Items)</span>
                      </h3>
                      <button
                        type="button"
                        onClick={clearCart}
                        className="text-xs text-stone-400 hover:text-rose-600 transition cursor-pointer"
                      >
                        Clear Cart
                      </button>
                    </div>

                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div
                          key={item.product.id}
                          className="p-3.5 rounded-2xl bg-[#FBFBFA] border border-stone-200/80 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0 border border-stone-100">
                              <Image
                                src={resolveBackendImageUrl(item.product.imageUrl, '/images/gotu-kola-tea.jpg')}
                                alt={item.product.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-medium text-xs sm:text-sm text-stone-900 truncate">
                                {item.product.name}
                              </h4>
                              <span className="text-[11px] text-stone-500 block">
                                ${item.product.price.toFixed(2)} each
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="flex items-center border border-stone-300 rounded-xl bg-white overflow-hidden shadow-2xs">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                className="px-2.5 py-1 text-stone-600 hover:bg-stone-100 transition text-xs font-bold cursor-pointer"
                              >
                                -
                              </button>
                              <span className="px-2 text-xs font-bold text-stone-800">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                className="px-2.5 py-1 text-stone-600 hover:bg-stone-100 transition text-xs font-bold cursor-pointer"
                              >
                                +
                              </button>
                            </div>

                            <span className="font-bold text-sm text-[#2E4D38] min-w-[55px] text-right">
                              ${(item.product.price * item.quantity).toFixed(2)}
                            </span>

                            <button
                              type="button"
                              onClick={() => removeFromCart(item.product.id)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Remove Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping & Delivery Address Form */}
                  <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                      <MapPin className="w-4 h-4 text-[#2E4D38]" />
                      <h3 className="font-serif text-base font-bold text-stone-900">
                        Shipping & Delivery Address
                      </h3>
                    </div>

                    {orderError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                        {orderError}
                      </div>
                    )}

                    <form id="buyer-checkout-form" onSubmit={handlePlaceOrder} className="space-y-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={shippingFullName}
                            onChange={(e) => setShippingFullName(e.target.value)}
                            placeholder="Elena Rostova"
                            className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            required
                            value={shippingEmail}
                            onChange={(e) => setShippingEmail(e.target.value)}
                            placeholder="elena@example.com"
                            className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                            Phone Contact *
                          </label>
                          <input
                            type="tel"
                            required
                            value={shippingPhone}
                            onChange={(e) => setShippingPhone(e.target.value)}
                            placeholder="+94 77 123 4567"
                            className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                            City / District *
                          </label>
                          <input
                            type="text"
                            required
                            value={shippingCity}
                            onChange={(e) => setShippingCity(e.target.value)}
                            placeholder="Colombo"
                            className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                          Delivery Street Address *
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          placeholder="42 Lotus Garden Path, Ward Place"
                          className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                          Country / Nationality *
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingCountry}
                          onChange={(e) => setShippingCountry(e.target.value)}
                          placeholder="Sri Lanka"
                          className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                        />
                      </div>

                      <div className="pt-2">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-600">
                          <input
                            type="checkbox"
                            checked={agreeTerms}
                            onChange={(e) => setAgreeTerms(e.target.checked)}
                            className="rounded text-[#24492d] focus:ring-[#24492d]"
                          />
                          <span>I agree to Arboveya botanical quality terms & dispatch conditions.</span>
                        </label>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Right Column: Order Summary & Place Order */}
                <div className="lg:col-span-5 space-y-6 sticky top-28">
                  <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-5">
                    <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                      <CheckCircle2 className="w-4 h-4 text-[#2E4D38]" />
                      <h3 className="font-serif text-base font-bold text-stone-900">
                        Order Summary
                      </h3>
                    </div>

                    {/* Promo Code Input */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          placeholder="Promo code (e.g. HERBAL10)"
                          className="flex-1 px-3 py-1.5 rounded-xl border border-stone-300 text-xs uppercase font-medium focus:outline-none focus:ring-1 focus:ring-[#2E4D38]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (couponInput.trim()) {
                              applyCoupon(couponInput.trim());
                              setCouponInput('');
                            }
                          }}
                          className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>
                      {couponSuccess && (
                        <p className="text-[11px] text-emerald-700 font-semibold">{couponSuccess}</p>
                      )}
                      {couponError && (
                        <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>
                      )}
                    </div>

                    {/* Pricing Breakdown */}
                    <div className="space-y-2.5 text-xs text-stone-600 border-t border-stone-100 pt-3">
                      <div className="flex justify-between">
                        <span>Herbal Subtotal:</span>
                        <span className="font-semibold text-stone-900">${subtotal.toFixed(2)}</span>
                      </div>

                      {discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-medium">
                          <span>Promo Discount ({coupon?.code}):</span>
                          <span>-${discountAmount.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span>Spring Delivery:</span>
                        <span>{shipping === 0 ? <strong className="text-emerald-700 uppercase">FREE</strong> : `$${shipping.toFixed(2)}`}</span>
                      </div>

                      <div className="flex justify-between text-base font-serif font-bold text-[#1c3f24] border-t border-stone-200 pt-2.5">
                        <span>Total Charged:</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Terms Agreement Notice */}
                    <p className="text-[11px] text-stone-500 leading-relaxed text-center px-1">
                      By placing this order, you confirm that you have read and agree to Arboveya&apos;s{' '}
                      <Link
                        href="/terms-and-conditions"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[#1c3f24] underline hover:text-[#2d5c36]"
                      >
                        Terms &amp; Conditions
                      </Link>
                      ,{' '}
                      <Link
                        href="/privacy-policy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[#1c3f24] underline hover:text-[#2d5c36]"
                      >
                        Privacy Policy
                      </Link>
                      , and{' '}
                      <Link
                        href="/refund-policy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[#1c3f24] underline hover:text-[#2d5c36]"
                      >
                        Refund Policy
                      </Link>
                      .
                    </p>

                    {/* Place Order Button */}
                    <button
                      type="submit"
                      form="buyer-checkout-form"
                      disabled={placingOrder}
                      className="w-full py-3.5 px-6 rounded-2xl bg-[#24492d] hover:bg-[#1a3821] text-white text-xs sm:text-sm font-bold tracking-wider uppercase shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Lock className="w-4 h-4" />
                      <span>{placingOrder ? 'Processing Order...' : `Place Botanical Order ($${total.toFixed(2)})`}</span>
                    </button>

                    <div className="pt-2 text-center text-[10px] text-stone-400 space-y-1">
                      <p>🔒 256-Bit SSL Encrypted Botanical Dispensary Checkout</p>
                      <p>🌿 100% Certified Organic Harvest Guarantee</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODAL: SUBMIT PRODUCT REVIEW (INSTANT PUBLISH, NO ADMIN APPROVAL NEEDED) */}
      {reviewModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900">
                  Review Purchased Product
                </h3>
              </div>
              <button
                onClick={() => setReviewModalProduct(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 mb-4">
              Reviewing: <strong className="text-stone-900 font-semibold">{reviewModalProduct.name}</strong>
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Overall Rating *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 cursor-pointer focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewRating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-stone-600 ml-2">
                    {reviewRating} of 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Your Review & Experience *
                </label>
                <textarea
                  required
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details about the quality, aroma, flavor, or wellness effects of this botanical remedy..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewModalProduct(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 rounded-xl bg-[#2E4D38] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#253f2e] transition shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {submittingReview ? 'Publishing...' : 'Publish Review Live'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW BUYER REVIEW */}
      {viewingReview && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Your Published Review
                </h3>
              </div>
              <button
                onClick={() => setViewingReview(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[11px] uppercase font-bold text-stone-400">Product</span>
                <h4 className="font-serif text-base font-bold text-stone-900 mt-0.5">
                  {viewingReview.productName}
                </h4>
              </div>

              <div>
                <span className="text-[11px] uppercase font-bold text-stone-400">Rating</span>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= viewingReview.rating
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-stone-300'
                      }`}
                    />
                  ))}
                  <span className="text-xs font-bold text-stone-700 ml-2">
                    {viewingReview.rating} / 5 Stars
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/70">
                <span className="text-[11px] uppercase font-bold text-stone-400 block mb-1">Review Comment</span>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                  "{viewingReview.comment}"
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-stone-400">
                  Status: <strong className="text-emerald-700 font-semibold">Live on Product Page</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const v = viewingReview;
                      setViewingReview(null);
                      handleOpenEditReview(v.productId, v.productName);
                    }}
                    className="px-3.5 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setViewingReview(null)}
                    className="px-4 py-1.5 rounded-xl bg-[#2E4D38] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#253f2e] transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT BUYER REVIEW */}
      {editingReview && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#2E4D38]" />
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Edit Your Review
                </h3>
              </div>
              <button
                onClick={() => setEditingReview(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 mb-4">
              Editing review for: <strong className="text-stone-900 font-semibold">{editingReview.productName}</strong>
            </p>

            <form onSubmit={handleUpdateReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Rating *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditRating(star)}
                      className="p-1 cursor-pointer focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= editRating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-stone-600 ml-2">
                    {editRating} of 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Review Comment *
                </label>
                <textarea
                  required
                  rows={4}
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingReview}
                  className="px-5 py-2 rounded-xl bg-[#2E4D38] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#253f2e] transition shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {updatingReview ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT BLOG */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
              <div className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-[#2E4D38]" />
                <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900">
                  {editingBlog ? 'Edit Botanical Blog' : 'Write Botanical Blog'}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBlog} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Blog Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. My Experience with Organic Brahmi Gotu Kola for Mental Clarity"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38] bg-white"
                  >
                    <option value="Wellness">Wellness & Health</option>
                    <option value="Herbal Remedies">Herbal Remedies</option>
                    <option value="Ayurveda">Ayurvedic Wisdom</option>
                    <option value="Tea Rituals">Tea Rituals</option>
                    <option value="Plant Nutrition">Plant Nutrition</option>
                  </select>
                </div>

                </div>

                {/* Featured Cover Image Section */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-stone-700">
                    Featured Image / Cover *
                  </label>

                  {/* Live Top Preview */}
                  {formImageUrl && (
                    <div className="relative aspect-[16/7] w-full rounded-xl overflow-hidden bg-stone-100 border border-stone-200 group shadow-2xs">
                      <Image
                        src={resolveBackendImageUrl(formImageUrl, '/images/blog-moringa.jpg')}
                        alt="Blog preview"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => blogFileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-white/95 text-stone-800 text-xs font-semibold hover:bg-white shadow-xs transition"
                        >
                          Change Image
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Upload & URL Controls */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="file"
                      ref={blogFileInputRef}
                      onChange={handleBlogImageUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    <button
                      type="button"
                      disabled={uploadingBlogImage}
                      onClick={() => blogFileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 text-xs font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                    >
                      {uploadingBlogImage ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#2E4D38]" />
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

                  {blogUploadError && (
                    <p className="text-[11px] text-rose-600 font-medium">{blogUploadError}</p>
                  )}

                  {/* Botanical Presets */}
                  <div className="pt-1">
                    <span className="text-[11px] text-stone-400 block mb-1.5">Or select botanical preset:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'Moringa', url: '/images/blog-moringa.jpg' },
                        { label: 'Gotu Kola', url: '/images/gotu-kola-tea.jpg' },
                        { label: 'Chamomile Brew', url: '/images/blog-herbal-tea.jpg' },
                        { label: 'Skincare Cream', url: '/images/blog-skincare.jpg' },
                        { label: 'Detox Tea', url: '/images/herbal-detox-tea.jpg' },
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

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Blog Content *
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Share your botanical recipes, health benefits, personal transformation journey, or herbal brewing techniques..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBlog}
                    className="px-5 py-2 rounded-xl bg-[#2E4D38] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#243f2e] transition shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    {submittingBlog ? 'Publishing...' : editingBlog ? 'Save Changes' : 'Publish Blog Live'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* MODAL: READ FULL BLOG (IMAGE DISPLAYED FROM THE TOP) */}
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
              <div className="absolute top-4 left-4">
                <span className="text-xs font-bold text-white bg-[#2E4D38]/90 backdrop-blur-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  {readingBlog.category || 'Wellness'}
                </span>
              </div>
              <button
                onClick={() => setReadingBlog(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-xs transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-4">
              <h2 className="font-serif text-2xl font-bold text-stone-900 leading-snug">
                {readingBlog.title}
              </h2>
              <p className="text-xs text-stone-400">
                Authored by {readingBlog.authorName} · Published {new Date(readingBlog.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              <div className="text-stone-700 text-sm leading-relaxed whitespace-pre-line pt-2 font-serif sm:font-sans">
                {readingBlog.content}
              </div>

              <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
                <button
                  onClick={() => setReadingBlog(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition cursor-pointer"
                >
                  Close
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const b = readingBlog;
                      setReadingBlog(null);
                      handleOpenEdit(b);
                    }}
                    className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                  >
                    Edit Blog
                  </button>
                  <button
                    onClick={() => {
                      const b = readingBlog;
                      setReadingBlog(null);
                      handleDeleteBlog(b);
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition cursor-pointer"
                  >
                    Delete Blog
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
