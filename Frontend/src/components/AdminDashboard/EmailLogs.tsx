import React, { useState, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import api from '../../api';
import { EmailLog } from './types';
import DateFilter from './DateFilter';

interface EmailLogsProps {
  emailLogs: EmailLog[];
  onEmailLogsUpdated: () => void;
}

const EmailLogs: React.FC<EmailLogsProps> = ({ emailLogs, onEmailLogsUpdated }) => {
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const filteredEmailLogs = useMemo(() => {
    if (!dateFrom && !dateTo) return emailLogs;
    const fromTime = dateFrom ? new Date(dateFrom).getTime() : Number.NEGATIVE_INFINITY;
    const toTime = dateTo ? new Date(dateTo).getTime() : Number.POSITIVE_INFINITY;
    return emailLogs.filter((log) => {
      const sent = log.sentAt ? new Date(log.sentAt).getTime() : undefined;
      if (sent === undefined) return true;
      return sent >= fromTime && sent <= toTime;
    });
  }, [emailLogs, dateFrom, dateTo]);

  const handleResendEmail = async (logId: string) => {
    try {
      await api.post(`/api/email-logs/${logId}/resend`);
      alert('Email resent successfully');
      onEmailLogsUpdated();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to resend email');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Date Filter Card */}
      <div className="bg-white border border-gray-200 rounded-none shadow-sm mb-6">
        <div className="px-5 py-4 border-b border-gray-150 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
          <div>
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Email Logs</h2>
            <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">View and monitor all transactional and system notification emails</p>
          </div>
        </div>
        <div className="p-5">
          <DateFilter
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            label="Filter Email Logs by Date"
            showPresets={true}
            className="border-0 shadow-none p-0"
          />
        </div>
      </div>

      <div className="bg-white rounded-none border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Recipient', 'Subject', 'Type', 'Status', 'Sent At', 'Actions'].map((header) => (
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
              {filteredEmailLogs.map((log) => (
                <tr
                  key={log._id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {log.recipient}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-800">
                    {log.subject}
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <span className="px-2.5 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider border bg-blue-50 text-blue-700 border-blue-200">
                      {log.emailType}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2.5 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider border ${
                        log.status === 'sent'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                    {new Date(log.sentAt).toLocaleString('en-IN')}
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleResendEmail(log._id)}
                      className="text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 p-2 rounded-none transition-colors"
                      title="RESEND EMAIL"
                    >
                      <RefreshCw className="w-4 h-4" />
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

export default EmailLogs;
