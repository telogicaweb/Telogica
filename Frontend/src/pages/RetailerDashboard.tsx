import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import {
  Package,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  FileText,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Download,
  Search,
  Store,
  RefreshCw,
  Loader2
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
}

interface Order {
  _id: string;
  orderNumber?: string;
  products: any[];
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
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

const RetailerDashboard = () => {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dashboard stats
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('');

  // Inventory
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryFilter, setInventoryFilter] = useState('all');

  // Quotes
  const [quotes, setQuotes] = useState<Quote[]>([]);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);

  // Sales
  const [sales, setSales] = useState<Sale[]>([]);

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

  // Checkout modal for quotes
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Auto-refresh data every 30 seconds when on dashboard tab
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'retailer') {
      navigate('/');
      return;
    }
    loadDashboardData();

    // Set up auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        silentRefresh();
      }
    }, 30000);

    return () => clearInterval(refreshInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  // Refresh data when tab changes
  useEffect(() => {
    if (user && user.role === 'retailer') {
      silentRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const silentRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadStats(),
        loadProducts(),
        loadInventory(),
        loadQuotes(),
        loadOrders(),
        loadSales()
      ]);
      setError(null);
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        loadStats(),
        loadProducts(),
        loadInventory(),
        loadQuotes(),
        loadOrders(),
        loadSales()
      ]);
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
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

  const acceptQuote = async (quoteId: string) => {
    if (!confirm('Accept this quote?')) return;
    setLoading(true);
    try {
      await api.put(`/api/quotes/${quoteId}/accept`, {});
      alert('Quote accepted! Proceed to checkout.');
      loadQuotes();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to accept quote');
    } finally {
      setLoading(false);
    }
  };

  const rejectQuote = async (quoteId: string) => {
    if (!confirm('Reject this quote?')) return;
    setLoading(true);
    try {
      await api.put(`/api/quotes/${quoteId}/reject`, {});
      alert('Quote rejected.');
      loadQuotes();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to reject quote');
    } finally {
      setLoading(false);
    }
  };

  const openCheckoutModal = (quote: Quote) => {
    setSelectedQuote(quote);
    setCheckoutAddress(user?.address || '');
    setShowCheckoutModal(true);
  };

  const proceedToCheckout = async () => {
    if (!selectedQuote) return;
    if (!checkoutAddress.trim()) {
      alert('Please enter a shipping address');
      return;
    }

    // Check if Razorpay is loaded
    if (typeof window.Razorpay === 'undefined') {
      alert('Payment gateway is not loaded. Please refresh the page and try again.');
      return;
    }

    setCheckoutLoading(true);

    try {
      const quote = selectedQuote;
      const totalPrice = quote.adminResponse?.totalPrice || 0;
      const totalQty = quote.products.reduce((sum: number, p: any) => sum + p.quantity, 0);

      const products = quote.products.map((item: any) => ({
        product: item.product?._id || item.productId?._id,
        quantity: item.quantity,
        price: totalQty > 0 ? totalPrice / totalQty : 0
      }));

      const { data } = await api.post('/api/orders', {
        products,
        totalAmount: totalPrice,
        quoteId: quote._id,
        shippingAddress: checkoutAddress
      });

      if (!data.razorpayOrder || !data.order) {
        throw new Error('Invalid order response from server');
      }

      setShowCheckoutModal(false);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_Rnat5mGdrSJJX4",
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
            alert('Payment Successful! Products will be added to your inventory after delivery.');
            silentRefresh();
          } catch (verifyError: any) {
            console.error('Payment verification error:', verifyError);
            alert('Payment verification failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: { color: "#3399cc" },
        modal: {
          ondismiss: function() {
            setCheckoutLoading(false);
          }
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response: { error: { description: string } }) {
        alert('Payment failed: ' + response.error.description);
        setCheckoutLoading(false);
      });
      rzp1.open();
    } catch (error: any) {
      console.error('Checkout error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create order';
      alert('Checkout failed: ' + errorMessage);
      setCheckoutLoading(false);
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
      alert('Please enter customer invoice URL.');
      return;
    }
    setLoading(true);
    try {
      await api.post(`/api/retailer-inventory/${selectedItem?._id}/sell`, sellFormData);
      alert('Product sold successfully! Warranty registered for customer.');
      setShowSellModal(false);
      loadDashboardData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to record sale');
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
    if (inventoryFilter === 'all') return true;
    return item.status === inventoryFilter;
  });

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'products', name: 'Products', icon: Package },
    { id: 'quotes', name: 'Quotes', icon: FileText },
    { id: 'orders', name: 'Orders', icon: ShoppingCart },
    { id: 'inventory', name: 'Inventory', icon: Store },
    { id: 'sales', name: 'Sales', icon: DollarSign },
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
          <h3 className="text-lg font-bold text-gray-900 mb-4">Inventory Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">In Stock</span>
              <span className="font-bold text-green-600">{stats?.inventory.inStock || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Sold</span>
              <span className="font-bold text-blue-600">{stats?.inventory.sold || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Inventory Value</span>
              <span className="font-bold text-purple-600">{formatCurrency(stats?.inventory.totalValue || 0)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Orders</span>
              <span className="font-bold text-gray-900">{stats?.orders.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completed</span>
              <span className="font-bold text-green-600">{stats?.orders.completed || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Spent</span>
              <span className="font-bold text-blue-600">{formatCurrency(stats?.orders.totalSpent || 0)}</span>
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
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
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

      {quotes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">No quotes found</p>
          <button
            onClick={() => navigate('/quote')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Request a Quote
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {quotes.map(quote => (
            <div key={quote._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                  {quote.status}
                </span>
                <span className="text-xs text-gray-500">{new Date(quote.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Products:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {quote.products.map((p: any, idx: number) => (
                    <li key={idx}>• {p.product?.name || 'Unknown'} (Qty: {p.quantity})</li>
                  ))}
                </ul>
              </div>

              {quote.adminResponse && (
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-4">
                  <h4 className="text-sm font-bold text-indigo-900 mb-2">Admin Response</h4>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-indigo-700">Offered Price:</span>
                    <span className="text-lg font-bold text-indigo-900">₹{quote.adminResponse.totalPrice}</span>
                  </div>
                  {quote.adminResponse.discountPercentage > 0 && (
                    <p className="text-sm text-green-600">{quote.adminResponse.discountPercentage}% discount!</p>
                  )}
                  {quote.adminResponse.message && (
                    <p className="text-sm text-indigo-800 mt-2">{quote.adminResponse.message}</p>
                  )}
                </div>
              )}

              {quote.status === 'responded' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptQuote(quote._id)}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                  >
                    <ThumbsUp size={16} />
                    Accept
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
                <button
                  onClick={() => openCheckoutModal(quote)}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  Proceed to Checkout
                </button>
              )}
            </div>
          ))}
        </div>
      )}
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
                  <p className="font-medium">#{order.orderNumber || order._id.slice(-8).toUpperCase()}</p>
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
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                    {order.orderStatus}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.paymentStatus)}`}>
                    {order.paymentStatus}
                  </span>
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
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Inventory</h2>
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
              alert('No sales to export');
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
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Retailer Dashboard</h1>
            <p className="text-blue-100">Welcome back, {user.name}</p>
          </div>
          <button
            onClick={silentRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 max-w-7xl mx-auto mt-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

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
            {activeTab === 'quotes' && renderQuotes()}
            {activeTab === 'orders' && renderOrders()}
            {activeTab === 'inventory' && renderInventory()}
            {activeTab === 'sales' && renderSales()}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                  <input
                    type="text"
                    value={sellFormData.invoiceNumber}
                    onChange={(e) => setSellFormData({ ...sellFormData, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., INV-2024-001"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice URL *</label>
                  <input
                    type="url"
                    required
                    value={sellFormData.customerInvoice}
                    onChange={(e) => setSellFormData({ ...sellFormData, customerInvoice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
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
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Processing...' : 'Record Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checkout Modal for Quote Orders */}
      {showCheckoutModal && selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Complete Your Order</h2>

            <div className="mb-4 bg-indigo-50 p-4 rounded-lg">
              <h3 className="font-semibold text-indigo-900 mb-2">Order Summary</h3>
              <ul className="text-sm text-indigo-800 space-y-1">
                {selectedQuote.products.map((p: any, idx: number) => (
                  <li key={idx}>• {p.product?.name || 'Product'} x {p.quantity}</li>
                ))}
              </ul>
              <div className="mt-2 pt-2 border-t border-indigo-200">
                <p className="text-lg font-bold text-indigo-900">
                  Total: ₹{(selectedQuote.adminResponse?.totalPrice || 0).toLocaleString('en-IN')}
                </p>
                {selectedQuote.adminResponse?.discountPercentage > 0 && (
                  <p className="text-sm text-green-600">
                    {selectedQuote.adminResponse.discountPercentage}% discount applied
                  </p>
                )}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shipping Address *
              </label>
              <textarea
                value={checkoutAddress}
                onChange={(e) => setCheckoutAddress(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your complete shipping address..."
                required
              />
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Once payment is complete, products will be added to your inventory after delivery confirmation by admin.
              </p>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={proceedToCheckout}
                disabled={checkoutLoading || !checkoutAddress.trim()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 flex items-center gap-2"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Pay Now'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetailerDashboard;
