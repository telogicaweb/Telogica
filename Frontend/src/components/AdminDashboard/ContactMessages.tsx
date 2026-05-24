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

      doc.save(`contact_messages_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err: any) {
      alert(err?.message || 'Failed to generate PDF export');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls Card */}
      <div className="bg-white border border-gray-200 rounded-none shadow-sm mb-6">
        <div className="px-5 py-4 border-b border-gray-150 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
          <div>
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Contact Messages</h2>
            <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">Manage customer inquiries and contact forms</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-none text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            >
              <option value="all">ALL MESSAGES</option>
              <option value="new">NEW</option>
              <option value="read">READ</option>
              <option value="replied">REPLIED</option>
            </select>
            <button
              onClick={exportMessages}
              className="bg-white border border-gray-200 px-3 py-2 rounded-none hover:bg-gray-50 flex items-center gap-2 text-xs font-bold uppercase tracking-wider border-gray-300 transition-colors"
            >
              <Download className="w-4 h-4" /> CSV
            </button>
            <button
              onClick={exportMessagesPDF}
              disabled={exporting}
              className="bg-emerald-600 text-white px-3 py-2 rounded-none hover:bg-emerald-700 flex items-center gap-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition-colors"
            >
              <FileDown className="w-4 h-4" /> {exporting ? 'EXPORTING...' : 'PDF'}
            </button>
          </div>
        </div>
        <div className="p-5">
          <DateFilter
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            label="Filter Messages by Date"
            showPresets={true}
            className="border-0 shadow-none p-0"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMessages.map((message) => (
          <div
            key={message._id}
            className="bg-white rounded-none border border-gray-200 shadow-sm p-5 border-l-4 border-l-blue-600 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-sm text-gray-900">
                  {message.name}
                </h3>
                <p className="text-xs text-gray-450 font-mono mt-0.5">{message.email}</p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider border ${
                  message.status === 'new'
                    ? 'bg-yellow-50 text-yellow-700 border-yellow-250'
                    : message.status === 'read'
                      ? 'bg-blue-50 text-blue-700 border-blue-250'
                      : 'bg-green-50 text-green-700 border-green-250'
                }`}
              >
                {message.status}
              </span>
            </div>

            <div className="mb-3">
              <p className="text-xs text-gray-600">
                <strong className="font-bold uppercase tracking-wider text-[10px] text-gray-400">Phone:</strong> {message.phone}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                <strong className="font-bold uppercase tracking-wider text-[10px] text-gray-400">Subject:</strong> {message.subject}
              </p>
            </div>

            <div className="bg-gray-50 rounded-none border border-gray-150 p-3 mb-4">
              <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
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
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="new">New</option>
                  <option value="read">Read</option>
                  <option value="replied">Replied</option>
                </select>
              </div>

              <div className="flex gap-2">
                <a
                  href={`mailto:${message.email}`}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-none hover:bg-blue-700 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Reply
                </a>
                <button
                  onClick={() => handleDeleteMessage(message._id)}
                  className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-none transition-colors"
                  title="DELETE MESSAGE"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-[10px] font-semibold text-gray-400 mt-3 uppercase tracking-wider">
              {new Date(message.createdAt).toLocaleString('en-IN')}
            </p>
          </div>
        ))}
      </div>

      {filteredMessages.length === 0 && (
        <div className="text-center py-12 bg-white border border-gray-250 p-12 rounded-none">
          <p className="text-gray-450 text-xs font-bold uppercase tracking-wider">No messages found</p>
        </div>
      )}
    </div>
  );
};

export default ContactMessages;
