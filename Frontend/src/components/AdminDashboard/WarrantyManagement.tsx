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

      doc.save(`warranties_${Date.now()}.pdf`);
    } catch (err: any) {
      alert(err?.message || 'Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Warranty Management</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={exportWarranties}
            className="bg-white border border-gray-300 px-4 py-2 rounded-xl hover:bg-gray-50 flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={exportWarrantiesPDF}
            disabled={exporting}
            className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" /> {exporting ? 'Exporting...' : 'PDF'}
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <DateFilter
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        label="Filter Warranties by Registration Date"
      />

      <div className="space-y-4">
        {filteredWarranties.map((warranty) => (
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
                  onClick={() =>
                    handleWarrantyAction(warranty._id, 'approved')
                  }
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() =>
                    handleWarrantyAction(warranty._id, 'rejected')
                  }
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

export default WarrantyManagement;
