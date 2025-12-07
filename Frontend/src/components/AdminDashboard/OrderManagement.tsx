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

    const fromTime = dateFrom ? new Date(dateFrom).getTime() : -Infinity;
    const toTime = dateTo ? new Date(dateTo).getTime() : Infinity;

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
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Order Management</h2>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500"
          />

          <span className="text-gray-600 font-medium">to</span>

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={exportOrders}
            className="bg-white border border-gray-300 px-4 py-2 rounded-xl hover:bg-gray-50 flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" /> CSV
          </button>

          <button
            onClick={exportOrdersPDF}
            disabled={exporting}
            className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" /> {exporting ? 'Exporting…' : 'PDF'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Order ID', 'Customer', 'Products', 'Amount', 'Status', 'Date', 'Actions'].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50 transition-all">
                  <td className="px-6 py-4 text-sm font-mono text-gray-900">
                    {order.orderNumber || order._id.slice(-8)}
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <div className="font-semibold text-gray-900">{order.userId?.name || (order as any).userName || 'Guest User'}</div>
                    <div className="text-gray-600">{order.userId?.email || (order as any).userEmail || 'N/A'}</div>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-900">{order.products.length} item(s)</td>

                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    ₹{order.totalAmount.toLocaleString()}
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <select
                      value={order.orderStatus}
                      onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold shadow-sm border-0 cursor-pointer transition ${
                        order.orderStatus === 'delivered'
                          ? 'bg-green-100 text-green-800'
                          : order.orderStatus === 'shipped'
                          ? 'bg-blue-100 text-blue-800'
                          : order.orderStatus === 'processing'
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.orderStatus === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-800">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <button
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-xs font-medium">View</span>
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