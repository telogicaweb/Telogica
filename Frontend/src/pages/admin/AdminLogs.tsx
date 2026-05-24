import React, { useState, useEffect } from 'react';
import api from '../../api';
import { 
  RefreshCw, 
  Download, 
  Search,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  Package,
  ShoppingCart,
  Shield,
  DollarSign,
  User,
  FileText,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface AdminLog {
  _id: string;
  adminId?: {
    _id: string;
    name: string;
    email: string;
  };
  adminName?: string;
  adminEmail?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
  timestamp: string;
}

const AdminLogs = () => {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AdminLog | null>(null);
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    adminId: '',
    action: '',
    entity: ''
  });

  // Track CRUD operations for all admin entities
  const allowedEntities = ['Product', 'Order', 'Warranty', 'Payment', 'User', 'Invoice'];
  const allowedActions = ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT'];

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: 50,
        ...filters
      };

      console.log('[AdminLogs] Fetching logs with params:', params);
      const response = await api.get('/api/logs/admin-logs', { params });
      console.log('[AdminLogs] API Response:', response.data);
      console.log('[AdminLogs] Logs array:', response.data.logs);
      console.log('[AdminLogs] Total:', response.data.total);
      
      // Use logs directly from backend
      const receivedLogs = response.data.logs || [];
      setLogs(receivedLogs);
      setTotalPages(response.data.totalPages || 1);
      setTotalLogs(response.data.total || 0);
      
      console.log('[AdminLogs] State updated with', receivedLogs.length, 'logs');
    } catch (error) {
      console.error('[AdminLogs] Error fetching logs:', error);
      alert('Error fetching logs: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (formatType: 'csv' | 'excel' | 'pdf') => {
    try {
      const params = {
        ...filters,
        format: formatType
      };

      const response = await api.get('/api/logs/export', {
        params,
        responseType: 'blob'
      });

      let fileExtension = formatType === 'excel' ? 'xlsx' : formatType;
      let mimeType =
        formatType === 'pdf' ? 'application/pdf'
        : formatType === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv';

      const url = window.URL.createObjectURL(new Blob([response.data], { type: mimeType }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `admin-logs-${format(new Date(), 'yyyy-MM-dd')}.${fileExtension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Error exporting logs: ' + (error as any).message);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'text-green-700 bg-green-50 border-green-200';
      case 'UPDATE': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'DELETE': return 'text-red-700 bg-red-50 border-red-200';
      case 'APPROVE': return 'text-emerald-700 bg-emerald-50 border-emerald-250';
      case 'REJECT': return 'text-orange-700 bg-orange-50 border-orange-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'Product': return <Package className="w-4 h-4" />;
      case 'Order': return <ShoppingCart className="w-4 h-4" />;
      case 'Warranty': return <Shield className="w-4 h-4" />;
      case 'Payment': return <DollarSign className="w-4 h-4" />;
      case 'User': return <User className="w-4 h-4" />;
      case 'Invoice': return <FileText className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Card */}
      <div className="bg-white border border-gray-200 rounded-none shadow-sm mb-6">
        <div className="px-5 py-4 border-b border-gray-150 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
          <div>
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Admin Activity Logs</h2>
            <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">
              Track all admin CRUD operations on Products, Orders, Warranty, Payments, Users, and Invoices
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="px-3 py-2 bg-blue-600 text-white rounded-none hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-none hover:bg-gray-50 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider border-gray-300"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="px-3 py-2 bg-white border border-gray-200 text-gray-750 rounded-none hover:bg-gray-50 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider border-gray-300"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="px-3 py-2 bg-emerald-600 text-white rounded-none hover:bg-emerald-700 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                <Calendar className="w-3.5 h-3.5 inline mr-1 text-gray-550" />
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-none text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                <Calendar className="w-3.5 h-3.5 inline mr-1 text-gray-550" />
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-none text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Entity Type</label>
              <select
                value={filters.entity}
                onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-none text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Entities</option>
                {allowedEntities.map(entity => (
                  <option key={entity} value={entity}>{entity}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Action</label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-none text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Actions</option>
                {allowedActions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                <Search className="w-3.5 h-3.5 inline mr-1 text-gray-550" />
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logs..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-none text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                setFilters({
                  startDate: '',
                  endDate: '',
                  adminId: '',
                  action: '',
                  entity: ''
                });
                setSearchQuery('');
                setPage(1);
              }}
              className="px-4 py-2 text-gray-755 bg-gray-100 rounded-none hover:bg-gray-200 transition-colors text-xs font-bold uppercase tracking-wider"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[{
          label: 'Total Logs',
          value: totalLogs,
          icon: Users,
          color: 'text-blue-600',
          accent: 'border-t-blue-600'
        }, {
          label: 'Products',
          value: logs.filter(l => l.entity === 'Product').length,
          icon: Package,
          color: 'text-green-600',
          accent: 'border-t-green-600'
        }, {
          label: 'Orders',
          value: logs.filter(l => l.entity === 'Order').length,
          icon: ShoppingCart,
          color: 'text-purple-600',
          accent: 'border-t-purple-600'
        }, {
          label: 'Warranty & Payment',
          value: logs.filter(l => l.entity === 'Warranty' || l.entity === 'Payment').length,
          icon: Shield,
          color: 'text-orange-600',
          accent: 'border-t-orange-600'
        }].map((stat, idx) => (
          <div key={idx} className={`bg-white rounded-none shadow-sm border border-gray-200 border-t-4 ${stat.accent} p-5 hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-black text-gray-950 mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-none border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Timestamp', 'Admin', 'Entity', 'Action', 'Details'].map(header => (
                  <th key={header} className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                    <p className="mt-2 text-xs font-bold uppercase tracking-wider text-gray-450">Loading logs...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-xs font-bold uppercase tracking-wider">
                    No logs found
                  </td>
                </tr>
              ) : (
                logs
                  .filter(log => {
                    if (!searchQuery) return true;
                    const query = searchQuery.toLowerCase();
                    return (
                      log.adminId?.name?.toLowerCase().includes(query) ||
                      log.action?.toLowerCase().includes(query) ||
                      log.entity?.toLowerCase().includes(query)
                    );
                  })
                  .map((log) => (
                    <tr 
                      key={log._id} 
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-650">
                        {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {log.adminId?.name || log.adminName || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">
                          {log.adminId?.email || log.adminEmail || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getEntityIcon(log.entity)}
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-900">{log.entity}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border rounded-none ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                        {log.details?.name || log.details?.productName || log.entityId || 'N/A'}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-300 rounded-none hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-gray-300 rounded-none hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-none border border-gray-300 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center text-white z-10">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider">Log Details</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  {format(new Date(selectedLog.timestamp), 'MMMM dd, yyyy HH:mm:ss')}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-white p-1 rounded-none transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Admin Partner</p>
                <p className="text-sm font-bold text-gray-950 mt-1">
                  {selectedLog.adminId?.name || selectedLog.adminName || 'Unknown'}
                </p>
                <p className="text-xs text-gray-450 font-mono">
                  {selectedLog.adminId?.email || selectedLog.adminEmail || '-'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 border border-gray-100 rounded-none">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Entity Type</label>
                  <p className="mt-1 text-xs font-bold text-gray-900 flex items-center gap-2">
                    {getEntityIcon(selectedLog.entity)}
                    {selectedLog.entity}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Action Type</label>
                  <p className="mt-1">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border rounded-none ${getActionColor(selectedLog.action)}`}>
                      {selectedLog.action}
                    </span>
                  </p>
                </div>
              </div>

              {selectedLog.entityId && (
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Entity ID Reference</label>
                  <p className="mt-1 text-xs font-mono font-bold text-slate-800 bg-slate-50 border border-slate-100 p-2 rounded-none inline-block">{selectedLog.entityId}</p>
                </div>
              )}

              {selectedLog.details && (
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payload Details</label>
                  <pre className="mt-1 bg-slate-900 text-slate-100 p-4 border border-slate-950 rounded-none text-xs overflow-x-auto font-mono leading-relaxed">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedLog(null)}
                className="w-full px-4 py-2.5 bg-slate-900 text-white rounded-none hover:bg-slate-800 transition-colors text-xs font-bold uppercase tracking-wider border border-slate-950"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogs;
