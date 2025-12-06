import React, { useState, useEffect, useRef } from 'react';
import logService, { 
  getLogs, 
  exportLogs, 
  getLogStats, 
  clearLogs
} from '../../services/logService';
import { Log, LogEventType } from '../../types/logs.ts';
import { 
  Plus, 
  RefreshCw, 
  Trash2, 
  LogIn, 
  Download, 
  Activity, 
  TerminalSquare, 
  Filter, 
  BarChart3, 
  CheckCircle, 
  X, 
  List, 
  Layers, 
  FileSpreadsheet, 
  File, 
  FileText, 
  FileCode, 
  Code,
  Search,
  Zap,
  Database,
  Calendar,
  Users,
  AlertCircle,
  AlertTriangle,
  Clock,
  Server,
  GitCommit,
  User,
  Eye,
  Globe,
  Shield,
  Hash,
  SkipBack,
  ChevronLeft,
  ChevronRight,
  SkipForward,
  Copy
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { format, subDays } from 'date-fns';

const AdminLogs = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [liveMode, setLiveMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'card' | 'timeline'>('table');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [filters, setFilters] = useState({
    startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    adminId: '',
    action: '',
    entity: '',
    severity: '',
    ipAddress: '',
    userAgent: '',
    statusCode: '',
    minDuration: '',
    maxDuration: '',
    tags: [] as string[],
    hasError: false,
    hasWarnings: false,
    hasChanges: false
  });

  const actionTypes = [
    'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT',
    'BACKUP', 'RESTORE', 'CONFIG_CHANGE', 'PERMISSION_CHANGE', 'DATA_EXPORT',
    'API_CALL', 'WEBHOOK', 'EMAIL_SENT', 'SMS_SENT', 'PUSH_SENT', 'FILE_UPLOAD',
    'FILE_DOWNLOAD', 'BULK_OPERATION', 'SYNC', 'MERGE', 'SPLIT', 'ARCHIVE',
    'UNARCHIVE', 'VALIDATE', 'APPROVE', 'REJECT', 'ESCALATE', 'DELEGATE',
    'ASSIGN', 'UNASSIGN', 'COMPLETE', 'CANCEL', 'PAUSE', 'RESUME', 'RESTART'
  ];

  const entityTypes = [
    'Product', 'Order', 'User', 'Auth', 'Customer', 'Quote', 'Invoice',
    'Payment', 'Shipment', 'Inventory', 'Warehouse', 'Supplier', 'Category',
    'Tag', 'Price', 'Discount', 'Coupon', 'Promotion', 'Campaign', 'Email',
    'SMS', 'Notification', 'Report', 'Dashboard', 'Widget', 'Setting',
    'Config', 'Role', 'Permission', 'Group', 'Team', 'Department', 'Location',
    'Branch', 'Store', 'Terminal', 'Device', 'APIKey', 'Webhook', 'Integration',
    'Template', 'Form', 'Workflow', 'Automation', 'Schedule', 'Task', 'Event',
    'Log', 'Audit', 'Backup', 'File', 'Image', 'Video', 'Document', 'Folder',
    'Comment', 'Rating', 'Review', 'Feedback', 'Survey', 'Poll', 'Quiz',
    'Certificate', 'Badge', 'Achievement', 'Reward', 'Point', 'Credit', 'Voucher',
    'Ticket', 'Issue', 'Bug', 'Feature', 'Project', 'Milestone', 'Sprint',
    'Board', 'Column', 'Card', 'Label', 'Checklist', 'Attachment', 'Link',
    'Embed', 'Code', 'Script', 'Query', 'Database', 'Table', 'Column', 'Index',
    'View', 'Procedure', 'Function', 'Trigger', 'Constraint', 'Rule', 'Policy'
  ];

  const severityLevels = [
    'DEBUG', 'INFO', 'NOTICE', 'WARNING', 'ERROR', 'CRITICAL', 'ALERT', 'EMERGENCY'
  ];

  const statusCodes = [
    '200', '201', '204', '400', '401', '403', '404', '405', '409', '422', '429', '500', '502', '503'
  ];

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getLogs({ 
        ...filters, 
        severity: filters.severity ? (filters.severity as any) : undefined,
        minDuration: filters.minDuration ? Number(filters.minDuration) : undefined,
        maxDuration: filters.maxDuration ? Number(filters.maxDuration) : undefined,
        page, 
        limit: 50, 
        search: searchQuery 
      });
      setLogs(data.logs);
      setTotalPages(data.totalPages);
      setTotalLogs(data.total);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getLogStats({ startDate: filters.startDate, endDate: filters.endDate });
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();

    let unsubscribe: (() => void) | undefined;

    if (liveMode) {
      logService.connectWebSocket();
      unsubscribe = logService.subscribe(LogEventType.LOG_CREATED, (log: Log) => {
        setLogs(prev => [log, ...prev.slice(0, 49)]);
        setTotalLogs(prev => prev + 1);
      });
    }

    if (autoRefresh && !liveMode) {
      refreshIntervalRef.current = setInterval(fetchLogs, 10000);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [page, filters, liveMode, autoRefresh]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    setPage(1);
  };



  const handleExport = async (format: string) => {
    try {
      setExportProgress(0);
      const blob = await exportLogs({ 
        ...filters, 
        severity: filters.severity ? (filters.severity as any) : undefined,
        minDuration: filters.minDuration ? Number(filters.minDuration) : undefined,
        maxDuration: filters.maxDuration ? Number(filters.maxDuration) : undefined,
        format: format as any,
        search: searchQuery,
        // @ts-ignore
        selectedLogs: selectedLogs.size > 0 ? Array.from(selectedLogs) : undefined,
        onProgress: (progressEvent: any) => {
           const total = progressEvent.total;
           const current = progressEvent.loaded;
           if (total) {
             setExportProgress(Math.round((current / total) * 100));
           }
        }
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `admin_logs_${format}_${Date.now()}.${format === 'excel' ? 'xlsx' : format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setExportProgress(null);
    } catch (error) {
      console.error('Error exporting logs:', error);
      setExportProgress(null);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      return;
    }

    try {
      await clearLogs({
        severity: filters.severity ? [filters.severity as any] : undefined,
        entity: filters.entity ? [filters.entity] : undefined,
        action: filters.action ? [filters.action] : undefined,
      });
      fetchLogs();
      fetchStats();
      alert('Logs cleared successfully');
    } catch (error) {
      console.error('Error clearing logs:', error);
      alert('Failed to clear logs');
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const toggleSelectLog = (logId: string) => {
    const newSelected = new Set(selectedLogs);
    if (newSelected.has(logId)) {
      newSelected.delete(logId);
    } else {
      newSelected.add(logId);
    }
    setSelectedLogs(newSelected);
  };

  const selectAllLogs = () => {
    if (selectedLogs.size === logs.length) {
      setSelectedLogs(new Set());
    } else {
      setSelectedLogs(new Set(logs.map((log: any) => log._id)));
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <Plus className="w-4 h-4" />;
      case 'UPDATE': return <RefreshCw className="w-4 h-4" />;
      case 'DELETE': return <Trash2 className="w-4 h-4" />;
      case 'LOGIN': return <LogIn className="w-4 h-4" />;
      case 'EXPORT': return <Download className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'ERROR':
      case 'CRITICAL':
      case 'EMERGENCY':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'WARNING':
      case 'ALERT':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'NOTICE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DEBUG':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getOptionForChart = () => {
    if (!stats) return {};

    return {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['Actions', 'Errors', 'Warnings']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: stats.hourly?.map((item: any) => item.hour) || []
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: 'Actions',
          type: 'line',
          smooth: true,
          data: stats.hourly?.map((item: any) => item.count) || []
        },
        {
          name: 'Errors',
          type: 'line',
          smooth: true,
          data: stats.hourly?.map((item: any) => item.errors) || []
        },
        {
          name: 'Warnings',
          type: 'line',
          smooth: true,
          data: stats.hourly?.map((item: any) => item.warnings) || []
        }
      ]
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <TerminalSquare className="w-8 h-8 text-blue-600" />
              System Activity Monitor
            </h2>
            <p className="text-gray-600 mt-2">Real-time tracking of all administrative actions and system events</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setLiveMode(!liveMode)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium ${
                liveMode 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {liveMode ? (
                <>
                  <Zap className="w-4 h-4 animate-pulse" />
                  Live Mode
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  Live Mode
                </>
              )}
            </button>
            
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium ${
                autoRefresh 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto-refresh
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Logs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalLogs.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Database className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today</p>
                  <p className="text-2xl font-bold text-green-600">{stats.todayCount.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Admins</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.activeAdmins}</p>
                </div>
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Errors</p>
                  <p className="text-2xl font-bold text-red-600">{stats.errorCount.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Warnings</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.warningCount.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Response</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.avgResponseTime}ms</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">API Calls</p>
                  <p className="text-2xl font-bold text-pink-600">{stats.apiCalls.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Server className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Data Changed</p>
                  <p className="text-2xl font-bold text-teal-600">{stats.dataChanges.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-teal-100 rounded-lg">
                  <GitCommit className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Search logs by message, admin name, IP address, user agent, or any field..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  fetchLogs();
                }}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Advanced Filters */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Advanced Filters
            </h3>
            <button
              onClick={() => {
                setFilters({
                  startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
                  endDate: format(new Date(), 'yyyy-MM-dd'),
                  adminId: '',
                  action: '',
                  entity: '',
                  severity: '',
                  ipAddress: '',
                  userAgent: '',
                  statusCode: '',
                  minDuration: '',
                  maxDuration: '',
                  tags: [],
                  hasError: false,
                  hasWarnings: false,
                  hasChanges: false
                });
                setPage(1);
              }}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Reset All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Action Type</label>
              <select
                name="action"
                value={filters.action}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Actions</option>
                {actionTypes.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Entity Type</label>
              <select
                name="entity"
                value={filters.entity}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Entities</option>
                {entityTypes.map(entity => (
                  <option key={entity} value={entity}>{entity}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Severity Level</label>
              <select
                name="severity"
                value={filters.severity}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Levels</option>
                {severityLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">IP Address</label>
              <input
                type="text"
                name="ipAddress"
                value={filters.ipAddress}
                onChange={handleFilterChange}
                placeholder="e.g., 192.168.1.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Status Code</label>
              <select
                name="statusCode"
                value={filters.statusCode}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Codes</option>
                {statusCodes.map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Response Time</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="minDuration"
                  value={filters.minDuration}
                  onChange={handleFilterChange}
                  placeholder="Min (ms)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="number"
                  name="maxDuration"
                  value={filters.maxDuration}
                  onChange={handleFilterChange}
                  placeholder="Max (ms)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
            
            <div className="flex items-end">
              <div className="w-full space-y-2">
                <label className="flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    name="hasError"
                    checked={filters.hasError}
                    onChange={handleFilterChange}
                    className="rounded border-gray-300"
                  />
                  Show Only Errors
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    name="hasWarnings"
                    checked={filters.hasWarnings}
                    onChange={handleFilterChange}
                    className="rounded border-gray-300"
                  />
                  Show Only Warnings
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    name="hasChanges"
                    checked={filters.hasChanges}
                    onChange={handleFilterChange}
                    className="rounded border-gray-300"
                  />
                  Show Data Changes Only
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Visualization */}
      {stats && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Activity Trends (Last 24 Hours)
          </h3>
          <div className="h-80">
            <ReactECharts option={getOptionForChart()} style={{ height: '100%' }} />
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedLogs.size > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{selectedLogs.size} logs selected</p>
              <p className="text-sm text-gray-600">Perform bulk actions on selected logs</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Selected
            </button>
            <button
              onClick={() => setSelectedLogs(new Set())}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Export Progress */}
      {exportProgress !== null && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium text-gray-900">Exporting logs...</p>
            <p className="text-sm text-gray-600">{exportProgress}%</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              // @ts-ignore
              style={{ width: `${exportProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing <span className="font-semibold">{((page - 1) * 50 + 1).toLocaleString()}</span> to{' '}
          <span className="font-semibold">{Math.min(page * 50, totalLogs).toLocaleString()}</span> of{' '}
          <span className="font-semibold">{totalLogs.toLocaleString()}</span> logs
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded text-sm font-medium ${viewMode === 'table' ? 'bg-white shadow' : 'text-gray-600'}`}
            >
              <List className="w-4 h-4 inline-block mr-1" />
              Table
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-1.5 rounded text-sm font-medium ${viewMode === 'card' ? 'bg-white shadow' : 'text-gray-600'}`}
            >
              <Layers className="w-4 h-4 inline-block mr-1" />
              Cards
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded text-sm font-medium ${viewMode === 'timeline' ? 'bg-white shadow' : 'text-gray-600'}`}
            >
              <Clock className="w-4 h-4 inline-block mr-1" />
              Timeline
            </button>
          </div>
          
          <button
            onClick={handleClearLogs}
            className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear Logs
          </button>
        </div>
      </div>

      {/* Logs Display */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                    <input
                      type="checkbox"
                      checked={selectedLogs.size === logs.length && logs.length > 0}
                      onChange={selectAllLogs}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action & Severity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP & Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                        <p className="text-gray-500">Loading logs...</p>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Database className="w-12 h-12 text-gray-300" />
                        <p className="text-gray-500">No logs found matching your criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log: any) => (
                    <tr 
                      key={log._id} 
                      className={`hover:bg-gray-50 transition-colors ${
                        selectedLogs.has(log._id) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedLogs.has(log._id)}
                          onChange={() => toggleSelectLog(log._id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(log.timestamp), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(log.timestamp), 'HH:mm:ss')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{log.adminName}</div>
                            <div className="text-xs text-gray-500">{log.adminEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(log.severity)}`}>
                              {log.action}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Severity: <span className={`font-medium ${log.severity === 'ERROR' ? 'text-red-600' : 'text-gray-600'}`}>
                              {log.severity}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{log.entity}</div>
                        {log.entityId && (
                          <div className="text-xs text-gray-500">ID: {log.entityId}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1 text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                        <div className="text-xs text-gray-500 truncate max-w-xs" title={log.message}>
                          {log.message}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-mono text-gray-900">{log.ipAddress}</div>
                        <div className="text-xs text-gray-500">
                          {log.location?.country || 'Unknown location'}
                          {log.location?.city && `, ${log.location.city}`}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <span className={`px-2 py-1 rounded ${log.statusCode >= 400 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {log.statusCode}
                          </span>
                        </div>
                        {log.responseTime && (
                          <div className="text-xs text-gray-500 mt-1">
                            {log.responseTime}ms
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {logs.map((log: any) => (
            <div 
              key={log._id} 
              className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all ${
                selectedLogs.has(log._id) ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedLogs.has(log._id)}
                    onChange={() => toggleSelectLog(log._id)}
                    className="rounded border-gray-300"
                  />
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                    {getActionIcon(log.action)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{log.adminName}</div>
                    <div className="text-xs text-gray-500">{format(new Date(log.timestamp), 'PPpp')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(log.severity)}`}>
                    {log.severity}
                  </span>
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-700">{log.action}</span>
                  <span className="text-sm text-gray-500">on</span>
                  <span className="text-sm font-medium text-blue-600">{log.entity}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{log.message}</p>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {log.ipAddress}
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {log.statusCode}
                  </span>
                  {log.responseTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {log.responseTime}ms
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedLog(log)}
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                >
                  View Full Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200 ml-6"></div>
          <div className="space-y-6">
            {logs.map((log: any) => (
              <div key={log._id} className="relative pl-16">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-white border-4 border-white rounded-full flex items-center justify-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    log.severity === 'ERROR' ? 'bg-red-100 text-red-600' :
                    log.severity === 'WARNING' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {getActionIcon(log.action)}
                  </div>
                </div>
                
                <div className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all ${
                  selectedLogs.has(log._id) ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium text-gray-900">{log.adminName}</div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(log.timestamp), 'PPpp')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedLogs.has(log._id)}
                        onChange={() => toggleSelectLog(log._id)}
                        className="rounded border-gray-300"
                      />
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(log.severity)}`}>
                        {log.severity}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-sm font-medium text-gray-900">
                      {log.action} â€¢ {log.entity} {log.entityId ? `(#${log.entityId})` : ''}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{log.message}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {log.ipAddress}
                    </span>
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      {log.statusCode}
                    </span>
                    {log.responseTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {log.responseTime}ms
                      </span>
                    )}
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="ml-auto text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="bg-white px-4 py-3 rounded-xl border border-gray-200 flex items-center justify-between">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="sr-only">First</span>
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === pageNum
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="sr-only">Last</span>
                <SkipForward className="w-4 h-4" />
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => handleExport('csv')}
            className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-medium shadow-sm"
          >
            <FileSpreadsheet className="w-5 h-5" />
            Export CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium shadow-sm"
          >
            <File className="w-5 h-5" />
            Export Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 font-medium shadow-sm"
          >
            <FileText className="w-5 h-5" />
            Export PDF
          </button>
          <button
            onClick={() => handleExport('json')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 font-medium shadow-sm"
          >
            <FileCode className="w-5 h-5" />
            Export JSON
          </button>
          <button
            onClick={() => handleExport('xml')}
            className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2 font-medium shadow-sm"
          >
            <Code className="w-5 h-5" />
            Export XML
          </button>
        </div>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <TerminalSquare className="w-6 h-6 text-blue-600" />
                Log Details
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-xs font-medium text-blue-700 uppercase mb-2">Admin Information</p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{selectedLog.adminName}</p>
                        <p className="text-sm text-gray-600">{selectedLog.adminEmail}</p>
                        <p className="text-xs text-gray-500 mt-1">Role: {selectedLog.adminRole || 'Admin'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                    <p className="text-xs font-medium text-green-700 uppercase mb-2">Action Details</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Action:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getSeverityColor(selectedLog.severity)}`}>
                          {selectedLog.action}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Entity:</span>
                        <span className="font-medium text-gray-900">{selectedLog.entity}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Severity:</span>
                        <span className={`font-medium ${
                          selectedLog.severity === 'ERROR' ? 'text-red-600' : 
                          selectedLog.severity === 'WARNING' ? 'text-yellow-600' : 
                          'text-green-600'
                        }`}>
                          {selectedLog.severity}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                    <p className="text-xs font-medium text-gray-700 uppercase mb-2">Technical Info</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Timestamp:</span>
                        <span className="font-mono text-sm text-gray-900">
                          {format(new Date(selectedLog.timestamp), 'yyyy-MM-dd HH:mm:ss.SSS')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          selectedLog.statusCode >= 400 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {selectedLog.statusCode}
                        </span>
                      </div>
                      {selectedLog.responseTime && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Response Time:</span>
                          <span className="font-medium text-gray-900">{selectedLog.responseTime}ms</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Network Info */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                  <p className="text-xs font-medium text-purple-700 uppercase mb-3">Network Information</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">IP Address</p>
                      <p className="font-mono text-gray-900 bg-white p-2 rounded border border-gray-200">
                        {selectedLog.ipAddress}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Location</p>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">
                          {selectedLog.location?.country || 'Unknown'}
                          {selectedLog.location?.city && `, ${selectedLog.location.city}`}
                        </span>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">User Agent</p>
                      <p className="text-sm text-gray-600 bg-white p-2 rounded border border-gray-200 break-all">
                        {selectedLog.userAgent}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Message & Details */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Message</p>
                  <p className="text-gray-900 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {selectedLog.message}
                  </p>
                </div>
                
                {/* Detailed Data */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Full Details</p>
                  <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 overflow-x-auto">
                    <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.details || selectedLog, null, 2)}
                    </pre>
                  </div>
                </div>
                
                {/* Changes & Diff */}
                {selectedLog.changes && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Data Changes</p>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-blue-700 mb-2">Before</p>
                          <pre className="text-xs text-gray-700 bg-white p-3 rounded border border-blue-100 overflow-x-auto">
                            {JSON.stringify(selectedLog.changes.before, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-green-700 mb-2">After</p>
                          <pre className="text-xs text-gray-700 bg-white p-3 rounded border border-green-100 overflow-x-auto">
                            {JSON.stringify(selectedLog.changes.after, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex justify-between items-center">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
                  alert('Log details copied to clipboard!');
                }}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy to Clipboard
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Add to watchlist or create alert
                    alert('Added to watchlist!');
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Add to Watchlist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogs;
