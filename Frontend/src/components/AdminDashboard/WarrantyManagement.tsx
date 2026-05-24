import React, { useState, useMemo } from 'react';
import { Download, CheckCircle, X, FileDown } from 'lucide-react';
import api from '../../api';
import { Warranty } from './types';
import DateFilter from './DateFilter';

interface WarrantyManagementProps {
  warranties: Warranty[];
  onWarrantiesUpdated: () => void;
}

const WarrantyManagement: React.FC<WarrantyManagementProps> = ({
  warranties,
  onWarrantiesUpdated,
}) => {
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [exporting, setExporting] = useState(false);

  const filteredWarranties = useMemo(() => {
    if (!dateFrom && !dateTo) return warranties;
    const fromTime = dateFrom ? new Date(dateFrom).getTime() : Number.NEGATIVE_INFINITY;
    let toTime = Number.POSITIVE_INFINITY;

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      toTime = toDate.getTime();
    }

    return warranties.filter((w) => {
      const created = w.createdAt ? new Date(w.createdAt).getTime() : undefined;
      if (created === undefined) return true;
      return created >= fromTime && created <= toTime;
    });
  }, [warranties, dateFrom, dateTo]);

  const handleWarrantyAction = async (warrantyId: string, action: string) => {
    try {
      await api.put(`/api/warranties/${warrantyId}`, { status: action });
      alert(`Warranty ${action} successfully`);
      onWarrantiesUpdated();
    } catch (error: any) {
      alert(
        error.response?.data?.message || `Failed to ${action} warranty`
      );
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

  const exportWarranties = () => {
    const data = filteredWarranties.map((w) => ({
      ID: w._id,
      Customer: w.userId?.name || 'Unknown',
      Email: w.userId?.email || 'N/A',
      ProductName: w.productName,
      SerialNumber: w.serialNumber,
      ModelNumber: w.modelNumber,
      PurchaseDate: new Date(w.purchaseDate).toLocaleDateString(),
      PurchaseType: w.purchaseType,
      Status: w.status,
      RegisteredDate: new Date(w.createdAt).toLocaleDateString(),
    }));
    downloadCSV(
      data,
      `warranties_export_${new Date().toISOString().split('T')[0]}.csv`
    );
  };

  const exportWarrantiesPDF = async () => {
    try {
      setExporting(true);
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default as any;
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text('Telogica Warranties Report', 14, 18);
      doc.setFontSize(11);
      const subtitle = `Warranties: ${filteredWarranties.length} | Generated: ${new Date().toLocaleString()}`;
      doc.text(subtitle, 14, 26);
      if (dateFrom || dateTo) doc.text(`Date Filter: ${dateFrom || 'Any'} to ${dateTo || 'Any'}`, 14, 32);

      const head = [['Customer', 'Email', 'Product', 'Serial #', 'Status', 'Purchase Date', 'Registered']];
      const body = filteredWarranties.map((w) => [
        w.userId?.name || 'Unknown',
        w.userId?.email || 'N/A',
        w.productName,
        w.serialNumber,
        w.status,
        new Date(w.purchaseDate).toLocaleDateString(),
        new Date(w.createdAt).toLocaleDateString(),
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

      doc.save(`warranties_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err: any) {
      alert(err?.message || 'Failed to generate PDF export');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions Card */}
      <div className="bg-white border border-gray-200 rounded-none shadow-sm mb-6">
        <div className="px-5 py-4 border-b border-gray-150 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
          <div>
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Warranty Management</h2>
            <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">Track, review, and validate customer product warranty registrations</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportWarranties}
              className="bg-white border border-gray-200 px-4 py-2 rounded-none hover:bg-gray-50 flex items-center gap-2 text-xs font-bold uppercase tracking-wider border-gray-300 transition-colors"
            >
              <Download className="w-4 h-4" /> CSV
            </button>
            <button
              onClick={exportWarrantiesPDF}
              disabled={exporting}
              className="bg-emerald-600 text-white px-4 py-2 rounded-none hover:bg-emerald-700 flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" /> {exporting ? 'Exporting...' : 'PDF'}
            </button>
          </div>
        </div>
        <div className="p-5">
          <DateFilter
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            label="Filter Warranties by Registration Date"
            showPresets={true}
            className="border-0 shadow-none p-0"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredWarranties.map((warranty) => (
          <div
            key={warranty._id}
            className="bg-white p-5 rounded-none border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-sm text-gray-900">{warranty.productName}</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  Customer: {warranty.userId?.name} ({warranty.userId?.email})
                </p>
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-1.5">
                  Registered: {new Date(warranty.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider border ${
                  warranty.status === 'pending'
                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    : warranty.status === 'approved'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                {warranty.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 bg-gray-50/50 p-4 border border-gray-100 rounded-none">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Serial Number</p>
                <p className="font-mono text-xs font-bold text-gray-950 mt-0.5">{warranty.serialNumber}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Model Number</p>
                <p className="font-mono text-xs font-bold text-gray-950 mt-0.5">{warranty.modelNumber}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Purchase Date</p>
                <p className="text-xs font-bold text-gray-900 mt-0.5">
                  {new Date(warranty.purchaseDate).toLocaleDateString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Purchase Type</p>
                <p className="text-xs font-bold text-gray-900 uppercase mt-0.5">{warranty.purchaseType}</p>
              </div>
            </div>

            {warranty.invoiceUrl && (
              <div className="mb-4">
                <a
                  href={warranty.invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 text-xs font-bold uppercase tracking-wider hover:underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  View Invoice
                </a>
              </div>
            )}

            {warranty.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleWarrantyAction(warranty._id, 'approved')
                  }
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-none flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() =>
                    handleWarrantyAction(warranty._id, 'rejected')
                  }
                  className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-none flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors"
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

export default WarrantyManagement;
