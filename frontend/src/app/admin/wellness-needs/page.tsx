'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Plus, Search, Edit3, Trash2, RefreshCw, LayoutGrid, List, 
  Sparkles, CheckCircle2, ArrowLeft, ShieldPlus, HeartHandshake, Layers
} from 'lucide-react';
import { WellnessNeed, CreateWellnessNeedInput, UpdateWellnessNeedInput } from '@/types';
import { getWellnessNeeds, createWellnessNeed, updateWellnessNeed, deleteWellnessNeed, getAdminToken } from '@/lib/api';
import WellnessNeedModal from '@/components/admin/WellnessNeedModal';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import AdminHeader from '@/components/admin/AdminHeader';

export default function WellnessNeedsAdminPage() {
  const [wellnessNeeds, setWellnessNeeds] = useState<WellnessNeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedNeed, setSelectedNeed] = useState<WellnessNeed | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [needToDelete, setNeedToDelete] = useState<WellnessNeed | null>(null);

  const showToast = (text: string, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadWellnessNeeds = async (query?: string) => {
    try {
      setLoading(true);
      const data = await getWellnessNeeds(query);
      setWellnessNeeds(data);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load wellness needs: ' + err.message, true);
      setWellnessNeeds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAdminToken();
    loadWellnessNeeds(searchTerm);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadWellnessNeeds(searchTerm);
  };

  const filteredNeeds = useMemo(() => {
    if (!searchTerm.trim()) return wellnessNeeds;
    const q = searchTerm.toLowerCase();
    return wellnessNeeds.filter(
      w => (w.name && w.name.toLowerCase().includes(q)) || 
           (w.title && w.title.toLowerCase().includes(q)) ||
           (w.description && w.description.toLowerCase().includes(q)) ||
           (w.subtitle && w.subtitle.toLowerCase().includes(q))
    );
  }, [wellnessNeeds, searchTerm]);

  // CREATE
  const handleOpenCreate = () => {
    setSelectedNeed(null);
    setModalMode('create');
    setModalOpen(true);
  };

  // EDIT
  const handleOpenEdit = (need: WellnessNeed) => {
    setSelectedNeed(need);
    setModalMode('edit');
    setModalOpen(true);
  };

  // DELETE
  const handleOpenDelete = (need: WellnessNeed) => {
    setNeedToDelete(need);
    setDeleteModalOpen(true);
  };

  // Modal Submit
  const handleSaveNeed = async (data: CreateWellnessNeedInput | UpdateWellnessNeedInput) => {
    if (modalMode === 'create') {
      const created = await createWellnessNeed(data);
      setWellnessNeeds(prev => [created, ...prev]);
      showToast(`Wellness Need "${data.name}" created in database!`);
    } else if (modalMode === 'edit' && selectedNeed) {
      const updated = await updateWellnessNeed(selectedNeed.id, data);
      setWellnessNeeds(prev => prev.map(w => w.id === selectedNeed.id ? updated : w));
      showToast(`Wellness Need updated to "${data.name}"!`);
    }
  };

  // Delete Confirm
  const handleConfirmDelete = async () => {
    if (!needToDelete) return;
    try {
      await deleteWellnessNeed(needToDelete.id);
      setWellnessNeeds(prev => prev.filter(w => w.id !== needToDelete.id));
      showToast(`Wellness Need "${needToDelete.name || needToDelete.title}" deleted.`);
    } catch (err: any) {
      showToast(err.message || 'Cannot delete wellness need (it may have linked products).', true);
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
      <AdminHeader activeTab="wellness-needs" wellnessNeedsCount={wellnessNeeds.length} />

      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#17381f] via-[#1f4728] to-[#2b5936] text-white py-10 shadow-sm border-b border-[#14301a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-md bg-white/10 text-[#d8c28c]">
                <Sparkles className="w-5 h-5" />
              </span>
              <span className="text-[11px] tracking-[0.2em] font-semibold text-[#d4bd8a] uppercase">
                Therapeutic Botanical Goals
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Wellness Need Management
            </h1>
            <p className="text-xs sm:text-sm text-[#b8d1be] max-w-xl">
              Organize herbal remedies and botanicals by specific therapeutic wellness benefits. Assigned by Admin upon reviewing seller submissions.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#c7a45e] hover:bg-[#b8954f] text-[#142e1a] text-xs font-bold tracking-[0.14em] rounded-lg shadow-md transition-all uppercase active:scale-98 self-start md:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Wellness Need</span>
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
              placeholder="Search wellness need or therapeutic goal..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-[#ccdacc] bg-[#fafcfa] text-[#1c3f24] placeholder-[#7e9483] focus:outline-none focus:border-[#24492d] focus:ring-1 focus:ring-[#24492d]"
            />
          </form>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => loadWellnessNeeds(searchTerm)}
              className="p-2 rounded-lg border border-[#ccdacc] text-[#3d5441] hover:bg-[#f2f6f2] transition-colors cursor-pointer"
              title="Refresh wellness needs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <div className="flex items-center border border-[#ccdacc] rounded-lg p-0.5 bg-[#f8faf8]">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-[#24492d] text-white shadow-xs' : 'text-[#506c54] hover:text-[#1c3f24]'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-[#24492d] text-white shadow-xs' : 'text-[#506c54] hover:text-[#1c3f24]'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Display */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#506c54]">
            <div className="w-8 h-8 border-3 border-[#24492d] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Loading wellness needs from database...</span>
          </div>
        ) : filteredNeeds.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-[#e2eae2] p-8 shadow-xs">
            <Sparkles className="w-12 h-12 text-[#9bb89f] mx-auto mb-3 stroke-[1.5]" />
            <h3 className="font-serif text-lg font-bold text-[#1c3f24] mb-1">No Wellness Needs Found</h3>
            <p className="text-xs text-[#506c54] max-w-md mx-auto mb-5">
              {searchTerm 
                ? `No wellness needs match "${searchTerm}". Try a different keyword.` 
                : 'No botanical therapeutic targets found. Add your first wellness need to get started.'}
            </p>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#24492d] hover:bg-[#1a3821] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Wellness Need</span>
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* TABLE VIEW */
          <div className="bg-white rounded-xl border border-[#e2eae2] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#edf5ee] border-b border-[#dde8df] text-[#1c3f24] font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-5">Target Name & Therapeutic Scope</th>
                    <th className="py-3.5 px-5">Icon Indicator</th>
                    <th className="py-3.5 px-5 text-center">Linked Products</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf2ed]">
                  {filteredNeeds.map((need) => {
                    const displayName = need.name || need.title || 'Untitled';
                    const displayDesc = need.description || need.subtitle || 'General Botanical Care';
                    return (
                      <tr key={need.id} className="hover:bg-[#f9fbf9] transition-colors group">
                        
                        {/* Name & Subtitle */}
                        <td className="py-4 px-5">
                          <div className="font-bold text-[#1c3f24] text-sm group-hover:text-[#24492d] transition-colors">
                            {displayName}
                          </div>
                          <div className="text-[11px] text-[#557159] mt-0.5 line-clamp-1">
                            {displayDesc}
                          </div>
                        </td>

                        {/* Icon slug */}
                        <td className="py-4 px-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#edf5ee] text-[#1c3f24] border border-[#bcd2bf]">
                            <Sparkles className="w-3 h-3 text-[#24492d]" />
                            <span>{need.icon || 'shield-plus'}</span>
                          </span>
                        </td>

                        {/* Product Count */}
                        <td className="py-4 px-5 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#edf5ee] text-[#1c3f24]">
                            {need.productCount || 0}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(need)}
                              className="p-1.5 rounded-lg border border-[#ccdacc] text-[#3b5940] hover:bg-[#edf5ee] transition-colors cursor-pointer"
                              title="Edit Wellness Need"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenDelete(need)}
                              className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete Wellness Need"
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
          </div>
        ) : (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredNeeds.map((need) => {
              const displayName = need.name || need.title || 'Untitled';
              const displayDesc = need.description || need.subtitle || 'General Botanical Care';
              return (
                <div 
                  key={need.id}
                  className="bg-white rounded-2xl border border-[#e2eae2] p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#edf5ee] border border-[#bcd2bf] flex items-center justify-center text-[#24492d]">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#edf5ee] text-[#1c3f24]">
                        {need.productCount || 0} Products
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-[#1c3f24] group-hover:text-[#24492d] transition-colors mb-1">
                      {displayName}
                    </h3>
                    <p className="text-xs text-[#526f57] line-clamp-2">
                      {displayDesc}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#edf2ed] flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-[#66856c] uppercase tracking-wider">
                      Icon: {need.icon || 'shield-plus'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(need)}
                        className="p-1.5 rounded-lg border border-[#ccdacc] text-[#3b5940] hover:bg-[#edf5ee] transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(need)}
                        className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Create / Edit Modal */}
      <WellnessNeedModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveNeed}
        initialData={selectedNeed}
        mode={modalMode}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Wellness Need"
        message={`Are you sure you want to delete the wellness need "${needToDelete?.name || needToDelete?.title}"? Linked products will have their wellness need unassigned.`}
      />

    </div>
  );
}
