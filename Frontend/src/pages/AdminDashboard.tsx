import { useState, useEffect, useMemo, useContext } from 'react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import {
  Users,
  Package,
  ShoppingCart,
  FileText,
  Shield,
  Mail,
  TrendingUp,
  BarChart3,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Search,
  Sparkles,
  Store,
  DollarSign,
  Plus,
  X,
  Edit,
  Eye,
  Trash2,
  Check,
  Download,
  CheckCircle,
  Clock,
  LogOut,
  Star,
  Calendar,
  ClipboardList,
  Info,
  Truck,
  Link as LinkIcon,
  Send,
  Upload,
  Printer,
  Copy,
  Settings as SettingsIcon,
  Menu,
  Bell,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import RetailerManagement from './admin/RetailerManagement';
import AdminLogs from './admin/AdminLogs';
import BlogManagement from './admin/BlogManagement';
import TeamManagement from './admin/TeamManagement';
import EventManagement from './admin/EventManagement';
import ReportManagement from './admin/ReportManagement';
import PageContent from './admin/PageContent';
import StatsManagement from './admin/StatsManagement';
import ProductSelector from '../components/AdminDashboard/ProductSelector';
import CategoryInput from '../components/AdminDashboard/CategoryInput';
import WarrantyValidator from '../components/AdminDashboard/WarrantyValidator';
import ProductUnitManager from '../components/AdminDashboard/ProductUnitManager';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import ProductEditor from '../components/AdminDashboard/ProductEditor';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isApproved: boolean;
  createdAt: string;
}

interface Product {
  stock: number;
  _id: string;
  name: string;
  description: string;
  category: string;
  price?: number;
  normalPrice?: number;
  retailerPrice?: number;
  stockQuantity: number;
  imageUrl?: string;
  images?: string[];
  requiresQuote: boolean;
  isRecommended?: boolean;
  recommendedProductIds?: Array<string | { _id: string }>;
  warrantyPeriodMonths?: number;
  extendedWarrantyAvailable?: boolean;
  extendedWarrantyMonths?: number;
  extendedWarrantyPrice?: number;
}

interface ProductFormState {
  name: string;
  description: string;
  category: string;
  normalPrice: string;
  retailerPrice: string;
  quantity: number;
  warrantyPeriodMonths: number;
  extendedWarrantyAvailable: boolean;
  extendedWarrantyMonths: number;
  extendedWarrantyPrice: string;
  isRecommended: boolean;
  requiresQuote: boolean;
  manualImageUrl: string;
  images: string[];
  recommendedProductIds: string[];
}

const DEFAULT_WARRANTY_MONTHS = 12;

const getFreshProductFormState = (): ProductFormState => ({
  name: '',
  description: '',
  category: '',
  normalPrice: '',
  retailerPrice: '',
  quantity: 1,
  warrantyPeriodMonths: DEFAULT_WARRANTY_MONTHS,
  extendedWarrantyAvailable: true,
  extendedWarrantyMonths: 24,
  extendedWarrantyPrice: '',
  isRecommended: false,
  requiresQuote: false,
  manualImageUrl: '',
  images: [],
  recommendedProductIds: [],
});



interface Quote {
  _id: string;
  // backend may populate as `user` or older shape `userId`
  userId?: { _id: string; name: string; email: string };
  user?: { _id: string; name: string; email: string };
  // products may be under `productId` or `product` when populated
  products: Array<{
    productId?: { _id: string; name: string };
    product?: { _id: string; name: string };
    quantity: number;
  }>;
  message?: string;
  status?: string;
  // adminResponse can be a string (legacy) or an object with details
  adminResponse?: any;
  quotedPrice?: number;
  createdAt?: string;
  deliveryTrackingLink?: string;
  type?: 'standard' | 'bulk_order';
}

interface Order {
  _id: string;
  orderNumber?: string;
  userId?: { _id: string; name: string; email: string };
  user?: { _id: string; name: string; email: string };
  products: Array<{
    productId: { _id: string; name: string };
    product?: { _id: string; name: string; modelNumberPrefix?: string; price?: number };
    quantity: number;
    price: number;
    serialNumbers?: string[];
  }>;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  shippingAddress?: string;
  isDropship?: boolean;
  customerDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    role?: string;
  };
  customerInvoiceUrl?: string;
  invoiceUrl?: string;
  deliveryTrackingLink?: string;
  trackingId?: string;
}

interface DropshipOrder extends Order {
  isDropship: true;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
}

interface Warranty {
  _id: string;
  userId: { _id: string; name: string; email: string };
  productName: string;
  modelNumber: string;
  serialNumber: string;
  purchaseDate: string;
  purchaseType: string;
  invoiceUrl?: string;
  warrantyCertificateUrl?: string;
  status: string;
  createdAt: string;
}

interface InvestorDocument {
  _id: string;
  title: string;
  category: string;
  description?: string;
  documentUrl: string;
  fileSize?: string;
  fileType: string;
  publishDate: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

interface EmailLog {
  _id: string;
  recipient: string;
  subject: string;
  emailType: string;
  sentAt: string;
  status: string;
}

interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  createdAt: string;
}

interface Analytics {
  sales: {
    total: number;
    direct: number;
    quote: number;
    byUserType: {
      user: number;
      retailer: number;
    };
  };
  orders: {
    total: number;
    direct: number;
    quote: number;
    byUserType: {
      user: number;
      retailer: number;
    };
  };
  quotes: {
    total: number;
    pending: number;
    responded: number;
    accepted: number;
    rejected: number;
    conversionRate: string | number;
  };
  users: {
    total: number;
    retailers: number;
    pendingRetailers: number;
  };
  inventory: {
    total: number;
    online: number;
    offline: number;
  };
  warranties: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

const getDefaultAnalytics = (): Analytics => ({
  sales: {
    total: 0,
    direct: 0,
    quote: 0,
    byUserType: { user: 0, retailer: 0 },
  },
  orders: {
    total: 0,
    direct: 0,
    quote: 0,
    byUserType: { user: 0, retailer: 0 },
  },
  quotes: {
    total: 0,
    pending: 0,
    responded: 0,
    accepted: 0,
    rejected: 0,
    conversionRate: '0.00',
  },
  users: {
    total: 0,
    retailers: 0,
    pendingRetailers: 0,
  },
  inventory: {
    total: 0,
    online: 0,
    offline: 0,
  },
  warranties: {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  },
});

const AdminDashboard: React.FC = () => {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [contentSubPage, setContentSubPage] = useState<'blogs' | 'team' | 'events' | 'reports' | 'pages' | 'stats' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Constants
  const MAX_PRODUCT_IMAGES = 4;

  // State for different sections
  const [analytics, setAnalytics] = useState<Analytics>(getDefaultAnalytics());
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [investorDocuments, setInvestorDocuments] = useState<InvestorDocument[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productViewMode, setProductViewMode] = useState<'grid' | 'table'>('table');
  const [productFilterCategory, setProductFilterCategory] = useState<string>('all');
  const [productFilterStatus, setProductFilterStatus] = useState<string>('all');
  const [productSortBy, setProductSortBy] = useState<'recent' | 'name' | 'priceAsc' | 'priceDesc' | 'stock'>('recent');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // User management filters
  const [userSearch, setUserSearch] = useState('');
  const [userFilterRole, setUserFilterRole] = useState<string>('all');
  const [userFilterStatus, setUserFilterStatus] = useState<string>('all');

  // Quote management filters
  const [quoteSearch, setQuoteSearch] = useState('');
  const [quoteFilterStatus, setQuoteFilterStatus] = useState<string>('all');
  const [quoteStartDate, setQuoteStartDate] = useState('');
  const [quoteEndDate, setQuoteEndDate] = useState('');

  // Order management filters
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilterPayment, setOrderFilterPayment] = useState<string>('all');
  const [orderStartDate, setOrderStartDate] = useState('');
  const [orderEndDate, setOrderEndDate] = useState('');

  // Warranty management filters
  const [warrantySearch, setWarrantySearch] = useState('');
  const [warrantyFilterStatus, setWarrantyFilterStatus] = useState<string>('all');

  // Contact messages filters
  const [contactSearch, setContactSearch] = useState('');
  const [contactFilterStatus, setContactFilterStatus] = useState<string>('all');

  // Email logs filters
  const [emailSearch, setEmailSearch] = useState('');
  const [emailFilterStatus, setEmailFilterStatus] = useState<string>('all');
  const [emailFilterType, setEmailFilterType] = useState<string>('all');

  // Investor documents state
  const [investorDocSearch, setInvestorDocSearch] = useState('');
  const [investorDocFilterCategory, setInvestorDocFilterCategory] = useState<string>('all');
  const [showInvestorDocModal, setShowInvestorDocModal] = useState(false);
  const [editingInvestorDoc, setEditingInvestorDoc] = useState<InvestorDocument | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [investorDocForm, setInvestorDocForm] = useState({
    title: '',
    category: '',
    description: '',
    documentUrl: '',
    fileSize: '',
    fileType: 'PDF',
    publishDate: new Date().toISOString().split('T')[0],
    isActive: true,
    displayOrder: 0,
  });

  // Export filters
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  // Dropship Orders state
  const [dropshipOrders, setDropshipOrders] = useState<DropshipOrder[]>([]);
  const [dropshipSearch, setDropshipSearch] = useState('');
  const [showDropshipModal, setShowDropshipModal] = useState(false);
  const [selectedDropshipOrder, setSelectedDropshipOrder] = useState<DropshipOrder | null>(null);

  // User 360 View state
  const [showUser360Modal, setShowUser360Modal] = useState(false);
  const [selectedUser360, setSelectedUser360] = useState<User | null>(null);
  const [user360Data, setUser360Data] = useState<{
    orders: Order[];
    quotes: Quote[];
    warranties: any[];
    inventory: any[];
  }>({ orders: [], quotes: [], warranties: [], inventory: [] });

  // Order Details Modal state
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Tracking Link Modal states
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingLinkInput, setTrackingLinkInput] = useState('');
  const [trackingIdInput, setTrackingIdInput] = useState('');
  const [trackingType, setTrackingType] = useState<'order' | 'quote'>('order');
  const [selectedTrackingId, setSelectedTrackingId] = useState<string>('');
  const [trackingEmail, setTrackingEmail] = useState<string>('');

  // Form states
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>(() => getFreshProductFormState());
  const [productUnitsForm, setProductUnitsForm] = useState<
    Array<{ serialNumber: string; modelNumber: string; warrantyPeriod: number }>
  >([]);

  const availableRecommendationProducts = useMemo(
    () => products.filter(product => product && product._id && (!editingProduct || product._id !== editingProduct._id)),
    [products, editingProduct]
  );

  const uniqueCategories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [products]);

  // Product units modal state
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [selectedProductForUnits, setSelectedProductForUnits] = useState<Product | null>(null);

  const [quoteResponse, setQuoteResponse] = useState<{
    id: string;
    response: string;
    products: { [productId: string]: number | string };
  }>({ id: '', response: '', products: {} });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  useEffect(() => {
    if (authContext?.loading) {
      return; // Wait for auth to load
    }
    const user = authContext?.user;
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'admin') {
      navigate('/');
      return;
    }
    loadDashboardData();
  }, [authContext?.loading, authContext?.user, navigate]);

  useEffect(() => {
    setContentSubPage(null);
  }, [activeTab]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load all data without failing if individual endpoints fail
      await Promise.allSettled([
        loadAnalytics(),
        loadUsers(),
        loadProducts(),
        loadQuotes(),
        loadOrders(),
        loadWarranties(),
        loadInvestorDocuments(),
        loadEmailLogs(),
        loadContacts(),
        loadDropshipOrders(),
      ]);
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await api.get('/api/analytics/dashboard');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Keep existing data on error
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/api/auth/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
      // Keep existing data on error
    }
  };

  const loadProducts = async () => {
    try {
      // Admin gets all products including out of stock
      const response = await api.get('/api/products', { params: { includeOutOfStock: 'true' } });
      setProducts(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
      // Keep existing data on error
    }
  };

  const loadProductUnits = async (productId: string) => {
    try {
      const product = products.find(p => p._id === productId);
      if (product) {
        setSelectedProductForUnits(product);
      }
      setShowUnitsModal(true);
    } catch (error) {
      console.error('Error loading product units:', error);
    }
  };



  const loadQuotes = async () => {
    try {
      const params: any = {};
      if (quoteStartDate) params.startDate = quoteStartDate;
      if (quoteEndDate) params.endDate = quoteEndDate;
      const response = await api.get('/api/quotes', { params });
      setQuotes(response.data);
    } catch (error) {
      console.error('Error loading quotes:', error);
      // Keep existing data on error
    }
  };

  const loadOrders = async () => {
    try {
      const params: any = {};
      if (orderStartDate) params.startDate = orderStartDate;
      if (orderEndDate) params.endDate = orderEndDate;
      const response = await api.get('/api/orders', { params });
      setOrders(response.data);
    } catch (error) {
      console.error('Error loading orders:', error);
      // Keep existing data on error
    }
  };

  const loadDropshipOrders = async () => {
    try {
      const response = await api.get('/api/orders/dropship-shipments');
      setDropshipOrders(response.data);
    } catch (error) {
      console.error('Error loading dropship orders:', error);
    }
  };

  const loadWarranties = async () => {
    try {
      const response = await api.get('/api/warranties');
      setWarranties(response.data);
    } catch (error) {
      console.error('Error loading warranties:', error);
      // Keep existing data on error
    }
  };

  const loadInvestorDocuments = async () => {
    try {
      const response = await api.get('/api/investor-documents/admin');
      setInvestorDocuments(response.data);
    } catch (error) {
      console.error('Error loading investor documents:', error);
      // Keep existing data on error
    }
  };

  const loadEmailLogs = async () => {
    try {
      const response = await api.get('/api/email-logs');
      setEmailLogs(response.data);
    } catch (error) {
      console.error('Error loading email logs:', error);
      // Keep existing data on error
    }
  };

  const loadContacts = async () => {
    try {
      const response = await api.get('/api/contact');
      setContacts(response.data);
    } catch (error) {
      console.error('Error loading contacts:', error);
      // Keep existing data on error
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/api/auth/users/${userId}`);
      alert('User deleted successfully');
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleApproveRetailer = async (userId: string) => {
    if (!window.confirm('Are you sure you want to approve this retailer?')) return;
    try {
      await api.put(`/api/auth/users/${userId}/approve`);
      alert('Retailer approved successfully');
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to approve retailer');
    }
  };

  const handleViewUserWarranties = async (userId: string) => {
    try {
      const response = await api.get(`/api/warranties?userId=${userId}`);
      const warranties = response.data;

      if (!warranties || warranties.length === 0) {
        alert('No warranties found for this user');
        return;
      }

      // Filter warranties that have invoice PDFs
      const warrantyPDFs = warranties.filter((w: any) => w.invoice);

      if (warrantyPDFs.length === 0) {
        alert('No warranty PDFs found for this user');
        return;
      }

      // Open each PDF in a new tab
      warrantyPDFs.forEach((warranty: any, index: number) => {
        setTimeout(() => {
          window.open(warranty.invoice, '_blank');
        }, index * 500); // Stagger opens to avoid popup blockers
      });

      alert(`Opening ${warrantyPDFs.length} warranty PDF(s)`);
    } catch (error: any) {
      console.error('Error fetching warranties:', error);
      alert(error.response?.data?.message || 'Failed to fetch warranty PDFs');
    }
  };

  const handleViewUserInventory = async (userId: string) => {
    try {
      const response = await api.get(`/api/retailer-inventory?retailerId=${userId}`);
      const inventory = response.data;

      if (!inventory || inventory.length === 0) {
        alert('No inventory found for this retailer');
        return;
      }

      // Filter inventory that have customer invoice PDFs
      const inventoryPDFs = inventory.filter((inv: any) => inv.customerInvoice);

      if (inventoryPDFs.length === 0) {
        alert('No inventory PDFs found for this retailer');
        return;
      }

      // Open each PDF in a new tab
      inventoryPDFs.forEach((inv: any, index: number) => {
        setTimeout(() => {
          window.open(inv.customerInvoice, '_blank');
        }, index * 500); // Stagger opens to avoid popup blockers
      });

      alert(`Opening ${inventoryPDFs.length} inventory PDF(s)`);
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      alert(error.response?.data?.message || 'Failed to fetch inventory PDFs');
    }
  };

  const handleView360User = async (user: User) => {
    try {
      setSelectedUser360(user);
      setShowUser360Modal(true);

      // Fetch all user data in parallel
      const [ordersRes, quotesRes, warrantiesRes, inventoryRes] = await Promise.all([
        api.get(`/api/orders?userId=${user._id}`),
        api.get(`/api/quotes?userId=${user._id}`),
        api.get(`/api/warranties?userId=${user._id}`),
        user.role === 'retailer' ? api.get(`/api/retailer-inventory?retailerId=${user._id}`) : Promise.resolve({ data: [] })
      ]);

      setUser360Data({
        orders: ordersRes.data,
        quotes: quotesRes.data,
        warranties: warrantiesRes.data,
        inventory: inventoryRes.data
      });
    } catch (error: any) {
      console.error('Error fetching user 360 data:', error);
      alert(error.response?.data?.message || 'Failed to fetch user data');
    }
  };

  const handlePrintDeliveryLabel = (order: Order) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Please allow popups to print labels');
      return;
    }

    const user = order.user || order.userId;
    const orderNumber = order.orderNumber || order._id.slice(-8);
    const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString();

    const labelHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Delivery Label - ${orderNumber}</title>
        <style>
          @media print {
            @page {
              size: 4in 6in;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 4in;
            margin: 0 auto;
          }
          .label-container {
            border: 3px solid #000;
            padding: 15px;
            background: white;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .label-title {
            font-size: 18px;
            font-weight: bold;
            background: #000;
            color: #fff;
            padding: 5px;
            margin: 10px 0;
          }
          .section {
            margin: 15px 0;
            padding: 10px;
            border: 1px solid #ccc;
          }
          .section-title {
            font-size: 12px;
            font-weight: bold;
            color: #666;
            margin-bottom: 5px;
            text-transform: uppercase;
          }
          .section-content {
            font-size: 14px;
            line-height: 1.6;
          }
          .order-info {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-size: 12px;
          }
          .barcode {
            text-align: center;
            margin: 15px 0;
            font-family: 'Courier New', monospace;
            font-size: 24px;
            letter-spacing: 2px;
            font-weight: bold;
          }
          .products {
            margin: 10px 0;
          }
          .product-item {
            padding: 5px 0;
            border-bottom: 1px dashed #ccc;
            font-size: 12px;
          }
          .footer {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 2px solid #000;
            text-align: center;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="label-container">
          <div class="header">
            <div class="company-name">TELOGICA</div>
            <div>Telecom & IT Solutions</div>
          </div>

          <div class="label-title">DELIVERY LABEL</div>

          <div class="order-info">
            <div><strong>Order:</strong> #${orderNumber}</div>
            <div><strong>Date:</strong> ${orderDate}</div>
          </div>

          <div class="barcode">*${orderNumber}*</div>

          <div class="section">
            <div class="section-title">Ship To:</div>
            <div class="section-content">
              <strong>${order.isDropship ? (order.customerDetails?.name || 'Customer') : (user?.name || 'Customer')}</strong><br>
              ${order.isDropship ? (order.customerDetails?.address || 'Address not available') : (order.shippingAddress || 'Address not available')}<br>
              ${order.isDropship ? (order.customerDetails?.email || '') : (user?.email || '')}<br>
              ${order.isDropship ? (order.customerDetails?.phone || '') : ''}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Order Details:</div>
            <div class="products">
              ${order.products.map((p, idx) => {
      const product = p.productId || (p as any).product;
      return `
                  <div class="product-item">
                    <strong>${idx + 1}.</strong> ${product?.name || 'Product'} 
                    <strong>x${p.quantity}</strong>
                    ${p.serialNumbers && p.serialNumbers.length > 0 ? `<br>SN: ${p.serialNumbers.join(', ')}` : ''}
                  </div>
                `;
    }).join('')}
            </div>
            <div style="margin-top: 10px; font-weight: bold; font-size: 14px;">
              Total Amount: ₹${order.totalAmount.toLocaleString()}
            </div>
          </div>

          ${order.trackingId ? `
            <div class="section">
              <div class="section-title">Tracking ID:</div>
              <div class="section-content" style="font-weight: bold; font-size: 16px;">
                ${order.trackingId}
              </div>
            </div>
          ` : ''}

          <div class="footer">
            <div>Handle with care • Fragile items</div>
            <div>For queries: support@telogica.com</div>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(labelHTML);
    printWindow.document.close();
  };

  const handleExportUser360 = async (userId: string, userName: string) => {
    try {
      const response = await api.get(`/api/export/user-360/${userId}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `User_360_${userName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert('User 360 report exported successfully!');
    } catch (error: any) {
      console.error('Error exporting user 360:', error);
      alert(error.response?.data?.message || 'Failed to export user 360 report');
    }
  };

  // Product Management
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.images.length) {
      alert('Please add at least one product image before saving.');
      return;
    }

    if (productForm.images.length > MAX_PRODUCT_IMAGES) {
      alert(`Only up to ${MAX_PRODUCT_IMAGES} images are allowed.`);
      return;
    }

    // Validate all serial numbers and model numbers are filled
    const allFilled = productUnitsForm.every(
      (unit) => unit.serialNumber && unit.modelNumber
    );
    if (!allFilled) {
      alert('Please fill all serial numbers and model numbers');
      return;
    }

    try {
      // Step 1: Create the product
      const recommendations = Array.from(new Set(productForm.recommendedProductIds.filter(Boolean)));
      const productData = {
        name: productForm.name,
        description: productForm.description,
        category: productForm.category,
        price: productForm.normalPrice ? Number(productForm.normalPrice) : undefined,
        retailerPrice: productForm.retailerPrice ? Number(productForm.retailerPrice) : undefined,
        images: productForm.images,
        stock: 0, // Will be updated after adding units
        offlineStock: 0,
        requiresQuote: productForm.requiresQuote || !productForm.normalPrice,
        warrantyPeriodMonths: productForm.warrantyPeriodMonths || DEFAULT_WARRANTY_MONTHS,
        extendedWarrantyAvailable: productForm.extendedWarrantyAvailable,
        extendedWarrantyMonths: productForm.extendedWarrantyMonths || 24,
        extendedWarrantyPrice: productForm.extendedWarrantyPrice ? Number(productForm.extendedWarrantyPrice) : 0,
        isRecommended: productForm.isRecommended || false,
        recommendedProductIds: recommendations,
      };

      const productResponse = await api.post('/api/products', productData);
      const createdProduct = productResponse.data;

      // Step 2: Add product units (only if any are defined)
      if (productUnitsForm.length > 0) {
        await api.post('/api/product-units/add', {
          productId: createdProduct._id,
          units: productUnitsForm.map(unit => ({
            serialNumber: unit.serialNumber,
            modelNumber: unit.modelNumber,
            warrantyPeriodMonths: unit.warrantyPeriod || DEFAULT_WARRANTY_MONTHS,
            stockType: 'both'
          }))
        });
      }

      alert(productUnitsForm.length > 0
        ? 'Product created successfully with all units'
        : 'Product created successfully');
      setShowProductForm(false);
      setProductForm(getFreshProductFormState());
      setProductUnitsForm([]);
      loadProducts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create product');
    }
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await api.delete(`/api/products/${productToDelete._id}`);
      alert('Product deleted successfully');
      loadProducts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete product');
      throw error;
    }
  };

  const handleEditProduct = (product: Product) => {
    setProductToEdit(product);
  };

  const toggleProductSelected = (id: string) => {
    setSelectedProductIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const clearSelection = () => setSelectedProductIds([]);

  const handleBulkDelete = async () => {
    if (!selectedProductIds.length) return;
    setBulkDeleting(true);
    try {
      await Promise.all(selectedProductIds.map((id) => api.delete(`/api/products/${id}`)));
      alert(`Deleted ${selectedProductIds.length} product${selectedProductIds.length === 1 ? '' : 's'}.`);
      clearSelection();
      loadProducts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete some products');
      throw error;
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!productForm.images.length) {
      alert('Please add at least one product image before saving.');
      return;
    }

    if (productForm.images.length > MAX_PRODUCT_IMAGES) {
      alert(`Only up to ${MAX_PRODUCT_IMAGES} images are allowed.`);
      return;
    }

    try {
      const recommendations = Array.from(new Set(productForm.recommendedProductIds.filter(Boolean)));
      const productData = {
        name: productForm.name,
        description: productForm.description,
        category: productForm.category,
        price: productForm.normalPrice ? Number(productForm.normalPrice) : undefined,
        retailerPrice: productForm.retailerPrice ? Number(productForm.retailerPrice) : undefined,
        images: productForm.images,
        requiresQuote: productForm.requiresQuote || !productForm.normalPrice,
        warrantyPeriodMonths: productForm.warrantyPeriodMonths || DEFAULT_WARRANTY_MONTHS,
        extendedWarrantyAvailable: productForm.extendedWarrantyAvailable,
        extendedWarrantyMonths: productForm.extendedWarrantyMonths || 24,
        extendedWarrantyPrice: productForm.extendedWarrantyPrice ? Number(productForm.extendedWarrantyPrice) : 0,
        isRecommended: productForm.isRecommended,
        recommendedProductIds: recommendations,
      };

      await api.put(`/api/products/${editingProduct._id}`, productData);
      alert('Product updated successfully');
      setShowProductForm(false);
      setEditingProduct(null);
      setProductForm(getFreshProductFormState());
      loadProducts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update product');
    }
  };

  const handleToggleRecommended = async (productId: string, currentValue: boolean) => {
    try {
      await api.put(`/api/products/${productId}`, {
        isRecommended: !currentValue
      });
      loadProducts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update recommendation status');
    }
  };

  // Product Export Handlers
  const handleExportProducts = async (format: 'pdf' | 'csv' | 'excel') => {
    try {
      setLoading(true);
      const response = await api.get(`/api/export/products?format=${format}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const extension = format === 'excel' ? 'xlsx' : format;
      link.download = `Telogica-Products-${new Date().toISOString().split('T')[0]}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Export error:', error);
      alert(error.response?.data?.message || `Failed to export products as ${format.toUpperCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportProductUnits = async (format: 'pdf' | 'csv' | 'excel') => {
    try {
      setLoading(true);
      const response = await api.get(`/api/export/product-units?format=${format}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const extension = format === 'excel' ? 'xlsx' : format;
      link.download = `Telogica-Product-Units-${new Date().toISOString().split('T')[0]}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Export error:', error);
      alert(error.response?.data?.message || `Failed to export product units as ${format.toUpperCase()}`);
    } finally {
      setLoading(false);
    }
  };

  // Quote Management
  const handleRespondToQuote = async (quoteId: string) => {
    if (!quoteResponse.response) {
      alert('Please provide a response message');
      return;
    }

    // Prepare products array for backend
    const productsPayload = Object.entries(quoteResponse.products).map(([productId, price]) => ({
      product: productId,
      offeredPrice: price
    }));

    if (productsPayload.length === 0) {
      // If no products are set, maybe the user didn't interact with inputs.
      // We should probably validate that all products in the quote have a price set.
      // But for now, let's just check if payload is empty.
      // Actually, better to check if we have prices for the quote being responded to.
    }

    try {
      await api.put(`/api/quotes/${quoteId}/respond`, {
        products: productsPayload,
        message: quoteResponse.response,
      });
      alert('Quote response sent successfully');
      setQuoteResponse({ id: '', response: '', products: {} });
      loadQuotes();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to respond to quote');
    }
  };

  const handleRejectQuote = async (quoteId: string) => {
    const reason = window.prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      await api.put(`/api/quotes/${quoteId}/reject`, { reason });
      alert('Quote rejected successfully');
      loadQuotes();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to reject quote');
    }
  };

  // Order Management

  // Order Creation (address validation) - Kept for future extension if Admin order creation is added
  // const handleCreateOrder = async (orderData: any) => {
  //   // Validate delivery address
  //   if (!orderData.customerDetails || !orderData.customerDetails.address || !orderData.customerDetails.address.trim()) {
  //     alert('Please provide a valid delivery address before proceeding with the order.');
  //     return;
  //   }
  //   // ...existing order creation logic...
  //   try {
  //     await api.post('/api/orders', orderData);
  //     alert('Order created successfully');
  //     loadOrders();
  //   } catch (error: any) {
  //     alert(error.response?.data?.message || 'Failed to create order');
  //   }
  // };

  // Tracking Link Management
  const handleOpenTrackingModal = (id: string, type: 'order' | 'quote', currentLink?: string, email?: string, currentTrackingId?: string) => {
    setSelectedTrackingId(id);
    setTrackingType(type);
    setTrackingLinkInput(currentLink || '');
    setTrackingIdInput(currentTrackingId || '');
    setTrackingEmail(email || '');
    setShowTrackingModal(true);
  };

  const handleUpdateTrackingLink = async () => {
    if (!trackingLinkInput.trim()) {
      alert('Please enter a tracking link');
      return;
    }

    try {
      const endpoint = trackingType === 'order'
        ? `/api/orders/${selectedTrackingId}/tracking`
        : `/api/quotes/${selectedTrackingId}/tracking`;

      await api.put(endpoint, {
        deliveryTrackingLink: trackingLinkInput,
        trackingId: trackingIdInput.trim() || undefined
      });
      alert(`Tracking link updated successfully and email sent to ${trackingEmail || 'customer'}`);

      setShowTrackingModal(false);
      setTrackingLinkInput('');
      setTrackingIdInput('');
      setTrackingEmail('');

      if (trackingType === 'order') {
        loadOrders();
        loadDropshipOrders();
      } else {
        loadQuotes();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update tracking link');
    }
  };

  // Warranty Management
  const handleWarrantyAction = async (warrantyId: string, action: string) => {
    try {
      await api.put(`/api/warranties/${warrantyId}`, { status: action });
      alert(`Warranty ${action} successfully`);
      loadWarranties();
    } catch (error: any) {
      alert(error.response?.data?.message || `Failed to ${action} warranty`);
    }
  };

  // Email Logs
  const handleResendEmail = async (logId: string) => {
    try {
      await api.post(`/api/email-logs/${logId}/resend`);
      alert('Email resent successfully');
      loadEmailLogs();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to resend email');
    }
  };

  // Contact Management
  const handleUpdateContactStatus = async (id: string, status: string) => {
    try {
      await api.put(`/api/contact/${id}`, { status });
      loadContacts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await api.delete(`/api/contact/${id}`);
      alert('Message deleted successfully');
      loadContacts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete message');
    }
  };



  const handleServerExport = async (entity: string, format: 'pdf' | 'csv' | 'excel') => {
    try {
      let url = `/api/export/${entity}?format=${format}`;
      if (exportStartDate) url += `&startDate=${exportStartDate}`;
      if (exportEndDate) url += `&endDate=${exportEndDate}`;

      const response = await api.get(url, {
        responseType: 'blob'
      });

      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${entity}_export_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      console.error('Export failed:', error);
      alert('Failed to export data: ' + (error.response?.data?.message || error.message));
    }
  };  // Render Dashboard/Analytics Tab
  const renderDashboard = () => {
    const conversionRate =
      typeof analytics.quotes.conversionRate === 'number'
        ? analytics.quotes.conversionRate.toFixed(2)
        : analytics.quotes.conversionRate;

    // Prepare Chart Data
    const userSalesData = [
      { name: 'Direct Orders', value: analytics.sales.direct || 0 },
      { name: 'Quote Sales', value: analytics.sales.quote || 0 },
    ];

    const retailerSalesData = [
      { name: 'Quote Sales', value: analytics.sales.byUserType.retailer || 0 },
    ];

    const USER_COLORS = ['#3B82F6', '#10B981']; // Blue for Direct, Green for Quote
    const RETAILER_COLORS = ['#10B981']; // Green for Quote only

    const recentOrders = orders.slice(0, 5);
    const recentQuotes = quotes.slice(0, 5);

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-200 pb-4">
          <div>
            <p className="text-xs text-gray-500 mt-0.5">Real-time business performance and analytics</p>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2.5 py-1 border border-gray-200">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Sales */}
          <div className="bg-white p-6 border-t-4 border-t-blue-600 border-x border-b border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.14),0_14px_32px_rgba(0,0,0,0.08)] transition-all duration-300 rounded-none flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Total Sales</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{formatCurrency(analytics.sales.total)}</p>
              </div>
              <div className="p-2.5 bg-gray-50 border border-gray-100 text-gray-700 rounded-none">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-none">
                <TrendingUp className="w-3 h-3" /> +12%
              </span>
              <span className="text-[11px] text-gray-400 ml-2 font-medium">from last month</span>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white p-6 border-t-4 border-t-emerald-600 border-x border-b border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.14),0_14px_32px_rgba(0,0,0,0.08)] transition-all duration-300 rounded-none flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Total Orders</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{formatNumber(analytics.orders.total)}</p>
              </div>
              <div className="p-2.5 bg-gray-50 border border-gray-100 text-gray-700 rounded-none">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-none">
                <TrendingUp className="w-3 h-3" /> +5%
              </span>
              <span className="text-[11px] text-gray-400 ml-2 font-medium">new orders today</span>
            </div>
          </div>

          {/* Pending Quotes */}
          <div className="bg-white p-6 border-t-4 border-t-amber-500 border-x border-b border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.14),0_14px_32px_rgba(0,0,0,0.08)] transition-all duration-300 rounded-none flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Pending Quotes</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{formatNumber(analytics.quotes.pending)}</p>
              </div>
              <div className="p-2.5 bg-gray-50 border border-gray-100 text-gray-700 rounded-none">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100 rounded-none">
                {conversionRate}%
              </span>
              <span className="text-[11px] text-gray-400 ml-2 font-medium">conversion rate</span>
            </div>
          </div>

          {/* Total Users */}
          <div className="bg-white p-6 border-t-4 border-t-purple-600 border-x border-b border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.14),0_14px_32px_rgba(0,0,0,0.08)] transition-all duration-300 rounded-none flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Total Users</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{formatNumber(analytics.users.total)}</p>
              </div>
              <div className="p-2.5 bg-gray-50 border border-gray-100 text-gray-700 rounded-none">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100 rounded-none">
                {analytics.users.pendingRetailers}
              </span>
              <span className="text-[11px] text-gray-400 ml-2 font-medium">pending retailers</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Sales Distribution */}
          <div className="bg-white border border-gray-200 rounded-none shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] p-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                  User Sales Distribution
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Regular Customers Analytics</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100/30 rounded-none">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                LIVE
              </span>
            </div>

            {/* Sales Type Breakdown */}
            <div className="space-y-4 mb-6">
              {/* Direct Orders Panel */}
              <div className="bg-gray-50/50 border border-gray-200 rounded-none p-5 shadow-sm hover:shadow-md transition-all duration-300 border-t-2 border-t-blue-500">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 text-white rounded-none">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Direct Orders</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Instant purchase transactions</p>
                    </div>
                  </div>
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-black text-gray-900">{formatCurrency(analytics.sales.direct)}</p>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-200/50">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 text-[10px]">
                        {analytics.orders.direct}
                      </span>
                      <span className="text-gray-500 font-medium">{analytics.orders.direct === 1 ? 'order' : 'orders'}</span>
                    </div>
                    <span className="text-gray-500">Avg: <strong className="text-gray-900">{analytics.orders.direct > 0 ? formatCurrency(analytics.sales.direct / analytics.orders.direct) : '₹0'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Quote Sales Panel */}
              <div className="bg-gray-50/50 border border-gray-200 rounded-none p-5 shadow-sm hover:shadow-md transition-all duration-300 border-t-2 border-t-emerald-500">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-600 text-white rounded-none">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Quote Sales</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Approved quotation orders</p>
                    </div>
                  </div>
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-black text-gray-900">{formatCurrency(analytics.sales.quote)}</p>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-200/50">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 text-[10px]">
                        {analytics.orders.quote}
                      </span>
                      <span className="text-gray-500 font-medium">{analytics.orders.quote === 1 ? 'order' : 'orders'}</span>
                    </div>
                    <span className="text-gray-500">Avg: <strong className="text-gray-900">{analytics.orders.quote > 0 ? formatCurrency(analytics.sales.quote / analytics.orders.quote) : '₹0'}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-gray-50/40 rounded-none p-4 border border-gray-200 mb-6">
              {userSalesData[0].value > 0 || userSalesData[1].value > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={userSalesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      fill="#8884d8"
                      paddingAngle={6}
                      dataKey="value"
                      label={(entry) => {
                        const total = analytics.sales.direct + analytics.sales.quote;
                        const percent = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0.0';
                        return `${percent}%`;
                      }}
                      labelLine={{ stroke: '#64748b', strokeWidth: 1.5 }}
                    >
                      {userSalesData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={USER_COLORS[index]} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        borderRadius: '0px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        padding: '8px 12px'
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="rect"
                      wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ShoppingCart className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-xs text-gray-500 font-medium">No sales data available yet</p>
                </div>
              )}
            </div>

            {/* Summary Footer */}
            <div className="border-t border-gray-100 pt-6 mt-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-none p-4 shadow-sm border border-gray-200 border-l-4 border-l-blue-500 hover:scale-[1.01] transition-transform">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total Sales</p>
                  <p className="text-lg font-black text-gray-900">{formatCurrency(analytics.sales.byUserType.user)}</p>
                  <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">User Segment</p>
                </div>
                <div className="bg-white rounded-none p-4 shadow-sm border border-gray-200 border-l-4 border-l-indigo-500 hover:scale-[1.01] transition-transform">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total Orders</p>
                  <p className="text-lg font-black text-gray-900">{formatNumber(analytics.orders.byUserType.user)}</p>
                  <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">B2C Grid</p>
                </div>
              </div>
              <div className="bg-gray-50/70 border border-gray-200 rounded-none p-3.5 flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-700">Average Order Value:</span>
                <span className="font-bold text-gray-900">
                  {analytics.orders.byUserType.user > 0
                    ? formatCurrency(analytics.sales.byUserType.user / analytics.orders.byUserType.user)
                    : formatCurrency(0)
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Retailer Sales Distribution */}
          <div className="bg-white border border-gray-200 rounded-none shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] p-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Store className="w-4 h-4 text-emerald-600" />
                  Retailer Sales Distribution
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">B2B Channel Partners Analytics</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100/30 rounded-none">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                LIVE
              </span>
            </div>

            {/* Sales Type Breakdown */}
            <div className="space-y-4 mb-6">
              {/* Quote Sales Only Panel */}
              <div className="bg-gray-50/50 border border-gray-200 rounded-none p-5 shadow-sm hover:shadow-md transition-all duration-300 border-t-2 border-t-emerald-500">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-600 text-white rounded-none">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Quote Sales Only</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Exclusive quotation-based purchasing</p>
                    </div>
                  </div>
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-black text-gray-900">{formatCurrency(analytics.sales.byUserType.retailer)}</p>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-200/50">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 text-[10px]">
                        {analytics.orders.byUserType.retailer}
                      </span>
                      <span className="text-gray-500 font-medium">{analytics.orders.byUserType.retailer === 1 ? 'quote order' : 'quote orders'}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 border border-emerald-100">B2B Core Model</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-gray-50/40 rounded-none p-4 border border-gray-200 mb-6">
              {retailerSalesData[0].value > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={retailerSalesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      fill="#10B981"
                      paddingAngle={0}
                      dataKey="value"
                      label={() => '100%'}
                      labelLine={{ stroke: '#10b981', strokeWidth: 1.5 }}
                    >
                      {retailerSalesData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={RETAILER_COLORS[index]} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        borderRadius: '0px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        padding: '8px 12px'
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="rect"
                      wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Store className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-xs text-gray-500 font-medium">No B2B sales data available yet</p>
                </div>
              )}
            </div>

            {/* Summary Footer */}
            <div className="border-t border-gray-100 pt-6 mt-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-none p-4 shadow-sm border border-gray-200 border-l-4 border-l-emerald-500 hover:scale-[1.01] transition-transform">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total Sales</p>
                  <p className="text-lg font-black text-gray-900">{formatCurrency(analytics.sales.byUserType.retailer)}</p>
                  <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">Retailer Segment</p>
                </div>
                <div className="bg-white rounded-none p-4 shadow-sm border border-gray-200 border-l-4 border-l-teal-500 hover:scale-[1.01] transition-transform">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total Orders</p>
                  <p className="text-lg font-black text-gray-900">{formatNumber(analytics.orders.byUserType.retailer)}</p>
                  <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">B2B Grid</p>
                </div>
              </div>
              <div className="bg-gray-50/70 border border-gray-200 rounded-none p-3.5 flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-700">Average Quote Value:</span>
                <span className="font-bold text-gray-900">
                  {analytics.orders.byUserType.retailer > 0
                    ? formatCurrency(analytics.sales.byUserType.retailer / analytics.orders.byUserType.retailer)
                    : formatCurrency(0)
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-none border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Recent Orders</h3>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs font-bold text-gray-900 hover:text-indigo-600 transition-colors uppercase tracking-wider flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px] border-b border-slate-950">
                  <tr>
                    <th className="px-6 py-3.5 font-bold tracking-wider">Order ID</th>
                    <th className="px-6 py-3.5 font-bold tracking-wider">Customer</th>
                    <th className="px-6 py-3.5 font-bold tracking-wider text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-600">
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-gray-900">#{order._id.slice(-6).toUpperCase()}</td>
                      <td className="px-6 py-4">{order.user?.name || order.userId?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(order.totalAmount)}</td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-500 font-medium">No recent orders found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Quotes */}
          <div className="bg-white rounded-none border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Recent Quotes</h3>
              <button
                onClick={() => setActiveTab('quotes')}
                className="text-xs font-bold text-gray-900 hover:text-indigo-600 transition-colors uppercase tracking-wider flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px] border-b border-slate-950">
                  <tr>
                    <th className="px-6 py-3.5 font-bold tracking-wider">Customer</th>
                    <th className="px-6 py-3.5 font-bold tracking-wider">Items</th>
                    <th className="px-6 py-3.5 font-bold tracking-wider">Status</th>
                    <th className="px-6 py-3.5 font-bold tracking-wider text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-600">
                  {recentQuotes.map((quote) => (
                    <tr key={quote._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{quote.user?.name || 'Unknown'}</td>
                      <td className="px-6 py-4">{quote.products?.length || 0} items</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border rounded-none ${
                          quote.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          quote.status === 'responded' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          quote.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {quote.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500">
                        {new Date(quote.createdAt || '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                    </tr>
                  ))}
                  {recentQuotes.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500 font-medium">No recent quotes found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* System Data Export Section */}
        <div className="bg-white p-6 border border-gray-200 rounded-none shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
            <div className="p-2.5 bg-gray-50 border border-gray-100 text-gray-700 rounded-none">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">System Data Export</h3>
              <p className="text-xs text-gray-400 mt-0.5">Generate and download comprehensive analytical reports</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 border border-gray-200 rounded-none items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Filter by Date Range:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
                className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
              <span className="text-gray-400 font-semibold">-</span>
              <input
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
                className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
            {(exportStartDate || exportEndDate) && (
              <button
                onClick={() => { setExportStartDate(''); setExportEndDate(''); }}
                className="text-xs font-bold text-red-600 hover:text-red-800 uppercase tracking-wider hover:underline"
              >
                Clear Range
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[
              { label: 'Orders Report', entity: 'orders', icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Quotes Report', entity: 'quotes', icon: FileText, color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: 'Products Catalog', entity: 'products', icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Users List', entity: 'users', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Warranties', entity: 'warranties', icon: Shield, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Invoices', entity: 'invoices', icon: DollarSign, color: 'text-gray-600', bg: 'bg-gray-50' },
              { label: 'Sales Report', entity: 'sales-report', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Product Units', entity: 'product-units', icon: CheckCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
            ].map((item) => (
              <div key={item.entity} className="border border-gray-200 rounded-none p-4 hover:bg-gray-50 transition-colors group flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-none border border-gray-100 ${item.bg}`}>
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">{item.label}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleServerExport(item.entity, 'pdf')}
                    className="flex-1 py-1.5 text-[10px] font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-none border border-red-200 transition-colors uppercase tracking-wider"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => handleServerExport(item.entity, 'csv')}
                    className="flex-1 py-1.5 text-[10px] font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-none border border-green-200 transition-colors uppercase tracking-wider"
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => handleServerExport(item.entity, 'excel')}
                    className="flex-1 py-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-none border border-blue-200 transition-colors uppercase tracking-wider"
                  >
                    Excel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render Products Tab
  const renderProducts = () => {
    const searchTerm = productSearch.trim().toLowerCase();
    const validProducts = products.filter(product => product && product.name);
    const filteredProductsUnsorted = validProducts.filter((product) => {
      // Search filter
      if (searchTerm) {
        const combined = `${product.name} ${product.category || ''}`.toLowerCase();
        if (!combined.includes(searchTerm)) return false;
      }

      // Category filter
      if (productFilterCategory !== 'all' && product.category !== productFilterCategory) {
        return false;
      }

      // Status filter
      const stock = product.stockQuantity ?? product.stock ?? 0;
      if (productFilterStatus !== 'all') {
        switch (productFilterStatus) {
          case 'in_stock':
            if (stock <= 5) return false;
            break;
          case 'low_stock':
            if (stock === 0 || stock > 5) return false;
            break;
          case 'out_of_stock':
            if (stock > 0) return false;
            break;
          case 'quote_only':
            if (!product.requiresQuote) return false;
            break;
          case 'recommended':
            if (!product.isRecommended) return false;
            break;
        }
      }

      return true;
    });

    const filteredProducts = [...filteredProductsUnsorted].sort((a, b) => {
      const aPrice = (a.normalPrice ?? a.price ?? 0) as number;
      const bPrice = (b.normalPrice ?? b.price ?? 0) as number;
      const aStock = (a.stockQuantity ?? a.stock ?? 0) as number;
      const bStock = (b.stockQuantity ?? b.stock ?? 0) as number;
      switch (productSortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'priceAsc':
          return aPrice - bPrice;
        case 'priceDesc':
          return bPrice - aPrice;
        case 'stock':
          return bStock - aStock;
        case 'recent':
        default: {
          const aT = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
          const bT = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
          return bT - aT;
        }
      }
    });

    const visibleSelectedCount = filteredProducts.reduce(
      (n, p) => (selectedProductIds.includes(p._id) ? n + 1 : n),
      0
    );
    const allFilteredSelected =
      filteredProducts.length > 0 && visibleSelectedCount === filteredProducts.length;
    const toggleSelectAllFiltered = () => {
      if (allFilteredSelected) {
        setSelectedProductIds((prev) => prev.filter((id) => !filteredProducts.some((p) => p._id === id)));
      } else {
        const ids = new Set(selectedProductIds);
        filteredProducts.forEach((p) => ids.add(p._id));
        setSelectedProductIds(Array.from(ids));
      }
    };

    const totalStock = validProducts.reduce(
      (acc, product) => acc + (product.stockQuantity ?? 0) + (product.stock ?? 0),
      0
    );
    const lowStockCount = validProducts.filter((product) => {
      const stock = product.stockQuantity ?? product.stock ?? 0;
      return stock > 0 && stock <= 5;
    }).length;
    const outOfStockCount = validProducts.filter((product) => {
      const stock = product.stockQuantity ?? product.stock ?? 0;
      return stock === 0;
    }).length;
    const quoteOnlyCount = validProducts.filter((product) => product.requiresQuote).length;


    return (
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-850 p-6 text-white rounded-none flex flex-col md:flex-row gap-4 md:items-center md:justify-between shadow-md">
          <div>
            <p className="text-gray-400 text-xs">
              Add new products, update inventory stock, set price levels, and configure warranty options.
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/add-product')}
            className="bg-white text-gray-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors flex items-center gap-2 rounded-none border border-white"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 border-t-2 border-t-indigo-600 border-x border-b border-gray-200 shadow-sm rounded-none hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Products</p>
              <Package className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-black text-gray-900">{products.length}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-1">Active items</p>
          </div>
          <div className="bg-white p-5 border-t-2 border-t-emerald-600 border-x border-b border-gray-200 shadow-sm rounded-none hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Stock</p>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-black text-gray-900">{totalStock.toLocaleString()}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-1">Units available</p>
          </div>
          <div className="bg-white p-5 border-t-2 border-t-orange-500 border-x border-b border-gray-200 shadow-sm rounded-none hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Low Stock</p>
              <AlertCircle className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-2xl font-black text-orange-600">{lowStockCount}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-1">Needs Restock</p>
          </div>
          <div className="bg-white p-5 border-t-2 border-t-red-600 border-x border-b border-gray-200 shadow-sm rounded-none hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Out of Stock</p>
              <Package className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-2xl font-black text-red-600">{outOfStockCount}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-1">Unavailable</p>
          </div>
          <div className="bg-white p-5 border-t-2 border-t-blue-500 border-x border-b border-gray-200 shadow-sm rounded-none hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quote Required</p>
              <FileText className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-black text-blue-600">{quoteOnlyCount}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-1">Custom pricing</p>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white p-5 border border-gray-200 rounded-none shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products..."
                  className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:bg-white transition-all w-64"
                />
              </div>

              <select
                value={productSortBy}
                onChange={(e) => setProductSortBy(e.target.value as any)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:bg-white transition-all"
                title="Sort by"
              >
                <option value="recent">Sort by: Recent</option>
                <option value="name">Sort by: Name</option>
                <option value="priceAsc">Sort by: Price Asc</option>
                <option value="priceDesc">Sort by: Price Desc</option>
                <option value="stock">Sort by: Stock</option>
              </select>

              {(productSearch || productFilterCategory !== 'all' || productFilterStatus !== 'all') && (
                <button
                  onClick={() => {
                    setProductSearch('');
                    setProductFilterCategory('all');
                    setProductFilterStatus('all');
                  }}
                  className="text-xs font-bold text-red-600 hover:text-red-800 uppercase tracking-wider hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 rounded-none p-0.5">
                <button
                  onClick={() => setProductViewMode('table')}
                  className={`px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors rounded-none ${productViewMode === 'table'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  Table
                </button>
                <button
                  onClick={() => setProductViewMode('grid')}
                  className={`px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors rounded-none ${productViewMode === 'grid'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  Grid
                </button>
              </div>

              <button
                onClick={() => navigate('/admin/home-page-products')}
                className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-none hover:bg-amber-100 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
              >
                <Star className="w-3.5 h-3.5" />
                Featured
              </button>
            </div>
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-2">Category:</span>
            {['all', ...uniqueCategories].map((cat) => {
              const active = productFilterCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setProductFilterCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border rounded-none transition-colors ${
                    active
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              );
            })}
          </div>

          {/* Status chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-2">Status:</span>
            {[
              { v: 'all', label: 'All' },
              { v: 'in_stock', label: 'In stock' },
              { v: 'low_stock', label: 'Low stock' },
              { v: 'out_of_stock', label: 'Out of stock' },
              { v: 'quote_only', label: 'Quote only' },
              { v: 'recommended', label: 'Recommended' },
            ].map(({ v, label }) => {
              const active = productFilterStatus === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setProductFilterStatus(v)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border rounded-none transition-colors ${
                    active
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bulk action bar */}
        {selectedProductIds.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-none px-4 py-3 flex items-center justify-between">
            <div className="text-xs font-bold text-red-900 uppercase tracking-wider">
              {selectedProductIds.length} product{selectedProductIds.length === 1 ? '' : 's'} selected
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearSelection}
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-700 hover:bg-red-100 rounded-none"
              >
                Clear Selection
              </button>
              <button
                type="button"
                onClick={() => setBulkDeleteOpen(true)}
                disabled={bulkDeleting}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 rounded-none flex items-center gap-1.5 disabled:opacity-60"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* Export Section */}
        <div className="bg-white p-5 rounded-none border border-gray-200 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Export Filters:</span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
                <span className="text-gray-400 font-semibold">-</span>
                <input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>
              {(exportStartDate || exportEndDate) && (
                <button
                  onClick={() => { setExportStartDate(''); setExportEndDate(''); }}
                  className="text-xs font-bold text-red-600 hover:text-red-800 uppercase tracking-wider hover:underline"
                >
                  Clear Range
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleServerExport('products', 'pdf')}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-none border border-red-200 uppercase tracking-wider"
              >
                <Download size={13} /> PDF
              </button>
              <button
                onClick={() => handleServerExport('products', 'csv')}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-none border border-green-200 uppercase tracking-wider"
              >
                <Download size={13} /> CSV
              </button>
              <button
                onClick={() => handleServerExport('products', 'excel')}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-none border border-blue-200 uppercase tracking-wider"
              >
                <Download size={13} /> Excel
              </button>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="bg-gray-50 border border-gray-200 p-5 rounded-none flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 text-white p-2.5 rounded-none">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Export Product Catalog</h3>
              <p className="text-xs text-gray-500 mt-0.5">Download the complete product list with pricing and stock details</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleExportProducts('pdf')}
              disabled={loading || products.length === 0}
              className="bg-white text-blue-700 px-4 py-2 text-xs font-bold uppercase tracking-wider border border-blue-200 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-none flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
            <button
              onClick={() => handleExportProducts('excel')}
              disabled={loading || products.length === 0}
              className="bg-white text-green-700 px-4 py-2 text-xs font-bold uppercase tracking-wider border border-green-200 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-none flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Excel
            </button>
            <button
              onClick={() => handleExportProducts('csv')}
              disabled={loading || products.length === 0}
              className="bg-white text-purple-700 px-4 py-2 text-xs font-bold uppercase tracking-wider border border-purple-200 hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-none flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
          </div>
        </div>

        {/* Product Units Export */}
        <div className="bg-gray-50 border border-gray-200 p-5 rounded-none flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 text-white p-2.5 rounded-none">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Export Product Units & Serial Numbers</h3>
              <p className="text-xs text-gray-500 mt-0.5">Download detailed inventory lists with matching serial numbers and models</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleExportProductUnits('pdf')}
              disabled={loading}
              className="bg-white text-blue-700 px-4 py-2 text-xs font-bold uppercase tracking-wider border border-blue-200 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-none flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
            <button
              onClick={() => handleExportProductUnits('excel')}
              disabled={loading}
              className="bg-white text-green-700 px-4 py-2 text-xs font-bold uppercase tracking-wider border border-green-200 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-none flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Excel
            </button>
            <button
              onClick={() => handleExportProductUnits('csv')}
              disabled={loading}
              className="bg-white text-purple-700 px-4 py-2 text-xs font-bold uppercase tracking-wider border border-purple-200 hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-none flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
          </div>
        </div>

        {showProductForm && (
          <div className="bg-white p-6 border border-gray-200 rounded-none shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider">
                  {editingProduct ? 'Edit Product' : 'Create New Product'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {editingProduct
                    ? 'Update product details and pricing tiers.'
                    : `Add up to ${MAX_PRODUCT_IMAGES} images, serial numbers, and B2C/B2B pricing.`}
                </p>
              </div>
              <Sparkles className="text-indigo-600 w-5 h-5" />
            </div>
            <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Product Name *</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-none text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:bg-white transition-all"
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Category *</label>
                  <CategoryInput
                    value={productForm.category}
                    onChange={(value) => setProductForm({ ...productForm, category: value })}
                    categories={uniqueCategories}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Normal Price (₹)</label>
                  <input
                    type="number"
                    value={productForm.normalPrice}
                    onChange={(e) => setProductForm({ ...productForm, normalPrice: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-none text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:bg-white transition-all"
                    placeholder="Enter price"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Retailer Price (₹)</label>
                  <input
                    type="number"
                    value={productForm.retailerPrice}
                    onChange={(e) => setProductForm({ ...productForm, retailerPrice: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-none text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:bg-white transition-all"
                    placeholder="Enter price"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-none text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:bg-white transition-all resize-none"
                  placeholder="Enter product description"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Product Images *</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (!files?.length) return;
                    const remainingSlots = MAX_PRODUCT_IMAGES - productForm.images.length;
                    const filesToUpload = Array.from(files).slice(0, remainingSlots);
                    filesToUpload.forEach((file) => {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setProductForm((prev) => ({
                          ...prev,
                          images: [...prev.images, reader.result as string]
                        }));
                      };
                      reader.readAsDataURL(file);
                    });
                    e.target.value = '';
                  }}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-none text-xs focus:outline-none"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {productForm.images.map((img, idx) => (
                    <div key={idx} className="relative border border-gray-200 p-1">
                      <img src={img} alt={`preview-${idx}`} className="w-16 h-16 object-cover rounded-none" />
                      <button
                        type="button"
                        onClick={() => {
                          setProductForm((prev) => ({
                            ...prev,
                            images: prev.images.filter((_, i) => i !== idx)
                          }));
                        }}
                        className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700 transition-colors shadow"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Recommended Products
                </label>
                <ProductSelector
                  products={availableRecommendationProducts}
                  selectedIds={productForm.recommendedProductIds}
                  onChange={(ids) => setProductForm({ ...productForm, recommendedProductIds: ids })}
                />
              </div>

              {/* Warranty Configuration */}
              <div className="border-t border-gray-150 pt-4">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Warranty Options</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Standard Warranty (months) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.warrantyPeriodMonths}
                      onChange={(e) => setProductForm({ ...productForm, warrantyPeriodMonths: parseInt(e.target.value) || 12 })}
                      className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
                      placeholder="12"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Free warranty period (default: 12 months)</p>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer mt-4">
                      <input
                        type="checkbox"
                        checked={productForm.extendedWarrantyAvailable}
                        onChange={(e) => setProductForm({ ...productForm, extendedWarrantyAvailable: e.target.checked })}
                        className="w-4 h-4 text-gray-900 border-gray-300 rounded-none focus:ring-0"
                      />
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Offer Extended Warranty</span>
                    </label>
                  </div>
                </div>

                {productForm.extendedWarrantyAvailable && (
                  <div className="grid md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-100">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Extended Warranty (months) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={productForm.extendedWarrantyMonths}
                        onChange={(e) => setProductForm({ ...productForm, extendedWarrantyMonths: parseInt(e.target.value) || 24 })}
                        className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-none text-xs focus:outline-none"
                        placeholder="24"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">Extended warranty period (default: 24 months)</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Extended Warranty Price (₹) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={productForm.extendedWarrantyPrice}
                        onChange={(e) => setProductForm({ ...productForm, extendedWarrantyPrice: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-none text-xs focus:outline-none"
                        placeholder="Enter price"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">Additional cost for extended warranty</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isRecommended"
                  checked={productForm.isRecommended}
                  onChange={(e) => setProductForm({ ...productForm, isRecommended: e.target.checked })}
                  className="w-4 h-4 text-gray-900 border-gray-300 rounded-none focus:ring-0"
                />
                <label htmlFor="isRecommended" className="text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer">
                  Mark as Recommended Product
                </label>
              </div>
              <div className="flex gap-3 pt-3 border-t border-gray-100">
                <button
                  type="submit"
                  className="flex-1 bg-gray-900 text-white py-3 text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors rounded-none"
                >
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProductForm(false);
                    setEditingProduct(null);
                    setProductForm(getFreshProductFormState());
                    setProductUnitsForm([]);
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors rounded-none"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products List */}
        <div className="bg-white rounded-none border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px] border-b border-slate-950">
                <tr>
                  <th className="px-4 py-3.5 text-left">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAllFiltered}
                      className="w-4 h-4 text-gray-900 border-gray-300 rounded-none focus:ring-0"
                      title="Select all on this view"
                    />
                  </th>
                  <th className="px-6 py-3.5 text-left font-bold tracking-wider">Product</th>
                  <th className="px-6 py-3.5 text-left font-bold tracking-wider">Category</th>
                  <th className="px-6 py-3.5 text-left font-bold tracking-wider">Normal Price</th>
                  <th className="px-6 py-3.5 text-left font-bold tracking-wider">Retailer Price</th>
                  <th className="px-6 py-3.5 text-left font-bold tracking-wider">Stock</th>
                  <th className="px-6 py-3.5 text-left font-bold tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 font-medium text-gray-600">
                {filteredProducts.map((product) => {
                  const thumbnail = product.images?.[0] || product.imageUrl;
                  const isSelected = selectedProductIds.includes(product._id);
                  return (
                    <tr key={product._id} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-indigo-50/20' : ''}`}>
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleProductSelected(product._id)}
                          className="w-4 h-4 text-gray-900 border-gray-300 rounded-none focus:ring-0"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {thumbnail && (
                            <img
                              src={thumbnail}
                              alt={product.name}
                              className="w-10 h-10 object-cover border border-gray-200 mr-3 rounded-none"
                            />
                          )}
                          <div>
                            <div className="font-bold text-gray-900">{product.name}</div>
                            <div className="flex gap-2 mt-1">
                              {product.requiresQuote && (
                                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                                  Quote Required
                                </span>
                              )}
                              {product.isRecommended && (
                                <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  Recommended
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-semibold">
                        {product.normalPrice ? `₹${product.normalPrice.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-semibold">
                        {product.retailerPrice ? `₹${product.retailerPrice.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border rounded-none ${(product.stock || product.stockQuantity || 0) > 10
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : (product.stock || product.stockQuantity || 0) > 0
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                        >
                          {product.stock || product.stockQuantity || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2.5">
                          <button
                            onClick={() => handleToggleRecommended(product._id, product.isRecommended || false)}
                            className={`${product.isRecommended ? 'text-amber-500 hover:text-amber-700' : 'text-gray-400 hover:text-amber-500'} transition-colors`}
                            title="Toggle Recommended"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-gray-600 hover:text-gray-900 transition-colors"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => loadProductUnits(product._id)}
                            className="text-gray-600 hover:text-gray-900 transition-colors"
                            title="View Units"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="Delete"
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
      </div>
    );
  };

  // Render Users Tab
  const renderUsers = () => {




    const handleChangeUserRole = async (userId: string, currentRole: string) => {
      const roles = ['user', 'retailer', 'admin'];
      const currentIndex = roles.indexOf(currentRole);
      const nextRole = roles[(currentIndex + 1) % roles.length];

      if (!window.confirm(`Change user role from "${currentRole}" to "${nextRole}"?\n\nThis will update the user's permissions immediately.`)) {
        return;
      }

      try {
        await api.put(`/api/auth/users/${userId}`, { role: nextRole });
        await loadUsers();
        alert(`✓ User role successfully updated to "${nextRole}"`);
      } catch (error: any) {
        alert(error.response?.data?.message || 'Failed to update user role');
      }
    };

    // Calculate user stats
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.role !== 'retailer' || u.isApproved).length;
    const pendingUsers = users.filter(u => u.role === 'retailer' && !u.isApproved).length;
    const adminUsers = users.filter(u => u.role === 'admin').length;
    const retailerUsers = users.filter(u => u.role === 'retailer').length;

    // Filter users
    const filteredUsers = users.filter((user) => {
      // Search filter
      if (userSearch) {
        const searchLower = userSearch.toLowerCase();
        const nameMatch = user.name?.toLowerCase().includes(searchLower);
        const emailMatch = user.email?.toLowerCase().includes(searchLower);
        if (!nameMatch && !emailMatch) return false;
      }

      // Role filter
      if (userFilterRole !== 'all' && user.role !== userFilterRole) {
        return false;
      }

      // Status filter
      if (userFilterStatus !== 'all') {
        const isPending = user.role === 'retailer' && !user.isApproved;
        const isActive = user.role !== 'retailer' || user.isApproved;

        if (userFilterStatus === 'pending' && !isPending) return false;
        if (userFilterStatus === 'active' && !isActive) return false;
      }

      return true;
    });

    const hasActiveFilters = userSearch || userFilterRole !== 'all' || userFilterStatus !== 'all';

    return (
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="bg-slate-900 border border-slate-850 p-6 text-white rounded-none flex items-center justify-between shadow-md">
          <div>
            <p className="text-gray-400 text-xs">Manage user accounts, roles, approvals, and B2C/B2B permissions.</p>
          </div>
          <Users className="w-10 h-10 text-gray-500" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 border-t-2 border-t-indigo-600 border-x border-b border-gray-200 shadow-sm rounded-none hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Users</p>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-black text-gray-900">{totalUsers}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-1">Platform members</p>
          </div>

          <div className="bg-white p-5 border-t-2 border-t-green-600 border-x border-b border-gray-200 shadow-sm rounded-none hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Users</p>
              <Check className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-black text-green-600">{activeUsers}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-1">Authorized access</p>
          </div>

          <div className="bg-white p-5 border-t-2 border-t-orange-500 border-x border-b border-gray-200 shadow-sm rounded-none hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pending</p>
              <AlertCircle className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-2xl font-black text-orange-600">{pendingUsers}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-1">Awaiting approval</p>
          </div>

          <div className="bg-white p-5 border-t-2 border-t-purple-600 border-x border-b border-gray-200 shadow-sm rounded-none hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Admins</p>
              <Shield className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl font-black text-purple-600">{adminUsers}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-1">System managers</p>
          </div>

          <div className="bg-white p-5 border-t-2 border-t-blue-500 border-x border-b border-gray-200 shadow-sm rounded-none hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Retailers</p>
              <Store className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-black text-blue-600">{retailerUsers}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-1">B2B Partners</p>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="bg-white p-5 border border-gray-200 rounded-none shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:bg-white transition-all w-64"
              />
            </div>

            <select
              value={userFilterRole}
              onChange={(e) => setUserFilterRole(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:bg-white transition-all"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="retailer">Retailer</option>
              <option value="user">User</option>
            </select>

            <select
              value={userFilterStatus}
              onChange={(e) => setUserFilterStatus(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:bg-white transition-all"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending Approval</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setUserSearch('');
                  setUserFilterRole('all');
                  setUserFilterStatus('all');
                }}
                className="text-xs font-bold text-red-600 hover:text-red-800 uppercase tracking-wider hover:underline"
              >
                Clear Filters
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => handleServerExport('users', 'pdf')}
                className="px-3 py-2 text-[10px] font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-none border border-red-200 transition-colors uppercase tracking-wider"
              >
                PDF
              </button>
              <button
                onClick={() => handleServerExport('users', 'csv')}
                className="px-3 py-2 text-[10px] font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-none border border-green-200 transition-colors uppercase tracking-wider"
              >
                CSV
              </button>
              <button
                onClick={() => handleServerExport('users', 'excel')}
                className="px-3 py-2 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-none border border-blue-200 transition-colors uppercase tracking-wider"
              >
                Excel
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        {hasActiveFilters && (
          <div className="bg-blue-50 border border-blue-200 rounded-none p-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-blue-800">
            <Info className="w-5 h-5 text-blue-600" />
            <p>
              Showing <span className="font-bold">{filteredUsers.length}</span> of <span className="font-bold">{totalUsers}</span> users
            </p>
          </div>
        )}

        <div className="bg-white rounded-none border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-[22%] px-6 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="w-[22%] px-6 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="w-[14%] px-6 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="w-[14%] px-6 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="w-[14%] px-6 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Member Since
                  </th>
                  <th className="w-[14%] px-6 py-3.5 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No users found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {hasActiveFilters ? 'Try adjusting your filters' : 'No users available'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-none flex items-center justify-center font-bold text-white shadow-sm text-sm ${user.role === 'admin' ? 'bg-purple-600' :
                            user.role === 'retailer' ? 'bg-blue-600' :
                              'bg-slate-500'
                            }`}>
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate" title={user.name}>{user.name}</p>
                            <p className="text-xs text-gray-400 font-mono">ID: {user._id.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-600 truncate" title={user.email}>{user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider ${user.role === 'admin'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : user.role === 'retailer'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-gray-50 text-gray-700 border border-gray-200'
                              }`}
                          >
                            {user.role.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.role === 'retailer' && !user.isApproved ? (
                          <span className="px-2.5 py-1 rounded-none text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200 uppercase tracking-wider">
                            PENDING APPROVAL
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-none text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                            ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {new Date(user.createdAt).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1.5">
                          {user.role === 'retailer' && !user.isApproved && (
                            <button
                              onClick={() => handleApproveRetailer(user._id)}
                              className="text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 p-2 rounded-none transition-colors"
                              title="Approve Retailer Access"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleView360User(user)}
                            className="text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 p-2 rounded-none transition-colors"
                            title="View 360° User Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleViewUserWarranties(user._id)}
                            className="text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 p-2 rounded-none transition-colors"
                            title="View Warranty PDFs"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          {user.role === 'retailer' && (
                            <button
                              onClick={() => handleViewUserInventory(user._id)}
                              className="text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 p-2 rounded-none transition-colors"
                              title="View Inventory PDFs"
                            >
                              <Package className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleChangeUserRole(user._id, user.role)}
                            className="text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 p-2 rounded-none transition-colors"
                            title={`Change role from ${user.role} to ${['user', 'retailer', 'admin'][((['user', 'retailer', 'admin'].indexOf(user.role)) + 1) % 3]}`}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 p-2 rounded-none transition-colors"
                              title="Delete User Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render Quotes Tab
  const renderQuotes = () => {




    // Filter quotes
    const filteredQuotes = quotes.filter((quote) => {
      // Search filter
      if (quoteSearch) {
        const searchLower = quoteSearch.toLowerCase();
        const customerName = (quote.user?.name || quote.userId?.name || '').toLowerCase();
        const customerEmail = (quote.user?.email || quote.userId?.email || '').toLowerCase();
        const products = quote.products.map(p => (p.product?.name || p.productId?.name || '').toLowerCase()).join(' ');

        if (!customerName.includes(searchLower) && !customerEmail.includes(searchLower) && !products.includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (quoteFilterStatus !== 'all' && quote.status !== quoteFilterStatus) {
        return false;
      }

      return true;
    });

    const hasActiveFilters = quoteSearch || quoteFilterStatus !== 'all' || quoteStartDate || quoteEndDate;

    // Calculate stats
    const pendingQuotes = quotes.filter(q => q.status === 'pending').length;
    const respondedQuotes = quotes.filter(q => q.status === 'responded').length;
    const acceptedQuotes = quotes.filter(q => q.status === 'accepted' || q.status === 'approved').length;


    return (
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="bg-slate-900 border border-slate-850 p-6 text-white rounded-none flex items-center justify-between shadow-md">
          <div>
            <p className="text-gray-400 text-xs">Manage customer quote requests and configure custom business price tiers.</p>
          </div>
          <FileText className="w-10 h-10 text-gray-500" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-none border border-gray-200 border-t-4 border-t-orange-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pending Review</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{pendingQuotes}</p>
              </div>
              <div className="bg-orange-50 p-2.5 rounded-none border border-orange-200/50">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-none border border-gray-200 border-t-4 border-t-blue-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Responded</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{respondedQuotes}</p>
              </div>
              <div className="bg-blue-50 p-2.5 rounded-none border border-blue-200/50">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-none border border-gray-200 border-t-4 border-t-green-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Accepted</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{acceptedQuotes}</p>
              </div>
              <div className="bg-green-50 p-2.5 rounded-none border border-green-200/50">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-none border border-gray-200 border-t-4 border-t-indigo-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Quotes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{quotes.length}</p>
              </div>
              <div className="bg-indigo-50 p-2.5 rounded-none border border-indigo-200/50">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="bg-white p-4 rounded-none border border-gray-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer name, email, or product..."
                value={quoteSearch}
                onChange={(e) => setQuoteSearch(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 w-80"
              />
            </div>

            <select
              value={quoteFilterStatus}
              onChange={(e) => setQuoteFilterStatus(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="responded">Responded</option>
              <option value="accepted">Accepted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={quoteStartDate}
                onChange={(e) => setQuoteStartDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
                placeholder="Start Date"
              />
              <span className="text-gray-500 text-sm">to</span>
              <input
                type="date"
                value={quoteEndDate}
                onChange={(e) => setQuoteEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
                placeholder="End Date"
              />
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setQuoteSearch('');
                  setQuoteFilterStatus('all');
                  setQuoteStartDate('');
                  setQuoteEndDate('');
                }}
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-700 bg-red-50 hover:bg-red-100 rounded-none border border-red-200 transition-colors flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => handleServerExport('quotes', 'pdf')}
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 hover:bg-red-100 rounded-none border border-red-200 transition-colors flex items-center gap-1.5"
              >
                <Download size={12} /> PDF
              </button>
              <button
                onClick={() => handleServerExport('quotes', 'csv')}
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 hover:bg-green-100 rounded-none border border-green-200 transition-colors flex items-center gap-1.5"
              >
                <Download size={12} /> CSV
              </button>
              <button
                onClick={() => handleServerExport('quotes', 'excel')}
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-none border border-blue-200 transition-colors flex items-center gap-1.5"
              >
                <Download size={12} /> Excel
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        {hasActiveFilters && (
          <div className="bg-blue-50 border border-blue-200 rounded-none p-3 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-800">
              Showing <span className="font-semibold">{filteredQuotes.length}</span> of <span className="font-semibold">{quotes.length}</span> quotes
            </p>
          </div>
        )}

        {/* Quotes List */}
        {filteredQuotes.length === 0 ? (
          <div className="bg-white rounded-none border border-gray-200 p-12 text-center">
            <div className="bg-gray-50 border border-gray-200 rounded-none p-5 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
              {hasActiveFilters ? 'No quotes match your filters' : 'No quote requests found'}
            </h3>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-6">
              {hasActiveFilters
                ? 'Try adjusting your search criteria or clear the filters'
                : 'Quote requests will appear here once customers submit quotes'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setQuoteSearch('');
                  setQuoteFilterStatus('all');
                  setQuoteStartDate('');
                  setQuoteEndDate('');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-none font-bold uppercase tracking-wider text-xs hover:bg-purple-700 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuotes.map((quote) => {
              const status = quote.status || 'pending';
              const user = quote.user || quote.userId;
              const dateStr = quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : '';
              const timeStr = quote.createdAt ? new Date(quote.createdAt).toLocaleTimeString() : '';

              return (
                <div
                  key={quote._id}
                  className={`bg-white p-6 rounded-none border border-gray-200 border-l-4 ${
                    status === 'pending'
                      ? 'border-l-yellow-500'
                      : status === 'responded'
                        ? 'border-l-blue-500'
                        : status === 'rejected'
                          ? 'border-l-red-500'
                          : 'border-l-green-500'
                  } hover:shadow-md transition-shadow`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-indigo-50 border border-indigo-200 rounded-none w-10 h-10 flex items-center justify-center">
                        <span className="text-sm font-bold text-indigo-700">
                          {(user?.name || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-gray-900">
                          {user?.name || 'Unknown User'}
                        </h3>
                        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                          {user?.email}
                        </p>
                        {quote.createdAt && (
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            <Calendar className="w-3.5 h-3.5" />
                            Requested: {dateStr} {timeStr}
                          </div>
                        )}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border rounded-none ${
                        status === 'pending'
                          ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                          : status === 'responded'
                            ? 'bg-blue-50 border-blue-200 text-blue-800'
                            : status === 'rejected'
                              ? 'bg-red-50 border-red-200 text-red-800'
                              : 'bg-green-50 border-green-200 text-green-800'
                      }`}
                    >
                      {status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                      {status === 'responded' && <MessageSquare className="w-3 h-3 mr-1" />}
                      {status === 'rejected' && <X className="w-3 h-3 mr-1" />}
                      {(status === 'accepted' || status === 'approved') && <CheckCircle className="w-3 h-3 mr-1" />}
                      {status}
                    </span>
                  </div>

                  {/* Customer message if exists */}
                  {quote.message && (
                    <div className="bg-gray-50 rounded-none border border-gray-200 p-3 mb-4 text-xs text-gray-600">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Customer Message</p>
                      <p className="italic">"{quote.message}"</p>
                    </div>
                  )}

                  {/* Requested Products */}
                  <div className="bg-gray-50 rounded-none border border-gray-200 p-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200 pb-2 mb-2">
                      Requested Products
                    </p>
                    <div className="space-y-3">
                      {quote.products.map((p) => {
                        const productObj = p.product || p.productId;
                        const prodId = productObj?._id || '';
                        const prodName = productObj?.name || 'Unknown Product';

                        return (
                          <div
                            key={prodId}
                            className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0"
                          >
                            <div>
                              <p className="text-xs font-bold text-gray-900">{prodName}</p>
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Qty: {p.quantity}</p>
                            </div>
                            {status === 'pending' ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-400">₹</span>
                                <input
                                  type="number"
                                  placeholder="Offered Price"
                                  value={quoteResponse.id === quote._id ? (quoteResponse.products[prodId] || '') : ''}
                                  onChange={(e) => {
                                    setQuoteResponse((prev) => ({
                                      ...prev,
                                      id: quote._id,
                                      products: {
                                        ...prev.products,
                                        [prodId]: e.target.value
                                      }
                                    }));
                                  }}
                                  className="w-32 px-2 py-1 bg-white border border-gray-200 rounded-none text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-gray-900">
                                ₹{(p as any).offeredPrice ? (p as any).offeredPrice.toLocaleString() : 'N/A'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Composer/Response Details */}
                  {status === 'pending' ? (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Response Message
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Type response details or terms..."
                        value={quoteResponse.id === quote._id ? quoteResponse.response : ''}
                        onChange={(e) => {
                          setQuoteResponse((prev) => ({
                            ...prev,
                            id: quote._id,
                            response: e.target.value
                          }));
                        }}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-none text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <div className="flex justify-end gap-2 mt-3">
                        <button
                          onClick={() => handleRejectQuote(quote._id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-none transition-colors"
                        >
                          Reject Quote
                        </button>
                        <button
                          onClick={() => handleRespondToQuote(quote._id)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-none transition-colors"
                        >
                          Send Response
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {quote.adminResponse && (
                        <div className="mt-4 bg-blue-50/50 border border-blue-200/50 p-4">
                          <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Admin Response</p>
                          <p className="text-xs text-gray-700 mt-1">
                            {typeof quote.adminResponse === 'object' ? quote.adminResponse.message : quote.adminResponse}
                          </p>
                          {quote.quotedPrice && (
                            <p className="text-xs font-bold text-gray-900 mt-2">
                              Quoted Price: {formatCurrency(quote.quotedPrice)}
                            </p>
                          )}
                        </div>
                      )}

                      {status !== 'rejected' && (
                        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                          <div>
                            {quote.deliveryTrackingLink ? (
                              <div className="flex items-center gap-1.5 text-[10px] text-green-700 font-bold uppercase tracking-wider bg-green-50 px-2 py-1 border border-green-200">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Tracking: <a href={quote.deliveryTrackingLink} target="_blank" rel="noopener noreferrer" className="underline hover:text-green-900">{quote.deliveryTrackingLink}</a>
                              </div>
                            ) : (
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">No tracking link added</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleOpenTrackingModal(quote._id, 'quote', quote.deliveryTrackingLink, user?.email)}
                            className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-none border border-indigo-200 transition-colors flex items-center gap-1"
                          >
                            <LinkIcon className="w-3 h-3" />
                            {quote.deliveryTrackingLink ? 'Update Tracking' : 'Add Tracking'}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}


      </div>
    );
  };

  // Update Payment Status Handler
  const handleUpdatePaymentStatus = async (orderId: string, status: string) => {
    try {
      await api.put(`/api/orders/${orderId}/payment-status`, { paymentStatus: status });
      alert('Payment status updated successfully');
      loadOrders();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update payment status');
    }
  };

  // Render Orders Tab
  const renderOrders = () => {




    // Filter orders
    const filteredOrders = orders.filter((order) => {
      // Search filter
      if (orderSearch) {
        const searchLower = orderSearch.toLowerCase();
        const customerName = (order.userId?.name || '').toLowerCase();
        const customerEmail = (order.userId?.email || '').toLowerCase();
        const orderNumber = (order.orderNumber || order._id || '').toLowerCase();
        const products = order.products.map(p => ((p.productId || (p as any).product)?.name || '').toLowerCase()).join(' ');

        if (!customerName.includes(searchLower) && !customerEmail.includes(searchLower) &&
          !orderNumber.includes(searchLower) && !products.includes(searchLower)) {
          return false;
        }
      }

      // Payment status filter
      if (orderFilterPayment !== 'all' && order.paymentStatus !== orderFilterPayment) {
        return false;
      }

      return true;
    });

    const hasActiveFilters = orderSearch || orderFilterPayment !== 'all' || orderStartDate || orderEndDate;

    // Calculate stats
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const pendingPayments = orders.filter(o => o.paymentStatus === 'pending').length;
    const completedPayments = orders.filter(o => o.paymentStatus === 'completed' || o.paymentStatus === 'paid').length;

    return (
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="bg-slate-900 border border-slate-850 p-6 text-white rounded-none flex items-center justify-between shadow-md">
          <div>
            <p className="text-gray-400 text-xs">Track, manage, print delivery labels, and fulfill customer orders.</p>
          </div>
          <ShoppingCart className="w-10 h-10 text-gray-500" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-none border border-gray-200 border-t-4 border-t-indigo-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalOrders}</p>
              </div>
              <div className="bg-indigo-50 p-2.5 rounded-none border border-indigo-200/50">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-none border border-gray-200 border-t-4 border-t-green-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600 mt-1">₹{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-green-50 p-2.5 rounded-none border border-green-200/50">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-none border border-gray-200 border-t-4 border-t-orange-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pending Payment</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{pendingPayments}</p>
              </div>
              <div className="bg-orange-50 p-2.5 rounded-none border border-orange-200/50">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-none border border-gray-200 border-t-4 border-t-emerald-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Completed</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{completedPayments}</p>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-none border border-emerald-200/50">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="bg-white p-4 rounded-none border border-gray-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer, order ID, or product..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-gray-50 w-80"
              />
            </div>

            <select
              value={orderFilterPayment}
              onChange={(e) => setOrderFilterPayment(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-gray-50 font-semibold"
            >
              <option value="all">All Payment Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={orderStartDate}
                onChange={(e) => setOrderStartDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-gray-50"
                placeholder="Start Date"
              />
              <span className="text-gray-500 text-sm">to</span>
              <input
                type="date"
                value={orderEndDate}
                onChange={(e) => setOrderEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-gray-50"
                placeholder="End Date"
              />
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setOrderSearch('');
                  setOrderFilterPayment('all');
                  setOrderStartDate('');
                  setOrderEndDate('');
                }}
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-700 bg-red-50 hover:bg-red-100 rounded-none border border-red-200 transition-colors flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => handleServerExport('orders', 'pdf')}
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 hover:bg-red-100 rounded-none border border-red-200 transition-colors flex items-center gap-1.5"
              >
                <Download size={12} /> PDF
              </button>
              <button
                onClick={() => handleServerExport('orders', 'csv')}
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 hover:bg-green-100 rounded-none border border-green-200 transition-colors flex items-center gap-1.5"
              >
                <Download size={12} /> CSV
              </button>
              <button
                onClick={() => handleServerExport('orders', 'excel')}
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-none border border-blue-200 transition-colors flex items-center gap-1.5"
              >
                <Download size={12} /> Excel
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        {hasActiveFilters && (
          <div className="bg-blue-50 border border-blue-200 rounded-none p-3 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-800">
              Showing <span className="font-semibold">{filteredOrders.length}</span> of <span className="font-semibold">{totalOrders}</span> orders
            </p>
          </div>
        )}

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-none border border-gray-200 p-12">
            <div className="text-center">
              <div className="bg-gray-50 border border-gray-200 rounded-none p-5 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                {hasActiveFilters ? 'No orders match your filters' : 'No orders found'}
              </h3>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-6">
                {hasActiveFilters
                  ? 'Try adjusting your search criteria or clear the filters'
                  : 'Orders will appear here once customers start placing orders'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setOrderSearch('');
                    setOrderFilterPayment('all');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-none font-bold uppercase tracking-wider text-xs hover:bg-emerald-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-none border border-gray-200 overflow-hidden shadow-none">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider">
                      Products
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="px-6 py-4 text-sm">
                        <span className="font-mono font-bold text-indigo-600">
                          #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-indigo-50 border border-indigo-200 rounded-none w-10 h-10 flex items-center justify-center">
                            <span className="text-sm font-bold text-indigo-700">
                              {(order.user?.name || order.userId?.name || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-sm">
                              {order.user?.name || order.userId?.name || 'Unknown User'}
                              {order.isDropship && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-wider bg-blue-50 border border-blue-200 text-blue-800">
                                  Dropship
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 font-semibold">{order.user?.email || order.userId?.email}</div>
                            {order.isDropship && order.customerDetails && (
                              <div className="mt-1 text-[10px] text-blue-600 font-bold uppercase tracking-wider flex items-center gap-1">
                                <Truck size={12} />
                                <span>Ship to: <strong className="text-blue-800">{order.customerDetails.name}</strong></span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                            {order.products.length} item{order.products.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 truncate max-w-[180px]">
                          {order.products.slice(0, 2).map((p) => {
                            const product = p.productId || (p as any).product;
                            return product?.name || 'Unknown Product';
                          }).join(', ')}
                          {order.products.length > 2 && ` +${order.products.length - 2} MORE`}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-gray-950">
                          ₹{order.totalAmount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.paymentStatus || 'pending'}
                          onChange={(e) => handleUpdatePaymentStatus(order._id, e.target.value)}
                          className={`px-2 py-1 rounded-none border border-gray-200 font-bold uppercase text-[10px] tracking-wider cursor-pointer bg-gray-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${
                            order.paymentStatus === 'completed' || order.paymentStatus === 'paid'
                              ? 'text-green-800 hover:bg-green-100'
                              : order.paymentStatus === 'failed'
                                ? 'text-red-800 hover:bg-red-100'
                                : 'text-yellow-800 hover:bg-yellow-100'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-900 font-semibold">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                          {new Date(order.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowOrderDetailsModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 border border-blue-200/50 bg-blue-50/30 rounded-none transition-colors"
                            title="View Order Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {(order.invoiceUrl || order.customerInvoiceUrl) && (
                            <a
                              href={order.invoiceUrl || order.customerInvoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-purple-600 hover:bg-purple-50 border border-purple-200/50 bg-purple-50/30 rounded-none transition-colors"
                              title="View Invoice PDF"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => handlePrintDeliveryLabel(order)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 border border-indigo-200/50 bg-indigo-50/30 rounded-none transition-colors"
                            title="Print Delivery Label"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenTrackingModal(order._id, 'order', order.deliveryTrackingLink, undefined, order.trackingId)}
                            className={`p-2 rounded-none border transition-colors ${
                              order.deliveryTrackingLink
                                ? 'text-green-600 bg-green-50/30 border-green-200/50 hover:bg-green-50'
                                : 'text-orange-600 bg-orange-50/30 border-orange-200/50 hover:bg-orange-50'
                            }`}
                            title={order.deliveryTrackingLink ? 'Update Tracking Link' : 'Add Tracking Link'}
                          >
                            <LinkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Warranties Tab
  const renderWarranties = () => {
    // Filter warranties
    const filteredWarranties = warranties.filter((warranty) => {
      // Search filter
      if (warrantySearch) {
        const searchLower = warrantySearch.toLowerCase();
        const productName = (warranty.productName || '').toLowerCase();
        const customerName = (warranty.userId?.name || '').toLowerCase();
        const customerEmail = (warranty.userId?.email || '').toLowerCase();
        const serialNumber = (warranty.serialNumber || '').toLowerCase();
        const modelNumber = (warranty.modelNumber || '').toLowerCase();

        if (!productName.includes(searchLower) && !customerName.includes(searchLower) &&
          !customerEmail.includes(searchLower) && !serialNumber.includes(searchLower) &&
          !modelNumber.includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (warrantyFilterStatus !== 'all' && warranty.status !== warrantyFilterStatus) {
        return false;
      }

      return true;
    });

    const hasActiveFilters = warrantySearch || warrantyFilterStatus !== 'all';

    // Calculate stats
    const totalWarranties = warranties.length;
    const pendingWarranties = warranties.filter(w => w.status === 'pending').length;
    const approvedWarranties = warranties.filter(w => w.status === 'approved').length;
    const rejectedWarranties = warranties.filter(w => w.status === 'rejected').length;

    return (
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="bg-slate-900 border border-slate-850 p-6 text-white rounded-none flex items-center justify-between shadow-md">
          <div>
            <p className="text-gray-400 text-xs">Review, approve, and validate customer product warranty claims.</p>
          </div>
          <Shield className="w-10 h-10 text-gray-500" />
        </div>

        {/* Warranty Validation Tool */}
        <WarrantyValidator />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-none border border-gray-200 border-t-4 border-t-indigo-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Warranties</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalWarranties}</p>
              </div>
              <div className="bg-indigo-50 p-2.5 rounded-none border border-indigo-200/50">
                <Shield className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-none border border-gray-200 border-t-4 border-t-yellow-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingWarranties}</p>
              </div>
              <div className="bg-yellow-50 p-2.5 rounded-none border border-yellow-200/50">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-none border border-gray-200 border-t-4 border-t-green-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Approved</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{approvedWarranties}</p>
              </div>
              <div className="bg-green-50 p-2.5 rounded-none border border-green-200/50">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-none border border-gray-200 border-t-4 border-t-red-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rejected</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{rejectedWarranties}</p>
              </div>
              <div className="bg-red-50 p-2.5 rounded-none border border-red-200/50">
                <X className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="bg-white p-4 rounded-none border border-gray-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by product, customer, serial, or model..."
                value={warrantySearch}
                onChange={(e) => setWarrantySearch(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 bg-gray-50 w-80"
              />
            </div>

            <select
              value={warrantyFilterStatus}
              onChange={(e) => setWarrantyFilterStatus(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 bg-gray-50"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setWarrantySearch('');
                  setWarrantyFilterStatus('all');
                }}
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-700 bg-red-50 hover:bg-red-100 rounded-none border border-red-200 transition-colors flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => handleServerExport('warranties', 'pdf')}
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 hover:bg-red-100 rounded-none border border-red-200 transition-colors flex items-center gap-1.5"
              >
                <Download size={12} /> PDF
              </button>
              <button
                onClick={() => handleServerExport('warranties', 'csv')}
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 hover:bg-green-100 rounded-none border border-green-200 transition-colors flex items-center gap-1.5"
              >
                <Download size={12} /> CSV
              </button>
              <button
                onClick={() => handleServerExport('warranties', 'excel')}
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-none border border-blue-200 transition-colors flex items-center gap-1.5"
              >
                <Download size={12} /> Excel
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        {hasActiveFilters && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-800">
              Showing <span className="font-semibold">{filteredWarranties.length}</span> of <span className="font-semibold">{totalWarranties}</span> warranties
            </p>
          </div>
        )}

        {/* Warranty Cards */}
        {filteredWarranties.length === 0 ? (
          <div className="bg-white rounded-none border border-gray-200 p-12">
            <div className="text-center">
              <div className="bg-gray-50 border border-gray-200 rounded-none p-5 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                {hasActiveFilters ? 'No warranties match your filters' : 'No warranty registrations found'}
              </h3>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-6">
                {hasActiveFilters
                  ? 'Try adjusting your search criteria or clear the filters'
                  : 'Warranty registrations will appear here once customers register their products'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setWarrantySearch('');
                    setWarrantyFilterStatus('all');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-none font-bold uppercase tracking-wider text-xs hover:bg-purple-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWarranties.map((warranty) => (
              <div
                key={warranty._id}
                className={`bg-white p-6 rounded-none border border-gray-200 border-l-4 ${
                  warranty.status === 'pending' ? 'border-l-yellow-500' : warranty.status === 'approved' ? 'border-l-green-500' : 'border-l-red-500'
                } hover:shadow-md transition-shadow`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-purple-50 p-2.5 rounded-none border border-purple-200/50">
                      <Shield className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-gray-900">{warranty.productName}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="bg-indigo-50 border border-indigo-200 rounded-none w-8 h-8 flex items-center justify-center">
                          <span className="text-xs font-bold text-indigo-700">
                            {(warranty.userId?.name || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">{warranty.userId?.name}</p>
                          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">{warranty.userId?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        <Calendar className="w-3.5 h-3.5" />
                        Registered: {new Date(warranty.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-wider border rounded-none ${
                      warranty.status === 'pending'
                        ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                        : warranty.status === 'approved'
                          ? 'bg-green-50 border-green-200 text-green-800'
                          : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    {warranty.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                    {warranty.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {warranty.status === 'rejected' && <X className="w-3 h-3 mr-1" />}
                    {warranty.status}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-none border border-gray-200 p-4 mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Serial Number</p>
                      <p className="font-bold text-gray-900 mt-1 text-sm uppercase">{warranty.serialNumber}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Model Number</p>
                      <p className="font-bold text-gray-900 mt-1 text-sm uppercase">{warranty.modelNumber}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Purchase Date</p>
                      <p className="font-bold text-gray-900 mt-1 text-sm">
                        {new Date(warranty.purchaseDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Purchase Type</p>
                      <p className="font-bold text-gray-900 mt-1 text-sm capitalize">{warranty.purchaseType}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {warranty.invoiceUrl && (
                      <a
                        href={warranty.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-none transition-colors border border-blue-200 hover:border-blue-300"
                      >
                        <Download className="w-3 h-3" />
                        Invoice PDF
                      </a>
                    )}
                    {warranty.warrantyCertificateUrl && (
                      <a
                        href={warranty.warrantyCertificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-800 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 bg-purple-50 px-3 py-1.5 rounded-none transition-colors border border-purple-200 hover:border-purple-300"
                      >
                        <Shield className="w-3 h-3" />
                        Warranty Certificate PDF
                      </a>
                    )}
                  </div>
                  {warranty.status === 'pending' && (
                    <div className="flex gap-3 ml-auto">
                      <button
                        onClick={() => handleWarrantyAction(warranty._id, 'approved')}
                        className="bg-green-600 text-white px-4 py-2 rounded-none font-bold uppercase tracking-wider text-xs hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleWarrantyAction(warranty._id, 'rejected')}
                        className="bg-red-600 text-white px-4 py-2 rounded-none font-bold uppercase tracking-wider text-xs hover:bg-red-700 transition-colors flex items-center gap-2 shadow-sm"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Investor Documents CRUD Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('document', selectedFile);

      const response = await api.post('/api/investor-documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update form with uploaded file details
      setInvestorDocForm({
        ...investorDocForm,
        documentUrl: response.data.url,
        fileSize: response.data.fileSize,
        fileType: response.data.fileType,
        title: investorDocForm.title || response.data.originalName.replace(/\.[^/.]+$/, ''), // Use filename as title if empty
      });

      alert('File uploaded successfully!');
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSaveInvestorDocument = async () => {
    try {
      if (!investorDocForm.documentUrl) {
        alert('Please upload a document first');
        return;
      }

      if (editingInvestorDoc) {
        await api.put(`/api/investor-documents/${editingInvestorDoc._id}`, investorDocForm);
        alert('Investor document updated successfully');
      } else {
        await api.post('/api/investor-documents', investorDocForm);
        alert('Investor document created successfully');
      }
      setShowInvestorDocModal(false);
      setEditingInvestorDoc(null);
      setSelectedFile(null);
      setInvestorDocForm({
        title: '',
        category: '',
        description: '',
        documentUrl: '',
        fileSize: '',
        fileType: 'PDF',
        publishDate: new Date().toISOString().split('T')[0],
        isActive: true,
        displayOrder: 0,
      });
      loadInvestorDocuments();
    } catch (error) {
      console.error('Error saving investor document:', error);
      alert('Failed to save investor document');
    }
  };

  const handleEditInvestorDocument = (doc: InvestorDocument) => {
    setEditingInvestorDoc(doc);
    setSelectedFile(null);
    setInvestorDocForm({
      title: doc.title,
      category: doc.category,
      description: doc.description || '',
      documentUrl: doc.documentUrl,
      fileSize: doc.fileSize || '',
      fileType: doc.fileType,
      publishDate: new Date(doc.publishDate).toISOString().split('T')[0],
      isActive: doc.isActive,
      displayOrder: doc.displayOrder,
    });
    setShowInvestorDocModal(true);
  };

  const handleDeleteInvestorDocument = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/api/investor-documents/${id}`);
      alert('Document deleted successfully');
      loadInvestorDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  // Render Investor Documents Tab
  const renderInvestorDocuments = () => {
    const filteredDocs = investorDocuments.filter((doc) => {
      if (investorDocSearch) {
        const searchLower = investorDocSearch.toLowerCase();
        if (!doc.title.toLowerCase().includes(searchLower) &&
          !doc.category.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      if (investorDocFilterCategory !== 'all' && doc.category !== investorDocFilterCategory) {
        return false;
      }
      return true;
    });

    const uniqueCategories = [...new Set(investorDocuments.map(d => d.category))].sort();
    const hasActiveFilters = investorDocSearch || investorDocFilterCategory !== 'all';

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-slate-900 border border-slate-850 p-6 text-white rounded-none flex items-center justify-between shadow-md">
          <div>
            <p className="text-gray-400 text-xs">Manage report publication, shareholdings, and official investor materials.</p>
          </div>
          <FileText className="w-10 h-10 text-gray-500" />
        </div>

        {/* Filters and Actions */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title or category..."
                value={investorDocSearch}
                onChange={(e) => setInvestorDocSearch(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-80"
              />
            </div>

            <select
              value={investorDocFilterCategory}
              onChange={(e) => setInvestorDocFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setInvestorDocSearch('');
                  setInvestorDocFilterCategory('all');
                }}
                className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}

            <button
              onClick={() => {
                setEditingInvestorDoc(null);
                setInvestorDocForm({
                  title: '',
                  category: '',
                  description: '',
                  documentUrl: '',
                  fileSize: '',
                  fileType: 'PDF',
                  publishDate: new Date().toISOString().split('T')[0],
                  isActive: true,
                  displayOrder: 0,
                });
                setShowInvestorDocModal(true);
              }}
              className="ml-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Document
            </button>
          </div>
        </div>

        {/* Documents List */}
        {filteredDocs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {hasActiveFilters ? 'No documents match your filters' : 'No investor documents found'}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {hasActiveFilters ? 'Try adjusting your search criteria' : 'Start by adding your first investor document'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-green-50 to-teal-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Type/Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Publish Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDocs.map((doc) => (
                    <tr key={doc._id} className="hover:bg-green-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{doc.title}</div>
                        {doc.description && (
                          <div className="text-sm text-gray-600 line-clamp-1">{doc.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {doc.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {doc.fileType}{doc.fileSize && ` • ${doc.fileSize}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(doc.publishDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${doc.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                          {doc.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <a
                            href={doc.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Document"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleEditInvestorDocument(doc)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteInvestorDocument(doc._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
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
        )}

        {/* Add/Edit Modal */}
        {showInvestorDocModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowInvestorDocModal(false)}></div>
              <div className="relative bg-white rounded-lg max-w-2xl w-full p-6 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    {editingInvestorDoc ? 'Edit Document' : 'Add New Document'}
                  </h3>
                  <button onClick={() => setShowInvestorDocModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      value={investorDocForm.title}
                      onChange={(e) => setInvestorDocForm({ ...investorDocForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <input
                      type="text"
                      value={investorDocForm.category}
                      onChange={(e) => setInvestorDocForm({ ...investorDocForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., Annual Reports, Quarterly Results"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={investorDocForm.description}
                      onChange={(e) => setInvestorDocForm({ ...investorDocForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      rows={3}
                    />
                  </div>

                  {/* File Upload Section */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Document *</label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept=".pdf,.xls,.xlsx,.doc,.docx,.ppt,.pptx"
                          onChange={handleFileSelect}
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-lg file:border-0
                            file:text-sm file:font-semibold
                            file:bg-green-50 file:text-green-700
                            hover:file:bg-green-100 cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={handleUploadFile}
                          disabled={!selectedFile || uploadingFile}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
                        >
                          {uploadingFile ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              Upload
                            </>
                          )}
                        </button>
                      </div>
                      {selectedFile && (
                        <p className="text-sm text-gray-600">
                          Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                      {investorDocForm.documentUrl && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>Document uploaded successfully</span>
                          <a href={investorDocForm.documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            View
                          </a>
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        Accepted formats: PDF, Excel (.xls, .xlsx), Word (.doc, .docx), PowerPoint (.ppt, .pptx). Max size: 50MB
                      </p>
                    </div>
                  </div>

                  {investorDocForm.documentUrl && (
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">File Type</label>
                        <p className="text-sm font-semibold text-gray-900">{investorDocForm.fileType}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">File Size</label>
                        <p className="text-sm font-semibold text-gray-900">{investorDocForm.fileSize || 'N/A'}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Publish Date *</label>
                      <input
                        type="date"
                        value={investorDocForm.publishDate}
                        onChange={(e) => setInvestorDocForm({ ...investorDocForm, publishDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                      <input
                        type="number"
                        value={investorDocForm.displayOrder}
                        onChange={(e) => setInvestorDocForm({ ...investorDocForm, displayOrder: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={investorDocForm.isActive}
                      onChange={(e) => setInvestorDocForm({ ...investorDocForm, isActive: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active (visible to public)</label>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setShowInvestorDocModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveInvestorDocument}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      {editingInvestorDoc ? 'Update' : 'Create'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Email Logs Tab
  const renderEmailLogs = () => {
    // Filter email logs
    const filteredEmailLogs = emailLogs.filter((log) => {
      // Search filter
      if (emailSearch) {
        const searchLower = emailSearch.toLowerCase();
        const recipient = (log.recipient || '').toLowerCase();
        const subject = (log.subject || '').toLowerCase();
        const emailType = (log.emailType || '').toLowerCase();

        if (!recipient.includes(searchLower) && !subject.includes(searchLower) && !emailType.includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (emailFilterStatus !== 'all' && log.status !== emailFilterStatus) {
        return false;
      }

      // Type filter
      if (emailFilterType !== 'all' && log.emailType !== emailFilterType) {
        return false;
      }

      return true;
    });

    const hasActiveFilters = emailSearch || emailFilterStatus !== 'all' || emailFilterType !== 'all';

    // Calculate stats
    const totalEmails = emailLogs.length;
    const sentEmails = emailLogs.filter(e => e.status === 'sent').length;
    const failedEmails = emailLogs.filter(e => e.status === 'failed').length;
    const uniqueTypes = [...new Set(emailLogs.map(e => e.emailType))].length;

    return (
      <div className="space-y-5">
        {/* Stats Cards - border-t-4 accent style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 border-t-4 border-t-indigo-500 rounded-none p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Emails</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{totalEmails}</p>
              </div>
              <Mail className="w-5 h-5 text-indigo-500" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 border-t-4 border-t-emerald-500 rounded-none p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Sent Successfully</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{sentEmails}</p>
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 border-t-4 border-t-red-500 rounded-none p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Failed</p>
                <p className="text-2xl font-black text-red-600 mt-1">{failedEmails}</p>
              </div>
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 border-t-4 border-t-blue-500 rounded-none p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Email Types</p>
                <p className="text-2xl font-black text-blue-600 mt-1">{uniqueTypes}</p>
              </div>
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Filters & Export Row */}
        <div className="bg-white border border-gray-200 rounded-none p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[250px] max-w-sm">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by recipient, subject, or type..."
                value={emailSearch}
                onChange={(e) => setEmailSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
              />
            </div>

            <select
              value={emailFilterStatus}
              onChange={(e) => setEmailFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-50 font-medium"
            >
              <option value="all">All Status</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>

            <select
              value={emailFilterType}
              onChange={(e) => setEmailFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-50 font-medium"
            >
              <option value="all">All Types</option>
              {[...new Set(emailLogs.map(e => e.emailType))].map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setEmailSearch('');
                  setEmailFilterStatus('all');
                  setEmailFilterType('all');
                }}
                className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-red-700 bg-red-50 hover:bg-red-100 rounded-none border border-red-200 transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <Download className="w-4 h-4 text-gray-400" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Export:</span>
              <button
                onClick={() => handleServerExport('email-logs', 'pdf')}
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 hover:bg-red-100 rounded-none border border-red-200 transition-colors"
              >
                PDF
              </button>
              <button
                onClick={() => handleServerExport('email-logs', 'csv')}
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 hover:bg-green-100 rounded-none border border-green-200 transition-colors"
              >
                CSV
              </button>
              <button
                onClick={() => handleServerExport('email-logs', 'excel')}
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-none border border-blue-200 transition-colors"
              >
                Excel
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        {hasActiveFilters && (
          <div className="bg-indigo-50 border-l-4 border-l-indigo-500 border border-indigo-200 rounded-none px-4 py-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-600" />
            <p className="text-xs font-semibold text-indigo-800">
              Showing <span className="font-black">{filteredEmailLogs.length}</span> of <span className="font-black">{totalEmails}</span> email logs
            </p>
          </div>
        )}

        {/* Email Logs Table */}
        {filteredEmailLogs.length === 0 ? (
          <div className="bg-white rounded-none border border-gray-200 p-16">
            <div className="text-center">
              <div className="bg-gray-100 rounded-none p-5 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Mail className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                {hasActiveFilters ? 'No email logs match your filters' : 'No email logs found'}
              </h3>
              <p className="text-xs text-gray-500 mb-6">
                {hasActiveFilters
                  ? 'Try adjusting your search criteria or clear the filters'
                  : 'Email logs will appear here once the system sends emails'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setEmailSearch('');
                    setEmailFilterStatus('all');
                    setEmailFilterType('all');
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-none font-bold uppercase tracking-wider text-xs hover:bg-indigo-700 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-none overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Recipient
                    </th>
                    <th className="px-6 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Sent At
                    </th>
                    <th className="px-6 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredEmailLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-900">{log.recipient}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                        <span className="line-clamp-2">{log.subject}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider border bg-blue-50 text-blue-700 border-blue-200">
                          {log.emailType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider border ${log.status === 'sent'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                        >
                          {log.status === 'sent' && <CheckCircle className="w-3 h-3" />}
                          {log.status === 'failed' && <AlertCircle className="w-3 h-3" />}
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-semibold text-gray-900">
                          {log.sentAt ? new Date(log.sentAt).toLocaleDateString('en-IN') : 'Not sent'}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5 font-medium">
                          {log.sentAt ? new Date(log.sentAt).toLocaleTimeString('en-IN') : 'Pending'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {log.status === 'failed' && (
                          <button
                            onClick={() => handleResendEmail(log._id)}
                            className="p-2 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-none transition-colors"
                            title="Resend Email"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Contacts Tab
  const renderContacts = () => {
    // Filter contacts
    const filteredContacts = contacts.filter((contact) => {
      // Search filter
      if (contactSearch) {
        const searchLower = contactSearch.toLowerCase();
        const name = (contact.name || '').toLowerCase();
        const email = (contact.email || '').toLowerCase();
        const subject = (contact.subject || '').toLowerCase();
        const message = (contact.message || '').toLowerCase();

        if (!name.includes(searchLower) && !email.includes(searchLower) &&
          !subject.includes(searchLower) && !message.includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (contactFilterStatus !== 'all' && contact.status !== contactFilterStatus) {
        return false;
      }

      return true;
    });

    const hasActiveFilters = contactSearch || contactFilterStatus !== 'all';

    // Calculate stats
    const totalMessages = contacts.length;
    const newMessages = contacts.filter(c => c.status === 'new').length;
    const readMessages = contacts.filter(c => c.status === 'read').length;
    const repliedMessages = contacts.filter(c => c.status === 'replied').length;

    return (
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="bg-slate-900 border border-slate-850 p-6 text-white rounded-none flex items-center justify-between shadow-md">
          <div>
            <p className="text-gray-400 text-xs">Manage and respond to customer inquiries.</p>
          </div>
          <MessageSquare className="w-10 h-10 text-gray-500" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalMessages}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-lg">
                <MessageSquare className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">New</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{newMessages}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Read</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">{readMessages}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <Eye className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Replied</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{repliedMessages}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, subject, or message..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent w-80"
              />
            </div>

            <select
              value={contactFilterStatus}
              onChange={(e) => setContactFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="replied">Replied</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setContactSearch('');
                  setContactFilterStatus('all');
                }}
                className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => handleServerExport('contacts', 'pdf')}
                className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
              >
                PDF
              </button>
              <button
                onClick={() => handleServerExport('contacts', 'csv')}
                className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded border border-green-200 transition-colors"
              >
                CSV
              </button>
              <button
                onClick={() => handleServerExport('contacts', 'excel')}
                className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
              >
                Excel
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        {hasActiveFilters && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-800">
              Showing <span className="font-semibold">{filteredContacts.length}</span> of <span className="font-semibold">{totalMessages}</span> messages
            </p>
          </div>
        )}

        {/* Contact Messages */}
        {filteredContacts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <div className="bg-gray-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {hasActiveFilters ? 'No messages match your filters' : 'No contact messages found'}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {hasActiveFilters
                  ? 'Try adjusting your search criteria or clear the filters'
                  : 'Contact messages from customers will appear here'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setContactSearch('');
                    setContactFilterStatus('all');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredContacts.map((contact) => (
              <div
                key={contact._id}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-pink-100 p-3 rounded-lg">
                      <MessageSquare className="w-6 h-6 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{contact.subject}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="bg-gradient-to-br from-pink-100 to-rose-100 rounded-full w-8 h-8 flex items-center justify-center">
                          <span className="text-xs font-semibold text-pink-700">
                            {(contact.name || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                          <p className="text-xs text-gray-600">{contact.email}</p>
                        </div>
                      </div>
                      {contact.phone && (
                        <p className="text-xs text-gray-600 mt-1">Phone: {contact.phone}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        Received: {new Date(contact.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={contact.status}
                      onChange={(e) => handleUpdateContactStatus(contact._id, e.target.value)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border-0 cursor-pointer transition-colors ${contact.status === 'new'
                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        : contact.status === 'read'
                          ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                    >
                      <option value="new">New</option>
                      <option value="read">Read</option>
                      <option value="replied">Replied</option>
                    </select>
                    <button
                      onClick={() => handleDeleteContact(contact._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Message"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{contact.message}</p>
                </div>

                <div className="flex justify-end">
                  <a
                    href={`mailto:${contact.email}?subject=Re: ${contact.subject}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <Mail className="w-4 h-4" />
                    Reply via Email
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render Content Management Tab
  const renderContentManagement = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <h2 className="text-2xl font-bold text-gray-900">Content Management</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setContentSubPage('blogs')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2563eb] text-white text-xs font-semibold rounded-lg hover:bg-[#1d4ed8] transition-colors shadow-sm"
          >
            <Edit size={14} /> Blogs
          </button>
          <button
            onClick={() => setContentSubPage('team')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0f8a48] text-white text-xs font-semibold rounded-lg hover:bg-[#0d763e] transition-colors shadow-sm"
          >
            <Users size={14} /> Team
          </button>
          <button
            onClick={() => setContentSubPage('events')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#9333ea] text-white text-xs font-semibold rounded-lg hover:bg-[#7e22ce] transition-colors shadow-sm"
          >
            <Clock size={14} /> Events
          </button>
          <button
            onClick={() => setContentSubPage('reports')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#ea580c] text-white text-xs font-semibold rounded-lg hover:bg-[#c2410c] transition-colors shadow-sm"
          >
            <FileText size={14} /> Reports
          </button>
          <button
            onClick={() => setContentSubPage('pages')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#4f46e5] text-white text-xs font-semibold rounded-lg hover:bg-[#3730a3] transition-colors shadow-sm"
          >
            <FileText size={14} /> Pages
          </button>
          <button
            onClick={() => setContentSubPage('stats')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#dc2626] text-white text-xs font-semibold rounded-lg hover:bg-[#b91c1c] transition-colors shadow-sm"
          >
            <TrendingUp size={14} /> Stats
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Blog Posts */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900">Blog Posts</h3>
              <Edit size={18} className="text-blue-500" />
            </div>
            <p className="text-sm text-gray-500 mb-6">Manage blog articles and publications</p>
          </div>
          <button
            onClick={() => setContentSubPage('blogs')}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
          >
            Manage Blogs
          </button>
        </div>

        {/* Team Members */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900">Team Members</h3>
              <Users size={18} className="text-green-500" />
            </div>
            <p className="text-sm text-gray-500 mb-6">Manage leadership and team profiles</p>
          </div>
          <button
            onClick={() => setContentSubPage('team')}
            className="w-full py-2.5 bg-[#0f8a48] text-white rounded-xl font-semibold text-sm hover:bg-[#0d763e] transition-colors"
          >
            Manage Team
          </button>
        </div>

        {/* Events */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900">Events</h3>
              <Clock size={18} className="text-purple-500" />
            </div>
            <p className="text-sm text-gray-500 mb-6">Manage investor events and webinars</p>
          </div>
          <button
            onClick={() => setContentSubPage('events')}
            className="w-full py-2.5 bg-[#9333ea] text-white rounded-xl font-semibold text-sm hover:bg-[#7e22ce] transition-colors"
          >
            Manage Events
          </button>
        </div>

        {/* Reports */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900">Reports</h3>
              <FileText size={18} className="text-orange-500" />
            </div>
            <p className="text-sm text-gray-500 mb-6">Manage financial and investor reports</p>
          </div>
          <button
            onClick={() => setContentSubPage('reports')}
            className="w-full py-2.5 bg-[#ea580c] text-white rounded-xl font-semibold text-sm hover:bg-[#c2410c] transition-colors"
          >
            Manage Reports
          </button>
        </div>

        {/* Page Content */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900">Page Content</h3>
              <FileText size={18} className="text-indigo-500" />
            </div>
            <p className="text-sm text-gray-500 mb-6">Edit About, Mission, Vision, etc.</p>
          </div>
          <button
            onClick={() => setContentSubPage('pages')}
            className="w-full py-2.5 bg-[#4f46e5] text-white rounded-xl font-semibold text-sm hover:bg-[#3730a3] transition-colors"
          >
            Edit Content
          </button>
        </div>

        {/* Home Stats */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900">Home Stats</h3>
              <TrendingUp size={18} className="text-red-500" />
            </div>
            <p className="text-sm text-gray-500 mb-6">Update homepage statistics</p>
          </div>
          <button
            onClick={() => setContentSubPage('stats')}
            className="w-full py-2.5 bg-[#dc2626] text-white rounded-xl font-semibold text-sm hover:bg-[#b91c1c] transition-colors"
          >
            Update Stats
          </button>
        </div>
      </div>

      <div className="bg-[#eff6ff] border-l-4 border-l-blue-600 border border-blue-100 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={16} />
          <div>
            <h4 className="text-sm font-bold text-blue-900">Content Management System</h4>
            <p className="text-sm text-blue-700 mt-1">
              Use these tools to dynamically manage all website content. Changes will be reflected immediately on the live site.
              All content sections support rich text editing, images, and multimedia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Dropship Shipments Tab
  const renderDropshipOrders = () => {
    const filteredDropshipOrders = dropshipOrders.filter(order => {
      if (!dropshipSearch) return true;
      const term = dropshipSearch.toLowerCase();
      const retailerName = (order.user?.name || order.userId?.name || '').toLowerCase();
      const customerName = order.customerDetails?.name?.toLowerCase() || '';
      const OrderId = (order.orderNumber || order._id).toLowerCase();
      return retailerName.includes(term) || customerName.includes(term) || OrderId.includes(term);
    });

    return (
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-850 p-6 text-white rounded-none flex items-center justify-between shadow-md">
          <div>
            <p className="text-gray-400 text-xs">Manage direct dropshipments from business partners to final customers. Total shipments: {filteredDropshipOrders.length}.</p>
          </div>
          <Package className="w-10 h-10 text-gray-500" />
        </div>

        {/* Filter */}
        <div className="bg-white p-4 rounded-none border border-gray-200">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by retailer, customer, or Order ID..."
              value={dropshipSearch}
              onChange={(e) => setDropshipSearch(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 bg-gray-50 w-80"
            />
          </div>
        </div>

        <div className="bg-white rounded-none border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Retailer</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Items</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Tracking</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Invoice</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDropshipOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-xs text-gray-400 font-bold uppercase tracking-wider">
                      No shipments found
                    </td>
                  </tr>
                ) : (
                  filteredDropshipOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-indigo-600">
                          #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                        </span>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 text-sm">{order.user?.name || order.userId?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500 font-semibold">{order.user?.email || order.userId?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-blue-700 text-sm">{order.customerDetails?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500 font-semibold">{order.customerDetails?.phone}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate max-w-[150px] mt-1" title={order.customerDetails?.address}>
                          {order.customerDetails?.address}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-900 uppercase tracking-wider">
                        {order.products.length} Item{order.products.length !== 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-none border text-[10px] font-bold uppercase tracking-wider ${
                          order.paymentStatus === 'completed' || order.paymentStatus === 'paid'
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : order.paymentStatus === 'pending'
                              ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                              : 'bg-red-50 border-red-200 text-red-800'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {order.deliveryTrackingLink ? (
                          <button
                            onClick={() => handleOpenTrackingModal(order._id, 'order', order.deliveryTrackingLink, order.customerDetails?.email, order.trackingId)}
                            className="text-xs font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 border border-blue-200 transition-colors"
                            title={order.deliveryTrackingLink}
                          >
                            <LinkIcon className="w-3.5 h-3.5" />
                            Edit Link
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenTrackingModal(order._id, 'order', undefined, order.customerDetails?.email, order.trackingId)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-none border border-gray-200 text-[10px] font-bold uppercase tracking-wider transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Link
                          </button>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {order.customerInvoiceUrl ? (
                          <a
                            href={order.customerInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 border border-blue-200 transition-colors"
                          >
                            <FileText size={14} />
                            Invoice PDF
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Not generated</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedDropshipOrder(order);
                              setShowDropshipModal(true);
                            }}
                            className="bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1"
                          >
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Settings State
  const [settings, setSettings] = useState({
    taxPercentage: 18,
    shippingCharge: 0,
    minOrderValue: 0
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Load Settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await api.get('/api/settings');
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const updateSetting = async (key: string, value: number) => {
    try {
      setSettingsLoading(true);
      await api.put(`/api/settings/${key}`, { value });
      setSettings({ ...settings, [key]: value });
      alert('Setting updated successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update setting');
    } finally {
      setSettingsLoading(false);
    }
  };

  const renderSettings = () => {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-850 p-6 text-white rounded-none flex items-center justify-between shadow-md">
          <div>
            <p className="text-gray-400 text-xs mt-1">Configure global parameters, pricing adjustments, tax levels, and system parameters.</p>
          </div>
          <SettingsIcon className="w-10 h-10 text-gray-500" />
        </div>

        <div className="grid gap-4">
          {/* Tax Percentage */}
          <div className="bg-white rounded-none border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Tax Percentage</h3>
                <p className="text-xs text-gray-400 font-semibold uppercase mt-0.5">GST/Tax percentage applied to orders</p>
              </div>
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settings.taxPercentage}
                onChange={(e) => setSettings({ ...settings, taxPercentage: parseFloat(e.target.value) || 0 })}
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-none text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-gray-500 font-bold">%</span>
              <button
                onClick={() => updateSetting('taxPercentage', settings.taxPercentage)}
                disabled={settingsLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-none font-bold uppercase tracking-wider text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {settingsLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Shipping Charge */}
          <div className="bg-white rounded-none border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Shipping Charge</h3>
                <p className="text-xs text-gray-400 font-semibold uppercase mt-0.5">Default shipping charge for orders</p>
              </div>
              <Truck className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-500 font-bold">₹</span>
              <input
                type="number"
                min="0"
                step="1"
                value={settings.shippingCharge}
                onChange={(e) => setSettings({ ...settings, shippingCharge: parseFloat(e.target.value) || 0 })}
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-none text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <button
                onClick={() => updateSetting('shippingCharge', settings.shippingCharge)}
                disabled={settingsLoading}
                className="px-6 py-2 bg-green-600 text-white rounded-none font-bold uppercase tracking-wider text-xs hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {settingsLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Minimum Order Value */}
          <div className="bg-white rounded-none border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Minimum Order Value</h3>
                <p className="text-xs text-gray-400 font-semibold uppercase mt-0.5">Minimum order value required for checkout</p>
              </div>
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-500 font-bold">₹</span>
              <input
                type="number"
                min="0"
                step="1"
                value={settings.minOrderValue}
                onChange={(e) => setSettings({ ...settings, minOrderValue: parseFloat(e.target.value) || 0 })}
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-none text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <button
                onClick={() => updateSetting('minOrderValue', settings.minOrderValue)}
                disabled={settingsLoading}
                className="px-6 py-2 bg-purple-600 text-white rounded-none font-bold uppercase tracking-wider text-xs hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {settingsLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', pageName: 'Dashboard Overview', icon: BarChart3 },
    { id: 'products', name: 'Products', pageName: 'Product Catalog', icon: Package },
    { id: 'users', name: 'Users', pageName: 'User Management', icon: Users },
    { id: 'retailers', name: 'Retailers', pageName: 'Retailer Management', icon: Store },
    { id: 'quotes', name: 'Quotes', pageName: 'Quote Management', icon: FileText },
    { id: 'orders', name: 'Orders', pageName: 'Order Management', icon: ShoppingCart },
    { id: 'shipments', name: 'Retailer-Customer Shipments', pageName: 'Retailer Shipments', icon: Package },
    { id: 'warranties', name: 'Warranties', pageName: 'Warranty Management', icon: Shield },
    { id: 'investors', name: 'Investor Documents', pageName: 'Investor Documents', icon: FileText },
    { id: 'messages', name: 'Messages', pageName: 'Contact Messages', icon: MessageSquare },
    { id: 'content', name: 'Content', pageName: 'Content Management', icon: Edit },
    { id: 'emails', name: 'Email Logs', pageName: 'Email Logs', icon: Mail },
    { id: 'logs', name: 'Activity Logs', pageName: 'Activity Logs', icon: ClipboardList },
    { id: 'settings', name: 'Settings', pageName: 'System Settings', icon: SettingsIcon },
  ];
  // Render Dropship Order Details Modal
  const renderDropshipOrderDetails = () => {
    if (!selectedDropshipOrder) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowDropshipModal(false)}></div>
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
            {/* Header */}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl leading-6 font-bold text-gray-900" id="modal-title">
                  Dropship Order Details
                </h3>
                <button
                  onClick={() => setShowDropshipModal(false)}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <span className="sr-only">Close</span>
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="px-4 py-5 sm:p-6 space-y-6">
              {/* Top Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Order ID</p>
                  <p className="font-mono text-sm font-bold text-gray-900 mt-1">
                    {selectedDropshipOrder.orderNumber || selectedDropshipOrder._id}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Date</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {new Date(selectedDropshipOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Payment Status</p>
                  <span className={`inline-flex mt-1 px-2 py-1 rounded-full text-xs font-bold ${selectedDropshipOrder.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                    selectedDropshipOrder.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                    {selectedDropshipOrder.paymentStatus.toUpperCase()}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Invoice</p>
                  {selectedDropshipOrder.customerInvoiceUrl ? (
                    <a
                      href={selectedDropshipOrder.customerInvoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <FileText size={14} />
                      View PDF
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400 mt-1 block">Not Generated</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Parties */}
                <div className="space-y-6">
                  {/* Retailer Info */}
                  <div className="bg-white border text-sm rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-purple-50 px-4 py-3 border-b flex items-center justify-between">
                      <h4 className="font-semibold text-purple-900 flex items-center gap-2">
                        <Store className="w-4 h-4" /> Retailer (Seller)
                      </h4>
                    </div>
                    <div className="p-4 space-y-2">
                      <div>
                        <span className="text-gray-500 block text-xs uppercase tracking-wide">Name</span>
                        <span className="font-medium text-gray-900">{selectedDropshipOrder.user?.name || selectedDropshipOrder.userId?.name || 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-xs uppercase tracking-wide">Email</span>
                        <span className="text-gray-900">{selectedDropshipOrder.user?.email || selectedDropshipOrder.userId?.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-white border text-sm rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-indigo-50 px-4 py-3 border-b flex items-center justify-between">
                      <h4 className="font-semibold text-indigo-900 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Customer (Buyer)
                      </h4>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <span className="text-gray-500 block text-xs uppercase tracking-wide">Name</span>
                        <span className="font-medium text-gray-900">{selectedDropshipOrder.customerDetails?.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-xs uppercase tracking-wide">Phone</span>
                        <span className="text-gray-900">{selectedDropshipOrder.customerDetails?.phone}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-xs uppercase tracking-wide">Email</span>
                        <span className="text-gray-900">{selectedDropshipOrder.customerDetails?.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-xs uppercase tracking-wide">Shipping Address</span>
                        <span className="text-gray-700 whitespace-pre-line">{selectedDropshipOrder.customerDetails?.address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Products & Actions */}
                <div className="space-y-6">
                  <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Package className="w-4 h-4" /> Shipments Items
                      </h4>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {selectedDropshipOrder.products.map((item, idx) => (
                        <div key={idx} className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-gray-900">{item.product?.name || item.productId?.name || 'Unknown Product'}</p>
                              {item.product?.modelNumberPrefix && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Model: <span className="font-mono text-gray-700">{item.product.modelNumberPrefix}</span>
                                </p>
                              )}
                            </div>
                            <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">
                              x{item.quantity}
                            </span>
                          </div>

                          {(item.serialNumbers && item.serialNumbers.length > 0) ? (
                            <div className="mt-2 text-xs">
                              <span className="text-gray-500 font-medium">Serial Numbers:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.serialNumbers.map((sn, sidx) => (
                                  <span key={sidx} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 font-mono">
                                    {sn}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-orange-500 italic mt-1">No serial numbers assigned</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tracking Link Management */}
                  <div className="bg-white border rounded-xl p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-blue-600" /> Tracking Information
                    </h4>

                    {selectedDropshipOrder.deliveryTrackingLink ? (
                      <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 break-all">
                            <span className="text-xs text-blue-600 uppercase font-bold block mb-1">Current Link</span>
                            <a
                              href={selectedDropshipOrder.deliveryTrackingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-800 hover:underline block mb-2"
                            >
                              {selectedDropshipOrder.deliveryTrackingLink}
                            </a>

                            <button
                              onClick={() => {
                                setShowDropshipModal(false);
                                handleOpenTrackingModal(
                                  selectedDropshipOrder._id,
                                  'order',
                                  selectedDropshipOrder.deliveryTrackingLink,
                                  selectedDropshipOrder.customerDetails?.email,
                                  selectedDropshipOrder.trackingId
                                );
                              }}
                              className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 text-sm font-medium"
                            >
                              <LinkIcon className="w-3 h-3" />
                              Edit Link
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4">
                        <button
                          onClick={() => {
                            setShowDropshipModal(false);
                            handleOpenTrackingModal(
                              selectedDropshipOrder._id,
                              'order',
                              undefined,
                              selectedDropshipOrder.customerDetails?.email,
                              selectedDropshipOrder.trackingId
                            );
                          }}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition-colors font-medium border border-gray-200"
                        >
                          <Plus className="w-4 h-4" />
                          Add Link
                        </button>
                      </div>
                    )}

                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
                      <Mail className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-amber-800 font-bold uppercase tracking-wide mb-1">
                          Email Notification Recipient
                        </p>
                        <p className="text-sm font-bold text-gray-900 break-all">
                          {selectedDropshipOrder.customerDetails?.email}
                        </p>
                        <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                          The customer will automatically receive an email update when you save the tracking link.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Management Actions */}
                  <div className="bg-white border rounded-xl p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Update Payment Status</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={async () => {
                          if (window.confirm('Mark this order as PAID (Completed)?')) {
                            await handleUpdatePaymentStatus(selectedDropshipOrder._id, 'completed');
                            setShowDropshipModal(false);
                            loadDropshipOrders();
                          }
                        }}
                        disabled={selectedDropshipOrder.paymentStatus === 'completed'}
                        className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors ${selectedDropshipOrder.paymentStatus === 'completed'
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                      >
                        <CheckCircle className="w-4 h-4" /> Mark Paid
                      </button>

                      <button
                        onClick={async () => {
                          if (window.confirm('Mark this order as PENDING?')) {
                            await handleUpdatePaymentStatus(selectedDropshipOrder._id, 'pending');
                            setShowDropshipModal(false);
                            loadDropshipOrders();
                          }
                        }}
                        disabled={selectedDropshipOrder.paymentStatus === 'pending'}
                        className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors ${selectedDropshipOrder.paymentStatus === 'pending'
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-yellow-500 text-white hover:bg-yellow-600'
                          }`}
                      >
                        <Clock className="w-4 h-4" /> Mark Pending
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-100">
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => setShowDropshipModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* --- DESKTOP COLLAPSIBLE LEFT SIDEBAR --- */}
      <aside className={`bg-slate-900 text-slate-300 flex-shrink-0 transition-all duration-300 border-r border-slate-800 hidden lg:flex flex-col sticky top-20 h-[calc(100vh-80px)] ${
        sidebarCollapsed ? 'w-[78px]' : 'w-[280px]'
      }`}>
        {/* Brand Header */}
        <div className="h-[70px] border-b border-slate-800 flex items-center justify-between px-4">
          {!sidebarCollapsed ? (
            <div className="flex items-center flex-1 mr-4">
              <div className="bg-white rounded-lg p-2 w-full flex justify-center items-center">
                <img
                  src="https://aishwaryatechtele.com/images/telogica_logo.png"
                  alt="Telogica Logo"
                  className="h-10 w-auto max-w-full"
                />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-1 mx-auto">
              <img
                src="https://aishwaryatechtele.com/images/telogica_logo.png"
                alt="Telogica Logo"
                className="h-6 w-auto"
              />
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            // Retrieve quick indicators / counts
            let count = 0;
            if (tab.id === 'messages') {
              count = contacts.filter(c => c.status === 'new').length;
            } else if (tab.id === 'retailers') {
              count = users.filter(u => u.role === 'retailer' && !u.isApproved).length;
            } else if (tab.id === 'warranties') {
              count = warranties.filter(w => w.status === 'pending').length;
            } else if (tab.id === 'quotes') {
              count = quotes.filter(q => q.status === 'pending').length;
            }

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center rounded-xl transition-all duration-150 py-3 ${
                  sidebarCollapsed ? 'justify-center px-0' : 'px-4'
                } ${
                  active
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/10 font-bold'
                    : 'hover:bg-slate-800/60 hover:text-white text-slate-400'
                }`}
                title={tab.name}
              >
                <Icon size={18} className={active ? 'text-white' : 'text-slate-400'} />
                {!sidebarCollapsed && (
                  <>
                    <span className="ml-3 text-sm truncate flex-1 text-left">{tab.name}</span>
                    {count > 0 && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        active ? 'bg-white text-emerald-700' : 'bg-red-500 text-white'
                      }`}>
                        {count}
                      </span>
                    )}
                  </>
                )}
                {sidebarCollapsed && count > 0 && (
                  <span className="absolute ml-6 mb-4 w-2 h-2 rounded-full bg-red-500 ring-2 ring-slate-900"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Profile Card & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          {!sidebarCollapsed ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600/15 text-emerald-500 rounded-xl p-2 font-bold w-10 h-10 flex items-center justify-center border border-emerald-500/20">
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-bold text-xs uppercase tracking-wider truncate">{user?.name || 'Admin User'}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 rounded-xl font-bold transition-all text-xs uppercase tracking-wider"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-10 h-10 mx-auto flex items-center justify-center bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 rounded-xl transition-all"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* --- MOBILE SIDEBAR NAVIGATION --- */}
      <div className="lg:hidden sticky top-0 z-50 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 h-[60px] w-full">
        <div className="flex items-center gap-2">
          <div className="bg-white rounded-lg p-1 flex-shrink-0">
            <img
              src="https://aishwaryatechtele.com/images/telogica_logo.png"
              alt="Telogica Logo"
              className="h-6 w-auto"
            />
          </div>
          <span className="font-extrabold text-sm text-white uppercase tracking-wider">Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadDashboardData()}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <Menu size={22} />
          </button>
        </div>

        {/* Mobile Dropdown Panel */}
        {mobileSidebarOpen && (
          <div className="absolute top-[60px] left-0 w-full bg-slate-950 border-b border-slate-800 shadow-2xl p-4 space-y-1 max-h-[75vh] overflow-y-auto z-50 animate-in slide-in-from-top duration-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${
                    active
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  <span className="ml-3 text-sm">{tab.name}</span>
                </button>
              );
            })}
            <div className="border-t border-slate-800 pt-3 mt-3 flex justify-between items-center px-4">
              <div className="text-left min-w-0 flex-1 mr-2">
                <p className="text-white font-semibold text-xs truncate">{user?.name}</p>
                <p className="text-slate-500 text-[10px] truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600 hover:text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- MAIN ANALYTICAL VIEWPORT --- */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top Header Bar on Desktop */}
        <header className="h-[70px] bg-white border-b border-slate-200 px-8 items-center justify-between hidden lg:flex sticky top-20 z-30">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider font-sans">
              {tabs.find(t => t.id === activeTab)?.pageName || tabs.find(t => t.id === activeTab)?.name || 'Admin'}
            </h2>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          <div className="flex items-center gap-6">
            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {/* Refresh button */}
              <button
                onClick={loadDashboardData}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200"
                title="Sync Dashboard Data"
              >
                <RefreshCw size={18} />
              </button>

              {/* Notification Button */}
              <div className="relative">
                <button
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200"
                  title="Notifications"
                >
                  <Bell size={18} />
                  {contacts.filter(c => c.status === 'new').length > 0 && (
                    <span className="absolute top-1.5 right-1.5 bg-red-500 w-2.5 h-2.5 rounded-full ring-2 ring-white"></span>
                  )}
                </button>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-200"></div>

            {/* Profile Avatar info */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800 leading-none">{user?.name || 'Administrator'}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Control Center</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white font-bold flex items-center justify-center shadow-md">
                {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
              </div>
            </div>
          </div>
        </header>

        {/* Viewport Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-xl">
              <div className="flex items-start">
                <AlertCircle className="text-red-500 mt-1 flex-shrink-0" size={24} />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">
                    Error Loading Dashboard
                  </h3>
                  <p className="text-red-700 mb-4">{error}</p>
                  <button
                    onClick={() => {
                      setError(null);
                      loadDashboardData();
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw size={16} />
                    Retry Loading
                  </button>
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'products' && renderProducts()}
              {activeTab === 'users' && renderUsers()}
              {activeTab === 'retailers' && (
                <RetailerManagement isEmbedded={true} />
              )}
              {activeTab === 'quotes' && renderQuotes()}
              {activeTab === 'orders' && renderOrders()}
              {activeTab === 'shipments' && renderDropshipOrders()}
              {activeTab === 'warranties' && renderWarranties()}
              {activeTab === 'investors' && renderInvestorDocuments()}
              {activeTab === 'messages' && renderContacts()}
              {activeTab === 'content' && (
                contentSubPage === 'blogs' ? (
                  <BlogManagement isEmbedded={true} onBack={() => setContentSubPage(null)} />
                ) : contentSubPage === 'team' ? (
                  <TeamManagement isEmbedded={true} onBack={() => setContentSubPage(null)} />
                ) : contentSubPage === 'events' ? (
                  <EventManagement isEmbedded={true} onBack={() => setContentSubPage(null)} />
                ) : contentSubPage === 'reports' ? (
                  <ReportManagement isEmbedded={true} onBack={() => setContentSubPage(null)} />
                ) : contentSubPage === 'pages' ? (
                  <PageContent isEmbedded={true} onBack={() => setContentSubPage(null)} />
                ) : contentSubPage === 'stats' ? (
                  <StatsManagement isEmbedded={true} onBack={() => setContentSubPage(null)} />
                ) : (
                  renderContentManagement()
                )
              )}
              {activeTab === 'emails' && renderEmailLogs()}
              {activeTab === 'logs' && <AdminLogs />}
              {activeTab === 'settings' && renderSettings()}
            </>
          )}
        </div>
      </main>

      {/* Product Units Modal */}
      {showUnitsModal && selectedProductForUnits && (
        <ProductUnitManager
          productId={selectedProductForUnits._id}
          productName={selectedProductForUnits.name}
          onClose={() => {
            setShowUnitsModal(false);
            setSelectedProductForUnits(null);
            loadProducts(); // Refresh stock counts
          }}
        />
      )}
      {showDropshipModal && renderDropshipOrderDetails()}

      {/* Order Details Modal */}
      {showOrderDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-gray-200">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 text-gray-400" />
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider">Order Details</h2>
                  <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mt-0.5">Order #{selectedOrder.orderNumber || selectedOrder._id.slice(-8)}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowOrderDetailsModal(false);
                  setSelectedOrder(null);
                }}
                className="text-gray-400 hover:text-white p-1 rounded-none transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Customer Information */}
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 mb-6 border border-emerald-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  Customer Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Name</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedOrder.userId?.name || selectedOrder.user?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</p>
                    <p className="text-sm text-gray-900">{selectedOrder.userId?.email || selectedOrder.user?.email || 'N/A'}</p>
                  </div>
                  {selectedOrder.customerDetails?.phone && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Phone</p>
                      <p className="text-sm text-gray-900">{selectedOrder.customerDetails.phone}</p>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Role</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${selectedOrder.customerDetails?.role === 'retailer'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                      {selectedOrder.customerDetails?.role?.toUpperCase() || 'USER'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  Shipping Address
                </h3>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-base text-gray-900 whitespace-pre-line leading-relaxed">
                    {selectedOrder.isDropship
                      ? (selectedOrder.customerDetails?.address || 'No shipping address provided')
                      : (selectedOrder.shippingAddress || 'No shipping address provided')
                    }
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      const address = selectedOrder.isDropship
                        ? selectedOrder.customerDetails?.address
                        : selectedOrder.shippingAddress;
                      navigator.clipboard.writeText(address || '');
                      alert('Address copied to clipboard!');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Address
                  </button>
                  {(selectedOrder.shippingAddress || selectedOrder.customerDetails?.address) && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        selectedOrder.isDropship
                          ? (selectedOrder.customerDetails?.address || '')
                          : (selectedOrder.shippingAddress || '')
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold flex items-center gap-2"
                    >
                      View on Google Maps
                    </a>
                  )}
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Payment Status</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${selectedOrder.paymentStatus === 'completed' || selectedOrder.paymentStatus === 'paid'
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : selectedOrder.paymentStatus === 'failed'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      }`}>
                      {selectedOrder.paymentStatus?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-emerald-600">₹{selectedOrder.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Products List */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-gray-600" />
                    Products ({selectedOrder.products.length})
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {selectedOrder.products.map((item, index) => {
                      const product = item.productId || (item as any).product;
                      return (
                        <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg p-3">
                              <Package className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{product?.name || 'Unknown Product'}</p>
                              <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                              {item.serialNumbers && item.serialNumbers.length > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Serial Numbers: {item.serialNumbers.join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Price</p>
                            <p className="text-lg font-bold text-gray-900">₹{item.price?.toLocaleString() || 'N/A'}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Dropship Information (if applicable) */}
              {selectedOrder.isDropship && selectedOrder.customerDetails && (
                <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-600" />
                    Dropship Customer Details
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Customer Name</p>
                      <p className="text-sm text-gray-900">{selectedOrder.customerDetails.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Customer Email</p>
                      <p className="text-sm text-gray-900">{selectedOrder.customerDetails.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Customer Phone</p>
                      <p className="text-sm text-gray-900">{selectedOrder.customerDetails.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Delivery Address</p>
                      <p className="text-sm text-gray-900">{selectedOrder.customerDetails.address}</p>
                    </div>
                  </div>
                  {selectedOrder.customerInvoiceUrl && (
                    <div className="mt-4">
                      <button
                        onClick={() => window.open(selectedOrder.customerInvoiceUrl, '_blank')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                      >
                        <FileText className="w-4 h-4" />
                        View Customer Invoice
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Delivery Tracking Link Section */}
              {selectedOrder.deliveryTrackingLink && (
                <div className="bg-green-50 rounded-xl border border-green-200 p-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 text-green-600" />
                    Delivery Tracking
                  </h3>
                  <div className="flex items-center gap-3">
                    <a
                      href={selectedOrder.deliveryTrackingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-blue-600 hover:text-blue-800 hover:underline font-medium break-all"
                    >
                      {selectedOrder.deliveryTrackingLink}
                    </a>
                    <button
                      onClick={() => handleOpenTrackingModal(selectedOrder._id, 'order', selectedOrder.deliveryTrackingLink, undefined, selectedOrder.trackingId)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Update
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                {!selectedOrder.deliveryTrackingLink && (
                  <button
                    onClick={() => {
                      setShowOrderDetailsModal(false);
                      handleOpenTrackingModal(selectedOrder._id, 'order', selectedOrder.deliveryTrackingLink, undefined, selectedOrder.trackingId);
                    }}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <LinkIcon className="w-5 h-5" />
                    Add Tracking Link
                  </button>
                )}
                <button
                  onClick={() => handleUpdatePaymentStatus(selectedOrder._id,
                    selectedOrder.paymentStatus === 'pending' ? 'completed' : 'pending'
                  )}
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Mark as {selectedOrder.paymentStatus === 'pending' ? 'Completed' : 'Pending'}
                </button>
                <button
                  onClick={() => {
                    setShowOrderDetailsModal(false);
                    setSelectedOrder(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User 360 View Modal */}
      {showUser360Modal && selectedUser360 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${selectedUser360.role === 'admin' ? 'bg-purple-500' :
                  selectedUser360.role === 'retailer' ? 'bg-blue-500' : 'bg-gray-400'
                  }`}>
                  {selectedUser360.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">360° User View</h2>
                  <p className="text-indigo-100 text-sm">{selectedUser360.name} • {selectedUser360.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportUser360(selectedUser360._id, selectedUser360.name)}
                  className="bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-2 font-semibold"
                >
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
                <button
                  onClick={() => {
                    setShowUser360Modal(false);
                    setSelectedUser360(null);
                    setUser360Data({ orders: [], quotes: [], warranties: [], inventory: [] });
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* User Info Card */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 mb-6 border border-indigo-200">
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">User ID</p>
                    <p className="text-sm font-mono text-gray-900">{selectedUser360._id.slice(-8)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Role</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${selectedUser360.role === 'admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                      selectedUser360.role === 'retailer' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                      {selectedUser360.role.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Status</p>
                    {selectedUser360.role === 'retailer' && !selectedUser360.isApproved ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                        PENDING APPROVAL
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Member Since</p>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedUser360.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{user360Data.orders.length}</p>
                    </div>
                    <div className="bg-emerald-100 p-3 rounded-lg">
                      <ShoppingCart className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quote Requests</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{user360Data.quotes.length}</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Warranties</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{user360Data.warranties.length}</p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <Shield className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>

                {selectedUser360.role === 'retailer' && (
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Inventory Items</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{user360Data.inventory.length}</p>
                      </div>
                      <div className="bg-teal-100 p-3 rounded-lg">
                        <Package className="w-6 h-6 text-teal-600" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Data Sections */}
              <div className="space-y-6">
                {/* Orders Section */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Orders ({user360Data.orders.length})</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    {user360Data.orders.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No orders found</p>
                    ) : (
                      <div className="space-y-3">
                        {user360Data.orders.map((order) => (
                          <div key={order._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-900">Order #{order.orderNumber || order._id.slice(-8)}</span>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.paymentStatus === 'completed' || order.paymentStatus === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {order.paymentStatus}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">
                                {order.products.length} item(s) • {new Date(order.createdAt).toLocaleDateString()}
                              </span>
                              <span className="font-bold text-gray-900">₹{order.totalAmount.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quotes Section */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Quote Requests ({user360Data.quotes.length})</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    {user360Data.quotes.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No quote requests found</p>
                    ) : (
                      <div className="space-y-3">
                        {user360Data.quotes.map((quote) => (
                          <div key={quote._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-900">Quote #{quote._id.slice(-8)}</span>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${quote.status === 'responded' ? 'bg-green-100 text-green-800' :
                                quote.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                {quote.status}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {quote.products.length} product(s) requested
                              {quote.createdAt && ` • ${new Date(quote.createdAt).toLocaleDateString()}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Warranties Section */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-purple-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Warranties ({user360Data.warranties.length})</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    {user360Data.warranties.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No warranties registered</p>
                    ) : (
                      <div className="space-y-3">
                        {user360Data.warranties.map((warranty: any) => (
                          <div key={warranty._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-900">{warranty.productName}</span>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${warranty.status === 'approved' ? 'bg-green-100 text-green-800' :
                                warranty.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                {warranty.status}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              S/N: {warranty.serialNumber} • Model: {warranty.modelNumber}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Inventory Section (Retailers Only) */}
                {selectedUser360.role === 'retailer' && (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-teal-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Inventory ({user360Data.inventory.length})</h3>
                      </div>
                    </div>
                    <div className="p-6">
                      {user360Data.inventory.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No inventory items found</p>
                      ) : (
                        <div className="space-y-3">
                          {user360Data.inventory.map((item: any) => (
                            <div key={item._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-gray-900">{item.product?.name || 'Product'}</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${item.status === 'in_stock' ? 'bg-green-100 text-green-800' :
                                  item.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                  {item.status}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">
                                Purchase Date: {new Date(item.purchaseDate).toLocaleDateString()}
                                {item.soldDate && ` • Sold: ${new Date(item.soldDate).toLocaleDateString()}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Link Modal */}
      {showTrackingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <LinkIcon className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">
                    {trackingLinkInput ? 'Update' : 'Add'} Delivery Tracking Link
                  </h2>
                  <p className="text-blue-100 text-sm">
                    {trackingType === 'order' ? 'Order' : 'Quote'} Tracking
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTrackingModal(false);
                  setTrackingLinkInput('');
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tracking Link URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={trackingLinkInput}
                    onChange={(e) => setTrackingLinkInput(e.target.value)}
                    placeholder="https://example.com/track/ABC123"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <LinkIcon className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Enter the complete URL where customers can track their delivery
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tracking ID / Reference Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={trackingIdInput}
                    onChange={(e) => setTrackingIdInput(e.target.value)}
                    placeholder="TRK123456789 or REF-ABC-123"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                  />
                  <Package className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Provide a tracking ID or reference number for the customer to use with the courier
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-blue-800 font-bold uppercase tracking-wide mb-1">
                      Email Notification Recipient
                    </p>
                    {trackingEmail ? (
                      <p className="text-sm font-bold text-gray-900 break-all mb-1">
                        {trackingEmail}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 italic mb-1">
                        Standard Customer Contact
                      </p>
                    )}
                    <p className="text-xs text-blue-700 leading-relaxed">
                      The customer will receive an email with the tracking link automatically after you save it.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleUpdateTrackingLink}
                  disabled={!trackingLinkInput.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  <Send className="w-5 h-5" />
                  Save & Send to Customer
                </button>
                <button
                  onClick={() => {
                    setShowTrackingModal(false);
                    setTrackingLinkInput('');
                  }}
                  className="px-6 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={confirmDeleteProduct}
        title="Delete product?"
        message={productToDelete ? `This will permanently delete "${productToDelete.name}". This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive
      />

      <ConfirmationModal
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedProductIds.length} product${selectedProductIds.length === 1 ? '' : 's'}?`}
        message="This will permanently delete the selected products. This action cannot be undone."
        confirmText="Delete all"
        cancelText="Cancel"
        isDestructive
      />

      {productToEdit && (
        <ProductEditor
          product={productToEdit as any}
          products={products as any}
          onClose={() => setProductToEdit(null)}
          onUpdated={() => {
            loadProducts();
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
