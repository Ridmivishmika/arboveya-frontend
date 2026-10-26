'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Check,
  Package,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  ShoppingBag,
  Inbox,
  ArrowLeft
} from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import { useAuth } from '@/context/AuthContext';
import { 
  getContactMessages, 
  updateContactMessageStatus, 
  deleteContactMessage,
  getAdminConversations,
  getAdminConversationById,
  getConversationMessages,
  sendAdminConversationMessage,
  markConversationAsRead,
  getAdminUnreadConversationsCount,
  resolveBackendImageUrl
} from '@/lib/api';
import { ContactMessage, Conversation, Message } from '@/types';

export default function AdminMessagesPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  // Active Main View Tab: 'conversations' (Buyer–Seller) vs 'inquiries' (Website Contact Messages)
  const [activeView, setActiveView] = useState<'conversations' | 'inquiries'>('conversations');

  // ================= 1. BUYER-SELLER CONVERSATIONS STATE =================
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [convSearch, setConvSearch] = useState('');
  const [convFilter, setConvFilter] = useState<'All' | 'Unread' | 'ProductInquiry' | 'OrderSupport'>('All');
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  const [convError, setConvError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isPollingRef = useRef(false);

  // ================= 2. WEBSITE CONTACT INQUIRIES STATE =================
  const [inquiries, setInquiries] = useState<ContactMessage[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [inquirySearch, setInquirySearch] = useState('');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState('All');
  const [selectedInquiry, setSelectedInquiry] = useState<ContactMessage | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Security guard: Admin only
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'Admin')) {
      router.replace('/admin/login');
    }
  }, [user, authLoading, router]);

  // Load conversations
  const loadConversations = useCallback(async (silent = false) => {
    if (!token) return;
    try {
      if (!silent) setLoadingConversations(true);
      const data = await getAdminConversations(
        convFilter === 'ProductInquiry' || convFilter === 'OrderSupport' ? convFilter : undefined,
        convFilter === 'Unread',
        convSearch.trim() || undefined,
        token
      );
      setConversations(data);
      const count = await getAdminUnreadConversationsCount(token);
      setAdminUnreadCount(count);
    } catch (err: any) {
      if (!silent) setConvError(err.message || 'Failed to load conversations.');
    } finally {
      if (!silent) setLoadingConversations(false);
    }
  }, [token, convFilter, convSearch]);

  // Load messages for a conversation
  const loadConversationMessages = useCallback(async (convId: string, silent = false) => {
    if (!token) return;
    try {
      if (!silent) setLoadingMessages(true);
      const msgs = await getConversationMessages(convId, token);
      setConversationMessages(msgs);

      // Auto mark read
      await markConversationAsRead(convId, token);
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c));
    } catch (err: any) {
      if (!silent) setConvError(err.message || 'Failed to load messages.');
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, [token]);

  // Initial load
  useEffect(() => {
    if (user && user.role === 'Admin' && token) {
      loadConversations();
    }
  }, [user, token, loadConversations]);

  // Auto scroll messages to bottom
  useEffect(() => {
    if (activeView === 'conversations') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationMessages, activeView]);

  // Real-time polling for active conversation (every 10-12s)
  useEffect(() => {
    if (activeView !== 'conversations' || !selectedConversation || !token) return;

    const interval = setInterval(async () => {
      if (document.visibilityState === 'hidden' || isPollingRef.current) return;
      isPollingRef.current = true;
      try {
        await loadConversationMessages(selectedConversation.id, true);
        await loadConversations(true);
      } catch {
        // Silent fail on background polling
      } finally {
        isPollingRef.current = false;
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [activeView, selectedConversation, token, loadConversationMessages, loadConversations]);

  const handleSelectConv = (conv: Conversation) => {
    setSelectedConversation(conv);
    setConvError(null);
    loadConversationMessages(conv.id);
  };

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyText.trim() || !selectedConversation || !token || sendingReply) return;

    const textToSend = adminReplyText.trim();
    setSendingReply(true);
    setConvError(null);

    try {
      const msg = await sendAdminConversationMessage(selectedConversation.id, textToSend, token);
      setConversationMessages(prev => [...prev, msg]);
      setAdminReplyText('');

      // Update list
      setConversations(prev => prev.map(c => 
        c.id === selectedConversation.id 
          ? { ...c, lastMessageText: textToSend, lastMessageAt: new Date().toISOString() } 
          : c
      ));

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } catch (err: any) {
      setConvError(err.message || 'Failed to send reply.');
    } finally {
      setSendingReply(false);
    }
  };

  // ================= INQUIRIES LOAD =================
  const loadInquiries = async () => {
    try {
      setLoadingInquiries(true);
      const data = await getContactMessages(
        inquiryStatusFilter !== 'All' ? inquiryStatusFilter : undefined,
        inquirySearch.trim() || undefined,
        token || undefined
      );
      setInquiries(data);
    } catch (err) {
      console.error('Failed to load inquiries:', err);
    } finally {
      setLoadingInquiries(false);
    }
  };

  useEffect(() => {
    if (activeView === 'inquiries' && user && user.role === 'Admin') {
      loadInquiries();
    }
  }, [activeView, inquiryStatusFilter, user]);

  const handleOpenInquiryModal = async (msg: ContactMessage) => {
    setSelectedInquiry(msg);
    setAdminNotes(msg.adminNotes || '');

    if (msg.status === 'Unread') {
      try {
        const updated = await updateContactMessageStatus(msg.id, 'Read', msg.adminNotes, token || undefined);
        setInquiries(prev => prev.map(m => m.id === msg.id ? updated : m));
        setSelectedInquiry(updated);
      } catch (err) {
        console.error('Failed to auto-mark inquiry read:', err);
      }
    }
  };

  const handleUpdateInquiryStatus = async (newStatus: string) => {
    if (!selectedInquiry) return;
    try {
      setUpdatingStatus(true);
      const updated = await updateContactMessageStatus(
        selectedInquiry.id,
        newStatus,
        adminNotes.trim() || undefined,
        token || undefined
      );
      setInquiries(prev => prev.map(m => m.id === selectedInquiry.id ? updated : m));
      setSelectedInquiry(updated);
      setActionSuccess(`Inquiry marked as ${newStatus}`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update inquiry status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this contact inquiry?')) return;
    try {
      await deleteContactMessage(id, token || undefined);
      setInquiries(prev => prev.filter(m => m.id !== id));
      if (selectedInquiry?.id === id) setSelectedInquiry(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete inquiry');
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#f7f9f7] flex flex-col font-sans">
      <AdminHeader 
        activeTab="messages" 
        unreadMessagesCount={adminUnreadCount} 
      />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Main Dashboard Navigation Bar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e0e8e0] pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#2d5c37] block mb-1">
              Communication Center
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1c3f24] tracking-tight flex items-center gap-2.5">
              <MessageSquare className="w-7 h-7 text-[#24492d]" />
              <span>Messages & Customer Inquiries</span>
            </h1>
          </div>

          {/* View Mode Tabs (Buyer–Seller vs Website Inquiries) */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/account/messages"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#edf5ee] border border-[#bcd2bf] text-[#1c3f24] hover:bg-[#dcebdd] transition shadow-2xs"
              title="Open direct Arboveya Seller Chat console to chat with buyers"
            >
              <Store className="w-3.5 h-3.5 text-[#24492d]" />
              <span>My Seller Chats (Arboveya Store)</span>
              <ExternalLink className="w-3 h-3 text-[#52785a]" />
            </Link>

            <div className="flex items-center gap-2 bg-stone-200/70 p-1 rounded-2xl self-start sm:self-auto shadow-inner">
              <button
                onClick={() => setActiveView('conversations')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeView === 'conversations'
                    ? 'bg-[#24492d] text-white shadow-xs'
                    : 'text-stone-700 hover:text-[#1c3f24] hover:bg-white/50'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>All Platform Chats</span>
                {adminUnreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500 text-white animate-pulse">
                    {adminUnreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveView('inquiries')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeView === 'inquiries'
                    ? 'bg-[#24492d] text-white shadow-xs'
                    : 'text-stone-700 hover:text-[#1c3f24] hover:bg-white/50'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Contact Form Inquiries</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Error Notice */}
        {convError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{convError}</span>
            </div>
            <button onClick={() => setConvError(null)} className="font-bold hover:underline">Dismiss</button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: BUYER–SELLER CONVERSATIONS (eBay-Inspired 3-Panel Console)        */}
        {/* ========================================================================= */}
        {activeView === 'conversations' && (
          <div className="bg-white rounded-2xl border border-[#dce6dc] shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[700px] max-h-[860px]">
            
            {/* ----------------- PANEL 1: CONVERSATIONS LIST (LEFT) ----------------- */}
            <div className={`w-full lg:w-[360px] xl:w-[380px] border-r border-[#e5ebe5] flex flex-col bg-white flex-shrink-0 ${
              selectedConversation ? 'hidden lg:flex' : 'flex'
            }`}>
              
              {/* Search & Filter Header */}
              <div className="p-4 border-b border-[#e5ebe5] space-y-3 bg-[#fafcfa]">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#75957d] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search buyer, order, or product..."
                    value={convSearch}
                    onChange={(e) => setConvSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') loadConversations(); }}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#d2dfd3] bg-white text-xs text-[#1c3f24] placeholder-[#8ea894] focus:outline-none focus:ring-2 focus:ring-[#24492d]"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold">
                  {(['All', 'Unread', 'ProductInquiry', 'OrderSupport'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setConvFilter(f)}
                      className={`px-3 py-1 rounded-full whitespace-nowrap transition cursor-pointer ${
                        convFilter === f
                          ? 'bg-[#24492d] text-white shadow-2xs'
                          : 'bg-white border border-[#dce6dc] text-[#3e5642] hover:bg-[#edf5ee]'
                      }`}
                    >
                      {f === 'All' ? 'All' : f === 'Unread' ? 'Unread' : f === 'ProductInquiry' ? 'Product Qs' : 'Order Qs'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conversations Scrollable List */}
              <div className="flex-1 overflow-y-auto divide-y divide-[#f0f4f0]">
                {loadingConversations ? (
                  <div className="p-8 text-center text-xs text-[#75957d] space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#24492d]" />
                    <p>Loading customer conversations...</p>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#75957d] space-y-3">
                    <Inbox className="w-10 h-10 text-[#a8c2af] mx-auto" />
                    <p className="font-bold text-stone-700">No conversations found</p>
                    <p className="text-[11px] text-stone-500">
                      Customer questions about products or orders will appear here.
                    </p>
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const isSelected = selectedConversation?.id === conv.id;
                    const isOrder = conv.type === 'OrderSupport';
                    const buyerInitial = conv.buyerName ? conv.buyerName.charAt(0).toUpperCase() : 'B';

                    return (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConv(conv)}
                        className={`w-full text-left p-4 transition flex items-start gap-3 cursor-pointer ${
                          isSelected 
                            ? 'bg-[#edf5ee] border-l-4 border-l-[#24492d]' 
                            : 'hover:bg-[#f8faf8] border-l-4 border-l-transparent'
                        }`}
                      >
                        {/* Initial Avatar */}
                        <div className="w-10 h-10 rounded-full bg-[#24492d] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs">
                          {buyerInitial}
                        </div>

                        {/* Summary Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="font-bold text-xs text-[#1c3f24] truncate">
                              {conv.buyerName}
                            </span>
                            <span className="text-[10px] text-[#75957d]">
                              {formatTime(conv.lastMessageAt || conv.createdAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded bg-[#e2ede4] text-[#24492d]">
                              {isOrder ? 'Order' : 'Product'}
                            </span>
                            <span className="text-xs font-semibold text-stone-800 truncate">
                              {conv.subject}
                            </span>
                          </div>

                          <p className="text-[11px] text-stone-500 truncate">
                            {conv.lastMessageText || 'No messages yet'}
                          </p>

                          <div className="flex items-center justify-between mt-1.5 text-[10px] text-stone-500">
                            <span className="truncate">To: {conv.sellerName || 'Official Admin'}</span>
                            {conv.unreadCount > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-extrabold text-[9px] animate-pulse">
                                {conv.unreadCount} unread
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* ----------------- PANEL 2: MAIN CHAT PANEL (CENTER) ----------------- */}
            <div className={`flex-1 flex flex-col bg-[#fdfefd] ${
              !selectedConversation ? 'hidden lg:flex' : 'flex'
            }`}>
              {selectedConversation ? (
                <>
                  {/* Active Header */}
                  <div className="p-4 border-b border-[#e5ebe5] bg-white flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="lg:hidden p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700"
                        aria-label="Back to conversations list"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-[#1c3f24] truncate">
                            {selectedConversation.subject}
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#edf5ee] text-[#24492d] border border-[#bcd2bf]">
                            {selectedConversation.type === 'OrderSupport' ? 'Order Support' : 'Product Inquiry'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 truncate">
                          Buyer: <strong className="text-[#1c3f24]">{selectedConversation.buyerName}</strong> ({selectedConversation.buyerEmail})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => loadConversationMessages(selectedConversation.id)}
                        className="p-2 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 transition"
                        title="Refresh transcript"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Transcript Scroll Area */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                    {loadingMessages ? (
                      <div className="py-12 text-center text-xs text-[#75957d]">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#24492d] mb-2" />
                        Loading conversation history...
                      </div>
                    ) : conversationMessages.length === 0 ? (
                      <div className="py-12 text-center text-xs text-[#75957d] space-y-2">
                        <MessageSquare className="w-8 h-8 text-[#a8c2af] mx-auto" />
                        <p className="font-bold text-[#1c3f24]">No messages in this conversation</p>
                        <p className="text-[11px]">Send an administrative reply to the buyer below.</p>
                      </div>
                    ) : (
                      conversationMessages.map((m) => {
                        const isBuyer = m.isFromBuyer || m.senderId === selectedConversation.buyerId;

                        return (
                          <div
                            key={m.id}
                            className={`flex flex-col ${isBuyer ? 'items-start' : 'items-end'}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              <span className="text-[10px] font-bold text-stone-700">
                                {isBuyer ? `${m.senderName || selectedConversation.buyerName} (Buyer)` : `${m.senderName} (${m.senderRole || 'Admin'})`}
                              </span>
                              <span className="text-[9px] text-[#75957d]">
                                {formatTime(m.createdAt)}
                              </span>
                            </div>

                            <div
                              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-2xs whitespace-pre-wrap break-words ${
                                isBuyer
                                  ? 'bg-white border border-[#dce6dc] text-stone-800 rounded-tl-none'
                                  : 'bg-[#24492d] text-white rounded-tr-none'
                              }`}
                            >
                              {m.messageText}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Admin Reply Composer */}
                  <form onSubmit={handleSendAdminReply} className="p-3 sm:p-4 bg-white border-t border-[#e5ebe5]">
                    <div className="flex items-end gap-2">
                      <textarea
                        rows={2}
                        placeholder={`Reply to ${selectedConversation.buyerName}...`}
                        value={adminReplyText}
                        onChange={(e) => setAdminReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendAdminReply(e);
                          }
                        }}
                        maxLength={4000}
                        className="flex-1 p-2.5 rounded-xl border border-[#cfded0] text-xs sm:text-sm text-[#1c3f24] placeholder-[#8ea894] focus:outline-none focus:ring-2 focus:ring-[#24492d] resize-none"
                      />

                      <button
                        type="submit"
                        disabled={sendingReply || !adminReplyText.trim()}
                        className="p-3 rounded-xl bg-[#24492d] hover:bg-[#1a3821] text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex-shrink-0 shadow-xs flex items-center justify-center gap-1.5"
                        title="Send reply to buyer"
                      >
                        {sendingReply ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline text-xs">Reply</span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-[#75957d]">
                      <span>The customer will receive an update in their Arboveya account.</span>
                      <span>{adminReplyText.length} / 4000</span>
                    </div>
                  </form>
                </>
              ) : (
                /* Empty state */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#75957d]">
                  <div className="w-16 h-16 rounded-full bg-[#edf5ee] flex items-center justify-center mb-3 text-[#24492d]">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#1c3f24] mb-1">
                    Select a Conversation
                  </h3>
                  <p className="text-xs text-stone-500 max-w-sm mb-4">
                    Review and reply to questions regarding botanical remedies and customer orders.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-[#24492d] bg-[#edf5ee] px-3.5 py-1.5 rounded-full border border-[#bcd2bf]">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Administrator Oversight Mode</span>
                  </div>
                </div>
              )}
            </div>

            {/* ----------------- PANEL 3: DETAILS SIDEBAR (RIGHT - DESKTOP ONLY) ----------------- */}
            {selectedConversation && (
              <div className="hidden xl:flex w-[280px] border-l border-[#e5ebe5] bg-[#fafcfa] p-4 flex-col space-y-5 flex-shrink-0 overflow-y-auto">
                {/* Buyer Profile Box */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#2d5c37] block mb-2">
                    Customer Profile
                  </span>
                  <div className="p-3.5 rounded-xl bg-white border border-[#dce6dc] shadow-2xs space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#24492d] text-white flex items-center justify-center font-bold text-xs">
                        {selectedConversation.buyerName ? selectedConversation.buyerName.charAt(0).toUpperCase() : 'B'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-stone-900 truncate">
                          {selectedConversation.buyerName}
                        </h4>
                        <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Registered Buyer
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-100 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-stone-600 truncate">
                        <Mail className="w-3.5 h-3.5 text-[#52785a] flex-shrink-0" />
                        <span className="truncate" title={selectedConversation.buyerEmail}>{selectedConversation.buyerEmail}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Related Product or Order Reference */}
                {selectedConversation.productId && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#2d5c37] block mb-2">
                      Inquired Product
                    </span>
                    <div className="p-3 rounded-xl bg-white border border-[#dce6dc] shadow-2xs space-y-2.5">
                      {selectedConversation.productImageUrl && (
                        <div className="relative w-full h-28 rounded-lg overflow-hidden bg-stone-100 border border-[#d2ded3]">
                          <Image
                            src={resolveBackendImageUrl(selectedConversation.productImageUrl)}
                            alt={selectedConversation.productName || 'Product'}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <h5 className="font-bold text-xs text-[#1c3f24] line-clamp-2">
                          {selectedConversation.productName}
                        </h5>
                        {selectedConversation.productPrice !== undefined && selectedConversation.productPrice !== null && (
                          <span className="text-xs font-extrabold text-[#24492d] mt-1 block">
                            ${selectedConversation.productPrice.toFixed(2)} USD
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/shop/${selectedConversation.productId}`}
                        target="_blank"
                        className="w-full py-2 px-3 rounded-lg border border-[#bcd2bf] bg-[#edf5ee] hover:bg-[#dcebdd] text-[#1c3f24] text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Live Product</span>
                        <ExternalLink className="w-3 h-3 text-[#52785a]" />
                      </Link>
                    </div>
                  </div>
                )}

                {selectedConversation.orderId && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#2d5c37] block mb-2">
                      Referenced Order
                    </span>
                    <div className="p-3.5 rounded-xl bg-white border border-[#dce6dc] shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1c3f24]">
                          #{selectedConversation.payHereOrderId || selectedConversation.orderId.substring(0, 8)}
                        </span>
                        {selectedConversation.orderStatus && (
                          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {selectedConversation.orderStatus}
                          </span>
                        )}
                      </div>

                      {selectedConversation.orderTotalAmount && (
                        <p className="text-xs text-stone-600">
                          Total: <strong className="text-stone-900">${Number(selectedConversation.orderTotalAmount).toFixed(2)}</strong>
                        </p>
                      )}

                      <Link
                        href="/buyer?tab=orders"
                        target="_blank"
                        className="w-full mt-2 py-2 px-3 rounded-lg border border-[#bcd2bf] bg-[#edf5ee] hover:bg-[#dcebdd] text-[#1c3f24] text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>Order Details</span>
                        <ExternalLink className="w-3 h-3 text-[#52785a]" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: WEBSITE CONTACT INQUIRIES (Preserved Original Feature)            */}
        {/* ========================================================================= */}
        {activeView === 'inquiries' && (
          <div className="space-y-4">
            
            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-[#dce6dc] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
              <form onSubmit={(e) => { e.preventDefault(); loadInquiries(); }} className="w-full md:w-80 relative">
                <Search className="w-4 h-4 text-[#75957d] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search contact inquiries..."
                  value={inquirySearch}
                  onChange={(e) => setInquirySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#d2dfd3] text-xs text-[#1c3f24] placeholder-[#8ea894] focus:outline-none focus:ring-2 focus:ring-[#24492d]"
                />
              </form>

              <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                {(['All', 'Unread', 'Read', 'Resolved'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setInquiryStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      inquiryStatusFilter === st
                        ? 'bg-[#24492d] text-white shadow-2xs'
                        : 'border border-[#dce6dc] bg-white text-stone-700 hover:bg-[#edf5ee]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Inquiries Table */}
            <div className="bg-white rounded-2xl border border-[#dce6dc] shadow-xs overflow-hidden">
              {loadingInquiries ? (
                <div className="p-12 text-center text-xs text-[#75957d] space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#24492d]" />
                  <p>Loading inquiries...</p>
                </div>
              ) : inquiries.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#75957d] space-y-2">
                  <Inbox className="w-10 h-10 text-[#a8c2af] mx-auto" />
                  <p className="font-bold text-stone-700">No contact inquiries found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#f7faf7] border-b border-[#e5ebe5] text-[11px] font-bold text-[#24492d] uppercase tracking-wider">
                        <th className="py-3 px-4">Sender</th>
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f4f0]">
                      {inquiries.map((inq) => (
                        <tr key={inq.id} className="hover:bg-[#fbfdfb] transition">
                          <td className="py-3 px-4">
                            <span className="font-bold text-stone-900 block">{inq.name}</span>
                            <span className="text-[11px] text-stone-500 block">{inq.email}</span>
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <span className="font-semibold text-stone-800 truncate block">{inq.subject}</span>
                            <span className="text-[11px] text-stone-500 truncate block">{inq.message}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              inq.status === 'Unread'
                                ? 'bg-amber-100 text-amber-800'
                                : inq.status === 'Resolved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-stone-100 text-stone-700'
                            }`}>
                              {inq.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[11px] text-stone-500 whitespace-nowrap">
                            {formatTime(inq.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenInquiryModal(inq)}
                                className="p-1.5 rounded-lg border border-stone-200 hover:bg-[#edf5ee] text-[#24492d] font-bold transition cursor-pointer"
                                title="View inquiry details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteInquiry(inq.id)}
                                className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                                title="Delete inquiry"
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

            {/* Inquiry Details Modal */}
            {selectedInquiry && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                <div className="relative w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-[#dbe6dc] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#e5ebe5]">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-[#1c3f24]">{selectedInquiry.subject}</h3>
                      <span className="text-xs text-stone-500">From: {selectedInquiry.name} ({selectedInquiry.email})</span>
                    </div>
                    <button onClick={() => setSelectedInquiry(null)} className="p-1.5 text-stone-400 hover:text-stone-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs sm:text-sm text-stone-800 whitespace-pre-wrap">
                    {selectedInquiry.message}
                  </div>

                  {actionSuccess && (
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold text-center">
                      {actionSuccess}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-[#e5ebe5]">
                    <span className="text-xs font-bold text-stone-700">Status: {selectedInquiry.status}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateInquiryStatus('Resolved')}
                        disabled={updatingStatus}
                        className="px-3.5 py-1.5 rounded-xl bg-[#24492d] text-white text-xs font-bold hover:bg-[#1a3821] transition cursor-pointer"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
