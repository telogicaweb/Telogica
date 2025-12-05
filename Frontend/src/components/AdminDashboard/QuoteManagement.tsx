import React, { useMemo, useState } from 'react';
import { Check, X, Download, FileDown } from 'lucide-react';
import api from '../../api';
import { Quote } from './types';

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

  const filteredQuotes = useMemo(() => {
    if (!dateFrom && !dateTo) return quotes;
    const fromTime = dateFrom ? new Date(dateFrom).getTime() : Number.NEGATIVE_INFINITY;
    const toTime = dateTo ? new Date(dateTo).getTime() : Number.POSITIVE_INFINITY;
    return quotes.filter((q) => {
      const created = q.createdAt ? new Date(q.createdAt).getTime() : undefined;
      if (created === undefined) return true; // include if missing
      return created >= fromTime && created <= toTime;
    });
  }, [quotes, dateFrom, dateTo]);

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
      await api.put(`/api/quotes/${quoteId}/reject`);
      alert('Quote rejected successfully');
      onQuotesUpdated();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to reject quote');
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Quote Management</h2>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
            aria-label="From Date"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
            aria-label="To Date"
          />
          <button
            onClick={exportQuotes}
            className="bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={exportQuotesPDF}
            disabled={exporting}
            className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            {exporting ? 'Exporting…' : 'PDF'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredQuotes.map((quote) => (
          <div
            key={quote._id}
            className="bg-white p-6 rounded-lg shadow border border-gray-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {quote.user?.name || quote.userId?.name || 'Unknown User'}
                </h3>
                <p className="text-sm text-gray-600">
                  {quote.user?.email || quote.userId?.email}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {quote.createdAt
                    ? new Date(quote.createdAt).toLocaleString()
                    : ''}
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
                    •{' '}
                    {(item.product?.name || item.productId?.name) ||
                      'Unknown Product'}{' '}
                    (Qty: {item.quantity})
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

            {(quote.adminResponse ||
              (quote.adminResponse && typeof quote.adminResponse === 'string')) && (
              <div className="mb-4">
                <h4 className="font-medium text-sm text-gray-700 mb-1">
                  Admin Response:
                </h4>
                <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                  {typeof quote.adminResponse === 'string'
                    ? quote.adminResponse
                    : quote.adminResponse?.message}
                </p>
                {(quote.adminResponse?.totalPrice || quote.quotedPrice) && (
                  <p className="text-sm font-semibold text-gray-800 mt-2">
                    Quoted Price: ₹{quote.adminResponse?.totalPrice || quote.quotedPrice}
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
};

export default QuoteManagement;
