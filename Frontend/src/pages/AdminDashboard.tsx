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
  Settings as SettingsIcon
} from 'lucide-react';
import RetailerManagement from './admin/RetailerManagement';
import AdminLogs from './admin/AdminLogs';
import ProductSelector from '../components/AdminDashboard/ProductSelector';
import CategoryInput from '../components/AdminDashboard/CategoryInput';
import WarrantyValidator from '../components/AdminDashboard/WarrantyValidator';
import ProductUnitManager from '../components/AdminDashboard/ProductUnitManager';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Constants
  const MAX_PRODUCT_IMAGES = 4;

  // State for different sections
  const [analytics, setAnalytics] = useState<Analytics>(getDefaultAnalytics());
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

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

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/api/products/${productId}`);
      alert('Product deleted successfully');
      loadProducts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleEditProduct = (product: Product) => {
    navigate(`/admin/edit-product/${product._id}`);
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

  // Order Creation (address validation)
  const handleCreateOrder = async (orderData: any) => {
    // Validate delivery address
    if (!orderData.customerDetails || !orderData.customerDetails.address || !orderData.customerDetails.address.trim()) {
      alert('Please provide a valid delivery address before proceeding with the order.');
      return;
    }
    // ...existing order creation logic...
    try {
      await api.post('/api/orders', orderData);
      alert('Order created successfully');
      loadOrders();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create order');
    }
  };

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
  };

  // Render Dashboard/Analytics Tab
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

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
    const USER_COLORS = ['#3B82F6', '#10B981']; // Blue for Direct, Green for Quote
    const RETAILER_COLORS = ['#10B981']; // Green for Quote only

    // orderStatusData is now computed at the top level

    const recentOrders = orders.slice(0, 5);
    const recentQuotes = quotes.slice(0, 5);

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Dashboard Overview</h2>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 relative overflow-hidden group">
            <div className="absolute right-0 top-0 h-full w-1 bg-blue-500 group-hover:w-2 transition-all duration-200"></div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Sales</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{formatCurrency(analytics.sales.total)}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <span className="text-green-500 flex items-center font-medium mr-2">
                <TrendingUp className="w-4 h-4 mr-1" /> +12%
              </span>
              <span>from last month</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 relative overflow-hidden group">
            <div className="absolute right-0 top-0 h-full w-1 bg-green-500 group-hover:w-2 transition-all duration-200"></div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Orders</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{formatNumber(analytics.orders.total)}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full text-green-600">
                <ShoppingCart className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <span className="text-green-500 flex items-center font-medium mr-2">
                <TrendingUp className="w-4 h-4 mr-1" /> +5%
              </span>
              <span>new orders today</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 relative overflow-hidden group">
            <div className="absolute right-0 top-0 h-full w-1 bg-yellow-500 group-hover:w-2 transition-all duration-200"></div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Pending Quotes</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{formatNumber(analytics.quotes.pending)}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-full text-yellow-600">
                <FileText className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <span className="text-yellow-600 font-medium mr-2">
                {conversionRate}%
              </span>
              <span>conversion rate</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 relative overflow-hidden group">
            <div className="absolute right-0 top-0 h-full w-1 bg-purple-500 group-hover:w-2 transition-all duration-200"></div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Users</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{formatNumber(analytics.users.total)}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-full text-purple-600">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <span className="text-purple-600 font-medium mr-2">
                {analytics.users.pendingRetailers}
              </span>
              <span>pending retailers</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Sales Distribution */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Premium Header with Gradient */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                      <ShoppingCart className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">User Sales Distribution</h3>
                  </div>
                  <p className="text-blue-100 text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Regular Customers
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="bg-green-400 text-green-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                    <div className="w-2 h-2 bg-green-900 rounded-full animate-pulse"></div>
                    LIVE
                  </div>
                  <div className="text-white/80 text-xs">Real-time data</div>
                </div>
              </div>
            </div>

            {/* Premium Sales Type Breakdown */}
            <div className="p-6 space-y-4">
              {/* Direct Orders Card */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
                <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-5 hover:shadow-xl transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                        <ShoppingCart className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-700 uppercase tracking-wider">Direct Orders</p>
                        <p className="text-xs text-blue-600 mt-0.5">Instant purchase transactions</p>
                      </div>
                    </div>
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-4xl font-black text-blue-900">{formatCurrency(analytics.sales.direct)}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="px-2.5 py-1 bg-blue-200 text-blue-800 rounded-lg font-bold">
                          {analytics.orders.direct}
                        </div>
                        <span className="text-blue-700 font-medium">{analytics.orders.direct === 1 ? 'order' : 'orders'}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-blue-600 font-medium">Avg Value</p>
                        <p className="text-sm font-bold text-blue-800">
                          {analytics.orders.direct > 0 ? formatCurrency(analytics.sales.direct / analytics.orders.direct) : '₹0'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quote Sales Card */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
                <div className="relative bg-gradient-to-br from-emerald-50 to-green-100 border-2 border-emerald-200 rounded-2xl p-5 hover:shadow-xl transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-500 rounded-xl shadow-lg">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wider">Quote Sales</p>
                        <p className="text-xs text-emerald-600 mt-0.5">Approved quotation orders</p>
                      </div>
                    </div>
                    <BarChart3 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-4xl font-black text-emerald-900">{formatCurrency(analytics.sales.quote)}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="px-2.5 py-1 bg-emerald-200 text-emerald-800 rounded-lg font-bold">
                          {analytics.orders.quote}
                        </div>
                        <span className="text-emerald-700 font-medium">{analytics.orders.quote === 1 ? 'order' : 'orders'}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-emerald-600 font-medium">Avg Value</p>
                        <p className="text-sm font-bold text-emerald-800">
                          {analytics.orders.quote > 0 ? formatCurrency(analytics.sales.quote / analytics.orders.quote) : '₹0'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Chart Section */}
            <div className="px-6 pb-4">
              {userSalesData[0].value > 0 || userSalesData[1].value > 0 ? (
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-4 border border-gray-200 shadow-inner">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={userSalesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        fill="#8884d8"
                        paddingAngle={8}
                        dataKey="value"
                        label={(entry) => {
                          const total = analytics.sales.direct + analytics.sales.quote;
                          const percent = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0.0';
                          return `${percent}%`;
                        }}
                        labelLine={{ stroke: '#64748b', strokeWidth: 2 }}
                      >
                        {userSalesData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={USER_COLORS[index]} stroke="#fff" strokeWidth={3} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.98)',
                          borderRadius: '12px',
                          border: '2px solid #3b82f6',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                          padding: '12px'
                        }}
                        labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={40}
                        iconType="circle"
                        wrapperStyle={{ paddingTop: '16px', fontWeight: '600' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="p-4 bg-gray-200 rounded-full inline-flex mb-3">
                      <ShoppingCart className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-semibold">No user sales data yet</p>
                    <p className="text-gray-500 text-sm mt-1">Data will appear when orders are placed</p>
                  </div>
                </div>
              )}
            </div>

            {/* Premium Summary Footer */}
            <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 border-t-2 border-blue-200">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-xl p-4 shadow-lg border-l-4 border-blue-500 hover:scale-105 transition-transform">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Total Sales</p>
                    <DollarSign className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-3xl font-black text-blue-600">{formatCurrency(analytics.sales.byUserType.user)}</p>
                  <p className="text-xs text-gray-600 mt-1">Revenue generated</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-lg border-l-4 border-indigo-500 hover:scale-105 transition-transform">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Total Orders</p>
                    <Package className="w-4 h-4 text-indigo-500" />
                  </div>
                  <p className="text-3xl font-black text-gray-800">{formatNumber(analytics.orders.byUserType.user)}</p>
                  <p className="text-xs text-gray-600 mt-1">Completed transactions</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl p-4 border border-blue-300 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Info className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-700 font-semibold">Sales Insight</p>
                      <p className="text-xs text-blue-600">Direct purchase & quote acceptance</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-blue-700 font-semibold mb-0.5">Average Order Value</p>
                    <p className="text-xl font-black text-blue-900">
                      {analytics.orders.byUserType.user > 0
                        ? formatCurrency(analytics.sales.byUserType.user / analytics.orders.byUserType.user)
                        : formatCurrency(0)
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Retailer Sales Distribution */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Premium Header with Gradient */}
            <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                      <Store className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Retailer Sales Distribution</h3>
                  </div>
                  <p className="text-emerald-100 text-sm font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Business Partners
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="bg-green-400 text-green-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                    <div className="w-2 h-2 bg-green-900 rounded-full animate-pulse"></div>
                    LIVE
                  </div>
                  <div className="text-white/80 text-xs">Real-time data</div>
                </div>
              </div>
            </div>

            {/* Premium Quote Sales Section */}
            <div className="p-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
                <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl">
                        <FileText className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
                          Quote Sales Only
                          <span className="px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded-full text-xs">100%</span>
                        </p>
                        <p className="text-xs text-emerald-600 mt-1">Exclusive quotation-based purchasing</p>
                      </div>
                    </div>
                    <BarChart3 className="w-6 h-6 text-emerald-500" />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-5xl font-black text-emerald-900 mb-2">{formatCurrency(analytics.sales.byUserType.retailer)}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-emerald-200 px-3 py-1.5 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-emerald-700" />
                          <span className="text-sm font-bold text-emerald-900">
                            {analytics.orders.byUserType.retailer} {analytics.orders.byUserType.retailer === 1 ? 'quote order' : 'quote orders'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t-2 border-emerald-300 bg-white/50 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <Shield className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-900 uppercase mb-1">Business Model</p>
                          <p className="text-sm text-emerald-700 font-medium">Retailers can only purchase through quotes</p>
                          <p className="text-xs text-emerald-600 mt-1">Ensures custom pricing & bulk negotiations</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Chart Section */}
            <div className="px-6 pb-4">
              {retailerSalesData[0].value > 0 ? (
                <div className="bg-gradient-to-br from-gray-50 to-emerald-50 rounded-2xl p-4 border border-gray-200 shadow-inner">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={retailerSalesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        fill="#10B981"
                        paddingAngle={0}
                        dataKey="value"
                        label={() => '100%'}
                        labelLine={{ stroke: '#10b981', strokeWidth: 2 }}
                      >
                        {retailerSalesData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={RETAILER_COLORS[index]} stroke="#fff" strokeWidth={3} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.98)',
                          borderRadius: '12px',
                          border: '2px solid #10b981',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                          padding: '12px'
                        }}
                        labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={40}
                        iconType="circle"
                        wrapperStyle={{ paddingTop: '16px', fontWeight: '600' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-gray-50 to-emerald-50 rounded-2xl p-8 border border-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="p-4 bg-gray-200 rounded-full inline-flex mb-3">
                      <Store className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-semibold">No retailer sales data yet</p>
                    <p className="text-gray-500 text-sm mt-1">Data will appear when quotes are approved</p>
                  </div>
                </div>
              )}
            </div>

            {/* Premium Summary Footer */}
            <div className="p-6 bg-gradient-to-br from-slate-50 to-emerald-50 border-t-2 border-emerald-200">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-xl p-4 shadow-lg border-l-4 border-emerald-500 hover:scale-105 transition-transform">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Total Sales</p>
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-3xl font-black text-emerald-600">{formatCurrency(analytics.sales.byUserType.retailer)}</p>
                  <p className="text-xs text-gray-600 mt-1">B2B revenue generated</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-lg border-l-4 border-teal-500 hover:scale-105 transition-transform">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Total Orders</p>
                    <Package className="w-4 h-4 text-teal-500" />
                  </div>
                  <p className="text-3xl font-black text-gray-800">{formatNumber(analytics.orders.byUserType.retailer)}</p>
                  <p className="text-xs text-gray-600 mt-1">Quote-based orders</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl p-4 border border-emerald-300 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Info className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-emerald-700 font-semibold">Sales Insight</p>
                      <p className="text-xs text-emerald-600">All sales through quote system</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-emerald-700 font-semibold mb-0.5">Average Order Value</p>
                    <p className="text-xl font-black text-emerald-900">
                      {analytics.orders.byUserType.retailer > 0
                        ? formatCurrency(analytics.sales.byUserType.retailer / analytics.orders.byUserType.retailer)
                        : formatCurrency(0)
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Recent Orders</h3>
              <button onClick={() => setActiveTab('orders')} className="text-blue-600 text-sm hover:underline">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-3">Order ID</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">#{order._id.slice(-6)}</td>
                      <td className="px-6 py-4">{order.user?.name || order.userId?.name || 'Unknown'}</td>
                      <td className="px-6 py-4">{formatCurrency(order.totalAmount)}</td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-500">No recent orders found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Quotes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Recent Quotes</h3>
              <button onClick={() => setActiveTab('quotes')} className="text-blue-600 text-sm hover:underline">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Items</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentQuotes.map((quote) => (
                    <tr key={quote._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{quote.user?.name || 'Unknown'}</td>
                      <td className="px-6 py-4">{quote.products?.length || 0} items</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${quote.status === 'accepted' ? 'bg-green-100 text-green-700' :
                          quote.status === 'responded' ? 'bg-blue-100 text-blue-700' :
                            quote.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                          }`}>
                          {quote.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(quote.createdAt || '').toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {recentQuotes.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No recent quotes found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* System Data Export Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">System Data Export</h3>
              <p className="text-sm text-gray-500">Export comprehensive reports for all system data (Supports up to 100MB)</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by Date:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {(exportStartDate || exportEndDate) && (
              <button
                onClick={() => { setExportStartDate(''); setExportEndDate(''); }}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                Clear Filter
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
              <div key={item.entity} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${item.bg}`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <span className="font-medium text-gray-700">{item.label}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleServerExport(item.entity, 'pdf')}
                    className="flex-1 px-2 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => handleServerExport(item.entity, 'csv')}
                    className="flex-1 px-2 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded border border-green-200 transition-colors"
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => handleServerExport(item.entity, 'excel')}
                    className="flex-1 px-2 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
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
    const filteredProducts = validProducts.filter((product) => {
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
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Product Management</h2>
              <p className="text-indigo-100 max-w-2xl">
                Manage your entire product catalog efficiently. Add new products, update inventory, set pricing, and configure warranty options.
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/add-product')}
              className="bg-white text-indigo-600 px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-indigo-50 transition-colors font-semibold shadow-md"
            >
              <Plus className="w-5 h-5" />
              Add New Product
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <Package className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{products.length}</p>
            <p className="text-xs text-gray-500 mt-1">Active in catalog</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Stock</p>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalStock.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Units available</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <AlertCircle className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{lowStockCount}</p>
            <p className="text-xs text-gray-500 mt-1">Need restock</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <Package className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{outOfStockCount}</p>
            <p className="text-xs text-gray-500 mt-1">Unavailable</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Quote Required</p>
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{quoteOnlyCount}</p>
            <p className="text-xs text-gray-500 mt-1">Custom pricing</p>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products..."
                  className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                />
              </div>

              <select
                value={productFilterCategory}
                onChange={(e) => setProductFilterCategory(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={productFilterStatus}
                onChange={(e) => setProductFilterStatus(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="quote_only">Quote Only</option>
                <option value="recommended">Recommended</option>
              </select>

              {(productSearch || productFilterCategory !== 'all' || productFilterStatus !== 'all') && (
                <button
                  onClick={() => {
                    setProductSearch('');
                    setProductFilterCategory('all');
                    setProductFilterStatus('all');
                  }}
                  className="px-4 py-2.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setProductViewMode('table')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${productViewMode === 'table'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Table
                </button>
                <button
                  onClick={() => setProductViewMode('grid')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${productViewMode === 'grid'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Grid
                </button>
              </div>

              <button
                onClick={() => navigate('/admin/home-page-products')}
                className="px-4 py-2.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors flex items-center gap-2 font-medium"
              >
                <Star className="w-4 h-4" />
                Featured
              </button>
            </div>
          </div>
        </div>

        {/* Export Section */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by Date:</span>
              <input
                type="date"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {(exportStartDate || exportEndDate) && (
                <button
                  onClick={() => { setExportStartDate(''); setExportEndDate(''); }}
                  className="text-sm text-red-600 hover:text-red-800 underline ml-2"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleServerExport('products', 'pdf')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
              >
                <Download size={14} /> PDF
              </button>
              <button
                onClick={() => handleServerExport('products', 'csv')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded border border-green-200 transition-colors"
              >
                <Download size={14} /> CSV
              </button>
              <button
                onClick={() => handleServerExport('products', 'excel')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
              >
                <Download size={14} /> Excel
              </button>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Export Product Catalog</h3>
                <p className="text-sm text-gray-600">Download complete product list with pricing and stock info</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExportProducts('pdf')}
                disabled={loading || products.length === 0}
                className="bg-white text-blue-700 px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-50 flex items-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Export as PDF
              </button>
              <button
                onClick={() => handleExportProducts('excel')}
                disabled={loading || products.length === 0}
                className="bg-white text-green-700 px-4 py-2 rounded-lg border border-green-200 hover:bg-green-50 flex items-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Export as Excel
              </button>
              <button
                onClick={() => handleExportProducts('csv')}
                disabled={loading || products.length === 0}
                className="bg-white text-purple-700 px-4 py-2 rounded-lg border border-purple-200 hover:bg-purple-50 flex items-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Export as CSV
              </button>
            </div>
          </div>
        </div>

        {/* Product Units Export */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Export Product Units & Serial Numbers</h3>
                <p className="text-sm text-gray-600">Download detailed inventory with all serial numbers and model info</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExportProductUnits('pdf')}
                disabled={loading}
                className="bg-white text-blue-700 px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-50 flex items-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Export as PDF
              </button>
              <button
                onClick={() => handleExportProductUnits('excel')}
                disabled={loading}
                className="bg-white text-green-700 px-4 py-2 rounded-lg border border-green-200 hover:bg-green-50 flex items-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Export as Excel
              </button>
              <button
                onClick={() => handleExportProductUnits('csv')}
                disabled={loading}
                className="bg-white text-purple-700 px-4 py-2 rounded-lg border border-purple-200 hover:bg-purple-50 flex items-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Export as CSV
              </button>
            </div>
          </div>
        </div>

        {showProductForm && (
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">
                  {editingProduct ? 'Edit Product' : 'Create New Product'}
                </h3>
                <p className="text-sm text-gray-500">
                  {editingProduct
                    ? 'Update product details and pricing.'
                    : `Add up to ${MAX_PRODUCT_IMAGES} images, serial numbers, and pricing.`}
                </p>
              </div>
              <Sparkles className="text-indigo-600" />
            </div>
            <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <CategoryInput
                    value={productForm.category}
                    onChange={(value) => setProductForm({ ...productForm, category: value })}
                    categories={uniqueCategories}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Normal Price (₹)</label>
                  <input
                    type="number"
                    value={productForm.normalPrice}
                    onChange={(e) => setProductForm({ ...productForm, normalPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter price"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Retailer Price (₹)</label>
                  <input
                    type="number"
                    value={productForm.retailerPrice}
                    onChange={(e) => setProductForm({ ...productForm, retailerPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter price"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter product description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Images *</label>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {productForm.images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img src={img} alt={`preview-${idx}`} className="w-20 h-20 rounded object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setProductForm((prev) => ({
                            ...prev,
                            images: prev.images.filter((_, i) => i !== idx)
                          }));
                        }}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 -mt-2 -mr-2"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recommended Products
                </label>
                <ProductSelector
                  products={availableRecommendationProducts}
                  selectedIds={productForm.recommendedProductIds}
                  onChange={(ids) => setProductForm({ ...productForm, recommendedProductIds: ids })}
                />
              </div>

              {/* Warranty Configuration */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Warranty Options</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Standard Warranty (months) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.warrantyPeriodMonths}
                      onChange={(e) => setProductForm({ ...productForm, warrantyPeriodMonths: parseInt(e.target.value) || 12 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="12"
                    />
                    <p className="text-xs text-gray-500 mt-1">Free warranty period (default: 12 months)</p>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={productForm.extendedWarrantyAvailable}
                        onChange={(e) => setProductForm({ ...productForm, extendedWarrantyAvailable: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Offer Extended Warranty</span>
                    </label>
                  </div>
                </div>

                {productForm.extendedWarrantyAvailable && (
                  <div className="grid md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Extended Warranty (months) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={productForm.extendedWarrantyMonths}
                        onChange={(e) => setProductForm({ ...productForm, extendedWarrantyMonths: parseInt(e.target.value) || 24 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="24"
                      />
                      <p className="text-xs text-gray-500 mt-1">Extended warranty period (default: 24 months)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Extended Warranty Price (₹) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={productForm.extendedWarrantyPrice}
                        onChange={(e) => setProductForm({ ...productForm, extendedWarrantyPrice: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter additional price"
                      />
                      <p className="text-xs text-gray-500 mt-1">Additional cost for extended warranty</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRecommended"
                  checked={productForm.isRecommended}
                  onChange={(e) => setProductForm({ ...productForm, isRecommended: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isRecommended" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Mark as Recommended Product
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
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
                  className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Normal Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Retailer Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const thumbnail = product.images?.[0] || product.imageUrl;
                  return (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {thumbnail && (
                            <img
                              src={thumbnail}
                              alt={product.name}
                              className="w-12 h-12 rounded object-cover mr-3"
                            />
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="flex gap-2 mt-1">
                              {product.requiresQuote && (
                                <span className="text-xs text-blue-600 font-medium">
                                  Quote Required
                                </span>
                              )}
                              {product.isRecommended && (
                                <span className="text-xs text-yellow-600 font-medium flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  Recommended
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {product.normalPrice ? `₹${product.normalPrice}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {product.retailerPrice ? `₹${product.retailerPrice}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${(product.stock || product.stockQuantity || 0) > 10
                            ? 'bg-green-100 text-green-800'
                            : (product.stock || product.stockQuantity || 0) > 0
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                            }`}
                        >
                          {product.stock || product.stockQuantity || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleRecommended(product._id, product.isRecommended || false)}
                            className={`${product.isRecommended ? 'text-yellow-600 hover:text-yellow-800' : 'text-gray-400 hover:text-yellow-600'}`}
                            title="Toggle Recommended"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-indigo-600 hover:text-indigo-800"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => loadProductUnits(product._id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Units"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="text-red-600 hover:text-red-800"
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
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">User Management</h2>
              <p className="text-purple-100">Manage user accounts, roles, and permissions efficiently</p>
            </div>
            <Users className="w-16 h-16 text-purple-200 opacity-50" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalUsers}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Users</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{activeUsers}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Check className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{pendingUsers}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Admins</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{adminUsers}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Retailers</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{retailerUsers}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Store className="w-6 h-6 text-blue-600" />
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
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-64"
              />
            </div>

            <select
              value={userFilterRole}
              onChange={(e) => setUserFilterRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="retailer">Retailer</option>
              <option value="user">User</option>
            </select>

            <select
              value={userFilterStatus}
              onChange={(e) => setUserFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <Download className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Export:</span>
              <button
                onClick={() => handleServerExport('users', 'pdf')}
                className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
              >
                PDF
              </button>
              <button
                onClick={() => handleServerExport('users', 'csv')}
                className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded border border-green-200 transition-colors"
              >
                CSV
              </button>
              <button
                onClick={() => handleServerExport('users', 'excel')}
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
              Showing <span className="font-semibold">{filteredUsers.length}</span> of <span className="font-semibold">{totalUsers}</span> users
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Member Since
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
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
                    <tr key={user._id} className="hover:bg-purple-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white ${user.role === 'admin' ? 'bg-purple-500' :
                            user.role === 'retailer' ? 'bg-blue-500' :
                              'bg-gray-400'
                            }`}>
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">ID: {user._id.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {user.role === 'admin' && <Shield className="w-4 h-4 text-purple-600" />}
                          {user.role === 'retailer' && <Store className="w-4 h-4 text-blue-600" />}
                          {user.role === 'user' && <Users className="w-4 h-4 text-gray-600" />}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : user.role === 'retailer'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                              }`}
                          >
                            {user.role.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.role === 'retailer' && !user.isApproved ? (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-orange-500" />
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                              PENDING APPROVAL
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" />
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                              ACTIVE
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {new Date(user.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          {user.role === 'retailer' && !user.isApproved && (
                            <button
                              onClick={() => handleApproveRetailer(user._id)}
                              className="text-green-700 hover:text-green-900 bg-green-50 hover:bg-green-100 flex items-center gap-1.5 px-3 py-2 border border-green-300 rounded-lg hover:shadow-md transition-all font-medium"
                              title="Approve Retailer Access"
                            >
                              <Check className="w-4 h-4" />
                              <span className="text-xs">Approve</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleView360User(user)}
                            className="text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 flex items-center gap-1.5 px-3 py-2 border border-indigo-300 rounded-lg hover:shadow-md transition-all font-medium"
                            title="View 360° User Profile"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="text-xs">360 View</span>
                          </button>
                          <button
                            onClick={() => handleViewUserWarranties(user._id)}
                            className="text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 flex items-center gap-1.5 px-3 py-2 border border-purple-300 rounded-lg hover:shadow-md transition-all font-medium"
                            title="View Warranty PDFs"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="text-xs">Warranty</span>
                          </button>
                          {user.role === 'retailer' && (
                            <button
                              onClick={() => handleViewUserInventory(user._id)}
                              className="text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 flex items-center gap-1.5 px-3 py-2 border border-teal-300 rounded-lg hover:shadow-md transition-all font-medium"
                              title="View Inventory PDFs"
                            >
                              <Package className="w-4 h-4" />
                              <span className="text-xs">Inventory</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleChangeUserRole(user._id, user.role)}
                            className="text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 flex items-center gap-1.5 px-3 py-2 border border-blue-300 rounded-lg hover:shadow-md transition-all font-medium"
                            title={`Change role from ${user.role} to ${['user', 'retailer', 'admin'][((['user', 'retailer', 'admin'].indexOf(user.role)) + 1) % 3]}`}
                          >
                            <Edit className="w-4 h-4" />
                            <span className="text-xs">Role</span>
                          </button>
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 flex items-center gap-1.5 px-3 py-2 border border-red-300 rounded-lg hover:shadow-md transition-all font-medium"
                              title="Delete User Account"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="text-xs">Delete</span>
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
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Quote Management</h2>
              <p className="text-blue-100">Manage customer quote requests and provide competitive pricing</p>
            </div>
            <FileText className="w-16 h-16 text-blue-200 opacity-50" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending Review</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{pendingQuotes}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Responded</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{respondedQuotes}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Accepted</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{acceptedQuotes}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Quotes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{quotes.length}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-indigo-600" />
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
                placeholder="Search by customer name, email, or product..."
                value={quoteSearch}
                onChange={(e) => setQuoteSearch(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
              />
            </div>

            <select
              value={quoteFilterStatus}
              onChange={(e) => setQuoteFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Start Date"
              />
              <span className="text-gray-500 text-sm">to</span>
              <input
                type="date"
                value={quoteEndDate}
                onChange={(e) => setQuoteEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <Download className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Export:</span>
              <button
                onClick={() => handleServerExport('quotes', 'pdf')}
                className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
              >
                PDF
              </button>
              <button
                onClick={() => handleServerExport('quotes', 'csv')}
                className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded border border-green-200 transition-colors"
              >
                CSV
              </button>
              <button
                onClick={() => handleServerExport('quotes', 'excel')}
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
              Showing <span className="font-semibold">{filteredQuotes.length}</span> of <span className="font-semibold">{quotes.length}</span> quotes
            </p>
          </div>
        )}

        <div className="space-y-4">
          {filteredQuotes.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No quotes found</h3>
              <p className="text-sm text-gray-500">
                {hasActiveFilters ? 'Try adjusting your filters' : 'No quote requests available'}
              </p>
            </div>
          ) : (
            filteredQuotes.map((quote) => (
              <div
                key={quote._id}
                className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {quote.user?.name || quote.userId?.name || 'Unknown User'}
                    </h3>
                    <p className="text-sm text-gray-600">{quote.user?.email || quote.userId?.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {quote.createdAt ? new Date(quote.createdAt).toLocaleString() : ''}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${quote.type === 'bulk_order'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                      {quote.type === 'bulk_order' ? 'Bulk Order' : 'Price Request'}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${quote.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : quote.status === 'responded'
                          ? 'bg-blue-100 text-blue-800'
                          : quote.status === 'accepted' || quote.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                    >
                      {quote.status}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Products:</h4>
                  <ul className="space-y-1">
                    {quote.products.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-600">
                        • {(item.product?.name || item.productId?.name) || 'Unknown Product'} (Qty: {item.quantity})
                      </li>
                    ))}
                  </ul>
                </div>

                {quote.message && (
                  <div className="mb-4">
                    <h4 className="font-medium text-sm text-gray-700 mb-1">Message:</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {quote.message}
                    </p>
                  </div>
                )}

                {(quote.adminResponse || (quote.adminResponse && typeof quote.adminResponse === 'string')) && (
                  <div className="mb-4">
                    <h4 className="font-medium text-sm text-gray-700 mb-1">
                      Admin Response:
                    </h4>
                    <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                      {typeof quote.adminResponse === 'string' ? quote.adminResponse : quote.adminResponse?.message}
                    </p>
                    {(quote.adminResponse?.totalPrice || quote.quotedPrice) && (
                      <p className="text-sm font-semibold text-gray-800 mt-2">
                        Quoted Price: ₹{quote.adminResponse?.totalPrice || quote.quotedPrice}
                      </p>
                    )}
                  </div>
                )}

                {quote.status === 'pending' && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Provide Quote Response:</h4>

                    {/* Product Pricing Table */}
                    <div className="mb-4 overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-500">Product</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-500">Qty</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-500">Original Price</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-500">Offered Price (Per Unit)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {quote.products.map((item, idx) => {
                            const productId = item.product?._id || item.productId?._id || `unknown-${idx}`;
                            const productName = item.product?.name || item.productId?.name || 'Unknown Product';
                            // @ts-ignore
                            const originalPrice = item.product?.price || item.product?.normalPrice || item.originalPrice || 0;

                            return (
                              <tr key={idx}>
                                <td className="px-3 py-2">{productName}</td>
                                <td className="px-3 py-2">{item.quantity}</td>
                                <td className="px-3 py-2">₹{originalPrice}</td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    value={quoteResponse.id === quote._id ? (quoteResponse.products[productId] ?? '') : ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setQuoteResponse(prev => ({
                                        ...prev,
                                        id: quote._id,
                                        products: {
                                          ...prev.products,
                                          [productId]: val
                                        }
                                      }));
                                    }}
                                    className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter Price"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Calculated Total Display */}
                    <div className="mb-4 flex justify-end bg-gray-50 p-3 rounded border border-gray-200">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Calculated Total Amount</p>
                        <p className="text-xl font-bold text-green-600">
                          ₹{quote.products.reduce((sum, item) => {
                            const productId = item.product?._id || item.productId?._id;
                            // @ts-ignore
                            const price = (quoteResponse.id === quote._id && quoteResponse.products[productId]) ? Number(quoteResponse.products[productId]) : 0;
                            return sum + (price * item.quantity);
                          }, 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Admin Response Message
                        </label>
                        <textarea
                          value={
                            quoteResponse.id === quote._id ? quoteResponse.response : ''
                          }
                          onChange={(e) =>
                            setQuoteResponse(prev => ({
                              ...prev,
                              id: quote._id,
                              response: e.target.value,
                              products: prev.products // Keep products
                            }))
                          }
                          rows={2}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your response message to the customer..."
                        />
                      </div>
                      <button
                        onClick={() => handleRespondToQuote(quote._id)}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 flex items-center gap-2 h-10 font-medium shadow-md hover:shadow-lg transition-all"
                      >
                        <Check className="w-4 h-4" />
                        Approve Quote
                      </button>
                      <button
                        onClick={() => handleRejectQuote(quote._id)}
                        className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-2 rounded-lg hover:from-red-700 hover:to-rose-700 flex items-center gap-2 h-10 font-medium shadow-md hover:shadow-lg transition-all"
                      >
                        <X className="w-4 h-4" />
                        Reject Quote
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
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
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Order Management</h2>
              <p className="text-emerald-100">Track, manage, and fulfill customer orders efficiently</p>
            </div>
            <ShoppingCart className="w-16 h-16 text-emerald-200 opacity-50" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalOrders}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600 mt-1">₹{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending Payment</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{pendingPayments}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Completed</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{completedPayments}</p>
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
                placeholder="Search by customer, order ID, or product..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-80"
              />
            </div>

            <select
              value={orderFilterPayment}
              onChange={(e) => setOrderFilterPayment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Start Date"
              />
              <span className="text-gray-500 text-sm">to</span>
              <input
                type="date"
                value={orderEndDate}
                onChange={(e) => setOrderEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <Download className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Export:</span>
              <button
                onClick={() => handleServerExport('orders', 'pdf')}
                className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
              >
                PDF
              </button>
              <button
                onClick={() => handleServerExport('orders', 'csv')}
                className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded border border-green-200 transition-colors"
              >
                CSV
              </button>
              <button
                onClick={() => handleServerExport('orders', 'excel')}
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
              Showing <span className="font-semibold">{filteredOrders.length}</span> of <span className="font-semibold">{totalOrders}</span> orders
            </p>
          </div>
        )}

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <div className="bg-gray-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <ShoppingCart className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {hasActiveFilters ? 'No orders match your filters' : 'No orders found'}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-emerald-50 to-green-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Products
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="px-6 py-4 text-sm">
                        <span className="font-mono font-medium text-indigo-600">
                          #{order.orderNumber || order._id.slice(-8)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full w-10 h-10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-indigo-700">
                              {(order.user?.name || order.userId?.name || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {/* Display Retailer Name */}
                              {order.user?.name || order.userId?.name || 'Unknown User'}
                              {/* If Dropship, show explicit tag and End Customer Name */}
                              {order.isDropship && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Dropship
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">{order.user?.email || order.userId?.email}</div>
                            {/* Dropship Customer Info */}
                            {order.isDropship && order.customerDetails && (
                              <div className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                                <Truck size={12} />
                                <span>Ship to: <strong>{order.customerDetails.name}</strong></span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900 font-medium">
                            {order.products.length} item{order.products.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {order.products.slice(0, 2).map((p) => {
                            const product = p.productId || (p as any).product;
                            return product?.name || 'Unknown Product';
                          }).join(', ')}
                          {order.products.length > 2 && ` +${order.products.length - 2} more`}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-base font-bold text-gray-900">
                          ₹{order.totalAmount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.paymentStatus || 'pending'}
                          onChange={(e) => handleUpdatePaymentStatus(order._id, e.target.value)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border-0 cursor-pointer transition-colors ${order.paymentStatus === 'completed' || order.paymentStatus === 'paid'
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : order.paymentStatus === 'failed'
                              ? 'bg-red-100 text-red-800 hover:bg-red-200'
                              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-900">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
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
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Order Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {(order.invoiceUrl || order.customerInvoiceUrl) && (
                            <a
                              href={order.invoiceUrl || order.customerInvoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="View Invoice PDF"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => handlePrintDeliveryLabel(order)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Print Delivery Label"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenTrackingModal(order._id, 'order', order.deliveryTrackingLink, undefined, order.trackingId)}
                            className={`p-2 rounded-lg transition-colors ${order.deliveryTrackingLink
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-orange-600 hover:bg-orange-50'
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
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Warranty Management</h2>
              <p className="text-purple-100">Review and manage product warranty registrations</p>
            </div>
            <Shield className="w-16 h-16 text-purple-200 opacity-50" />
          </div>
        </div>

        {/* Warranty Validation Tool */}
        <WarrantyValidator />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Warranties</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalWarranties}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-lg">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingWarranties}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Approved</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{approvedWarranties}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rejected</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{rejectedWarranties}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <X className="w-6 h-6 text-red-600" />
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
                placeholder="Search by product, customer, serial, or model..."
                value={warrantySearch}
                onChange={(e) => setWarrantySearch(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-80"
              />
            </div>

            <select
              value={warrantyFilterStatus}
              onChange={(e) => setWarrantyFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <Download className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Export:</span>
              <button
                onClick={() => handleServerExport('warranties', 'pdf')}
                className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
              >
                PDF
              </button>
              <button
                onClick={() => handleServerExport('warranties', 'csv')}
                className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded border border-green-200 transition-colors"
              >
                CSV
              </button>
              <button
                onClick={() => handleServerExport('warranties', 'excel')}
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
              Showing <span className="font-semibold">{filteredWarranties.length}</span> of <span className="font-semibold">{totalWarranties}</span> warranties
            </p>
          </div>
        )}

        {/* Warranty Cards */}
        {filteredWarranties.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <div className="bg-gray-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Shield className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {hasActiveFilters ? 'No warranties match your filters' : 'No warranty registrations found'}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <Shield className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{warranty.productName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full w-8 h-8 flex items-center justify-center">
                          <span className="text-xs font-semibold text-indigo-700">
                            {(warranty.userId?.name || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{warranty.userId?.name}</p>
                          <p className="text-xs text-gray-600">{warranty.userId?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        Registered: {new Date(warranty.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${warranty.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : warranty.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                      }`}
                  >
                    {warranty.status === 'pending' && <Clock className="w-4 h-4 mr-1" />}
                    {warranty.status === 'approved' && <CheckCircle className="w-4 h-4 mr-1" />}
                    {warranty.status === 'rejected' && <X className="w-4 h-4 mr-1" />}
                    {warranty.status}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Serial Number</p>
                      <p className="font-semibold text-gray-900 mt-1">{warranty.serialNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Model Number</p>
                      <p className="font-semibold text-gray-900 mt-1">{warranty.modelNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Purchase Date</p>
                      <p className="font-semibold text-gray-900 mt-1">
                        {new Date(warranty.purchaseDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Purchase Type</p>
                      <p className="font-semibold text-gray-900 mt-1 capitalize">{warranty.purchaseType}</p>
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
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1.5 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors border border-blue-200 hover:border-blue-300"
                      >
                        <Download className="w-4 h-4" />
                        Invoice PDF
                      </a>
                    )}
                    {warranty.warrantyCertificateUrl && (
                      <a
                        href={warranty.warrantyCertificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center gap-1.5 hover:bg-purple-50 px-3 py-2 rounded-lg transition-colors border border-purple-200 hover:border-purple-300"
                      >
                        <Shield className="w-4 h-4" />
                        Warranty Certificate PDF
                      </a>
                    )}
                  </div>
                  {warranty.status === 'pending' && (
                    <div className="flex gap-3 ml-auto">
                      <button
                        onClick={() => handleWarrantyAction(warranty._id, 'approved')}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleWarrantyAction(warranty._id, 'rejected')}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 shadow-sm"
                      >
                        <X className="w-4 h-4" />
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
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Investor Documents</h2>
              <p className="text-green-100">Manage reports, presentations, and investor materials</p>
            </div>
            <FileText className="w-16 h-16 text-green-200 opacity-50" />
          </div>
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
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Email Logs</h2>
              <p className="text-cyan-100">Track and monitor all system email communications</p>
            </div>
            <Mail className="w-16 h-16 text-cyan-200 opacity-50" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Emails</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalEmails}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-lg">
                <Mail className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sent Successfully</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{sentEmails}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Failed</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{failedEmails}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email Types</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{uniqueTypes}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
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
                placeholder="Search by recipient, subject, or type..."
                value={emailSearch}
                onChange={(e) => setEmailSearch(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent w-80"
              />
            </div>

            <select
              value={emailFilterStatus}
              onChange={(e) => setEmailFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>

            <select
              value={emailFilterType}
              onChange={(e) => setEmailFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
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
                className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <Download className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Export:</span>
              <button
                onClick={() => handleServerExport('email-logs', 'pdf')}
                className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
              >
                PDF
              </button>
              <button
                onClick={() => handleServerExport('email-logs', 'csv')}
                className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded border border-green-200 transition-colors"
              >
                CSV
              </button>
              <button
                onClick={() => handleServerExport('email-logs', 'excel')}
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
              Showing <span className="font-semibold">{filteredEmailLogs.length}</span> of <span className="font-semibold">{totalEmails}</span> email logs
            </p>
          </div>
        )}

        {/* Email Logs Table */}
        {filteredEmailLogs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <div className="bg-gray-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Mail className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {hasActiveFilters ? 'No email logs match your filters' : 'No email logs found'}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-cyan-50 to-blue-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Recipient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Sent At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmailLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-cyan-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{log.recipient}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className="line-clamp-2">{log.subject}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {log.emailType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${log.status === 'sent'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}
                        >
                          {log.status === 'sent' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {log.status === 'failed' && <AlertCircle className="w-3 h-3 mr-1" />}
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-900">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {log.sentAt ? new Date(log.sentAt).toLocaleDateString() : 'Not sent'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {log.sentAt ? new Date(log.sentAt).toLocaleTimeString() : 'Pending'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {log.status === 'failed' && (
                          <button
                            onClick={() => handleResendEmail(log._id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
        <div className="bg-gradient-to-r from-pink-600 to-rose-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Contact Messages</h2>
              <p className="text-pink-100">Manage and respond to customer inquiries</p>
            </div>
            <MessageSquare className="w-16 h-16 text-pink-200 opacity-50" />
          </div>
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
              <Download className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Export:</span>
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Content Management</h2>
        <div className="flex gap-2">
          <button onClick={() => navigate('/admin/blog-management')} className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">📝 Blogs</button>
          <button onClick={() => navigate('/admin/team-management')} className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">👥 Team</button>
          <button onClick={() => navigate('/admin/event-management')} className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700">📅 Events</button>
          <button onClick={() => navigate('/admin/report-management')} className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700">📊 Reports</button>
          <button onClick={() => navigate('/admin/page-content')} className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700">📄 Pages</button>
          <button onClick={() => navigate('/admin/stats-management')} className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">📈 Stats</button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Blog Posts */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Blog Posts</h3>
            <Edit size={20} className="text-blue-600" />
          </div>
          <p className="text-gray-600 mb-4">Manage blog articles and publications</p>
          <button
            onClick={() => navigate('/admin/blog-management')}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Manage Blogs
          </button>
        </div>

        {/* Team Members */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Team Members</h3>
            <Users size={20} className="text-green-600" />
          </div>
          <p className="text-gray-600 mb-4">Manage leadership and team profiles</p>
          <button
            onClick={() => navigate('/admin/team-management')}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Manage Team
          </button>
        </div>

        {/* Events */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Events</h3>
            <Clock size={20} className="text-purple-600" />
          </div>
          <p className="text-gray-600 mb-4">Manage investor events and webinars</p>
          <button
            onClick={() => navigate('/admin/event-management')}
            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Manage Events
          </button>
        </div>

        {/* Reports */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Reports</h3>
            <FileText size={20} className="text-orange-600" />
          </div>
          <p className="text-gray-600 mb-4">Manage financial and investor reports</p>
          <button
            onClick={() => navigate('/admin/report-management')}
            className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Manage Reports
          </button>
        </div>

        {/* Page Content */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Page Content</h3>
            <FileText size={20} className="text-indigo-600" />
          </div>
          <p className="text-gray-600 mb-4">Edit About, Mission, Vision, etc.</p>
          <button
            onClick={() => navigate('/admin/page-content')}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Edit Content
          </button>
        </div>

        {/* Home Stats */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Home Stats</h3>
            <TrendingUp size={20} className="text-red-600" />
          </div>
          <p className="text-gray-600 mb-4">Update homepage statistics</p>
          <button
            onClick={() => navigate('/admin/stats-management')}
            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Update Stats
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
        <div className="flex items-start">
          <AlertCircle className="text-blue-600 mt-1" size={20} />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-900">Content Management System</h4>
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
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Retailer Shipments ({filteredDropshipOrders.length})</h2>
              <p className="text-purple-100">Manage direct shipments from retailers to their customers</p>
            </div>
            <Package className="w-16 h-16 text-purple-200 opacity-50" />
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by retailer, customer, or Order ID..."
              value={dropshipSearch}
              onChange={(e) => setDropshipSearch(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-80"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Retailer</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Tracking</th>
                  <th className="px-6 py-4">Invoice</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDropshipOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No shipments found
                    </td>
                  </tr>
                ) : (
                  filteredDropshipOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">
                        {order.orderNumber || order._id.slice(-6)}
                        <div className="text-xs text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{order.user?.name || order.userId?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{order.user?.email || order.userId?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-blue-700 text-base">{order.customerDetails?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{order.customerDetails?.phone}</div>
                        <div className="text-xs text-gray-400 truncate max-w-[150px]" title={order.customerDetails?.address}>
                          {order.customerDetails?.address}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {order.products.length} Items
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.paymentStatus === 'completed' ? 'bg-green-100 text-green-700' :
                          order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                          {order.paymentStatus}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {order.deliveryTrackingLink ? (
                          <button
                            onClick={() => handleOpenTrackingModal(order._id, 'order', order.deliveryTrackingLink, order.customerDetails?.email, order.trackingId)}
                            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                            title={order.deliveryTrackingLink}
                          >
                            <LinkIcon className="w-3 h-3" />
                            Edit Link
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenTrackingModal(order._id, 'order', undefined, order.customerDetails?.email, order.trackingId)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs transition-colors"
                          >
                            <Plus className="w-3 h-3" />
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
                            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                          >
                            <FileText size={14} />
                            Customer Invoice
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs">Not generated</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedDropshipOrder(order);
                              setShowDropshipModal(true);
                            }}
                            className="bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
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
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
        </div>

        <div className="grid gap-6">
          {/* Tax Percentage */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Tax Percentage</h3>
                <p className="text-sm text-gray-600">GST/Tax percentage applied to orders</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settings.taxPercentage}
                onChange={(e) => setSettings({ ...settings, taxPercentage: parseFloat(e.target.value) || 0 })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-gray-600 font-medium">%</span>
              <button
                onClick={() => updateSetting('taxPercentage', settings.taxPercentage)}
                disabled={settingsLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {settingsLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Shipping Charge */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Shipping Charge</h3>
                <p className="text-sm text-gray-600">Default shipping charge for orders</p>
              </div>
              <Truck className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600 font-medium">₹</span>
              <input
                type="number"
                min="0"
                step="1"
                value={settings.shippingCharge}
                onChange={(e) => setSettings({ ...settings, shippingCharge: parseFloat(e.target.value) || 0 })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => updateSetting('shippingCharge', settings.shippingCharge)}
                disabled={settingsLoading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {settingsLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Minimum Order Value */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Minimum Order Value</h3>
                <p className="text-sm text-gray-600">Minimum order value required for checkout</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600 font-medium">₹</span>
              <input
                type="number"
                min="0"
                step="1"
                value={settings.minOrderValue}
                onChange={(e) => setSettings({ ...settings, minOrderValue: parseFloat(e.target.value) || 0 })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => updateSetting('minOrderValue', settings.minOrderValue)}
                disabled={settingsLoading}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'products', name: 'Products', icon: Package },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'retailers', name: 'Retailers', icon: Store },
    { id: 'quotes', name: 'Quotes', icon: FileText },
    { id: 'orders', name: 'Orders', icon: ShoppingCart },
    { id: 'shipments', name: 'Retailer-Customer Shipments', icon: Package },
    { id: 'warranties', name: 'Warranties', icon: Shield },
    { id: 'investors', name: 'Investor Documents', icon: FileText },
    { id: 'messages', name: 'Messages', icon: MessageSquare },
    { id: 'content', name: 'Content', icon: Edit },
    { id: 'emails', name: 'Email Logs', icon: Mail },
    { id: 'logs', name: 'Activity Logs', icon: ClipboardList },
    { id: 'settings', name: 'Settings', icon: SettingsIcon },
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
    <div className="min-h-screen bg-gray-50">
      {/* Tabs */}
      <div className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex space-x-0.5 sm:space-x-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-3 transition-all ${activeTab === tab.id
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
                    : 'border-transparent text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 shadow-lg sticky top-[57px] z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            {/* Left Section - Logo & Title */}
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="bg-white rounded-lg p-1.5 sm:p-2 shadow-md flex-shrink-0">
                <img
                  src="https://aishwaryatechtele.com/images/telogica_logo.png"
                  alt="Telogica Logo"
                  className="h-6 sm:h-8 w-auto"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-white truncate">Admin Dashboard</h1>
                <p className="text-emerald-100 text-xs sm:text-sm truncate">Welcome back, {user?.name || 'Admin'}</p>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
              {/* Notification Badge */}
              <div className="relative">
                <button
                  className="p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all backdrop-blur-sm"
                  title="Notifications"
                >
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                  {contacts.filter(c => c.status === 'new').length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
                      {contacts.filter(c => c.status === 'new').length}
                    </span>
                  )}
                </button>
              </div>

              {/* Refresh Button */}
              <button
                onClick={loadDashboardData}
                className="p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all backdrop-blur-sm"
                title="Refresh Data"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* User Menu */}
              <div className="hidden sm:flex items-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-2 sm:px-4 py-1.5 sm:py-2">
                <div className="text-right hidden lg:block">
                  <p className="text-white font-semibold text-xs sm:text-sm truncate max-w-[120px]">{user?.name || 'Admin'}</p>
                  <p className="text-emerald-100 text-xs truncate max-w-[120px]">{user?.email}</p>
                </div>
                <div className="bg-white rounded-lg p-1.5 sm:p-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/10 hover:bg-red-500 text-white rounded-lg transition-all font-medium backdrop-blur-sm text-sm"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
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
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  Retry Loading
                </button>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
            {activeTab === 'content' && renderContentManagement()}
            {activeTab === 'emails' && renderEmailLogs()}
            {activeTab === 'logs' && <AdminLogs />}
            {activeTab === 'settings' && renderSettings()}
          </>
        )}
      </div>

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
            <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">Order Details</h2>
                  <p className="text-emerald-100 text-sm">Order #{selectedOrder.orderNumber || selectedOrder._id.slice(-8)}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowOrderDetailsModal(false);
                  setSelectedOrder(null);
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
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
    </div>
  );
};

export default AdminDashboard;
