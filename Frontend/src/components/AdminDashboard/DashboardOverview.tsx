import React, { useState } from 'react';
import {
  FileDown,
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

// Utility functions
const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;
const formatNumber = (value: number) => value.toLocaleString('en-IN');

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ analytics }) => {
  const [exporting, setExporting] = useState(false);

  const conversionRate =
    typeof analytics.quotes.conversionRate === 'number'
      ? analytics.quotes.conversionRate.toFixed(2)
      : analytics.quotes.conversionRate;

  // Export PDF function
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
        doc.text(`Page ${i} of ${pageCount}`, 196, 287, { align: 'right' });
      }

      doc.save(`dashboard_${Date.now()}.pdf`);
    } catch (err: any) {
      alert(err?.message || 'Failed to export dashboard PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
          Dashboard Overview
        </h2>
        <button
          onClick={exportSummaryPDF}
          disabled={exporting}
          className="bg-white border border-gray-300 px-4 py-2 rounded-xl shadow-sm hover:bg-gray-100 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <FileDown className="w-5 h-5" />
          {exporting ? 'Exporting…' : 'Export PDF'}
        </button>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[{
          label: 'Total Sales',
          value: formatCurrency(analytics.sales.total),
          icon: DollarSign,
          colors: 'from-blue-500 to-blue-600'
        }, {
          label: 'Total Orders',
          value: formatNumber(analytics.orders.total),
          icon: ShoppingCart,
          colors: 'from-green-500 to-green-600'
        }, {
          label: 'Pending Quotes',
          value: formatNumber(analytics.quotes.pending),
          sub: `Conversion: ${conversionRate}%`,
          icon: FileText,
          colors: 'from-yellow-500 to-yellow-600'
        }, {
          label: 'Pending Warranties',
          value: formatNumber(analytics.warranties.pending),
          icon: Shield,
          colors: 'from-purple-500 to-purple-600'
        }].map((card, idx) => (
          <div
            key={idx}
            className={`bg-gradient-to-br ${card.colors} p-6 rounded-xl text-white shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">{card.label}</p>
                <p className="text-3xl font-bold mt-1">{card.value}</p>
                {card.sub && (
                  <p className="text-xs mt-2 opacity-90">{card.sub}</p>
                )}
              </div>
              <card.icon className="w-12 h-12 opacity-80" />
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[{
          label: 'Direct Sales',
          value: formatCurrency(analytics.sales.direct),
          icon: TrendingUp,
          color: 'text-blue-500'
        }, {
          label: 'Quote Sales',
          value: formatCurrency(analytics.sales.quote),
          icon: BarChart3,
          color: 'text-green-500'
        }, {
          label: 'Total Users',
          value: formatNumber(analytics.users.total),
          icon: Users,
          color: 'text-purple-500'
        }, {
          label: 'Retailers Waiting Approval',
          value: formatNumber(analytics.users.pendingRetailers),
          icon: AlertCircle,
          color: 'text-red-500'
        }].map((card, idx) => (
          <div
            key={idx}
            className="bg-white p-6 rounded-xl shadow border border-gray-200 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <card.icon className={`w-10 h-10 ${card.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[{
          label: 'Inventory - Total',
          value: analytics.inventory.total,
          color: 'blue'
        }, {
          label: 'Inventory Online',
          value: analytics.inventory.online,
          color: 'green'
        }, {
          label: 'Inventory Offline',
          value: analytics.inventory.offline,
          color: 'yellow'
        }].map((box, idx) => (
          <div
            key={idx}
            className={`bg-${box.color}-50 border border-${box.color}-200 rounded-xl p-6 hover:shadow-lg transition-all`}
          >
            <p className={`text-sm uppercase tracking-wide text-${box.color}-700`}>
              {box.label}
            </p>
            <p className={`text-3xl font-bold text-${box.color}-900 mt-1`}>
              {formatNumber(box.value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardOverview;
