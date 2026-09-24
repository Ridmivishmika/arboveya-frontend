'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Plus, Search, Edit3, Trash2, RefreshCw, LayoutGrid, List, 
  FolderTree, CheckCircle2, ArrowLeft, Tag, Image as ImageIcon
} from 'lucide-react';
import { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types';
import { getCategories, createCategory, updateCategory, deleteCategory, getAdminToken, resolveBackendImageUrl } from '@/lib/api';
import CategoryModal from '@/components/admin/CategoryModal';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import AdminHeader from '@/components/admin/AdminHeader';

export default function CategoryAdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const showToast = (text: string, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadCategories = async (query?: string) => {
    try {
      setLoading(true);
      const data = await getCategories(query);
      setCategories(data);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load categories from backend: ' + err.message, true);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAdminToken();
    loadCategories(searchTerm);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCategories(searchTerm);
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const q = searchTerm.toLowerCase();
    return categories.filter(
      c => c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, searchTerm]);

  // CREATE
  const handleOpenCreate = () => {
    setSelectedCategory(null);
    setModalMode('create');
    setModalOpen(true);
  };

  // EDIT
  const handleOpenEdit = (cat: Category) => {
    setSelectedCategory(cat);
    setModalMode('edit');
    setModalOpen(true);
  };

  // DELETE
  const handleOpenDelete = (cat: Category) => {
    setCategoryToDelete(cat);
    setDeleteModalOpen(true);
  };

  // Modal Submit (Real Backend API Call)
  const handleSaveCategory = async (data: CreateCategoryInput | UpdateCategoryInput) => {
    if (modalMode === 'create') {
      const created = await createCategory(data);
      setCategories(prev => [created, ...prev]);
      showToast(`Category "${data.name}" created in database!`);
    } else if (modalMode === 'edit' && selectedCategory) {
      const updated = await updateCategory(selectedCategory.id, data);
      setCategories(prev => prev.map(c => c.id === selectedCategory.id ? updated : c));
      showToast(`Category updated to "${data.name}"!`);
    }
  };

  // Delete Confirm (Real Backend API Call)
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory(categoryToDelete.id);
      setCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));
      showToast(`Category "${categoryToDelete.name}" deleted from database.`);
    } catch (err: any) {
      showToast(err.message || 'Cannot delete category (it may have linked products).', true);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faf7] text-[#1c3f24] pb-20">
      
      {/* Toast Banner */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl text-white text-xs font-semibold shadow-2xl animate-fadeIn ${
          toastMessage.isError ? 'bg-red-700 border border-red-800' : 'bg-[#1c3f24] border border-[#2e5e39]'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-[#8bd19a]" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Unified Admin Navigation Header */}
      <AdminHeader activeTab="categories" categoryCount={categories.length} />

      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#17381f] via-[#1f4728] to-[#2b5936] text-white py-10 shadow-sm border-b border-[#14301a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-md bg-white/10 text-[#d8c28c]">
                <FolderTree className="w-5 h-5" />
              </span>
              <span className="text-[11px] tracking-[0.2em] font-semibold text-[#d4bd8a] uppercase">
                Product Catalog Hierarchy
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Category Management
            </h1>
            <p className="text-xs sm:text-sm text-[#b8d1be] max-w-xl">
              Create and manage herbal wellness categories with custom circular images. Linked in real-time with the ASP.NET Core backend and PostgreSQL.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#c7a45e] hover:bg-[#b8954f] text-[#142e1a] text-xs font-bold tracking-[0.14em] rounded-lg shadow-md transition-all uppercase active:scale-98 self-start md:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Search & View Controls */}
        <div className="bg-white p-4 rounded-xl border border-[#e2eae2] shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#758b7a]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search category name or description..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-[#ccdacc] bg-[#fafcfa] text-[#1c3f24] placeholder-[#7e9483] focus:outline-none focus:border-[#24492d] focus:ring-1 focus:ring-[#24492d]"
            />
          </form>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => loadCategories(searchTerm)}
              className="p-2 rounded-lg border border-[#ccdacc] text-[#3d5441] hover:bg-[#f2f6f2] transition-colors"
              title="Refresh categories"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#24492d]' : ''}`} />
            </button>

            <div className="flex border border-[#ccdacc] rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 ${viewMode === 'table' ? 'bg-[#24492d] text-white' : 'bg-white text-[#526c56] hover:bg-[#f2f6f2]'}`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-[#24492d] text-white' : 'bg-white text-[#526c56] hover:bg-[#f2f6f2]'}`}
                title="Grid Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Categories Presentation */}
        {loading ? (
          <div className="bg-white rounded-xl border border-[#e2eae2] p-12 text-center">
            <div className="w-8 h-8 border-3 border-[#24492d]/20 border-t-[#24492d] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-[#5f7564] font-medium">Fetching categories from backend...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#e2eae2] p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-[#f2f6f2] text-[#375a3c] flex items-center justify-center mx-auto mb-4">
              <FolderTree className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#1c3f24] mb-1">
              No categories in backend database
            </h3>
            <p className="text-xs text-[#697f6f] max-w-sm mx-auto mb-6 leading-relaxed">
              {searchTerm 
                ? `No categories matching "${searchTerm}". Try a different keyword.`
                : 'Click "Add New Category" to create your first real category in PostgreSQL.'}
            </p>
            <button
              onClick={handleOpenCreate}
              className="px-5 py-2.5 bg-[#24492d] text-white text-xs font-bold rounded-lg hover:bg-[#1a3821] transition-colors uppercase tracking-wider"
            >
              Add New Category
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* TABLE VIEW */
          <div className="bg-white rounded-xl border border-[#e2eae2] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f5f8f5] border-b border-[#e2eae2] text-[11px] uppercase font-bold text-[#455c49] tracking-wider">
                    <th className="py-3.5 px-6">Image</th>
                    <th className="py-3.5 px-6">Category Name</th>
                    <th className="py-3.5 px-6">Description</th>
                    <th className="py-3.5 px-6">Created</th>
                    <th className="py-3.5 px-6">Updated</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf2ed] text-xs">
                  {filteredCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-[#fafcfa] transition-colors">
                      
                      {/* Round Image column */}
                      <td className="py-3.5 px-6">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#cce0ce] bg-[#f0f5f1] flex items-center justify-center shadow-xs">
                          {cat.imageUrl ? (
                            <Image
                              src={resolveBackendImageUrl(cat.imageUrl)}
                              alt={cat.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <Tag className="w-4 h-4 text-[#75947b]" />
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6 font-semibold text-[#1c3f24]">
                        <span className="font-medium text-[13px] capitalize">{cat.name}</span>
                      </td>

                      <td className="py-4 px-6 text-[#526856] max-w-xs truncate" title={cat.description || ''}>
                        {cat.description || <span className="text-gray-400 italic">No description</span>}
                      </td>

                      <td className="py-4 px-6 text-[#697f6f] whitespace-nowrap">
                        {new Date(cat.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-6 text-[#697f6f] whitespace-nowrap">
                        {cat.updatedAt ? new Date(cat.updatedAt).toLocaleDateString() : <span className="text-gray-400">â€”</span>}
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(cat)}
                            className="p-1.5 rounded-lg text-[#24492d] hover:bg-[#edf4ee] border border-transparent hover:border-[#ccdacc] transition-all"
                            title="Edit Category"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(cat)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* GRID CARD VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCategories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white rounded-xl border border-[#e2eae2] p-5 shadow-xs hover:shadow-md hover:border-[#24492d] transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    {/* Round Image Avatar */}
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#24492d]/30 bg-[#edf4ee] flex items-center justify-center flex-shrink-0 shadow-sm">
                      {cat.imageUrl ? (
                        <Image
                          src={resolveBackendImageUrl(cat.imageUrl)}
                          alt={cat.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <FolderTree className="w-5 h-5 text-[#24492d]" />
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 rounded-md text-[#24492d] hover:bg-[#edf4ee] transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(cat)}
                        className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-serif text-base font-bold text-[#1c3f24] capitalize mb-1.5">
                    {cat.name}
                  </h3>

                  <p className="text-xs text-[#526856] leading-relaxed line-clamp-3 mb-4">
                    {cat.description || <span className="text-gray-400 italic">No description provided.</span>}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#f0f4f0] flex items-center justify-between text-[10px] text-[#788e7d]">
                  <span>Added {new Date(cat.createdAt).toLocaleDateString()}</span>
                  {cat.updatedAt && <span>Edited {new Date(cat.updatedAt).toLocaleDateString()}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Category Create / Edit Modal */}
      <CategoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveCategory}
        initialData={selectedCategory}
        mode={modalMode}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        category={categoryToDelete}
      />

    </div>
  );
}

