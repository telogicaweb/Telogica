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
  ArrowUpRight
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
  const [loading, setLoading] = useState(false);

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

  // Render Dashboard Tab
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">In Stock</p>
              <p className="text-3xl font-bold">{stats?.inventory.inStock || 0}</p>
              <p className="text-xs text-blue-200 mt-1">Products available</p>
            </div>
            <Package className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Sales</p>
              <p className="text-3xl font-bold">{stats?.sales.totalSales || 0}</p>
              <p className="text-xs text-green-200 mt-1">{formatCurrency(stats?.sales.totalRevenue || 0)}</p>
            </div>
            <DollarSign className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Profit</p>
              <p className="text-3xl font-bold">{formatCurrency(stats?.sales.totalProfit || 0)}</p>
              <p className="text-xs text-purple-200 mt-1">From all sales</p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-lg text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Pending Quotes</p>
              <p className="text-3xl font-bold">{stats?.quotes.responded || 0}</p>
              <p className="text-xs text-orange-200 mt-1">Awaiting your action</p>
            </div>
            <FileText className="w-12 h-12 text-orange-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Sales Summary</h3>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {['weekly', 'monthly', 'yearly'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSalesFilter(period)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${salesFilter === period
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
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
                    // Last 7 days
                    dataPoints = Array.from({ length: 7 }, (_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() - (6 - i));
                      return d;
                    }).map(date => {
                      const dateStr = date.toISOString().split('T')[0];
                      const daySales = (sales || []).filter(s => s.saleDate.startsWith(dateStr))
                        .reduce((sum, s) => sum + (s.sellingPrice || 0), 0);
                      return { name: date.toLocaleString('default', { weekday: 'short' }), value: daySales };
                    });
                  } else if (salesFilter === 'monthly') {
                    // Last 30 days (grouped by 5-day intervals or weeks for cleaner chart? Let's do last 4 weeks)
                    // Or just simply last 4 weeks.
                    dataPoints = Array.from({ length: 4 }, (_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() - ((3 - i) * 7));
                      return d;
                    }).map((date, i) => {
                      // Week starting from 'date'
                      const weekStart = new Date(date);
                      weekStart.setDate(weekStart.getDate() - 6); // Look back 7 days
                      // Approximation: Filter sales in this week window. 
                      // Actually, simpler to just group by week number or something. 
                      // Let's stick to simple "Last 4 Weeks" by aggregate
                      const weekSales = (sales || []).filter(s => {
                        const sDate = new Date(s.saleDate);
                        return sDate <= date && sDate > weekStart;
                      }).reduce((sum, s) => sum + (s.sellingPrice || 0), 0);
                      return { name: `Week ${i + 1}`, value: weekSales };
                    });
                  } else {
                    // Yearly - Last 12 months
                    dataPoints = Array.from({ length: 12 }, (_, i) => {
                      const d = new Date();
                      d.setMonth(d.getMonth() - (11 - i));
                      return d;
                    }).map(date => {
                      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                      const monthSales = (sales || []).filter(s => s.saleDate.startsWith(monthKey))
                        .reduce((sum, s) => sum + (s.sellingPrice || 0), 0);
                      return { name: date.toLocaleString('default', { month: 'short' }), value: monthSales };
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
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                <Tooltip
                  formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Sales']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#3B82F6" fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-gray-600 font-medium">Total Sales Revenue</span>
            <span className="text-xl font-bold text-blue-600">{formatCurrency(stats?.sales.totalRevenue || 0)}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Order Summary</h3>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {['weekly', 'monthly', 'yearly'].map((period) => (
                <button
                  key={period}
                  onClick={() => setOrderFilter(period)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${orderFilter === period
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
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
                    // Last 7 days
                    dataPoints = Array.from({ length: 7 }, (_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() - (6 - i));
                      return d;
                    }).map(date => {
                      const dateStr = date.toISOString().split('T')[0];
                      const daySpend = orders.filter(o => o.createdAt.startsWith(dateStr))
                        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
                      return { name: date.toLocaleString('default', { weekday: 'short' }), spend: daySpend };
                    });
                  } else if (orderFilter === 'monthly') {
                    // Last 4 weeks
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
                      return { name: `Week ${i + 1}`, spend: weekSpend };
                    });
                  } else {
                    // Yearly - Last 12 months
                    dataPoints = Array.from({ length: 12 }, (_, i) => {
                      const d = new Date();
                      d.setMonth(d.getMonth() - (11 - i));
                      return d;
                    }).map(date => {
                      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                      const monthSpend = orders.filter(o => o.createdAt.startsWith(monthKey))
                        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
                      return { name: date.toLocaleString('default', { month: 'short' }), spend: monthSpend };
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
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  dy={10}
                />
                <YAxis
                  hide={true}
                />
                <Tooltip
                  formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Spent']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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

          <div className="mt-4 flex justify-between items-end">
            <div>
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.orders.totalSpent || 0)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                <TrendingUp size={14} />
                Shopping Trend
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Sales</h3>
        {stats?.recentSales && stats.recentSales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.recentSales.map((sale: any) => (
                  <tr key={sale._id}>
                    <td className="px-4 py-2 text-sm text-gray-900">{sale.product?.name || sale.productDetails?.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{sale.customer?.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{new Date(sale.saleDate).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{formatCurrency(sale.sellingPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No recent sales</p>
        )}
      </div>
    </div>
  );

  // Render Customer Shipments Tab
  const renderCustomerShipments = () => {
    // Filter for dropship orders
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
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Customer Shipments ({dropshipOrders.length})</h2>
            <p className="text-sm text-gray-600 mt-1">Track your dropship orders and shipments to customers.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by customer name, email..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
            />
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <p className="text-sm text-blue-800">
            <strong>Dropshipping:</strong> These orders are shipped directly to your customers. You can download the delivery note (Customer Invoice) here.
          </p>
        </div>

        {dropshipOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Truck size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No customer shipments found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documents</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dropshipOrders.map((order: any) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{order.orderNumber || order._id}</p>
                          <p className="text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                          <p className="font-medium text-gray-900 mt-1">{formatCurrency(order.totalAmount)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{order.customerDetails?.name}</p>
                          <p className="text-gray-500">{order.customerDetails?.email}</p>
                          <p className="text-gray-500">{order.customerDetails?.phone}</p>
                          <p className="text-xs text-gray-400 mt-1 truncate max-w-xs">{order.customerDetails?.address}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm space-y-3">
                          {order.products.map((item: any, idx: number) => (
                            <div key={idx} className="border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                                  {item.quantity}
                                </span>
                                <span className="text-gray-900 font-medium">{item.product?.name || 'Unknown Product'}</span>
                              </div>
                              <div className="pl-7 text-xs text-gray-500 space-y-0.5">
                                {item.product?.modelNumberPrefix && (
                                  <p>Model: <span className="font-mono text-gray-700">{item.product.modelNumberPrefix}</span></p>
                                )}
                                {item.serialNumbers && item.serialNumbers.length > 0 && (
                                  <p>S/N: <span className="font-mono text-gray-700">{item.serialNumbers.join(', ')}</span></p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${order.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {order.paymentStatus.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {order.trackingId ? (
                            <div className="space-y-1">
                              <p className="font-medium text-gray-900">ID: <span className="font-mono text-gray-600">{order.trackingId}</span></p>
                              {order.deliveryTrackingLink ? (
                                <a
                                  href={order.deliveryTrackingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                                >
                                  Track Shipment
                                  <ArrowUpRight size={12} />
                                </a>
                              ) : (
                                <span className="text-gray-500 text-xs">No link available</span>
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
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            <FileText size={16} />
                            Customer Invoice
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">Processing...</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleDownloadInvoice(order._id)}
                            disabled={downloadingOrderId === order._id}
                            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium text-sm disabled:text-gray-400"
                          >
                            {downloadingOrderId === order._id ? (
                              <Loader size={16} className="animate-spin" />
                            ) : (
                              <Download size={16} />
                            )}
                            Get Tax Invoice
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div >
          </div >
        )}
      </div >
    );
  };

  // Render Products Tab
  const renderProducts = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Browse Products</h2>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={productCategory}
            onChange={(e) => setProductCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
        <p className="text-sm text-blue-800">
          <strong>Retailer Benefits:</strong> You see special retailer pricing on products. Request a quote for bulk orders to get the best deals!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(product => (
          <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {product.images && product.images[0] && (
              <div className="relative">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                <span className="absolute top-2 right-2 bg-white/90 text-gray-900 px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide shadow">
                  {product.category}
                </span>
              </div>
            )}
            <div className="p-4">
              <h3 className="font-bold text-lg text-gray-900 mb-2">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
              <div className="flex justify-between items-center mb-3">
                <div>
                  {product.retailerPrice ? (
                    <>
                      <p className="text-lg font-bold text-green-600">₹{product.retailerPrice}</p>
                      {product.price && (
                        <p className="text-sm text-gray-400 line-through">₹{product.price}</p>
                      )}
                    </>
                  ) : product.price ? (
                    <p className="text-lg font-bold text-gray-900">₹{product.price}</p>
                  ) : (
                    <p className="text-sm text-blue-600 font-medium">Quote Required</p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>
              <button
                onClick={() => navigate(`/product/${product._id}`)}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render Quoted Products Tab
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
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quoted Products</h2>
            <p className="text-sm text-gray-600 mt-1">Products with special pricing from accepted quotes. Add to cart to purchase.</p>
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <p className="text-sm text-blue-800">
            <strong>Your Special Prices:</strong> These products have been quoted specifically for you. You can order them anytime at the quoted price.
            Simply add them to your cart and proceed to checkout (Direct or Dropship).
          </p>
        </div>

        {quotedProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Tag size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">No quoted products yet</p>
            <p className="text-sm text-gray-400 mb-4">Request a quote and accept the admin's offer to get special pricing</p>
            <button
              onClick={() => navigate('/quote')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Request a Quote
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quotedProducts.filter(qp => qp && qp.product).map(qp => {
              const stock = qp.product.stock || 0;
              return (
                <div key={qp._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                  {qp.product.images && qp.product.images[0] && (
                    <div className="relative">
                      <img
                        src={qp.product.images[0]}
                        alt={qp.product.name}
                        className="w-full h-48 object-cover"
                      />
                      <span className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        Special Price
                      </span>
                      {qp.product.category && (
                        <span className="absolute top-2 right-2 bg-white/90 text-gray-900 px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide shadow">
                          {qp.product.category}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{qp.product.name}</h3>
                    {qp.product.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{qp.product.description}</p>
                    )}

                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Your Quoted Price:</span>
                        <span className="text-xl font-bold text-green-600">₹{qp.quotedPrice.toLocaleString('en-IN')}</span>
                      </div>
                      {qp.originalPrice && qp.originalPrice > qp.quotedPrice && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Original Price:</span>
                          <span className="text-sm text-gray-400 line-through">₹{qp.originalPrice.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {qp.originalPrice && qp.originalPrice > qp.quotedPrice && (
                        <div className="mt-2 text-xs text-green-600 font-medium">
                          Save {Math.round(((qp.originalPrice - qp.quotedPrice) / qp.originalPrice) * 100)}%
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {stock > 0 ? `${stock} in stock` : 'Out of stock'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Updated: {new Date(qp.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddToCart(qp)}
                      disabled={stock <= 0}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Quotes</h2>
        <button
          onClick={() => navigate('/quote')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={16} />
          New Quote Request
        </button>
      </div>

      {/* Active Quotes Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Quotes</h3>
        {quotes.filter(q => q.status !== 'completed').length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">No active quotes found</p>
            <button
              onClick={() => navigate('/quote')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Request a Quote
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {quotes.filter(q => q.status !== 'completed').map(quote => (
              <div key={quote._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                    {quote.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ml-2 ${quote.type === 'bulk_order' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                    {quote.type === 'bulk_order' ? 'Bulk Order' : 'Price Request'}
                  </span>
                  <span className="text-xs text-gray-500 ml-auto">{new Date(quote.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Products:</h4>
                  <div className="space-y-2">
                    {quote.products.map((p: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded border border-gray-100">
                        <div>
                          <p className="font-medium text-gray-900">{p.product?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">Qty: {p.quantity}</p>
                        </div>
                        <div className="text-right">
                          {p.offeredPrice ? (
                            <>
                              <p className="font-bold text-green-600">₹{p.offeredPrice.toLocaleString()}</p>
                              {(p.originalPrice || p.product?.price) && (
                                <p className="text-xs text-gray-400 line-through">₹{(p.originalPrice || p.product?.price).toLocaleString()}</p>
                              )}
                            </>
                          ) : (
                            <p className="text-gray-600">
                              {(p.originalPrice || p.product?.price) ? `₹${(p.originalPrice || p.product?.price).toLocaleString()}` : 'Price on Request'}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {quote.adminResponse && (
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-4">
                    <h4 className="text-sm font-bold text-indigo-900 mb-2">Admin Offer</h4>

                    {/* Price Comparison */}
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Original Total:</span>
                      <span className="text-sm text-gray-500 line-through decoration-red-500">
                        ₹{quote.products.reduce((sum: number, p: any) => sum + ((p.originalPrice || p.product?.price || 0) * p.quantity), 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-bold text-indigo-900">Offered Total:</span>
                      <span className="text-xl font-bold text-green-600">₹{quote.adminResponse.totalPrice.toLocaleString()}</span>
                    </div>

                    {quote.adminResponse.discountPercentage > 0 && (
                      <div className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded inline-block mb-2">
                        {quote.adminResponse.discountPercentage}% Savings
                      </div>
                    )}

                    {quote.adminResponse.message && (
                      <div className="mt-2 text-sm text-indigo-800 bg-white/50 p-2 rounded border border-indigo-100">
                        <span className="font-semibold">Note:</span> {quote.adminResponse.message}
                      </div>
                    )}
                  </div>
                )}

                {quote.status === 'responded' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptQuote(quote)}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                    >
                      <ThumbsUp size={16} />
                      {quote.type === 'bulk_order' ? 'Accept & Checkout' : 'Accept'}
                    </button>
                    <button
                      onClick={() => rejectQuote(quote._id)}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
                    >
                      <ThumbsDown size={16} />
                      Reject
                    </button>
                  </div>
                )}

                {quote.status === 'accepted' && (
                  <>
                    {quote.orderId ? (
                      <button
                        onClick={() => setActiveTab('orders')}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Order Created - View in Orders
                      </button>
                    ) : (
                      <button
                        onClick={() => proceedToCheckout(quote)}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400"
                      >
                        Proceed to Checkout
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quote History Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quote History</h3>
        {quotes.filter(q => q.status === 'completed').length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <Clock size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">No completed quotes found.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {quotes.filter(q => q.status === 'completed').map(quote => (
              <div key={quote._id} className="bg-white rounded-lg shadow p-6 opacity-75 hover:opacity-100 transition-opacity">
                <div className="flex justify-between items-start mb-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-green-800 bg-green-100">
                    <CheckCircle size={14} />
                    Completed
                  </span>
                  <span className="text-xs text-gray-500">{new Date(quote.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Products:</h4>
                  <div className="space-y-2">
                    {quote.products.map((p: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded border border-gray-100">
                        <div>
                          <p className="font-medium text-gray-900">{p.product?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">Qty: {p.quantity}</p>
                        </div>
                        <div className="text-right">
                          {p.offeredPrice ? (
                            <>
                              <p className="font-bold text-green-600">₹{p.offeredPrice.toLocaleString()}</p>
                              {(p.originalPrice || p.product?.price) && (
                                <p className="text-xs text-gray-400 line-through">₹{(p.originalPrice || p.product?.price).toLocaleString()}</p>
                              )}
                            </>
                          ) : (
                            <p className="text-gray-600">
                              {(p.originalPrice || p.product?.price) ? `₹${(p.originalPrice || p.product?.price).toLocaleString()}` : 'Price on Request'}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {quote.adminResponse && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Original Total:</span>
                      <span className="text-sm text-gray-500 line-through decoration-red-500">
                        ₹{quote.products.reduce((sum: number, p: any) => sum + ((p.originalPrice || p.product?.price || 0) * p.quantity), 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-700">Final Price:</span>
                      <span className="text-lg font-bold text-green-600">₹{quote.adminResponse.totalPrice.toLocaleString()}</span>
                    </div>
                    {quote.adminResponse.discountPercentage > 0 && (
                      <div className="mt-2 text-right">
                        <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
                          {quote.adminResponse.discountPercentage}% Savings
                        </span>
                      </div>
                    )}
                  </div>
                )}
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
      <h2 className="text-2xl font-bold text-gray-900">My Orders</h2>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order._id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b flex flex-wrap justify-between items-center gap-4">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-medium">
                    #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                    {order.isDropship && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">
                        Dropship
                      </span>
                    )}
                  </p>
                  {order.isDropship && order.customerDetails && (
                    <p className="text-xs text-blue-600 font-medium mt-0.5">
                      Ship to: {order.customerDetails.name}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-medium text-lg">{formatCurrency(order.totalAmount)}</p>
                </div>
                <div className="flex gap-2">
                  {/* Order status removed as per request */}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.paymentStatus)}`}>
                    {order.paymentStatus}
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
                    className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Download Invoice"
                  >
                    {downloadingOrderId === order._id ? (
                      <Loader size={16} className="animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                    <span>{downloadingOrderId === order._id ? 'Downloading...' : 'Download Invoice'}</span>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <ul className="divide-y divide-gray-200">
                  {order.products.map((p: any, idx: number) => (
                    <li key={idx} className="py-3 flex justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{p.product?.name || 'Product'}</p>
                        <p className="text-sm text-gray-500">Qty: {p.quantity}</p>
                      </div>
                      <p className="font-medium text-gray-900">{formatCurrency(p.price)}</p>
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
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Inventory</h2>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search inventory..."
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full md:w-64"
            />
          </div>

          <select
            value={inventoryCategory}
            onChange={(e) => setInventoryCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {inventoryCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <div className="flex gap-2">
            {['all', 'in_stock', 'sold'].map(filter => (
              <button
                key={filter}
                onClick={() => setInventoryFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${inventoryFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {filter === 'all' ? 'All' : filter === 'in_stock' ? 'In Stock' : 'Sold'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">In Stock</p>
          <p className="text-2xl font-bold text-green-800">
            {inventory.filter(i => i.status === 'in_stock').length}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">Sold</p>
          <p className="text-2xl font-bold text-blue-800">
            {inventory.filter(i => i.status === 'sold').length}
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-600 font-medium">Inventory Value</p>
          <p className="text-2xl font-bold text-purple-800">
            {formatCurrency(inventory.filter(i => i.status === 'in_stock').reduce((sum, i) => sum + i.purchasePrice, 0))}
          </p>
        </div>
      </div>

      {filteredInventory.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No items in inventory</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInventory.map(item => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {item.product?.images?.[0] && (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-10 h-10 rounded object-cover mr-3"
                          />
                        )}
                        <span className="font-medium text-gray-900">{item.product?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {item.productUnit?.serialNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(item.purchasePrice)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.status === 'in_stock' ? (
                        <button
                          onClick={() => openSellModal(item)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          Record Sale
                        </button>
                      ) : item.soldTo ? (
                        <div className="text-xs text-gray-600">
                          <p className="font-medium">{item.soldTo.name}</p>
                          <p>{new Date(item.soldDate!).toLocaleDateString()}</p>
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Sales History</h2>
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
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">Total Sales</p>
          <p className="text-2xl font-bold text-green-800">{sales.length}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">Total Revenue</p>
          <p className="text-2xl font-bold text-blue-800">
            {formatCurrency(sales.reduce((sum, s) => sum + s.sellingPrice, 0))}
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-600 font-medium">Total Profit</p>
          <p className="text-2xl font-bold text-purple-800">
            {formatCurrency(sales.reduce((sum, s) => sum + (s.profit || 0), 0))}
          </p>
        </div>
      </div>

      {sales.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No sales recorded yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sale Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warranty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sales.map(sale => (
                  <tr key={sale._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{sale.productDetails?.name || sale.product?.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{sale.productDetails?.serialNumber}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{sale.customer?.name}</p>
                        <p className="text-gray-500">{sale.customer?.email}</p>
                        <p className="text-gray-500">{sale.customer?.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {sale.invoiceNumber && (
                          <p className="font-medium text-gray-900">{sale.invoiceNumber}</p>
                        )}
                        {sale.invoiceUrl && (
                          <a
                            href={sale.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-xs"
                          >
                            View Invoice
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(sale.saleDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(sale.sellingPrice)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600">
                      {formatCurrency(sale.profit || 0)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sale.warrantyStatus)}`}>
                        {sale.warrantyStatus}
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">This page is only accessible to retailers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl font-bold">Retailer Dashboard</h1>
          <p className="text-blue-100">Welcome back, {user.name}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map(tab => {
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
                  <Icon size={18} />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading && !stats ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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

      {/* Sell Modal */}
      {showSellModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Record Sale</h2>
            <p className="text-gray-600 mb-4">
              Product: <strong>{selectedItem.product?.name}</strong> |
              Serial: <strong>{selectedItem.productUnit?.serialNumber}</strong>
            </p>

            <form onSubmit={handleSellSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name or Company Name *</label>
                  <input
                    type="text"
                    required
                    value={sellFormData.customerName}
                    onChange={(e) => setSellFormData({ ...sellFormData, customerName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email *</label>
                  <input
                    type="email"
                    required
                    value={sellFormData.customerEmail}
                    onChange={(e) => setSellFormData({ ...sellFormData, customerEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone *</label>
                  <input
                    type="tel"
                    required
                    value={sellFormData.customerPhone}
                    onChange={(e) => setSellFormData({ ...sellFormData, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price *</label>
                  <input
                    type="number"
                    required
                    value={sellFormData.sellingPrice}
                    onChange={(e) => setSellFormData({ ...sellFormData, sellingPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Address *</label>
                  <textarea
                    required
                    value={sellFormData.customerAddress}
                    onChange={(e) => setSellFormData({ ...sellFormData, customerAddress: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sale Date *</label>
                  <input
                    type="date"
                    required
                    value={sellFormData.soldDate}
                    onChange={(e) => setSellFormData({ ...sellFormData, soldDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Number <span className="text-xs text-gray-500 font-normal">(Enter the number from the generated invoice)</span>
                  </label>
                  <input
                    type="text"
                    value={sellFormData.invoiceNumber}
                    onChange={(e) => setSellFormData({ ...sellFormData, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., INV-2024-001"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center gap-4">
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
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                    >
                      {loading ? 'Generating...' : 'Generate Invoice'}
                    </button>

                    {sellFormData.customerInvoice && (
                      <a
                        href={sellFormData.customerInvoice}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <Download size={16} />
                        Download & Verify Invoice
                      </a>
                    )}
                  </div>
                  {!sellFormData.customerInvoice && (
                    <p className="text-xs text-gray-500 mt-2">
                      Generate an invoice to proceed with the sale record.
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Once you record this sale, the warranty will be automatically registered for the customer.
                  Both you and the customer will receive email notifications.
                </p>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSellModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !sellFormData.customerInvoice}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
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
