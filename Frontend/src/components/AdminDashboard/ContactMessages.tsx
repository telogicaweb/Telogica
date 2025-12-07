import React, { useState, useMemo } from 'react';
import { Trash2, Mail, Download, FileDown } from 'lucide-react';
import api from '../../api';
import { ContactMessage } from './types';
import DateFilter from './DateFilter';

interface ContactMessagesProps {
  messages: ContactMessage[];
  onMessagesUpdated: () => void;
}

const ContactMessages: React.FC<ContactMessagesProps> = ({
  messages,
  onMessagesUpdated,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [exporting, setExporting] = useState(false);

  const handleStatusChange = async (
    messageId: string,
    newStatus: string
  ) => {
    try {
      await api.patch(`/api/contact/${messageId}`, { status: newStatus });
      alert('Status updated successfully');
      onMessagesUpdated();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      await api.delete(`/api/contact/${messageId}`);
      alert('Message deleted successfully');
      onMessagesUpdated();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete message');
    }
  };

  const filteredMessages = useMemo(() => {
    let filtered = messages;
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((msg) => msg.status === statusFilter);
    }
    
    // Date filter
    if (dateFrom || dateTo) {
      const fromTime = dateFrom ? new Date(dateFrom).getTime() : Number.NEGATIVE_INFINITY;
      let toTime = Number.POSITIVE_INFINITY;
      
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        toTime = toDate.getTime();
      }

      filtered = filtered.filter((msg) => {
        const created = msg.createdAt ? new Date(msg.createdAt).getTime() : undefined;
        if (created === undefined) return true;
        return created >= fromTime && created <= toTime;
      });
    }
    
    return filtered;
  }, [messages, statusFilter, dateFrom, dateTo]);

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

  const exportMessages = () => {
    const data = filteredMessages.map((m) => ({
      ID: m._id,
      Name: m.name,
      Email: m.email,
      Phone: m.phone,
      Subject: m.subject,
      Message: m.message,
      Status: m.status,
      Date: new Date(m.createdAt).toLocaleDateString(),
    }));
    downloadCSV(
      data,
      `contact_messages_export_${new Date().toISOString().split('T')[0]}.csv`
    );
  };

  const exportMessagesPDF = async () => {
    try {
      setExporting(true);
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default as any;
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text('Telogica Contact Messages Report', 14, 18);
      doc.setFontSize(11);
      const subtitle = `Messages: ${filteredMessages.length} | Generated: ${new Date().toLocaleString()}`;
      doc.text(subtitle, 14, 26);
      if (dateFrom || dateTo) doc.text(`Date Filter: ${dateFrom || 'Any'} to ${dateTo || 'Any'}`, 14, 32);

      const head = [['Name', 'Email', 'Phone', 'Subject', 'Status', 'Date']];
      const body = filteredMessages.map((m) => [
        m.name,
        m.email,
        m.phone,
        m.subject,
        m.status,
        new Date(m.createdAt).toLocaleDateString(),
      ]);

      autoTable(doc, {
        startY: 38,
        head,
        body,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [33, 150, 243] },
      });

      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.text(`Page ${i} of ${pageCount}`, 200 - 14, 287, { align: 'right' });
      }

      doc.save(`contact_messages_${Date.now()}.pdf`);
    } catch (err: any) {
      alert(err?.message || 'Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Contact Messages</h2>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Messages</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
          </select>
          <button
            onClick={exportMessages}
            className="bg-white border border-gray-300 px-4 py-2 rounded-xl hover:bg-gray-50 flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={exportMessagesPDF}
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
        label="Filter Messages by Date"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMessages.map((message) => (
          <div
            key={message._id}
            className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg text-gray-800">
                  {message.name}
                </h3>
                <p className="text-sm text-gray-500">{message.email}</p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  message.status === 'new'
                    ? 'bg-yellow-100 text-yellow-800'
                    : message.status === 'read'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                }`}
              >
                {message.status}
              </span>
            </div>

            <div className="mb-3">
              <p className="text-sm text-gray-600">
                <strong>Phone:</strong> {message.phone}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Subject:</strong> {message.subject}
              </p>
            </div>

            <div className="bg-gray-50 rounded p-3 mb-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {message.message}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <select
                  value={message.status}
                  onChange={(e) =>
                    handleStatusChange(message._id, e.target.value)
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="new">New</option>
                  <option value="read">Read</option>
                  <option value="replied">Replied</option>
                </select>
              </div>

              <div className="flex gap-2">
                <a
                  href={`mailto:${message.email}`}
                  className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm"
                >
                  <Mail className="w-4 h-4" />
                  Reply
                </a>
                <button
                  onClick={() => handleDeleteMessage(message._id)}
                  className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-3">
              {new Date(message.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {filteredMessages.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No messages found</p>
        </div>
      )}
    </div>
  );
};

export default ContactMessages;
