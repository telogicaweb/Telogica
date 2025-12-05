import React, { useState } from 'react';
import { Trash2, Mail } from 'lucide-react';
import api from '../../api';
import { ContactMessage } from './types';

interface ContactMessagesProps {
  messages: ContactMessage[];
  onMessagesUpdated: () => void;
}

const ContactMessages: React.FC<ContactMessagesProps> = ({
  messages,
  onMessagesUpdated,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  const filteredMessages =
    statusFilter === 'all'
      ? messages
      : messages.filter((msg) => msg.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Contact Messages</h2>
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
      </div>

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
