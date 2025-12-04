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
  Plus,
  Check,
  X,
  Edit,
  Trash2,
  Eye,
  Download,
  RefreshCw,
  Search,
  Filter,
  BarChart3,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Send
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
  _id: string;
  name: string;
  description: string;
  category: string;
  normalPrice?: number;
  retailerPrice?: number;
  stockQuantity: number;
  imageUrl?: string;
  requiresQuote: boolean;
}

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
  userId: { _id: string; name: string; email: string };
  products: Array<{ productId: { _id: string; name: string }; quantity: number }>;
  message: string;
  status: string;
  adminResponse?: string;
  quotedPrice?: number;
  createdAt: string;
}

interface Order {
  _id: string;
  userId: { _id: string; name: string; email: string };
  products: Array<{
    productId: { _id: string; name: string };
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: string;
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

interface Analytics {
  totalSales: number;
  directSales: number;
  quoteSales: number;
  totalOrders: number;
  pendingQuotes: number;
  pendingWarranties: number;
  totalUsers: number;
  totalRetailers: number;
  totalProducts: number;
  lowStock: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  // State for different sections
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productUnits, setProductUnits] = useState<ProductUnit[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);

  // Form states
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: '',
    normalPrice: '',
    retailerPrice: '',
    quantity: 1,
    imageUrl: '',
    requiresQuote: false,
  });
  const [productUnitsForm, setProductUnitsForm] = useState<
    Array<{ serialNumber: string; modelNumber: string; warrantyPeriod: number }>
  >([]);

  const [quoteResponse, setQuoteResponse] = useState({ id: '', response: '', price: '' });
  const [warrantyAction, setWarrantyAction] = useState({ id: '', action: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

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
    try {
      await Promise.all([
        loadAnalytics(),
        loadUsers(),
        loadProducts(),
        loadQuotes(),
        loadOrders(),
        loadWarranties(),
        loadEmailLogs(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await api.get('/admin/analytics');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadProductUnits = async (productId: string) => {
    try {
      const response = await api.get(`/api/product-units/product/${productId}`);
      setProductUnits(response.data);
    } catch (error) {
      console.error('Error loading product units:', error);
    }
  };

  const loadQuotes = async () => {
    try {
      const response = await api.get('/admin/quotes');
      setQuotes(response.data);
    } catch (error) {
      console.error('Error loading quotes:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await api.get('/admin/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const loadWarranties = async () => {
    try {
      const response = await api.get('/admin/warranties');
      setWarranties(response.data);
    } catch (error) {
      console.error('Error loading warranties:', error);
    }
  };

  const loadEmailLogs = async () => {
    try {
      const response = await api.get('/admin/email-logs');
      setEmailLogs(response.data);
    } catch (error) {
      console.error('Error loading email logs:', error);
    }
  };

  // User Management
  const handleApproveRetailer = async (userId: string) => {
    try {
      await api.post(`/admin/users/${userId}/approve`);
      alert('Retailer approved successfully');
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to approve retailer');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      alert('User deleted successfully');
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  // Product Management
  const handleQuantityChange = (quantity: number) => {
    setProductForm({ ...productForm, quantity });
    const units = Array.from({ length: quantity }, () => ({
      serialNumber: '',
      modelNumber: '',
      warrantyPeriod: 12,
    }));
    setProductUnitsForm(units);
  };

  const handleProductUnitChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const updatedUnits = [...productUnitsForm];
    updatedUnits[index] = { ...updatedUnits[index], [field]: value };
    setProductUnitsForm(updatedUnits);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        images: productForm.imageUrl ? [productForm.imageUrl] : [],
        stock: 0, // Will be updated after adding units
        offlineStock: 0,
        requiresQuote: productForm.requiresQuote || !productForm.normalPrice,
        warrantyPeriodMonths: 12,
      };

      const productResponse = await api.post('/api/products', productData);
      const createdProduct = productResponse.data;

      // Step 2: Add product units
      await api.post('/api/product-units/add', {
        productId: createdProduct._id,
        units: productUnitsForm.map(unit => ({
          serialNumber: unit.serialNumber,
          modelNumber: unit.modelNumber,
          warrantyPeriodMonths: unit.warrantyPeriod || 12,
          stockType: 'both'
        }))
      });

      alert('Product created successfully with all units');
      setShowProductForm(false);
      setProductForm({
        name: '',
        description: '',
        category: '',
        normalPrice: '',
        retailerPrice: '',
        quantity: 1,
        imageUrl: '',
        requiresQuote: false,
      });
      setProductUnitsForm([]);
      loadProducts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create product');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/admin/products/${productId}`);
      alert('Product deleted successfully');
      loadProducts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete product');
    }
  };

  // Quote Management
  const handleRespondToQuote = async (quoteId: string) => {
    if (!quoteResponse.response || !quoteResponse.price) {
      alert('Please provide response and quoted price');
      return;
    }
    try {
      await api.post(`/admin/quotes/${quoteId}/respond`, {
        adminResponse: quoteResponse.response,
        quotedPrice: Number(quoteResponse.price),
        status: 'approved',
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
      await api.post(`/admin/quotes/${quoteId}/respond`, {
        adminResponse: reason,
        status: 'rejected',
      });
      alert('Quote rejected successfully');
      loadQuotes();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to reject quote');
    }
  };

  // Order Management
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/admin/orders/${orderId}`, { status });
      alert('Order status updated successfully');
      loadOrders();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update order status');
    }
  };

  // Warranty Management
  const handleWarrantyAction = async (warrantyId: string, action: string) => {
    try {
      await api.patch(`/admin/warranties/${warrantyId}`, { status: action });
      alert(`Warranty ${action} successfully`);
      loadWarranties();
    } catch (error: any) {
      alert(error.response?.data?.message || `Failed to ${action} warranty`);
    }
  };

  // Email Logs
  const handleResendEmail = async (logId: string) => {
    try {
      await api.post(`/admin/email-logs/${logId}/resend`);
      alert('Email resent successfully');
      loadEmailLogs();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to resend email');
    }
  };

  // Render Dashboard/Analytics Tab
  const renderDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
      
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Sales */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Sales</p>
                <p className="text-3xl font-bold">₹{analytics.totalSales.toLocaleString()}</p>
              </div>
              <DollarSign className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Orders</p>
                <p className="text-3xl font-bold">{analytics.totalOrders}</p>
              </div>
              <ShoppingCart className="w-12 h-12 text-green-200" />
            </div>
          </div>

          {/* Pending Quotes */}
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-lg text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Pending Quotes</p>
                <p className="text-3xl font-bold">{analytics.pendingQuotes}</p>
              </div>
              <FileText className="w-12 h-12 text-yellow-200" />
            </div>
          </div>

          {/* Pending Warranties */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Pending Warranties</p>
                <p className="text-3xl font-bold">{analytics.pendingWarranties}</p>
              </div>
              <Shield className="w-12 h-12 text-purple-200" />
            </div>
          </div>

          {/* Direct Sales */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Direct Sales</p>
                <p className="text-2xl font-bold text-gray-800">₹{analytics.directSales.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          {/* Quote Sales */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Quote Sales</p>
                <p className="text-2xl font-bold text-gray-800">₹{analytics.quoteSales.toLocaleString()}</p>
              </div>
              <BarChart3 className="w-10 h-10 text-green-500" />
            </div>
          </div>

          {/* Total Users */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-gray-800">{analytics.totalUsers}</p>
              </div>
              <Users className="w-10 h-10 text-purple-500" />
            </div>
          </div>

          {/* Low Stock Products */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Low Stock</p>
                <p className="text-2xl font-bold text-gray-800">{analytics.lowStock}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render Products Tab
  const renderProducts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Product Management</h2>
        <button
          onClick={() => setShowProductForm(!showProductForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {showProductForm && (
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-xl font-semibold mb-4">Create New Product</h3>
          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.category}
                  onChange={(e) =>
                    setProductForm({ ...productForm, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Normal Price (₹)
                </label>
                <input
                  type="number"
                  value={productForm.normalPrice}
                  onChange={(e) =>
                    setProductForm({ ...productForm, normalPrice: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Leave empty for quote-only"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Retailer Price (₹)
                </label>
                <input
                  type="number"
                  value={productForm.retailerPrice}
                  onChange={(e) =>
                    setProductForm({ ...productForm, retailerPrice: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={productForm.quantity}
                  onChange={(e) => handleQuantityChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  value={productForm.imageUrl}
                  onChange={(e) =>
                    setProductForm({ ...productForm, imageUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={productForm.description}
                onChange={(e) =>
                  setProductForm({ ...productForm, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requiresQuote"
                checked={productForm.requiresQuote}
                onChange={(e) =>
                  setProductForm({ ...productForm, requiresQuote: e.target.checked })
                }
                className="w-4 h-4"
              />
              <label htmlFor="requiresQuote" className="text-sm text-gray-700">
                Requires Quote (Quote-only product)
              </label>
            </div>

            {/* Serial Numbers and Model Numbers for each unit */}
            {productUnitsForm.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold text-lg mb-3">
                  Enter Details for Each Unit ({productUnitsForm.length} units)
                </h4>
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {productUnitsForm.map((unit, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 p-4 rounded-lg bg-gray-50"
                    >
                      <h5 className="font-medium mb-2">Unit {index + 1}</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Serial Number *
                          </label>
                          <input
                            type="text"
                            required
                            value={unit.serialNumber}
                            onChange={(e) =>
                              handleProductUnitChange(
                                index,
                                'serialNumber',
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            placeholder={`SN-${index + 1}`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Model Number *
                          </label>
                          <input
                            type="text"
                            required
                            value={unit.modelNumber}
                            onChange={(e) =>
                              handleProductUnitChange(
                                index,
                                'modelNumber',
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            placeholder={`MN-${index + 1}`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Warranty (months)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={unit.warrantyPeriod}
                            onChange={(e) =>
                              handleProductUnitChange(
                                index,
                                'warrantyPeriod',
                                Number(e.target.value)
                              )
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Product
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProductForm(false);
                  setProductForm({
                    name: '',
                    description: '',
                    category: '',
                    normalPrice: '',
                    retailerPrice: '',
                    quantity: 1,
                    imageUrl: '',
                    requiresQuote: false,
                  });
                  setProductUnitsForm([]);
                }}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
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
              {products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-12 h-12 rounded object-cover mr-3"
                        />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{product.name}</div>
                        {product.requiresQuote && (
                          <span className="text-xs text-blue-600 font-medium">
                            Quote Required
                          </span>
                        )}
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
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.stockQuantity > 10
                          ? 'bg-green-100 text-green-800'
                          : product.stockQuantity > 0
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.stockQuantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

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
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin'
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
      <h2 className="text-2xl font-bold text-gray-800">Quote Management</h2>
      
      <div className="space-y-4">
        {quotes.map((quote) => (
          <div
            key={quote._id}
            className="bg-white p-6 rounded-lg shadow border border-gray-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {quote.userId?.name || 'Unknown User'}
                </h3>
                <p className="text-sm text-gray-600">{quote.userId?.email}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(quote.createdAt).toLocaleString()}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  quote.status === 'pending'
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
                    • {item.productId?.name || 'Unknown Product'} (Qty: {item.quantity})
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

            {quote.adminResponse && (
              <div className="mb-4">
                <h4 className="font-medium text-sm text-gray-700 mb-1">
                  Admin Response:
                </h4>
                <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                  {quote.adminResponse}
                </p>
                {quote.quotedPrice && (
                  <p className="text-sm font-semibold text-gray-800 mt-2">
                    Quoted Price: ₹{quote.quotedPrice}
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
      <h2 className="text-2xl font-bold text-gray-800">Order Management</h2>
      
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
                    {order._id.slice(-8)}
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
                      value={order.status}
                      onChange={(e) =>
                        handleUpdateOrderStatus(order._id, e.target.value)
                      }
                      className={`px-2 py-1 rounded text-xs font-medium border-0 ${
                        order.status === 'delivered'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'shipped'
                          ? 'bg-blue-100 text-blue-800'
                          : order.status === 'processing'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
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
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  warranty.status === 'pending'
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
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.status === 'sent'
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

  // Render Content Management Tab
  const renderContentManagement = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Content Management</h2>
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Blog Posts */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Blog Posts</h3>
            <Edit size={20} className="text-blue-600" />
          </div>
          <p className="text-gray-600 mb-4">Manage blog articles and publications</p>
          <button 
            onClick={() => window.location.href = '/admin/blog-management'}
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
            onClick={() => window.location.href = '/admin/team-management'}
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
            onClick={() => window.location.href = '/admin/event-management'}
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
            onClick={() => window.location.href = '/admin/report-management'}
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
            onClick={() => window.location.href = '/admin/page-content'}
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
            onClick={() => window.location.href = '/admin/stats-management'}
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
    { id: 'quotes', name: 'Quotes', icon: FileText },
    { id: 'orders', name: 'Orders', icon: ShoppingCart },
    { id: 'warranties', name: 'Warranties', icon: Shield },
    { id: 'content', name: 'Content', icon: Edit },
    { id: 'emails', name: 'Email Logs', icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
              }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
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
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'products' && renderProducts()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'quotes' && renderQuotes()}
            {activeTab === 'orders' && renderOrders()}
            {activeTab === 'warranties' && renderWarranties()}
            {activeTab === 'content' && renderContentManagement()}
            {activeTab === 'emails' && renderEmailLogs()}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
