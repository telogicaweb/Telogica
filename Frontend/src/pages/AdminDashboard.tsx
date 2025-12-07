import { useState, useEffect, useMemo, useContext } from 'react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
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
  Send
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
}

interface Order {
  _id: string;
  orderNumber?: string;
  userId?: { _id: string; name: string; email: string };
  user?: { _id: string; name: string; email: string };
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
  isDropship?: boolean;
  customerDetails?: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  customerInvoiceUrl?: string;
  deliveryTrackingLink?: string;
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
  const [productSearch, setProductSearch] = useState('');
  const [productViewMode, setProductViewMode] = useState<'grid' | 'table'>('table');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productFilterCategory, setProductFilterCategory] = useState<string>('all');
  const [productFilterStatus, setProductFilterStatus] = useState<string>('all');

  // User management filters
  const [userSearch, setUserSearch] = useState('');
  const [userFilterRole, setUserFilterRole] = useState<string>('all');
  const [userFilterStatus, setUserFilterStatus] = useState<string>('all');

  // Quote management filters
  const [quoteSearch, setQuoteSearch] = useState('');
  const [quoteFilterStatus, setQuoteFilterStatus] = useState<string>('all');

  // Order management filters
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilterPayment, setOrderFilterPayment] = useState<string>('all');

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
  const [trackingType, setTrackingType] = useState<'order' | 'quote'>('order');
  const [selectedTrackingId, setSelectedTrackingId] = useState<string>('');

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
        loadEmailLogs(),
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
      const response = await api.get('/api/products');
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
      const response = await api.get('/api/quotes');
      setQuotes(response.data);
    } catch (error) {
      console.error('Error loading quotes:', error);
      // Keep existing data on error
    }
  };

  const loadOrders = async () => {
    try {
      const response = await api.get('/api/orders');
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
  const handleUpdatePaymentStatus = async (orderId: string, paymentStatus: string) => {
    try {
      await api.put(`/api/orders/${orderId}`, { paymentStatus });
      alert('Payment status updated successfully');
      loadOrders();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update payment status');
    }
  };

  // Tracking Link Management
  const handleOpenTrackingModal = (id: string, type: 'order' | 'quote', currentLink?: string) => {
    setSelectedTrackingId(id);
    setTrackingType(type);
    setTrackingLinkInput(currentLink || '');
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
      
      await api.put(endpoint, { deliveryTrackingLink: trackingLinkInput });
      alert('Tracking link updated successfully and email sent to user');
      
      setShowTrackingModal(false);
      setTrackingLinkInput('');
      
      if (trackingType === 'order') {
        loadOrders();
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
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
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
    const lowStockCount = validProducts.filter((product) => (product.stockQuantity ?? 0) <= 5).length;
    const quoteOnlyCount = validProducts.filter((product) => product.requiresQuote).length;
    const recommendedCount = filteredProducts.filter((product) => product.requiresQuote === false && (product.isRecommended ?? false)).length;

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

    const hasActiveFilters = quoteSearch || quoteFilterStatus !== 'all';

    // Calculate stats
    const pendingQuotes = quotes.filter(q => q.status === 'pending').length;
    const respondedQuotes = quotes.filter(q => q.status === 'responded').length;
    const acceptedQuotes = quotes.filter(q => q.status === 'accepted' || q.status === 'approved').length;
    const rejectedQuotes = quotes.filter(q => q.status === 'rejected').length;

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

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setQuoteSearch('');
                  setQuoteFilterStatus('all');
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

                {/* Tracking Link Button - Shows for all quotes */}
                {quote.status && quote.status !== 'pending' && quote.status !== 'rejected' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleOpenTrackingModal(quote._id, 'quote', quote.deliveryTrackingLink)}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                        quote.deliveryTrackingLink
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg'
                          : 'bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-700 hover:to-amber-700 shadow-md hover:shadow-lg'
                      }`}
                    >
                      <LinkIcon className="w-5 h-5" />
                      {quote.deliveryTrackingLink ? 'Update Delivery Tracking Link' : 'Add Delivery Tracking Link'}
                    </button>
                    {quote.deliveryTrackingLink && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Current: <a href={quote.deliveryTrackingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{quote.deliveryTrackingLink}</a>
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
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

    const hasActiveFilters = orderSearch || orderFilterPayment !== 'all';

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

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setOrderSearch('');
                  setOrderFilterPayment('all');
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
                              {order.user?.name || order.userId?.name || 'Unknown User'}
                            </div>
                            <div className="text-sm text-gray-600">{order.user?.email || order.userId?.email}</div>
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
                          {order.products.slice(0, 2).map((p, i) => {
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
                          <button
                            onClick={() => handleOpenTrackingModal(order._id, 'order', order.deliveryTrackingLink)}
                            className={`p-2 rounded-lg transition-colors ${
                              order.deliveryTrackingLink 
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
                  {warranty.invoiceUrl && (
                    <a
                      href={warranty.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1.5 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      View Invoice
                    </a>
                  )}
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
                          {new Date(log.sentAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(log.sentAt).toLocaleTimeString()}
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
              <h2 className="text-3xl font-bold mb-2">Retailer Shipments</h2>
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
                  <th className="px-6 py-4">Status</th>
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
                        <div className="font-medium text-gray-900">{order.customerDetails?.name || 'Unknown'}</div>
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                          order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-700' :
                            order.orderStatus === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                          }`}>
                          {order.orderStatus}
                        </span>
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
                            View Invoice
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
  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'products', name: 'Products', icon: Package },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'retailers', name: 'Retailers', icon: Store },
    { id: 'quotes', name: 'Quotes', icon: FileText },
    { id: 'orders', name: 'Orders', icon: ShoppingCart },
    { id: 'shipments', name: 'Retailer-Customer Shipments', icon: Package },
    { id: 'warranties', name: 'Warranties', icon: Shield },
    { id: 'messages', name: 'Messages', icon: MessageSquare },
    { id: 'content', name: 'Content', icon: Edit },
    { id: 'emails', name: 'Email Logs', icon: Mail },
    { id: 'logs', name: 'Activity Logs', icon: ClipboardList },
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
                  <p className="text-xs font-semibold text-gray-500 uppercase">Status</p>
                  <span className={`inline-flex mt-1 px-2 py-1 rounded-full text-xs font-bold ${selectedDropshipOrder.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                    selectedDropshipOrder.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                    {selectedDropshipOrder.orderStatus.toUpperCase()}
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
                            <span className="font-medium text-gray-900">{item.productId?.name}</span>
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

                  {/* Management Actions */}
                  <div className="bg-white border rounded-xl p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Shipment Actions</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={async () => {
                          if (window.confirm('Mark this shipment as SHIPPED?')) {
                            try {
                              await api.put(`/api/orders/${selectedDropshipOrder._id}`, { status: 'shipped' });
                              alert('Order marked as shipped');
                              loadDropshipOrders();
                              setShowDropshipModal(false);
                            } catch (err) {
                              alert('Failed to update status');
                            }
                          }
                        }}
                        disabled={selectedDropshipOrder.orderStatus === 'shipped' || selectedDropshipOrder.orderStatus === 'delivered'}
                        className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors ${selectedDropshipOrder.orderStatus === 'shipped' || selectedDropshipOrder.orderStatus === 'delivered'
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                      >
                        <Truck className="w-4 h-4" /> Mark Shipped
                      </button>

                      <button
                        onClick={async () => {
                          if (window.confirm('Mark this shipment as DELIVERED?')) {
                            try {
                              await api.put(`/api/orders/${selectedDropshipOrder._id}`, { status: 'delivered' });
                              alert('Order marked as delivered');
                              loadDropshipOrders();
                              setShowDropshipModal(false);
                            } catch (err) {
                              alert('Failed to update status');
                            }
                          }
                        }}
                        disabled={selectedDropshipOrder.orderStatus === 'delivered'}
                        className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors ${selectedDropshipOrder.orderStatus === 'delivered'
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                      >
                        <CheckCircle className="w-4 h-4" /> Mark Delivered
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
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  Order Summary
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Order Date</p>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedOrder.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-gray-500">{new Date(selectedOrder.createdAt).toLocaleTimeString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Payment Status</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedOrder.paymentStatus === 'completed' || selectedOrder.paymentStatus === 'paid'
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
                      onClick={() => handleOpenTrackingModal(selectedOrder._id, 'order', selectedOrder.deliveryTrackingLink)}
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
                      handleOpenTrackingModal(selectedOrder._id, 'order', selectedOrder.deliveryTrackingLink);
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
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                  selectedUser360.role === 'admin' ? 'bg-purple-500' :
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
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedUser360.role === 'admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
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
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                order.paymentStatus === 'completed' || order.paymentStatus === 'paid'
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
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                quote.status === 'responded' ? 'bg-green-100 text-green-800' :
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
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                warranty.status === 'approved' ? 'bg-green-100 text-green-800' :
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
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  item.status === 'in_stock' ? 'bg-green-100 text-green-800' :
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 text-sm mb-1">
                      Automatic Email Notification
                    </h4>
                    <p className="text-xs text-blue-700">
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
