import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { Plus, Edit, Trash2, ArrowLeft, Save, Calendar, Download, X, Clock } from 'lucide-react';

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

interface EventManagementProps {
  isEmbedded?: boolean;
  onBack?: () => void;
}

export default function EventManagement({ isEmbedded = false, onBack }: EventManagementProps = {}) {
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
    <div className={isEmbedded ? "" : "min-h-screen bg-gray-50"}>
      <div className={isEmbedded ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
        {/* Header with Back Navigation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onBack ? onBack() : navigate('/admin')}
              className="p-2 bg-white border border-gray-200 rounded-none hover:bg-gray-50 transition-colors"
              title="Back to Admin Dashboard"
            >
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-sm font-black text-gray-900 uppercase tracking-wider">Event Management</h1>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Content Management → Events</p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); setEditingEvent(null); setShowForm(true); }}
            className="px-5 py-2.5 bg-purple-600 text-white rounded-none font-bold uppercase tracking-wider text-xs hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> New Event
          </button>
        </div>

        {/* Filter & Export Row */}
        <div className="bg-white border border-gray-200 rounded-none p-4 mb-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Filter by Date:</span>
              <input
                type="date"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 bg-gray-50"
              />
              <span className="text-gray-300 text-xs">—</span>
              <input
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 bg-gray-50"
              />
              {(exportStartDate || exportEndDate) && (
                <button
                  onClick={() => { setExportStartDate(''); setExportEndDate(''); }}
                  className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 hover:bg-red-100 rounded-none border border-red-200 transition-colors flex items-center gap-1"
                >
                  <X size={12} /> Clear
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleExport('pdf')} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 hover:bg-red-100 rounded-none border border-red-200 transition-colors">
                <Download size={12} /> PDF
              </button>
              <button onClick={() => handleExport('csv')} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 hover:bg-green-100 rounded-none border border-green-200 transition-colors">
                <Download size={12} /> CSV
              </button>
              <button onClick={() => handleExport('excel')} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-none border border-blue-200 transition-colors">
                <Download size={12} /> Excel
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-none border border-gray-200 p-6 mb-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                {editingEvent ? 'Edit Event' : 'New Event'}
              </h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1.5 text-gray-400 hover:text-gray-600 bg-gray-50 border border-gray-200 rounded-none">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Event Title</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" required />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Event Date</label>
                  <input type="date" value={formData.eventDate} onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Event Time</label>
                  <input type="time" value={formData.eventTime} onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Event Type</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500">
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
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Location</label>
                <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" rows={3} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Registration Link</label>
                <input type="url" value={formData.registrationLink} onChange={(e) => setFormData({ ...formData, registrationLink: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.isUpcoming} onChange={(e) => setFormData({ ...formData, isUpcoming: e.target.checked })} className="rounded-none" />
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Mark as Upcoming</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="px-6 py-2.5 bg-purple-600 text-white rounded-none font-bold uppercase tracking-wider text-xs hover:bg-purple-700 transition-colors flex items-center gap-2">
                  <Save size={16} /> Save
                </button>
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-none font-bold uppercase tracking-wider text-xs hover:bg-gray-200 border border-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Events List */}
        {events.length === 0 ? (
          <div className="bg-white rounded-none border border-gray-200 p-16 text-center">
            <div className="bg-gray-100 rounded-none p-5 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">No Events Found</h3>
            <p className="text-xs text-gray-500 mb-6">Create your first event to get started</p>
            <button
              onClick={() => { resetForm(); setEditingEvent(null); setShowForm(true); }}
              className="inline-flex items-center gap-2 px-5 py-2 bg-purple-600 text-white rounded-none font-bold uppercase tracking-wider text-xs hover:bg-purple-700 transition-colors"
            >
              <Plus size={14} /> New Event
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event._id} className="bg-white rounded-none border border-gray-200 border-l-4 border-l-purple-500 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="text-purple-500 flex-shrink-0" size={16} />
                      <h3 className="text-sm font-bold text-gray-900">{event.title}</h3>
                      {event.isUpcoming && (
                        <span className="px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-200">Upcoming</span>
                      )}
                    </div>
                    <div className="grid md:grid-cols-4 gap-3 mb-2">
                      <p className="text-xs text-gray-600">
                        <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Date:</span>{' '}
                        <span className="font-semibold">{new Date(event.eventDate).toLocaleDateString('en-IN')}</span>
                      </p>
                      <p className="text-xs text-gray-600">
                        <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Time:</span>{' '}
                        <span className="font-semibold">{event.eventTime}</span>
                      </p>
                      <p className="text-xs text-gray-600">
                        <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Type:</span>{' '}
                        <span className="font-semibold">{event.type}</span>
                      </p>
                      <p className="text-xs text-gray-600">
                        <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Location:</span>{' '}
                        <span className="font-semibold">{event.location}</span>
                      </p>
                    </div>
                    {event.description && (
                      <p className="text-xs text-gray-500 mt-1">{event.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4 flex-shrink-0">
                    <button onClick={() => handleEdit(event)} className="p-2 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-none transition-colors" title="Edit">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDelete(event._id!)} className="p-2 text-[10px] font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-none transition-colors" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
