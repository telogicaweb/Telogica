import React, { useMemo, useState } from 'react';
import { 
  Check, 
  X, 
  Download, 
  FileDown, 
  Search, 
  User, 
  Mail, 
  Package, 
  MessageSquare,
  DollarSign,
  ChevronUp,
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  TrendingUp,
  Calendar
} from 'lucide-react';
import api from '../../api';
import { Quote } from './types';
import DateFilter from './DateFilter';

interface QuoteManagementProps {
  quotes: Quote[];
  onQuotesUpdated: () => void;
}

const QuoteManagement: React.FC<QuoteManagementProps> = ({
  quotes,
  onQuotesUpdated,
}) => {
  const [quoteResponse, setQuoteResponse] = useState({
    id: '',
    response: '',
    price: '',
  });
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedQuotes, setExpandedQuotes] = useState<Set<string>>(new Set());
  const [selectedQuotes, setSelectedQuotes] = useState<Set<string>>(new Set());

  const toggleQuoteExpansion = (quoteId: string) => {
    const newExpanded = new Set(expandedQuotes);
    if (newExpanded.has(quoteId)) {
      newExpanded.delete(quoteId);
    } else {
      newExpanded.add(quoteId);
    }
    setExpandedQuotes(newExpanded);
  };

  const toggleQuoteSelection = (quoteId: string) => {
    const newSelected = new Set(selectedQuotes);
    if (newSelected.has(quoteId)) {
      newSelected.delete(quoteId);
    } else {
      newSelected.add(quoteId);
    }
    setSelectedQuotes(newSelected);
  };

  const selectAllQuotes = () => {
    if (selectedQuotes.size === filteredQuotes.length) {
      setSelectedQuotes(new Set());
    } else {
      setSelectedQuotes(new Set(filteredQuotes.map(q => q._id)));
    }
  };

  const filteredQuotes = useMemo(() => {
    let filtered = quotes;
    
    // Date filtering
    if (dateFrom || dateTo) {
      const fromTime = dateFrom ? new Date(dateFrom).getTime() : Number.NEGATIVE_INFINITY;
      let toTime = Number.POSITIVE_INFINITY;
      
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        toTime = toDate.getTime();
      }

      filtered = filtered.filter((q) => {
        const created = q.createdAt ? new Date(q.createdAt).getTime() : undefined;
        if (created === undefined) return true;
        return created >= fromTime && created <= toTime;
      });
    }

    // Status filtering
    if (statusFilter !== 'all') {
      filtered = filtered.filter(q => q.status === statusFilter);
    }

    // Search filtering
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(q => 
        (q.user?.name || '').toLowerCase().includes(term) ||
        (q.user?.email || '').toLowerCase().includes(term) ||
        q.products.some(p => 
          (p.product?.name || '').toLowerCase().includes(term) ||
          (p.productId?.name || '').toLowerCase().includes(term)
        ) ||
        (q.message || '').toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [quotes, dateFrom, dateTo, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const total = quotes.length;
    const pending = quotes.filter(q => q.status === 'pending').length;
    const approved = quotes.filter(q => q.status === 'approved').length;
    const rejected = quotes.filter(q => q.status === 'rejected').length;
    const totalValue = quotes.reduce((sum, q) => 
      sum + (q.quotedPrice || q.adminResponse?.totalPrice || 0), 0
    );

    return { total, pending, approved, rejected, totalValue };
  }, [quotes]);

  const handleRespondToQuote = async (quoteId: string) => {
    if (!quoteResponse.response || !quoteResponse.price) {
      alert('Please provide response and quoted price');
      return;
    }
    try {
      await api.put(`/api/quotes/${quoteId}/respond`, {
        totalPrice: Number(quoteResponse.price),
        discountPercentage: 0,
        message: quoteResponse.response,
      });
      alert('Quote response sent successfully');
      setQuoteResponse({ id: '', response: '', price: '' });
      onQuotesUpdated();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to respond to quote');
    }
  };

  const handleRejectQuote = async (quoteId: string) => {
    const reason = window.prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      await api.put(`/api/quotes/${quoteId}/reject`, { reason });
      alert('Quote rejected successfully');
      onQuotesUpdated();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to reject quote');
    }
  };

  const handleApproveMultiple = async () => {
    if (selectedQuotes.size === 0) return;
    const confirmed = window.confirm(`Approve ${selectedQuotes.size} selected quotes?`);
    if (!confirmed) return;
    
    try {
      await Promise.all(
        Array.from(selectedQuotes).map(id => 
          api.put(`/api/quotes/${id}/approve`)
        )
      );
      alert(`Successfully approved ${selectedQuotes.size} quotes`);
      setSelectedQuotes(new Set());
      onQuotesUpdated();
    } catch (error: any) {
      alert('Failed to approve some quotes');
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
      ...data.map((row) =>
        headers
          .map((header) => {
            const cell =
              row[header] === null || row[header] === undefined ? '' : row[header];
            return JSON.stringify(cell);
          })
          .join(',')
      ),
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
    const data = filteredQuotes.map((q) => ({
      ID: q._id,
      User: q.user?.name || q.userId?.name || 'Unknown',
      Email: q.user?.email || q.userId?.email || 'Unknown',
      Status: q.status,
      Date: new Date(q.createdAt || '').toLocaleDateString(),
      Message: q.message || '',
      AdminResponse:
        typeof q.adminResponse === 'string'
          ? q.adminResponse
          : q.adminResponse?.message || '',
      QuotedPrice: q.quotedPrice || q.adminResponse?.totalPrice || 0,
    }));
    downloadCSV(
      data,
      `quotes_export_${new Date().toISOString().split('T')[0]}.csv`
    );
  };

  const exportQuotesPDF = async () => {
    try {
      setExporting(true);
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default as any;
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text('Telogica Quotes Report', 14, 18);
      doc.setFontSize(11);
      const subtitle = `Quotes: ${filteredQuotes.length} | Generated: ${new Date().toLocaleString()}`;
      doc.text(subtitle, 14, 26);
      if (dateFrom || dateTo) doc.text(`Date Filter: ${dateFrom || 'Any'} to ${dateTo || 'Any'}`, 14, 32);

      const head = [['ID', 'User', 'Email', 'Status', 'Date', 'Quoted Price']];
      const body = filteredQuotes.map((q) => [
        q._id,
        q.user?.name || q.userId?.name || 'Unknown',
        q.user?.email || q.userId?.email || 'Unknown',
        q.status,
        q.createdAt ? new Date(q.createdAt).toLocaleDateString() : '-',
        String(q.quotedPrice || q.adminResponse?.totalPrice || 0),
      ]);

      autoTable(doc, {
        startY: 38,
        head,
        body,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [76, 175, 80] },
      });

      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.text(`Page ${i} of ${pageCount}`, 200 - 14, 287, { align: 'right' });
      }

      doc.save(`quotes_${Date.now()}.pdf`);
    } catch (err: any) {
      alert(err?.message || 'Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertCircle },
      approved: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
    }[status] || { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertCircle };

    const Icon = config.icon;

    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 ${config.color}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quote Management</h1>
            <p className="text-gray-600 mt-2">Manage customer quotes and responses</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onQuotesUpdated()}
              className="p-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Quotes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-indigo-600">₹{stats.totalValue.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-indigo-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search quotes by user, product, or message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <div className="flex gap-2">
                <button
                  onClick={exportQuotes}
                  className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
                <button
                  onClick={exportQuotesPDF}
                  disabled={exporting}
                  className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <FileDown className="w-4 h-4" />
                  {exporting ? 'Exporting...' : 'PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <DateFilter
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        label="Filter Quotes by Date"
      />

      {/* Bulk Actions Bar */}
      {selectedQuotes.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{selectedQuotes.size} quotes selected</p>
              <p className="text-sm text-gray-600">Perform bulk actions on selected quotes</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleApproveMultiple}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Approve Selected
            </button>
            <button
              onClick={() => setSelectedQuotes(new Set())}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Quotes List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            Showing <span className="font-semibold">{filteredQuotes.length}</span> of{' '}
            <span className="font-semibold">{quotes.length}</span> quotes
          </p>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={selectedQuotes.size === filteredQuotes.length && filteredQuotes.length > 0}
                onChange={selectAllQuotes}
                className="rounded border-gray-300"
              />
              Select All
            </label>
          </div>
        </div>

        {filteredQuotes.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Try adjusting your filters or search terms to find what you're looking for.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredQuotes.map((quote) => {
              const isExpanded = expandedQuotes.has(quote._id);
              return (
              <div
                key={quote._id}
                className={`bg-white rounded-xl border transition-all hover:shadow-md ${
                  selectedQuotes.has(quote._id) 
                    ? 'border-blue-500 ring-2 ring-blue-100' 
                    : 'border-gray-200'
                }`}
              >
                {/* Quote Header - Condensed View */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="mt-1">
                        <input
                          type="checkbox"
                          checked={selectedQuotes.has(quote._id)}
                          onChange={() => toggleQuoteSelection(quote._id)}
                          className="rounded border-gray-300"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">
                              {quote.user?.name || quote.userId?.name || (quote as any).userName || 'Guest User'}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5" />
                                {quote.user?.email || quote.userId?.email || (quote as any).userEmail || 'N/A'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {quote.createdAt
                                  ? new Date(quote.createdAt).toLocaleDateString('en-US', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={quote.status ?? 'pending'} />
                      {(quote.adminResponse?.totalPrice || quote.quotedPrice) && (
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total Value</p>
                          <p className="text-xl font-bold text-green-600">
                            ₹{quote.adminResponse?.totalPrice || quote.quotedPrice}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Condensed Product Summary */}
                  {!isExpanded && (
                    <div className="mb-3 ml-14">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">{quote.products.length} Product{quote.products.length > 1 ? 's' : ''}</span>
                        {quote.products.length > 0 && (
                          <span className="text-gray-600">
                            {' • '}{quote.products[0].product?.name || quote.products[0].productId?.name || 'Unknown Product'}
                            {quote.products.length > 1 && ` +${quote.products.length - 1} more`}
                          </span>
                        )}
                      </p>
                      {quote.message && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                          Message: {quote.message}
                        </p>
                      )}
                    </div>
                  )}

                  {/* View Quote Toggle Button */}
                  <button
                    onClick={() => toggleQuoteExpansion(quote._id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 text-indigo-700 rounded-lg transition-all text-sm font-medium border border-indigo-200"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        View Quote
                      </>
                    )}
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Products Section */}
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <Package className="w-5 h-5 text-gray-500" />
                            <h4 className="font-medium text-gray-900">Products Requested</h4>
                          </div>
                          <div className="space-y-3">
                            {quote.products.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                                  <Package className="w-5 h-5 text-gray-400" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">
                                    {item.product?.name || item.productId?.name || 'Unknown Product'}
                                  </p>
                                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Messages Section */}
                        <div className="space-y-6">{quote.message && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <MessageSquare className="w-5 h-5 text-gray-500" />
                              <h4 className="font-medium text-gray-900">Customer Message</h4>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                              <p className="text-gray-700">{quote.message}</p>
                            </div>
                          </div>
                        )}

                        {(quote.adminResponse || 
                          (quote.adminResponse && typeof quote.adminResponse === 'string')) && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Check className="w-5 h-5 text-green-500" />
                              <h4 className="font-medium text-gray-900">Admin Response</h4>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                              <p className="text-gray-700">
                                {typeof quote.adminResponse === 'string'
                                  ? quote.adminResponse
                                  : quote.adminResponse?.message}
                              </p>
                              {quote.adminResponse?.totalPrice && (
                                <div className="mt-3 flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                  <span className="font-semibold text-green-700">
                                    Final Price: ₹{quote.adminResponse.totalPrice}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        </div>
                      </div>

                      {/* Action Buttons for Pending Quotes */}
                      {quote.status === 'pending' && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex flex-col lg:flex-row gap-4">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Your Response
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
                              rows={3}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter your detailed response to the customer..."
                            />
                          </div>
                          <div className="lg:w-64">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Quoted Price (₹)
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500">₹</span>
                              </div>
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
                                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                          <div className="flex gap-3 items-end">
                            <button
                              onClick={() => handleRespondToQuote(quote._id)}
                              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 flex items-center gap-2 transition-all shadow-sm hover:shadow"
                            >
                              <Check className="w-4 h-4" />
                              Approve Quote
                            </button>
                            <button
                              onClick={() => handleRejectQuote(quote._id)}
                              className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-700 hover:to-rose-700 flex items-center gap-2 transition-all"
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    </div>
                  )}
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuoteManagement;