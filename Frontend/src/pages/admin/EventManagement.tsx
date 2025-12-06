import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { Plus, Edit, Trash2, ArrowLeft, Save, Calendar, Download } from 'lucide-react';

interface Event {
  _id?: string;
  title: string;
  eventDate: string;
  eventTime: string;
  location: string;
  type: string;
  description: string;
  registrationLink: string;
  isUpcoming: boolean;
}

export default function EventManagement() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [formData, setFormData] = useState<Event>({
    title: '',
    eventDate: '',
    eventTime: '',
    location: '',
    type: 'AGM',
    description: '',
    registrationLink: '',
    isUpcoming: true
  });

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user || JSON.parse(user).role !== 'admin') {
      navigate('/login');
      return;
    }
    loadEvents();
  }, [navigate]);

  const loadEvents = async () => {
    try {
      const response = await api.get('/api/events');
      setEvents(response.data);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    const queryParams = new URLSearchParams({
      format,
      ...(exportStartDate && { startDate: exportStartDate }),
      ...(exportEndDate && { endDate: exportEndDate }),
    });
    window.open(`${api.defaults.baseURL}/api/export/events?${queryParams.toString()}`, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEvent?._id) {
        await api.put(`/api/events/${editingEvent._id}`, formData);
      } else {
        await api.post('/api/events', formData);
      }
      setShowForm(false);
      setEditingEvent(null);
      resetForm();
      loadEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event');
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      ...event,
      eventDate: event.eventDate.split('T')[0]
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.delete(`/api/events/${id}`);
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      eventDate: '',
      eventTime: '',
      location: '',
      type: 'AGM',
      description: '',
      registrationLink: '',
      isUpcoming: true
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 pt-20 md:pt-24 pb-8 md:pb-16">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={() => navigate('/admin')} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft size={20} className="md:w-6 md:h-6" />
            </button>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Event Management</h1>
          </div>
          <button
            onClick={() => { resetForm(); setEditingEvent(null); setShowForm(true); }}
            className="bg-purple-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm md:text-base w-full sm:w-auto justify-center"
          >
            <Plus size={18} className="md:w-5 md:h-5" /> New Event
          </button>
        </div>

        {/* Export Section */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by Date:</span>
              <input
                type="date"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {(exportStartDate || exportEndDate) && (
                <button
                  onClick={() => { setExportStartDate(''); setExportEndDate(''); }}
                  className="text-sm text-red-600 hover:text-red-800 underline ml-2"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('pdf')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
              >
                <Download size={14} /> PDF
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded border border-green-200 transition-colors"
              >
                <Download size={14} /> CSV
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
              >
                <Download size={14} /> Excel
              </button>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">{editingEvent ? 'Edit Event' : 'New Event'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Date</label>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Time</label>
                  <input
                    type="time"
                    value={formData.eventTime}
                    onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="AGM">Annual General Meeting</option>
                    <option value="Earnings Call">Earnings Call</option>
                    <option value="Investor Meet">Investor Meet</option>
                    <option value="Conference">Conference</option>
                    <option value="Webinar">Webinar</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Registration Link</label>
                <input
                  type="url"
                  value={formData.registrationLink}
                  onChange={(e) => setFormData({ ...formData, registrationLink: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isUpcoming}
                  onChange={(e) => setFormData({ ...formData, isUpcoming: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Mark as Upcoming</span>
              </label>
              <div className="flex gap-4">
                <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2">
                  <Save size={20} /> Save
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {events.map((event) => (
            <div key={event._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="text-purple-600" size={20} />
                    <h3 className="text-xl font-bold">{event.title}</h3>
                    {event.isUpcoming && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Upcoming</span>
                    )}
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 mb-3">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Date:</span> {new Date(event.eventDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Time:</span> {event.eventTime}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Type:</span> {event.type}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Location:</span> {event.location}
                  </p>
                  {event.description && (
                    <p className="text-sm text-gray-700 mb-2">{event.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(event)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
                    <Edit size={16} /> Edit
                  </button>
                  <button onClick={() => handleDelete(event._id!)} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2">
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
