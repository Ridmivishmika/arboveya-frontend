'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BlogPost, Category, WellnessNeed, CreateProductInput, UpdateProductInput } from '@/types';
import { getCategories, getWellnessNeeds, uploadBlogImage, API_BASE_URL, resolveBackendImageUrl } from '@/lib/api';
import ProductModal from '@/components/admin/ProductModal';
import {
  Package,
  ShoppingBag,
  Plus,
  Store,
  ShieldAlert,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Upload,
  RefreshCw,
  Sparkles,
  ArrowRight,
  PenTool,
  UserPlus,
  LogIn,
  Layers,
  Leaf,
  LogOut,
  BookOpen,
  Edit3,
  Trash2,
  FileText,
  Eye,
  X,
  Info,
  Truck,
  Building2,
  CreditCard,
  Wallet,
  Check
} from 'lucide-react';

interface SellerOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface SellerOrder {
  id: string;
  payHereOrderId?: string;
  customerName?: string;
  customerEmail?: string;
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
  orderItems?: SellerOrderItem[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
  categoryId?: string;
  categoryName?: string;
  wellnessNeedId?: string;
  wellnessNeedName?: string;
  wellnessNeed?: string;
  shippingOptions?: string;
  imageUrl?: string;
  galleryImages?: string;
  weight?: string;
  description?: string;
  ingredients?: string;
  howToUse?: string;
  keyBenefits?: string;
  approvalStatus: string;
  adminFeedback?: string;
  countryOfOrigin?: string;
  condition?: string;
  manufactureDate?: string;
  expiryDate?: string;
  specifications?: string;
  shippingMethod?: string;
  estimatedDeliveryTime?: string;
  isFreeShipping?: boolean;
  shippingCost?: number;
  handlingTime?: string;
  returnPolicy?: string;
  createdAt?: string;
  variants?: import('@/types').ProductVariant[];
}

export default function SellerDashboardPage() {
  const router = useRouter();
  const { user, logout, updateUser, token, refreshUser, loading: authLoading } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState<'products' | 'articles' | 'orders' | 'payouts'>('products');
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Seller Bank Details State
  const [bankNameInput, setBankNameInput] = useState('');
  const [bankAccountNameInput, setBankAccountNameInput] = useState('');
  const [bankAccountNumberInput, setBankAccountNumberInput] = useState('');
  const [bankBranchInput, setBankBranchInput] = useState('');
  const [bankRoutingCodeInput, setBankRoutingCodeInput] = useState('');
  const [savingBankDetails, setSavingBankDetails] = useState(false);
  const [bankSuccessMsg, setBankSuccessMsg] = useState<string | null>(null);
  const [bankErrorMsg, setBankErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setBankNameInput(user.bankName || '');
      setBankAccountNameInput(user.bankAccountName || '');
      setBankAccountNumberInput(user.bankAccountNumber || '');
      setBankBranchInput(user.bankBranch || '');
      setBankRoutingCodeInput(user.bankRoutingCode || '');
    }
  }, [user]);

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBankDetails(true);
    setBankSuccessMsg(null);
    setBankErrorMsg(null);
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('arboveya_token') : '') || '';

    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: 'Bearer ' + authToken } : {})
        },
        body: JSON.stringify({
          bankName: bankNameInput.trim(),
          bankAccountName: bankAccountNameInput.trim(),
          bankAccountNumber: bankAccountNumberInput.trim(),
          bankBranch: bankBranchInput.trim(),
          bankRoutingCode: bankRoutingCodeInput.trim()
        })
      });

      if (res.ok) {
        const updated = await res.json();
        updateUser({
          bankName: updated.bankName || bankNameInput.trim(),
          bankAccountName: updated.bankAccountName || bankAccountNameInput.trim(),
          bankAccountNumber: updated.bankAccountNumber || bankAccountNumberInput.trim(),
          bankBranch: updated.bankBranch || bankBranchInput.trim(),
          bankRoutingCode: updated.bankRoutingCode || bankRoutingCodeInput.trim()
        });
        setBankSuccessMsg('Bank account details saved successfully! Future order revenues will be transferred to this account.');
      } else {
        const err = await res.json().catch(() => ({}));
        setBankErrorMsg(err.message || 'Failed to update bank account details.');
      }
    } catch (err: any) {
      setBankErrorMsg(err.message || 'Network error saving bank details.');
    } finally {
      setSavingBankDetails(false);
    }
  };

  // Classifications State (Categories & Wellness Needs)
  const [categories, setCategories] = useState<Category[]>([]);
  const [wellnessNeeds, setWellnessNeeds] = useState<WellnessNeed[]>([]);

  // Product State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // View & Edit Product States
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Order Tracking States
  const [editingTrackingOrderId, setEditingTrackingOrderId] = useState<string | null>(null);
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [carrierInput, setCarrierInput] = useState('DHL Express');
  const [savingTracking, setSavingTracking] = useState(false);
  const [trackingSuccessMsg, setTrackingSuccessMsg] = useState<string | null>(null);

  // Blog State
  const [myBlogs, setMyBlogs] = useState<BlogPost[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [showCreateBlogModal, setShowCreateBlogModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [readingBlog, setReadingBlog] = useState<BlogPost | null>(null);
  const [submittingBlog, setSubmittingBlog] = useState(false);
  const [blogSuccessMsg, setBlogSuccessMsg] = useState<string | null>(null);

  // Blog Form State
  const [blogTitle, setBlogTitle] = useState('');
  const [blogCategory, setBlogCategory] = useState('Wellness');
  const [blogImageUrl, setBlogImageUrl] = useState('/images/blog-moringa.jpg');
  const [blogContent, setBlogContent] = useState('');
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
      const authToken = (typeof window !== 'undefined' ? localStorage.getItem('arboveya_token') : '') || '';
      const url = await uploadBlogImage(file, authToken);
      setBlogImageUrl(url);
    } catch (err: any) {
      setBlogUploadError(err.message || 'Failed to upload blog image.');
    } finally {
      setUploadingBlogImage(false);
      if (blogFileInputRef.current) blogFileInputRef.current.value = '';
    }
  };

  const isApproved = user?.isSellerApproved ?? true;

  const handleSignOut = () => {
    logout();
    window.location.replace('/');
  };

  const fetchSellerProducts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/products/seller/my-products?sellerId=${user?.id || ''}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.warn('Backend unavailable:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerOrders = async () => {
    setLoadingOrders(true);
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('arboveya_token') : '') || '';
    try {
      const res = await fetch(`${API_BASE_URL}/orders/seller-orders?sellerId=${user?.id || ''}`, {
        headers: authToken ? { Authorization: 'Bearer ' + authToken } : {},
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.warn('Failed to load seller orders from API:', err);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchMyBlogs = async () => {
    const authToken = token || localStorage.getItem('arboveya_token') || '';
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
      console.warn('Failed to fetch seller blogs:', err);
    } finally {
      setLoadingBlogs(false);
    }
  };

  const syncSellerApprovalStatus = async () => {
    if (!user) return;
    try {
      await refreshUser?.();
      const res = await fetch(`${API_BASE_URL}/admin/sellers`);
      if (res.ok) {
        const sellers = await res.json();
        const me = sellers.find((s: any) =>
          (user.id && s.id === user.id) ||
          (s.email && user.email && s.email.toLowerCase() === user.email.toLowerCase())
        );
        if (me && typeof me.isSellerApproved === 'boolean') {
          if (me.isSellerApproved !== user.isSellerApproved) {
            updateUser({ isSellerApproved: me.isSellerApproved });
          }
        }
      }
    } catch (err) {
      console.warn('Could not sync seller status:', err);
    }
  };

  const loadClassifications = async () => {
    try {
      const [cats, needs] = await Promise.all([
        getCategories(),
        getWellnessNeeds()
      ]);
      setCategories(cats || []);
      setWellnessNeeds(needs || []);
    } catch (err) {
      console.warn('Failed to load classifications in seller dashboard:', err);
    }
  };

  useEffect(() => {
    loadClassifications();
  }, []);

  useEffect(() => {
    if (user) {
      fetchSellerProducts();
      fetchMyBlogs();
      fetchSellerOrders();
    } else {
      setLoading(false);
      setLoadingBlogs(false);
    }
  }, [user?.id]);

  const handleActivateSeller = () => {
    updateUser({
      role: 'Seller',
      isSellerApproved: true
    });
  };


  // Sync tab with Navbar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'articles') {
        setActiveTab('articles');
      } else if (tabParam === 'orders') {
        setActiveTab('orders');
      } else if (tabParam === 'products') {
        setActiveTab('products');
      } else if (tabParam === 'payouts') {
        setActiveTab('payouts');
      }
    }

    const handleSetTab = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail === 'products' || customEvent.detail === 'articles' || customEvent.detail === 'orders' || customEvent.detail === 'payouts') {
        setActiveTab(customEvent.detail);
      }
    };

    window.addEventListener('arboveya:set-seller-tab', handleSetTab as EventListener);
    return () => {
      window.removeEventListener('arboveya:set-seller-tab', handleSetTab as EventListener);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('arboveya:seller-tab-changed', { detail: activeTab }));
  }, [activeTab]);

  // Open Product View Modal
  const handleOpenViewProduct = (p: Product) => {
    setViewingProduct(p);
  };

  // Open Product Edit Modal
  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
  };

  // Submit Product (Create or Edit)
  const handleSaveProduct = async (input: CreateProductInput | UpdateProductInput) => {
    setSubmitting(true);
    setSuccessMsg(null);

    // Build variants: ensure price and stockQuantity are proper numbers
    const cleanedVariants = (input.variants || [])
      .filter(v => v.weight && v.weight.trim() !== '')
      .map(v => ({
        id: v.id,
        weight: v.weight.trim(),
        price: Number(v.price),
        stockQuantity: Number(v.stockQuantity),
      }));

    // Derive base price & stock from lowest-price variant (matches backend logic)
    const sortedVariants = [...cleanedVariants].sort((a, b) => a.price - b.price);
    const lowestVariant = sortedVariants[0];
    const totalStock = cleanedVariants.reduce((sum, v) => sum + v.stockQuantity, 0);

    const payload = {
      name: input.name,
      price: cleanedVariants.length > 0 ? lowestVariant.price : (input.price ?? 0),
      stockQuantity: cleanedVariants.length > 0 ? totalStock : (input.stockQuantity ?? 0),
      categoryId: input.categoryId || undefined,
      wellnessNeedId: input.wellnessNeedId || undefined,
      weight: cleanedVariants.length > 0 ? lowestVariant.weight : (input.weight || undefined),
      imageUrl: input.imageUrl || undefined,
      galleryImages: input.galleryImages || undefined,
      description: input.description || undefined,
      ingredients: input.ingredients || undefined,
      howToUse: input.howToUse || undefined,
      keyBenefits: input.keyBenefits || undefined,
      countryOfOrigin: input.countryOfOrigin || undefined,
      condition: input.condition || undefined,
      manufactureDate: input.manufactureDate || undefined,
      expiryDate: input.expiryDate || undefined,
      specifications: input.specifications || undefined,
      shippingMethod: input.shippingMethod || undefined,
      estimatedDeliveryTime: input.estimatedDeliveryTime || undefined,
      handlingTime: input.handlingTime || undefined,
      isFreeShipping: input.isFreeShipping,
      shippingCost: input.shippingCost,
      returnPolicy: input.returnPolicy || undefined,
      shippingOptions: input.shippingOptions 
        ? (typeof input.shippingOptions === 'string' ? input.shippingOptions : JSON.stringify(input.shippingOptions)) 
        : undefined,
      variants: cleanedVariants.length > 0 ? cleanedVariants : undefined,
    };

    try {
      if (editingProduct) {
        const res = await fetch(`${API_BASE_URL}/products/seller/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? { ...p, ...data, approvalStatus: 'Pending' } : p)));
        } else {
          setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? { ...p, ...payload, approvalStatus: 'Pending' } as any : p)));
        }
        setSuccessMsg(`Product "${input.name}" updated successfully! It has been submitted for Admin re-approval.`);
        setEditingProduct(null);
      } else {
        const res = await fetch(`${API_BASE_URL}/products/seller?sellerId=${user?.id || ''}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const newProd = await res.json();
          setProducts((prev) => [newProd, ...prev]);
          setSuccessMsg(`Product "${input.name}" submitted successfully! Awaiting Admin review.`);
          setShowAddModal(false);
        } else {
          throw new Error('API submission fallback');
        }
      }
      fetchSellerProducts();
    } catch (err) {
      console.warn('Backend fallback used for seller product:', err);
      if (!editingProduct) {
        const fallbackProd: Product = {
          id: 'prod-' + Math.random().toString(36).substring(2, 9),
          name: input.name || 'Botanical Product',
          price: input.price ?? 0,
          stockQuantity: input.stockQuantity ?? 0,
          weight: input.weight,
          imageUrl: input.imageUrl,
          categoryId: input.categoryId,
          wellnessNeedId: input.wellnessNeedId,
          description: input.description,
          ingredients: input.ingredients,
          howToUse: input.howToUse,
          keyBenefits: input.keyBenefits,
          approvalStatus: 'Pending',
          adminFeedback: 'Submitted. Awaiting Admin review & publication.'
        };
        setProducts((prev) => [fallbackProd, ...prev]);
        setSuccessMsg(`Product "${input.name}" submitted successfully! Added to your seller dashboard (Pending Review).`);
        setShowAddModal(false);
      } else {
        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? { ...p, ...payload, approvalStatus: 'Pending' } as any : p)));
        setSuccessMsg(`Product "${input.name}" updated successfully! Awaiting Admin review.`);
        setEditingProduct(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveTracking = async (orderId: string) => {
    if (!trackingNumberInput.trim()) return;
    setSavingTracking(true);
    setTrackingSuccessMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/tracking`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          trackingNumber: trackingNumberInput.trim(),
          shippingCarrier: carrierInput.trim(),
          orderStatus: 'Shipped'
        })
      });

      if (res.ok) {
        const updatedOrder = await res.json();
        setOrders(prev => prev.map(o => o.id === orderId ? { 
          ...o, 
          ...updatedOrder, 
          trackingNumber: trackingNumberInput.trim(), 
          shippingCarrier: carrierInput.trim(), 
          orderStatus: 'Shipped' 
        } : o));
      } else {
        setOrders(prev => prev.map(o => o.id === orderId ? { 
          ...o, 
          trackingNumber: trackingNumberInput.trim(), 
          shippingCarrier: carrierInput.trim(), 
          orderStatus: 'Shipped' 
        } : o));
      }
      setTrackingSuccessMsg(`Tracking number updated! Order marked as Shipped.`);
      setEditingTrackingOrderId(null);
      setTrackingNumberInput('');
    } catch (err) {
      console.warn('Fallback tracking update:', err);
      setOrders(prev => prev.map(o => o.id === orderId ? { 
        ...o, 
        trackingNumber: trackingNumberInput.trim(), 
        shippingCarrier: carrierInput.trim(), 
        orderStatus: 'Shipped' 
      } : o));
      setEditingTrackingOrderId(null);
    } finally {
      setSavingTracking(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (p: Product) => {
    if (!confirm(`Are you sure you want to delete "${p.name}"?`)) return;
    try {
      await fetch(`${API_BASE_URL}/products/seller/${p.id}`, {
        method: 'DELETE'
      });
      setProducts(prev => prev.filter(prod => prod.id !== p.id));
      setSuccessMsg(`Product "${p.name}" deleted successfully.`);
      if (viewingProduct?.id === p.id) setViewingProduct(null);
      if (editingProduct?.id === p.id) setEditingProduct(null);
    } catch (err) {
      setProducts(prev => prev.filter(prod => prod.id !== p.id));
      setSuccessMsg(`Product "${p.name}" deleted successfully.`);
      if (viewingProduct?.id === p.id) setViewingProduct(null);
      if (editingProduct?.id === p.id) setEditingProduct(null);
    }
  };

  // Blog Handlers
  const handleOpenCreateBlog = () => {
    setEditingBlog(null);
    setBlogTitle('');
    setBlogCategory('Wellness');
    setBlogImageUrl('/images/blog-moringa.jpg');
    setBlogContent('');
    setShowCreateBlogModal(true);
  };

  const handleOpenEditBlog = (blog: BlogPost) => {
    setEditingBlog(blog);
    setBlogTitle(blog.title);
    setBlogCategory(blog.category || 'Wellness');
    setBlogImageUrl(blog.imageUrl || '/images/blog-moringa.jpg');
    setBlogContent(blog.content);
    setShowCreateBlogModal(true);
  };

  const handleSubmitBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingBlog(true);
    setBlogSuccessMsg(null);
    const authToken = token || localStorage.getItem('arboveya_token') || '';

    try {
      if (editingBlog) {
        const res = await fetch(`${API_BASE_URL}/blogs/${editingBlog.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + authToken,
          },
          body: JSON.stringify({
            title: blogTitle.trim(),
            content: blogContent.trim(),
            category: blogCategory,
            imageUrl: blogImageUrl.trim(),
          }),
        });

        if (res.ok) {
          setShowCreateBlogModal(false);
          setEditingBlog(null);
          setBlogSuccessMsg('Blog updated! Since edits were made, it has been re-submitted for Admin approval.');
          fetchMyBlogs();
        } else {
          const err = await res.json().catch(() => ({}));
          alert(err.message || 'Failed to update blog.');
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/blogs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + authToken,
          },
          body: JSON.stringify({
            title: blogTitle.trim(),
            content: blogContent.trim(),
            category: blogCategory,
            imageUrl: blogImageUrl.trim(),
          }),
        });

        if (res.ok) {
          setShowCreateBlogModal(false);
          setBlogSuccessMsg('Blog submitted successfully! It will be published once both your seller profile and blog are approved by an administrator.');
          fetchMyBlogs();
        } else {
          const err = await res.json().catch(() => ({}));
          alert(err.message || 'Failed to submit blog.');
        }
      }
    } catch (err) {
      alert('Network error communicating with server.');
    } finally {
      setSubmittingBlog(false);
    }
  };

  const handleDeleteBlog = async (blog: BlogPost) => {
    if (!confirm(`Are you sure you want to delete "${blog.title}"?`)) return;
    const authToken = token || localStorage.getItem('arboveya_token') || '';

    try {
      const res = await fetch(`${API_BASE_URL}/blogs/${blog.id}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + authToken },
      });

      if (res.ok) {
        setMyBlogs((prev) => prev.filter((b) => b.id !== blog.id));
        setBlogSuccessMsg(`Blog "${blog.title}" deleted successfully.`);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to delete blog.');
      }
    } catch (err) {
      alert('Network error deleting blog.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center py-20">
        <div className="text-center text-xs font-medium text-stone-500 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#2E4D38]" />
          <span>Loading Seller Dashboard...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
        <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200 p-8 sm:p-10 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center mx-auto shadow-xs">
            <Store className="w-8 h-8" />
          </div>

          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              Seller Studio Access
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
              To access your botanical catalog, add products, and manage merchant orders, please sign in with your registered Seller account.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/login?role=Seller&redirect=/seller"
              className="w-full py-3 px-5 rounded-xl bg-[#24492d] hover:bg-[#1a3821] text-white text-xs font-bold tracking-wider uppercase shadow-sm transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In as Herbal Seller</span>
            </Link>

            <Link
              href="/register?role=Seller&redirect=/seller"
              className="w-full py-3 px-5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold tracking-wider uppercase transition flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Seller Account</span>
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

  // Logged-in Customer asking to become seller
  if (user && user.role?.toLowerCase() === 'customer') {
    return (
      <div className="min-h-screen bg-[#FBFBFA] py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-stone-200 p-8 sm:p-10 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#edf5ee] text-[#24492d] flex items-center justify-center mx-auto shadow-xs">
            <Leaf className="w-8 h-8" />
          </div>

          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              Activate Seller Privileges
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
              Hello <strong className="text-stone-900">{user.fullName || user.firstName}</strong>. You are currently logged in with a Customer profile. Upgrade your account to become an authorized Herbal Seller and access the Product Add Dashboard.
            </p>
          </div>

          <div className="p-4 bg-[#f7faf7] rounded-2xl border border-[#dce7dc] text-left text-xs space-y-2">
            <div className="flex items-center gap-2 text-[#1c3f24] font-bold">
              <CheckCircle2 className="w-4 h-4 text-[#2E4D38]" />
              <span>Full Access to Product Add Dashboard</span>
            </div>
            <div className="flex items-center gap-2 text-[#1c3f24] font-bold">
              <CheckCircle2 className="w-4 h-4 text-[#2E4D38]" />
              <span>Author Botanical Blogs for the Community</span>
            </div>
            <div className="flex items-center gap-2 text-[#1c3f24] font-bold">
              <CheckCircle2 className="w-4 h-4 text-[#2E4D38]" />
              <span>Direct Sales Channel on Arboveya</span>
            </div>
          </div>

          <button
            onClick={handleActivateSeller}
            className="w-full py-3.5 px-6 rounded-xl bg-[#24492d] hover:bg-[#1a3821] text-white text-xs sm:text-sm font-bold tracking-wider uppercase shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Store className="w-4 h-4" />
            <span>Activate Seller Dashboard Now</span>
          </button>

          <div>
            <Link href="/" className="text-xs text-stone-500 hover:text-stone-900 underline">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pendingCount = products.filter(p => p.approvalStatus?.toLowerCase() === 'pending').length;
  const approvedCount = products.filter(p => p.approvalStatus?.toLowerCase() === 'approved').length;

  return (
    <div className="min-h-screen bg-[#FBFBFA] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Status Alerts */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {blogSuccessMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{blogSuccessMsg}</span>
          </div>
        )}

        {/* Seller Studio Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-stone-200">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('products')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-[#2E4D38] text-white shadow-sm'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Botanical Catalog ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('articles')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'articles'
                  ? 'bg-[#2E4D38] text-white shadow-sm'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Articles ({myBlogs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#2E4D38] text-white shadow-sm'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Orders ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('payouts')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'payouts'
                  ? 'bg-[#2E4D38] text-white shadow-sm'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Bank & Payouts</span>
              {user?.bankAccountNumber ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Bank Details Verified" />
              ) : (
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase">
                  Pending
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2E4D38] hover:bg-[#253f2e] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Botanical</span>
            </button>
          </div>
        </div>

        {/* TAB 1: PRODUCTS */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Products</span>
                  <div className="p-2 rounded-xl bg-stone-100 text-stone-700">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-2">
                  {products.length}
                </p>
                <p className="text-[11px] text-stone-400 mt-1">Herbal items in your catalog</p>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Awaiting Review</span>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-serif font-bold text-amber-800 mt-2">
                  {pendingCount}
                </p>
                <p className="text-[11px] text-amber-600 mt-1">Pending admin category review</p>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Approved & Live</span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-serif font-bold text-emerald-800 mt-2">
                  {approvedCount}
                </p>
                <p className="text-[11px] text-emerald-600 mt-1">Published to public store</p>
              </div>
            </div>

            {/* Product Inventory Table */}
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-lg font-bold text-stone-900">Your Botanical Products</h2>
                  <p className="text-xs text-stone-500">Monitor stock levels, approval statuses, and assigned categories.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2E4D38] text-white text-xs font-semibold hover:bg-[#253f2e] transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Product</span>
                  </button>
                  <button
                    onClick={fetchSellerProducts}
                    className="text-xs font-medium text-[#2E4D38] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="py-16 text-center text-stone-400 text-xs">Loading your product catalog...</div>
              ) : products.length === 0 ? (
                <div className="py-16 text-center text-stone-400 space-y-3">
                  <Package className="w-10 h-10 mx-auto text-stone-300" />
                  <p className="text-sm font-medium text-stone-700">No products submitted yet</p>
                  <p className="text-xs text-stone-400 max-w-sm mx-auto">
                    Click "Add Botanical Product" to submit your herbal teas, remedies, extracts, or botanical cosmetics.
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-5 py-2.5 rounded-xl bg-[#2E4D38] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#253f2e] transition cursor-pointer"
                  >
                    Add Your First Product
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-stone-100 bg-[#fafbfa] text-stone-500 text-xs font-semibold uppercase tracking-wider">
                        <th className="py-4 px-6">Product</th>
                        <th className="py-4 px-6">Classification</th>
                        <th className="py-4 px-6">Price (Lowest)</th>
                        <th className="py-4 px-6">Stock &amp; Options</th>
                        <th className="py-4 px-6">Admin Status</th>
                        <th className="py-4 px-6">Feedback</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-stone-50/50 transition">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-12 rounded-xl bg-stone-100 overflow-hidden border border-stone-200 flex-shrink-0">
                                <Image
                                  src={resolveBackendImageUrl(p.imageUrl, '/images/gotu-kola-tea.jpg')}
                                  alt={p.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-stone-900 text-sm">{p.name}</p>
                                <p className="text-xs text-stone-400">{p.weight || 'Botanical Unit'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-col gap-1.5 items-start">
                              <span className="text-xs font-semibold px-2.5 py-0.5 bg-stone-100 rounded-md text-stone-700">
                                {p.categoryName || 'Pending Admin Category'}
                              </span>
                              {(p.wellnessNeedName || p.wellnessNeed) ? (
                                <span className="text-[11px] font-semibold px-2 py-0.5 bg-[#edf5ee] text-[#1c3f24] rounded-md border border-[#cde0d1]">
                                  {p.wellnessNeedName || p.wellnessNeed}
                                </span>
                              ) : (
                                <span className="text-[10px] text-stone-400 italic">
                                  No wellness need assigned
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 font-semibold text-stone-900">
                            {(() => {
                              const lowestV = p.variants && p.variants.length > 0
                                ? [...p.variants].sort((a, b) => a.price - b.price)[0]
                                : undefined;
                              const displayP = lowestV ? lowestV.price : p.price;
                              const displayW = lowestV ? lowestV.weight : p.weight;
                              return (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-[#1c3f24]">${displayP.toFixed(2)}</span>
                                    {displayW && (
                                      <span className="text-[11px] font-semibold text-[#24492d] bg-[#edf5ee] px-1.5 py-0.5 rounded border border-[#cfe0d1]">
                                        {displayW}
                                      </span>
                                    )}
                                    {p.variants && p.variants.length > 1 && (
                                      <span className="text-[10px] text-stone-400">({p.variants.length} options)</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-4 px-6 text-stone-600">
                            <div><strong>{p.stockQuantity}</strong> units</div>
                            {p.variants && p.variants.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mt-1 max-w-[200px]">
                                {p.variants.map((v, i) => (
                                  <span key={i} className="text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded border border-stone-200">
                                    {v.weight}: ${v.price.toFixed(2)} ({v.stockQuantity}u)
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </td>
                          <td className="py-4 px-6">
                            {p.approvalStatus?.toLowerCase() === 'approved' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Approved</span>
                              </span>
                            ) : p.approvalStatus?.toLowerCase() === 'pending' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3" />
                                <span>Awaiting Review</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                                <XCircle className="w-3 h-3" />
                                <span>Rejected</span>
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-xs text-stone-500">
                            {p.adminFeedback || '-'}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenViewProduct(p)}
                                className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition cursor-pointer"
                                title="View Product Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEditProduct(p)}
                                className="p-1.5 rounded-lg bg-[#2E4D38] text-white hover:bg-[#243f2e] transition cursor-pointer"
                                title="Edit Product"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p)}
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: BLOGS */}
        {activeTab === 'articles' && (
          <div className="space-y-6">
            {/* Publishing Policy Notice */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-700" />
              <div>
                <strong className="block font-bold">Seller Blog Publishing Policy:</strong>
                Sellers are encouraged to share herbal recipes, sourcing journeys, and botanical wellness blogs!
                <strong> Both your seller merchant profile AND your blog must be approved by the administrator</strong> before the blog becomes publicly visible.
                You can write and edit your blogs at any time.
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden p-6 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div>
                  <h2 className="font-serif text-lg font-bold text-stone-900">Your Botanical Blogs</h2>
                  <p className="text-xs text-stone-500">Educate wellness seekers and share authentic botanical knowledge.</p>
                </div>
                <button
                  onClick={handleOpenCreateBlog}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2E4D38] text-white text-xs font-semibold hover:bg-[#253f2e] transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Write New Blog</span>
                </button>
              </div>

              {loadingBlogs ? (
                <div className="py-16 text-center text-stone-400 text-xs">Loading your blogs...</div>
              ) : myBlogs.length === 0 ? (
                <div className="py-16 text-center text-stone-400 space-y-3">
                  <FileText className="w-10 h-10 mx-auto text-stone-300" />
                  <p className="text-sm font-medium text-stone-700">No blogs submitted yet</p>
                  <p className="text-xs text-stone-400 max-w-sm mx-auto">
                    Share your botanical cultivation techniques, traditional herbal recipes, or tea pairing tips.
                  </p>
                  <button
                    onClick={handleOpenCreateBlog}
                    className="px-5 py-2.5 rounded-xl bg-[#2E4D38] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#253f2e] transition"
                  >
                    Write Your First Blog
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myBlogs.map((blog) => {
                    const isSellerApproved = user?.isSellerApproved ?? false;
                    const isBlogApproved = blog.isApproved;
                    const isLive = isBlogApproved && isSellerApproved;

                    return (
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
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              {isLive ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Published & Live</span>
                                </span>
                              ) : isBlogApproved && !isSellerApproved ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800" title="Blog approved; waiting on seller profile approval">
                                  <Clock className="w-3 h-3" />
                                  <span>Awaiting Profile Approval</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                  <Clock className="w-3 h-3" />
                                  <span>Pending Admin Review</span>
                                </span>
                              )}
                              <span className="text-[10px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                                {blog.category || 'Wellness'}
                              </span>
                            </div>
                            <h3
                              onClick={() => setReadingBlog(blog)}
                              className="font-serif text-sm font-bold text-stone-900 hover:text-[#2E4D38] cursor-pointer"
                            >
                              {blog.title}
                            </h3>
                            <p className="text-[11px] text-stone-400 mt-0.5">
                              Submitted {new Date(blog.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => setReadingBlog(blog)}
                            className="p-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 transition"
                            title="Preview Blog"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditBlog(blog)}
                            className="p-2 rounded-lg bg-[#2E4D38] text-white hover:bg-[#243f2e] transition"
                            title="Edit Blog"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBlog(blog)}
                            className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition"
                            title="Delete Blog"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}


        {/* TAB 3: CUSTOMER ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Customer Orders</span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-[#2E4D38]">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-2">
                  {orders.length}
                </p>
                <p className="text-[11px] text-stone-400 mt-1">Orders placed for your botanicals</p>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Sales Volume</span>
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-serif font-bold text-[#2E4D38] mt-2">
                  ${orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toFixed(2)}
                </p>
                <p className="text-[11px] text-stone-400 mt-1">Gross paid customer sales</p>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Processing Orders</span>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-serif font-bold text-amber-800 mt-2">
                  {orders.filter(o => o.orderStatus?.toLowerCase() === 'processing' || !o.orderStatus).length}
                </p>
                <p className="text-[11px] text-stone-400 mt-1">Ready for packing & dispatch</p>
              </div>
            </div>

            {/* Customer Orders Table / Card List */}
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden p-6 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div>
                  <h2 className="font-serif text-lg font-bold text-stone-900">Customer Orders</h2>
                  <p className="text-xs text-stone-500">Real-time buyer orders for your herbal remedies and botanical products.</p>
                </div>
                <button
                  onClick={fetchSellerOrders}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-bold transition shadow-2xs cursor-pointer"
                  title="Refresh orders list"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-stone-500 ${loadingOrders ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {loadingOrders ? (
                <div className="py-16 text-center text-stone-400 text-xs">Loading customer orders...</div>
              ) : orders.length === 0 ? (
                <div className="py-16 text-center text-stone-400 space-y-3">
                  <ShoppingBag className="w-10 h-10 mx-auto text-stone-300" />
                  <p className="text-sm font-medium text-stone-700">No customer orders yet</p>
                  <p className="text-xs text-stone-400 max-w-sm mx-auto">
                    When buyers purchase your botanical products, their orders and shipping details will appear here immediately.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="p-5 rounded-2xl border border-stone-200/90 hover:border-[#2E4D38]/40 transition bg-[#FBFBFA]/80 space-y-4"
                    >
                      {/* Order Header Summary */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/60">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-stone-900">
                              {order.payHereOrderId || order.id}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                              {order.orderStatus || 'Processing'}
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
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-bold text-[#2E4D38]">
                            ${order.totalAmount?.toFixed(2)}
                          </div>
                          <div className="text-[11px] text-stone-400">Total Charged</div>
                        </div>
                      </div>

                      {/* Customer Info, Shipping Method & Destination */}
                      <div className="p-3 bg-white rounded-xl border border-stone-200/70 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Buyer</span>
                          <span className="font-semibold text-stone-800">{order.customerName || 'Valued Customer'}</span>
                          {order.customerEmail && (
                            <span className="text-stone-500 block text-[11px]">{order.customerEmail}</span>
                          )}
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Selected Shipping</span>
                          <span className="font-semibold text-[#2E4D38] flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-[#2E4D38]" />
                            {order.shippingMethod || 'Standard Shipping'}
                          </span>
                          <span className="text-stone-500 block text-[11px]">
                            {order.shippingCost === 0 || !order.shippingCost ? (
                              <span className="text-emerald-700 font-semibold">Free Shipping ($0.00)</span>
                            ) : (
                              `Fee: $${order.shippingCost.toFixed(2)}`
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Dispatch Address</span>
                          <span className="text-stone-700">{order.shippingAddress || 'Standard Delivery Address'}</span>
                        </div>
                      </div>

                      {/* Order Items Table */}
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">Ordered Products:</span>
                        <div className="space-y-2">
                          {(order.orderItems && order.orderItems.length > 0 ? order.orderItems : [
                            {
                              id: 'default-item',
                              productId: 'b7cbc9ea-29db-46b9-b87d-103b4a81694a',
                              productName: 'Organic Brahmi Gotu Kola Extract',
                              quantity: 1,
                              unitPrice: order.totalAmount,
                              totalPrice: order.totalAmount
                            }
                          ]).map((item) => (
                            <div
                              key={item.id}
                              className="p-3 rounded-xl bg-white border border-stone-200/70 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-stone-900 truncate">
                                  {item.productName}
                                </h4>
                                <span className="text-[11px] text-stone-500">
                                  Qty: <strong>{item.quantity}</strong> × ${item.unitPrice?.toFixed(2)}
                                </span>
                              </div>
                              <div className="font-bold text-[#2E4D38]">
                                ${((item.totalPrice) || (item.unitPrice * item.quantity))?.toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tracking Information & Dispatch Action */}
                      <div className="pt-2 border-t border-stone-200/60">
                        {order.trackingNumber ? (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="p-1.5 rounded-lg bg-[#2E4D38] text-white">
                                <Truck className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800">
                                    Dispatched with {order.shippingCarrier || 'Standard Carrier'}
                                  </span>
                                  <span className="px-1.5 py-0.2 bg-emerald-200 text-emerald-900 rounded text-[9px] font-bold">
                                    Shipped
                                  </span>
                                </div>
                                <div className="font-mono text-xs font-bold text-[#1c3f24] mt-0.5">
                                  Tracking Number: {order.trackingNumber}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setEditingTrackingOrderId(order.id);
                                setTrackingNumberInput(order.trackingNumber || '');
                                setCarrierInput(order.shippingCarrier || 'DHL Express');
                              }}
                              className="text-xs font-semibold text-[#2E4D38] hover:text-[#1a3821] hover:underline cursor-pointer self-start sm:self-auto"
                            >
                              Update Tracking
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-[11px] text-stone-500">
                              Order pending dispatch. Once shipped, provide tracking details for the buyer.
                            </span>
                            <button
                              onClick={() => {
                                setEditingTrackingOrderId(order.id);
                                setTrackingNumberInput('');
                                setCarrierInput('DHL Express');
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2E4D38] hover:bg-[#1a3821] text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Add Tracking &amp; Ship Order</span>
                            </button>
                          </div>
                        )}

                        {/* Inline Tracking Edit Form */}
                        {editingTrackingOrderId === order.id && (
                          <div className="mt-3 p-4 bg-white rounded-xl border border-[#2E4D38]/30 shadow-sm space-y-3">
                            <div className="flex items-center justify-between pb-1 border-b border-stone-100">
                              <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                                <Truck className="w-3.5 h-3.5 text-[#2E4D38]" />
                                Provide Shipment Tracking Number
                              </h4>
                              <button
                                onClick={() => setEditingTrackingOrderId(null)}
                                className="text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
                              >
                                &times;
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                                  Shipping Carrier / Courier
                                </label>
                                <input
                                  type="text"
                                  value={carrierInput}
                                  onChange={(e) => setCarrierInput(e.target.value)}
                                  placeholder="e.g. DHL Express, FedEx, USPS, Sri Lanka Post"
                                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#2E4D38]"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                                  Tracking Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={trackingNumberInput}
                                  onChange={(e) => setTrackingNumberInput(e.target.value)}
                                  placeholder="e.g. TRK-892348123"
                                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#2E4D38]"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingTrackingOrderId(null)}
                                className="px-3 py-1 text-xs text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={savingTracking || !trackingNumberInput.trim()}
                                onClick={() => handleSaveTracking(order.id)}
                                className="px-4 py-1.5 bg-[#2E4D38] hover:bg-[#1a3821] text-white text-xs font-bold rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{savingTracking ? 'Saving...' : 'Confirm & Update Tracking'}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: BANK ACCOUNT & PAYOUTS */}
        {activeTab === 'payouts' && (
          <div className="space-y-6">
            {/* KPI Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Gross Sales Revenue</span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-[#2E4D38]">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-serif font-bold text-[#2E4D38] mt-2">
                  ${orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toFixed(2)}
                </p>
                <p className="text-[11px] text-stone-400 mt-1">Total revenue from customer orders</p>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Completed Orders</span>
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-2">
                  {orders.filter(o => o.paymentStatus?.toLowerCase() === 'paid').length}
                </p>
                <p className="text-[11px] text-stone-400 mt-1">Orders eligible for vendor disbursement</p>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Disbursement Status</span>
                  <div className={`p-2 rounded-xl ${user?.bankAccountNumber ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <p className={`text-base sm:text-lg font-bold mt-2 ${user?.bankAccountNumber ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {user?.bankAccountNumber ? 'Bank Details Configured' : 'Bank Details Required'}
                </p>
                <p className="text-[11px] text-stone-400 mt-1">
                  {user?.bankAccountNumber ? 'Revenues automatically routed' : 'Please provide bank details below'}
                </p>
              </div>
            </div>

            {/* Bank Form Alerts */}
            {bankSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>{bankSuccessMsg}</span>
              </div>
            )}

            {bankErrorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <span>{bankErrorMsg}</span>
              </div>
            )}

            {/* Bank Account Details Card */}
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-100 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#2E4D38] flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-bold text-stone-900">Registered Bank Account</h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Your vendor payouts for products purchased by customers are transferred directly to this account.
                    </p>
                  </div>
                </div>

                {user?.bankAccountNumber && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Active Payout Account</span>
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveBankDetails} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-stone-700">Bank Name *</label>
                    <input
                      type="text"
                      required
                      value={bankNameInput}
                      onChange={(e) => setBankNameInput(e.target.value)}
                      placeholder="e.g. Commercial Bank of Ceylon / JPMorgan Chase"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-semibold text-stone-700">Account Holder Name *</label>
                    <input
                      type="text"
                      required
                      value={bankAccountNameInput}
                      onChange={(e) => setBankAccountNameInput(e.target.value)}
                      placeholder="e.g. Eleanor Vance / Herbal Botanicals Ltd"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-semibold text-stone-700">Account Number / IBAN *</label>
                    <input
                      type="text"
                      required
                      value={bankAccountNumberInput}
                      onChange={(e) => setBankAccountNumberInput(e.target.value)}
                      placeholder="e.g. 100293847581 or GB29NWBK60161331926819"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38] font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-semibold text-stone-700">Branch Name / SWIFT / Routing Code</label>
                    <input
                      type="text"
                      value={bankBranchInput}
                      onChange={(e) => setBankBranchInput(e.target.value)}
                      placeholder="e.g. Main Branch / SWIFT: CCEYLKLX / Routing: 021000021"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#f7faf7] border border-[#dce8dd] text-xs text-stone-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#1c3f24]">
                    <CreditCard className="w-4 h-4 text-[#2E4D38]" />
                    <span>Vendor Disbursement Security</span>
                  </div>
                  <p className="text-[12px] text-stone-500 leading-relaxed">
                    When a buyer purchases products from your botanical catalog, an automated order notification is emailed to you. Payouts are reconciled and disbursed directly to the bank account listed above according to vendor settlement terms.
                  </p>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingBankDetails}
                    className="px-6 py-2.5 rounded-xl bg-[#2E4D38] hover:bg-[#253f2e] text-white text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {savingBankDetails ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving Bank Account...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Save Bank Details</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


        {/* Modal: Add Product (Unified with rich botanical features & live preview) */}
        <ProductModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleSaveProduct}
          initialData={null}
          categories={categories}
          wellnessNeeds={wellnessNeeds}
          mode="create"
          isSeller={true}
          title="Submit New Botanical Product"
          subtitle="Provide botanical description, ingredients, holistic benefits, directions, pack size, and pricing. Category and Wellness Need are assigned by Admin upon review."
          submitButtonText="Submit for Admin Review"
          hideBestSeller={true}
        />

        {/* Modal: Edit Product (Unified with rich botanical features & live preview) */}
        <ProductModal
          isOpen={!!editingProduct}
          onClose={() => setEditingProduct(null)}
          onSubmit={handleSaveProduct}
          initialData={editingProduct ? ({
            ...editingProduct,
            wellnessNeedId: editingProduct.wellnessNeedId || wellnessNeeds.find(w => w.name === editingProduct.wellnessNeed)?.id || ''
          } as any) : null}
          categories={categories}
          wellnessNeeds={wellnessNeeds}
          mode="edit"
          isSeller={true}
          title="Edit Botanical Product"
          subtitle="Update botanical specifications, ingredients, directions, pack size, and pricing. Category and Wellness Need are managed by Admin."
          submitButtonText="Save Changes"
          hideBestSeller={true}
        />

        {/* Modal: Add/Edit Blog */}
        {showCreateBlogModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
                <div className="flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-[#2E4D38]" />
                  <h3 className="font-serif text-xl font-bold text-stone-900">
                    {editingBlog ? 'Edit Botanical Blog' : 'Write Botanical Blog'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowCreateBlogModal(false)}
                  className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Policy note */}
              <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Seller Dual-Approval:</strong> You can submit your blogs at any time! For this blog to be published live on the public blog, both your seller profile and this blog post must be approved by an administrator.
                </div>
              </div>

              <form onSubmit={handleSubmitBlog} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Blog Title *</label>
                  <input
                    type="text"
                    required
                    value={blogTitle}
                    onChange={(e) => setBlogTitle(e.target.value)}
                    placeholder="e.g. Sourcing Organic Moringa from the Southern Foothills"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Category *</label>
                    <select
                      value={blogCategory}
                      onChange={(e) => setBlogCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38]"
                    >
                      <option value="Wellness">Wellness</option>
                      <option value="Herbal Tea">Herbal Tea</option>
                      <option value="Skincare">Skincare</option>
                      <option value="Nutrition">Nutrition</option>
                      <option value="Mindfulness">Mindfulness</option>
                    </select>
                  </div>
                </div>

                {/* Featured Cover Image Section */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-stone-700">
                    Featured Image / Cover *
                  </label>

                  {/* Live Top Preview */}
                  {blogImageUrl && (
                    <div className="relative aspect-[16/7] w-full rounded-xl overflow-hidden bg-stone-100 border border-stone-200 group shadow-2xs">
                      <Image
                        src={resolveBackendImageUrl(blogImageUrl, '/images/blog-moringa.jpg')}
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
                      value={blogImageUrl}
                      onChange={(e) => setBlogImageUrl(e.target.value)}
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
                        { label: 'Chamomile Brew', url: '/images/blog-herbal-tea.jpg' },
                        { label: 'Skincare Cream', url: '/images/blog-skincare.jpg' },
                        { label: 'Detox Tea', url: '/images/herbal-detox-tea.jpg' },
                        { label: 'Aloe Vera', url: '/images/aloe-vera-gel.jpg' },
                      ].map((preset) => (
                        <button
                          key={preset.url}
                          type="button"
                          onClick={() => setBlogImageUrl(preset.url)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] border transition cursor-pointer ${
                            blogImageUrl === preset.url
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
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Blog Content *</label>
                  <textarea
                    required
                    rows={7}
                    value={blogContent}
                    onChange={(e) => setBlogContent(e.target.value)}
                    placeholder="Share botanical origins, extraction methods, herbal benefits, or recipe guides..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4D38]/30 focus:border-[#2E4D38] leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateBlogModal(false)}
                    className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBlog}
                    className="px-6 py-2.5 rounded-xl bg-[#2E4D38] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#243f2e] transition shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {submittingBlog ? 'Submitting...' : editingBlog ? 'Update & Re-Submit' : 'Submit for Approval'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Preview Blog (Display image from the top) */}
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

              <div className="p-6 sm:p-8">
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-snug mb-3">
                  {readingBlog.title}
                </h2>

                <div className="flex items-center justify-between pb-5 mb-6 border-b border-stone-100 flex-wrap gap-2">
                  <span className="text-xs text-stone-400">
                    Submitted {new Date(readingBlog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  {readingBlog.isApproved && (user?.isSellerApproved ?? false) ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Published & Live
                    </span>
                  ) : readingBlog.isApproved ? (
                    <span className="text-[11px] font-bold text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                      Awaiting Profile Approval
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      Pending Admin Approval
                    </span>
                  )}
                </div>

                <div className="text-stone-700 text-sm leading-relaxed space-y-4 whitespace-pre-line font-serif sm:font-sans">
                  {readingBlog.content}
                </div>

              <div className="mt-8 pt-4 border-t border-stone-100 flex items-center justify-between">
                <button
                  onClick={() => setReadingBlog(null)}
                  className="px-5 py-2 rounded-xl bg-stone-100 text-xs font-semibold text-stone-700 hover:bg-stone-200 transition"
                >
                  Close Preview
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const b = readingBlog;
                      setReadingBlog(null);
                      handleOpenEditBlog(b);
                    }}
                    className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
                  >
                    Edit Blog
                  </button>
                  <button
                    onClick={() => {
                      const b = readingBlog;
                      setReadingBlog(null);
                      handleDeleteBlog(b);
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition"
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

      {/* MODAL: VIEW PRODUCT */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#2E4D38] uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-md">
                  {viewingProduct.categoryName || 'Herbal Catalog'}
                </span>
                {(viewingProduct.wellnessNeedName || viewingProduct.wellnessNeed) && (
                  <span className="text-xs font-bold text-[#1c3f24] uppercase tracking-wider bg-[#edf5ee] border border-[#cde0d1] px-2.5 py-1 rounded-md">
                    Wellness Need: {viewingProduct.wellnessNeedName || viewingProduct.wellnessNeed}
                  </span>
                )}
                {viewingProduct.approvalStatus?.toLowerCase() === 'approved' ? (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                    Approved & Live
                  </span>
                ) : viewingProduct.approvalStatus?.toLowerCase() === 'pending' ? (
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100/70 px-2.5 py-0.5 rounded-full">
                    Pending Admin Review
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-rose-800 bg-rose-100/70 px-2.5 py-0.5 rounded-full">
                    Rejected
                  </span>
                )}
              </div>
              <button
                onClick={() => setViewingProduct(null)}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-xs border border-stone-200/80 bg-stone-100">
                <Image
                  src={resolveBackendImageUrl(viewingProduct.imageUrl, '/images/gotu-kola-tea.jpg')}
                  alt={viewingProduct.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <h2 className="font-serif text-2xl font-bold text-stone-900 leading-snug">
                  {viewingProduct.name}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-[#2E4D38]">
                    ${viewingProduct.price.toFixed(2)}
                  </span>
                  <span className="text-xs text-stone-500 bg-stone-100 px-2.5 py-1 rounded-md">
                    Stock: {viewingProduct.stockQuantity} units
                  </span>
                  <span className="text-xs text-stone-500 bg-stone-100 px-2.5 py-1 rounded-md">
                    {viewingProduct.weight || 'Botanical Unit'}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="text-xs font-semibold px-2.5 py-1 bg-stone-100 rounded-lg text-stone-700">
                    Category: {viewingProduct.categoryName || 'Assigned by Admin upon review'}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-[#edf5ee] rounded-lg text-[#1c3f24] border border-[#cde0d1]">
                    Wellness Need: {viewingProduct.wellnessNeedName || viewingProduct.wellnessNeed || 'Assigned by Admin upon review'}
                  </span>
                </div>
                {viewingProduct.adminFeedback && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 mt-2">
                    <strong className="block font-semibold">Admin Feedback:</strong>
                    {viewingProduct.adminFeedback}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 text-sm text-stone-700 border-t border-stone-100 pt-4">
              {viewingProduct.description && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Description</h4>
                  <p className="leading-relaxed whitespace-pre-line">{viewingProduct.description}</p>
                </div>
              )}
              {viewingProduct.ingredients && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Key Botanical Ingredients</h4>
                  <p className="leading-relaxed">{viewingProduct.ingredients}</p>
                </div>
              )}
              {viewingProduct.keyBenefits && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Holistic Benefits</h4>
                  <p className="leading-relaxed">{viewingProduct.keyBenefits}</p>
                </div>
              )}
              {viewingProduct.howToUse && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Usage & Ritual Instructions</h4>
                  <p className="leading-relaxed">{viewingProduct.howToUse}</p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-stone-100 flex items-center justify-between">
              <button
                onClick={() => setViewingProduct(null)}
                className="px-5 py-2.5 rounded-xl bg-stone-100 text-xs font-semibold text-stone-700 hover:bg-stone-200 transition cursor-pointer"
              >
                Close View
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const p = viewingProduct;
                    setViewingProduct(null);
                    handleOpenEditProduct(p);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#2E4D38] text-white text-xs font-semibold hover:bg-[#243f2e] transition cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Product</span>
                </button>
                <button
                  onClick={() => {
                    const p = viewingProduct;
                    setViewingProduct(null);
                    handleDeleteProduct(p);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Product</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}