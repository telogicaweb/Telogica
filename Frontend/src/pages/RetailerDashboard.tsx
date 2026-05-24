import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import InputModal from '../components/ui/InputModal';
import {
  Package,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  FileText,
  BarChart3,
  Clock,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Download,
  Search,
  Store,
  Tag,
  Loader,
  Truck,
  ArrowUpRight,
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';

interface DashboardStats {
  inventory: {
    inStock: number;
    sold: number;
    returned: number;
    damaged: number;
    totalValue: number;
  };
  sales: {
    totalSales: number;
    totalRevenue: number;
    totalProfit: number;
    avgSalePrice: number;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
    totalSpent: number;
  };
  quotes: {
    total: number;
    pending: number;
    responded: number;
    accepted: number;
  };
  recentSales: any[];
  monthlySales: any[];
}

interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  price?: number;
  retailerPrice?: number;
  images?: string[];
  stock: number;
  requiresQuote: boolean;
}

interface InventoryItem {
  _id: string;
  product: any;
  productUnit: any;
  purchaseDate: string;
  purchasePrice: number;
  status: string;
  soldTo?: any;
  soldDate?: string;
  sellingPrice?: number;
}

interface Quote {
  _id: string;
  products: any[];
  message?: string;
  status: string;
  adminResponse?: any;
  createdAt: string;
  orderId?: string;
  type?: 'standard' | 'bulk_order';
}

interface Order {
  _id: string;
  orderNumber?: string;
  products: any[];
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
}

interface Sale {
  _id: string;
  product: any;
  customer: any;
  saleDate: string;
  sellingPrice: number;
  profit: number;
  warrantyStatus: string;
  productDetails: any;
  invoiceNumber?: string;
  invoiceUrl?: string;
}

interface QuotedProduct {
  _id: string;
  product: {
    _id: string;
    name: string;
    description?: string;
    category?: string;
    images?: string[];
    stock: number;
  };
  quotedPrice: number;
  originalPrice?: number;
  updatedAt: string;
}

const RetailerDashboard = () => {
  const authContext = useContext(AuthContext);
  const cartContext = useContext(CartContext);
  const user = authContext?.user;
  const addToCart = cartContext?.addToCart;
  const navigate = useNavigate();
  const { success, error, warning, info } = useToast();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    if (authContext?.logout) {
      authContext.logout();
      navigate('/login');
    }
  };

  // Generic Modal States
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => { },
    isDestructive: false,
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });

  const [inputModal, setInputModal] = useState({
    isOpen: false,
    title: '',
    label: '',
    initialValue: '',
    placeholder: '',
    onConfirm: async (_val: string) => { },
    inputType: 'text',
    required: true
  });

  const closeConfirmationModal = () => setConfirmationModal(prev => ({ ...prev, isOpen: false }));
  const closeInputModal = () => setInputModal(prev => ({ ...prev, isOpen: false }));

  // Dashboard stats
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('');

  // Inventory
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryFilter, setInventoryFilter] = useState('all');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState('');

  // Quotes
  const [quotes, setQuotes] = useState<Quote[]>([]);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderFilter, setOrderFilter] = useState('monthly');
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);

  // Sales
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesFilter, setSalesFilter] = useState('monthly');

  // Quoted Products
  const [quotedProducts, setQuotedProducts] = useState<QuotedProduct[]>([]);

  // Sell modal
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [sellFormData, setSellFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    sellingPrice: '',
    customerInvoice: '',
    invoiceNumber: '',
    soldDate: new Date().toISOString().split('T')[0]
  });



  useEffect(() => {
    if (authContext?.loading) {
      return; // Wait for auth to load
    }
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'retailer') {
      navigate('/');
      return;
    }
    // Only load if not already loaded
    if (!stats) {
      loadDashboardData();
    }
  }, [user, authContext?.loading, navigate]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.allSettled([
        loadStats(),
        loadProducts(),
        loadInventory(),
        loadQuotes(),
        loadOrders(),
        loadSales(),
        loadQuotedProducts()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await api.get('/api/retailer/dashboard');
      setStats(res.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await api.get('/api/products');
      setProducts(res.data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadInventory = async () => {
    try {
      const res = await api.get('/api/retailer-inventory/my-inventory');
      setInventory(res.data);
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  const loadQuotes = async () => {
    try {
      const res = await api.get('/api/quotes');
      setQuotes(res.data);
    } catch (error) {
      console.error('Error loading quotes:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await api.get('/api/orders/myorders');
      setOrders(res.data);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const loadSales = async () => {
    try {
      const res = await api.get('/api/retailer/sales');
      setSales(res.data.sales || []);
    } catch (error) {
      console.error('Error loading sales:', error);
    }
  };

  const loadQuotedProducts = async () => {
    try {
      const res = await api.get('/api/quoted-products/my-products');
      setQuotedProducts(res.data);
    } catch (error) {
      console.error('Error loading quoted products:', error);
    }
  };

  const acceptQuote = (quote: Quote) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Accept Quote',
      message: quote.type === 'bulk_order'
        ? 'Accepting this bulk quote will proceed directly to checkout. Continue?'
        : 'Are you sure you want to accept this quote?',
      confirmText: quote.type === 'bulk_order' ? 'Accept & Checkout' : 'Accept Quote',
      cancelText: 'Cancel',
      isDestructive: false,
      onConfirm: async () => {
        setLoading(true);
        try {
          await api.put(`/api/quotes/${quote._id}/accept`, {});

          if (quote.type === 'bulk_order') {
            success('Quote accepted! Proceeding to checkout...');
            loadQuotes();
            // Important: For bulk orders, launch checkout immediately
            // We need to wait slightly for state to update or just pass the current quote object
            // But we need the updated status if proceedToCheckout checks it? 
            // proceedToCheckout implementation uses the passed quote object. 
            // We should act on the quote object we have, assuming acceptance was successful.
            proceedToCheckout(quote);
          } else {
            success('Quote accepted! Products have been added to your Quoted Products.');
            loadQuotes();
            loadQuotedProducts();
          }
        } catch (err: any) {
          error(err.response?.data?.message || 'Failed to accept quote');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const rejectQuote = (quoteId: string) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Reject Quote',
      message: 'Are you sure you want to reject this quote?',
      confirmText: 'Reject Quote',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        setLoading(true);
        try {
          await api.put(`/api/quotes/${quoteId}/reject`, {});
          info('Quote rejected.');
          loadQuotes();
        } catch (err: any) {
          error(err.response?.data?.message || 'Failed to reject quote');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const proceedToCheckout = async (quote: Quote) => {
    // Filter out invalid products
    const validItems = quote.products.filter((item: any) => (item.product && item.product._id) || (item.productId && item.productId._id));

    if (validItems.length === 0) {
      error('Cannot proceed: All products in this quote are no longer available.');
      return;
    }

    const startCheckout = () => {
      setInputModal({
        isOpen: true,
        title: 'Shipping Address',
        label: 'Enter shipping address:',
        initialValue: user?.address || '',
        placeholder: '123 Main St, City, Country',
        required: true,
        inputType: 'text',
        onConfirm: async (shippingAddress) => {
          if (!shippingAddress) return;
          processOrder(quote, validItems, shippingAddress);
        }
      });
    };

    if (validItems.length < quote.products.length) {
      setConfirmationModal({
        isOpen: true,
        title: 'Items Unavailable',
        message: 'Some products in this quote are no longer available. Do you want to proceed with the remaining items?',
        confirmText: 'Proceed',
        cancelText: 'Cancel',
        isDestructive: false,
        onConfirm: async () => {
          startCheckout();
        }
      });
    } else {
      startCheckout();
    }
  };

  const processOrder = async (quote: Quote, validItems: any[], shippingAddress: string) => {
    setLoading(true);
    try {
      const totalPrice = quote.adminResponse?.totalPrice || 0;
      const totalQty = validItems.reduce((sum: number, p: any) => sum + p.quantity, 0);

      const products = validItems.map((item: any) => ({
        product: item.product?._id || item.productId?._id,
        quantity: item.quantity,
        price: item.offeredPrice || (totalQty > 0 ? totalPrice / totalQty : 0)
      }));

      const { data } = await api.post('/api/orders', {
        products,
        totalAmount: totalPrice,
        quoteId: quote._id,
        shippingAddress
      });

      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_Rnat5mGdrSJJX4";

      const options = {
        key: razorpayKey,
        amount: data.razorpayOrder.amount,
        currency: data.razorpayOrder.currency,
        name: "Telogica",
        description: "Retailer Bulk Order",
        order_id: data.razorpayOrder.id,
        handler: async function (response: any) {
          try {
            await api.post('/api/orders/verify', {
              orderId: data.order._id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            success('Payment Successful! Products will be added to your inventory.');
            loadDashboardData();
          } catch {
            error('Payment Verification Failed');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: "#3399cc" }
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.on('payment.failed', function (response: any) {
        error(response.error.description);
      });
      rzp1.open();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const openSellModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setSellFormData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      sellingPrice: '',
      customerInvoice: '',
      invoiceNumber: '',
      soldDate: new Date().toISOString().split('T')[0]
    });
    setShowSellModal(true);
  };

  const handleSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellFormData.customerInvoice) {
      warning('Please enter customer invoice URL.');
      return;
    }
    setLoading(true);
    try {
      await api.post(`/api/retailer-inventory/${selectedItem?._id}/sell`, sellFormData);
      success('Product sold successfully! Warranty registered for customer.');
      setShowSellModal(false);
      loadDashboardData();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to record sale');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'accepted':
      case 'approved':
      case 'in_stock': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'responded': return 'bg-blue-100 text-blue-800';
      case 'sold': return 'bg-purple-100 text-purple-800';
      case 'cancelled':
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value: number) => `₹${(value || 0).toLocaleString('en-IN')}`;

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      setDownloadingOrderId(orderId);
      const response = await api.get(`/api/orders/${orderId}/invoice`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${orderId}.pdf`); // Backend might set filename, but this is fallback
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      error('Failed to download invoice: ' + (err.response?.data?.message || err.message));
    } finally {
      setDownloadingOrderId(null);
    }
  };


  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.description?.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = !productCategory || p.category === productCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  // Filter inventory
  const filteredInventory = inventory.filter(item => {
    if (!item.product) return false;

    // Status filter
    if (inventoryFilter !== 'all' && item.status !== inventoryFilter) return false;

    // Search filter
    if (inventorySearch) {
      const searchLower = inventorySearch.toLowerCase();
      const nameMatch = item.product.name?.toLowerCase().includes(searchLower) || false;
      const descMatch = item.product.description?.toLowerCase().includes(searchLower) || false;
      if (!nameMatch && !descMatch) return false;
    }

    // Category filter
    if (inventoryCategory && item.product.category !== inventoryCategory) return false;

    return true;
  });

  // Get unique categories from all products for dropdown
  const inventoryCategories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'products', name: 'Products', icon: Package },
    { id: 'quoted-products', name: 'Quoted Products', icon: Tag },
    { id: 'quotes', name: 'Quotes', icon: FileText },
    { id: 'orders', name: 'Orders', icon: ShoppingCart },
    { id: 'inventory', name: 'Inventory', icon: Store },
    { id: 'sales', name: 'Sales', icon: DollarSign },
    { id: 'customer-shipments', name: 'Direct - Customer Shipments', icon: Truck },
  ];
  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* In Stock */}
        <div className="bg-white p-5 rounded-none border border-gray-200 border-t-4 border-t-indigo-500 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">In Stock</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.inventory.inStock || 0}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Products available</p>
            </div>
            <div className="bg-indigo-50 p-2.5 rounded-none border border-indigo-200/50">
              <Package className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Total Sales */}
        <div className="bg-white p-5 rounded-none border border-gray-200 border-t-4 border-t-green-500 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.sales.totalSales || 0}</p>
              <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider mt-1">{formatCurrency(stats?.sales.totalRevenue || 0)}</p>
            </div>
            <div className="bg-green-50 p-2.5 rounded-none border border-green-200/50">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Profit */}
        <div className="bg-white p-5 rounded-none border border-gray-200 border-t-4 border-t-purple-500 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Profit</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{formatCurrency(stats?.sales.totalProfit || 0)}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">From all sales</p>
            </div>
            <div className="bg-purple-50 p-2.5 rounded-none border border-purple-200/50">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Pending Quotes */}
        <div className="bg-white p-5 rounded-none border border-gray-200 border-t-4 border-t-orange-500 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pending Quotes</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats?.quotes.responded || 0}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Awaiting your action</p>
            </div>
            <div className="bg-orange-50 p-2.5 rounded-none border border-orange-200/50">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-none border border-gray-200 shadow-none">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Sales Summary</h3>
            <div className="flex bg-gray-50 border border-gray-200 rounded-none p-1">
              {['weekly', 'monthly', 'yearly'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSalesFilter(period)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-none transition-colors ${
                    salesFilter === period
                      ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={(() => {
                  let dataPoints = [];

                  if (salesFilter === 'weekly') {
                    dataPoints = Array.from({ length: 7 }, (_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() - (6 - i));
                      return d;
                    }).map(date => {
                      const dateStr = date.toISOString().split('T')[0];
                      const daySales = (sales || []).filter(s => s.saleDate.startsWith(dateStr))
                        .reduce((sum, s) => sum + (s.sellingPrice || 0), 0);
                      return { name: date.toLocaleString('default', { weekday: 'short' }).toUpperCase(), value: daySales };
                    });
                  } else if (salesFilter === 'monthly') {
                    dataPoints = Array.from({ length: 4 }, (_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() - ((3 - i) * 7));
                      return d;
                    }).map((date, i) => {
                      const weekStart = new Date(date);
                      weekStart.setDate(weekStart.getDate() - 6);
                      const weekSales = (sales || []).filter(s => {
                        const sDate = new Date(s.saleDate);
                        return sDate <= date && sDate > weekStart;
                      }).reduce((sum, s) => sum + (s.sellingPrice || 0), 0);
                      return { name: `WEEK ${i + 1}`, value: weekSales };
                    });
                  } else {
                    dataPoints = Array.from({ length: 12 }, (_, i) => {
                      const d = new Date();
                      d.setMonth(d.getMonth() - (11 - i));
                      return d;
                    }).map(date => {
                      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                      const monthSales = (sales || []).filter(s => s.saleDate.startsWith(monthKey))
                        .reduce((sum, s) => sum + (s.sellingPrice || 0), 0);
                      return { name: date.toLocaleString('default', { month: 'short' }).toUpperCase(), value: monthSales };
                    });
                  }
                  return dataPoints;
                })()}
              >
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} dy={10} />
                <Tooltip
                  formatter={(value: any) => [`₹${value.toLocaleString()}`, 'SALES']}
                  contentStyle={{ borderRadius: '0px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', padding: '8px' }}
                />
                <Area type="monotone" dataKey="value" stroke="#3B82F6" fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Sales Revenue</span>
            <span className="text-xl font-bold text-blue-600">{formatCurrency(stats?.sales.totalRevenue || 0)}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-none border border-gray-200 shadow-none">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Order Summary</h3>
            <div className="flex bg-gray-50 border border-gray-200 rounded-none p-1">
              {['weekly', 'monthly', 'yearly'].map((period) => (
                <button
                  key={period}
                  onClick={() => setOrderFilter(period)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-none transition-colors ${
                    orderFilter === period
                      ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={(() => {
                  let dataPoints = [];

                  if (orderFilter === 'weekly') {
                    dataPoints = Array.from({ length: 7 }, (_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() - (6 - i));
                      return d;
                    }).map(date => {
                      const dateStr = date.toISOString().split('T')[0];
                      const daySpend = orders.filter(o => o.createdAt.startsWith(dateStr))
                        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
                      return { name: date.toLocaleString('default', { weekday: 'short' }).toUpperCase(), spend: daySpend };
                    });
                  } else if (orderFilter === 'monthly') {
                    dataPoints = Array.from({ length: 4 }, (_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() - ((3 - i) * 7));
                      return d;
                    }).map((date, i) => {
                      const weekStart = new Date(date);
                      weekStart.setDate(weekStart.getDate() - 6);
                      const weekSpend = orders.filter(o => {
                        const oDate = new Date(o.createdAt);
                        return oDate <= date && oDate > weekStart;
                      }).reduce((sum, o) => sum + (o.totalAmount || 0), 0);
                      return { name: `WEEK ${i + 1}`, spend: weekSpend };
                    });
                  } else {
                    dataPoints = Array.from({ length: 12 }, (_, i) => {
                      const d = new Date();
                      d.setMonth(d.getMonth() - (11 - i));
                      return d;
                    }).map(date => {
                      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                      const monthSpend = orders.filter(o => o.createdAt.startsWith(monthKey))
                        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
                      return { name: date.toLocaleString('default', { month: 'short' }).toUpperCase(), spend: monthSpend };
                    });
                  }
                  return dataPoints;
                })()}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorOrderSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 'bold' }}
                  dy={10}
                />
                <YAxis
                  hide={true}
                />
                <Tooltip
                  formatter={(value: any) => [`₹${value.toLocaleString()}`, 'SPENT']}
                  contentStyle={{ borderRadius: '0px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', padding: '8px' }}
                />
                <Area
                  type="monotone"
                  dataKey="spend"
                  stroke="#8884d8"
                  fillOpacity={1}
                  fill="url(#colorOrderSpend)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Spent</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(stats?.orders.totalSpent || 0)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider flex items-center gap-1">
                <TrendingUp size={14} />
                Shopping Trend
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-none border border-gray-200 shadow-none">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">Recent Sales</h3>
        {stats?.recentSales && stats.recentSales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider">Product</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.recentSales.map((sale: any) => (
                  <tr key={sale._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{sale.product?.name || sale.productDetails?.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 font-semibold">{sale.customer?.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{new Date(sale.saleDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-950">{formatCurrency(sale.sellingPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8 text-xs font-bold uppercase tracking-wider">No recent sales</p>
        )}
      </div>
    </div>
  );

  const renderCustomerShipments = () => {
    const dropshipOrders = orders.filter(
      (order: any) => {
        const isDropshipValid = order.isDropship && order.customerDetails;
        if (!isDropshipValid) return false;

        if (customerSearch) {
          const searchLower = customerSearch.toLowerCase();
          const nameMatch = order.customerDetails.name.toLowerCase().includes(searchLower);
          const emailMatch = order.customerDetails.email.toLowerCase().includes(searchLower);
          const orderMatch = (order.orderNumber || order._id).toLowerCase().includes(searchLower);
          return nameMatch || emailMatch || orderMatch;
        }
        return true;
      }
    );

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest">Customer Shipments ({dropshipOrders.length})</h2>
            <p className="text-xs text-gray-500 mt-1 uppercase font-semibold">Track and download delivery notes for direct-to-customer dropship shipments</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by customer name, email..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-none focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-bold uppercase placeholder-gray-400 w-full md:w-64"
            />
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-none">
          <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">
            Dropshipping: These orders are shipped directly to your customers. You can download the delivery note (Customer Invoice) here.
          </p>
        </div>

        {dropshipOrders.length === 0 ? (
          <div className="bg-white rounded-none border border-gray-200 p-12 text-center shadow-none">
            <Truck size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-sm text-gray-900 font-bold uppercase tracking-wider mb-2">No customer shipments found</p>
          </div>
        ) : (
          <div className="bg-white rounded-none border border-gray-200 overflow-hidden shadow-none">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 font-black text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 text-left">Order Details</th>
                    <th className="px-6 py-3 text-left">Customer</th>
                    <th className="px-6 py-3 text-left">Products</th>
                    <th className="px-6 py-3 text-left">Payment</th>
                    <th className="px-6 py-3 text-left">Tracking Details</th>
                    <th className="px-6 py-3 text-left">Documents</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dropshipOrders.map((order: any) => (
                    <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-[10px] font-bold uppercase tracking-wider">
                          <p className="font-black text-gray-900 text-xs">{order.orderNumber || order._id.slice(-8).toUpperCase()}</p>
                          <p className="text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
                          <p className="font-black text-gray-950 mt-1">{formatCurrency(order.totalAmount)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[10px] font-bold uppercase tracking-wider">
                          <p className="font-black text-gray-900 text-xs">{order.customerDetails?.name}</p>
                          <p className="text-gray-400 mt-0.5">{order.customerDetails?.email}</p>
                          <p className="text-gray-400">{order.customerDetails?.phone}</p>
                          <p className="text-[9px] text-gray-450 mt-1 truncate max-w-xs font-mono lowercase">{order.customerDetails?.address}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-3">
                          {order.products.map((item: any, idx: number) => (
                            <div key={idx} className="border-b border-gray-150 pb-2 last:border-0 last:pb-0 last:mb-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="w-5 h-5 rounded-none bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-600 border border-gray-250">
                                  {item.quantity}
                                </span>
                                <span className="text-gray-900 font-bold text-xs uppercase tracking-wide">{item.product?.name || 'Unknown Product'}</span>
                              </div>
                              <div className="pl-7 text-[10px] text-gray-400 font-bold uppercase tracking-wider space-y-0.5">
                                {item.product?.modelNumberPrefix && (
                                  <p>Model: <span className="font-mono text-gray-650">{item.product.modelNumberPrefix}</span></p>
                                )}
                                {item.serialNumbers && item.serialNumbers.length > 0 && (
                                  <p>S/N: <span className="font-mono text-gray-655">{item.serialNumbers.join(', ')}</span></p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-none border text-[10px] font-black uppercase tracking-wider ${order.paymentStatus === 'completed' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                          {order.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[10px] font-bold uppercase tracking-wider">
                          {order.trackingId ? (
                            <div className="space-y-1.5">
                              <p className="text-gray-400">ID: <span className="font-mono text-gray-700 font-black">{order.trackingId}</span></p>
                              {order.deliveryTrackingLink ? (
                                <a
                                  href={order.deliveryTrackingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:text-indigo-800 font-black flex items-center gap-0.5 uppercase tracking-wide"
                                >
                                  Track Shipment
                                  <ArrowUpRight size={10} />
                                </a>
                              ) : (
                                <span className="text-gray-450 italic">No link</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Pending</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {order.customerInvoiceUrl ? (
                          <a
                            href={order.customerInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-blue-700 hover:text-blue-800 font-bold uppercase tracking-widest text-[10px]"
                          >
                            <FileText size={12} />
                            Customer Invoice
                          </a>
                        ) : (
                          <span className="text-[10px] text-gray-450 uppercase italic font-bold">Processing...</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDownloadInvoice(order._id)}
                          disabled={downloadingOrderId === order._id}
                          className="flex items-center gap-1.5 text-indigo-700 hover:text-indigo-800 font-bold uppercase tracking-widest text-[10px] disabled:opacity-50"
                        >
                          {downloadingOrderId === order._id ? (
                            <Loader size={12} className="animate-spin" />
                          ) : (
                            <Download size={12} />
                          )}
                          Get Tax Invoice
                        </button>
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

  // Render Products Tab
  const renderProducts = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest">Browse Products</h2>
          <p className="text-xs text-gray-500 mt-1 uppercase font-semibold">Special partner tier pricing and active catalogue</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-none focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-bold uppercase placeholder-gray-400"
            />
          </div>
          <select
            value={productCategory}
            onChange={(e) => setProductCategory(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-none focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-bold uppercase cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-none">
        <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">
          Retailer Benefits: You see special retailer pricing on products. Request a quote for bulk orders to get the best deals!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(product => (
          <div key={product._id} className="bg-white rounded-none border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
            {product.images && product.images[0] && (
              <div className="relative">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                <span className="absolute top-2 right-2 bg-white/95 text-gray-900 border border-gray-200 px-2 py-0.5 rounded-none text-[10px] font-black uppercase tracking-wider shadow-sm">
                  {product.category}
                </span>
              </div>
            )}
            <div className="p-5">
              <h3 className="font-bold text-sm uppercase tracking-wide text-gray-900 mb-2">{product.name}</h3>
              <p className="text-xs text-gray-500 mb-4 line-clamp-2 uppercase font-semibold">{product.description}</p>
              <div className="flex justify-between items-center mb-4">
                <div>
                  {product.retailerPrice ? (
                    <>
                      <p className="text-base font-black text-green-600">{formatCurrency(product.retailerPrice)}</p>
                      {product.price && (
                        <p className="text-[10px] text-gray-400 line-through font-bold uppercase">{formatCurrency(product.price)}</p>
                      )}
                    </>
                  ) : product.price ? (
                    <p className="text-base font-black text-gray-900">{formatCurrency(product.price)}</p>
                  ) : (
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Quote Required</p>
                  )}
                </div>
                <span className={`px-2 py-0.5 rounded-none border text-[10px] font-black uppercase tracking-wider ${
                  product.stock > 0 
                    ? 'bg-green-50 border-green-200 text-green-700' 
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>
              <button
                onClick={() => navigate(`/product/${product._id}`)}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-none hover:bg-indigo-700 text-xs font-black uppercase tracking-widest transition-colors"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderQuotedProducts = () => {
    const handleAddToCart = (quotedProduct: QuotedProduct) => {
      if (!addToCart) return;

      setInputModal({
        isOpen: true,
        title: 'Add to Cart',
        label: `Enter quantity for ${quotedProduct.product.name}`,
        initialValue: '1',
        placeholder: '1',
        inputType: 'number',
        required: true,
        onConfirm: async (val: string) => {
          const qty = parseInt(val);
          if (isNaN(qty) || qty <= 0) {
            error('Invalid quantity');
            return;
          }

          if (qty > quotedProduct.product.stock) {
            error(`Only ${quotedProduct.product.stock} units available.`);
            return;
          }

          addToCart(
            quotedProduct.product as any,
            qty,
            false,
            { id: quotedProduct._id, price: quotedProduct.quotedPrice }
          );

          setConfirmationModal({
            isOpen: true,
            title: 'Added to Cart',
            message: 'Product added to cart successfully. Do you want to go to cart now?',
            confirmText: 'Go to Cart',
            cancelText: 'Stay Here',
            isDestructive: false,
            onConfirm: async () => navigate('/cart')
          });
        }
      });
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest">Quoted Products</h2>
            <p className="text-xs text-gray-500 mt-1 uppercase font-semibold">Special negotiated pricing unlocked via accepted quotes</p>
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-none">
          <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">
            Your Special Prices: These products have been quoted specifically for you. You can order them anytime at the quoted price. Simply add them to your cart and proceed to checkout.
          </p>
        </div>

        {quotedProducts.length === 0 ? (
          <div className="bg-white rounded-none border border-gray-200 p-12 text-center shadow-none">
            <Tag size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-sm text-gray-900 font-bold uppercase tracking-wider mb-2">No quoted products yet</p>
            <p className="text-xs text-gray-500 mb-6 uppercase font-semibold">Request a quote and accept the admin's offer to unlock special pricing</p>
            <button
              onClick={() => navigate('/quote')}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-none hover:bg-indigo-700 text-xs font-black uppercase tracking-widest transition-colors"
            >
              Request a Quote
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quotedProducts.filter(qp => qp && qp.product).map(qp => {
              const stock = qp.product.stock || 0;
              return (
                <div key={qp._id} className="bg-white rounded-none border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                  {qp.product.images && qp.product.images[0] && (
                    <div className="relative">
                      <img
                        src={qp.product.images[0]}
                        alt={qp.product.name}
                        className="w-full h-48 object-cover"
                      />
                      <span className="absolute top-2 left-2 bg-green-600 text-white border border-green-700 px-2 py-0.5 rounded-none text-[10px] font-black uppercase tracking-wider shadow-sm">
                        Special Price
                      </span>
                      {qp.product.category && (
                        <span className="absolute top-2 right-2 bg-white/95 text-gray-900 border border-gray-200 px-2 py-0.5 rounded-none text-[10px] font-black uppercase tracking-wider shadow-sm">
                          {qp.product.category}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-bold text-sm uppercase tracking-wide text-gray-900 mb-2">{qp.product.name}</h3>
                    {qp.product.description && (
                      <p className="text-xs text-gray-500 mb-4 line-clamp-2 uppercase font-semibold">{qp.product.description}</p>
                    )}

                    <div className="bg-gray-50 border border-gray-200 rounded-none p-4 mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600 font-bold uppercase tracking-wider">Your Price:</span>
                        <span className="text-base font-black text-green-600">{formatCurrency(qp.quotedPrice)}</span>
                      </div>
                      {qp.originalPrice && qp.originalPrice > qp.quotedPrice && (
                        <div className="flex justify-between items-center border-t border-gray-200/50 pt-2 mt-2">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Original:</span>
                          <span className="text-xs text-gray-400 line-through font-bold">{formatCurrency(qp.originalPrice)}</span>
                        </div>
                      )}
                      {qp.originalPrice && qp.originalPrice > qp.quotedPrice && (
                        <div className="mt-2 text-[10px] text-green-700 font-black uppercase tracking-widest">
                          Save {Math.round(((qp.originalPrice - qp.quotedPrice) / qp.originalPrice) * 100)}% INSTANTLY
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-2 py-0.5 rounded-none border text-[10px] font-black uppercase tracking-wider ${
                        stock > 0 
                          ? 'bg-green-50 border-green-200 text-green-700' 
                          : 'bg-red-50 border-red-200 text-red-700'
                      }`}>
                        {stock > 0 ? `${stock} in stock` : 'Out of stock'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
                        Updated: {new Date(qp.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddToCart(qp)}
                      disabled={stock <= 0}
                      className="w-full bg-indigo-600 text-white py-2.5 rounded-none hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingCart size={16} />
                      Add to Cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Render Quotes Tab
  const renderQuotes = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest">My Quotes</h2>
          <p className="text-xs text-gray-500 mt-1 uppercase font-semibold">Active price requests and commercial negotiations history</p>
        </div>
        <button
          onClick={() => navigate('/quote')}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-none hover:bg-indigo-700 flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors shadow-sm"
        >
          <Plus size={16} />
          New Quote Request
        </button>
      </div>

      {/* Active Quotes Section */}
      <div className="mb-8">
        <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-4">Active Quotes</h3>
        {quotes.filter(q => q.status !== 'completed').length === 0 ? (
          <div className="bg-white rounded-none border border-gray-200 p-12 text-center shadow-none">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-sm text-gray-900 font-bold uppercase tracking-wider mb-2">No active quotes found</p>
            <p className="text-xs text-gray-500 mb-6 uppercase font-semibold">Create a new price negotiation request to begin</p>
            <button
              onClick={() => navigate('/quote')}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-none hover:bg-indigo-700 text-xs font-black uppercase tracking-widest transition-colors"
            >
              Request a Quote
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {quotes.filter(q => q.status !== 'completed').map(quote => (
              <div key={quote._id} className="bg-white rounded-none border border-gray-200 p-6 shadow-none hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2.5 py-0.5 rounded-none border text-[10px] font-black uppercase tracking-wider ${getStatusColor(quote.status)}`}>
                      {quote.status}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-none border text-[10px] font-black uppercase tracking-wider ml-2 ${
                      quote.type === 'bulk_order' 
                        ? 'bg-purple-50 border-purple-200 text-purple-700' 
                        : 'bg-blue-50 border-blue-200 text-blue-700'
                    }`}>
                      {quote.type === 'bulk_order' ? 'Bulk Order' : 'Price Request'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider ml-auto">{new Date(quote.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Products Requested:</h4>
                    <div className="space-y-2">
                      {quote.products.map((p: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-xs bg-gray-50 p-3 rounded-none border border-gray-200">
                          <div>
                            <p className="font-bold text-gray-900 uppercase tracking-wide">{p.product?.name || 'Unknown'}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Qty: {p.quantity}</p>
                          </div>
                          <div className="text-right">
                            {p.offeredPrice ? (
                              <>
                                <p className="font-black text-green-600">{formatCurrency(p.offeredPrice)}</p>
                                {(p.originalPrice || p.product?.price) && (
                                  <p className="text-[9px] text-gray-400 line-through font-bold">{formatCurrency(p.originalPrice || p.product?.price)}</p>
                                )}
                              </>
                            ) : (
                              <p className="text-gray-500 font-bold">
                                {(p.originalPrice || p.product?.price) ? formatCurrency(p.originalPrice || p.product?.price) : 'Price on Request'}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {quote.adminResponse && (
                    <div className="bg-indigo-50/50 p-4 rounded-none border border-indigo-100 mb-4">
                      <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-wider mb-3">Admin Offer Details</h4>

                      {/* Price Comparison */}
                      <div className="flex justify-between items-center mb-2 text-xs">
                        <span className="text-gray-500 uppercase font-bold">Original Total:</span>
                        <span className="text-gray-400 line-through decoration-red-500 font-bold">
                          {formatCurrency(quote.products.reduce((sum: number, p: any) => sum + ((p.originalPrice || p.product?.price || 0) * p.quantity), 0))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-3 text-xs border-t border-indigo-200/50 pt-2">
                        <span className="font-black text-indigo-900 uppercase tracking-wider">Offered Total:</span>
                        <span className="text-base font-black text-green-600">{formatCurrency(quote.adminResponse.totalPrice)}</span>
                      </div>

                      {quote.adminResponse.discountPercentage > 0 && (
                        <div className="bg-green-100 border border-green-200 text-green-800 text-[10px] font-black px-2 py-0.5 rounded-none uppercase tracking-widest inline-block mb-3">
                          {quote.adminResponse.discountPercentage}% Savings Unlocked
                        </div>
                      )}

                      {quote.adminResponse.message && (
                        <div className="text-xs text-indigo-900 bg-white border border-indigo-100 p-3 rounded-none">
                          <span className="font-black uppercase tracking-wider text-[10px] block mb-1">Admin Remark:</span> {quote.adminResponse.message}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-150">
                  {quote.status === 'responded' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptQuote(quote)}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-none hover:bg-green-700 text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50"
                      >
                        <ThumbsUp size={14} />
                        {quote.type === 'bulk_order' ? 'Accept & Checkout' : 'Accept'}
                      </button>
                      <button
                        onClick={() => rejectQuote(quote._id)}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-none hover:bg-red-700 text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50"
                      >
                        <ThumbsDown size={14} />
                        Reject
                      </button>
                    </div>
                  )}

                  {quote.status === 'accepted' && (
                    <>
                      {quote.orderId ? (
                        <button
                          onClick={() => setActiveTab('orders')}
                          className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-none hover:bg-blue-700 transition-colors text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={14} />
                          Order Created - View in Orders
                        </button>
                      ) : (
                        <button
                          onClick={() => proceedToCheckout(quote)}
                          disabled={loading}
                          className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-none hover:bg-indigo-700 disabled:opacity-50 text-xs font-black uppercase tracking-widest transition-colors"
                        >
                          Proceed to Checkout
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quote History Section */}
      <div>
        <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-4">Quote History</h3>
        {quotes.filter(q => q.status === 'completed').length === 0 ? (
          <div className="text-center py-12 bg-gray-50 border border-gray-200 rounded-none shadow-none">
            <Clock size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">No completed negotiations found.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {quotes.filter(q => q.status === 'completed').map(quote => (
              <div key={quote._id} className="bg-white rounded-none border border-gray-200 p-6 opacity-85 hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none border text-[10px] font-black uppercase tracking-wider text-green-700 bg-green-50 border-green-200">
                      <CheckCircle size={12} />
                      Completed
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{new Date(quote.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Products Requested:</h4>
                    <div className="space-y-2">
                      {quote.products.map((p: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-xs bg-gray-50 p-3 rounded-none border border-gray-200">
                          <div>
                            <p className="font-bold text-gray-900 uppercase tracking-wide">{p.product?.name || 'Unknown'}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Qty: {p.quantity}</p>
                          </div>
                          <div className="text-right">
                            {p.offeredPrice ? (
                              <>
                                <p className="font-black text-green-600">{formatCurrency(p.offeredPrice)}</p>
                                {(p.originalPrice || p.product?.price) && (
                                  <p className="text-[9px] text-gray-400 line-through font-bold">{formatCurrency(p.originalPrice || p.product?.price)}</p>
                                )}
                              </>
                            ) : (
                              <p className="text-gray-500 font-bold">
                                {(p.originalPrice || p.product?.price) ? formatCurrency(p.originalPrice || p.product?.price) : 'Price on Request'}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {quote.adminResponse && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-gray-500 uppercase font-bold">Original Total:</span>
                        <span className="text-gray-400 line-through decoration-red-500 font-bold">
                          {formatCurrency(quote.products.reduce((sum: number, p: any) => sum + ((p.originalPrice || p.product?.price || 0) * p.quantity), 0))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-gray-200/50 pt-2 mt-2">
                        <span className="font-black text-gray-700 uppercase tracking-wider">Final Price:</span>
                        <span className="text-sm font-black text-green-600">{formatCurrency(quote.adminResponse.totalPrice)}</span>
                      </div>
                      {quote.adminResponse.discountPercentage > 0 && (
                        <div className="mt-3 text-right">
                          <span className="bg-green-50 border border-green-200 text-green-800 text-[10px] font-black px-2 py-0.5 rounded-none uppercase tracking-wider">
                            {quote.adminResponse.discountPercentage}% SAVED
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render Orders Tab
  const renderOrders = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest">My Orders</h2>
          <p className="text-xs text-gray-500 mt-1 uppercase font-semibold">Track your commercial order fulfillment and purchase invoices</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-none border border-gray-200 p-12 text-center shadow-none">
          <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-sm text-gray-900 font-bold uppercase tracking-wider mb-2">No orders found</p>
          <p className="text-xs text-gray-500 uppercase font-semibold">Your completed and active orders will be displayed here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order._id} className="bg-white rounded-none border border-gray-200 overflow-hidden shadow-none hover:shadow-md transition-shadow duration-200">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Order Reference</p>
                  <p className="font-bold text-xs uppercase tracking-wide mt-0.5">
                    #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                    {order.isDropship && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-none border text-[9px] font-black uppercase tracking-widest bg-blue-50 border-blue-200 text-blue-700">
                        Dropship
                      </span>
                    )}
                  </p>
                  {order.isDropship && order.customerDetails && (
                    <p className="text-[10px] text-blue-600 font-black uppercase tracking-wider mt-1">
                      Ship to: {order.customerDetails.name}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Date</p>
                  <p className="font-bold text-xs mt-0.5 text-gray-700">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total Amount</p>
                  <p className="font-black text-sm mt-0.5 text-gray-950">{formatCurrency(order.totalAmount)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-none border text-[10px] font-black uppercase tracking-wider ${getStatusColor(order.paymentStatus)}`}>
                    {order.paymentStatus.toUpperCase()}
                  </span>
                  <button
                    onClick={async () => {
                      if (downloadingOrderId) return;
                      setDownloadingOrderId(order._id);
                      try {
                        const response = await api.get(`/api/orders/${order._id}/invoice`, {
                          responseType: 'blob'
                        });
                        const url = window.URL.createObjectURL(new Blob([response.data]));
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', `invoice-${order.orderNumber || order._id}.pdf`);
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                      } catch (err: any) {
                        console.error('Error downloading invoice:', err);
                        error('Failed to download invoice');
                      } finally {
                        setDownloadingOrderId(null);
                      }
                    }}
                    disabled={downloadingOrderId === order._id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-indigo-700 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 rounded-none transition-colors disabled:opacity-50"
                    title="Download Invoice"
                  >
                    {downloadingOrderId === order._id ? (
                      <Loader size={12} className="animate-spin" />
                    ) : (
                      <Download size={12} />
                    )}
                    <span>{downloadingOrderId === order._id ? 'Downloading...' : 'Tax Invoice'}</span>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <ul className="divide-y divide-gray-200">
                  {order.products.map((p: any, idx: number) => (
                    <li key={idx} className="py-3 flex justify-between items-center last:pb-0 first:pt-0">
                      <div>
                        <p className="font-bold text-xs uppercase tracking-wide text-gray-900">{p.product?.name || 'Product'}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Qty: {p.quantity}</p>
                      </div>
                      <p className="font-black text-xs text-gray-950">{formatCurrency(p.price)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render Inventory Tab
  const renderInventory = () => (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest">My Inventory</h2>
          <p className="text-xs text-gray-500 mt-1 uppercase font-semibold">Monitor and record sales for in-stock retail product units</p>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search inventory..."
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-none focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-bold uppercase placeholder-gray-400 w-full md:w-64"
            />
          </div>

          <select
            value={inventoryCategory}
            onChange={(e) => setInventoryCategory(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-none focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-bold uppercase cursor-pointer"
          >
            <option value="">All Categories</option>
            {inventoryCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <div className="flex rounded-none border border-gray-200 overflow-hidden">
            {['all', 'in_stock', 'sold'].map(filter => (
              <button
                key={filter}
                onClick={() => setInventoryFilter(filter)}
                className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-colors border-r last:border-r-0 border-gray-200 ${inventoryFilter === filter
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
              >
                {filter === 'all' ? 'All' : filter === 'in_stock' ? 'In Stock' : 'Sold'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-none border border-gray-200 border-t-4 border-t-green-500 shadow-none">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">In Stock Units</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {inventory.filter(i => i.status === 'in_stock').length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-none border border-gray-200 border-t-4 border-t-blue-500 shadow-none">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sold Units</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {inventory.filter(i => i.status === 'sold').length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-none border border-gray-200 border-t-4 border-t-purple-500 shadow-none">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Book Value</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {formatCurrency(inventory.filter(i => i.status === 'in_stock').reduce((sum, i) => sum + i.purchasePrice, 0))}
          </p>
        </div>
      </div>

      {filteredInventory.length === 0 ? (
        <div className="bg-white rounded-none border border-gray-200 p-12 text-center shadow-none">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-sm text-gray-900 font-bold uppercase tracking-wider">No items in inventory</p>
        </div>
      ) : (
        <div className="bg-white rounded-none border border-gray-200 overflow-hidden shadow-none">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 font-black text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">Product</th>
                  <th className="px-6 py-3 text-left">Serial Number</th>
                  <th className="px-6 py-3 text-left">Purchase Price</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInventory.map(item => (
                  <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {item.product?.images?.[0] && (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-10 h-10 rounded-none border border-gray-200 object-cover mr-3"
                          />
                        )}
                        <span className="font-bold text-xs uppercase tracking-wide text-gray-900">{item.product?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-650 font-bold font-mono">
                      {item.productUnit?.serialNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-gray-950">
                      {formatCurrency(item.purchasePrice)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-none border text-[10px] font-black uppercase tracking-wider ${getStatusColor(item.status)}`}>
                        {item.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.status === 'in_stock' ? (
                        <button
                          onClick={() => openSellModal(item)}
                          className="text-indigo-700 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-none text-xs font-black uppercase tracking-widest transition-colors"
                        >
                          Record Sale
                        </button>
                      ) : item.soldTo ? (
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                          <p className="font-black text-gray-900">{item.soldTo.name}</p>
                          <p className="mt-0.5">{new Date(item.soldDate!).toLocaleDateString()}</p>
                        </div>
                      ) : null}
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

  // Render Sales Tab
  const renderSales = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest">Sales History</h2>
          <p className="text-xs text-gray-500 mt-1 uppercase font-semibold">Track your customer sales history, generated invoices, and warranty status</p>
        </div>
        <button
          onClick={() => {
            const data = sales.map(s => ({
              Product: s.productDetails?.name || s.product?.name,
              Customer: s.customer?.name,
              Email: s.customer?.email,
              Phone: s.customer?.phone,
              Address: s.customer?.address,
              InvoiceNumber: s.invoiceNumber || '',
              Date: new Date(s.saleDate).toLocaleDateString(),
              Price: s.sellingPrice,
              Profit: s.profit
            }));
            if (data.length === 0) {
              warning('No sales to export');
              return;
            }
            const headers = Object.keys(data[0]);
            const csv = [
              headers.join(','),
              ...data.map(row => headers.map(h => JSON.stringify((row as any)[h] ?? '')).join(','))
            ].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sales_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
          }}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-none hover:bg-indigo-700 flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors shadow-sm"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-none border border-gray-200 border-t-4 border-t-green-500 shadow-none">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Sales Record</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{sales.length}</p>
        </div>
        <div className="bg-white p-5 rounded-none border border-gray-200 border-t-4 border-t-blue-500 shadow-none">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Revenue</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            {formatCurrency(sales.reduce((sum, s) => sum + s.sellingPrice, 0))}
          </p>
        </div>
        <div className="bg-white p-5 rounded-none border border-gray-200 border-t-4 border-t-purple-500 shadow-none">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Net Profit</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {formatCurrency(sales.reduce((sum, s) => sum + (s.profit || 0), 0))}
          </p>
        </div>
      </div>

      {sales.length === 0 ? (
        <div className="bg-white rounded-none border border-gray-200 p-12 text-center shadow-none">
          <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-sm text-gray-900 font-bold uppercase tracking-wider mb-2">No sales recorded yet</p>
          <p className="text-xs text-gray-500 uppercase font-semibold">Record sales from your Inventory tab to view history</p>
        </div>
      ) : (
        <div className="bg-white rounded-none border border-gray-200 overflow-hidden shadow-none">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 font-black text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">Product</th>
                  <th className="px-6 py-3 text-left">Customer</th>
                  <th className="px-6 py-3 text-left">Invoice</th>
                  <th className="px-6 py-3 text-left">Sale Date</th>
                  <th className="px-6 py-3 text-left">Price</th>
                  <th className="px-6 py-3 text-left">Profit</th>
                  <th className="px-6 py-3 text-left">Warranty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sales.map(sale => (
                  <tr key={sale._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-xs uppercase tracking-wide text-gray-900">{sale.productDetails?.name || sale.product?.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold font-mono uppercase mt-0.5">{sale.productDetails?.serialNumber}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[10px] font-bold uppercase tracking-wider">
                        <p className="font-black text-gray-900 text-xs">{sale.customer?.name}</p>
                        <p className="text-gray-400 mt-0.5">{sale.customer?.email}</p>
                        <p className="text-gray-400">{sale.customer?.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[10px] font-bold uppercase tracking-wider">
                        {sale.invoiceNumber && (
                          <p className="font-black text-gray-900 font-mono">{sale.invoiceNumber}</p>
                        )}
                        {sale.invoiceUrl && (
                          <a
                            href={sale.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-650 hover:text-indigo-850 font-black mt-1 block uppercase"
                          >
                            View Invoice
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-700">
                      {new Date(sale.saleDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-gray-950">
                      {formatCurrency(sale.sellingPrice)}
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-green-700">
                      {formatCurrency(sale.profit || 0)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-none border text-[10px] font-black uppercase tracking-wider ${getStatusColor(sale.warrantyStatus)}`}>
                        {sale.warrantyStatus.toUpperCase()}
                      </span>
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

  if (!user || user.role !== 'retailer') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center rounded-none">
        <div className="text-center p-8 border border-gray-200 bg-white rounded-none">
          <h2 className="text-xl font-bold text-gray-900 mb-2 uppercase tracking-wide">Access Denied</h2>
          <p className="text-sm text-gray-600 uppercase tracking-wide font-bold">This page is only accessible to retailers.</p>
        </div>
      </div>
    );
  }

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
            let count = 0;
            if (tab.id === 'quotes') {
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
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/10 font-bold'
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
                        active ? 'bg-white text-indigo-700' : 'bg-red-500 text-white'
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
                <div className="bg-indigo-600/15 text-indigo-500 rounded-xl p-2 font-bold w-10 h-10 flex items-center justify-center border border-indigo-500/20">
                  {user?.name?.charAt(0).toUpperCase() || 'R'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-bold text-xs uppercase tracking-wider truncate">{user?.name || 'Retailer User'}</p>
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
      <div className="lg:hidden sticky top-0 z-50 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 h-[60px] w-full rounded-none">
        <div className="flex items-center gap-2">
          <div className="bg-white rounded-none p-1 flex-shrink-0">
            <img
              src="https://aishwaryatechtele.com/images/telogica_logo.png"
              alt="Telogica Logo"
              className="h-6 w-auto"
            />
          </div>
          <span className="font-extrabold text-xs text-white uppercase tracking-wider">Retailer</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadDashboardData()}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <Loader size={18} className={loading ? 'animate-spin' : ''} />
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
          <div className="absolute top-[60px] left-0 w-full bg-slate-950 border-b border-slate-800 shadow-2xl p-4 space-y-1 max-h-[75vh] overflow-y-auto z-50 animate-in slide-in-from-top duration-200 rounded-none">
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
                  className={`w-full flex items-center px-4 py-3 rounded-none transition-all ${
                    active
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  <span className="ml-3 text-xs font-bold uppercase tracking-wider">{tab.name}</span>
                </button>
              );
            })}
            <div className="border-t border-slate-800 pt-3 mt-3 flex justify-between items-center px-4 rounded-none">
              <div className="text-left min-w-0 flex-1 mr-2">
                <p className="text-white font-semibold text-xs truncate">{user?.name}</p>
                <p className="text-slate-500 text-[10px] truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600 hover:text-white text-xs font-bold rounded-none uppercase tracking-wider transition-colors"
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
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider font-sans">
              {tabs.find(t => t.id === activeTab)?.name || 'Retailer Dashboard'}
            </h2>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <button
                onClick={loadDashboardData}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200"
                title="Sync Dashboard Data"
              >
                <Loader size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="h-6 w-px bg-slate-200"></div>

            {/* Profile Avatar info */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800 leading-none">{user?.name || 'Retailer User'}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Partner Portal</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-bold flex items-center justify-center shadow-md">
                {user?.name?.slice(0, 2).toUpperCase() || 'RE'}
              </div>
            </div>
          </div>
        </header>

        {/* Viewport Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {loading && !stats ? (
            <div className="flex justify-center items-center h-96">
              <div className="animate-spin rounded-none h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'products' && renderProducts()}
              {activeTab === 'quoted-products' && renderQuotedProducts()}
              {activeTab === 'quotes' && renderQuotes()}
              {activeTab === 'orders' && renderOrders()}
              {activeTab === 'inventory' && renderInventory()}
              {activeTab === 'sales' && renderSales()}
              {activeTab === 'customer-shipments' && renderCustomerShipments()}
            </>
          )}
        </div>
      </main>

      {/* Sell Modal */}
      {showSellModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-none border border-gray-200 shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-200 pb-3 mb-4">Record Product Sale</h2>
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-none mb-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 space-y-1">
              <p>Product: <span className="font-black text-gray-900">{selectedItem.product?.name}</span></p>
              <p>Serial Number: <span className="font-mono text-gray-800 font-black">{selectedItem.productUnit?.serialNumber}</span></p>
            </div>

            <form onSubmit={handleSellSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Customer / Company Name *</label>
                  <input
                    type="text"
                    required
                    value={sellFormData.customerName}
                    onChange={(e) => setSellFormData({ ...sellFormData, customerName: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-none focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-bold uppercase placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Customer Email Address *</label>
                  <input
                    type="email"
                    required
                    value={sellFormData.customerEmail}
                    onChange={(e) => setSellFormData({ ...sellFormData, customerEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-none focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-bold uppercase placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Customer Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={sellFormData.customerPhone}
                    onChange={(e) => setSellFormData({ ...sellFormData, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-none focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-bold uppercase placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Final Selling Price *</label>
                  <input
                    type="number"
                    required
                    value={sellFormData.sellingPrice}
                    onChange={(e) => setSellFormData({ ...sellFormData, sellingPrice: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-none focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-bold uppercase placeholder-gray-400"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Billing / Delivery Address *</label>
                  <textarea
                    required
                    value={sellFormData.customerAddress}
                    onChange={(e) => setSellFormData({ ...sellFormData, customerAddress: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-none focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-bold uppercase placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Sale Date *</label>
                  <input
                    type="date"
                    required
                    value={sellFormData.soldDate}
                    onChange={(e) => setSellFormData({ ...sellFormData, soldDate: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-none focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-bold uppercase placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                    Invoice Number <span className="text-[9px] text-gray-400 font-normal uppercase">(Or leave blank to auto-generate)</span>
                  </label>
                  <input
                    type="text"
                    value={sellFormData.invoiceNumber}
                    onChange={(e) => setSellFormData({ ...sellFormData, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-none focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-bold uppercase placeholder-gray-400"
                    placeholder="e.g., INV-2026-001"
                  />
                </div>
                <div className="md:col-span-2 mt-2">
                  <div className="flex items-center gap-4 flex-wrap">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!sellFormData.customerName || !sellFormData.customerEmail || !sellFormData.sellingPrice) {
                          warning('Please fill in Customer Name, Email and Selling Price first');
                          return;
                        }
                        setLoading(true);
                        try {
                          const response = await api.post('/api/retailer-inventory/generate-invoice', {
                            inventoryId: selectedItem._id,
                            ...sellFormData
                          });
                          setSellFormData(prev => ({
                            ...prev,
                            customerInvoice: response.data.invoiceUrl,
                            invoiceNumber: response.data.invoiceNumber || prev.invoiceNumber
                          }));
                          success('Invoice generated successfully! Please verify it before recording the sale.');
                        } catch (err: any) {
                          error(err.response?.data?.message || 'Failed to generate invoice');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-none hover:bg-indigo-700 disabled:opacity-50 text-xs font-black uppercase tracking-widest transition-colors shadow-sm"
                    >
                      {loading ? 'Generating...' : 'Generate Invoice'}
                    </button>

                    {sellFormData.customerInvoice && (
                      <a
                        href={sellFormData.customerInvoice}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-indigo-700 hover:text-indigo-800 font-black text-xs uppercase tracking-widest"
                      >
                        <Download size={14} />
                        Download & Verify Invoice
                      </a>
                    )}
                  </div>
                  {!sellFormData.customerInvoice && (
                    <p className="text-[9px] text-gray-450 uppercase font-bold mt-2">
                      An invoice must be generated in order to record the sale.
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-none">
                <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">
                  Note: Once recorded, customer warranty gets auto-registered and standard notification emails will be sent out instantly.
                </p>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowSellModal(false)}
                  className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-none hover:bg-gray-50 text-xs font-black uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !sellFormData.customerInvoice}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-none hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-450 disabled:cursor-not-allowed text-xs font-black uppercase tracking-wider transition-colors shadow-sm"
                >
                  {loading ? 'Processing...' : 'Record Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Customer Invoice Modal */}

      {/* Generic Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={closeConfirmationModal}
        title={confirmationModal.title}
        message={confirmationModal.message}
        onConfirm={confirmationModal.onConfirm}
        isDestructive={confirmationModal.isDestructive}
        confirmText={confirmationModal.confirmText}
      />

      {/* Generic Input Modal */}
      <InputModal
        isOpen={inputModal.isOpen}
        onClose={closeInputModal}
        title={inputModal.title}
        label={inputModal.label}
        initialValue={inputModal.initialValue}
        placeholder={inputModal.placeholder}
        inputType={inputModal.inputType}
        onConfirm={inputModal.onConfirm}
        required={inputModal.required}
      />
    </div>
  );
};

export default RetailerDashboard;
