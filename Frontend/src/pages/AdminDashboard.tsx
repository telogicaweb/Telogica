import { useState, useEffect, useMemo } from 'react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import api from '../api';
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
  ClipboardList
} from 'lucide-react';
import RetailerManagement from './admin/RetailerManagement';
import AdminLogs from './admin/AdminLogs';
import ProductSelector from '../components/AdminDashboard/ProductSelector';
import CategoryInput from '../components/AdminDashboard/CategoryInput';
import UnitBatchEntry from '../components/AdminDashboard/UnitBatchEntry';
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
}

interface ProductFormState {
  name: string;
  description: string;
  category: string;
  normalPrice: string;
  retailerPrice: string;
  quantity: number;
  warrantyPeriodMonths: number;
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
  isRecommended: false,
  requiresQuote: false,
  manualImageUrl: '',
  images: [],
  recommendedProductIds: [],
});

interface ProductUnit {
  _id: string;
  productId: { _id: string; name: string };
  serialNumber: string;
  modelNumber: string;
  warrantyPeriod: number;
  status: string;
  soldTo?: string;
  soldDate?: Date;
}

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
}

interface Order {
  _id: string;
  orderNumber?: string;
  userId: { _id: string; name: string; email: string };
  products: Array<{
    productId: { _id: string; name: string };
    quantity: number;
    price: number;
    serialNumbers?: string[];
  }>;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
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
  status: string;
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
  const [productSearch, setProductSearch] = useState('');
  
  // Export filters
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

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

  const selectedRecommendationDetails = useMemo(
    () =>
      availableRecommendationProducts.filter(product =>
        productForm.recommendedProductIds.includes(product._id)
      ),
    [availableRecommendationProducts, productForm.recommendedProductIds]
  );

  // Dashboard Chart Data (Moved to top level to avoid hook violation)
  const orderStatusData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    orders.forEach(order => {
      const status = order.orderStatus || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const handleRecommendationSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(event.target.selectedOptions, option => option.value);
    setProductForm(prev => ({
      ...prev,
      recommendedProductIds: selected,
    }));
  };

  const handleRemoveRecommendation = (id: string) => {
    setProductForm(prev => ({
      ...prev,
      recommendedProductIds: prev.recommendedProductIds.filter(existingId => existingId !== id),
    }));
  };

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
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
      return;
    }
    const userData = JSON.parse(user);
    if (userData.role !== 'admin') {
      navigate('/');
      return;
    }
    loadDashboardData();
  }, [navigate]);

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
        loadEmailLogs(),
        loadContacts(),
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
      setAnalytics(getDefaultAnalytics());
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/api/auth/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await api.get('/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
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
      const response = await api.get('/api/quotes');
      setQuotes(response.data);
    } catch (error) {
      console.error('Error loading quotes:', error);
      setQuotes([]);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await api.get('/api/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    }
  };

  const loadWarranties = async () => {
    try {
      const response = await api.get('/api/warranties');
      setWarranties(response.data);
    } catch (error) {
      console.error('Error loading warranties:', error);
      setWarranties([]);
    }
  };

  const loadEmailLogs = async () => {
    try {
      const response = await api.get('/api/email-logs');
      setEmailLogs(response.data);
    } catch (error) {
      console.error('Error loading email logs:', error);
      setEmailLogs([]);
    }
  };

  const loadContacts = async () => {
    try {
      const response = await api.get('/api/contact');
      setContacts(response.data);
    } catch (error) {
      console.error('Error loading contacts:', error);
      setContacts([]);
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
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      category: product.category,
      normalPrice: product.normalPrice?.toString() || '',
      retailerPrice: product.retailerPrice?.toString() || '',
      quantity: 0, // Quantity is managed separately via product units
      warrantyPeriodMonths: DEFAULT_WARRANTY_MONTHS,
      isRecommended: product.isRecommended || false,
      requiresQuote: product.requiresQuote,
      manualImageUrl: '',
      images: product.images || [],
      recommendedProductIds: Array.isArray(product.recommendedProductIds)
        ? product.recommendedProductIds
          .map(id => (typeof id === 'string' ? id : id?._id))
          .filter((id): id is string => Boolean(id))
        : [],
    });
    setShowProductForm(true);
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
  const handleUpdatePaymentStatus = async (orderId: string, paymentStatus: string) => {
    try {
      await api.put(`/api/orders/${orderId}`, { paymentStatus });
      alert('Payment status updated successfully');
      loadOrders();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update payment status');
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

  const downloadCSV = (data: any[], filename: string) => {
    if (!data.length) {
      alert('No data to export');
      return;
    }
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const cell = row[header] === null || row[header] === undefined ? '' : row[header];
        return JSON.stringify(cell);
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportQuotes = () => {
    const data = quotes.map(q => ({
      ID: q._id,
      User: q.user?.name || q.userId?.name || 'Unknown',
      Email: q.user?.email || q.userId?.email || 'Unknown',
      Status: q.status,
      Date: new Date(q.createdAt || '').toLocaleDateString(),
      Message: q.message || '',
      AdminResponse: typeof q.adminResponse === 'string' ? q.adminResponse : q.adminResponse?.message || '',
      QuotedPrice: q.quotedPrice || q.adminResponse?.totalPrice || 0
    }));
    downloadCSV(data, `quotes_export_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportOrders = () => {
    const data = orders.map(o => ({
      OrderNumber: o.orderNumber || o._id,
      User: o.userId?.name || 'Unknown',
      Email: o.userId?.email || 'Unknown',
      Amount: o.totalAmount,
      PaymentStatus: o.paymentStatus,
      Date: new Date(o.createdAt).toLocaleDateString(),
      ItemsCount: o.products.length,
      ProductsDetails: o.products.map(p =>
        `${p.productId?.name || 'Unknown'} (Qty: ${p.quantity}) ${p.serialNumbers?.length ? `[SN: ${p.serialNumbers.join(', ')}]` : ''}`
      ).join('; ')
    }));
    downloadCSV(data, `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
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
    const salesData = [
      { name: 'Direct Sales', value: analytics.sales.direct },
      { name: 'Quote Sales', value: analytics.sales.quote },
    ];

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sales Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Sales Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {salesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Order Status */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Order Status Overview</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderStatusData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{ fill: '#F3F4F6' }} />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
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
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">#{order._id.slice(-6)}</td>
                      <td className="px-6 py-4">{order.userId?.name || 'Unknown'}</td>
                      <td className="px-6 py-4">{formatCurrency(order.totalAmount)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                          order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-700' :
                          order.orderStatus === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {order.orderStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No recent orders found</td>
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          quote.status === 'accepted' ? 'bg-green-100 text-green-700' :
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
      if (!searchTerm) return true;
      const combined = `${product.name} ${product.category || ''}`.toLowerCase();
      return combined.includes(searchTerm);
    });

    const totalStock = validProducts.reduce(
      (acc, product) => acc + (product.stockQuantity ?? 0) + (product.stock ?? 0),
      0
    );
    const lowStockCount = validProducts.filter((product) => (product.stockQuantity ?? 0) <= 5).length;
    const quoteOnlyCount = validProducts.filter((product) => product.requiresQuote).length;
    const recommendedCount = filteredProducts.filter((product) => product.requiresQuote === false && (product.isRecommended ?? false)).length;

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Product Management</h2>
            <p className="text-sm text-gray-600 max-w-xl">
              Keep Telogica product listings crisp, visually consistent, and ready for every purchase channel. Upload images, manage stock, and keep quote-only gear in a single place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search by name or category"
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </div>
            {productSearch && (
              <button
                onClick={() => setProductSearch('')}
                className="text-sm px-3 py-2 border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => navigate('/admin/home-page-products')}
              className="bg-white text-indigo-600 border border-indigo-600 px-4 py-2 rounded-full flex items-center gap-2 hover:bg-indigo-50"
            >
              <Star className="w-4 h-4" />
              Featured Products
            </button>
            <button
              onClick={() => setShowProductForm(!showProductForm)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:from-blue-600 hover:to-indigo-700"
            >
              <Plus className="w-4 h-4" />
              {showProductForm ? 'Hide Form' : 'Add Product'}
            </button>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
            <p className="text-xs uppercase tracking-widest text-gray-500">Total Products</p>
            <p className="text-3xl font-bold text-gray-900">{products.length}</p>
            <p className="text-sm text-gray-500 mt-1">Live catalog size</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
            <p className="text-xs uppercase tracking-widest text-gray-500">Inventory stock</p>
            <p className="text-3xl font-bold text-gray-900">{totalStock.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">Online + offline availability</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
            <p className="text-xs uppercase tracking-widest text-gray-500">Quote-only gear</p>
            <p className="text-3xl font-bold text-gray-900">{quoteOnlyCount}</p>
            <p className="text-sm text-gray-500 mt-1">Requires approval / quotes</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
            <p className="text-xs uppercase tracking-widest text-gray-500">Low stock alerts</p>
            <p className="text-3xl font-bold text-gray-900">{lowStockCount}</p>
            <p className="text-sm text-gray-500 mt-1">{recommendedCount} featured ready</p>
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
    const handleExportUsersPDF = async () => {
      try {
        const { default: jsPDF } = await import('jspdf');
        const autoTable = (await import('jspdf-autotable')).default as any;

        const doc = new jsPDF();

        // Title
        doc.setFillColor(33, 150, 243);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('TELOGICA', 105, 20, { align: 'center' });

        doc.setFontSize(18);
        doc.text('USER MANAGEMENT REPORT', 105, 30, { align: 'center' });

        // Report details
        doc.setFillColor(245, 245, 245);
        doc.rect(10, 45, 190, 15, 'F');

        doc.setTextColor(33, 33, 33);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 55);
        doc.text(`Total Users: ${users.length}`, 100, 55);

        // Table
        const headers = [['No.', 'Name', 'Email', 'Role', 'Status', 'Joined']];

        const body = users.map((u, i) => [
          i + 1,
          u.name,
          u.email,
          u.role,
          u.role === 'retailer' && !u.isApproved ? 'Pending' : 'Active',
          new Date(u.createdAt).toLocaleDateString()
        ]);

        autoTable(doc, {
          startY: 65,
          head: headers,
          body: body,
          theme: 'striped',
          headStyles: {
            fillColor: [33, 150, 243],
            textColor: 255,
            fontStyle: 'bold'
          }
        });

        doc.save(`Telogica-Users-${new Date().toISOString().split('T')[0]}.pdf`);
      } catch (err: any) {
        alert(err?.message || 'Failed to export PDF');
      }
    };

    const handleExportUsersExcel = async () => {
      try {
        const ExcelJS = await import('exceljs');

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Telogica';

        const worksheet = workbook.addWorksheet('Users');
        worksheet.columns = [
          { header: 'No.', key: 'no', width: 5 },
          { header: 'Name', key: 'name', width: 25 },
          { header: 'Email', key: 'email', width: 30 },
          { header: 'Role', key: 'role', width: 12 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Joined', key: 'joined', width: 12 }
        ];

        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2196F3' }
        };

        users.forEach((u, index) => {
          worksheet.addRow({
            no: index + 1,
            name: u.name,
            email: u.email,
            role: u.role,
            status: u.role === 'retailer' && !u.isApproved ? 'Pending Approval' : 'Active',
            joined: new Date(u.createdAt).toLocaleDateString()
          });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Telogica-Users-${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
      } catch (err: any) {
        alert(err?.message || 'Failed to export Excel');
      }
    };

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

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
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
                  onClick={() => handleServerExport('users', 'pdf')}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
                >
                  <Download size={14} /> PDF
                </button>
                <button
                  onClick={() => handleServerExport('users', 'csv')}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded border border-green-200 transition-colors"
                >
                  <Download size={14} /> CSV
                </button>
                <button
                  onClick={() => handleServerExport('users', 'excel')}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                >
                  <Download size={14} /> Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'retailer'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {user.role === 'retailer' && !user.isApproved ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending Approval
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        {user.role === 'retailer' && !user.isApproved && (
                          <button
                            onClick={() => handleApproveRetailer(user._id)}
                            className="text-green-600 hover:text-green-800 flex items-center gap-1 px-2 py-1 border border-green-300 rounded hover:bg-green-50"
                            title="Approve Retailer Access"
                          >
                            <Check className="w-4 h-4" />
                            <span className="text-xs font-medium">Approve</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleChangeUserRole(user._id, user.role)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 border border-blue-300 rounded hover:bg-blue-50"
                          title={`Change role from ${user.role} to ${['user', 'retailer', 'admin'][((['user', 'retailer', 'admin'].indexOf(user.role)) + 1) % 3]}`}
                        >
                          <Edit className="w-4 h-4" />
                          <span className="text-xs font-medium">Change Role</span>
                        </button>
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="text-red-600 hover:text-red-800 flex items-center gap-1 px-2 py-1 border border-red-300 rounded hover:bg-red-50"
                            title="Delete User Account"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-xs font-medium">Delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render Quotes Tab
  const renderQuotes = () => {
    const handleExportQuotesPDF = async () => {
      try {
        const { default: jsPDF } = await import('jspdf');
        const autoTable = (await import('jspdf-autotable')).default as any;

        const doc = new jsPDF();

        // Title
        doc.setFillColor(33, 150, 243);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('TELOGICA', 105, 20, { align: 'center' });

        doc.setFontSize(18);
        doc.text('QUOTE MANAGEMENT REPORT', 105, 30, { align: 'center' });

        // Report details
        doc.setFillColor(245, 245, 245);
        doc.rect(10, 45, 190, 15, 'F');

        doc.setTextColor(33, 33, 33);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 55);
        doc.text(`Total Quotes: ${quotes.length}`, 100, 55);

        // Table
        const headers = [['No.', 'Customer', 'Products', 'Status', 'Quoted Price', 'Date']];

        const body = quotes.map((q, i) => [
          i + 1,
          q.user?.name || q.userId?.name || 'Unknown',
          q.products.map(p => (p.product?.name || p.productId?.name || 'Unknown')).join(', '),
          q.status || 'pending',
          q.quotedPrice ? `₹${q.quotedPrice}` : '-',
          q.createdAt ? new Date(q.createdAt).toLocaleDateString() : '-'
        ]);

        autoTable(doc, {
          startY: 65,
          head: headers,
          body: body,
          theme: 'striped',
          headStyles: {
            fillColor: [33, 150, 243],
            textColor: 255,
            fontStyle: 'bold'
          },
          columnStyles: {
            2: { cellWidth: 50 }
          }
        });

        doc.save(`Telogica-Quotes-${new Date().toISOString().split('T')[0]}.pdf`);
      } catch (err: any) {
        alert(err?.message || 'Failed to export PDF');
      }
    };

    const handleExportQuotesExcel = async () => {
      try {
        const ExcelJS = await import('exceljs');

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Telogica';

        const worksheet = workbook.addWorksheet('Quotes');
        worksheet.columns = [
          { header: 'No.', key: 'no', width: 5 },
          { header: 'Customer', key: 'customer', width: 20 },
          { header: 'Email', key: 'email', width: 25 },
          { header: 'Products', key: 'products', width: 40 },
          { header: 'Message', key: 'message', width: 30 },
          { header: 'Status', key: 'status', width: 12 },
          { header: 'Quoted Price', key: 'quotedPrice', width: 15 },
          { header: 'Admin Response', key: 'adminResponse', width: 30 },
          { header: 'Date', key: 'date', width: 12 }
        ];

        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2196F3' }
        };

        quotes.forEach((q, index) => {
          worksheet.addRow({
            no: index + 1,
            customer: q.user?.name || q.userId?.name || 'Unknown',
            email: q.user?.email || q.userId?.email || '',
            products: q.products.map(p => `${p.product?.name || p.productId?.name || 'Unknown'} (${p.quantity})`).join(', '),
            message: q.message || '',
            status: q.status || 'pending',
            quotedPrice: q.quotedPrice ? `₹${q.quotedPrice}` : '-',
            adminResponse: typeof q.adminResponse === 'string' ? q.adminResponse : (q.adminResponse?.message || ''),
            date: q.createdAt ? new Date(q.createdAt).toLocaleDateString() : '-'
          });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Telogica-Quotes-${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
      } catch (err: any) {
        alert(err?.message || 'Failed to export Excel');
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Quote Management</h2>
              <p className="text-sm text-gray-600 mt-1">Manage customer quote requests and provide pricing</p>
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
                  onClick={() => handleServerExport('quotes', 'pdf')}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
                >
                  <Download size={14} /> PDF
                </button>
                <button
                  onClick={() => handleServerExport('quotes', 'csv')}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded border border-green-200 transition-colors"
                >
                  <Download size={14} /> CSV
                </button>
                <button
                  onClick={() => handleServerExport('quotes', 'excel')}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                >
                  <Download size={14} /> Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-yellow-50 to-amber-100 border border-yellow-200 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">Pending</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {quotes.filter(q => q.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Responded</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {quotes.filter(q => q.status === 'responded').length}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Accepted</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {quotes.filter(q => q.status === 'accepted').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-violet-100 border border-purple-200 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Total</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{quotes.length}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {quotes.map((quote) => (
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
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    quote.status === 'pending'
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
          ))}
        </div>
      </div>
    );
  };

  // Render Orders Tab
  const renderOrders = () => {
    const handleExportOrdersPDF = async () => {
      try {
        const { default: jsPDF } = await import('jspdf');
        const autoTable = (await import('jspdf-autotable')).default as any;

        const doc = new jsPDF();

        // Title
        doc.setFillColor(33, 150, 243);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('TELOGICA', 105, 20, { align: 'center' });

        doc.setFontSize(18);
        doc.text('ORDER MANAGEMENT REPORT', 105, 30, { align: 'center' });

        // Report details
        doc.setFillColor(245, 245, 245);
        doc.rect(10, 45, 190, 15, 'F');

        doc.setTextColor(33, 33, 33);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 55);
        doc.text(`Total Orders: ${orders.length}`, 100, 55);

        // Table
        const headers = [['Order ID', 'Customer', 'Items', 'Amount', 'Payment', 'Date']];

        const body = orders.map((o) => [
          o.orderNumber || o._id.slice(-8),
          o.userId?.name || 'Unknown',
          o.products.length,
          `₹${o.totalAmount.toLocaleString()}`,
          o.paymentStatus,
          new Date(o.createdAt).toLocaleDateString()
        ]);

        autoTable(doc, {
          startY: 65,
          head: headers,
          body: body,
          theme: 'striped',
          headStyles: {
            fillColor: [33, 150, 243],
            textColor: 255,
            fontStyle: 'bold'
          }
        });

        // Summary
        const finalY = (doc as any).lastAutoTable.finalY || 70;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('SUMMARY', 15, finalY + 15);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        doc.text(`Total Revenue: ₹${totalRevenue.toLocaleString()}`, 15, finalY + 25);
        doc.text(`Total Orders: ${orders.length}`, 15, finalY + 32);

        doc.save(`Telogica-Orders-${new Date().toISOString().split('T')[0]}.pdf`);
      } catch (err: any) {
        alert(err?.message || 'Failed to export PDF');
      }
    };

    const handleExportOrdersExcel = async () => {
      try {
        const ExcelJS = await import('exceljs');

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Telogica';

        // Orders worksheet
        const worksheet = workbook.addWorksheet('Orders');
        worksheet.columns = [
          { header: 'No.', key: 'no', width: 5 },
          { header: 'Order ID', key: 'orderId', width: 20 },
          { header: 'Customer Name', key: 'customerName', width: 20 },
          { header: 'Customer Email', key: 'customerEmail', width: 25 },
          { header: 'Products', key: 'products', width: 40 },
          { header: 'Total Items', key: 'totalItems', width: 10 },
          { header: 'Total Amount (₹)', key: 'totalAmount', width: 15 },
          { header: 'Payment Status', key: 'paymentStatus', width: 15 },
          { header: 'Date', key: 'date', width: 12 }
        ];

        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2196F3' }
        };

        orders.forEach((o, index) => {
          worksheet.addRow({
            no: index + 1,
            orderId: o.orderNumber || o._id,
            customerName: o.userId?.name || 'Unknown',
            customerEmail: o.userId?.email || '',
            products: o.products.map(p => `${(p.productId || (p as any).product)?.name || 'Unknown'} (${p.quantity})`).join(', '),
            totalItems: o.products.length,
            totalAmount: o.totalAmount,
            paymentStatus: o.paymentStatus,
            date: new Date(o.createdAt).toLocaleDateString()
          });
        });

        // Summary worksheet
        const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        const summaryWs = workbook.addWorksheet('Summary');
        summaryWs.columns = [
          { header: 'Metric', key: 'metric', width: 25 },
          { header: 'Value', key: 'value', width: 20 }
        ];

        summaryWs.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        summaryWs.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2196F3' }
        };

        summaryWs.addRows([
          { metric: 'Total Orders', value: orders.length },
          { metric: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}` },
          { metric: 'Pending Payments', value: orders.filter(o => o.paymentStatus === 'pending').length },
          { metric: 'Completed Payments', value: orders.filter(o => o.paymentStatus === 'completed').length }
        ]);

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Telogica-Orders-${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
      } catch (err: any) {
        alert(err?.message || 'Failed to export Excel');
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Order Management</h2>
              <p className="text-sm text-gray-600 mt-1">Track and manage customer orders efficiently</p>
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
                  onClick={() => handleServerExport('orders', 'pdf')}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
                >
                  <Download size={14} /> PDF
                </button>
                <button
                  onClick={() => handleServerExport('orders', 'csv')}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded border border-green-200 transition-colors"
                >
                  <Download size={14} /> CSV
                </button>
                <button
                  onClick={() => handleServerExport('orders', 'excel')}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                >
                  <Download size={14} /> Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{orders.length}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Paid Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {orders.filter(o => o.paymentStatus === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-amber-100 border border-yellow-200 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">Pending Payment</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {orders.filter(o => o.paymentStatus === 'pending').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-violet-100 border border-purple-200 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₹{orders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Products
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Payment Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">
                      {order.orderNumber || order._id.slice(-8)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-900">
                          {order.userId?.name}
                        </div>
                        <div className="text-gray-600">{order.userId?.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {order.products.length} item(s)
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      ₹{order.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <select
                        value={order.paymentStatus || 'pending'}
                        onChange={(e) =>
                          handleUpdatePaymentStatus(order._id, e.target.value)
                        }
                        className={`px-2 py-1 rounded text-xs font-medium border-0 ${
                          order.paymentStatus === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : order.paymentStatus === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render Warranties Tab
  const renderWarranties = () => (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Warranty Management</h2>
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
                onClick={() => handleServerExport('warranties', 'pdf')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
              >
                <Download size={14} /> PDF
              </button>
              <button
                onClick={() => handleServerExport('warranties', 'csv')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded border border-green-200 transition-colors"
              >
                <Download size={14} /> CSV
              </button>
              <button
                onClick={() => handleServerExport('warranties', 'excel')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
              >
                <Download size={14} /> Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {warranties.map((warranty) => (
          <div
            key={warranty._id}
            className="bg-white p-6 rounded-lg shadow border border-gray-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{warranty.productName}</h3>
                <p className="text-sm text-gray-600">
                  Customer: {warranty.userId?.name} ({warranty.userId?.email})
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Registered: {new Date(warranty.createdAt).toLocaleString()}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${warranty.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : warranty.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                  }`}
              >
                {warranty.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-600">Serial Number</p>
                <p className="font-medium">{warranty.serialNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Model Number</p>
                <p className="font-medium">{warranty.modelNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Purchase Date</p>
                <p className="font-medium">
                  {new Date(warranty.purchaseDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Purchase Type</p>
                <p className="font-medium capitalize">{warranty.purchaseType}</p>
              </div>
            </div>

            {warranty.invoiceUrl && (
              <div className="mb-4">
                <a
                  href={warranty.invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  View Invoice
                </a>
              </div>
            )}

            {warranty.status === 'pending' && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleWarrantyAction(warranty._id, 'approved')}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleWarrantyAction(warranty._id, 'rejected')}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Render Email Logs Tab
  const renderEmailLogs = () => (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Email Logs</h2>
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
                onClick={() => handleServerExport('email-logs', 'pdf')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
              >
                <Download size={14} /> PDF
              </button>
              <button
                onClick={() => handleServerExport('email-logs', 'csv')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded border border-green-200 transition-colors"
              >
                <Download size={14} /> CSV
              </button>
              <button
                onClick={() => handleServerExport('email-logs', 'excel')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
              >
                <Download size={14} /> Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sent At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {emailLogs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{log.recipient}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{log.subject}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {log.emailType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${log.status === 'sent'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(log.sentAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {log.status === 'failed' && (
                      <button
                        onClick={() => handleResendEmail(log._id)}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        title="Resend"
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
    </div>
  );

  // Render Contacts Tab
  const renderContacts = () => (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Contact Messages</h2>
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
                onClick={() => handleServerExport('contacts', 'pdf')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
              >
                <Download size={14} /> PDF
              </button>
              <button
                onClick={() => handleServerExport('contacts', 'csv')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded border border-green-200 transition-colors"
              >
                <Download size={14} /> CSV
              </button>
              <button
                onClick={() => handleServerExport('contacts', 'excel')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
              >
                <Download size={14} /> Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {contacts.map((contact) => (
          <div
            key={contact._id}
            className="bg-white p-6 rounded-lg shadow border border-gray-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{contact.subject}</h3>
                <p className="text-sm text-gray-600">
                  From: {contact.name} ({contact.email})
                </p>
                {contact.phone && (
                  <p className="text-sm text-gray-600">Phone: {contact.phone}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Received: {new Date(contact.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={contact.status}
                  onChange={(e) => handleUpdateContactStatus(contact._id, e.target.value)}
                  className={`px-2 py-1 rounded text-xs font-medium border-0 ${contact.status === 'new'
                    ? 'bg-blue-100 text-blue-800'
                    : contact.status === 'read'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-green-100 text-green-800'
                    }`}
                >
                  <option value="new">New</option>
                  <option value="read">Read</option>
                  <option value="replied">Replied</option>
                </select>
                <button
                  onClick={() => handleDeleteContact(contact._id)}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="Delete Message"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-800 whitespace-pre-wrap">{contact.message}</p>
            </div>

            <div className="mt-4 flex justify-end">
              <a
                href={`mailto:${contact.email}?subject=Re: ${contact.subject}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
              >
                <Mail className="w-4 h-4" />
                Reply via Email
              </a>
            </div>
          </div>
        ))}
        {contacts.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            No messages found.
          </div>
        )}
      </div>
    </div>
  );

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

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'products', name: 'Products', icon: Package },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'retailers', name: 'Retailers', icon: Store },
    { id: 'quotes', name: 'Quotes', icon: FileText },
    { id: 'orders', name: 'Orders', icon: ShoppingCart },
    { id: 'warranties', name: 'Warranties', icon: Shield },
    { id: 'messages', name: 'Messages', icon: MessageSquare },
    { id: 'content', name: 'Content', icon: Edit },
    { id: 'emails', name: 'Email Logs', icon: Mail },
    { id: 'logs', name: 'Activity Logs', icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={loadDashboardData}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
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
            {activeTab === 'warranties' && renderWarranties()}
            {activeTab === 'messages' && renderContacts()}
            {activeTab === 'content' && renderContentManagement()}
            {activeTab === 'emails' && renderEmailLogs()}
            {activeTab === 'logs' && <AdminLogs />}
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
    </div>
  );
};

export default AdminDashboard;
