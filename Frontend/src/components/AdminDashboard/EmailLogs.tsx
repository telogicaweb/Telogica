import React from 'react';
import { RefreshCw } from 'lucide-react';
import api from '../../api';
import { EmailLog } from './types';

interface EmailLogsProps {
  emailLogs: EmailLog[];
  onEmailLogsUpdated: () => void;
}

const EmailLogs: React.FC<EmailLogsProps> = ({ emailLogs, onEmailLogsUpdated }) => {
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
    <div className="space-y-8 animate-fadeIn">
      <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Email Logs</h2>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Recipient', 'Subject', 'Type', 'Status', 'Sent At', 'Actions'].map((header) => (
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
              {emailLogs.map((log) => (
                <tr
                  key={log._id}
                  className="hover:bg-gray-50 transition-all"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {log.recipient}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-800">
                    {log.subject}
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 shadow-sm">
                      {log.emailType}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                        log.status === 'sent'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-700">
                    {new Date(log.sentAt).toLocaleString()}
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleResendEmail(log._id)}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-all"
                      title="Resend Email"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span className="text-xs font-semibold">Resend</span>
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
