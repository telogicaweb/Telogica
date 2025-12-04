import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { Plus, Edit, Trash2, ArrowLeft, Save, FileText } from 'lucide-react';

interface Report {
  _id?: string;
  title: string;
  reportType: string;
  reportDate: string;
  quarter?: string;
  fileUrl: string;
  fileSize: string;
  description: string;
  isPublished: boolean;
}

export default function ReportManagement() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [formData, setFormData] = useState<Report>({
    title: '',
    reportType: 'Annual Report',
    reportDate: '',
    quarter: '',
    fileUrl: '',
    fileSize: '',
    description: '',
    isPublished: true
  });

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user || JSON.parse(user).role !== 'admin') {
      navigate('/login');
      return;
    }
    loadReports();
  }, [navigate]);

  const loadReports = async () => {
    try {
      const response = await api.get('/api/reports');
      setReports(response.data);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingReport?._id) {
        await api.put(`/api/reports/${editingReport._id}`, formData);
      } else {
        await api.post('/api/reports', formData);
      }
      setShowForm(false);
      setEditingReport(null);
      resetForm();
      loadReports();
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Failed to save report');
    }
  };

  const handleEdit = (report: Report) => {
    setEditingReport(report);
    setFormData({
      ...report,
      reportDate: report.reportDate.split('T')[0]
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    try {
      await api.delete(`/api/reports/${id}`);
      loadReports();
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      reportType: 'Annual Report',
      reportDate: '',
      quarter: '',
      fileUrl: '',
      fileSize: '',
      description: '',
      isPublished: true
    });
  };

  const getReportIcon = () => {
    return <FileText className="text-orange-600" size={24} />;
  };

  return (
    <div className="min-h-screen bg-gray-100 pt-20 md:pt-24 pb-8 md:pb-16">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={() => navigate('/admin')} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft size={20} className="md:w-6 md:h-6" />
            </button>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Report Management</h1>
          </div>
          <button
            onClick={() => { resetForm(); setEditingReport(null); setShowForm(true); }}
            className="bg-orange-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2 text-sm md:text-base w-full sm:w-auto justify-center"
          >
            <Plus size={18} className="md:w-5 md:h-5" /> New Report
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">{editingReport ? 'Edit Report' : 'New Report'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Title</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                  <select
                    value={formData.reportType}
                    onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="Annual Report">Annual Report</option>
                    <option value="Quarterly Report">Quarterly Report</option>
                    <option value="Financial Statement">Financial Statement</option>
                    <option value="Investor Presentation">Investor Presentation</option>
                    <option value="Sustainability Report">Sustainability Report</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Date</label>
                  <input
                    type="date"
                    value={formData.reportDate}
                    onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quarter (Optional)</label>
                  <select
                    value={formData.quarter}
                    onChange={(e) => setFormData({ ...formData, quarter: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">N/A</option>
                    <option value="Q1">Q1</option>
                    <option value="Q2">Q2</option>
                    <option value="Q3">Q3</option>
                    <option value="Q4">Q4</option>
                  </select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">File URL</label>
                  <input
                    type="url"
                    value={formData.fileUrl}
                    onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">File Size</label>
                  <input
                    type="text"
                    value={formData.fileSize}
                    onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="e.g., 2.5 MB"
                    required
                  />
                </div>
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
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Published</span>
              </label>
              <div className="flex gap-4">
                <button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2">
                  <Save size={20} /> Save
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div key={report._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start gap-4 mb-4">
                {getReportIcon()}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">{report.title}</h3>
                    {!report.isPublished && (
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Draft</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{report.reportType}</p>
                  {report.quarter && (
                    <p className="text-xs text-gray-500">{report.quarter}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Date:</span> {new Date(report.reportDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Size:</span> {report.fileSize}
                </p>
                {report.description && (
                  <p className="text-sm text-gray-700 line-clamp-2">{report.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(report)} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2">
                  <Edit size={16} /> Edit
                </button>
                <button onClick={() => handleDelete(report._id!)} className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 flex items-center justify-center gap-2">
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
