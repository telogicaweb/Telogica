import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import DateFilter from '../../components/AdminDashboard/DateFilter';
import {
  Users,
  DollarSign,
  TrendingUp,
  Package,
  Eye,
  Search,
  Download,
  ArrowLeft,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ShoppingCart,
  Tag,
  Edit,
  Save
} from 'lucide-react';

interface RetailerSummary {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  isApproved: boolean;
  createdAt: string;
  summary: {
    inventoryCount: number;
    totalSales: number;
    totalRevenue: number;
    totalProfit: number;
    ordersCount: number;
    totalPurchaseValue: number;
  };
}

interface RetailerAnalytics {
  retailers: {
    total: number;
    active: number;
    pending: number;
  };
  inventory: {
    total: number;
    inStock: number;
    sold: number;
    totalValue: number;
  };
  sales: {
    totalSales: number;
    totalRevenue: number;
    totalRetailerProfit: number;
    avgSalePrice: number;
  };
  topRetailers: any[];
  monthlySales: any[];
}

interface RetailerDetails {
  retailer: any;
  stats: any;
  inventory: any[];
  sales: any[];
  orders: any[];
  quotes: any[];
  warranties: any[];
}

interface RetailerWithQuotedProducts {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isApproved: boolean;
  quotedProductsCount: number;
  quotedProducts: QuotedProductItem[];
}

interface QuotedProductItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    category?: string;
    images?: string[];
  };
  quotedPrice: number;
  originalPrice?: number;
  updatedAt: string;
  notes?: string;
}

interface RetailerManagementProps {
  isEmbedded?: boolean;
}

const RetailerManagement: React.FC<RetailerManagementProps> = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'retailers' | 'sales' | 'quoted-products'>('overview');

  const [analytics, setAnalytics] = useState<RetailerAnalytics | null>(null);
  const [retailers, setRetailers] = useState<RetailerSummary[]>([]);
  const [allSales, setAllSales] = useState<any[]>([]);
  const [salesTotals, setSalesTotals] = useState<any>(null);

  const [selectedRetailer, setSelectedRetailer] = useState<RetailerDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  
  // Unified date filter for both display and export
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Quoted Products State
  const [retailersWithQuotedProducts, setRetailersWithQuotedProducts] = useState<RetailerWithQuotedProducts[]>([]);
  const [selectedRetailerForQuotes, setSelectedRetailerForQuotes] = useState<RetailerWithQuotedProducts | null>(null);
  const [editingQuotedProduct, setEditingQuotedProduct] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');

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
    loadData();
  }, [navigate]);

  const handleExport = async (format: 'pdf' | 'csv' | 'excel') => {
    try {
      let url = `/api/export/retailer-inventory?format=${format}`;
      if (dateFrom) url += `&startDate=${dateFrom}`;
      if (dateTo) url += `&endDate=${dateTo}`;

      const response = await api.get(url, {
        responseType: 'blob'
      });

      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `retailer_inventory_export_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      console.error('Export failed:', error);
      alert('Failed to export data: ' + (error.response?.data?.message || error.message));
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAnalytics(),
        loadRetailers(),
        loadAllSales(),
        loadRetailersQuotedProducts()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const res = await api.get('/api/retailer/admin/analytics');
      setAnalytics(res.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadRetailers = async () => {
    try {
      const res = await api.get('/api/retailer/admin/retailers');
      setRetailers(res.data);
    } catch (error) {
      console.error('Error loading retailers:', error);
    }
  };

  const loadAllSales = async () => {
    try {
      let url = '/api/retailer/admin/sales?';
      if (dateFrom) url += `startDate=${dateFrom}&`;
      if (dateTo) url += `endDate=${dateTo}&`;

      const res = await api.get(url);
      setAllSales(res.data.sales || []);
      setSalesTotals(res.data.totals);
    } catch (error) {
      console.error('Error loading sales:', error);
    }
  };

  const loadRetailersQuotedProducts = async () => {
    try {
      const res = await api.get('/api/quoted-products/admin/all?showAll=true');
      setRetailersWithQuotedProducts(res.data);
    } catch (error) {
      console.error('Error loading retailers quoted products:', error);
    }
  };

  const updateQuotedPrice = async (quotedProductId: string, newPrice: number) => {
    try {
      await api.put(`/api/quoted-products/admin/${quotedProductId}`, { quotedPrice: newPrice });
      alert('Price updated successfully');
      loadRetailersQuotedProducts();
      setEditingQuotedProduct(null);
      setEditPrice('');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update price');
    }
  };

  const loadRetailerDetails = async (retailerId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/retailer/admin/retailers/${retailerId}`);
      setSelectedRetailer(res.data);
      setShowDetails(true);
    } catch (error) {
      console.error('Error loading retailer details:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveRetailer = async (retailerId: string) => {
    try {
      await api.put(`/api/auth/approve/${retailerId}`);
      alert('Retailer approved successfully');
      loadRetailers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to approve retailer');
    }
  };

  const formatCurrency = (value: number) => `₹${(value || 0).toLocaleString('en-IN')}`;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportSales = () => {
    if (allSales.length === 0) {
      alert('No sales to export');
      return;
    }
    const data = allSales.map(s => ({
      Retailer: s.retailer?.name || 'Unknown',
      RetailerEmail: s.retailer?.email || '',
      Product: s.productDetails?.name || s.product?.name || '',
      SerialNumber: s.productDetails?.serialNumber || '',
      Customer: s.customer?.name || '',
      CustomerEmail: s.customer?.email || '',
      CustomerPhone: s.customer?.phone || '',
      CustomerAddress: s.customer?.address || '',
      InvoiceNumber: s.invoiceNumber || '',
      SaleDate: new Date(s.saleDate).toLocaleDateString(),
      SellingPrice: s.sellingPrice,
      Profit: s.profit || 0,
      WarrantyStatus: s.warrantyStatus
    }));

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify((row as any)[h] ?? '')).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `retailer_sales_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredRetailers = retailers.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render Overview Tab
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Export Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 max-w-2xl">
            <DateFilter
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
              label="Filter by Date"
              showPresets={true}
              className="border-0 shadow-none p-0"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
            >
              <Download size={14} /> PDF
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded border border-green-200 transition-colors"
            >
              <Download size={14} /> CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
            >
              <Download size={14} /> Excel
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Retailers</p>
              <p className="text-3xl font-bold">{analytics?.retailers.total || 0}</p>
              <p className="text-xs text-blue-200 mt-1">{analytics?.retailers.active || 0} active</p>
            </div>
            <Users className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Sales</p>
              <p className="text-3xl font-bold">{analytics?.sales.totalSales || 0}</p>
              <p className="text-xs text-green-200 mt-1">{formatCurrency(analytics?.sales.totalRevenue || 0)}</p>
            </div>
            <DollarSign className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Inventory in Retailers</p>
              <p className="text-3xl font-bold">{analytics?.inventory.inStock || 0}</p>
              <p className="text-xs text-purple-200 mt-1">{formatCurrency(analytics?.inventory.totalValue || 0)}</p>
            </div>
            <Package className="w-12 h-12 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-lg text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Pending Approvals</p>
              <p className="text-3xl font-bold">{analytics?.retailers.pending || 0}</p>
              <p className="text-xs text-orange-200 mt-1">Retailers waiting</p>
            </div>
            <Clock className="w-12 h-12 text-orange-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top Performing Retailers</h3>
          {analytics?.topRetailers && analytics.topRetailers.length > 0 ? (
            <div className="space-y-4">
              {analytics.topRetailers.map((retailer: any, idx: number) => (
                <div key={retailer.retailerId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{retailer.name}</p>
                      <p className="text-sm text-gray-500">{retailer.totalSales} sales</p>
                    </div>
                  </div>
                  <p className="font-bold text-green-600">{formatCurrency(retailer.totalRevenue)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No sales data yet</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Sales Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Products Sold</span>
              <span className="font-bold text-gray-900">{analytics?.inventory.sold || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Avg Sale Price</span>
              <span className="font-bold text-gray-900">{formatCurrency(analytics?.sales.avgSalePrice || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Retailer Profit (Total)</span>
              <span className="font-bold text-green-600">{formatCurrency(analytics?.sales.totalRetailerProfit || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Sales Trend */}
      {analytics?.monthlySales && analytics.monthlySales.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Sales Trend</h3>
          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-max">
              {analytics.monthlySales.map((month: any) => (
                <div key={`${month._id.year}-${month._id.month}`} className="text-center min-w-[100px]">
                  <div
                    className="bg-blue-500 rounded-t"
                    style={{ height: `${Math.max(20, (month.revenue / Math.max(...analytics.monthlySales.map((m: any) => m.revenue))) * 150)}px` }}
                  />
                  <p className="text-sm font-medium text-gray-900 mt-2">{formatCurrency(month.revenue)}</p>
                  <p className="text-xs text-gray-500">{month._id.month}/{month._id.year}</p>
                  <p className="text-xs text-gray-400">{month.count} sales</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render Retailers Tab
  const renderRetailers = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-900">All Retailers</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search retailers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {filteredRetailers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No retailers found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retailer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inventory</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRetailers.map(retailer => (
                  <tr key={retailer._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{retailer.name}</p>
                        <p className="text-sm text-gray-500">{retailer.email}</p>
                        {retailer.phone && <p className="text-sm text-gray-500">{retailer.phone}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${retailer.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {retailer.isApproved ? 'Active' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{retailer.summary.inventoryCount}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{retailer.summary.totalSales}</td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600">
                      {formatCurrency(retailer.summary.totalRevenue)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{retailer.summary.ordersCount}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(retailer.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadRetailerDetails(retailer._id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        {!retailer.isApproved && (
                          <button
                            onClick={() => approveRetailer(retailer._id)}
                            className="text-green-600 hover:text-green-800"
                            title="Approve"
                          >
                            <CheckCircle size={18} />
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
      )}
    </div>
  );

  // Render Sales Tab
  const renderSales = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-900">All Retailer Sales</h2>
        <div className="flex gap-3 items-center">
          <div className="flex-1 max-w-2xl">
            <DateFilter
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
              label="Filter Sales by Date"
              showPresets={true}
              className="border-0 shadow-none p-0"
            />
          </div>
          <button
            onClick={loadAllSales}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            Apply
          </button>
          <button
            onClick={exportSales}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {salesTotals && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Total Sales</p>
            <p className="text-2xl font-bold text-green-800">{salesTotals.totalSales || 0}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Total Revenue</p>
            <p className="text-2xl font-bold text-blue-800">{formatCurrency(salesTotals.totalRevenue || 0)}</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">Retailer Profit</p>
            <p className="text-2xl font-bold text-purple-800">{formatCurrency(salesTotals.totalProfit || 0)}</p>
          </div>
        </div>
      )}

      {allSales.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No sales found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retailer</th>
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
                {allSales.map(sale => (
                  <tr key={sale._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{sale.retailer?.name}</p>
                        <p className="text-gray-500">{sale.retailer?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{sale.productDetails?.name || sale.product?.name}</p>
                        <p className="text-gray-500 font-mono">{sale.productDetails?.serialNumber}</p>
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

  // Render Retailer Details Modal
  const renderRetailerDetails = () => {
    if (!selectedRetailer) return null;
    const { retailer, stats, inventory, sales, orders } = selectedRetailer;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{retailer.name}</h2>
              <p className="text-gray-500">{retailer.email}</p>
            </div>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <XCircle size={24} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium">Inventory</p>
                <p className="text-2xl font-bold text-blue-800">{stats.inventory.total}</p>
                <p className="text-xs text-blue-600">{stats.inventory.inStock} in stock</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-600 font-medium">Sales</p>
                <p className="text-2xl font-bold text-green-800">{stats.sales.total}</p>
                <p className="text-xs text-green-600">{formatCurrency(stats.sales.totalRevenue)}</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-600 font-medium">Orders</p>
                <p className="text-2xl font-bold text-purple-800">{stats.orders.total}</p>
                <p className="text-xs text-purple-600">{formatCurrency(stats.orders.totalSpent)}</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-600 font-medium">Profit</p>
                <p className="text-2xl font-bold text-orange-800">{formatCurrency(stats.sales.totalProfit)}</p>
              </div>
            </div>

            {/* Recent Inventory */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package size={20} />
                Inventory ({inventory.length})
              </h3>
              {inventory.length > 0 ? (
                <div className="overflow-x-auto max-h-64 border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Serial</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {inventory.slice(0, 10).map((item: any) => (
                        <tr key={item._id}>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.product?.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-600 font-mono">{item.productUnit?.serialNumber}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(item.purchasePrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No inventory</p>
              )}
            </div>

            {/* Recent Sales */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign size={20} />
                Sales ({sales.length})
              </h3>
              {sales.length > 0 ? (
                <div className="overflow-x-auto max-h-64 border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sales.slice(0, 10).map((sale: any) => (
                        <tr key={sale._id}>
                          <td className="px-4 py-2 text-sm text-gray-900">{sale.productDetails?.name || sale.product?.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{sale.customer?.name}</td>
                          <td className="px-4 py-2 text-sm">
                            {sale.invoiceNumber && <span className="text-gray-900">{sale.invoiceNumber}</span>}
                            {sale.invoiceUrl && (
                              <a href={sale.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs block">View</a>
                            )}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">{new Date(sale.saleDate).toLocaleDateString()}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(sale.sellingPrice)}</td>
                          <td className="px-4 py-2 text-sm text-green-600">{formatCurrency(sale.profit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No sales</p>
              )}
            </div>

            {/* Recent Orders */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingCart size={20} />
                Orders ({orders.length})
              </h3>
              {orders.length > 0 ? (
                <div className="overflow-x-auto max-h-64 border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {orders.slice(0, 10).map((order: any) => (
                        <tr key={order._id}>
                          <td className="px-4 py-2 text-sm font-mono text-gray-900">
                            {order.orderNumber || order._id.slice(-8).toUpperCase()}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(order.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No orders</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Quoted Products Tab
  const renderQuotedProducts = () => {
    const filteredRetailers = retailersWithQuotedProducts.filter(r =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Retailer Quoted Products</h2>
            <p className="text-sm text-gray-600 mt-1">View and manage quoted prices for each retailer</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search retailers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
          <p className="text-sm text-indigo-800">
            <strong>Quoted Products:</strong> These are products with special pricing for specific retailers. When a retailer accepts a quote, the products are saved here with their quoted prices. You can edit the prices, and changes will reflect on the retailer's dashboard.
          </p>
        </div>

        {filteredRetailers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Tag size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No retailers with quoted products found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredRetailers.map(retailer => (
              <div key={retailer._id} className="bg-white rounded-lg shadow overflow-hidden">
                <div 
                  className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setSelectedRetailerForQuotes(
                    selectedRetailerForQuotes?._id === retailer._id ? null : retailer
                  )}
                >
                  <div>
                    <h3 className="font-semibold text-gray-900">{retailer.name}</h3>
                    <p className="text-sm text-gray-500">{retailer.email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      retailer.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {retailer.isApproved ? 'Active' : 'Pending'}
                    </span>
                    <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-medium">
                      {retailer.quotedProductsCount} products
                    </span>
                    <Eye size={18} className="text-gray-400" />
                  </div>
                </div>

                {selectedRetailerForQuotes?._id === retailer._id && (
                  <div className="p-6">
                    {retailer.quotedProducts.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No quoted products for this retailer</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Original Price</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quoted Price</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Updated</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {retailer.quotedProducts.map(qp => (
                              <tr key={qp._id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    {qp.product.images && qp.product.images[0] && (
                                      <img 
                                        src={qp.product.images[0]} 
                                        alt={qp.product.name}
                                        className="w-10 h-10 rounded object-cover"
                                      />
                                    )}
                                    <span className="font-medium text-gray-900">{qp.product.name}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {qp.product.category || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {qp.originalPrice ? formatCurrency(qp.originalPrice) : '-'}
                                </td>
                                <td className="px-4 py-3">
                                  {editingQuotedProduct === qp._id ? (
                                    <input
                                      type="number"
                                      value={editPrice}
                                      onChange={(e) => setEditPrice(e.target.value)}
                                      className="w-28 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                                      autoFocus
                                    />
                                  ) : (
                                    <span className="font-semibold text-green-600">
                                      {formatCurrency(qp.quotedPrice)}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                  {new Date(qp.updatedAt).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3">
                                  {editingQuotedProduct === qp._id ? (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => {
                                          const price = parseFloat(editPrice);
                                          if (!isNaN(price) && price > 0) {
                                            updateQuotedPrice(qp._id, price);
                                          } else {
                                            alert('Please enter a valid price');
                                          }
                                        }}
                                        className="text-green-600 hover:text-green-800"
                                        title="Save"
                                      >
                                        <Save size={18} />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingQuotedProduct(null);
                                          setEditPrice('');
                                        }}
                                        className="text-gray-600 hover:text-gray-800"
                                        title="Cancel"
                                      >
                                        <XCircle size={18} />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setEditingQuotedProduct(qp._id);
                                        setEditPrice(qp.quotedPrice.toString());
                                      }}
                                      className="text-indigo-600 hover:text-indigo-800"
                                      title="Edit Price"
                                    >
                                      <Edit size={18} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: TrendingUp },
    { id: 'retailers', name: 'Retailers', icon: Users },
    { id: 'sales', name: 'All Sales', icon: DollarSign },
    { id: 'quoted-products', name: 'Quoted Products', icon: Tag },
  ];

  return (
    <div className={`min-h-screen bg-gray-100 ${!isEmbedded ? 'pt-20' : ''}`}>
      {/* Header */}
      {/* Header - Only show if not embedded */}
      {!isEmbedded && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-6">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="text-white hover:text-gray-200"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Retailer Management</h1>
                <p className="text-indigo-200">Track retailers, inventory, and sales</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={`bg-white shadow ${!isEmbedded ? 'sticky top-16 z-10' : ''}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
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
        {loading && !analytics ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'retailers' && renderRetailers()}
            {activeTab === 'sales' && renderSales()}
            {activeTab === 'quoted-products' && renderQuotedProducts()}
          </>
        )}
      </div>

      {/* Retailer Details Modal */}
      {showDetails && renderRetailerDetails()}
    </div>
  );
};

export default RetailerManagement;
