'use client';

import React, { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  MessageSquare, 
  Search, 
  Send, 
  Store, 
  Package, 
  Clock, 
  ArrowLeft, 
  ExternalLink, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  CheckCheck,
  RefreshCw,
  ShoppingBag,
  Inbox
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { 
  getMyConversations, 
  getConversationById, 
  getConversationMessages, 
  sendConversationMessage, 
  markConversationAsRead,
  resolveBackendImageUrl 
} from '@/lib/api';
import { Conversation, Message } from '@/types';

function AccountMessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationIdParam = searchParams.get('id');

  const { user, token, loading: authLoading } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Product' | 'Order' | 'Unread'>('All');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isPollingRef = useRef(false);
  const isAdmin = user?.role === 'Admin';
  const [adminViewMode, setAdminViewMode] = useState<'seller' | 'buyer'>('seller');
  const isSeller = user?.role === 'Seller' || (isAdmin && adminViewMode === 'seller');

  // Authentication Guard: Redirect guests to login
  useEffect(() => {
    if (!authLoading && !user) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      router.replace(`/login?returnUrl=${returnUrl}`);
    }
  }, [user, authLoading, router]);

  // Load user conversations
  const loadConversations = useCallback(async (silent = false) => {
    if (!token) return;
    try {
      if (!silent) setLoadingList(true);
      const viewParam = isAdmin ? adminViewMode : undefined;
      const data = await getMyConversations(token, viewParam);
      setConversations(data);
      return data;
    } catch (err: any) {
      if (!silent) setErrorMsg(err.message || 'Failed to load conversations.');
    } finally {
      if (!silent) setLoadingList(false);
    }
  }, [token, isAdmin, adminViewMode]);

  useEffect(() => {
    if (user && token) {
      loadConversations();
    }
  }, [user, token, loadConversations]);

  // Open conversation from URL query parameter if present
  useEffect(() => {
    if (conversationIdParam && conversations.length > 0 && (!selectedConversation || selectedConversation.id !== conversationIdParam)) {
      const matched = conversations.find(c => c.id === conversationIdParam);
      if (matched) {
        handleSelectConversation(matched);
      }
    }
  }, [conversationIdParam, conversations]);

  // Load messages for the selected conversation
  const loadMessages = useCallback(async (conversationId: string, silent = false) => {
    if (!token) return;
    try {
      if (!silent) setLoadingMessages(true);
      const msgs = await getConversationMessages(conversationId, token);
      setMessages(msgs);

      // Auto mark as read
      await markConversationAsRead(conversationId, token);
      // Update local unread badge count
      setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c));
    } catch (err: any) {
      if (!silent) setErrorMsg(err.message || 'Failed to load messages.');
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, [token]);

  // Auto scroll down when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Polling for active conversation (10 seconds)
  useEffect(() => {
    if (!selectedConversation || !token) return;

    const interval = setInterval(async () => {
      if (document.visibilityState === 'hidden' || isPollingRef.current) return;
      isPollingRef.current = true;
      try {
        await loadMessages(selectedConversation.id, true);
        await loadConversations(true);
      } catch {
        // Silent fail on background polling
      } finally {
        isPollingRef.current = false;
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedConversation, token, loadMessages, loadConversations]);

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setErrorMsg(null);
    loadMessages(conv.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConversation || !token || sending) return;

    const textToSend = replyText.trim();
    setSending(true);
    setErrorMsg(null);

    try {
      const newMsg = await sendConversationMessage(selectedConversation.id, textToSend, token);
      setMessages(prev => [...prev, newMsg]);
      setReplyText('');

      // Update conversation last message in list
      setConversations(prev => prev.map(c => 
        c.id === selectedConversation.id 
          ? { ...c, lastMessageText: textToSend, lastMessageAt: new Date().toISOString() } 
          : c
      ));

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send message. Please retry.');
    } finally {
      setSending(false);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    if (filterType === 'Product' && c.type !== 'ProductInquiry') return false;
    if (filterType === 'Order' && c.type !== 'OrderSupport') return false;
    if (filterType === 'Unread' && c.unreadCount === 0) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSubject = c.subject?.toLowerCase().includes(q);
      const matchProduct = c.productName?.toLowerCase().includes(q);
      const matchOrder = c.payHereOrderId?.toLowerCase().includes(q);
      const matchSeller = c.sellerName?.toLowerCase().includes(q);
      const matchLastMsg = c.lastMessageText?.toLowerCase().includes(q);
      return matchSubject || matchProduct || matchOrder || matchSeller || matchLastMsg;
    }
    return true;
  });

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
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="font-bold hover:underline">Dismiss</button>
          </div>
        )}

        {/* Admin Operational Mode Banner */}
        {isAdmin && (
          <div className="mb-4 p-4 rounded-2xl bg-[#edf5ee] border border-[#bcd2bf] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#24492d] text-white flex items-center justify-center shadow-xs">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold text-[#1c3f24] uppercase tracking-wider">
                    Arboveya Store — Admin & Seller Live Chat
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#24492d] text-white uppercase tracking-wider">
                    Seller Active
                  </span>
                </div>
                <p className="text-[11px] text-[#52785a]">
                  You have full seller chat privileges enabled to converse directly with buyers regarding store products and orders.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto">
              <div className="flex items-center bg-white rounded-xl border border-[#cfded0] p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    setAdminViewMode('seller');
                    setSelectedConversation(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    adminViewMode === 'seller'
                      ? 'bg-[#24492d] text-white shadow-2xs'
                      : 'text-stone-600 hover:text-[#1c3f24]'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Seller Chats</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminViewMode('buyer');
                    setSelectedConversation(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    adminViewMode === 'buyer'
                      ? 'bg-[#24492d] text-white shadow-2xs'
                      : 'text-stone-600 hover:text-[#1c3f24]'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>My Buyer Inquiries</span>
                </button>
              </div>

              <Link
                href="/admin/messages"
                className="px-3 py-1.5 rounded-xl border border-[#bcd2bf] bg-white text-[#24492d] text-xs font-bold hover:bg-[#dcebdd] transition flex items-center gap-1.5 shadow-2xs"
                title="View platform oversight console"
              >
                <span>All Platform Chats</span>
                <ExternalLink className="w-3 h-3 text-[#52785a]" />
              </Link>
            </div>
          </div>
        )}

        {/* Messaging Container */}
        <div className="bg-white rounded-2xl border border-[#dce6dc] shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[650px] max-h-[820px]">
          
          {/* ================= LEFT COLUMN: CONVERSATION LIST ================= */}
          <div className={`w-full md:w-[380px] lg:w-[420px] flex-shrink-0 border-r border-[#e5ebe5] flex flex-col bg-white ${
            selectedConversation ? 'hidden md:flex' : 'flex'
          }`}>
            
            {/* Search and Filters Header */}
            <div className="p-4 border-b border-[#e5ebe5] space-y-3 bg-[#fafcfa]">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#75957d] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search seller, product, or order..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#d2dfd3] bg-white text-xs text-[#1c3f24] placeholder-[#8ea894] focus:outline-none focus:ring-2 focus:ring-[#24492d]"
                  />
                </div>
                <button
                  onClick={() => {
                    loadConversations();
                    if (selectedConversation) loadMessages(selectedConversation.id);
                  }}
                  className="p-2 rounded-xl border border-[#cfded0] bg-white text-[#24492d] hover:bg-[#edf5ee] transition cursor-pointer shadow-2xs"
                  title="Refresh conversations and messages"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Filters Pill Row */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold">
                {(['All', 'Product', 'Order', 'Unread'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setFilterType(tab)}
                    className={`px-3 py-1 rounded-full whitespace-nowrap transition cursor-pointer ${
                      filterType === tab
                        ? 'bg-[#24492d] text-white shadow-2xs'
                        : 'bg-white border border-[#dce6dc] text-[#3e5642] hover:bg-[#edf5ee]'
                    }`}
                  >
                    {tab === 'All' ? 'All Messages' : tab === 'Product' ? 'Product Questions' : tab === 'Order' ? 'Order Updates' : 'Unread'}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation Items List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#f0f4f0]">
              {loadingList ? (
                <div className="p-8 text-center text-xs text-[#75957d] space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#24492d]" />
                  <p>Loading your conversations...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#75957d] space-y-3">
                  <Inbox className="w-10 h-10 text-[#a8c2af] mx-auto" />
                  <p className="font-semibold text-stone-700">No conversations found</p>
                  <p className="text-[11px] text-stone-500">
                    {isSeller
                      ? 'When buyers send inquiries regarding your remedies or orders, conversations will appear here.'
                      : 'When you contact a seller regarding a product or order, conversations will appear here.'}
                  </p>
                  <Link
                    href={isSeller ? "/seller" : "/shop"}
                    className="inline-block mt-2 px-4 py-2 rounded-xl bg-[#24492d] text-white text-xs font-bold hover:bg-[#1a3821] transition"
                  >
                    {isSeller ? 'Go to Seller Studio' : 'Explore Shop'}
                  </Link>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = selectedConversation?.id === conv.id;
                  const isOrder = conv.type === 'OrderSupport';

                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full text-left p-4 transition flex items-start gap-3 cursor-pointer ${
                        isSelected 
                          ? 'bg-[#edf5ee] border-l-4 border-l-[#24492d]' 
                          : 'hover:bg-[#f8faf8] border-l-4 border-l-transparent'
                      }`}
                    >
                      {/* Thumbnail or Icon */}
                      <div className="w-11 h-11 rounded-xl bg-[#e5ebe5] flex-shrink-0 overflow-hidden relative border border-[#d2ded3] flex items-center justify-center">
                        {conv.productImageUrl ? (
                          <Image
                            src={resolveBackendImageUrl(conv.productImageUrl)}
                            alt={conv.productName || 'Product'}
                            fill
                            className="object-cover"
                          />
                        ) : isOrder ? (
                          <Package className="w-5 h-5 text-[#24492d]" />
                        ) : (
                          <Store className="w-5 h-5 text-[#24492d]" />
                        )}
                      </div>

                      {/* Content Summary */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-[#e2ede4] text-[#24492d]">
                            {isOrder ? 'Order' : 'Product'}
                          </span>
                          <span className="text-[10px] text-[#75957d]">
                            {formatTime(conv.lastMessageAt || conv.createdAt)}
                          </span>
                        </div>

                        <h4 className="font-bold text-xs text-[#1c3f24] truncate">
                          {conv.subject}
                        </h4>

                        <p className="text-[11px] text-stone-500 truncate mt-0.5">
                          {conv.lastMessageText || 'No messages yet'}
                        </p>

                        <div className="flex items-center justify-between mt-1 text-[10px] text-[#52785a]">
                          <span className="truncate">
                            {conv.sellerId === user?.id || isSeller
                              ? `Customer: ${conv.buyerName || 'Buyer'}`
                              : `Seller: ${conv.sellerName || 'Arboveya'}`}
                          </span>
                          {conv.unreadCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-[#24492d] text-white font-extrabold text-[9px] animate-pulse">
                              {conv.unreadCount} new
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

          {/* ================= RIGHT COLUMN: CHAT TRANSCRIPT ================= */}
          <div className={`flex-1 flex flex-col bg-[#fdfefd] ${
            !selectedConversation ? 'hidden md:flex' : 'flex'
          }`}>
            {selectedConversation ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b border-[#e5ebe5] bg-white flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="md:hidden p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700"
                      aria-label="Back to conversations list"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-[#1c3f24] truncate">
                          {selectedConversation.subject}
                        </h3>
                        <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#edf5ee] text-[#24492d] border border-[#bcd2bf]">
                          {selectedConversation.type === 'OrderSupport' ? 'Order Support' : 'Product Inquiry'}
                        </span>
                      </div>
                      <p className="text-xs text-[#52785a] truncate">
                        {selectedConversation.sellerId === user?.id || isSeller ? (
                          <>
                            Customer: <strong className="text-[#1c3f24]">{selectedConversation.buyerName || 'Valued Buyer'}</strong>
                            {selectedConversation.buyerEmail && <span className="ml-1 opacity-80">({selectedConversation.buyerEmail})</span>}
                          </>
                        ) : (
                          <>
                            Contacting: <strong className="text-[#1c3f24]">{selectedConversation.sellerName || 'Arboveya Official'}</strong>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Quick context link (View Product or View Order) */}
                  {selectedConversation.productId && (
                    <Link
                      href={`/shop/${selectedConversation.productId}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#bcd2bf] bg-[#edf5ee] text-[#1c3f24] text-xs font-bold hover:bg-[#dcebdd] transition flex-shrink-0 cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">View Product</span>
                      <ExternalLink className="w-3 h-3 text-[#52785a]" />
                    </Link>
                  )}

                  {selectedConversation.orderId && (
                    <Link
                      href={isSeller 
                        ? `/seller?tab=orders&highlight=${selectedConversation.orderId}` 
                        : `/buyer?tab=orders&highlight=${selectedConversation.orderId}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#bcd2bf] bg-[#edf5ee] text-[#1c3f24] text-xs font-bold hover:bg-[#dcebdd] transition flex-shrink-0 cursor-pointer"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">View Order</span>
                      <ExternalLink className="w-3 h-3 text-[#52785a]" />
                    </Link>
                  )}
                </div>

                {/* Related Item Mini-Banner */}
                {selectedConversation.productName && (
                  <div className="bg-[#f3f7f3] px-4 py-2.5 border-b border-[#e5ebe5] flex items-center gap-3">
                    {selectedConversation.productImageUrl && (
                      <div className="relative w-9 h-9 rounded-md overflow-hidden bg-white border border-[#d2ded3] flex-shrink-0">
                        <Image
                          src={resolveBackendImageUrl(selectedConversation.productImageUrl)}
                          alt={selectedConversation.productName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] uppercase font-bold text-[#52785a] tracking-wider block">Inquired Item</span>
                      <span className="text-xs font-bold text-[#1c3f24] truncate block">{selectedConversation.productName}</span>
                    </div>
                    {selectedConversation.productPrice !== undefined && selectedConversation.productPrice !== null && (
                      <span className="text-xs font-extrabold text-[#24492d]">${selectedConversation.productPrice.toFixed(2)}</span>
                    )}
                  </div>
                )}

                {selectedConversation.payHereOrderId && (
                  <div className="bg-[#f3f7f3] px-4 py-2.5 border-b border-[#e5ebe5] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#24492d]" />
                      <span className="font-bold text-[#1c3f24]">Order Ref: #{selectedConversation.payHereOrderId}</span>
                    </div>
                    {selectedConversation.orderStatus && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {selectedConversation.orderStatus}
                      </span>
                    )}
                  </div>
                )}

                {/* Messages Transcript Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  {loadingMessages ? (
                    <div className="py-12 text-center text-xs text-[#75957d]">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#24492d] mb-2" />
                      Loading message history...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[#75957d] space-y-2">
                      <MessageSquare className="w-8 h-8 text-[#a8c2af] mx-auto" />
                      <p className="font-bold text-[#1c3f24]">No messages sent yet</p>
                      <p className="text-[11px]">Send your question to the seller below. They will be notified.</p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.isMine ?? (m.senderId === user?.id);
                      const senderLabel = isMe 
                        ? 'You' 
                        : (m.senderRole === 'Admin' 
                            ? 'Arboveya Support' 
                            : (m.senderName || (m.isFromBuyer ? 'Customer' : 'Seller')));

                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 px-1">
                            <span className="text-[10px] font-bold text-stone-600">
                              {senderLabel}
                            </span>
                            <span className="text-[9px] text-[#75957d]">
                              {formatTime(m.createdAt)}
                            </span>
                          </div>

                          <div
                            className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-2xs whitespace-pre-wrap break-words ${
                              isMe
                                ? 'bg-[#24492d] text-white rounded-tr-none'
                                : 'bg-white border border-[#dce6dc] text-stone-800 rounded-tl-none'
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

                {/* Message Input Composer */}
                <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-white border-t border-[#e5ebe5]">
                  <div className="flex items-end gap-2">
                    <textarea
                      rows={2}
                      placeholder={isSeller 
                        ? `Write your reply to ${selectedConversation.buyerName || 'the customer'}...` 
                        : `Write your message to ${selectedConversation.sellerName || 'the seller'}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      maxLength={4000}
                      className="flex-1 p-2.5 rounded-xl border border-[#cfded0] text-xs sm:text-sm text-[#1c3f24] placeholder-[#8ea894] focus:outline-none focus:ring-2 focus:ring-[#24492d] resize-none"
                    />

                    <button
                      type="submit"
                      disabled={sending || !replyText.trim()}
                      className="p-3 rounded-xl bg-[#24492d] hover:bg-[#1a3821] text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex-shrink-0 shadow-xs flex items-center justify-center gap-1.5"
                      title="Send message"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline text-xs">Send</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-[#75957d]">
                    <span>Press Enter to send (Shift+Enter for newline)</span>
                    <span>{replyText.length} / 4000</span>
                  </div>
                </form>
              </>
            ) : (
              /* Empty state when no conversation is selected */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#75957d]">
                <div className="w-16 h-16 rounded-full bg-[#edf5ee] flex items-center justify-center mb-3 text-[#24492d]">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#1c3f24] mb-1">
                  Select a Conversation
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mb-4">
                  Select any product question or order inquiry from the left panel to review message transcripts and reply.
                </p>
                <div className="flex items-center gap-2 text-xs text-[#24492d] bg-[#edf5ee] px-3.5 py-1.5 rounded-full border border-[#bcd2bf]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Secure Buyer–Seller Communication</span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function AccountMessagesPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-[#f7f9f7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#24492d]" />
      </div>
    }>
      <AccountMessagesContent />
    </React.Suspense>
  );
}
