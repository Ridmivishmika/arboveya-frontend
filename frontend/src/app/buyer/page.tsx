'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { BlogPost } from '@/types';
import { API_BASE_URL, uploadBlogImage, resolveBackendImageUrl, startOrderConversation } from '@/lib/api';
import { 
  Package, 
  ShoppingBag,
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
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
  LogIn,
  AlertCircle,
  Globe,
  Phone,
  Search,
  Copy,
  Check,
  Printer,
  CreditCard,
  Calendar,
  Banknote,
  ShieldCheck,
  RotateCcw,
  ExternalLink
} from 'lucide-react';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productImageUrl?: string;
}

interface BuyerReviewRecord {
  id: string;
  orderId?: string;
  orderRef?: string;
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
  estimatedDeliveryDate?: string;
  trackingUrl?: string;
  refundStatus?: string;
  refundReason?: string;
  refundRequestedAt?: string;
  refundProcessedAt?: string;
  items?: OrderItem[];
  orderItems?: OrderItem[];
}

function getEstimatedDeliveryDate(order?: { estimatedDeliveryDate?: string; createdAt?: string } | null): Date {
  if (order?.estimatedDeliveryDate) {
    const parsed = new Date(order.estimatedDeliveryDate);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  const created = order?.createdAt ? new Date(order.createdAt) : new Date();
  const fallback = new Date(created);
  fallback.setDate(fallback.getDate() + 21);
  return fallback;
}

function formatEstimatedDeliveryDate(order?: { estimatedDeliveryDate?: string; createdAt?: string } | null): string {
  if (!order) return 'Pending';
  const d = getEstimatedDeliveryDate(order);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getNonDeliveryRefundEligibleDate(order?: { estimatedDeliveryDate?: string; createdAt?: string } | null): Date {
  const estDate = getEstimatedDeliveryDate(order);
  const eligible = new Date(estDate.getTime());
  eligible.setDate(eligible.getDate() + 14); // 2 weeks (14 days) after estimated delivery date
  return eligible;
}

function formatNonDeliveryRefundEligibleDate(order?: { estimatedDeliveryDate?: string; createdAt?: string } | null): string {
  if (!order) return 'Pending';
  const d = getNonDeliveryRefundEligibleDate(order);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isOrderRefundEligible(order?: { orderStatus?: string; estimatedDeliveryDate?: string; createdAt?: string; paymentStatus?: string; refundStatus?: string } | null): boolean {
  if (!order) return false;
  // If refund is already requested or refunded, do not allow requesting again
  if (order.refundStatus === 'Requested' || order.refundStatus === 'Refunded') return false;
  const payStatus = (order.paymentStatus || '').toLowerCase();
  if (payStatus.includes('refund')) return false;

  const status = (order.orderStatus || '').toLowerCase();
  const isDelivered = status.includes('deliver');
  // 1. If package IS delivered: refund is open immediately for buyers (damaged items, returns, etc.)
  if (isDelivered) return true;

  // 2. If package is NOT delivered at estimated delivery time:
  // Count two weeks (14 days) from estimated delivery date. Refund opens only after those two weeks pass.
  const eligibleDate = getNonDeliveryRefundEligibleDate(order);
  return Date.now() >= eligibleDate.getTime();
}

export default function BuyerDashboardPage() {
  const router = useRouter();
  const { user, logout, token, refreshUser, updateProfile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'articles' | 'cart' | 'profile'>('orders');

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
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'ALL' | 'Processing' | 'Shipped' | 'Delivered' | 'Refunded'>('ALL');
  const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([]);
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null);
  const [selectedOrderReceipt, setSelectedOrderReceipt] = useState<Order | null>(null);

  // Refund Modal State for Buyer
  const [refundModalOrder, setRefundModalOrder] = useState<Order | null>(null);
  const [refundReasonOption, setRefundReasonOption] = useState<string>('Package not delivered within estimated delivery time');
  const [refundDetailsInput, setRefundDetailsInput] = useState<string>('');
  const [isSubmittingRefund, setIsSubmittingRefund] = useState<boolean>(false);
  const [refundSuccessMessage, setRefundSuccessMessage] = useState<string | null>(null);
  const [refundErrorMessage, setRefundErrorMessage] = useState<string | null>(null);

  const handleRequestRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundModalOrder) return;
    setIsSubmittingRefund(true);
    setRefundErrorMessage(null);

    try {
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('arboveya_token') : '');
      const res = await fetch(`${API_BASE_URL}/orders/${refundModalOrder.id}/request-refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: 'Bearer ' + authToken } : {})
        },
        body: JSON.stringify({
          reason: refundReasonOption,
          details: refundDetailsInput.trim() || undefined
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Failed to submit refund request.');
      }

      const updated: Order = await res.json();
      setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o));
      setRefundSuccessMessage(`Refund request submitted for Order #${refundModalOrder.payHereOrderId || refundModalOrder.id}. The seller has been notified to review and process your refund.`);
      setRefundModalOrder(null);
      setRefundDetailsInput('');
      setTimeout(() => setRefundSuccessMessage(null), 6000);
    } catch (err: any) {
      setRefundErrorMessage(err?.message || 'Error submitting refund request. Please try again.');
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  const handleContactSellerAboutOrder = async (order: any) => {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('arboveya_token') : '');
    if (!authToken) {
      router.push('/login');
      return;
    }
    try {
      const conv = await startOrderConversation(order.id, undefined, authToken);
      router.push(`/account/messages?id=${conv.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to open conversation for this order.');
    }
  };

  const handleCopyTracking = (tracking: string) => {
    if (!tracking) return;
    navigator.clipboard.writeText(tracking);
    setCopiedTracking(tracking);
    setTimeout(() => {
      setCopiedTracking(null);
    }, 2500);
  };

  const toggleOrderExpanded = (orderId: string) => {
    setExpandedOrderIds(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const handleToggleAllOrders = (currentFiltered: Order[]) => {
    if (expandedOrderIds.length === currentFiltered.length && currentFiltered.length > 0) {
      setExpandedOrderIds([]);
    } else {
      setExpandedOrderIds(currentFiltered.map(o => o.id));
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Status filter
      if (orderStatusFilter !== 'ALL') {
        const status = (order.orderStatus || 'processing').toLowerCase();
        if (orderStatusFilter === 'Delivered' && !status.includes('deliver')) return false;
        if (orderStatusFilter === 'Shipped' && !status.includes('ship')) return false;
        if (orderStatusFilter === 'Processing' && (status.includes('deliver') || status.includes('ship') || status.includes('cancel'))) return false;
        if (orderStatusFilter === 'Refunded' && !status.includes('cancel') && (order.paymentStatus || '').toLowerCase() !== 'refunded' && (order.refundStatus || '').toLowerCase() !== 'requested') return false;
      }

      // Search term filter
      if (orderSearchTerm.trim()) {
        const q = orderSearchTerm.toLowerCase();
        const matchesId = (order.payHereOrderId || order.id || '').toLowerCase().includes(q);
        const matchesTracking = (order.trackingNumber || '').toLowerCase().includes(q);
        const matchesAddress = (order.shippingAddress || '').toLowerCase().includes(q);
        const items = (order.items && order.items.length > 0) 
          ? order.items 
          : (order.orderItems && order.orderItems.length > 0) 
          ? order.orderItems 
          : [];
        const matchesItem = items.some(item => (item.productName || '').toLowerCase().includes(q));
        return matchesId || matchesTracking || matchesAddress || matchesItem;
      }

      return true;
    });
  }, [orders, orderStatusFilter, orderSearchTerm]);

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
  const [reviewModalProduct, setReviewModalProduct] = useState<{
    id: string;
    name: string;
    orderId: string;
    orderRef: string;
  } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Persistent buyer reviews mapped strictly by order: `${orderId}:::${productId}`
  const [orderReviews, setOrderReviews] = useState<Record<string, BuyerReviewRecord>>({});
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
  const [shippingZip, setShippingZip] = useState('');
  const [shippingCountry, setShippingCountry] = useState('United States');
  const [couponInput, setCouponInput] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [buyerReviewsList, setBuyerReviewsList] = useState<BuyerReviewRecord[]>([]);

  // Payment Method & Card Details State
  const [paymentMethod, setPaymentMethod] = useState<'payhere' | 'cod' | 'paypal' | 'card'>('payhere');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const detectCardBrand = (num: string): 'visa' | 'mastercard' | 'amex' | 'discover' | 'generic' => {
    const clean = num.replace(/\D/g, '');
    if (/^4/.test(clean)) return 'visa';
    if (/^(5[1-5]|2[2-7])/.test(clean)) return 'mastercard';
    if (/^3[47]/.test(clean)) return 'amex';
    if (/^(6011|65|64[4-9])/.test(clean)) return 'discover';
    return 'generic';
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setCardExpiry(raw);
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardCvc(raw);
  };

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

          // Local storage fallback for order-to-review mappings
          let localOrderMap: Record<string, string> = {};
          try {
            const raw = localStorage.getItem(`arboveya_order_review_links_${user?.id || 'guest'}`);
            if (raw) localOrderMap = JSON.parse(raw);
          } catch (_) {}

          data.forEach((r: any) => {
            if (r.productId) {
              let extractedOrderId = r.orderId || localOrderMap[r.id] || null;
              let rawComment = r.comment || '';

              const orderTagMatch = rawComment.match(/^\[Order:([^\]]+)\]\s*/i);
              if (orderTagMatch) {
                extractedOrderId = extractedOrderId || orderTagMatch[1].trim();
                rawComment = rawComment.substring(orderTagMatch[0].length).trim();
              }

              // Strip author bracket [Name] if present
              const cleanComment = rawComment.replace(/^\[.*?\]\s*/, '').trim();

              const rec: BuyerReviewRecord = {
                id: r.id,
                orderId: extractedOrderId,
                productId: r.productId,
                productName: r.productName || 'Botanical Product',
                rating: r.rating || 5,
                comment: cleanComment,
                createdAt: r.createdAt || new Date().toISOString()
              };

              list.push(rec);

              if (extractedOrderId) {
                const normKey = `${extractedOrderId.trim().toLowerCase()}:::${r.productId.trim().toLowerCase()}`;
                map[`${extractedOrderId}:::${r.productId}`] = rec;
                map[normKey] = rec;
              }
            }
          });
          setOrderReviews(map);
          setBuyerReviewsList(list);
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
      const uName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim();
      setShippingFullName(uName);
      if (!cardHolder) setCardHolder(uName);
      setShippingEmail(user.email || '');
      if (user.phoneNumber) setShippingPhone(user.phoneNumber);
      if (user.address) setShippingAddress(user.address);
      if (user.nationality) setShippingCountry(user.nationality);
    }
  }, [user]);

  // Profile Update Form State
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileCountry, setProfileCountry] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setProfileFirstName(user.firstName || '');
      setProfileLastName(user.lastName || '');
      setProfilePhone(user.phoneNumber || '');
      setProfileAddress(user.address || '');
      setProfileCountry(user.nationality || '');
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileFirstName.trim()) {
      setProfileErrorMsg('First name is required.');
      return;
    }
    setSavingProfile(true);
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    try {
      await updateProfile({
        firstName: profileFirstName.trim(),
        lastName: profileLastName.trim(),
        phoneNumber: profilePhone.trim(),
        address: profileAddress.trim(),
        nationality: profileCountry.trim()
      });
      setProfileSuccessMsg('Profile updated successfully! Default delivery address updated.');
      setStatusMessage({
        text: 'Your account profile and delivery address were updated successfully!',
        type: 'success'
      });
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSignOut = () => {
    logout('/');
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
      } else if (tabParam === 'profile') {
        setActiveTab('profile');
      }
    }

    const handleSetTab = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail === 'orders' || customEvent.detail === 'articles' || customEvent.detail === 'cart' || customEvent.detail === 'profile') {
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

  // Review Handlers (Explicitly bound to order)
  const handleOpenReview = (productId: string, productName: string, orderId: string, orderRef: string, orderStatus?: string) => {
    if (orderStatus && !orderStatus.toLowerCase().includes('deliver')) {
      alert('Reviews can only be submitted once your order has been delivered.');
      return;
    }
    setReviewModalProduct({ id: productId, name: productName, orderId, orderRef });
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
      const orderId = reviewModalProduct.orderId;
      const orderRef = reviewModalProduct.orderRef;

      // Prefix comment with order tag for persistence across all endpoints
      const commentWithOrderTag = `[Order:${orderId}] ${reviewComment.trim()}`;

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
          orderId: orderId,
          rating: reviewRating,
          comment: commentWithOrderTag
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
        orderId: orderId,
        orderRef: orderRef,
        productId: reviewModalProduct.id,
        productName: reviewModalProduct.name,
        rating: reviewRating,
        comment: reviewComment.trim(),
        createdAt: new Date().toISOString()
      };

      // Persist local order-to-review link in localStorage
      try {
        const storageKey = `arboveya_order_review_links_${user?.id || 'guest'}`;
        const raw = localStorage.getItem(storageKey);
        const map = raw ? JSON.parse(raw) : {};
        map[createdId] = orderId;
        localStorage.setItem(storageKey, JSON.stringify(map));
      } catch (_) {}

      // Update state strictly keyed by order + product
      setOrderReviews(prev => {
        const next = { ...prev };
        next[`${orderId}:::${reviewModalProduct.id}`] = newRecord;
        next[`${orderId.trim().toLowerCase()}:::${reviewModalProduct.id.trim().toLowerCase()}`] = newRecord;
        if (orderRef) {
          next[`${orderRef}:::${reviewModalProduct.id}`] = newRecord;
          next[`${orderRef.trim().toLowerCase()}:::${reviewModalProduct.id.trim().toLowerCase()}`] = newRecord;
        }
        return next;
      });

      setBuyerReviewsList(prev => [newRecord, ...prev.filter(r => !(r.id === newRecord.id || (r.orderId === orderId && r.productId === reviewModalProduct.id)))]);
      setReviewModalProduct(null);
      setStatusMessage({
        text: `Thank you! Your verified customer review for "${reviewModalProduct.name}" (Order #${orderRef}) is now published!`,
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

  const handleOpenViewReview = (record: BuyerReviewRecord) => {
    setViewingReview(record);
  };

  const handleOpenEditReview = (record: BuyerReviewRecord) => {
    setEditingReview(record);
    setEditRating(record.rating);
    setEditComment(record.comment);
  };

  const handleUpdateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    setUpdatingReview(true);
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('arboveya_token') : '') || '';

    try {
      const authorName = user?.fullName || `${user?.firstName || 'Verified'} ${user?.lastName || 'Buyer'}`.trim();
      const cleanComment = editComment.trim().replace(/^\[.*?\]\s*/, '');
      const orderTag = editingReview.orderId ? `[Order:${editingReview.orderId}] ` : '';
      const commentWithOrder = `${orderTag}${cleanComment}`;

      let res = await fetch(`${API_BASE_URL}/reviews/${editingReview.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: 'Bearer ' + authToken } : {})
        },
        body: JSON.stringify({
          rating: editRating,
          comment: commentWithOrder,
          authorName: authorName,
          productId: editingReview.productId,
          orderId: editingReview.orderId
        })
      });

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
            orderId: editingReview.orderId,
            rating: editRating,
            comment: commentWithOrder
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

      const editOrderId = editingReview.orderId;
      if (editOrderId) {
        setOrderReviews(prev => ({
          ...prev,
          [`${editOrderId}:::${editingReview.productId}`]: updatedRecord,
          [`${editOrderId.trim().toLowerCase()}:::${editingReview.productId.trim().toLowerCase()}`]: updatedRecord
        }));
      }

      setBuyerReviewsList(prev => {
        const idx = prev.findIndex(r => r.id === updatedRecord.id || (r.orderId === updatedRecord.orderId && r.productId === updatedRecord.productId));
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

  const handleDeleteReview = async (record: BuyerReviewRecord) => {
    const targetName = record.productName || 'this remedy';
    if (!confirm(`Are you sure you want to delete your review for "${targetName}"?`)) return;

    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('arboveya_token') : '') || '';

    if (record.id) {
      try {
        await fetch(`${API_BASE_URL}/reviews/${record.id}`, {
          method: 'DELETE',
          headers: authToken ? { Authorization: 'Bearer ' + authToken } : {}
        });
      } catch (err) {
        console.warn('Backend review deletion error:', err);
      }
    }

    const recOrderId = record.orderId;
    if (recOrderId) {
      setOrderReviews(prev => {
        const next = { ...prev };
        delete next[`${recOrderId}:::${record.productId}`];
        delete next[`${recOrderId.trim().toLowerCase()}:::${record.productId.trim().toLowerCase()}`];
        return next;
      });
    }

    setBuyerReviewsList(prev => prev.filter(r => r.id !== record.id));
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

      const fullShippingAddress = [
        shippingAddress.trim(),
        shippingCity.trim(),
        shippingZip.trim(),
        shippingCountry.trim()
      ].filter(Boolean).join(', ');

      const payload = {
        customerName: shippingFullName.trim() || user?.fullName || 'Valued Customer',
        customerEmail: shippingEmail.trim() || user?.email || '',
        customerPhone: shippingPhone.trim(),
        country: shippingCountry.trim(),
        shippingAddress: fullShippingAddress,
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
        const brand = cardNumber ? detectCardBrand(cardNumber) : 'VISA';
        const cardLast4 = cardNumber ? cardNumber.replace(/\s+/g, '').slice(-4) : 'PAYH';

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

        // Confirm Payment with PayHere payment reference
        try {
          await fetch(`${API_BASE_URL}/orders/${data.id}/confirm-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(authToken ? { Authorization: 'Bearer ' + authToken } : {})
            },
            body: JSON.stringify({ 
              payHereOrderId: data.payHereOrderId, 
              paymentId: `PAYHERE-${brand.toUpperCase()}-${cardLast4}-${Date.now()}` 
            })
          });
        } catch (e) {
          console.warn("Backend payment confirm notice:", e);
        }

        // If PayHere SDK popup is active on window, trigger official PayHere payment modal
        if (typeof window !== 'undefined' && (window as any).payhere && data.payHereDetails?.hash) {
          try {
            const pDetails = data.payHereDetails;
            (window as any).payhere.startPayment({
              sandbox: pDetails.sandbox,
              merchant_id: pDetails.merchantId,
              return_url: undefined,
              cancel_url: undefined,
              notify_url: pDetails.notifyUrl,
              order_id: pDetails.orderId,
              items: pDetails.items,
              amount: Number(pDetails.amount).toFixed(2),
              currency: pDetails.currency || 'USD',
              hash: pDetails.hash,
              first_name: pDetails.firstName,
              last_name: pDetails.lastName,
              email: pDetails.email,
              phone: pDetails.phone,
              address: pDetails.address,
              city: pDetails.city,
              country: pDetails.country
            });
          } catch (pe) {
            console.warn("PayHere startPayment notice:", pe);
          }
        }

        orderRecord = {
          ...data,
          customerName: data.customerName || payload.customerName,
          shippingAddress: data.shippingAddress || payload.shippingAddress,
          totalAmount: data.totalAmount || total,
          orderStatus: data.orderStatus || 'Processing',
          paymentStatus: 'Paid',
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
      
      const brand = detectCardBrand(cardNumber);
      const cardLast4 = cardNumber.replace(/\s+/g, '').slice(-4);

      setStatusMessage({
        text: `Thank you! Your order #${orderRecord.payHereOrderId || orderRecord.id} has been paid via PayHere Gateway (${brand.toUpperCase()} ending in •••• ${cardLast4}) and is now processing.`,
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
              <div className="py-16 text-center text-stone-400 text-xs flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-[#2E4D38]" />
                <span>Loading your orders...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-16 text-center text-stone-400">
                <Package className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                <p className="text-sm font-medium text-stone-700">No orders placed yet</p>
                <p className="text-xs text-stone-400 mt-1">Browse our botanical apothecary and place your first natural herbal order.</p>
                <Link href="/shop" className="text-xs text-[#2E4D38] font-bold hover:underline mt-3 inline-block">
                  Explore Herbal Catalog &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Search, Filter & Quick Toggle Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-stone-50/80 rounded-xl border border-stone-200/80">
                  <div className="flex items-center gap-2 flex-1 sm:flex-none sm:w-60 max-w-xs">
                    <div className="relative w-full">
                      <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        value={orderSearchTerm}
                        onChange={(e) => setOrderSearchTerm(e.target.value)}
                        placeholder="Search orders, tracking..."
                        className="w-full pl-8 pr-7 py-1 rounded-lg bg-white border border-stone-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#2E4D38]"
                      />
                      {orderSearchTerm && (
                        <button
                          onClick={() => setOrderSearchTerm('')}
                          className="absolute right-2 top-1.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status Filter Buttons */}
                    <div className="flex items-center bg-white p-0.5 rounded-lg border border-stone-200 text-[11px] font-semibold">
                      {(['ALL', 'Processing', 'Shipped', 'Delivered', 'Refunded'] as const).map((filterKey) => (
                        <button
                          key={filterKey}
                          onClick={() => setOrderStatusFilter(filterKey)}
                          className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                            orderStatusFilter === filterKey
                              ? 'bg-[#2E4D38] text-white shadow-2xs'
                              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                          }`}
                        >
                          {filterKey === 'ALL'
                            ? `All (${orders.length})`
                            : filterKey === 'Refunded'
                            ? `Refunded (${orders.filter(o => (o.orderStatus || '').toLowerCase().includes('cancel') || (o.paymentStatus || '').toLowerCase() === 'refunded' || (o.refundStatus || '').toLowerCase() === 'requested').length})`
                            : filterKey}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {refundSuccessMessage && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{refundSuccessMessage}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRefundSuccessMessage(null)}
                      className="p-1 text-emerald-700 hover:text-emerald-900 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {filteredOrders.length === 0 ? (
                  <div className="py-12 text-center text-stone-400 bg-stone-50/50 rounded-2xl border border-stone-200">
                    <p className="text-xs font-medium text-stone-600">No orders match your filter criteria.</p>
                    <button
                      onClick={() => { setOrderSearchTerm(''); setOrderStatusFilter('ALL'); }}
                      className="text-xs text-[#2E4D38] font-bold hover:underline mt-1 cursor-pointer"
                    >
                      Clear search filters
                    </button>
                  </div>
                ) : (
                  /* ORDERS TABLE */
                  <div className="rounded-2xl border border-stone-200 overflow-hidden shadow-2xs bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse min-w-[760px]">
                        <thead>
                          <tr className="bg-[#f7f9f7] border-b border-stone-200 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                            <th className="py-3.5 px-4 font-semibold">Order Ref & Date</th>
                            <th className="py-3.5 px-4 font-semibold">Items</th>
                            <th className="py-3.5 px-4 font-semibold">Shipment & Delivery</th>
                            <th className="py-3.5 px-4 font-semibold">Total</th>
                            <th className="py-3.5 px-4 font-semibold">Fulfillment</th>
                            <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200/80">
                          {filteredOrders.map((order) => {
                            const isExpanded = expandedOrderIds.includes(order.id);
                            const itemsList = (order.items && order.items.length > 0)
                              ? order.items
                              : (order.orderItems && order.orderItems.length > 0)
                              ? order.orderItems
                              : [];
                            const totalItemCount = itemsList.reduce((acc, it) => acc + (it.quantity || 1), 0);

                            return (
                              <React.Fragment key={order.id}>
                                {/* Primary Order Row */}
                                <tr className={`hover:bg-[#fbfcfb] transition ${isExpanded ? 'bg-[#f8faf8]' : 'bg-white'}`}>
                                  {/* Col 1: Order Reference & Date */}
                                  <td className="py-3.5 px-4 align-top">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => toggleOrderExpanded(order.id)}
                                          className="font-mono text-xs font-bold text-stone-900 hover:text-[#2E4D38] transition flex items-center gap-1 group text-left cursor-pointer"
                                        >
                                          <span>{order.payHereOrderId || order.id}</span>
                                        </button>
                                      </div>
                                      <div className="flex items-center gap-1 text-[11px] text-stone-500">
                                        <Clock className="w-3 h-3 text-stone-400 flex-shrink-0" />
                                        <span>
                                          {new Date(order.createdAt).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                          })}
                                        </span>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Col 2: Items Summary */}
                                   <td className="py-3.5 px-4 align-top max-w-[260px]">
                                     <div className="space-y-1.5">
                                       <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2E4D38] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                         <Package className="w-3 h-3" />
                                         <span>{totalItemCount || itemsList.length} item{totalItemCount === 1 ? '' : 's'}</span>
                                       </span>
                                       {itemsList.length > 0 ? (
                                         <div className="space-y-1">
                                           {itemsList.map((item, idx) => (
                                             <div key={item.id || idx} className="text-xs text-stone-800 leading-snug">
                                               {item.productId ? (
                                                 <Link 
                                                   href={`/shop/${item.productId}`}
                                                   className="font-medium text-stone-900 hover:text-[#2E4D38] hover:underline"
                                                 >
                                                   {item.productName}
                                                 </Link>
                                               ) : (
                                                 <span className="font-medium text-stone-900">{item.productName}</span>
                                               )}
                                               <span className="text-stone-500 text-[11px] ml-1.5">
                                                 (Qty: {item.quantity}{item.unitPrice ? ` · $${item.unitPrice.toFixed(2)}` : ''})
                                               </span>
                                             </div>
                                           ))}
                                         </div>
                                       ) : (
                                         <div className="text-xs text-stone-500">Standard remedy package</div>
                                       )}
                                     </div>
                                   </td>

                                   {/* Col 3: Shipment & Delivery */}
                                  <td className="py-3.5 px-4 align-top max-w-[220px]">
                                    <div className="space-y-1.5">
                                      {order.trackingNumber ? (
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-mono text-[11px] font-bold text-[#1c3f24] bg-[#edf5ee] px-2 py-0.5 rounded border border-[#c5dec7]">
                                            {order.trackingNumber}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => handleCopyTracking(order.trackingNumber!)}
                                            className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                                            title="Copy tracking number"
                                          >
                                            {copiedTracking === order.trackingNumber ? (
                                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                                            ) : (
                                              <Copy className="w-3.5 h-3.5" />
                                            )}
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="text-[11px] text-stone-500 flex items-center gap-1">
                                          <Truck className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                                          <span>{order.shippingMethod || 'Standard Delivery'}</span>
                                        </div>
                                      )}

                                      {/* Estimated Delivery Date display */}
                                      <div className="flex items-center gap-1 text-[11px] text-emerald-800 font-semibold bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-100">
                                        <Calendar className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                                        <span>
                                          Est: {formatEstimatedDeliveryDate(order)}
                                        </span>
                                      </div>

                                      {/* Refund Status Flag if active */}
                                      {order.refundStatus === 'Requested' && (
                                        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                          <AlertCircle className="w-3 h-3 text-amber-600" />
                                          <span>Refund Requested</span>
                                        </div>
                                      )}

                                      {order.refundStatus === 'Refunded' && (
                                        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                          <CheckCircle2 className="w-3 h-3 text-rose-600" />
                                          <span>Refunded via PayHere</span>
                                        </div>
                                      )}

                                      {order.shippingAddress && (
                                        <div className="text-[11px] text-stone-500 truncate" title={order.shippingAddress}>
                                          {order.shippingAddress}
                                        </div>
                                      )}
                                    </div>
                                  </td>

                                  {/* Col 4: Total & Payment */}
                                  <td className="py-3.5 px-4 align-top">
                                    <div className="space-y-1">
                                      <div className="font-bold text-sm text-[#2E4D38]">
                                        ${order.totalAmount?.toFixed(2) || '0.00'}
                                      </div>
                                      <div>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                          (order.paymentStatus || 'Paid').toLowerCase().includes('refund')
                                            ? 'bg-rose-100 text-rose-800'
                                            : (order.paymentStatus || 'Paid').toLowerCase().includes('paid')
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : 'bg-amber-100 text-amber-800'
                                        }`}>
                                          {order.paymentStatus || 'Paid'}
                                        </span>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Col 5: Fulfillment Status */}
                                  <td className="py-3.5 px-4 align-top">
                                    {(() => {
                                      const st = (order.orderStatus || 'Processing').toLowerCase();
                                      if (st.includes('deliver')) {
                                        return (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                            <span>Delivered</span>
                                          </span>
                                        );
                                      }
                                      if (st.includes('ship')) {
                                        return (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                            <Truck className="w-3 h-3 text-blue-600" />
                                            <span>Shipped</span>
                                          </span>
                                        );
                                      }
                                      if (st.includes('cancel')) {
                                        return (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                            <X className="w-3 h-3 text-rose-600" />
                                            <span>Cancelled</span>
                                          </span>
                                        );
                                      }
                                      return (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                          <Clock className="w-3 h-3 text-amber-600" />
                                          <span>Processing</span>
                                        </span>
                                      );
                                    })()}
                                  </td>

                                  {/* Col 6: Actions */}
                                   <td className="py-3.5 px-4 align-top text-right">
                                     <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                       {order.refundStatus === 'Requested' ? (
                                         <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                                           <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                           <span>Refund Pending</span>
                                         </span>
                                       ) : order.refundStatus === 'Refunded' || (order.paymentStatus || '').toLowerCase().includes('refund') ? (
                                         <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                                           <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
                                           <span>Refunded (PayHere)</span>
                                         </span>
                                       ) : isOrderRefundEligible(order) ? (
                                         <button
                                           type="button"
                                           onClick={() => {
                                             setRefundModalOrder(order);
                                             setRefundReasonOption(
                                               (order.orderStatus || '').toLowerCase().includes('deliver')
                                                 ? 'Damaged or defective items received'
                                                 : 'Package not delivered within estimated delivery time (14+ days overdue)'
                                             );
                                             setRefundDetailsInput('');
                                             setRefundErrorMessage(null);
                                           }}
                                           className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition cursor-pointer shadow-2xs"
                                           title="Request Refund"
                                         >
                                           <RotateCcw className="w-3 h-3 text-amber-700" />
                                           <span>Request Refund</span>
                                         </button>
                                       ) : !((order.orderStatus || '').toLowerCase().includes('deliver')) && (order.paymentStatus || '').toLowerCase() === 'paid' && !(order.orderStatus || '').toLowerCase().includes('cancel') ? (
                                         <span
                                           className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-600 bg-stone-100 px-2 py-1 rounded-lg border border-stone-200"
                                           title={`Per Arboveya Guarantee, refund requests for undelivered packages open 2 weeks after estimated delivery date (${formatNonDeliveryRefundEligibleDate(order)}).`}
                                         >
                                           <Clock className="w-3 h-3 text-stone-400" />
                                           <span>Refund opens {formatNonDeliveryRefundEligibleDate(order)}</span>
                                         </span>
                                       ) : null}

                                       <button
                                          type="button"
                                          onClick={() => handleContactSellerAboutOrder(order)}
                                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#bcd2bf] bg-[#edf5ee] hover:bg-[#dcebdd] text-[#1c3f24] font-bold text-xs transition cursor-pointer shadow-2xs"
                                          title="Contact Seller About This Order"
                                        >
                                          <MessageSquare className="w-3.5 h-3.5 text-[#24492d]" />
                                          <span>Contact Seller</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setSelectedOrderReceipt(order)}
                                          className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 hover:text-stone-900 transition cursor-pointer"
                                          title="View Printable Receipt"
                                        >
                                          <FileText className="w-3.5 h-3.5" />
                                        </button>
                                     </div>
                                   </td>
                                 </tr>
                                 {isExpanded && (
                                   <tr className="bg-[#f7faf7] border-b border-stone-200">
                                     <td colSpan={6} className="py-4 px-6">
                                       <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-3">
                                         <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 flex-wrap gap-2">
                                           <div className="flex items-center gap-2">
                                             <Package className="w-4 h-4 text-[#2E4D38]" />
                                             <span className="font-bold text-xs text-stone-900">
                                               Order Items ({itemsList.length} remedy product{itemsList.length === 1 ? '' : 's'} · {totalItemCount} unit{totalItemCount === 1 ? '' : 's'} total)
                                             </span>
                                           </div>
                                           <div className="text-[11px] text-stone-500 font-mono">
                                             Order Ref: <strong className="text-stone-800">{order.payHereOrderId || order.id}</strong>
                                           </div>
                                         </div>

                                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                           {itemsList.map((item, itIdx) => (
                                             <div key={item.id || itIdx} className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100 hover:border-emerald-200 transition">
                                               <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white border border-stone-200 flex-shrink-0">
                                                 <Image
                                                   src={resolveBackendImageUrl(item.productImageUrl, '/images/gotu-kola-tea.jpg')}
                                                   alt={item.productName || 'Remedy item'}
                                                   fill
                                                   sizes="48px"
                                                   className="object-cover"
                                                 />
                                               </div>
                                               <div className="min-w-0 flex-1 text-xs space-y-0.5">
                                                 <div className="font-semibold text-stone-900 truncate" title={item.productName}>
                                                   {item.productName}
                                                 </div>
                                                 <div className="text-stone-500 text-[11px]">
                                                   Quantity: <strong className="text-stone-800">{item.quantity}</strong> {item.unitPrice ? `· $${item.unitPrice.toFixed(2)} each` : ''}
                                                 </div>
                                                 <div className="font-bold text-emerald-800 text-[11px]">
                                                   Total: ${((item.quantity || 1) * (item.unitPrice || 0)).toFixed(2)}
                                                 </div>
                                               </div>
                                             </div>
                                           ))}
                                         </div>

                                         <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs flex-wrap gap-2 text-stone-600">
                                           <div className="flex items-center gap-2">
                                             <Truck className="w-3.5 h-3.5 text-stone-400" />
                                             <span>Shipping: <strong>{order.shippingMethod || 'Standard Delivery'}</strong></span>
                                             {order.trackingNumber && (
                                               <span className="font-mono text-[11px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                                                 Tracking #{order.trackingNumber}
                                               </span>
                                             )}
                                           </div>
                                           <div className="font-bold text-stone-900">
                                             Order Total: <span className="text-[#2E4D38] font-serif text-sm">${order.totalAmount?.toFixed(2) || '0.00'}</span>
                                           </div>
                                         </div>
                                       </div>
                                     </td>
                                   </tr>
                                 )}
                               </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 
            Dedicated Section: My Published Reviews & Community Feedback
            Commented out per user request:
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

                      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/shop/${rev.productId}`}
                            className="text-[11px] font-medium text-[#2E4D38] hover:underline flex items-center gap-1"
                          >
                            <span>View in Shop</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                          {rev.orderId && (
                            <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                              Order #{rev.orderRef || rev.orderId}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenViewReview(rev)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition cursor-pointer"
                            title="View full review"
                          >
                            <Eye className="w-3 h-3 text-stone-500" />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditReview(rev)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#2E4D38]/30 bg-emerald-50 hover:bg-emerald-100 text-[#2E4D38] text-xs font-semibold transition cursor-pointer"
                            title="Edit your review"
                          >
                            <Edit3 className="w-3 h-3 text-[#2E4D38]" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteReview(rev)}
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
            */}
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
                            placeholder="e.g. +1 555 123 4567 or 077 123 4567"
                            className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                            Country *
                          </label>
                          <input
                            type="text"
                            required
                            value={shippingCountry}
                            onChange={(e) => setShippingCountry(e.target.value)}
                            placeholder="e.g. United States, Sri Lanka"
                            className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                            City / District *
                          </label>
                          <input
                            type="text"
                            required
                            value={shippingCity}
                            onChange={(e) => setShippingCity(e.target.value)}
                            placeholder="e.g. Austin, London, Colombo"
                            className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                            ZIP / Postal Code *
                          </label>
                          <input
                            type="text"
                            required
                            value={shippingZip}
                            onChange={(e) => setShippingZip(e.target.value)}
                            placeholder="e.g. 78701 or 00100"
                            className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                          Delivery Street Address (1st Lane, 2nd Lane) *
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          placeholder="e.g. 1st Lane, 2nd Lane, Suite / Apt, Zip Code"
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
                          <span>I agree to Arboveya quality terms & dispatch conditions.</span>
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
                      <span>
                        {placingOrder 
                          ? 'PROCESSING TRANSACTION...' 
                          : `Pay $${total.toFixed(2)}`}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: BUYER PROFILE & ACCOUNT SETTINGS */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#24492d] text-white flex items-center justify-center font-bold text-lg shadow-xs">
                    {profileFirstName ? profileFirstName.charAt(0).toUpperCase() : (user?.firstName?.charAt(0).toUpperCase() || 'B')}
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-stone-900">
                      My Customer Profile
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Manage your personal info and default shipping delivery address.
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Messages */}
              {profileErrorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{profileErrorMsg}</span>
                </div>
              )}

              {profileSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                  <span className="font-semibold">{profileSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={profileFirstName}
                        onChange={(e) => setProfileFirstName(e.target.value)}
                        placeholder="e.g. Eleanor"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                      />
                      <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileLastName}
                      onChange={(e) => setProfileLastName(e.target.value)}
                      placeholder="e.g. Vance"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Email Address <span className="text-stone-400 font-normal">(Account Login)</span>
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-500 text-sm cursor-not-allowed select-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Contact Phone Number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="e.g. +1 (555) 019-2834"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                      />
                      <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Default Delivery / Shipping Address
                    </label>
                    <div className="relative">
                      <textarea
                        rows={2}
                        value={profileAddress}
                        onChange={(e) => setProfileAddress(e.target.value)}
                        placeholder="e.g. 78 Gardenia Boulevard, Suite 300, New York, NY 10001"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38] resize-none"
                      />
                      <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Country / Nationality
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={profileCountry}
                        onChange={(e) => setProfileCountry(e.target.value)}
                        placeholder="e.g. United States"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                      />
                      <Globe className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-6 py-2.5 rounded-xl bg-[#2E4D38] hover:bg-[#233d2c] text-white text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {savingProfile ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving Profile...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Save Profile Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
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

            <div className="text-xs text-stone-600 mb-4 flex items-center gap-2 flex-wrap">
              <span>Reviewing: <strong className="text-stone-900 font-semibold">{reviewModalProduct.name}</strong></span>
              {reviewModalProduct.orderRef && (
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-[#2E4D38] border border-emerald-200 text-[11px] font-semibold">
                  Order #{reviewModalProduct.orderRef}
                </span>
              )}
            </div>

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
                      handleOpenEditReview(v);
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

      {/* MODAL: ORDER RECEIPT / INVOICE VIEW */}
      {selectedOrderReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Arboveya
                </span>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900 mt-1">
                  Order Invoice & Receipt
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderReceipt(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Order Reference</span>
                <span className="font-mono font-bold text-stone-900 text-sm">{selectedOrderReceipt.payHereOrderId || selectedOrderReceipt.id}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Date Placed</span>
                <span className="text-stone-800">{new Date(selectedOrderReceipt.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Payment Status</span>
                <span className="text-emerald-700 font-bold uppercase">{selectedOrderReceipt.paymentStatus || 'Paid'}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Fulfillment Status</span>
                <span className="text-stone-800 font-semibold">{selectedOrderReceipt.orderStatus || 'Processing'}</span>
              </div>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-1">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Delivery Address</span>
              <p className="font-semibold text-stone-900">{selectedOrderReceipt.customerName || user?.fullName || 'Customer'}</p>
              <p className="text-stone-600">{selectedOrderReceipt.shippingAddress || 'Address on file'}</p>
            </div>

            {/* Itemized Table */}
            <div className="rounded-xl border border-stone-200 overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] font-bold border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Price</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {((selectedOrderReceipt.items && selectedOrderReceipt.items.length > 0)
                    ? selectedOrderReceipt.items
                    : (selectedOrderReceipt.orderItems && selectedOrderReceipt.orderItems.length > 0)
                    ? selectedOrderReceipt.orderItems
                    : []).map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 px-3 font-medium text-stone-900">{item.productName}</td>
                      <td className="py-2.5 px-3 text-center text-stone-600">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right text-stone-600">${item.unitPrice?.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-stone-900">${((item.totalPrice || (item.unitPrice * item.quantity)) || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Shipping Method:</span>
                <span>{selectedOrderReceipt.shippingMethod || 'Standard Delivery'} ({selectedOrderReceipt.shippingCost === 0 || !selectedOrderReceipt.shippingCost ? 'FREE' : `$${selectedOrderReceipt.shippingCost.toFixed(2)}`})</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#1c3f24] border-t border-stone-200 pt-2">
                <span>Total Paid:</span>
                <span>${selectedOrderReceipt.totalAmount?.toFixed(2) || '0.00'}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedOrderReceipt(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2E4D38] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#253f2e] transition shadow-2xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: BUYER REQUEST REFUND ================= */}
      {refundModalOrder && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmittingRefund) setRefundModalOrder(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-amber-600" />
                  <span>Request Order Refund</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Order #{refundModalOrder.payHereOrderId || refundModalOrder.id} &bull; Total: <strong className="text-stone-800">${refundModalOrder.totalAmount?.toFixed(2)}</strong>
                </p>
              </div>
              <button
                type="button"
                disabled={isSubmittingRefund}
                onClick={() => setRefundModalOrder(null)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Delivery & Protection Status Info */}
            <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-2 text-xs text-amber-900">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Arboveya Buyer Protection Policy</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                {(refundModalOrder.orderStatus || '').toLowerCase().includes('deliver')
                  ? 'Your order is recorded as delivered. If your items arrived damaged, defective, or incorrect, you can request a return or refund below.'
                  : 'Your package is past its estimated delivery date and has exceeded the mandatory 2-week (14 days) transit grace period. You are now fully eligible to submit a refund request for non-delivery.'}
              </p>
              <div className="pt-1.5 border-t border-amber-200/60 space-y-1 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-700">Estimated Delivery Date:</span>
                  <span className="font-bold text-[#1c3f24]">
                    {formatEstimatedDeliveryDate(refundModalOrder)}
                  </span>
                </div>
                {!((refundModalOrder.orderStatus || '').toLowerCase().includes('deliver')) && (
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-700">Refund Window Opened:</span>
                    <span className="font-bold text-amber-800">
                      {formatNonDeliveryRefundEligibleDate(refundModalOrder)} (2 weeks post-estimate)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {refundErrorMessage && (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{refundErrorMessage}</span>
              </div>
            )}

            <form onSubmit={handleRequestRefund} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                  Select Reason for Refund *
                </label>
                <div className="space-y-2">
                  {[
                    'Package not delivered within estimated delivery time',
                    'Product arrived damaged or defective',
                    'Wrong botanical item received',
                    'Package lost or tracking stopped updating',
                    'Other return request'
                  ].map((option) => (
                    <label
                      key={option}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer text-xs transition ${
                        refundReasonOption === option
                          ? 'border-[#2E4D38] bg-emerald-50/50 font-semibold text-[#1c3f24]'
                          : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="refundReason"
                        value={option}
                        checked={refundReasonOption === option}
                        onChange={(e) => setRefundReasonOption(e.target.value)}
                        className="mt-0.5 text-[#2E4D38] focus:ring-[#2E4D38]"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Additional Details / Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={refundDetailsInput}
                  onChange={(e) => setRefundDetailsInput(e.target.value)}
                  placeholder="Provide any additional details regarding your order or return condition..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#2E4D38] focus:ring-1 focus:ring-[#2E4D38]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isSubmittingRefund}
                  onClick={() => setRefundModalOrder(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRefund}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {isSubmittingRefund ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Confirm &amp; Request Refund</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
