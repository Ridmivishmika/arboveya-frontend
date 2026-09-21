'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  Table as TableIcon, 
  Edit3, 
  Trash2, 
  ExternalLink,
  Tag, 
  CheckCircle2, 
  AlertTriangle,
  FolderTree,
  Sparkles,
  RefreshCw,
  Clock,
  User,
  ShieldAlert,
  ArrowRight,
  Check,
  X
} from 'lucide-react';
import { Product, Category, WellnessNeed, CreateProductInput, UpdateProductInput } from '@/types';
import { 
  getProducts, 
  getCategories, 
  getWellnessNeeds,
  getPendingProducts, 
  approveProduct, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '@/lib/api';
import AdminHeader from '@/components/admin/AdminHeader';
import ProductModal from '@/components/admin/ProductModal';
import ProductDeleteModal from '@/components/admin/ProductDeleteModal';
import ApproveProductModal from '@/components/admin/ApproveProductModal';

function isValidImageUrl(url?: string | null): url is string {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wellnessNeeds, setWellnessNeeds] = useState<WellnessNeed[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab: 'approved' | 'pending'
  const [activeCatalogTab, setActiveCatalogTab] = useState<'approved' | 'pending'>('approved');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Product Modals (Create / Edit / Delete)
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Approval Modal
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [productToApprove, setProductToApprove] = useState<Product | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, cats, pending, needs] = await Promise.all([
        getProducts(),
        getCategories(),
        getPendingProducts(),
        getWellnessNeeds()
      ]);
      setProducts(prods);
      setCategories(cats);
      setPendingProducts(pending);
      setWellnessNeeds(needs);
    } catch (err) {
      console.error('Error fetching admin products data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setSelectedProduct(product);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleOpenDelete = (product: Product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const handleOpenApprove = (product: Product) => {
    setProductToApprove(product);
    setApproveModalOpen(true);
  };

  const handleSaveProduct = async (input: CreateProductInput | UpdateProductInput) => {
    if (modalMode === 'create') {
      const created = await createProduct(input as CreateProductInput);
      setProducts((prev) => [created, ...prev]);
      showToast(`Product "${created.name}" created successfully!`);
    } else if (selectedProduct) {
      const updated = await updateProduct(selectedProduct.id, input as UpdateProductInput);
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      showToast(`Product "${updated.name}" updated successfully!`);
    }
    loadData();
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    await deleteProduct(productToDelete.id);
    setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
    showToast(`Product "${productToDelete.name}" deleted.`);
  };

  const handleConfirmApprove = async (productId: string, categoryId: string, wellnessNeedId?: string, feedback?: string) => {
    const approved = await approveProduct(productId, { 
      categoryId, 
      wellnessNeedId,
      approvalStatus: 'Approved', 
      adminFeedback: feedback 
    });
    
    const catObj = categories.find(c => c.id === categoryId);
    const assignedCatName = catObj?.name || approved.categoryName || 'Selected Category';

    showToast(`Product "${approved.name}" approved and published to shop!`);
    
    // Remove from pending
    setPendingProducts((prev) => prev.filter((p) => p.id !== productId));
    // Prepend to approved products
    setProducts((prev) => [{ ...approved, categoryName: assignedCatName }, ...prev]);
    
    // Reload full lists to sync
    loadData();
  };

  const handleConfirmReject = async (productId: string, feedback?: string) => {
    const defaultCat = categories[0]?.id || '';
    await approveProduct(productId, {
      categoryId: defaultCat,
      approvalStatus: 'Rejected',
      adminFeedback: feedback
    });

    showToast('Product marked as rejected.');
    setPendingProducts((prev) => prev.filter((p) => p.id !== productId));
    loadData();
  };

  const handleCategoryCreated = (newCat: Category) => {
    setCategories((prev) => [...prev, newCat]);
    showToast(`Category "${newCat.name}" created!`);
  };

  // Filtered approved products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = 
        selectedCategoryFilter === 'all' || 
        p.categoryId === selectedCategoryFilter ||
        p.categoryName?.toLowerCase() === selectedCategoryFilter.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategoryFilter]);

  // Filtered pending products
  const filteredPendingProducts = useMemo(() => {
    if (!searchTerm.trim()) return pendingProducts;
    const s = searchTerm.toLowerCase();
    return pendingProducts.filter((p) => 
      p.name.toLowerCase().includes(s) ||
      (p.description && p.description.toLowerCase().includes(s)) ||
      (p.sellerName && p.sellerName.toLowerCase().includes(s)) ||
      (p.ingredients && p.ingredients.toLowerCase().includes(s))
    );
  }, [pendingProducts, searchTerm]);

  const totalStockCount = products.reduce((acc, p) => acc + (p.stockQuantity || 0), 0);
  const avgPrice = products.length > 0 
    ? (products.reduce((acc, p) => acc + (p.price || 0), 0) / products.length).toFixed(2)
    : '0.00';

  return (
    <div className="min-h-screen bg-[#f8faf8] text-[#1c3f24] pb-16">
      
      {/* Reusable Admin Navigation Header with Role Badge & Sign Out Button */}
      <AdminHeader
        activeTab="products"
        pendingProductsCount={pendingProducts.length}
        productCount={products.length}
        categoryCount={categories.length}
        wellnessNeedsCount={wellnessNeeds.length}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">

        {/* Top Toast Banner */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 bg-[#1c3f24] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-[#3b6343] animate-slideIn">
            <CheckCircle2 className="w-5 h-5 text-[#86efac]" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-[#e2ede4] shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-[#627d68] font-medium">Approved Catalog</p>
              <h3 className="text-xl sm:text-2xl font-bold text-[#1c3f24] mt-0.5">{products.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#ecf5ee] flex items-center justify-center text-[#24492d]">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className={`rounded-xl p-4 border shadow-xs flex items-center justify-between transition-colors ${
            pendingProducts.length > 0 
              ? 'bg-amber-50/80 border-amber-200 text-amber-900' 
              : 'bg-white border-[#e2ede4]'
          }`}>
            <div>
              <p className="text-xs font-semibold text-amber-800">Pending Approvals</p>
              <h3 className="text-xl sm:text-2xl font-bold text-amber-950 mt-0.5">{pendingProducts.length}</h3>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              pendingProducts.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-[#ecf5ee] text-[#24492d]'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-[#e2ede4] shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-[#627d68] font-medium">Categories Linked</p>
              <h3 className="text-xl sm:text-2xl font-bold text-[#1c3f24] mt-0.5">{categories.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#ecf5ee] flex items-center justify-center text-[#24492d]">
              <FolderTree className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-[#e2ede4] shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-[#627d68] font-medium">Inventory Units</p>
              <h3 className="text-xl sm:text-2xl font-bold text-[#1c3f24] mt-0.5">{totalStockCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#ecf5ee] flex items-center justify-center text-[#24492d]">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Primary Tab Switcher: Approved Products vs Pending Approvals */}
        <div className="flex items-center gap-2 border-b border-[#e2ede4] pb-1">
          <button
            onClick={() => setActiveCatalogTab('approved')}
            className={`px-5 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
              activeCatalogTab === 'approved'
                ? 'border-[#24492d] text-[#1c3f24] bg-white shadow-2xs'
                : 'border-transparent text-stone-500 hover:text-[#1c3f24]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-[#24492d]" />
            <span>Approved Catalog</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#edf5ee] text-[#1c3f24]">
              {products.length}
            </span>
          </button>

          <button
            onClick={() => setActiveCatalogTab('pending')}
            className={`px-5 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
              activeCatalogTab === 'pending'
                ? 'border-amber-600 text-amber-900 bg-amber-50/60 shadow-2xs'
                : 'border-transparent text-stone-500 hover:text-amber-800'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Pending Approvals</span>
            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-extrabold ${
              pendingProducts.length > 0 
                ? 'bg-amber-500 text-white animate-pulse' 
                : 'bg-stone-200 text-stone-700'
            }`}>
              {pendingProducts.length}
            </span>
          </button>
        </div>

        {/* TAB 1: PENDING APPROVALS QUEUE */}
        {activeCatalogTab === 'pending' && (
          <div className="space-y-4">
            
            {/* Banner guidance */}
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start justify-between gap-3 text-xs text-amber-950">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold">Seller Product Moderation Queue</h4>
                  <p className="text-amber-900 mt-0.5">
                    Review botanical remedies submitted by herbal sellers. When approving, assign the appropriate Category so it displays correctly in the customer shop catalog.
                  </p>
                </div>
              </div>
              <button
                onClick={loadData}
                className="px-3 py-1.5 rounded-lg border border-amber-300 hover:bg-amber-100 text-amber-900 font-semibold text-xs flex items-center gap-1.5 cursor-pointer flex-shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Queue</span>
              </button>
            </div>

            {loading ? (
              <div className="bg-white rounded-xl border border-[#e2ede4] p-12 text-center shadow-xs">
                <div className="w-8 h-8 border-3 border-amber-600/30 border-t-amber-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-[#526e57] font-medium">Checking pending seller submissions...</p>
              </div>
            ) : filteredPendingProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#e2ede4] p-12 text-center shadow-xs space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto shadow-2xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#1c3f24]">
                  All Seller Products Moderated!
                </h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  There are currently no pending products awaiting review. When registered sellers submit new botanicals, they will appear here for category assignment and approval.
                </p>
                <button
                  onClick={() => setActiveCatalogTab('approved')}
                  className="mt-2 px-4 py-2 rounded-lg bg-[#24492d] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#1a3821] transition-colors cursor-pointer"
                >
                  View Approved Catalog
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#e2ede4] shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#fafcfa] border-b border-[#e2ede4] text-[11px] uppercase font-bold text-[#455c49] tracking-wider">
                        <th className="py-3.5 px-6">Product & Seller</th>
                        <th className="py-3.5 px-6">Submitted Price</th>
                        <th className="py-3.5 px-6">Stock & Specs</th>
                        <th className="py-3.5 px-6">Status</th>
                        <th className="py-3.5 px-6 text-right">Moderation Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf2ed] text-xs">
                      {filteredPendingProducts.map((prod) => (
                        <tr key={prod.id} className="hover:bg-[#fafcfa] transition-colors">
                          
                          {/* Product & Seller */}
                          <td className="py-4 px-6">
                            <div className="flex items-start gap-3">
                              <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-[#cfe0d1] bg-[#f0f5f1] flex-shrink-0">
                                {isValidImageUrl(prod.imageUrl) ? (
                                  <Image
                                    src={prod.imageUrl}
                                    alt={prod.name}
                                    fill
                                    sizes="56px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[#75947b]">
                                    <Package className="w-5 h-5" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-[13px] text-[#1c3f24]">
                                  {prod.name}
                                </h4>
                                <p className="text-[11px] text-stone-500 line-clamp-2 max-w-sm mt-0.5">
                                  {prod.description || 'No description'}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-[11px]">
                                  <span className="inline-flex items-center gap-1 text-[#24492d] font-semibold bg-[#edf5ee] px-2 py-0.5 rounded-full border border-[#d6e5d8]">
                                    <User className="w-3 h-3" />
                                    <span>Seller: <strong>{prod.sellerName || 'Herbal Seller'}</strong></span>
                                  </span>
                                  {prod.createdAt && (
                                    <span className="text-stone-400">
                                      {new Date(prod.createdAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Price */}
                          <td className="py-4 px-6">
                            <div className="font-bold text-sm text-[#1c3f24]">
                              ${Number(prod.price).toFixed(2)}
                            </div>
                            {prod.weight && (
                              <div className="text-[11px] text-[#24492d] font-semibold bg-[#edf5ee] px-1.5 py-0.5 rounded inline-block mt-0.5 border border-[#d2e4d5]">
                                {prod.weight}
                              </div>
                            )}
                          </td>

                          {/* Stock & Specs */}
                          <td className="py-4 px-6 text-stone-600">
                            <div><strong>{prod.stockQuantity}</strong> total units</div>
                            {prod.variants && prod.variants.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mt-1 max-w-xs">
                                {prod.variants.map((v, i) => (
                                  <span key={i} className="text-[10px] bg-[#f0f5f1] text-[#24492d] px-1.5 py-0.5 rounded border border-[#cfe0d1]">
                                    {v.weight}: ${v.price.toFixed(2)} ({v.stockQuantity}u)
                                  </span>
                                ))}
                              </div>
                            ) : null}
                            {prod.ingredients && (
                              <div className="text-[10px] text-stone-400 truncate max-w-xs mt-1">
                                Ing: {prod.ingredients}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending Review</span>
                            </span>
                          </td>

                          {/* Action Button */}
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleOpenApprove(prod)}
                              className="px-4 py-2 bg-[#24492d] hover:bg-[#193721] text-white text-xs font-bold tracking-wider uppercase rounded-lg shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-[#86efac]" />
                              <span>Review & Approve</span>
                            </button>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: APPROVED CATALOG */}
        {activeCatalogTab === 'approved' && (
          <div className="space-y-4">
            
            {/* Toolbar: Search, Filters, Views, and Add Product */}
            <div className="bg-white p-4 rounded-xl border border-[#e2ede4] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
              
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
                {/* Search Input */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search products, ingredients..."
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#ccdacc] bg-[#fafcfa] text-[#1c3f24] focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d]"
                  />
                </div>

                {/* Category Dropdown Filter */}
                <div className="relative w-full sm:w-56">
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#ccdacc] bg-[#fafcfa] text-[#1c3f24] focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d]"
                  >
                    <option value="all">All Botanical Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* View Switches & Add Button */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {/* Table vs Grid toggle */}
                <div className="flex items-center border border-[#ccdacc] rounded-lg p-0.5 bg-[#fafcfa]">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-md transition-colors ${
                      viewMode === 'table' ? 'bg-white shadow-xs text-[#24492d]' : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title="Table View"
                  >
                    <TableIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-colors ${
                      viewMode === 'grid' ? 'bg-white shadow-xs text-[#24492d]' : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>

                {/* Refresh Button */}
                <button
                  onClick={loadData}
                  className="p-2 border border-[#ccdacc] rounded-lg hover:bg-[#edf5ee] text-[#24492d] transition-colors cursor-pointer"
                  title="Reload Products"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>

                {/* Add Product Button */}
                <button
                  onClick={handleOpenCreate}
                  className="px-4 py-2.5 bg-[#24492d] hover:bg-[#193721] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            {/* Main Products List Area */}
            {loading ? (
              <div className="bg-white rounded-xl border border-[#e2ede4] p-12 text-center shadow-xs">
                <div className="w-8 h-8 border-3 border-[#24492d]/30 border-t-[#24492d] rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-[#526e57] font-medium">Synchronizing catalog with PostgreSQL backend...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#e2ede4] p-12 text-center shadow-xs">
                <div className="w-14 h-14 rounded-full bg-[#edf5ee] flex items-center justify-center text-[#24492d] mx-auto mb-3">
                  <Package className="w-7 h-7" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#1c3f24] mb-1">
                  No products found
                </h3>
                <p className="text-xs text-[#637f69] max-w-sm mx-auto mb-5">
                  {searchTerm || selectedCategoryFilter !== 'all'
                    ? 'No products matched your search or category filter.'
                    : 'Your approved catalog is empty. Click "Add Product" or approve pending submissions.'}
                </p>
                <button
                  onClick={handleOpenCreate}
                  className="px-5 py-2.5 bg-[#24492d] text-white text-xs font-bold rounded-lg hover:bg-[#1a3821] transition-colors uppercase tracking-wider cursor-pointer"
                >
                  Add New Product
                </button>
              </div>
            ) : viewMode === 'table' ? (
              /* TABLE VIEW */
              <div className="bg-white rounded-xl border border-[#e2ede4] shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#f5f8f5] border-b border-[#e2ede4] text-[11px] uppercase font-bold text-[#455c49] tracking-wider">
                        <th className="py-3.5 px-6">Product</th>
                        <th className="py-3.5 px-6">Category</th>
                        <th className="py-3.5 px-6">Price</th>
                        <th className="py-3.5 px-6">Weight/Specs</th>
                        <th className="py-3.5 px-6">Stock Status</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf2ed] text-xs">
                      {filteredProducts.map((prod) => {
                        const isLowStock = prod.stockQuantity <= 10 && prod.stockQuantity > 0;
                        const isOutOfStock = prod.stockQuantity === 0;

                        return (
                          <tr key={prod.id} className="hover:bg-[#fafcfa] transition-colors group">
                            
                            {/* Image + Title */}
                            <td className="py-3.5 px-6">
                              <div className="flex items-center gap-3">
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#cfe0d1] bg-[#f0f5f1] flex-shrink-0">
                                  {isValidImageUrl(prod.imageUrl) ? (
                                    <Image
                                      src={prod.imageUrl}
                                      alt={prod.name}
                                      fill
                                      sizes="48px"
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[#75947b]">
                                      <Tag className="w-4 h-4" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-semibold text-[13px] text-[#1c3f24] group-hover:text-[#2d6139] transition-colors">
                                    {prod.name}
                                  </h4>
                                  <p className="text-[11px] text-[#697f6f] line-clamp-1 max-w-xs">
                                    {prod.description || 'No description'}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Category & Wellness Need */}
                            <td className="py-3.5 px-6">
                              <div className="flex flex-col gap-1 items-start">
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#edf5ee] text-[#24492d] border border-[#d2e4d5]">
                                  {prod.categoryName || 'Botanical'}
                                </span>
                                {(prod.wellnessNeedName || prod.wellnessNeed) && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#fbf5e8] text-[#8a5d1b] border border-[#f0debb]">
                                    <Sparkles className="w-2.5 h-2.5 text-[#b58129]" />
                                    <span>{prod.wellnessNeedName || prod.wellnessNeed}</span>
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Price */}
                            <td className="py-3.5 px-6">
                              <div className="font-bold text-[13px] text-[#1c3f24]">
                                ${Number(prod.price).toFixed(2)}
                              </div>
                              {prod.weight && (
                                <div className="text-[11px] text-[#24492d] font-semibold bg-[#edf5ee] px-1.5 py-0.5 rounded inline-block mt-0.5 border border-[#d2e4d5]">
                                  {prod.weight}
                                </div>
                              )}
                            </td>

                            {/* Weight & Variants */}
                            <td className="py-3.5 px-6">
                              {prod.variants && prod.variants.length > 0 ? (
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {prod.variants.map((v, i) => (
                                    <span key={i} className="inline-flex items-center text-[10px] font-medium bg-[#f0f5f1] text-[#24492d] px-1.5 py-0.5 rounded border border-[#cfe0d1]">
                                      {v.weight}: ${v.price.toFixed(2)} ({v.stockQuantity}u)
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[#5b7360]">{prod.weight || '—'}</span>
                              )}
                            </td>

                            {/* Stock */}
                            <td className="py-3.5 px-6">
                              <div className="flex flex-col gap-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold w-fit ${
                                  isOutOfStock
                                    ? 'bg-red-100 text-red-700'
                                    : isLowStock
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-[#e2ede4] text-[#1c3f24]'
                                }`}>
                                  {isOutOfStock ? 'Out of Stock' : `${prod.stockQuantity} in stock`}
                                </span>
                                {prod.variants && prod.variants.length > 1 && (
                                  <span className="text-[10px] text-[#697f6f]">
                                    Across {prod.variants.length} options
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-6 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <Link
                                  href={`/shop/${prod.id}`}
                                  target="_blank"
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#1c3f24] hover:bg-[#edf5ee] transition-colors"
                                  title="View in Customer Store"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Link>
                                <button
                                  onClick={() => handleOpenEdit(prod)}
                                  className="p-1.5 rounded-lg text-[#24492d] hover:bg-[#edf4ee] border border-transparent hover:border-[#ccdacc] transition-all cursor-pointer"
                                  title="Edit Product"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleOpenDelete(prod)}
                                  className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                                  title="Delete Product"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* GRID VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-white rounded-xl border border-[#e2ede4] overflow-hidden shadow-xs hover:shadow-md hover:border-[#24492d] transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative w-full aspect-square bg-[#f6f9f6] overflow-hidden">
                        {isValidImageUrl(prod.imageUrl) ? (
                          <Image
                            src={prod.imageUrl}
                            alt={prod.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 300px"
                            className="object-cover hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#75947b]">
                            <Package className="w-10 h-10" />
                          </div>
                        )}
                        <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-xs text-[#24492d] shadow-xs">
                          {prod.categoryName || 'Herbal'}
                        </span>
                      </div>

                      <div className="p-4 space-y-2">
                        <h3 className="font-serif text-base font-bold text-[#1c3f24] line-clamp-1">
                          {prod.name}
                        </h3>
                        <p className="text-xs text-[#526856] line-clamp-2 leading-relaxed">
                          {prod.description || 'No description provided.'}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-base font-bold text-[#1c3f24]">
                            ${Number(prod.price).toFixed(2)}
                          </span>
                          <span className="text-[11px] text-[#24492d] bg-[#edf5ee] px-2 py-0.5 rounded border border-[#d2e4d5] font-semibold">
                            {prod.weight || 'Standard'}
                          </span>
                        </div>
                        {prod.variants && prod.variants.length > 1 && (
                          <div className="text-[10px] text-[#557159] font-medium">
                            {prod.variants.length} weight options available
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 pt-3 border-t border-[#f0f4f0] flex items-center justify-between bg-[#fbfdfb]">
                      <span className={`text-[11px] font-semibold ${prod.stockQuantity > 0 ? 'text-[#2a5933]' : 'text-red-600'}`}>
                        {prod.stockQuantity > 0 ? `${prod.stockQuantity} in stock` : 'Out of stock'}
                      </span>

                      <div className="flex items-center gap-1">
                        <Link
                          href={`/shop/${prod.id}`}
                          target="_blank"
                          className="p-1.5 text-gray-400 hover:text-[#1c3f24] hover:bg-[#edf5ee] rounded-md transition-colors"
                          title="View"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(prod)}
                          className="p-1.5 rounded-md text-[#24492d] hover:bg-[#edf4ee] transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(prod)}
                          className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </div>

      {/* Product Modal (Create / Edit) */}
      <ProductModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveProduct}
        initialData={selectedProduct}
        categories={categories}
        wellnessNeeds={wellnessNeeds}
        mode={modalMode}
      />

      {/* Product Delete Modal */}
      <ProductDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        product={productToDelete}
      />

      {/* Approve Product & Assign Category Modal */}
      <ApproveProductModal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        product={productToApprove}
        categories={categories}
        wellnessNeeds={wellnessNeeds}
        onApprove={handleConfirmApprove}
        onReject={handleConfirmReject}
        onCategoryCreated={handleCategoryCreated}
        onWellnessNeedCreated={(newNeed) => setWellnessNeeds((prev) => [newNeed, ...prev])}
      />

    </div>
  );
}
