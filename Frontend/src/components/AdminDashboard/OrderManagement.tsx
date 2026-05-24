// Beautified & Premium UI Order Management Component

import React, { useMemo, useState } from 'react';
import { Eye, Download, FileDown } from 'lucide-react';
import api from '../../api';
import { Order } from './types';
import DateFilter from './DateFilter';

interface OrderManagementProps {
  orders: Order[];
  onOrdersUpdated: () => void;
}

const OrderManagement: React.FC<OrderManagementProps> = ({ orders, onOrdersUpdated }) => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState(false);

  const filteredOrders = useMemo(() => {
    if (!dateFrom && !dateTo) return orders;

    const fromTime = dateFrom ? new Date(dateFrom).getTime() : Number.NEGATIVE_INFINITY;
    let toTime = Number.POSITIVE_INFINITY;
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      toTime = toDate.getTime();
    }

    return orders.filter((o) => {
      const created = o.createdAt ? new Date(o.createdAt).getTime() : undefined;
      if (created === undefined) return true;
      return created >= fromTime && created <= toTime;
    });
  }, [orders, dateFrom, dateTo]);

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.put(`/api/orders/${orderId}`, { status });
      alert('Order status updated successfully');
      onOrdersUpdated();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (!data.length) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);

    const csv = [
      headers.join(','),
      ...data.map((row) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportOrders = () => {
    const data = filteredOrders.map((o) => ({
      OrderNumber: o.orderNumber || o._id,
      User: o.userId?.name || (o as any).userName || 'Guest User',
      Email: o.userId?.email || (o as any).userEmail || 'N/A',
      Amount: o.totalAmount,
      Status: o.orderStatus,
      PaymentStatus: o.paymentStatus,
      Date: new Date(o.createdAt).toLocaleDateString(),
      ItemsCount: o.products.length,
      ProductsDetails: o.products
        .map(
          (p) => `${p.productId?.name || 'Unknown'} (Qty: ${p.quantity}) ${p.serialNumbers?.length ? `[SN: ${p.serialNumbers.join(', ')}]` : ''}`
        )
        .join('; '),
    }));

    downloadCSV(data, `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportOrdersPDF = async () => {
    try {
      setExporting(true);
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default as any;

      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text('Telogica Orders Report', 14, 18);
      doc.setFontSize(11);
      doc.text(`Orders: ${filteredOrders.length} | Generated: ${new Date().toLocaleString()}`, 14, 26);

      if (dateFrom || dateTo) {
        doc.text(`Date Filter: ${dateFrom || 'Any'} → ${dateTo || 'Any'}`, 14, 32);
      }

      autoTable(doc, {
        startY: 38,
        head: [['Order #', 'Customer', 'Email', 'Amount (₹)', 'Status', 'Payment', 'Date', 'Items']],
        body: filteredOrders.map((o) => [
          o.orderNumber || o._id,
          o.userId?.name || (o as any).userName || 'Guest User',
          o.userId?.email || (o as any).userEmail || 'N/A',
          String(o.totalAmount),
          o.orderStatus,
          o.paymentStatus,
          new Date(o.createdAt).toLocaleDateString(),
          String(o.products.length),
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [33, 150, 243] },
      });

      const pages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.text(`Page ${i} of ${pages}`, 196, 287, { align: 'right' });
      }

      doc.save(`orders_${Date.now()}.pdf`);
    } catch (err: any) {
      alert(err?.message || 'Failed to export PDF');
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
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Order Management</h2>
            <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">Track, update, and manage all customer purchases and dropshipments</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportOrders}
              className="bg-white border border-gray-200 px-4 py-2 rounded-none hover:bg-gray-50 flex items-center gap-2 text-xs font-bold uppercase tracking-wider border-gray-300 transition-colors"
            >
              <Download className="w-4 h-4" /> CSV
            </button>
            <button
              onClick={exportOrdersPDF}
              disabled={exporting}
              className="bg-emerald-600 text-white px-4 py-2 rounded-none hover:bg-emerald-700 flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" /> {exporting ? 'Exporting…' : 'PDF'}
            </button>
          </div>
        </div>
        <div className="p-5">
          <DateFilter
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            label="Filter Orders by Date"
            showPresets={true}
            className="border-0 shadow-none p-0"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-none border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Order ID', 'Customer', 'Products', 'Amount', 'Status', 'Date', 'Actions'].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-xs font-mono font-bold text-gray-950">
                    {order.orderNumber || order._id.slice(-8).toUpperCase()}
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-semibold text-sm text-gray-900">{order.userId?.name || (order as any).userName || 'Guest User'}</div>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">{order.userId?.email || (order as any).userEmail || 'N/A'}</div>
                  </td>

                  <td className="px-6 py-4 text-xs font-medium text-gray-700">{order.products.length} item(s)</td>

                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    ₹{order.totalAmount.toLocaleString('en-IN')}
                  </td>

                  <td className="px-6 py-4">
                    <select
                      value={order.orderStatus}
                      onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                      className={`px-2.5 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition focus:ring-1 focus:ring-slate-500 focus:outline-none ${
                        order.orderStatus === 'delivered'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : order.orderStatus === 'shipped'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : order.orderStatus === 'processing'
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          : order.orderStatus === 'cancelled'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      <option value="pending">PENDING</option>
                      <option value="processing">PROCESSING</option>
                      <option value="shipped">SHIPPED</option>
                      <option value="delivered">DELIVERED</option>
                      <option value="cancelled">CANCELLED</option>
                    </select>
                  </td>

                  <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </td>

                  <td className="px-6 py-4">
                    <button
                      className="text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 p-2 rounded-none transition-colors"
                      title="VIEW DETAILS"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;