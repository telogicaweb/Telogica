import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  LogOut
} from 'lucide-react';

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

interface TabConfig {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

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
  const [productUnits, setProductUnits] = useState<ProductUnit[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [productSearch, setProductSearch] = useState('');

  // Form states
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>(() => getFreshProductFormState());
  const [productUnitsForm, setProductUnitsForm] = useState<
    Array<{ serialNumber: string; modelNumber: string; warrantyPeriod: number }>
  >([]);

  // Product units modal state
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [selectedProductForUnits, setSelectedProductForUnits] = useState<Product | null>(null);
  const [showAddUnitsForm, setShowAddUnitsForm] = useState(false);
  const [newUnits, setNewUnits] = useState<Array<{ serialNumber: string; modelNumber: string; warrantyPeriod: number }>>([]);

  const [quoteResponse, setQuoteResponse] = useState({ id: '', response: '', price: '' });

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
      const response = await api.get(`/api/product-units/product/${productId}`);
      setProductUnits(response.data);
      setShowUnitsModal(true);
    } catch (error) {
      console.error('Error loading product units:', error);
    }
  };

  const handleAddUnits = async () => {
    if (!selectedProductForUnits) return;

    // Validate all fields are filled
    const invalidUnits = newUnits.filter(u => !u.serialNumber || !u.modelNumber);
    if (invalidUnits.length > 0) {
      const missingFields = invalidUnits.map((_, idx) => {
        const unitNumber = newUnits.indexOf(_) + 1;
        const missing = [];
        if (!_.serialNumber) missing.push('serial number');
        if (!_.modelNumber) missing.push('model number');
        return `Unit ${unitNumber}: ${missing.join(' and ')}`;
      }).join(', ');
      alert(`Please fill the following required fields:\n${missingFields}`);
      return;
    }

    try {
      await api.post('/api/product-units/add', {
        productId: selectedProductForUnits._id,
        units: newUnits.map(unit => ({
          serialNumber: unit.serialNumber,
          modelNumber: unit.modelNumber,
          warrantyPeriodMonths: unit.warrantyPeriod || DEFAULT_WARRANTY_MONTHS,
          stockType: 'both'
        }))
      });
      alert(`${newUnits.length} unit${newUnits.length > 1 ? 's' : ''} added successfully`);
      setNewUnits([]);
      setShowAddUnitsForm(false);
      // Reload product units and products
      loadProductUnits(selectedProductForUnits._id);
      loadProducts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to add units');
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
      };

      const productResponse = await api.post('/api/products', productData);
      const createdProduct = productResponse.data;

      // Step 2: Add product units
      await api.post('/api/product-units/add', {
        productId: createdProduct._id,
        units: productUnitsForm.map(unit => ({
          serialNumber: unit.serialNumber,
          modelNumber: unit.modelNumber,
          warrantyPeriodMonths: unit.warrantyPeriod || DEFAULT_WARRANTY_MONTHS,
          stockType: 'both'
        }))
      });

      alert('Product created successfully with all units');
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
      const productData = {
        name: productForm.name,
        description: productForm.description,
        category: productForm.category,
        price: productForm.normalPrice ? Number(productForm.normalPrice) : undefined,
        retailerPrice: productForm.retailerPrice ? Number(productForm.retailerPrice) : undefined,
        images: productForm.images,
        requiresQuote: productForm.requiresQuote || !productForm.normalPrice,
        isRecommended: productForm.isRecommended,
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

  // Quote Management
  const handleRespondToQuote = async (quoteId: string) => {
    if (!quoteResponse.response || !quoteResponse.price) {
      alert('Please provide response and quoted price');
      return;
    }
    try {
      // Compute discountPercentage if original total is available in quote.products
      // Send to backend using the /respond endpoint
      await api.put(`/api/quotes/${quoteId}/respond`, {
        totalPrice: Number(quoteResponse.price),
        discountPercentage: 0,
        message: quoteResponse.response,
      });
      alert('Quote response sent successfully');
      setQuoteResponse({ id: '', response: '', price: '' });
      loadQuotes();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to respond to quote');
    }
  };

  const handleRejectQuote = async (quoteId: string) => {
    const reason = window.prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      await api.put(`/api/quotes/${quoteId}/reject`);
      // Optionally you could send reason via another endpoint or email log
      alert('Quote rejected successfully');
      loadQuotes();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to reject quote');
    }
  };

  // Order Management
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.put(`/api/orders/${orderId}`, { status });
      alert('Order status updated successfully');
      loadOrders();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update order status');
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
      Status: o.orderStatus,
      PaymentStatus: o.paymentStatus,
      Date: new Date(o.createdAt).toLocaleDateString(),
      ItemsCount: o.products.length,
      ProductsDetails: o.products.map(p =>
        `${p.productId?.name || 'Unknown'} (Qty: ${p.quantity}) ${p.serialNumbers?.length ? `[SN: ${p.serialNumbers.join(', ')}]` : ''}`
      ).join('; ')
    }));
    downloadCSV(data, `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Render Dashboard/Analytics Tab
  const renderDashboard = () => {
    const conversionRate =
      typeof analytics.quotes.conversionRate === 'number'
        ? analytics.quotes.conversionRate.toFixed(2)
        : analytics.quotes.conversionRate;



    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Sales</p>
                <p className="text-3xl font-bold">{formatCurrency(analytics.sales.total)}</p>
              </div>
              <DollarSign className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Orders</p>
                <p className="text-3xl font-bold">{formatNumber(analytics.orders.total)}</p>
              </div>
              <ShoppingCart className="w-12 h-12 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-lg text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Pending Quotes</p>
                <p className="text-3xl font-bold">{formatNumber(analytics.quotes.pending)}</p>
                <p className="text-xs text-yellow-200 mt-2">
                  Conversion: {conversionRate}%
                </p>
              </div>
              <FileText className="w-12 h-12 text-yellow-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Pending Warranties</p>
                <p className="text-3xl font-bold">{formatNumber(analytics.warranties.pending)}</p>
              </div>
              <Shield className="w-12 h-12 text-purple-200" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Direct Sales</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(analytics.sales.direct)}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Quote Sales</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(analytics.sales.quote)}</p>
              </div>
              <BarChart3 className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-gray-800">{formatNumber(analytics.users.total)}</p>
              </div>
              <Users className="w-10 h-10 text-purple-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Retailers Waiting Approval</p>
                <p className="text-2xl font-bold text-gray-800">{formatNumber(analytics.users.pendingRetailers)}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="text-xs uppercase tracking-wide text-blue-600">Inventory - Total</p>
            <p className="text-2xl font-bold text-blue-900">{formatNumber(analytics.inventory.total)}</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-lg p-4">
            <p className="text-xs uppercase tracking-wide text-green-600">Inventory Online</p>
            <p className="text-2xl font-bold text-green-900">{formatNumber(analytics.inventory.online)}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
            <p className="text-xs uppercase tracking-wide text-yellow-600">Inventory Offline</p>
            <p className="text-2xl font-bold text-yellow-900">{formatNumber(analytics.inventory.offline)}</p>
          </div>
        </div>
      </div>
    );
  };

  // Render Products Tab
  const renderProducts = () => {
    const searchTerm = productSearch.trim().toLowerCase();
    const filteredProducts = products.filter((product) => {
      if (!searchTerm) return true;
      const combined = `${product.name} ${product.category}`.toLowerCase();
      return combined.includes(searchTerm);
    });

    const totalStock = products.reduce(
      (acc, product) => acc + (product.stockQuantity ?? 0) + (product.stock ?? 0),
      0
    );
    const lowStockCount = products.filter((product) => (product.stockQuantity ?? 0) <= 5).length;
    const quoteOnlyCount = products.filter((product) => product.requiresQuote).length;
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
              onClick={() => setShowProductForm(!showProductForm)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:from-blue-600 hover:to-indigo-700"
            >
              <Plus className="w-4 h-4" />
              {showProductForm ? 'Hide Form' : 'Add Product'}
            </button>
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
                  <input
                    type="text"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter category"
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
  const renderUsers = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">User Management</h2>

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
                          className="text-green-600 hover:text-green-800"
                          title="Approve Retailer"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
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

  // Render Quotes Tab
  const renderQuotes = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Quote Management</h2>
        <button
          onClick={exportQuotes}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="space-y-4">
        {quotes.map((quote) => (
          <div
            key={quote._id}
            className="bg-white p-6 rounded-lg shadow border border-gray-200"
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
                  : quote.status === 'approved'
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
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Response
                  </label>
                  <textarea
                    value={
                      quoteResponse.id === quote._id ? quoteResponse.response : ''
                    }
                    onChange={(e) =>
                      setQuoteResponse({
                        ...quoteResponse,
                        id: quote._id,
                        response: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your response..."
                  />
                </div>
                <div className="w-40">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Quoted Price (₹)
                  </label>
                  <input
                    type="number"
                    value={quoteResponse.id === quote._id ? quoteResponse.price : ''}
                    onChange={(e) =>
                      setQuoteResponse({
                        ...quoteResponse,
                        id: quote._id,
                        price: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="Price"
                  />
                </div>
                <button
                  onClick={() => handleRespondToQuote(quote._id)}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleRejectQuote(quote._id)}
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

  // Render Orders Tab
  const renderOrders = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Order Management</h2>
        <button
          onClick={exportOrders}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
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
                  Status
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
                <tr key={order._id} className="hover:bg-gray-50">
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
                      value={order.orderStatus}
                      onChange={(e) =>
                        handleUpdateOrderStatus(order._id, e.target.value)
                      }
                      className={`px-2 py-1 rounded text-xs font-medium border-0 ${order.orderStatus === 'delivered'
                        ? 'bg-green-100 text-green-800'
                        : order.orderStatus === 'shipped'
                          ? 'bg-blue-100 text-blue-800'
                          : order.orderStatus === 'processing'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
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

  // Render Warranties Tab
  const renderWarranties = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Warranty Management</h2>

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
      <h2 className="text-2xl font-bold text-gray-800">Email Logs</h2>

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
      <h2 className="text-2xl font-bold text-gray-800">Contact Messages</h2>

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
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Retailer Management</h2>
                  <button
                    onClick={() => navigate('/admin/retailer-management')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                  >
                    <Store className="w-4 h-4" />
                    Open Full Dashboard
                  </button>
                </div>
                <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
                  <p className="text-indigo-800">
                    Click "Open Full Dashboard" to access the comprehensive retailer management panel with analytics,
                    individual retailer details, inventory tracking, and sales history.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">Total Retailers</p>
                        <p className="text-2xl font-bold text-gray-800">
                          {users.filter(u => u.role === 'retailer').length}
                        </p>
                      </div>
                      <Users className="w-10 h-10 text-indigo-500" />
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">Pending Approval</p>
                        <p className="text-2xl font-bold text-gray-800">
                          {users.filter(u => u.role === 'retailer' && !u.isApproved).length}
                        </p>
                      </div>
                      <Clock className="w-10 h-10 text-yellow-500" />
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">Active Retailers</p>
                        <p className="text-2xl font-bold text-gray-800">
                          {users.filter(u => u.role === 'retailer' && u.isApproved).length}
                        </p>
                      </div>
                      <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b">
                    <h3 className="font-semibold text-gray-800">Recent Retailers</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {users.filter(u => u.role === 'retailer').slice(0, 5).map(retailer => (
                          <tr key={retailer._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{retailer.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{retailer.email}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${retailer.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {retailer.isApproved ? 'Active' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {!retailer.isApproved && (
                                <button
                                  onClick={() => handleApproveRetailer(retailer._id)}
                                  className="text-green-600 hover:text-green-800"
                                  title="Approve"
                                >
                                  <Check className="w-4 h-4" />
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
            )}
            {activeTab === 'quotes' && renderQuotes()}
            {activeTab === 'orders' && renderOrders()}
            {activeTab === 'warranties' && renderWarranties()}
            {activeTab === 'messages' && renderContacts()}
            {activeTab === 'content' && renderContentManagement()}
            {activeTab === 'emails' && renderEmailLogs()}
          </>
        )}

        {/* Product Units Modal */}
        {showUnitsModal && selectedProductForUnits && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Product Units</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedProductForUnits.name} - Total Units: {productUnits.length}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUnitsModal(false);
                      setSelectedProductForUnits(null);
                      setShowAddUnitsForm(false);
                      setNewUnits([]);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Add Units Button */}
                <div className="mb-4">
                  <button
                    onClick={() => setShowAddUnitsForm(!showAddUnitsForm)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {showAddUnitsForm ? 'Hide Add Units Form' : 'Add New Units'}
                  </button>
                </div>

                {/* Add Units Form */}
                {showAddUnitsForm && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Add New Units</h3>
                    <div className="space-y-3">
                      {newUnits.map((unit, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-white p-3 rounded">
                          <input
                            type="text"
                            placeholder="Serial Number"
                            value={unit.serialNumber}
                            onChange={(e) => {
                              const updated = [...newUnits];
                              updated[idx].serialNumber = e.target.value;
                              setNewUnits(updated);
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <input
                            type="text"
                            placeholder="Model Number"
                            value={unit.modelNumber}
                            onChange={(e) => {
                              const updated = [...newUnits];
                              updated[idx].modelNumber = e.target.value;
                              setNewUnits(updated);
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <input
                            type="number"
                            placeholder="Warranty (months)"
                            value={unit.warrantyPeriod}
                            onChange={(e) => {
                              const updated = [...newUnits];
                              updated[idx].warrantyPeriod = parseInt(e.target.value) || DEFAULT_WARRANTY_MONTHS;
                              setNewUnits(updated);
                            }}
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            onClick={() => setNewUnits(newUnits.filter((_, i) => i !== idx))}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setNewUnits([...newUnits, { serialNumber: '', modelNumber: '', warrantyPeriod: DEFAULT_WARRANTY_MONTHS }])}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                      >
                        + Add Another Unit
                      </button>
                      {newUnits.length > 0 && (
                        <button
                          onClick={handleAddUnits}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                        >
                          Save Units
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Units List */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial Number</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model Number</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warranty</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {productUnits.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                            No units found. Add units to this product.
                          </td>
                        </tr>
                      ) : (
                        productUnits.map((unit) => (
                          <tr key={unit._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {unit.serialNumber}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {unit.modelNumber}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${unit.status === 'available'
                                  ? 'bg-green-100 text-green-800'
                                  : unit.status === 'sold'
                                    ? 'bg-blue-100 text-blue-800'
                                    : unit.status === 'reserved'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                              >
                                {unit.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {unit.warrantyPeriod || DEFAULT_WARRANTY_MONTHS} months
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {unit.soldTo || '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
