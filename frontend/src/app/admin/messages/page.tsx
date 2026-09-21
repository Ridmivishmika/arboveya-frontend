'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Eye, 
  Mail, 
  Phone, 
  Calendar, 
  User, 
  Store, 
  Sparkles, 
  AlertCircle, 
  X,
  Send,
  Loader2,
  Check
} from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import { useAuth } from '@/context/AuthContext';
import { getContactMessages, updateContactMessageStatus, deleteContactMessage } from '@/lib/api';
import { ContactMessage } from '@/types';

export default function AdminMessagesPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');

  // Selected message for details modal
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Security guard: Admin only
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'Admin')) {
      router.replace('/admin/login');
    }
  }, [user, authLoading, router]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await getContactMessages(
        statusFilter !== 'All' ? statusFilter : undefined,
        search.trim() || undefined,
        token || undefined
      );
      setMessages(data);
    } catch (err) {
      console.error('Failed to load inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'Admin') {
      loadMessages();
    }
  }, [user, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadMessages();
  };

  const handleOpenModal = async (msg: ContactMessage) => {
    setSelectedMessage(msg);
    setAdminNotes(msg.adminNotes || '');

    // If unread, automatically mark as read
    if (msg.status === 'Unread') {
      try {
        const updated = await updateContactMessageStatus(msg.id, 'Read', msg.adminNotes, token || undefined);
        setMessages(prev => prev.map(m => m.id === msg.id ? updated : m));
        setSelectedMessage(updated);
      } catch (err) {
        console.error('Failed to auto-mark read:', err);
      }
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedMessage) return;
    try {
      setUpdatingStatus(true);
      const updated = await updateContactMessageStatus(
        selectedMessage.id,
        newStatus,
        adminNotes.trim() || undefined,
        token || undefined
      );
      setMessages(prev => prev.map(m => m.id === selectedMessage.id ? updated : m));
      setSelectedMessage(updated);
      setActionSuccess(`Inquiry status updated to ${newStatus}.`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this inquiry?')) return;
    try {
      await deleteContactMessage(id, token || undefined);
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    } catch (err) {
      console.error('Failed to delete inquiry:', err);
    }
  };

  // Filtered by role client-side
  const filteredMessages = messages.filter(m => {
    if (roleFilter === 'All') return true;
    return m.userType?.toLowerCase() === roleFilter.toLowerCase();
  });

  const unreadCount = messages.filter(m => m.status === 'Unread').length;

  return (
    <div className="min-h-screen bg-[#f7faf7] text-[#1c3f24] font-sans">
      <AdminHeader activeTab="messages" unreadMessagesCount={unreadCount} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Top Header & Overview */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2eae2] pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🌿</span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1c3f24]">
                Customer & Seller Inquiries
              </h1>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Review and manage incoming communications sent to the Arboveya administration desk.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3.5 py-1.5 rounded-xl bg-white border border-[#dce6dc] shadow-2xs text-xs font-semibold">
              <span className="text-stone-500">Total:</span> <span className="font-bold text-[#1c3f24]">{messages.length}</span>
            </div>
            {unreadCount > 0 && (
              <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 shadow-2xs text-xs font-bold text-amber-800 flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>{unreadCount} Unread</span>
              </div>
            )}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e2eae2] shadow-2xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="md:col-span-6 relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, subject, or message..."
                className="w-full pl-9 pr-20 py-2.5 text-xs rounded-xl border border-[#ccdacc] bg-[#f9fbf9] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d] transition"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 px-3 py-1.5 bg-[#24492d] hover:bg-[#1a3821] text-white text-[11px] font-bold rounded-lg transition"
              >
                Search
              </button>
            </form>

            {/* Status Filter */}
            <div className="md:col-span-3 flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-stone-500 whitespace-nowrap">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#ccdacc] bg-white focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 text-[#1c3f24] font-medium"
              >
                <option value="All">All Inquiries</option>
                <option value="Unread">Unread</option>
                <option value="Read">Read</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {/* Role Filter */}
            <div className="md:col-span-3 flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-stone-500 whitespace-nowrap">Sender:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#ccdacc] bg-white focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 text-[#1c3f24] font-medium"
              >
                <option value="All">All Senders</option>
                <option value="Buyer">Buyers Only</option>
                <option value="Seller">Herbal Sellers Only</option>
                <option value="General">General Inquiries</option>
              </select>
            </div>

          </div>
        </div>

        {/* Inquiries Table */}
        <div className="bg-white rounded-2xl border border-[#e2eae2] shadow-2xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#24492d] animate-spin mx-auto" />
              <p className="text-xs text-stone-500 font-medium">Loading inquiries...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#edf5ee] text-[#24492d] flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#1c3f24]">No Inquiries Found</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                {search || statusFilter !== 'All' || roleFilter !== 'All'
                  ? 'No messages match your active filters. Try adjusting search terms.'
                  : 'Your inbox is clear. Messages submitted from the Contact Us page will appear here.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f3f7f3] border-b border-[#e2eae2] text-[#4b6350] uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Sender</th>
                    <th className="px-5 py-3.5">Role</th>
                    <th className="px-5 py-3.5">Subject & Message</th>
                    <th className="px-5 py-3.5">Received</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef2ee]">
                  {filteredMessages.map((msg) => {
                    const isUnread = msg.status === 'Unread';
                    return (
                      <tr 
                        key={msg.id} 
                        className={`hover:bg-[#fafcfa] transition-colors cursor-pointer ${isUnread ? 'bg-amber-50/30 font-semibold' : ''}`}
                        onClick={() => handleOpenModal(msg)}
                      >
                        {/* Status Badge */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            msg.status === 'Unread'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : msg.status === 'Resolved'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-stone-100 text-stone-700 border border-stone-200'
                          }`}>
                            {msg.status === 'Unread' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                            {msg.status === 'Resolved' && <Check className="w-3 h-3 text-emerald-700" />}
                            <span>{msg.status}</span>
                          </span>
                        </td>

                        {/* Sender Info */}
                        <td className="px-5 py-4">
                          <div className="font-bold text-[#1c3f24]">{msg.name}</div>
                          <div className="text-[11px] text-stone-500">{msg.email}</div>
                          {msg.phoneNumber && (
                            <div className="text-[10px] text-stone-400 mt-0.5">{msg.phoneNumber}</div>
                          )}
                        </td>

                        {/* Sender Role */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            msg.userType === 'Seller'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : msg.userType === 'Buyer'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-emerald-50 text-[#1c3f24] border border-emerald-200'
                          }`}>
                            {msg.userType === 'Seller' ? '🏪 Seller' : msg.userType === 'Buyer' ? '🌿 Buyer' : '✉️ General'}
                          </span>
                        </td>

                        {/* Subject & Snippet */}
                        <td className="px-5 py-4 max-w-xs sm:max-w-md">
                          <div className="font-bold text-[#1c3f24] truncate">{msg.subject}</div>
                          <div className="text-[11px] text-stone-500 truncate mt-0.5 font-normal">
                            {msg.message}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-5 py-4 whitespace-nowrap text-stone-400 text-[11px]">
                          {new Date(msg.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenModal(msg)}
                              className="p-1.5 rounded-lg text-stone-500 hover:text-[#24492d] hover:bg-[#edf5ee] transition cursor-pointer"
                              title="View full inquiry"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <a
                              href={`mailto:${msg.email}?subject=${encodeURIComponent('Re: ' + msg.subject)}`}
                              className="p-1.5 rounded-lg text-stone-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                              title="Reply via Email client"
                            >
                              <Mail className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => handleDelete(msg.id)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Delete inquiry"
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
          )}
        </div>

      </main>

      {/* Inquiry Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#ccdacc] shadow-2xl p-6 sm:p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#eef2ee] pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    selectedMessage.userType === 'Seller'
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : selectedMessage.userType === 'Buyer'
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : 'bg-emerald-50 text-[#1c3f24] border border-emerald-200'
                  }`}>
                    {selectedMessage.userType} Inquiry
                  </span>
                  <span className="text-xs text-stone-400 font-mono">
                    ID: {selectedMessage.id.slice(0, 8)}...
                  </span>
                </div>
                <h2 className="font-serif text-xl font-bold text-[#1c3f24]">
                  {selectedMessage.subject}
                </h2>
              </div>

              <button
                onClick={() => setSelectedMessage(null)}
                className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sender Metadata Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#fafcfa] border border-[#e2eae2] rounded-xl p-4 text-xs">
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">From</span>
                <span className="font-bold text-[#1c3f24] text-sm">{selectedMessage.name}</span>
              </div>

              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Email Address</span>
                <a href={`mailto:${selectedMessage.email}`} className="text-[#24492d] font-semibold hover:underline flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{selectedMessage.email}</span>
                </a>
              </div>

              {selectedMessage.phoneNumber && (
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Phone</span>
                  <span className="font-medium text-stone-700">{selectedMessage.phoneNumber}</span>
                </div>
              )}

              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Submitted On</span>
                <span className="text-stone-600 font-medium">
                  {new Date(selectedMessage.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4b6350] mb-2">
                Inquiry Message:
              </label>
              <div className="p-4.5 rounded-xl bg-[#f8faf8] border-l-4 border-[#24492d] text-xs sm:text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">
                {selectedMessage.message}
              </div>
            </div>

            {/* Admin Notes */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4b6350] mb-1.5">
                Internal Administrative Notes:
              </label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add private notes for staff reference..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#ccdacc] bg-white focus:outline-none focus:ring-2 focus:ring-[#24492d]/20 focus:border-[#24492d] transition"
              />
            </div>

            {/* Action Feedback */}
            {actionSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#eef2ee]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={updatingStatus || selectedMessage.status === 'Resolved'}
                  onClick={() => handleUpdateStatus('Resolved')}
                  className="px-4 py-2 rounded-lg bg-[#24492d] hover:bg-[#1a3821] text-white text-xs font-bold uppercase tracking-wider transition shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Resolved</span>
                </button>

                <button
                  type="button"
                  disabled={updatingStatus || selectedMessage.status === 'Read'}
                  onClick={() => handleUpdateStatus('Read')}
                  className="px-3.5 py-2 rounded-lg bg-white border border-[#ccdacc] hover:bg-stone-50 text-stone-700 text-xs font-bold uppercase tracking-wider transition shadow-2xs cursor-pointer"
                >
                  Mark Read
                </button>

                <button
                  type="button"
                  disabled={updatingStatus || selectedMessage.status === 'Unread'}
                  onClick={() => handleUpdateStatus('Unread')}
                  className="px-3.5 py-2 rounded-lg bg-white border border-[#ccdacc] hover:bg-stone-50 text-stone-700 text-xs font-bold uppercase tracking-wider transition shadow-2xs cursor-pointer"
                >
                  Mark Unread
                </button>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent('Re: ' + selectedMessage.subject)}`}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Reply via Email</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleDelete(selectedMessage.id)}
                  className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                  title="Delete message"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
