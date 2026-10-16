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
  ShieldCheck,
  Lock,
  DollarSign,
  Tag,
  Info,
  Calendar,
  Send,
  RefreshCw,
  Zap
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
  fundsStatus?: 'Directly Deposited' | 'Refunded' | 'Pending';
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
  trackingUrl?: string;
  shippedAt?: string;
  carrierScanDate?: string;
  estimatedDeliveryDate?: string;
  payHereOrderId?: string;
  paymentId?: string;
  refundStatus?: string;
  refundReason?: string;
  refundRequestedAt?: string;
  refundProcessedAt?: string;
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
    fundsStatus: 'Directly Deposited',
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
    fundsStatus: 'Directly Deposited',
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
    orderStatus: 'Delivered',
    paymentStatus: 'Paid',
    fundsStatus: 'Directly Deposited',
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
  const [sidebarFilter, setSidebarFilter] = useState<'all' | 'awaiting_payment' | 'awaiting_shipment' | 'paid_and_shipped' | 'refunded' | 'archived'>('all');

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
  const [trackingUrlInput, setTrackingUrlInput] = useState('');
  const [isSubmittingTracking, setIsSubmittingTracking] = useState(false);

  const [messageModalOrder, setMessageModalOrder] = useState<DetailedOrder | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  const [noteModalOrder, setNoteModalOrder] = useState<DetailedOrder | null>(null);
  const [noteText, setNoteText] = useState('');

  // Refund modal state (PayHere Sandbox Automated & Direct Refund)
  const [refundModalOrder, setRefundModalOrder] = useState<DetailedOrder | null>(null);
  const [refundReasonInput, setRefundReasonInput] = useState('Customer requested return/refund');
  const [refundAmountInput, setRefundAmountInput] = useState<number | string>('');
  const [paymentIdInput, setPaymentIdInput] = useState('');
  const [payHereRefundRefInput, setPayHereRefundRefInput] = useState('');
  const [sellerRefundNotesInput, setSellerRefundNotesInput] = useState('');
  const [autoRefundSandbox, setAutoRefundSandbox] = useState(true);
  const [showRefundConfirmBox, setShowRefundConfirmBox] = useState(false);
  const [refundSuccessResult, setRefundSuccessResult] = useState<{ refundId: string; amount: number; orderNumber: string } | null>(null);
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  const handleOpenRefundModal = (o: DetailedOrder) => {
    setRefundModalOrder(o);
    setRefundAmountInput(o.totalAmount);
    setRefundReasonInput(o.refundReason || 'Customer requested return/refund');
    setPaymentIdInput(o.paymentId || '');
    setPayHereRefundRefInput('');
    setSellerRefundNotesInput('');
    setAutoRefundSandbox(true);
    setShowRefundConfirmBox(false);
    setRefundSuccessResult(null);
    setRefundError(null);
  };

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
          payHereOrderId: o.payHereOrderId || undefined,
          paymentId: o.paymentId || undefined,
          salesRecordNo: `${236 - idx}`,
          createdAt: o.createdAt || new Date().toISOString(),
          datePaid: o.createdAt || new Date().toISOString(),
          shipByDate: 'Within 3 business days',
          estimatedDeliveryDate: o.estimatedDeliveryDate || undefined,
          estimatedDelivery: o.estimatedDeliveryDate
            ? new Date(o.estimatedDeliveryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
            : new Date(new Date(o.createdAt || Date.now()).getTime() + 21 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
          orderStatus: o.orderStatus === 'Delivered'
            ? 'Delivered'
            : (o.orderStatus === 'Shipped' || o.trackingNumber)
              ? 'Shipped'
              : (o.orderStatus || 'Awaiting shipment'),
          paymentStatus: o.paymentStatus || 'Paid',
          fundsStatus: (o.paymentStatus === 'Refunded' || o.orderStatus === 'Cancelled')
            ? 'Refunded'
            : (o.paymentStatus === 'Refunded' ? 'Refunded' : 'Directly Deposited'),
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
          trackingUrl: o.trackingUrl || undefined,
          shippedAt: o.shippedAt || undefined,
          refundStatus: o.refundStatus || 'None',
          refundReason: o.refundReason || undefined,
          refundRequestedAt: o.refundRequestedAt || undefined,
          refundProcessedAt: o.refundProcessedAt || undefined,
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
            payHereOrderId: o.payHereOrderId || existing?.payHereOrderId || undefined,
            paymentId: o.paymentId || existing?.paymentId || undefined,
            salesRecordNo: `${236 - idx}`,
            createdAt: o.createdAt || new Date().toISOString(),
            datePaid: o.createdAt || new Date().toISOString(),
            shipByDate: 'Within 3 business days',
            estimatedDeliveryDate: o.estimatedDeliveryDate || existing?.estimatedDeliveryDate || undefined,
            estimatedDelivery: (o.estimatedDeliveryDate || existing?.estimatedDeliveryDate)
              ? new Date(o.estimatedDeliveryDate || existing?.estimatedDeliveryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
              : new Date(new Date(o.createdAt || Date.now()).getTime() + 21 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
            orderStatus: resolvedStatus,
            paymentStatus: o.paymentStatus || 'Paid',
            fundsStatus: (o.paymentStatus === 'Refunded' || resolvedStatus === 'Cancelled')
              ? 'Refunded'
              : (o.paymentStatus === 'Paid' ? 'Directly Deposited' : 'Pending'),
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
            trackingUrl: existing?.trackingUrl || o.trackingUrl || undefined,
            carrierScanDate: existing?.carrierScanDate || (resolvedStatus === 'Delivered' || resolvedStatus === 'Shipped' ? new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : undefined),
            shippedAt: o.shippedAt || undefined,
            refundStatus: o.refundStatus || existing?.refundStatus || 'None',
            refundReason: o.refundReason || existing?.refundReason || undefined,
            refundRequestedAt: o.refundRequestedAt || existing?.refundRequestedAt || undefined,
            refundProcessedAt: o.refundProcessedAt || existing?.refundProcessedAt || undefined,
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
      if (sidebarFilter === 'awaiting_shipment' && (order.orderStatus === 'Shipped' || order.orderStatus === 'Delivered' || order.orderStatus === 'Cancelled')) return false;
      if (sidebarFilter === 'paid_and_shipped' && order.orderStatus !== 'Shipped' && order.orderStatus !== 'Delivered') return false;
      if (sidebarFilter === 'refunded' && order.paymentStatus !== 'Refunded' && order.refundStatus !== 'Requested' && order.orderStatus !== 'Cancelled') return false;

      // Status dropdown filter
      if (statusFilter === 'awaiting_payment' && order.paymentStatus !== 'Pending') return false;
      if (statusFilter === 'awaiting_shipment' && (order.orderStatus === 'Shipped' || order.orderStatus === 'Delivered' || order.orderStatus === 'Cancelled')) return false;
      if (statusFilter === 'paid_and_shipped' && order.orderStatus !== 'Shipped' && order.orderStatus !== 'Delivered') return false;
      if (statusFilter === 'refunded' && order.paymentStatus !== 'Refunded' && order.refundStatus !== 'Requested' && order.orderStatus !== 'Cancelled') return false;

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
    setTrackingUrlInput(order.trackingUrl || '');
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
          trackingUrl: trackingUrlInput.trim() || undefined,
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
          trackingUrl: trackingUrlInput.trim() || undefined,
          orderStatus: 'Shipped',
          carrierScanDate: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          fundsStatus: 'Directly Deposited'
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
          fundsStatus: o.paymentStatus === 'Refunded' ? 'Refunded' : 'Directly Deposited',
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

  // Step 1: Validate inputs and open the Confirmation Box before executing refund
  const handleOpenRefundConfirm = () => {
    if (!refundModalOrder) return;
    setRefundError(null);

    const parsedAmount = typeof refundAmountInput === 'number'
      ? refundAmountInput
      : (refundAmountInput ? parseFloat(refundAmountInput) : refundModalOrder.totalAmount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setRefundError('Please enter a valid refund amount greater than $0.00.');
      return;
    }

    if (parsedAmount > refundModalOrder.totalAmount) {
      setRefundError(`Refund amount cannot exceed the total order amount of $${refundModalOrder.totalAmount.toFixed(2)}.`);
      return;
    }

    if (!autoRefundSandbox && !payHereRefundRefInput.trim()) {
      setRefundError('Please enter the manual PayHere Refund Reference ID or switch to Automated Sandbox mode.');
      return;
    }

    // Open confirmation box
    setShowRefundConfirmBox(true);
  };

  // Step 2: Execute automated or manual PayHere refund upon user confirmation
  const handleExecuteRefund = async () => {
    if (!refundModalOrder) return;

    setIsSubmittingRefund(true);
    setRefundError(null);

    try {
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('arboveya_token') : '');
      const parsedAmount = typeof refundAmountInput === 'number'
        ? refundAmountInput
        : (refundAmountInput ? parseFloat(refundAmountInput) : refundModalOrder.totalAmount);

      const res = await fetch(`${API_BASE_URL}/orders/${refundModalOrder.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: 'Bearer ' + authToken } : {})
        },
        body: JSON.stringify({
          reason: refundReasonInput || 'Customer requested return/refund',
          amount: isNaN(parsedAmount) ? refundModalOrder.totalAmount : parsedAmount,
          autoRefundSandbox: autoRefundSandbox,
          payHereRefundId: autoRefundSandbox ? undefined : (payHereRefundRefInput.trim() || undefined),
          paymentId: paymentIdInput.trim() || refundModalOrder.paymentId || (payHereRefundRefInput.trim() || undefined),
          notes: sellerRefundNotesInput.trim() || undefined
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to process refund');
      }

      const updatedOrder = await res.json().catch(() => null);

      // Extract generated refund reference
      let finalRefundRef = '';
      if (updatedOrder?.refundReason) {
        const match = updatedOrder.refundReason.match(/PayHere Ref:\s*([^\s|]+)/i);
        if (match) finalRefundRef = match[1];
      }
      if (!finalRefundRef) {
        finalRefundRef = payHereRefundRefInput.trim() || 'PH-SANDBOX-REF-PROCESSED';
      }

      // Update local state
      setLocalOrders(prev => prev.map(o => {
        if (o.id === refundModalOrder.id) {
          const recReason = updatedOrder?.refundReason || 
            `${autoRefundSandbox ? 'PayHere Sandbox Auto-Refund' : 'PayHere Refund'} | ${refundReasonInput} | PayHere Ref: ${finalRefundRef}`;
          return {
            ...o,
            orderStatus: 'Cancelled',
            paymentStatus: 'Refunded',
            fundsStatus: 'Refunded',
            refundStatus: 'Refunded',
            refundReason: recReason,
            refundProcessedAt: new Date().toISOString()
          };
        }
        return o;
      }));

      setRefundSuccessResult({
        refundId: finalRefundRef,
        amount: isNaN(parsedAmount) ? refundModalOrder.totalAmount : parsedAmount,
        orderNumber: refundModalOrder.orderNumber
      });

      onRefresh?.();
    } catch (err: any) {
      console.error('Error processing refund:', err);
      setRefundError(err?.message || 'Failed to process refund. Please verify backend connection and try again.');
    } finally {
      setIsSubmittingRefund(false);
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
  // RENDER MAIN VIEW (Supports both Order Details & Table, with Modals)
  // =========================================================================
  return (
    <>
      {activeOrderDetails ? (
        (() => {
          const o = activeOrderDetails;
          const allItems = (o.items && o.items.length > 0) ? o.items : [{
            id: 'default',
            productName: 'Botanical Herbal Remedy',
            productImageUrl: '/images/gotu-kola-tea.jpg',
            weight: '25g',
            itemId: '395462678513',
            quantity: 1,
            availableStock: 9,
            unitPrice: o.subtotal,
            totalPrice: o.subtotal
          }];
          const totalItemUnits = allItems.reduce((acc, it) => acc + (it.quantity || 1), 0);
          const firstItem = allItems[0];

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

                {/* Product Banner (Small image(s) + Title) */}
                <div className="flex items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-stone-200 shadow-2xs flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center -space-x-3 overflow-hidden flex-shrink-0">
                      {allItems.slice(0, 3).map((it, idx) => (
                        <div key={it.id || idx} className="relative w-11 h-11 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0 border-2 border-white shadow-2xs">
                          <Image
                            src={resolveBackendImageUrl(it.productImageUrl, '/images/gotu-kola-tea.jpg')}
                            alt={it.productName}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        </div>
                      ))}
                      {allItems.length > 3 && (
                        <div className="w-11 h-11 rounded-lg bg-stone-100 border-2 border-white flex items-center justify-center text-xs font-bold text-stone-600 shadow-2xs">
                          +{allItems.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold text-stone-900 line-clamp-1">
                        {allItems.length === 1 ? allItems[0].productName : `${allItems[0].productName} + ${allItems.length - 1} other item(s)`}
                      </h2>
                      <p className="text-xs text-stone-500">
                        {allItems.length} distinct product{allItems.length === 1 ? '' : 's'} · {totalItemUnits} total item unit{totalItemUnits === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-bold text-[#1c3f24] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      ${o.subtotal.toFixed(2)} Subtotal
                    </span>
                  </div>
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

                      {/* 2. Tracking button (opens tracking dialog) */}
                      <button
                        type="button"
                        onClick={() => handleOpenTrackingModal(o)}
                        className="px-4 py-2 rounded-full bg-[#0053a0] hover:bg-[#004280] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                        title="View, add or edit tracking details"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>{o.trackingNumber ? `Tracking (${o.trackingNumber})` : 'Add tracking'}</span>
                      </button>

                      {/* 3. Mark as shipped */}
                      <button
                        onClick={() => handleUpdateOrderStatus(o.id, 'Shipped')}
                        disabled={o.orderStatus === 'Shipped' || o.orderStatus === 'Delivered'}
                        className={`px-3.5 py-2 rounded-full text-xs font-semibold transition shadow-2xs flex items-center gap-1.5 cursor-pointer ${o.orderStatus === 'Shipped' || o.orderStatus === 'Delivered'
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
                        className={`px-3.5 py-2 rounded-full text-xs font-semibold transition shadow-2xs flex items-center gap-1.5 cursor-pointer ${o.orderStatus === 'Delivered'
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
                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold bg-white ${o.orderStatus === 'Shipped' || o.orderStatus === 'Delivered'
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
                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold ${o.orderStatus === 'Delivered'
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
                              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Tracking Active</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenTrackingModal(o)}
                                    className="text-xs font-bold text-[#0053a0] hover:underline cursor-pointer flex items-center gap-1"
                                  >
                                    <Truck className="w-3.5 h-3.5" />
                                    <span>View / Edit tracking</span>
                                  </button>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-mono text-sm font-bold text-[#1c3f24] tracking-wide">
                                    {o.trackingNumber}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (o.trackingNumber) {
                                        navigator.clipboard.writeText(o.trackingNumber);
                                        alert(`Tracking number ${o.trackingNumber} copied to clipboard!`);
                                      }
                                    }}
                                    className="text-[11px] text-[#0053a0] hover:underline cursor-pointer font-medium"
                                  >
                                    Copy #
                                  </button>
                                </div>
                                <p className="text-[11px] text-stone-500">
                                  Carrier: <strong className="text-stone-700">{o.shippingCarrier || 'Sri Lanka Post'}</strong>
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-stone-400 font-mono text-xs">No tracking information added yet.</p>
                                <button
                                  type="button"
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

                    {/* Item Details Card - Supports ALL ordered items */}
                    <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-6">
                      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                        <div>
                          <h3 className="text-base font-bold text-stone-900">
                            Ordered Items ({allItems.length})
                          </h3>
                          <p className="text-xs text-stone-500">
                            Total {totalItemUnits} unit{totalItemUnits === 1 ? '' : 's'} across {allItems.length} botanical remedy listing{allItems.length === 1 ? '' : 's'}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-[#1c3f24] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          Subtotal: ${o.subtotal.toFixed(2)}
                        </span>
                      </div>

                      {/* List of items */}
                      <div className="divide-y divide-stone-100 space-y-4">
                        {allItems.map((item, idx) => (
                          <div key={item.id || idx} className={`flex flex-col sm:flex-row gap-4 items-start ${idx > 0 ? 'pt-4' : ''}`}>
                            {/* Thumbnail Image */}
                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-stone-200 bg-stone-100 flex-shrink-0">
                              <Image
                                src={resolveBackendImageUrl(item.productImageUrl, '/images/gotu-kola-tea.jpg')}
                                alt={item.productName}
                                fill
                                sizes="96px"
                                className="object-cover"
                              />
                            </div>

                            {/* Item Description */}
                            <div className="flex-1 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-sm sm:text-base font-bold text-stone-900 hover:text-blue-600 cursor-pointer">
                                  {item.productName}
                                </h4>
                                <span className="font-mono text-sm font-bold text-stone-900">
                                  ${(item.totalPrice || ((item.unitPrice || 0) * (item.quantity || 1))).toFixed(2)}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-stone-700">
                                {item.weight ? `Weight: ${item.weight}` : 'Standard Unit'}
                              </p>
                              <div className="flex items-center gap-3 text-[11px] text-stone-500 flex-wrap">
                                <span>Item ID: <span className="font-mono">{item.itemId || '395462678513'}</span></span>
                                <span>•</span>
                                <span>Quantity: <strong className="text-stone-800">{item.quantity}</strong></span>
                                <span>•</span>
                                <span>Unit Price: <strong className="text-stone-800">${(item.unitPrice || 0).toFixed(2)}</strong></span>
                              </div>
                              <button
                                onClick={() => handleOpenTrackingModal(o)}
                                className="text-xs font-semibold text-blue-600 hover:underline block pt-1 cursor-pointer"
                              >
                                {o.trackingNumber ? `Tracking: ${o.trackingNumber}` : '+ Add tracking'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Item Numbers Table */}
                      <div className="overflow-x-auto text-xs pt-2">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-stone-400 font-semibold uppercase text-[10px] border-b border-stone-100 pb-2">
                              <th className="pb-2 font-normal">Remedy Item</th>
                              <th className="pb-2 font-normal text-center">Quantity</th>
                              <th className="pb-2 font-normal text-right">Item price</th>
                              <th className="pb-2 font-normal text-right">Item total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100">
                            {allItems.map((item, idx) => (
                              <tr key={item.id || idx}>
                                <td className="py-3 font-semibold text-stone-900 max-w-[280px]">
                                  <div className="font-medium text-stone-900 truncate" title={item.productName}>
                                    {item.productName}
                                  </div>
                                  <div className="text-[11px] text-stone-400 font-mono">
                                    ID: {item.itemId || '395462678513'}
                                  </div>
                                </td>
                                <td className="py-3 font-semibold text-stone-900 text-center">
                                  {item.quantity}{' '}
                                  <span className="text-[11px] text-stone-400 font-normal">
                                    ({item.availableStock || 9} available)
                                  </span>
                                </td>
                                <td className="py-3 font-semibold text-stone-900 text-right">
                                  ${(item.unitPrice || 0).toFixed(2)}
                                </td>
                                <td className="py-3 font-bold text-stone-900 text-right">
                                  ${(item.totalPrice || ((item.unitPrice || 0) * (item.quantity || 1))).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                            {/* Summary row */}
                            <tr className="bg-stone-50/70 font-semibold">
                              <td className="py-2.5 px-2 text-stone-600">
                                Total ({totalItemUnits} unit{totalItemUnits === 1 ? '' : 's'})
                              </td>
                              <td className="py-2.5 text-center text-stone-800 font-bold">
                                {totalItemUnits}
                              </td>
                              <td className="py-2.5 text-right text-stone-500">
                                Items Subtotal:
                              </td>
                              <td className="py-2.5 text-right font-bold text-stone-900">
                                ${allItems.reduce((sum, it) => sum + (it.totalPrice || ((it.unitPrice || 0) * (it.quantity || 1))), 0).toFixed(2)}
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

                    {/* Payment & Settlement Card (Direct PayHere Merchant Account - No Holding Process) */}
                    <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4 text-xs">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-emerald-700" />
                          <span>Direct PayHere Settlement</span>
                        </h3>
                        {o.paymentStatus === 'Refunded' || o.orderStatus === 'Cancelled' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertCircle className="w-3 h-3 text-rose-700" />
                            <span>Refunded via PayHere</span>
                          </span>
                        ) : o.paymentStatus === 'Paid' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            <span>Directly Deposited</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>Payment Pending</span>
                          </span>
                        )}
                      </div>

                      {/* Explanation Banner */}
                      {o.paymentStatus === 'Refunded' || o.orderStatus === 'Cancelled' ? (
                        <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-rose-900">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                            <span>Order Cancelled & Refunded</span>
                          </div>
                          <p className="text-[11px] text-rose-800/90 leading-relaxed">
                            Payment was refunded manually to the buyer via your PayHere Merchant account. Item stock was restored.
                          </p>
                        </div>
                      ) : o.refundStatus === 'Requested' ? (
                        <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl space-y-2">
                          <div className="flex items-center gap-1.5 font-bold text-amber-950">
                            <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                            <span>Buyer Refund Requested</span>
                          </div>
                          <p className="text-[11px] text-amber-900 leading-relaxed">
                            Customer requested a refund: <strong>&quot;{o.refundReason || 'Customer requested return/refund'}&quot;</strong>. You can execute an automated refund directly through PayHere Sandbox mode.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleOpenRefundModal(o)}
                            className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Issue PayHere Refund Now</span>
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span>Direct Deposit (No Holding Process)</span>
                          </div>
                          <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                            Buyer payment of <strong>${o.totalAmount.toFixed(2)}</strong> was deposited directly into your verified PayHere account upon purchase. Funds are never held in escrow.
                          </p>
                        </div>
                      )}

                      {/* Financial Breakdown */}
                      <div className="space-y-2 pt-1 border-t border-stone-100 text-stone-600">
                        <div className="flex justify-between items-center">
                          <span>Items Subtotal</span>
                          <span className="font-semibold text-stone-900">${o.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Shipping Allocation</span>
                          <span className="font-semibold text-stone-900">${o.shippingCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-stone-200 text-xs font-bold text-stone-900">
                          <span>Direct Payment Received</span>
                          <span className="text-sm font-black text-emerald-800">${o.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-2 space-y-2">
                        {o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(o.id, 'Delivered')}
                            className="w-full py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                            title="Mark order as delivered"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Mark Order as Delivered</span>
                          </button>
                        )}

                        {o.orderStatus !== 'Cancelled' && o.paymentStatus !== 'Refunded' && (
                          <button
                            type="button"
                            onClick={() => handleOpenRefundModal(o)}
                            className="w-full py-2 rounded-full border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                            title="Issue PayHere refund to buyer"
                          >
                            <Zap className="w-3.5 h-3.5 text-rose-600" />
                            <span>Issue Refund (PayHere Sandbox)</span>
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          );
        })()
      ) : (
        /* VIEW: MAIN "MANAGE ALL ORDERS" TABLE (Screenshot 1) */
        <div className="w-full bg-[#f8f9fa] min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans text-[#181818]">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Main Grid: Collapsible Sidebar + Content Area */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">

              {/* ================= LEFT SIDEBAR (Screenshot 1) ================= */}
              <aside className={`transition-all duration-200 ${sidebarCollapsed ? 'w-full lg:w-16' : 'w-full lg:w-56'
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left cursor-pointer ${sidebarFilter === 'all'
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left cursor-pointer ${sidebarFilter === 'awaiting_payment'
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left cursor-pointer ${sidebarFilter === 'awaiting_shipment'
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left cursor-pointer ${sidebarFilter === 'paid_and_shipped'
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
                    onClick={() => setSidebarFilter('refunded')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left cursor-pointer ${sidebarFilter === 'refunded'
                        ? 'bg-rose-50 text-rose-900 font-bold border border-rose-200 shadow-2xs'
                        : 'text-stone-600 hover:bg-stone-50'
                      }`}
                  >
                    <span>{!sidebarCollapsed ? 'Refunds & Returns' : 'Refund'}</span>
                    {!sidebarCollapsed && (
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-full">
                        {localOrders.filter(o => o.paymentStatus === 'Refunded' || o.refundStatus === 'Requested' || o.orderStatus === 'Cancelled').length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setSidebarFilter('archived')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left cursor-pointer ${sidebarFilter === 'archived'
                        ? 'bg-stone-100 text-stone-900 font-bold'
                        : 'text-stone-600 hover:bg-stone-50'
                      }`}
                  >
                    <span>{!sidebarCollapsed ? 'Archived' : 'Arc'}</span>
                  </button>
                </nav>
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
                      <option value="refunded">Status: Refunds & Returns ({localOrders.filter(o => o.paymentStatus === 'Refunded' || o.refundStatus === 'Requested' || o.orderStatus === 'Cancelled').length})</option>
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
                  <div className="relative w-44 sm:w-52 md:w-56 flex items-center">
                    <input
                      type="text"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-3 pr-8 py-2 rounded-xl border border-stone-300 bg-white text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-600 transition"
                    />
                    {searchKeyword ? (
                      <button
                        type="button"
                        onClick={() => setSearchKeyword('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 pointer-events-none"
                        tabIndex={-1}
                      >
                        <Search className="w-4 h-4" />
                      </button>
                    )}
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
                                    {order.refundStatus === 'Requested' ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                                        <AlertCircle className="w-3 h-3 text-amber-700" />
                                        <span>Refund Requested</span>
                                      </span>
                                    ) : order.orderStatus === 'Delivered' ? (
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

                                  {/* Prominent Refund Alert Banner if Buyer Opened Refund */}
                                  {order.refundStatus === 'Requested' && (
                                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-300 flex items-center justify-between gap-3 text-xs">
                                      <div className="flex items-center gap-1.5 text-amber-900">
                                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                        <span>
                                          <strong>Buyer Opened Refund Request:</strong> &quot;{order.refundReason || 'Package not delivered or damaged'}&quot;
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleOpenRefundModal(order);
                                        }}
                                        className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer flex-shrink-0 shadow-2xs"
                                      >
                                        Process Refund
                                      </button>
                                    </div>
                                  )}

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
                                      {order.items && order.items.length > 1 && (
                                        <div className="pt-0.5">
                                          <button
                                            type="button"
                                            onClick={() => setSelectedOrderId(order.id)}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                                            title="Click to view all items in this order"
                                          >
                                            <Package className="w-2.5 h-2.5 text-emerald-700" />
                                            <span>+{order.items.length - 1} more remedy item{order.items.length - 1 > 1 ? 's' : ''} ({order.items.reduce((acc, it) => acc + (it.quantity || 1), 0)} units total)</span>
                                          </button>
                                        </div>
                                      )}
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
                                          <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
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
                                        <span className="text-[11px] text-stone-500">
                                          Est: {order.estimatedDelivery}
                                        </span>
                                        <span className="text-stone-300">•</span>
                                        <button
                                          onClick={() => setSelectedOrderId(order.id)}
                                          className="text-xs font-semibold text-[#0053a0] hover:underline cursor-pointer"
                                        >
                                          View order details
                                        </button>
                                        <span className="text-stone-300">•</span>
                                        {order.orderStatus !== 'Cancelled' && order.paymentStatus !== 'Refunded' ? (
                                          <button
                                            type="button"
                                            onClick={() => handleOpenRefundModal(order)}
                                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer inline-flex items-center gap-1"
                                            title="Issue PayHere refund to buyer"
                                          >
                                            <RotateCcw className="w-3 h-3" />
                                            <span>Issue Refund</span>
                                          </button>
                                        ) : (
                                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                            Refunded
                                          </span>
                                        )}
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
        </div>
      )}

      {/* ================= MODAL: ADD OR EDIT TRACKING (Screenshot 4) ================= */}
      {trackingModalOrder && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setTrackingModalOrder(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-6">

            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#0053a0]" />
                  <span>{trackingModalOrder.trackingNumber ? 'Order Tracking & Shipment' : 'Add Tracking Number'}</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Order #{trackingModalOrder.orderNumber} &bull; Buyer: <strong className="text-stone-800">{trackingModalOrder.customerName}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTrackingModalOrder(null)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 transition cursor-pointer"
                title="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If tracking already active, show prominent status banner */}
            {trackingModalOrder.trackingNumber && (
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Package In Transit</span>
                  </div>
                  <p className="font-mono text-xs font-bold text-[#1c3f24]">
                    {trackingModalOrder.trackingNumber} ({trackingModalOrder.shippingCarrier || 'Sri Lanka Post'})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (trackingModalOrder.trackingNumber) {
                      navigator.clipboard.writeText(trackingModalOrder.trackingNumber);
                      alert(`Tracking number ${trackingModalOrder.trackingNumber} copied to clipboard!`);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-2xs transition cursor-pointer"
                >
                  Copy #
                </button>
              </div>
            )}

            {/* Modal Body: Left Inputs + Right Product Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">

              {/* Left Input Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Tracking number *
                  </label>
                  <input
                    type="text"
                    value={trackingNumberInput}
                    onChange={(e) => setTrackingNumberInput(e.target.value)}
                    placeholder="e.g. LA000853771LK"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono font-medium"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    The buyer will see this code to track their herbal parcel live.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Shipping Carrier
                  </label>
                  <input
                    type="text"
                    value={carrierInput}
                    onChange={(e) => setCarrierInput(e.target.value)}
                    placeholder="e.g. Sri Lanka Post, DHL Express, USPS"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />

                  {/* Quick Select Chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['Sri Lanka Post', 'DHL Express', 'FedEx', 'USPS', 'UPS'].map((carrierName) => (
                      <button
                        key={carrierName}
                        type="button"
                        onClick={() => setCarrierInput(carrierName)}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition cursor-pointer ${carrierInput === carrierName
                            ? 'bg-[#0053a0] text-white border-[#0053a0]'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200'
                          }`}
                      >
                        {carrierName}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Tracking URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={trackingUrlInput}
                    onChange={(e) => setTrackingUrlInput(e.target.value)}
                    placeholder="https://t.17track.net/en#nums=... or carrier link"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono text-[11px]"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Optional carrier URL. If left empty, Arboveya will auto-generate direct carrier links for the buyer.
                  </p>
                </div>
              </div>

              {/* Right Product Summary Preview */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Recipient</span>
                  <p className="font-bold text-stone-900">
                    {trackingModalOrder.customerName} <span className="text-blue-600 font-normal">(@{trackingModalOrder.buyerUsername})</span>
                  </p>
                  <p className="text-stone-500 text-[11px] leading-tight mt-0.5 truncate">
                    {trackingModalOrder.shippingCity}, {trackingModalOrder.shippingCountry}
                  </p>
                </div>

                <div className="flex items-start gap-2.5 pt-1.5 border-t border-stone-200/60">
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
                    <p className="text-[10px] text-emerald-700 font-medium">
                      Est. Delivery: {trackingModalOrder.estimatedDelivery || (trackingModalOrder.createdAt ? new Date(new Date(trackingModalOrder.createdAt).getTime() + 21 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending')}
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
                className="px-6 py-2 rounded-full bg-[#0053a0] hover:bg-[#004280] disabled:opacity-50 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isSubmittingTracking ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Tracking Information</span>
                )}
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

      {/* ================= MODAL: PROCESS PAYHERE SANDBOX REFUND ================= */}
      {refundModalOrder && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmittingRefund) {
              setRefundModalOrder(null);
              setShowRefundConfirmBox(false);
              setRefundSuccessResult(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5 my-8">
            
            {/* ----------------- STATE 1: REFUND SUCCESS RESULT ----------------- */}
            {refundSuccessResult ? (
              <div className="space-y-5 text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stone-900">
                    Refund Successfully Processed!
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Executed via PayHere Sandbox Mode for Order <strong>#{refundSuccessResult.orderNumber}</strong>
                  </p>
                </div>

                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-left space-y-2.5 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                    <span className="text-stone-500 font-medium">Refund Reference ID</span>
                    <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 select-all">
                      {refundSuccessResult.refundId}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                    <span className="text-stone-500 font-medium">Refunded Amount</span>
                    <span className="font-bold text-stone-900 text-sm">
                      ${refundSuccessResult.amount.toFixed(2)} USD
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                    <span className="text-stone-500 font-medium">Order Status</span>
                    <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                      Cancelled &bull; Refunded
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-stone-500 font-medium">Product Inventory</span>
                    <span className="font-semibold text-emerald-700">
                      Restocked to catalog
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-left text-xs text-emerald-900 flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Email notifications with the PayHere refund confirmation receipt have been dispatched to the buyer and your seller account.
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRefundModalOrder(null);
                      setRefundSuccessResult(null);
                      setShowRefundConfirmBox(false);
                    }}
                    className="w-full py-3 rounded-full bg-[#2E4D38] hover:bg-[#233c2c] text-white text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            ) : showRefundConfirmBox ? (
              /* ----------------- STATE 2: EXPLICIT CONFIRMATION BOX ----------------- */
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center gap-3 pb-3 border-b border-amber-200/60">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 mb-1">
                      Confirmation Required
                    </span>
                    <h3 className="text-base font-bold text-stone-900">
                      Do you want to process this refund?
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  Please review the refund details below before confirming. If you select <strong>&quot;Yes&quot;</strong>, the automated PayHere refund process will immediately take place.
                </p>

                {/* Refund Summary Card */}
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-2.5 text-xs">
                  <div className="grid grid-cols-2 gap-2 pb-2 border-b border-amber-200/60">
                    <div>
                      <span className="text-stone-500 block text-[10px]">Order Reference</span>
                      <span className="font-mono font-bold text-stone-900">{refundModalOrder.orderNumber}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-[10px]">Customer</span>
                      <span className="font-semibold text-stone-900 truncate block">
                        {refundModalOrder.customerName}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pb-2 border-b border-amber-200/60">
                    <div>
                      <span className="text-stone-500 block text-[10px]">Refund Amount</span>
                      <span className="font-bold text-emerald-800 text-sm">
                        ${Number(refundAmountInput || refundModalOrder.totalAmount).toFixed(2)} USD
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-[10px]">Gateway Mode</span>
                      <span className="inline-flex items-center gap-1 font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded text-[11px]">
                        <Zap className="w-3 h-3 text-blue-600" />
                        {autoRefundSandbox ? 'PayHere Sandbox (Auto)' : 'Manual PayHere'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-stone-500 block text-[10px]">Refund Reason</span>
                    <span className="font-medium text-stone-800 italic">
                      &quot;{refundReasonInput || 'Customer requested return/refund'}&quot;
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-stone-100 rounded-xl text-[11.5px] text-stone-600 space-y-1">
                  <p className="font-medium text-stone-800 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-stone-500" />
                    What happens next:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-stone-600 pl-1 text-[11px]">
                    <li>{autoRefundSandbox ? 'Automated payment reversal will be executed via PayHere Sandbox mode.' : 'Manual PayHere reference will be recorded.'}</li>
                    <li>The order status will transition to <strong>Cancelled / Refunded</strong>.</li>
                    <li>Catalog inventory will be restored for all items in this order.</li>
                    <li>Official refund notification emails will be sent to the customer.</li>
                  </ul>
                </div>

                {refundError && (
                  <div className="p-3 bg-rose-100/80 border border-rose-300 text-rose-900 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                    <span>{refundError}</span>
                  </div>
                )}

                {/* Confirmation Box Actions: Yes vs No */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => !isSubmittingRefund && setShowRefundConfirmBox(false)}
                    disabled={isSubmittingRefund}
                    className="px-5 py-2.5 rounded-full border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                  >
                    No, Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteRefund}
                    disabled={isSubmittingRefund}
                    className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingRefund ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing PayHere Sandbox Refund...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Yes, Execute Refund Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* ----------------- STATE 3: REFUND DETAILS FORM ----------------- */
              <>
                {/* Header */}
                <div className="flex items-start justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#2E4D38] flex items-center justify-center shadow-xs">
                      <RotateCcw className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-stone-900">
                          Issue PayHere Refund
                        </h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-bold border border-blue-200">
                          <Zap className="w-2.5 h-2.5 text-blue-600" />
                          Sandbox Mode
                        </span>
                      </div>
                      <p className="text-xs text-stone-500">
                        Order #{refundModalOrder.orderNumber} &bull; Buyer: <strong className="text-stone-800">{refundModalOrder.customerName}</strong>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => !isSubmittingRefund && setRefundModalOrder(null)}
                    disabled={isSubmittingRefund}
                    className="p-1 rounded-full text-stone-400 hover:text-stone-700 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* PayHere Transaction Reference Info Card */}
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-700 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-stone-600">PayHere Order Reference:</span>
                    <span className="font-mono font-bold text-stone-900">{refundModalOrder.payHereOrderId || refundModalOrder.orderNumber}</span>
                  </div>
                  {refundModalOrder.paymentId ? (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-stone-600">PayHere Payment ID:</span>
                      <span className="font-mono font-bold text-[#2E4D38] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {refundModalOrder.paymentId}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span>PayHere Payment ID:</span>
                      <span className="italic text-[10px]">Captured on live IPN callback</span>
                    </div>
                  )}
                  <div className="pt-1.5 border-t border-stone-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-stone-600">PayHere Account Portal:</span>
                    <div className="flex items-center gap-2">
                      <a
                        href="https://sandbox.payhere.lk"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2E4D38] font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <span>sandbox.payhere.lk</span>
                        <span>&rarr;</span>
                      </a>
                      <span className="text-stone-300">|</span>
                      <a
                        href="https://www.payhere.lk"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-stone-600 font-semibold hover:underline"
                      >
                        payhere.lk (Live)
                      </a>
                    </div>
                  </div>
                </div>

                {/* Refund Mode Selection */}
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-stone-800">Choose Refund Method</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Option 1: Automated PayHere API */}
                    <div
                      onClick={() => setAutoRefundSandbox(true)}
                      className={`p-3 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                        autoRefundSandbox
                          ? 'border-[#2E4D38] bg-emerald-50/60 shadow-xs'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900">
                            <Zap className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Auto PayHere API</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-stone-600 leading-snug">
                          Calls PayHere automated refund API. Requires PAYHERE_APP_ID &amp; SECRET configured on server.
                        </p>
                      </div>
                    </div>

                    {/* Option 2: Manual PayHere Portal */}
                    <div
                      onClick={() => setAutoRefundSandbox(false)}
                      className={`p-3 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                        !autoRefundSandbox
                          ? 'border-[#2E4D38] bg-emerald-50/60 shadow-xs'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900">
                            <RotateCcw className="w-3.5 h-3.5 text-stone-600" />
                            <span>Manual Portal Entry</span>
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                            Recommended
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 leading-snug">
                          Issue refund inside PayHere account (Payments &gt; Refund) and paste the reference.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4 text-xs">
                  {/* Automated PayHere payment_id input if not yet captured on order */}
                  {autoRefundSandbox && !refundModalOrder.paymentId && (
                    <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block font-semibold text-blue-950 text-xs">
                          PayHere Payment ID (Optional - Auto-retrieved via Retrieval API)
                        </label>
                        <span className="text-[10px] text-blue-700 font-medium">Auto-Detect</span>
                      </div>
                      <input
                        type="text"
                        value={paymentIdInput}
                        onChange={(e) => setPaymentIdInput(e.target.value)}
                        placeholder="Leave empty to auto-detect via PayHere, or enter e.g. 320027150501"
                        className="w-full px-3 py-2 rounded-xl border border-blue-300 text-stone-900 bg-white focus:outline-none focus:border-blue-600 font-mono text-xs"
                      />
                      <p className="text-[10px] text-blue-800 leading-tight">
                        Leave blank to automatically query PayHere Retrieval API using Order Reference <strong>#{refundModalOrder.payHereOrderId || refundModalOrder.orderNumber}</strong>.
                      </p>
                    </div>
                  )}

                  {/* Manual reference input if manual mode */}
                  {!autoRefundSandbox && (
                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
                      <div className="text-[11px] text-amber-900">
                        <strong>Steps to refund in PayHere Portal:</strong>
                        <ol className="list-decimal list-inside mt-1 space-y-0.5 text-amber-800">
                          <li>Log in to <a href="https://sandbox.payhere.lk" target="_blank" rel="noopener noreferrer" className="underline font-semibold">sandbox.payhere.lk</a> (or <a href="https://www.payhere.lk" target="_blank" rel="noopener noreferrer" className="underline font-semibold">payhere.lk</a> for live)</li>
                          <li>Go to <strong>Payments</strong> and search for order <strong>#{refundModalOrder.payHereOrderId || refundModalOrder.orderNumber}</strong></li>
                          <li>Click <strong>Refund</strong> and complete the reversal</li>
                          <li>Copy the PayHere Refund Reference number and paste it below:</li>
                        </ol>
                      </div>
                      <label className="block font-semibold text-stone-700">
                        PayHere Refund Reference / Transaction ID <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={payHereRefundRefInput}
                        onChange={(e) => setPayHereRefundRefInput(e.target.value)}
                        placeholder="e.g. 320000849201 or PH-REF-..."
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-stone-900 bg-white focus:outline-none focus:border-stone-600 font-mono text-xs"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-semibold text-stone-700">
                          Refund Amount ($ USD)
                        </label>
                        <button
                          type="button"
                          onClick={() => setRefundAmountInput(refundModalOrder.totalAmount)}
                          className="text-[10px] text-emerald-800 font-bold hover:underline cursor-pointer"
                        >
                          Full (${refundModalOrder.totalAmount.toFixed(2)})
                        </button>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={refundModalOrder.totalAmount}
                          value={refundAmountInput}
                          onChange={(e) => setRefundAmountInput(e.target.value)}
                          className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:border-stone-600 font-medium"
                          placeholder={refundModalOrder.totalAmount.toFixed(2)}
                        />
                      </div>
                      <span className="text-[10px] text-stone-500 mt-1 block">
                        Original total: ${refundModalOrder.totalAmount.toFixed(2)} USD
                      </span>
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">
                        Refund Reason
                      </label>
                      <select
                        value={refundReasonInput}
                        onChange={(e) => setRefundReasonInput(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-stone-900 bg-white focus:outline-none focus:border-stone-600"
                      >
                        <option value="Customer requested return/refund">Customer requested return/refund</option>
                        <option value="Package delivery delayed / not received">Package delivery delayed / not received</option>
                        <option value="Item damaged or defective in transit">Item damaged or defective in transit</option>
                        <option value="Out of stock / unable to fulfill remedy">Out of stock / unable to fulfill remedy</option>
                        <option value="Buyer cancelled prior to dispatch">Buyer cancelled prior to dispatch</option>
                        <option value="Mutual agreement between seller & buyer">Mutual agreement between seller & buyer</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Internal Notes <span className="text-stone-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={sellerRefundNotesInput}
                      onChange={(e) => setSellerRefundNotesInput(e.target.value)}
                      placeholder="Optional internal note or customer service record..."
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 bg-white focus:outline-none focus:border-stone-600 text-xs resize-none"
                    />
                  </div>

                  {/* PayHere Guidelines Snippet */}
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-600 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-stone-800">
                      <Info className="w-3.5 h-3.5 text-stone-500" />
                      <span>PayHere Refund Guidelines</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-stone-600 pl-0.5 text-[10.5px]">
                      <li><strong className="text-stone-700">Payment Methods:</strong> Card payments (Visa, Mastercard, Amex, Discover, Diners Club) are supported. Non-card methods (Frimi, Genie, eZcash, mCash, Vishwa) must be refunded manually via bank transfer.</li>
                      <li><strong className="text-stone-700">Instant Refund:</strong> Reversals processed on the transaction date are refunded in real-time as a card void.</li>
                      <li><strong className="text-stone-700">Delayed Refund:</strong> Reversals initiated after payout (2+ days) reflect on customer card in 5&ndash;10 days following day-end fund recovery.</li>
                      <li><strong className="text-stone-700">Fees:</strong> Refund processing is completely free; PayHere refunds the full payment amount including processing fee back to the customer.</li>
                    </ul>
                  </div>
                </div>

                {refundError && (
                  <div className="p-3 bg-rose-100/80 border border-rose-300 text-rose-900 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                    <span>{refundError}</span>
                  </div>
                )}

                {/* Modal Actions */}
                <div className="flex justify-end gap-2.5 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setRefundModalOrder(null)}
                    disabled={isSubmittingRefund}
                    className="px-4 py-2 rounded-full border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenRefundConfirm}
                    disabled={isSubmittingRefund}
                    className="px-5 py-2 rounded-full bg-[#2E4D38] hover:bg-[#233c2c] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>Proceed to Refund Confirmation</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      </>
  );
}
