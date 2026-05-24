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
      <div className="bg-white border border-gray-200 rounded-none shadow-sm mb-6">
        <div className="px-5 py-4 border-b border-gray-150 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Report Generation</h3>
            <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">Generate and download retailer inventory reports</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-none border border-red-200 transition-colors uppercase tracking-wider"
            >
              <Download size={14} /> PDF
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-none border border-green-200 transition-colors uppercase tracking-wider"
            >
              <Download size={14} /> CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-none border border-blue-200 transition-colors uppercase tracking-wider"
            >
              <Download size={14} /> Excel
            </button>
          </div>
        </div>
        <div className="p-5">
          <DateFilter
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            label="Filter Reports by Date"
            showPresets={true}
            className="border-0 shadow-none p-0"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-5 rounded-none border border-blue-700 text-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-blue-100 uppercase tracking-wider">Total Retailers</p>
              <p className="text-2xl font-black mt-1">{analytics?.retailers.total || 0}</p>
              <p className="text-[10px] font-semibold text-blue-200 uppercase tracking-wider mt-1">{analytics?.retailers.active || 0} active</p>
            </div>
            <Users className="w-10 h-10 text-blue-200/80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 p-5 rounded-none border border-green-700 text-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-green-100 uppercase tracking-wider">Total Sales</p>
              <p className="text-2xl font-black mt-1">{analytics?.sales.totalSales || 0}</p>
              <p className="text-[10px] font-semibold text-green-200 uppercase tracking-wider mt-1">{formatCurrency(analytics?.sales.totalRevenue || 0)}</p>
            </div>
            <DollarSign className="w-10 h-10 text-green-200/80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-5 rounded-none border border-purple-700 text-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-purple-100 uppercase tracking-wider">Inventory in Retailers</p>
              <p className="text-2xl font-black mt-1">{analytics?.inventory.inStock || 0}</p>
              <p className="text-[10px] font-semibold text-purple-200 uppercase tracking-wider mt-1">{formatCurrency(analytics?.inventory.totalValue || 0)}</p>
            </div>
            <Package className="w-10 h-10 text-purple-200/80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-700 p-5 rounded-none border border-orange-700 text-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-orange-100 uppercase tracking-wider">Pending Approvals</p>
              <p className="text-2xl font-black mt-1">{analytics?.retailers.pending || 0}</p>
              <p className="text-[10px] font-semibold text-orange-200 uppercase tracking-wider mt-1">Retailers waiting</p>
            </div>
            <Clock className="w-10 h-10 text-orange-200/80" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-none border border-gray-200 shadow-sm">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">Top Performing Retailers</h3>
          {analytics?.topRetailers && analytics.topRetailers.length > 0 ? (
            <div className="space-y-4">
              {analytics.topRetailers.map((retailer: any, idx: number) => (
                <div key={retailer.retailerId} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-none bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{retailer.name}</p>
                      <p className="text-xs text-gray-400 font-semibold uppercase">{retailer.totalSales} sales</p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-emerald-600">{formatCurrency(retailer.totalRevenue)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4 text-xs font-semibold uppercase">No sales data yet</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-none border border-gray-200 shadow-sm">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">Sales Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Products Sold</span>
              <span className="text-sm font-black text-gray-950">{analytics?.inventory.sold || 0}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Avg Sale Price</span>
              <span className="text-sm font-black text-gray-950">{formatCurrency(analytics?.sales.avgSalePrice || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Retailer Profit (Total)</span>
              <span className="text-sm font-black text-emerald-600">{formatCurrency(analytics?.sales.totalRetailerProfit || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Sales Trend */}
      {analytics?.monthlySales && analytics.monthlySales.length > 0 && (
        <div className="bg-white p-6 rounded-none border border-gray-200 shadow-sm">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">Monthly Sales Trend</h3>
          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-max items-end pt-4">
              {analytics.monthlySales.map((month: any) => (
                <div key={`${month._id.year}-${month._id.month}`} className="text-center min-w-[100px]">
                  <div
                    className="bg-emerald-600 rounded-none transition-all duration-300 hover:bg-emerald-700"
                    style={{ height: `${Math.max(20, (month.revenue / Math.max(...analytics.monthlySales.map((m: any) => m.revenue))) * 120)}px` }}
                  />
                  <p className="text-xs font-bold text-gray-900 mt-2">{formatCurrency(month.revenue)}</p>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">{month._id.month}/{month._id.year}</p>
                  <p className="text-[10px] text-gray-400 font-mono">{month.count} sales</p>
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
      {/* Enhanced Header */}
      <div className="bg-slate-900 border border-slate-850 p-6 text-white rounded-none flex items-center justify-between shadow-md">
        <div>
          <p className="text-gray-400 text-xs">Manage retailer accounts, approvals, sales tracking, and special quote pricing.</p>
        </div>
        <Users className="w-10 h-10 text-gray-500" />
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between bg-white p-5 border border-gray-200 rounded-none shadow-sm">
        <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">All Retailer Partners</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search retailers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:bg-white transition-all w-64"
          />
        </div>
      </div>

      {filteredRetailers.length === 0 ? (
        <div className="bg-white rounded-none border border-gray-200 shadow-sm p-12 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">No retailers found</p>
        </div>
      ) : (
        <div className="bg-white rounded-none border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Retailer</th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Inventory</th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Sales</th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3.5 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredRetailers.map(retailer => (
                  <tr key={retailer._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{retailer.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{retailer.email}</p>
                        {retailer.phone && <p className="text-xs text-gray-500 mt-0.5">{retailer.phone}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider border ${
                        retailer.isApproved
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                        {retailer.isApproved ? 'Active' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">{retailer.summary.inventoryCount}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">{retailer.summary.totalSales}</td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600">
                      {formatCurrency(retailer.summary.totalRevenue)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">{retailer.summary.ordersCount}</td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                      {new Date(retailer.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => loadRetailerDetails(retailer._id)}
                          className="text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 p-2 rounded-none transition-colors"
                          title="VIEW DETAILS"
                        >
                          <Eye size={14} />
                        </button>
                        {!retailer.isApproved && (
                          <button
                            onClick={() => approveRetailer(retailer._id)}
                            className="text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 p-2 rounded-none transition-colors"
                            title="APPROVE"
                          >
                            <CheckCircle size={14} />
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
      {/* Sales Header & Filters Card */}
      <div className="bg-white border border-gray-200 rounded-none shadow-sm">
        <div className="px-5 py-4 border-b border-gray-150 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
          <div>
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">All Retailer Sales Records</h2>
            <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">Track and filter retailer transaction histories and performance metrics</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadAllSales}
              className="bg-slate-900 text-white px-4 py-2 rounded-none hover:bg-slate-800 text-xs font-bold uppercase tracking-wider border border-slate-900 transition-colors"
            >
              Apply Filter
            </button>
            <button
              onClick={exportSales}
              className="bg-emerald-600 text-white px-4 py-2 rounded-none hover:bg-emerald-700 flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>
        <div className="p-5">
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
      </div>

      {salesTotals && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50/70 border border-green-200 rounded-none p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Total Sales</p>
            <p className="text-2xl font-black text-green-800 mt-1">{salesTotals.totalSales || 0}</p>
          </div>
          <div className="bg-blue-50/70 border border-blue-200 rounded-none p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Total Revenue</p>
            <p className="text-2xl font-black text-blue-800 mt-1">{formatCurrency(salesTotals.totalRevenue || 0)}</p>
          </div>
          <div className="bg-purple-50/70 border border-purple-200 rounded-none p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Retailer Profit</p>
            <p className="text-2xl font-black text-purple-800 mt-1">{formatCurrency(salesTotals.totalProfit || 0)}</p>
          </div>
        </div>
      )}

      {allSales.length === 0 ? (
        <div className="bg-white rounded-none border border-gray-200 shadow-sm p-12 text-center">
          <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">No sales found</p>
        </div>
      ) : (
        <div className="bg-white rounded-none border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Retailer</th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Invoice</th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Sale Date</th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Profit</th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Warranty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {allSales.map(sale => (
                  <tr key={sale._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-semibold text-gray-900">{sale.retailer?.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{sale.retailer?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-semibold text-gray-900">{sale.productDetails?.name || sale.product?.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{sale.productDetails?.serialNumber}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        <p className="font-semibold text-gray-900">{sale.customer?.name}</p>
                        <p className="text-gray-400 font-mono mt-0.5">{sale.customer?.email}</p>
                        <p className="text-gray-500 mt-0.5">{sale.customer?.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        {sale.invoiceNumber && (
                          <p className="font-bold text-gray-950">{sale.invoiceNumber}</p>
                        )}
                        {sale.invoiceUrl && (
                          <a
                            href={sale.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold uppercase tracking-wider hover:underline mt-0.5 inline-block"
                          >
                            View Invoice
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                      {new Date(sale.saleDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      {formatCurrency(sale.sellingPrice)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                      {formatCurrency(sale.profit || 0)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(sale.warrantyStatus)}`}>
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-none border border-gray-300 shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center text-white z-10">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider">{retailer.name}</h2>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{retailer.email}</p>
            </div>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-400 hover:text-white p-1 rounded-none transition-colors"
            >
              <XCircle size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50/70 border border-blue-200 rounded-none p-4 shadow-sm">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Inventory</p>
                <p className="text-xl font-black text-blue-800 mt-0.5">{stats.inventory.total}</p>
                <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider mt-1">{stats.inventory.inStock} in stock</p>
              </div>
              <div className="bg-green-50/70 border border-green-200 rounded-none p-4 shadow-sm">
                <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Sales</p>
                <p className="text-xl font-black text-green-800 mt-0.5">{stats.sales.total}</p>
                <p className="text-[10px] text-green-600 font-semibold uppercase tracking-wider mt-1">{formatCurrency(stats.sales.totalRevenue)}</p>
              </div>
              <div className="bg-purple-50/70 border border-purple-200 rounded-none p-4 shadow-sm">
                <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Orders</p>
                <p className="text-xl font-black text-purple-800 mt-0.5">{stats.orders.total}</p>
                <p className="text-[10px] text-purple-600 font-semibold uppercase tracking-wider mt-1">{formatCurrency(stats.orders.totalSpent)}</p>
              </div>
              <div className="bg-orange-50/70 border border-orange-200 rounded-none p-4 shadow-sm">
                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Profit</p>
                <p className="text-xl font-black text-orange-800 mt-0.5">{formatCurrency(stats.sales.totalProfit)}</p>
                <p className="text-[10px] text-orange-650 font-semibold uppercase tracking-wider mt-1">Retailer margin</p>
              </div>
            </div>

            {/* Recent Inventory */}
            <div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                <Package size={16} className="text-indigo-600" />
                Inventory ({inventory.length})
              </h3>
              {inventory.length > 0 ? (
                <div className="overflow-x-auto max-h-64 border border-gray-200 rounded-none shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Serial</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {inventory.slice(0, 10).map((item: any) => (
                        <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2.5 text-sm font-semibold text-gray-900">{item.product?.name}</td>
                          <td className="px-4 py-2.5 text-xs text-gray-600 font-mono">{item.productUnit?.serialNumber}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-wider border ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-sm font-bold text-gray-900">{formatCurrency(item.purchasePrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4 text-xs font-bold uppercase tracking-wider">No inventory</p>
              )}
            </div>

            {/* Recent Sales */}
            <div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                <DollarSign size={16} className="text-emerald-600" />
                Sales ({sales.length})
              </h3>
              {sales.length > 0 ? (
                <div className="overflow-x-auto max-h-64 border border-gray-200 rounded-none shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Invoice</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {sales.slice(0, 10).map((sale: any) => (
                        <tr key={sale._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2.5 text-sm font-semibold text-gray-900">{sale.productDetails?.name || sale.product?.name}</td>
                          <td className="px-4 py-2.5 text-xs text-gray-650">
                            <p className="font-bold text-gray-900">{sale.customer?.name}</p>
                          </td>
                          <td className="px-4 py-2.5 text-xs">
                            {sale.invoiceNumber && <span className="text-gray-900 font-bold">{sale.invoiceNumber}</span>}
                            {sale.invoiceUrl && (
                              <a href={sale.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-650 hover:text-indigo-850 text-[10px] font-bold uppercase tracking-wider block hover:underline mt-0.5">View Invoice</a>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-500 font-medium">{new Date(sale.saleDate).toLocaleDateString()}</td>
                          <td className="px-4 py-2.5 text-sm font-bold text-gray-900">{formatCurrency(sale.sellingPrice)}</td>
                          <td className="px-4 py-2.5 text-sm font-bold text-green-600">{formatCurrency(sale.profit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4 text-xs font-bold uppercase tracking-wider">No sales</p>
              )}
            </div>

            {/* Recent Orders */}
            <div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                <ShoppingCart size={16} className="text-purple-600" />
                Orders ({orders.length})
              </h3>
              {orders.length > 0 ? (
                <div className="overflow-x-auto max-h-64 border border-gray-200 rounded-none shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Order ID</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {orders.slice(0, 10).map((order: any) => (
                        <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2.5 text-xs font-mono font-bold text-gray-950">
                            {order.orderNumber || order._id.slice(-8).toUpperCase()}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-500 font-medium">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-2.5 text-sm font-bold text-gray-900">{formatCurrency(order.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4 text-xs font-bold uppercase tracking-wider">No orders</p>
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
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between bg-white p-5 border border-gray-200 rounded-none shadow-sm">
          <div>
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Retailer Quoted Products</h2>
            <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">View and manage quoted prices for each retailer</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search retailers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:bg-white transition-all w-64"
            />
          </div>
        </div>

        <div className="bg-indigo-50/70 border border-indigo-100 p-4 rounded-none text-xs text-indigo-900 leading-relaxed shadow-sm">
          <p>
            <strong>Quoted Products:</strong> These are products with special pricing for specific retailers. When a retailer accepts a quote, the products are saved here with their quoted prices. You can edit the prices, and changes will reflect on the retailer's dashboard.
          </p>
        </div>

        {filteredRetailers.length === 0 ? (
          <div className="bg-white rounded-none border border-gray-200 shadow-sm p-12 text-center">
            <Tag size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-450 text-xs font-bold uppercase tracking-wider">No retailers with quoted products found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRetailers.map(retailer => (
              <div key={retailer._id} className="bg-white rounded-none border border-gray-200 shadow-sm overflow-hidden mb-4">
                <div 
                  className="bg-gray-50/50 px-6 py-4 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setSelectedRetailerForQuotes(
                    selectedRetailerForQuotes?._id === retailer._id ? null : retailer
                  )}
                >
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">{retailer.name}</h3>
                    <p className="text-xs text-gray-450 font-mono mt-0.5">{retailer.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-wider border ${
                      retailer.isApproved
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}>
                      {retailer.isApproved ? 'Active' : 'Pending'}
                    </span>
                    <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-wider">
                      {retailer.quotedProductsCount} products
                    </span>
                    <Eye size={16} className="text-gray-400" />
                  </div>
                </div>

                {selectedRetailerForQuotes?._id === retailer._id && (
                  <div className="p-6 bg-white border-t border-gray-100">
                    {retailer.quotedProducts.length === 0 ? (
                      <p className="text-gray-450 text-center py-4 text-xs font-bold uppercase tracking-wider">No quoted products for this retailer</p>
                    ) : (
                      <div className="overflow-x-auto border border-gray-200 rounded-none shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-4 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Product</th>
                              <th className="px-4 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Category</th>
                              <th className="px-4 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Original Price</th>
                              <th className="px-4 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Quoted Price</th>
                              <th className="px-4 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Last Updated</th>
                              <th className="px-4 py-3.5 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {retailer.quotedProducts.map(qp => (
                              <tr key={qp._id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    {qp.product.images && qp.product.images[0] && (
                                      <img 
                                        src={qp.product.images[0]} 
                                        alt={qp.product.name}
                                        className="w-10 h-10 rounded-none object-cover border border-gray-200"
                                      />
                                    )}
                                    <span className="font-semibold text-sm text-gray-900">{qp.product.name}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-650 font-medium">
                                  {qp.product.category || '-'}
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-600 font-medium">
                                  {qp.originalPrice ? formatCurrency(qp.originalPrice) : '-'}
                                </td>
                                <td className="px-4 py-3">
                                  {editingQuotedProduct === qp._id ? (
                                    <input
                                      type="number"
                                      value={editPrice}
                                      onChange={(e) => setEditPrice(e.target.value)}
                                      className="w-28 px-2 py-1 bg-gray-50 border border-gray-200 rounded-none text-xs focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 focus:outline-none"
                                      autoFocus
                                    />
                                  ) : (
                                    <span className="font-bold text-sm text-green-600">
                                      {formatCurrency(qp.quotedPrice)}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-500 font-medium">
                                  {new Date(qp.updatedAt).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex justify-end gap-1.5">
                                    {editingQuotedProduct === qp._id ? (
                                      <>
                                        <button
                                          onClick={() => {
                                            const price = parseFloat(editPrice);
                                            if (!isNaN(price) && price > 0) {
                                              updateQuotedPrice(qp._id, price);
                                            } else {
                                              alert('Please enter a valid price');
                                            }
                                          }}
                                          className="text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 p-1.5 rounded-none transition-colors"
                                          title="SAVE"
                                        >
                                          <Save size={14} />
                                        </button>
                                        <button
                                          onClick={() => {
                                            setEditingQuotedProduct(null);
                                            setEditPrice('');
                                          }}
                                          className="text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 p-1.5 rounded-none transition-colors"
                                          title="CANCEL"
                                        >
                                          <XCircle size={14} />
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setEditingQuotedProduct(qp._id);
                                          setEditPrice(qp.quotedPrice.toString());
                                        }}
                                        className="text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 p-1.5 rounded-none transition-colors"
                                        title="EDIT PRICE"
                                      >
                                        <Edit size={14} />
                                      </button>
                                    )}
                                  </div>
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
    <div className={`min-h-screen bg-[#f8fafc] ${!isEmbedded ? 'pt-20' : ''}`}>
      {/* Header - Only show if not embedded */}
      {!isEmbedded && (
        <div className="bg-slate-900 border-b border-slate-800 text-white py-6">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-xl font-bold uppercase tracking-wider">Retailer Management</h1>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Track retailers, inventory, and sales</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={`bg-white border-b border-gray-200 mb-6 ${!isEmbedded ? 'sticky top-[70px] z-10' : ''}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-all ${activeTab === tab.id
                      ? 'border-emerald-600 text-emerald-700 bg-emerald-50/20'
                      : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
                    }`}
                >
                  <Icon size={14} />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {loading && !analytics ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
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
