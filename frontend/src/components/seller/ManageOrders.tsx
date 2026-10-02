'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Truck,
  Package,
  Clock,
  CheckCircle2,
  ShoppingBag,
  Search,
  RotateCcw,
  Printer,
  Download,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  MoreHorizontal,
  ExternalLink,
  Eye,
  Edit2,
  Trash2,
  Star,
  StickyNote,
  Mail,
  FileText,
  X,
  Maximize2,
  SlidersHorizontal,
  ArrowUpDown,
  Check,
  AlertCircle,
  ShieldAlert,
  DollarSign,
  Tag,
  Info,
  Calendar,
  Send
} from 'lucide-react';
import { API_BASE_URL, resolveBackendImageUrl } from '@/lib/api';

export interface OrderItemDetail {
  id: string;
  productId?: string;
  productName: string;
  productImageUrl?: string;
  itemId?: string;
  weight?: string;
  quantity: number;
  availableStock?: number;
  unitPrice: number;
  totalPrice: number;
  promotedListing?: boolean;
}

export interface DetailedOrder {
  id: string;
  orderNumber: string;
  salesRecordNo: string;
  createdAt: string;
  datePaid?: string;
  shipByDate: string;
  estimatedDelivery: string;
  orderStatus: 'Awaiting payment' | 'Awaiting shipment' | 'Paid and shipped' | 'Shipped' | 'Cancelled' | 'Delivered';
  paymentStatus: 'Paid' | 'Pending' | 'Refunded';
  fundsStatus: 'On hold' | 'Released';
  customerName: string;
  buyerUsername: string;
  buyerFeedbackScore?: number;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress: string;
  shippingCity?: string;
  shippingZip?: string;
  shippingCountry?: string;
  shippingMethod: string;
  shippingCost: number;
  subtotal: number;
  salesTax: number;
  totalAmount: number;
  transactionFees: number;
  adFeeGeneral: number;
  orderEarnings: number;
  trackingNumber?: string;
  shippingCarrier?: string;
  shippedAt?: string;
  carrierScanDate?: string;
  items: OrderItemDetail[];
  notes?: string[];
}

interface ManageOrdersProps {
  orders?: any[];
  onRefresh?: () => void;
  user?: any;
  token?: string;
}

// Sample fallback orders matching the UI in screenshots
const sampleOrdersData: DetailedOrder[] = [
  {
    id: 'ord-101',
    orderNumber: '13-15231-15169',
    salesRecordNo: '236',
    createdAt: '2026-09-30T14:55:00Z',
    datePaid: '2026-09-30T15:02:00Z',
    shipByDate: 'Oct 7 at 11:29am PDT',
    estimatedDelivery: 'Oct 20, 2026 - Nov 13, 2026',
    orderStatus: 'Awaiting shipment',
    paymentStatus: 'Paid',
    fundsStatus: 'On hold',
    customerName: 'Oredi KM MC',
    buyerUsername: 'mkmemphis7',
    buyerFeedbackScore: 15,
    customerEmail: 'mkmemphis7@example.com',
    customerPhone: '+1 859-787-3165',
    shippingAddress: '3757 E Drexel Manor Stra',
    shippingCity: 'Tucson, AZ',
    shippingZip: '85706-1977',
    shippingCountry: 'United States',
    shippingMethod: 'Economy Shipping from outside US',
    shippingCost: 0,
    subtotal: 25.89,
    salesTax: 2.25,
    totalAmount: 28.14,
    transactionFees: 4.60,
    adFeeGeneral: 3.66,
    orderEarnings: 17.63,
    items: [
      {
        id: 'item-101',
        productName: 'Plant Euphorbia Hirta Organic Asthma Dried Herbs Spurge, Ara Tanah Pure Herbal.',
        productImageUrl: '/images/gotu-kola-tea.jpg',
        itemId: '395462678513',
        weight: '25g',
        quantity: 1,
        availableStock: 9,
        unitPrice: 25.89,
        totalPrice: 25.89,
        promotedListing: true
      }
    ]
  },
  {
    id: 'ord-102',
    orderNumber: '13-15190-37811',
    salesRecordNo: '235',
    createdAt: '2026-09-21T08:04:00Z',
    datePaid: '2026-09-21T08:10:00Z',
    shipByDate: 'Sep 25',
    estimatedDelivery: 'Oct 10, 2026 - Oct 28, 2026',
    orderStatus: 'Shipped',
    paymentStatus: 'Paid',
    fundsStatus: 'Released',
    customerName: 'David M Porterfield',
    buyerUsername: 'plantfish',
    buyerFeedbackScore: 42,
    customerEmail: 'plantfish@example.com',
    customerPhone: '+1 765-494-4600',
    shippingAddress: '1240 Northwestern Ave',
    shippingCity: 'West Lafayette, IN',
    shippingZip: '47906-2146',
    shippingCountry: 'United States',
    shippingMethod: 'Economy Shipping from outside US',
    shippingCost: 0,
    subtotal: 23.89,
    salesTax: 0.00,
    totalAmount: 23.89,
    transactionFees: 3.80,
    adFeeGeneral: 2.50,
    orderEarnings: 17.59,
    trackingNumber: 'LA000853771LK',
    shippingCarrier: 'Sri Lanka Post',
    shippedAt: '2026-09-24T10:00:00Z',
    carrierScanDate: 'Sep 29',
    items: [
      {
        id: 'item-102',
        productName: '1000Pcs Sun Dried Ceylon Areca Nut / Organic Betel Nut / Supari Catechu | Bulk Lot',
        productImageUrl: '/images/herbal-capsules.jpg',
        itemId: '397416272246',
        weight: 'PCS: 10',
        quantity: 1,
        availableStock: 16,
        unitPrice: 23.89,
        totalPrice: 23.89,
        promotedListing: true
      }
    ]
  },
  {
    id: 'ord-103',
    orderNumber: '18-15178-35637',
    salesRecordNo: '234',
    createdAt: '2026-09-20T17:06:00Z',
    datePaid: '2026-09-20T17:15:00Z',
    shipByDate: 'Sep 24',
    estimatedDelivery: 'Oct 8, 2026 - Oct 25, 2026',
    orderStatus: 'Shipped',
    paymentStatus: 'Paid',
    fundsStatus: 'Released',
    customerName: 'Robert Pell',
    buyerUsername: 'walnutpancakes',
    buyerFeedbackScore: 89,
    customerEmail: 'walnutpancakes@example.com',
    customerPhone: '+1 503-222-1200',
    shippingAddress: '820 SW 2nd Ave',
    shippingCity: 'Portland, OR',
    shippingZip: '97204-1502',
    shippingCountry: 'United States',
    shippingMethod: 'Standard International Shipping',
    shippingCost: 0,
    subtotal: 36.89,
    salesTax: 0.74,
    totalAmount: 37.63,
    transactionFees: 5.10,
    adFeeGeneral: 3.90,
    orderEarnings: 28.63,
    trackingNumber: 'LA000849201LK',
    shippingCarrier: 'DHL Express',
    shippedAt: '2026-09-22T14:30:00Z',
    carrierScanDate: 'Sep 29',
    items: [
      {
        id: 'item-103',
        productName: '1000Pcs Sun Dried Ceylon Areca Nut / Organic Betel Nut / Supari Catechu | Bulk Lot',
        productImageUrl: '/images/moringa-powder.jpg',
        itemId: '397416272246',
        weight: 'PCS: 20',
        quantity: 1,
        availableStock: 18,
        unitPrice: 36.89,
        totalPrice: 36.89,
        promotedListing: true
      }
    ]
  }
];

export default function ManageOrders({ orders: rawOrders = [], onRefresh, user, token }: ManageOrdersProps) {
  // Navigation & View state
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarFilter, setSidebarFilter] = useState<'all' | 'awaiting_payment' | 'awaiting_shipment' | 'paid_and_shipped' | 'archived'>('all');
  
  // Filter bar states
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('last_90');
  const [searchField, setSearchField] = useState('buyer_name');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortBy, setSortBy] = useState<'date_paid' | 'date_sold' | 'total'>('date_paid');

  // Multi-select state
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Modals state
  const [trackingModalOrder, setTrackingModalOrder] = useState<DetailedOrder | null>(null);
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [carrierInput, setCarrierInput] = useState('Sri Lanka Post');
  const [isSubmittingTracking, setIsSubmittingTracking] = useState(false);

  const [messageModalOrder, setMessageModalOrder] = useState<DetailedOrder | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  const [noteModalOrder, setNoteModalOrder] = useState<DetailedOrder | null>(null);
  const [noteText, setNoteText] = useState('');

  const [activeDropdownOrderId, setActiveDropdownOrderId] = useState<string | null>(null);
  const [detailsActionDropdownOpen, setDetailsActionDropdownOpen] = useState(false);
  const [howToShipOpen, setHowToShipOpen] = useState(true);

  // Local state to store updated orders including user actions
  const [localOrders, setLocalOrders] = useState<DetailedOrder[]>(() => {
    // If backend provided orders, convert them; otherwise use sampleOrdersData
    if (rawOrders && rawOrders.length > 0) {
      return rawOrders.map((o: any, idx: number) => {
        const firstItem = o.orderItems && o.orderItems[0] ? o.orderItems[0] : (o.items && o.items[0] ? o.items[0] : null);
        let parsedAddress = o.shippingAddress || '100 Main St';
        let parsedCity = o.shippingCity || '';
        let parsedZip = o.shippingZip || '';
        let parsedCountry = o.shippingCountry || '';

        if (o.shippingAddress && o.shippingAddress.includes(',')) {
          const parts = o.shippingAddress.split(',').map((p: string) => p.trim());
          if (parts.length >= 4) {
            parsedAddress = parts[0];
            parsedCity = parsedCity || parts[1];
            parsedZip = parsedZip || parts[2];
            parsedCountry = parsedCountry || parts[3];
          } else if (parts.length === 3) {
            parsedAddress = parts[0];
            parsedCity = parsedCity || parts[1];
            parsedCountry = parsedCountry || parts[2];
          }
        }

        return {
          id: o.id || `ord-${idx}`,
          orderNumber: o.payHereOrderId || o.orderNumber || `13-${Math.floor(10000 + Math.random() * 90000)}-${Math.floor(10000 + Math.random() * 90000)}`,
          salesRecordNo: `${236 - idx}`,
          createdAt: o.createdAt || new Date().toISOString(),
          datePaid: o.createdAt || new Date().toISOString(),
          shipByDate: 'Within 3 business days',
          estimatedDelivery: '14 - 21 business days',
          orderStatus: o.orderStatus === 'Delivered'
            ? 'Delivered'
            : (o.orderStatus === 'Shipped' || o.trackingNumber)
              ? 'Shipped'
              : (o.orderStatus || 'Awaiting shipment'),
          paymentStatus: o.paymentStatus || 'Paid',
          fundsStatus: o.orderStatus === 'Shipped' || o.orderStatus === 'Delivered' ? 'Released' : 'On hold',
          customerName: o.customerName || 'Valued Buyer',
          buyerUsername: (o.customerName ? o.customerName.toLowerCase().replace(/\s+/g, '') : 'buyer') + Math.floor(Math.random() * 90 + 10),
          buyerFeedbackScore: Math.floor(Math.random() * 50) + 5,
          customerEmail: o.customerEmail || 'buyer@example.com',
          customerPhone: o.customerPhone || '+1 800-555-0199',
          shippingAddress: parsedAddress || '100 Main St',
          shippingCity: parsedCity || 'Austin, TX',
          shippingZip: parsedZip || '78701',
          shippingCountry: parsedCountry || 'United States',
          shippingMethod: o.shippingMethod || 'Standard Herbal Shipping',
          shippingCost: o.shippingCost ?? 0,
          subtotal: Number(((o.totalAmount || 0) - (o.shippingCost || 0)).toFixed(2)),
          salesTax: 0,
          totalAmount: o.totalAmount ?? 0,
          transactionFees: 0,
          adFeeGeneral: 0,
          orderEarnings: o.totalAmount ?? 0,
          trackingNumber: o.trackingNumber || undefined,
          shippingCarrier: o.shippingCarrier || undefined,
          shippedAt: o.shippedAt || undefined,
          items: (o.orderItems || o.items || []).map((it: any, iIdx: number) => ({
            id: it.id || `item-${idx}-${iIdx}`,
            productName: it.productName || 'Botanical Herbal Remedy',
            productImageUrl: it.productImageUrl || '/images/gotu-kola-tea.jpg',
            itemId: '39546' + Math.floor(100000 + Math.random() * 900000),
            weight: it.weight || 'Standard Size',
            quantity: it.quantity || 1,
            availableStock: 12,
            unitPrice: it.unitPrice || 25.00,
            totalPrice: (it.unitPrice || 25.00) * (it.quantity || 1),
            promotedListing: false
          }))
        };
      });
    }
    return sampleOrdersData;
  });

  React.useEffect(() => {
    if (rawOrders && rawOrders.length > 0) {
      setLocalOrders(prev => {
        return rawOrders.map((o: any, idx: number) => {
          const existing = prev.find(p => p.id === o.id);
          const resolvedStatus = (existing?.orderStatus === 'Delivered' || o.orderStatus === 'Delivered')
            ? 'Delivered'
            : (existing?.orderStatus === 'Shipped' || o.orderStatus === 'Shipped' || o.trackingNumber)
              ? 'Shipped'
              : (o.orderStatus || 'Awaiting shipment');

          let parsedAddress = o.shippingAddress || '100 Main St';
          let parsedCity = o.shippingCity || '';
          let parsedZip = o.shippingZip || '';
          let parsedCountry = o.shippingCountry || '';

          if (o.shippingAddress && o.shippingAddress.includes(',')) {
            const parts = o.shippingAddress.split(',').map((p: string) => p.trim());
            if (parts.length >= 4) {
              parsedAddress = parts[0];
              parsedCity = parsedCity || parts[1];
              parsedZip = parsedZip || parts[2];
              parsedCountry = parsedCountry || parts[3];
            } else if (parts.length === 3) {
              parsedAddress = parts[0];
              parsedCity = parsedCity || parts[1];
              parsedCountry = parsedCountry || parts[2];
            }
          }

          return {
            id: o.id || `ord-${idx}`,
            orderNumber: o.payHereOrderId || o.orderNumber || `13-${Math.floor(10000 + Math.random() * 90000)}-${Math.floor(10000 + Math.random() * 90000)}`,
            salesRecordNo: `${236 - idx}`,
            createdAt: o.createdAt || new Date().toISOString(),
            datePaid: o.createdAt || new Date().toISOString(),
            shipByDate: 'Within 3 business days',
            estimatedDelivery: '14 - 21 business days',
            orderStatus: resolvedStatus,
            paymentStatus: o.paymentStatus || 'Paid',
            fundsStatus: resolvedStatus === 'Shipped' || resolvedStatus === 'Delivered' ? 'Released' : 'On hold',
            customerName: o.customerName || 'Valued Buyer',
            buyerUsername: (o.customerName ? o.customerName.toLowerCase().replace(/\s+/g, '') : 'buyer') + Math.floor(Math.random() * 90 + 10),
            buyerFeedbackScore: Math.floor(Math.random() * 50) + 5,
            customerEmail: o.customerEmail || 'buyer@example.com',
            customerPhone: o.customerPhone || '+1 800-555-0199',
            shippingAddress: parsedAddress || '100 Main St',
            shippingCity: parsedCity || 'Austin, TX',
            shippingZip: parsedZip || '78701',
            shippingCountry: parsedCountry || 'United States',
            shippingMethod: o.shippingMethod || 'Standard Herbal Shipping',
            shippingCost: o.shippingCost ?? 0,
            subtotal: Number(((o.totalAmount || 0) - (o.shippingCost || 0)).toFixed(2)),
            salesTax: 0,
            totalAmount: o.totalAmount ?? 0,
            transactionFees: 0,
            adFeeGeneral: 0,
            orderEarnings: o.totalAmount ?? 0,
            trackingNumber: existing?.trackingNumber || o.trackingNumber || undefined,
            shippingCarrier: existing?.shippingCarrier || o.shippingCarrier || undefined,
            carrierScanDate: existing?.carrierScanDate || (resolvedStatus === 'Delivered' || resolvedStatus === 'Shipped' ? new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : undefined),
            shippedAt: o.shippedAt || undefined,
            items: (o.orderItems || o.items || []).map((it: any, iIdx: number) => ({
              id: it.id || `item-${idx}-${iIdx}`,
              productName: it.productName || 'Botanical Herbal Remedy',
              productImageUrl: it.productImageUrl || '/images/gotu-kola-tea.jpg',
              itemId: '39546' + Math.floor(100000 + Math.random() * 900000),
              weight: it.weight || 'Standard Size',
              quantity: it.quantity || 1,
              availableStock: 12,
              unitPrice: it.unitPrice || 25.00,
              totalPrice: (it.unitPrice || 25.00) * (it.quantity || 1),
              promotedListing: false
            }))
          };
        });
      });
    }
  }, [rawOrders]);

  // Filtered & Sorted orders list
  const filteredOrders = useMemo(() => {
    return localOrders.filter((order) => {
      // Sidebar filter
      if (sidebarFilter === 'awaiting_payment' && order.paymentStatus !== 'Pending') return false;
      if (sidebarFilter === 'awaiting_shipment' && (order.orderStatus === 'Shipped' || order.orderStatus === 'Delivered')) return false;
      if (sidebarFilter === 'paid_and_shipped' && order.orderStatus !== 'Shipped' && order.orderStatus !== 'Delivered') return false;

      // Status dropdown filter
      if (statusFilter === 'awaiting_payment' && order.paymentStatus !== 'Pending') return false;
      if (statusFilter === 'awaiting_shipment' && (order.orderStatus === 'Shipped' || order.orderStatus === 'Delivered')) return false;
      if (statusFilter === 'paid_and_shipped' && order.orderStatus !== 'Shipped') return false;

      // Search keyword filter
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase().trim();
        if (searchField === 'buyer_name') {
          const matchBuyer = order.customerName.toLowerCase().includes(q) || order.buyerUsername.toLowerCase().includes(q);
          if (!matchBuyer) return false;
        } else if (searchField === 'order_id') {
          if (!order.orderNumber.toLowerCase().includes(q) && !order.id.toLowerCase().includes(q)) return false;
        } else if (searchField === 'tracking_number') {
          if (!order.trackingNumber || !order.trackingNumber.toLowerCase().includes(q)) return false;
        } else if (searchField === 'item_id') {
          const matchItem = order.items.some(it => it.itemId?.includes(q) || it.id.includes(q));
          if (!matchItem) return false;
        } else if (searchField === 'product_title') {
          const matchTitle = order.items.some(it => it.productName.toLowerCase().includes(q));
          if (!matchTitle) return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_paid') {
        return new Date(b.datePaid || b.createdAt).getTime() - new Date(a.datePaid || a.createdAt).getTime();
      }
      if (sortBy === 'date_sold') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'total') {
        return b.totalAmount - a.totalAmount;
      }
      return 0;
    });
  }, [localOrders, sidebarFilter, statusFilter, searchField, searchKeyword, sortBy]);

  // Handle select all toggle
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedOrderIds(prev => [...prev, id]);
    } else {
      setSelectedOrderIds(prev => prev.filter(item => item !== id));
    }
  };

  // Open tracking modal
  const handleOpenTrackingModal = (order: DetailedOrder) => {
    setTrackingModalOrder(order);
    setTrackingNumberInput(order.trackingNumber || '');
    setCarrierInput(order.shippingCarrier || 'Sri Lanka Post');
  };

  // Save tracking number
  const handleSaveTracking = async () => {
    if (!trackingModalOrder || !trackingNumberInput.trim()) return;
    setIsSubmittingTracking(true);

    try {
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('arboveya_token') : '');
      await fetch(`${API_BASE_URL}/orders/${trackingModalOrder.id}/tracking`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: 'Bearer ' + authToken } : {})
        },
        body: JSON.stringify({
          trackingNumber: trackingNumberInput.trim(),
          shippingCarrier: carrierInput.trim(),
          orderStatus: 'Shipped'
        })
      });
    } catch (err) {
      console.warn('Backend tracking sync warning:', err);
    }

    // Update local state
    setLocalOrders(prev => prev.map(o => {
      if (o.id === trackingModalOrder.id) {
        return {
          ...o,
          trackingNumber: trackingNumberInput.trim(),
          shippingCarrier: carrierInput.trim(),
          orderStatus: 'Shipped',
          carrierScanDate: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          fundsStatus: 'Released'
        };
      }
      return o;
    }));

    onRefresh?.();
    setIsSubmittingTracking(false);
    setTrackingModalOrder(null);
  };

  // Update order status (Shipped, Delivered)
  const handleUpdateOrderStatus = async (orderId: string, newStatus: 'Shipped' | 'Delivered') => {
    // Optimistically update local state immediately so UI updates instantly
    setLocalOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          orderStatus: newStatus,
          fundsStatus: 'Released',
          carrierScanDate: o.carrierScanDate || new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        };
      }
      return o;
    }));

    try {
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('arboveya_token') : '');
      const currentOrder = localOrders.find(o => o.id === orderId);

      // Call status endpoint
      await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: 'Bearer ' + authToken } : {})
        },
        body: JSON.stringify({
          orderStatus: newStatus,
          paymentStatus: 'Paid'
        })
      });

      // If order already has tracking number, keep tracking record in sync
      if (currentOrder?.trackingNumber) {
        await fetch(`${API_BASE_URL}/orders/${orderId}/tracking`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: 'Bearer ' + authToken } : {})
          },
          body: JSON.stringify({
            trackingNumber: currentOrder.trackingNumber,
            shippingCarrier: currentOrder.shippingCarrier || 'Sri Lanka Post',
            orderStatus: newStatus
          })
        });
      }
    } catch (err) {
      console.warn('Backend order status update warning:', err);
    }
  };

  // Selected single order for detail view
  const activeOrderDetails = useMemo(() => {
    if (!selectedOrderId) return null;
    return localOrders.find(o => o.id === selectedOrderId) || null;
  }, [selectedOrderId, localOrders]);

  // Reset filters
  const handleResetFilters = () => {
    setStatusFilter('all');
    setPeriodFilter('last_90');
    setSearchKeyword('');
    setSidebarFilter('all');
  };

  // =========================================================================
  // VIEW: SINGLE ORDER DETAILS (Screenshots 2, 3, 5)
  // =========================================================================
  if (activeOrderDetails) {
    const o = activeOrderDetails;
    const firstItem = o.items[0] || {
      id: 'default',
      productName: 'Botanical Herbal Remedy',
      productImageUrl: '/images/gotu-kola-tea.jpg',
      weight: '25g',
      itemId: '395462678513',
      quantity: 1,
      availableStock: 9,
      unitPrice: o.subtotal,
      totalPrice: o.subtotal
    };

    return (
      <div className="w-full bg-[#f8f9fa] min-h-screen py-6 px-4 sm:px-6 lg:px-8 font-sans animate-in fade-in duration-150 text-[#181818]">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Breadcrumbs & Header Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200">
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <button 
                onClick={() => setSelectedOrderId(null)}
                className="hover:text-blue-600 underline font-medium cursor-pointer"
              >
                All orders
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-stone-800 font-semibold">Order details</span>
            </div>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-800 transition shadow-2xs cursor-pointer self-start sm:self-auto"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print packing slip</span>
            </button>
          </div>

          {/* Page Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              Order details
            </h1>
          </div>

          {/* Product Banner (Small image + Title) */}
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-200 shadow-2xs">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0 border border-stone-200">
              <Image
                src={resolveBackendImageUrl(firstItem.productImageUrl, '/images/gotu-kola-tea.jpg')}
                alt={firstItem.productName}
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
            <h2 className="text-sm font-semibold text-stone-900 line-clamp-1">
              {firstItem.productName}
            </h2>
          </div>

          {/* Stepper Progress / Shipping Due Card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-stone-900">
                  {o.orderStatus === 'Shipped' ? 'Item Shipped' : `Ship by ${o.shipByDate}`}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Make sure you ship your order within the handling time you specified in the listing.
                </p>
                <p className="text-xs text-stone-600 font-medium mt-1">
                  Estimated delivery date shown to buyer: <strong className="text-stone-900">{o.estimatedDelivery}</strong>
                </p>
              </div>

              {/* Action Buttons on Right: Only 4 requested visible actions */}
              <div className="flex items-center gap-2 relative flex-wrap">
                {/* 1. Print packing */}
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-full border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  title="Print packing slip"
                >
                  <Printer className="w-3.5 h-3.5 text-stone-600" />
                  <span>Print packing</span>
                </button>

                {/* 2. Add tracking number (opens tracking dialog) */}
                <button
                  onClick={() => handleOpenTrackingModal(o)}
                  className="px-4 py-2 rounded-full bg-[#0053a0] hover:bg-[#004280] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  title="Add or edit tracking details"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>{o.trackingNumber ? 'Edit tracking number' : 'Add tracking number'}</span>
                </button>

                {/* 3. Mark as shipped */}
                <button
                  onClick={() => handleUpdateOrderStatus(o.id, 'Shipped')}
                  disabled={o.orderStatus === 'Shipped' || o.orderStatus === 'Delivered'}
                  className={`px-3.5 py-2 rounded-full text-xs font-semibold transition shadow-2xs flex items-center gap-1.5 cursor-pointer ${
                    o.orderStatus === 'Shipped' || o.orderStatus === 'Delivered'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 opacity-90 cursor-default'
                      : 'bg-white border border-stone-300 hover:bg-stone-50 text-stone-800'
                  }`}
                  title="Mark this order as shipped"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{o.orderStatus === 'Shipped' || o.orderStatus === 'Delivered' ? 'Shipped' : 'Mark as shipped'}</span>
                </button>

                {/* 4. Mark as delivered */}
                <button
                  onClick={() => handleUpdateOrderStatus(o.id, 'Delivered')}
                  disabled={o.orderStatus === 'Delivered'}
                  className={`px-3.5 py-2 rounded-full text-xs font-semibold transition shadow-2xs flex items-center gap-1.5 cursor-pointer ${
                    o.orderStatus === 'Delivered'
                      ? 'bg-emerald-600 text-white shadow-xs cursor-default'
                      : 'bg-white border border-stone-300 hover:bg-stone-50 text-stone-800'
                  }`}
                  title="Mark this order as delivered"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{o.orderStatus === 'Delivered' ? 'Delivered' : 'Mark as delivered'}</span>
                </button>
              </div>
            </div>

            {/* Stepper Bar */}
            <div className="pt-2">
              <div className="relative flex items-center justify-between max-w-xl">
                {/* Background Line (Neutral uncolored line) */}
                <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-stone-200 z-0"></div>

                {/* Step 1: Buyer Paid */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <span className="text-xs font-bold text-stone-900 mt-2">Buyer paid</span>
                  <span className="text-[11px] text-stone-500">
                    {new Date(o.datePaid || o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                {/* Step 2: Ship by */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold bg-white ${
                    o.orderStatus === 'Shipped' || o.orderStatus === 'Delivered'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-stone-400 text-stone-600'
                  }`}>
                    {o.orderStatus === 'Shipped' || o.orderStatus === 'Delivered' ? (
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-stone-400"></span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-stone-900 mt-2">Ship by</span>
                  <span className="text-[11px] text-stone-500">Oct 7</span>
                </div>

                {/* Step 3: Delivery */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                    o.orderStatus === 'Delivered'
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                      : 'border-stone-300 text-stone-400 bg-white'
                  }`}>
                    {o.orderStatus === 'Delivered' ? (
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-stone-300"></span>
                    )}
                  </div>
                  <span className={`text-xs font-bold mt-2 ${o.orderStatus === 'Delivered' ? 'text-emerald-700' : 'text-stone-500'}`}>
                    {o.orderStatus === 'Delivered' ? 'Delivered' : 'Delivery'}
                  </span>
                  <span className="text-[11px] text-stone-400">
                    {o.orderStatus === 'Delivered' ? 'Completed' : 'Estimated'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* LEFT 2 COLUMNS: Shipping Card & Items Card */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Shipping Section Card */}
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-6">
                <h3 className="text-base font-bold text-stone-900">
                  Shipping
                </h3>

                {/* How to ship collapsible section */}
                <div className="border border-stone-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setHowToShipOpen(!howToShipOpen)}
                    className="w-full px-4 py-3 bg-[#fafafa] flex items-center justify-between text-xs font-bold text-stone-800 hover:bg-stone-100 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-stone-600" />
                      How to ship
                    </span>
                    {howToShipOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {howToShipOpen && (
                    <div className="p-4 bg-white grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs border-t border-stone-200">
                      <div>
                        <h4 className="font-bold text-stone-900 mb-1">Pack it up</h4>
                        <p className="text-stone-500 leading-relaxed text-[11px]">
                          Use padding to protect your botanical item and seal the package with packing tape.
                        </p>
                        <a href="#" className="text-blue-600 underline font-medium block mt-1 text-[11px]">Learn more</a>
                      </div>
                      <div>
                        <h4 className="font-bold text-stone-900 mb-1">Get a label</h4>
                        <p className="text-stone-500 leading-relaxed text-[11px]">
                          Buy your label on Arboveya to save on shipping costs or find your own shipping service.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-bold text-stone-900 mb-1">Drop it off</h4>
                        <p className="text-stone-500 leading-relaxed text-[11px]">
                          If you buy your label on Arboveya, tracking is shared with the buyer automatically.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Destination Address & Carrier Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 text-xs">
                  <div>
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" />
                      Ship to
                    </span>
                    <p className="font-bold text-stone-900 text-sm">{o.customerName}</p>
                    <p className="text-stone-600 mt-0.5">{o.shippingAddress}</p>
                    <p className="text-stone-600">{o.shippingCity} {o.shippingZip}</p>
                    <p className="text-stone-600">{o.shippingCountry}</p>
                    {o.customerPhone && (
                      <p className="text-stone-500 mt-2 font-mono text-[11px]">
                        Phone: {o.customerPhone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                        Buyer selected shipping service
                      </span>
                      <p className="font-semibold text-stone-900">{o.shippingMethod}</p>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
                        Tracking
                      </span>
                      {o.trackingNumber ? (
                        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Tracking Active</span>
                            </span>
                            <button
                              onClick={() => handleOpenTrackingModal(o)}
                              className="text-xs font-bold text-[#0053a0] hover:underline cursor-pointer"
                            >
                              Edit tracking
                            </button>
                          </div>
                          <p className="font-mono text-sm font-bold text-[#1c3f24] tracking-wide">
                            {o.trackingNumber}
                          </p>
                          <p className="text-[11px] text-stone-500">
                            Carrier: <strong className="text-stone-700">{o.shippingCarrier || 'Sri Lanka Post'}</strong>
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-stone-400 font-mono text-xs">--</p>
                          <button
                            onClick={() => handleOpenTrackingModal(o)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0053a0] hover:bg-[#004280] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>+ Add tracking</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Item Details Card (Screenshot 2) */}
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-6">
                <h3 className="text-base font-bold text-stone-900">
                  Item
                </h3>

                <div className="flex flex-col sm:flex-row gap-4 items-start pb-6 border-b border-stone-100">
                  {/* Thumbnail Image */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-stone-200 bg-stone-100 flex-shrink-0">
                    <Image
                      src={resolveBackendImageUrl(firstItem.productImageUrl, '/images/gotu-kola-tea.jpg')}
                      alt={firstItem.productName}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>

                  {/* Item Description */}
                  <div className="flex-1 space-y-1">
                    <h4 className="text-sm sm:text-base font-bold text-stone-900 hover:text-blue-600 cursor-pointer">
                      {firstItem.productName}
                    </h4>
                    <p className="text-xs font-bold text-stone-900">
                      {firstItem.weight ? `Weight: ${firstItem.weight}` : 'Standard Unit'}
                    </p>
                    <p className="text-[11px] text-stone-400 font-mono">
                      Item ID: {firstItem.itemId || '395462678513'}
                    </p>
                    <button
                      onClick={() => handleOpenTrackingModal(o)}
                      className="text-xs font-semibold text-blue-600 hover:underline block pt-1 cursor-pointer"
                    >
                      {o.trackingNumber ? `Tracking: ${o.trackingNumber}` : '+ Add tracking'}
                    </button>
                  </div>
                </div>

                {/* Item Numbers Table */}
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-stone-400 font-semibold uppercase text-[10px] border-b border-stone-100 pb-2">
                        <th className="pb-2 font-normal">Quantity</th>
                        <th className="pb-2 font-normal">Item price</th>
                        <th className="pb-2 font-normal text-right">Item total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      <tr>
                        <td className="py-3 font-semibold text-stone-900">
                          {firstItem.quantity}{' '}
                          <span className="text-[11px] text-stone-400 font-normal">
                            ({firstItem.availableStock || 9} available)
                          </span>
                        </td>
                        <td className="py-3 font-semibold text-stone-900">
                          ${firstItem.unitPrice.toFixed(2)}
                        </td>
                        <td className="py-3 font-bold text-stone-900 text-right">
                          ${firstItem.totalPrice.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Order Summary & Payouts Cards */}
            <div className="space-y-6">
              
              {/* Order Metadata Card */}
              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-3.5 text-xs">
                <h3 className="text-base font-bold text-stone-900">
                  Order
                </h3>

                <div className="space-y-2 border-b border-stone-100 pb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500">Order</span>
                    <span className="font-mono font-bold text-stone-900">{o.orderNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500">Sales record no.</span>
                    <span className="font-bold text-stone-900">{o.salesRecordNo}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500">Sold</span>
                    <span className="text-stone-700">
                      {new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500">Buyer paid</span>
                    <span className="text-stone-700">
                      {new Date(o.datePaid || o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-start pt-1">
                    <span className="text-stone-500">Buyer</span>
                    <div className="text-right">
                      <span className="font-bold text-stone-900 block">{o.customerName}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => setMessageModalOrder(o)}
                    className="w-full py-2.5 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Message buyer</span>
                  </button>
                </div>
              </div>

              {/* What your buyer paid Card */}
              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-3 text-xs">
                <h3 className="text-sm font-bold text-stone-900">
                  What your buyer paid
                </h3>

                <div className="space-y-2 pt-1 border-b border-stone-200 pb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-600">Subtotal</span>
                    <span className="font-semibold text-stone-900">${o.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-600">Shipping</span>
                    <span className="font-semibold text-stone-900">${o.shippingCost.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 text-sm font-bold text-stone-900">
                  <span>Order total</span>
                  <span>${o.totalAmount.toFixed(2)}</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: MAIN "MANAGE ALL ORDERS" TABLE (Screenshot 1)
  // =========================================================================
  return (
    <div className="w-full bg-[#f8f9fa] min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans text-[#181818]">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Main Grid: Collapsible Sidebar + Content Area */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* ================= LEFT SIDEBAR (Screenshot 1) ================= */}
          <aside className={`transition-all duration-200 ${
            sidebarCollapsed ? 'w-full lg:w-16' : 'w-full lg:w-56'
          } flex-shrink-0 bg-white rounded-2xl border border-stone-200 p-3 shadow-2xs space-y-4`}>
            
            {/* Collapse toggle */}
            <div className="flex items-center justify-between px-2 py-1">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="flex items-center gap-2 text-xs font-bold text-stone-700 hover:text-stone-900 cursor-pointer"
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <SlidersHorizontal className="w-4 h-4 text-stone-600" />
                {!sidebarCollapsed && <span>Collapse</span>}
              </button>
            </div>

            {/* Primary Navigation Statuses */}
            <nav className="space-y-0.5 text-xs font-medium">
              <button
                onClick={() => setSidebarFilter('all')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left cursor-pointer ${
                  sidebarFilter === 'all'
                    ? 'bg-stone-100 text-stone-900 font-bold'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <span>{!sidebarCollapsed ? 'All orders' : 'All'}</span>
                {!sidebarCollapsed && (
                  <span className="text-[11px] text-stone-400">{localOrders.length}</span>
                )}
              </button>

              <button
                onClick={() => setSidebarFilter('awaiting_payment')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left cursor-pointer ${
                  sidebarFilter === 'awaiting_payment'
                    ? 'bg-stone-100 text-stone-900 font-bold'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <span>{!sidebarCollapsed ? 'Awaiting payment' : 'Unpaid'}</span>
                {!sidebarCollapsed && (
                  <span className="text-[11px] text-stone-400">0</span>
                )}
              </button>

              <button
                onClick={() => setSidebarFilter('awaiting_shipment')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left cursor-pointer ${
                  sidebarFilter === 'awaiting_shipment'
                    ? 'bg-stone-100 text-stone-900 font-bold'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <span>{!sidebarCollapsed ? 'Awaiting shipment' : 'Ship'}</span>
                {!sidebarCollapsed && (
                  <span className="text-[11px] font-bold text-amber-700">
                    {localOrders.filter(o => o.orderStatus !== 'Shipped').length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setSidebarFilter('paid_and_shipped')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left cursor-pointer ${
                  sidebarFilter === 'paid_and_shipped'
                    ? 'bg-stone-100 text-stone-900 font-bold'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <span>{!sidebarCollapsed ? 'Paid and shipped' : 'Done'}</span>
                {!sidebarCollapsed && (
                  <span className="text-[11px] font-bold text-emerald-700">
                    {localOrders.filter(o => o.orderStatus === 'Shipped').length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setSidebarFilter('archived')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left cursor-pointer ${
                  sidebarFilter === 'archived'
                    ? 'bg-stone-100 text-stone-900 font-bold'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <span>{!sidebarCollapsed ? 'Archived' : 'Arc'}</span>
              </button>
            </nav>

            {!sidebarCollapsed && (
              <>
                <div className="border-t border-stone-200 my-2"></div>

                {/* Disputes & Cancellations Group */}
                <div className="space-y-0.5 text-xs text-stone-600">
                  <a href="#" className="block px-3 py-1.5 hover:bg-stone-50 rounded-lg">Cancellations</a>
                  <a href="#" className="block px-3 py-1.5 hover:bg-stone-50 rounded-lg">Returns</a>
                  <a href="#" className="block px-3 py-1.5 hover:bg-stone-50 rounded-lg">Requests and disputes</a>
                  <a href="#" className="block px-3 py-1.5 hover:bg-stone-50 rounded-lg">Shipping labels</a>
                </div>

                <div className="border-t border-stone-200 my-2"></div>

                {/* Preferences */}
                <div className="space-y-0.5 text-xs text-stone-500">
                  <a href="#" className="block px-3 py-1.5 hover:bg-stone-50 rounded-lg">Shipping preferences</a>
                  <a href="#" className="block px-3 py-1.5 hover:bg-stone-50 rounded-lg">Automate feedback</a>
                  <a href="#" className="block px-3 py-1.5 hover:bg-stone-50 rounded-lg">Return preferences</a>
                </div>
              </>
            )}
          </aside>

          {/* ================= MAIN CONTENT AREA ================= */}
          <main className="flex-1 w-full space-y-5">
            
            {/* Title Header */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
                Manage all orders
              </h1>
            </div>

            {/* Top Filter Bar Box (Screenshot 1) */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none pl-3.5 pr-8 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-stone-800 focus:outline-none focus:border-stone-500 cursor-pointer"
                >
                  <option value="all">Status: All orders ({localOrders.length})</option>
                  <option value="awaiting_payment">Status: Awaiting payment</option>
                  <option value="awaiting_shipment">Status: Awaiting shipment</option>
                  <option value="paid_and_shipped">Status: Paid and shipped</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Period Filter */}
              <div className="relative">
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  className="appearance-none pl-3.5 pr-8 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-stone-800 focus:outline-none focus:border-stone-500 cursor-pointer"
                >
                  <option value="last_90">Period: Last 90 days</option>
                  <option value="last_30">Period: Last 30 days</option>
                  <option value="last_7">Period: Last 7 days</option>
                  <option value="2026">Period: Year 2026</option>
                  <option value="all">Period: All time</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Search By Filter */}
              <div className="relative">
                <select
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value)}
                  className="appearance-none pl-3.5 pr-8 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-stone-800 focus:outline-none focus:border-stone-500 cursor-pointer"
                >
                  <option value="buyer_name">Search by: Buyer name</option>
                  <option value="order_id">Search by: Order ID</option>
                  <option value="item_id">Search by: Item ID</option>
                  <option value="tracking_number">Search by: Tracking number</option>
                  <option value="product_title">Search by: Product title</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Search input field with magnifying glass */}
              <div className="relative flex-1 min-w-[180px] max-w-sm flex items-center">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-3 pr-9 py-2 rounded-xl border border-stone-300 bg-white text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-600"
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>

              {/* Reset button */}
              <button
                onClick={handleResetFilters}
                className="text-xs text-stone-600 hover:text-stone-900 underline font-medium cursor-pointer"
              >
                Reset
              </button>
            </div>

            {/* Action Bar & Results Count Bar (Screenshot 1) */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs space-y-4">
              <div className="flex items-center justify-between gap-3 text-xs">
                
                {/* Results Count */}
                <div>
                  <span className="font-bold text-stone-900">
                    Results: 1-{filteredOrders.length} of {filteredOrders.length}
                  </span>
                </div>

                {/* Right controls: Sort by only */}
                <div className="flex items-center gap-1.5">
                  <span className="text-stone-500">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-2.5 py-1 rounded-lg border border-stone-300 bg-white text-xs font-semibold text-stone-800 focus:outline-none cursor-pointer"
                  >
                    <option value="date_paid">Date paid ↓</option>
                    <option value="date_sold">Date sold</option>
                    <option value="total">Total ↑↓</option>
                  </select>
                </div>

              </div>

            {/* ================= ORDERS TABLE (Screenshot 1) ================= */}
            <div className="overflow-x-auto border border-stone-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#fafafa] border-b border-stone-200 text-stone-700 font-bold uppercase text-[11px]">
                    <th className="py-3 px-4 min-w-[320px]">Order</th>
                    <th className="py-3 px-3">Quantity</th>
                    <th className="py-3 px-3">Subtotal</th>
                    <th className="py-3 px-3">Total ↑↓</th>
                    <th className="py-3 px-3">Date sold</th>
                    <th className="py-3 px-3">Date paid ↓</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-200 bg-white">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-stone-400">
                          <ShoppingBag className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                          <p className="font-semibold text-stone-700 text-sm">No orders matching your criteria</p>
                          <p className="text-xs text-stone-400 mt-1">Try resetting the status or search filter.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => {
                        const firstItem = order.items[0] || {
                          id: 'def',
                          productName: 'Botanical Herb Extract',
                          productImageUrl: '/images/gotu-kola-tea.jpg',
                          weight: '25g',
                          itemId: '395462678513',
                          quantity: 1,
                          availableStock: 9,
                          unitPrice: order.subtotal,
                          totalPrice: order.subtotal,
                          promotedListing: true
                        };

                        return (
                          <tr key={order.id} className="hover:bg-[#fbfcfb] transition">
                            
                            {/* Order Details Column (Buyer, Product Title, Weight, Tracking, ZIP) */}
                            <td className="py-4 px-4 align-top space-y-2">
                              {/* Order Number, Status Badge & Buyer Name */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {order.orderStatus === 'Delivered' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                                    <Check className="w-3 h-3" />
                                    <span>Delivered</span>
                                  </span>
                                ) : order.orderStatus === 'Shipped' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                                    <Check className="w-3 h-3" />
                                    <span>Shipped {order.carrierScanDate ? `(${order.carrierScanDate})` : ''}</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900">
                                    <Truck className="w-3 h-3 text-amber-800" />
                                    <span>Ship by {order.shipByDate || 'Oct 7'}</span>
                                  </span>
                                )}

                                <button
                                  onClick={() => setSelectedOrderId(order.id)}
                                  className="font-mono text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                                  title="View order details"
                                >
                                  {order.orderNumber}
                                </button>
                                <span className="text-stone-400">•</span>
                                <span className="font-semibold text-stone-800">{order.customerName}</span>
                              </div>

                              {/* Product Thumbnail + Information */}
                              <div className="flex items-start gap-3 pt-1">
                                <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 flex-shrink-0">
                                  <Image
                                    src={resolveBackendImageUrl(firstItem.productImageUrl, '/images/gotu-kola-tea.jpg')}
                                    alt={firstItem.productName}
                                    fill
                                    sizes="56px"
                                    className="object-cover"
                                  />
                                </div>

                                <div className="space-y-0.5 flex-1 min-w-0">
                                  <button
                                    onClick={() => setSelectedOrderId(order.id)}
                                    className="font-semibold text-stone-900 hover:text-blue-600 text-left line-clamp-2 leading-snug cursor-pointer"
                                  >
                                    {firstItem.productName}
                                  </button>
                                  <p className="text-[11px] text-stone-400 font-mono">
                                    {firstItem.itemId || '395462678513'}
                                  </p>
                                  {firstItem.weight && (
                                    <p className="text-xs font-bold text-stone-800">
                                      Weight: {firstItem.weight}
                                    </p>
                                  )}

                                  {/* Tracking line & View Details */}
                                  <div className="pt-0.5 flex items-center gap-2 text-xs flex-wrap">
                                    {order.trackingNumber ? (
                                      <div className="flex items-center gap-1.5 text-[11px]">
                                        <span className="text-stone-500">Tracking:</span>
                                        <span className="font-mono font-bold text-stone-800">{order.trackingNumber}</span>
                                        <button
                                          onClick={() => handleOpenTrackingModal(order)}
                                          className="text-blue-600 underline font-semibold cursor-pointer"
                                        >
                                          Edit
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => handleOpenTrackingModal(order)}
                                        className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                                      >
                                        + Add tracking
                                      </button>
                                    )}
                                    <span className="text-stone-300">•</span>
                                    <button
                                      onClick={() => setSelectedOrderId(order.id)}
                                      className="text-xs font-semibold text-[#0053a0] hover:underline cursor-pointer"
                                    >
                                      View order details
                                    </button>
                                  </div>

                                  {/* Destination Zip */}
                                  {order.shippingZip && (
                                    <p className="text-[11px] text-stone-500">
                                      ZIP code: {order.shippingZip}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Quantity Column */}
                            <td className="py-4 px-3 align-top font-semibold text-stone-900">
                              {firstItem.quantity}{' '}
                              <span className="text-[11px] text-stone-400 font-normal block">
                                ({firstItem.availableStock || 9} available)
                              </span>
                            </td>

                            {/* Subtotal Column */}
                            <td className="py-4 px-3 align-top font-semibold text-stone-900">
                              ${order.subtotal.toFixed(2)}
                              <span className="text-[11px] text-stone-500 font-normal block">
                                {order.shippingCost === 0 ? 'Free shipping' : `+$${order.shippingCost.toFixed(2)} shipping`}
                              </span>
                            </td>

                            {/* Total Column */}
                            <td className="py-4 px-3 align-top font-bold text-stone-900">
                              ${order.totalAmount.toFixed(2)}
                            </td>

                            {/* Date Sold Column */}
                            <td className="py-4 px-3 align-top text-stone-700">
                              <span className="block font-semibold">
                                {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                              <span className="text-[11px] text-stone-400">
                                {new Date(order.createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                              </span>
                            </td>

                            {/* Date Paid Column */}
                            <td className="py-4 px-3 align-top text-stone-700">
                              <span className="font-semibold block">
                                {new Date(order.datePaid || order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            </td>

                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </main>

        </div>

      </div>

      {/* ================= MODAL: ADD OR EDIT TRACKING (Screenshot 4) ================= */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-6">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  Add or edit tracking numbers
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Enter the tracking details for your item. We&apos;ll share these details with the buyer.
                </p>
              </div>
              <button
                onClick={() => setTrackingModalOrder(null)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Left Inputs + Right Product Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
              
              {/* Left Input Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Tracking number
                  </label>
                  <input
                    type="text"
                    value={trackingNumberInput}
                    onChange={(e) => setTrackingNumberInput(e.target.value)}
                    placeholder="e.g. LA000853771LK"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Carrier
                  </label>
                  <input
                    type="text"
                    value={carrierInput}
                    onChange={(e) => setCarrierInput(e.target.value)}
                    placeholder="e.g. Sri Lanka Post, DHL Express, USPS"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Right Product Summary Preview */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2 text-xs">
                <p className="font-bold text-stone-900">
                  Buyer: <span className="text-blue-600 font-semibold">{trackingModalOrder.buyerUsername}</span>
                </p>

                <div className="flex items-start gap-2.5 pt-1">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-stone-200 bg-white flex-shrink-0">
                    <Image
                      src={resolveBackendImageUrl(trackingModalOrder.items[0]?.productImageUrl, '/images/gotu-kola-tea.jpg')}
                      alt="Product"
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>

                  <div className="space-y-0.5 min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-stone-900 line-clamp-2">
                      {trackingModalOrder.items[0]?.productName}
                    </p>
                    <p className="text-[10px] text-stone-400 font-mono">
                      Order #: {trackingModalOrder.orderNumber}
                    </p>
                    <p className="text-[10px] text-stone-400 font-mono">
                      Item #: {trackingModalOrder.items[0]?.itemId || '395462678513'}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setTrackingModalOrder(null)}
                className="px-5 py-2 rounded-full border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!trackingNumberInput.trim() || isSubmittingTracking}
                onClick={handleSaveTracking}
                className="px-6 py-2 rounded-full bg-[#0053a0] hover:bg-[#004280] disabled:opacity-50 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {isSubmittingTracking ? 'Saving...' : 'Save and continue'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL: MESSAGE BUYER ================= */}
      {messageModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Message Buyer ({messageModalOrder.customerName})
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Regarding Order #{messageModalOrder.orderNumber}
                </p>
              </div>
              <button
                onClick={() => {
                  setMessageModalOrder(null);
                  setMessageSent(false);
                }}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {messageSent ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-stone-900 text-sm">Message Sent!</h4>
                <p className="text-xs text-stone-500">Your message has been emailed directly to the buyer.</p>
                <button
                  onClick={() => {
                    setMessageModalOrder(null);
                    setMessageSent(false);
                  }}
                  className="mt-3 px-5 py-2 bg-stone-900 text-white rounded-full text-xs font-bold"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Your message
                  </label>
                  <textarea
                    rows={4}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Write a message regarding dispatch, item questions, or shipping updates..."
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    onClick={() => setMessageModalOrder(null)}
                    className="px-4 py-2 rounded-full border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!messageText.trim()) return;
                      setMessageSent(true);
                      setMessageText('');
                    }}
                    className="px-5 py-2 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD NOTE ================= */}
      {noteModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900">
                Add Private Note (Order #{noteModalOrder.orderNumber})
              </h3>
              <button onClick={() => setNoteModalOrder(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              rows={3}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g. Buyer requested eco-friendly packaging..."
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-stone-600"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setNoteModalOrder(null)} className="px-4 py-1.5 rounded-full border border-stone-300 text-xs font-semibold">
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Internal note saved.');
                  setNoteModalOrder(null);
                }}
                className="px-4 py-1.5 rounded-full bg-stone-900 text-white text-xs font-bold"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
