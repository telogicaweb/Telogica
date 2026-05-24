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
import DateFilter from './DateFilter';

interface DashboardOverviewProps {
  analytics: Analytics;
  onDateRangeChange?: (dateFrom: string, dateTo: string) => void;
}

// Utility functions
const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;
const formatNumber = (value: number) => value.toLocaleString('en-IN');

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ analytics, onDateRangeChange }) => {
  const [exporting, setExporting] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    if (onDateRangeChange) {
      onDateRangeChange(value, dateTo);
    }
  };

  const handleDateToChange = (value: string) => {
    setDateTo(value);
    if (onDateRangeChange) {
      onDateRangeChange(dateFrom, value);
    }
  };

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
    <div className="space-y-6">
      {/* Header & Export Summary Card */}
      <div className="bg-white border border-gray-200 p-5 rounded-none shadow-sm flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
        <div>
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Dashboard Overview</h2>
          <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">Global metrics and quick statistics overview</p>
        </div>
        <button
          onClick={exportSummaryPDF}
          disabled={exporting}
          className="bg-emerald-600 border border-emerald-700 text-white px-4 py-2 rounded-none hover:bg-emerald-700 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
        >
          <FileDown className="w-4 h-4" />
          {exporting ? 'Exporting…' : 'Export Summary'}
        </button>
      </div>

      {/* Date Filter */}
      <DateFilter
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={handleDateFromChange}
        onDateToChange={handleDateToChange}
        label="Dashboard Date Filter"
        className="border border-gray-200"
      />

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[{
          label: 'Total Sales',
          value: formatCurrency(analytics.sales.total),
          icon: DollarSign,
          colors: 'from-blue-600 to-blue-700 border-blue-700'
        }, {
          label: 'Total Orders',
          value: formatNumber(analytics.orders.total),
          icon: ShoppingCart,
          colors: 'from-green-600 to-green-700 border-green-700'
        }, {
          label: 'Pending Quotes',
          value: formatNumber(analytics.quotes.pending),
          sub: `Conversion: ${conversionRate}%`,
          icon: FileText,
          colors: 'from-yellow-500 to-yellow-600 border-yellow-600'
        }, {
          label: 'Pending Warranties',
          value: formatNumber(analytics.warranties.pending),
          icon: Shield,
          colors: 'from-purple-600 to-purple-700 border-purple-700'
        }].map((card, idx) => (
          <div
            key={idx}
            className={`bg-gradient-to-br ${card.colors} p-5 rounded-none text-white shadow-sm border hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider">{card.label}</p>
                <p className="text-2xl font-black mt-1">{card.value}</p>
                {card.sub && (
                  <p className="text-[10px] font-bold mt-1 text-white/95 uppercase tracking-wider">{card.sub}</p>
                )}
              </div>
              <card.icon className="w-10 h-10 text-white/40" />
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[{
          label: 'Direct Sales',
          value: formatCurrency(analytics.sales.direct),
          icon: TrendingUp,
          color: 'text-blue-600',
          accent: 'border-t-blue-600'
        }, {
          label: 'Quote Sales',
          value: formatCurrency(analytics.sales.quote),
          icon: BarChart3,
          color: 'text-green-600',
          accent: 'border-t-green-600'
        }, {
          label: 'Total Users',
          value: formatNumber(analytics.users.total),
          icon: Users,
          color: 'text-purple-600',
          accent: 'border-t-purple-600'
        }, {
          label: 'Retailers Waiting Approval',
          value: formatNumber(analytics.users.pendingRetailers),
          icon: AlertCircle,
          color: 'text-red-600',
          accent: 'border-t-red-600'
        }].map((card, idx) => (
          <div
            key={idx}
            className={`bg-white p-5 rounded-none shadow-sm border border-gray-200 border-t-4 ${card.accent} hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{card.label}</p>
                <p className="text-xl font-black text-gray-950 mt-1">{card.value}</p>
              </div>
              <card.icon className={`w-8 h-8 ${card.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        }].map((box, idx) => {
          const isBlue = box.color === 'blue';
          const isGreen = box.color === 'green';
          const bg = isBlue ? 'bg-blue-50/70 border-blue-200' : isGreen ? 'bg-green-50/70 border-green-200' : 'bg-yellow-50/70 border-yellow-200';
          const textLabel = isBlue ? 'text-blue-600' : isGreen ? 'text-green-600' : 'text-yellow-750';
          const textVal = isBlue ? 'text-blue-900' : isGreen ? 'text-green-900' : 'text-yellow-950';

          return (
            <div
              key={idx}
              className={`${bg} border rounded-none p-5 shadow-sm hover:shadow-md transition-shadow`}
            >
              <p className={`text-[10px] font-bold uppercase tracking-wider ${textLabel}`}>
                {box.label}
              </p>
              <p className={`text-2xl font-black ${textVal} mt-1`}>
                {formatNumber(box.value)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardOverview;
