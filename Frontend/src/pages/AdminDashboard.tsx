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
  Archive,
  LogOut,
} from 'lucide-react';

// Import modular components
import DashboardOverview from '../components/AdminDashboard/DashboardOverview';
import ProductManagement from '../components/AdminDashboard/ProductManagement';
import UserManagement from '../components/AdminDashboard/UserManagement';
import QuoteManagement from '../components/AdminDashboard/QuoteManagement';
import OrderManagement from '../components/AdminDashboard/OrderManagement';
import WarrantyManagement from '../components/AdminDashboard/WarrantyManagement';
import EmailLogs from '../components/AdminDashboard/EmailLogs';
import ContactMessages from '../components/AdminDashboard/ContactMessages';
import ContentManagement from '../components/AdminDashboard/ContentManagement';
import {
  User,
  Product,
  Quote,
  Order,
  Warranty,
  EmailLog,
  ContactMessage,
  Analytics,
} from '../components/AdminDashboard/types';

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

  // State for different sections
  const [analytics, setAnalytics] = useState<Analytics>(getDefaultAnalytics());
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [contacts, setContacts] = useState<ContactMessage[]>([]);

  // Tab configuration
  const tabs: TabConfig[] = [
    { id: 'dashboard', name: 'Dashboard', icon: TrendingUp },
    { id: 'products', name: 'Products', icon: Package },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'quotes', name: 'Quotes', icon: FileText },
    { id: 'orders', name: 'Orders', icon: ShoppingCart },
    { id: 'warranties', name: 'Warranties', icon: Shield },
    { id: 'messages', name: 'Messages', icon: MessageSquare },
    { id: 'emails', name: 'Emails', icon: Mail },
    { id: 'content', name: 'Content', icon: Archive },
  ];

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
            {activeTab === 'dashboard' && (
              <DashboardOverview analytics={analytics} />
            )}
            {activeTab === 'products' && (
              <ProductManagement
                products={products}
                onProductsUpdated={loadProducts}
              />
            )}
            {activeTab === 'users' && (
              <UserManagement users={users} onUsersUpdated={loadUsers} />
            )}
            {activeTab === 'quotes' && (
              <QuoteManagement quotes={quotes} onQuotesUpdated={loadQuotes} />
            )}
            {activeTab === 'orders' && (
              <OrderManagement orders={orders} onOrdersUpdated={loadOrders} />
            )}
            {activeTab === 'warranties' && (
              <WarrantyManagement
                warranties={warranties}
                onWarrantiesUpdated={loadWarranties}
              />
            )}
            {activeTab === 'messages' && (
              <ContactMessages
                messages={contacts}
                onMessagesUpdated={loadContacts}
              />
            )}
            {activeTab === 'emails' && (
              <EmailLogs
                emailLogs={emailLogs}
                onEmailLogsUpdated={loadEmailLogs}
              />
            )}
            {activeTab === 'content' && (
              <ContentManagement onNavigate={(section) => navigate(`/admin/${section}`)} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
