import React, { useState } from 'react';
import { FileDown } from 'lucide-react';
import {
  DollarSign,
  ShoppingCart,
  FileText,
  Shield,
  TrendingUp,
  BarChart3,
  Users,
  AlertCircle,
} from 'lucide-react';
import { Analytics } from './types';

interface DashboardOverviewProps {
  analytics: Analytics;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ analytics }) => {
  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;
  const formatNumber = (value: number) => value.toLocaleString('en-IN');

  const conversionRate =
    typeof analytics.quotes.conversionRate === 'number'
      ? analytics.quotes.conversionRate.toFixed(2)
      : analytics.quotes.conversionRate;

  const [exporting, setExporting] = useState(false);

  const exportSummaryPDF = async () => {
    try {
      setExporting(true);
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default as any;
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text('Telogica Dashboard Summary', 14, 18);
      doc.setFontSize(11);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);

      autoTable(doc, {
        startY: 34,
        head: [['Metric', 'Value']],
        body: [
          ['Sales Total', formatCurrency(analytics.sales.total)],
          ['Sales Direct', formatCurrency(analytics.sales.direct)],
          ['Sales Quote', formatCurrency(analytics.sales.quote)],
          ['Orders Total', formatNumber(analytics.orders.total)],
          ['Quotes Pending', formatNumber(analytics.quotes.pending)],
          ['Quotes Conversion', `${conversionRate}%`],
          ['Users Total', formatNumber(analytics.users.total)],
          ['Retailers Pending', formatNumber(analytics.users.pendingRetailers)],
          ['Inventory Total', formatNumber(analytics.inventory.total)],
          ['Inventory Online', formatNumber(analytics.inventory.online)],
          ['Inventory Offline', formatNumber(analytics.inventory.offline)],
          ['Warranties Pending', formatNumber(analytics.warranties.pending)],
        ],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 66, 66] },
      });

      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.text(`Page ${i} of ${pageCount}`, 200 - 14, 287, { align: 'right' });
      }

      doc.save(`dashboard_${Date.now()}.pdf`);
    } catch (err: any) {
      alert(err?.message || 'Failed to export dashboard PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
        <button
          onClick={exportSummaryPDF}
          disabled={exporting}
          className="bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
        >
          <FileDown className="w-4 h-4" />
          {exporting ? 'Exporting…' : 'Export PDF'}
        </button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Sales</p>
              <p className="text-3xl font-bold">{formatCurrency(analytics.sales.total)}</p>
            </div>
            <DollarSign className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Orders</p>
              <p className="text-3xl font-bold">{formatNumber(analytics.orders.total)}</p>
            </div>
            <ShoppingCart className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-lg text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Pending Quotes</p>
              <p className="text-3xl font-bold">{formatNumber(analytics.quotes.pending)}</p>
              <p className="text-xs text-yellow-200 mt-2">
                Conversion: {conversionRate}%
              </p>
            </div>
            <FileText className="w-12 h-12 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Pending Warranties</p>
              <p className="text-3xl font-bold">{formatNumber(analytics.warranties.pending)}</p>
            </div>
            <Shield className="w-12 h-12 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Direct Sales</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(analytics.sales.direct)}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Quote Sales</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(analytics.sales.quote)}</p>
            </div>
            <BarChart3 className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-gray-800">{formatNumber(analytics.users.total)}</p>
            </div>
            <Users className="w-10 h-10 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Retailers Waiting Approval</p>
              <p className="text-2xl font-bold text-gray-800">{formatNumber(analytics.users.pendingRetailers)}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
        </div>
      </div>

      {/* Inventory Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <p className="text-xs uppercase tracking-wide text-blue-600">Inventory - Total</p>
          <p className="text-2xl font-bold text-blue-900">{formatNumber(analytics.inventory.total)}</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
          <p className="text-xs uppercase tracking-wide text-green-600">Inventory Online</p>
          <p className="text-2xl font-bold text-green-900">{formatNumber(analytics.inventory.online)}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
          <p className="text-xs uppercase tracking-wide text-yellow-600">Inventory Offline</p>
          <p className="text-2xl font-bold text-yellow-900">{formatNumber(analytics.inventory.offline)}</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
