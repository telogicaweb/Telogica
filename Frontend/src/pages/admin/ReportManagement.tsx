import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { Plus, Edit, Trash2, ArrowLeft, Save, FileText, Calendar, Download, X } from 'lucide-react';

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

interface ReportManagementProps {
  isEmbedded?: boolean;
  onBack?: () => void;
}

export default function ReportManagement({ isEmbedded = false, onBack }: ReportManagementProps = {}) {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
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

  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    const queryParams = new URLSearchParams({
      format,
      ...(exportStartDate && { startDate: exportStartDate }),
      ...(exportEndDate && { endDate: exportEndDate }),
    });
    window.open(`${api.defaults.baseURL}/api/export/reports?${queryParams.toString()}`, '_blank');
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
              <h1 className="text-sm font-black text-gray-900 uppercase tracking-wider">Report Management</h1>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Content Management → Reports</p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); setEditingReport(null); setShowForm(true); }}
            className="px-5 py-2.5 bg-orange-600 text-white rounded-none font-bold uppercase tracking-wider text-xs hover:bg-orange-700 transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> New Report
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
                className="px-3 py-1.5 border border-gray-200 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 bg-gray-50"
              />
              <span className="text-gray-300 text-xs">—</span>
              <input
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 bg-gray-50"
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
              <button
                onClick={() => handleExport('pdf')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 hover:bg-red-100 rounded-none border border-red-200 transition-colors"
              >
                <Download size={12} /> PDF
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 hover:bg-green-100 rounded-none border border-green-200 transition-colors"
              >
                <Download size={12} /> CSV
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-none border border-blue-200 transition-colors"
              >
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
                {editingReport ? 'Edit Report' : 'New Report'}
              </h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1.5 text-gray-400 hover:text-gray-600 bg-gray-50 border border-gray-200 rounded-none">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Report Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  required
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Report Type</label>
                  <select
                    value={formData.reportType}
                    onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
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
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Report Date</label>
                  <input
                    type="date"
                    value={formData.reportDate}
                    onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Quarter (Optional)</label>
                  <select
                    value={formData.quarter}
                    onChange={(e) => setFormData({ ...formData, quarter: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
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
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">File URL</label>
                  <input
                    type="url"
                    value={formData.fileUrl}
                    onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">File Size</label>
                  <input
                    type="text"
                    value={formData.fileSize}
                    onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                    placeholder="e.g., 2.5 MB"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  rows={3}
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="rounded-none"
                />
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Published</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="px-6 py-2.5 bg-orange-600 text-white rounded-none font-bold uppercase tracking-wider text-xs hover:bg-orange-700 transition-colors flex items-center gap-2">
                  <Save size={16} /> Save
                </button>
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-none font-bold uppercase tracking-wider text-xs hover:bg-gray-200 border border-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reports Grid */}
        {reports.length === 0 ? (
          <div className="bg-white rounded-none border border-gray-200 p-16 text-center">
            <div className="bg-gray-100 rounded-none p-5 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">No Reports Found</h3>
            <p className="text-xs text-gray-500 mb-6">Create your first report to get started</p>
            <button
              onClick={() => { resetForm(); setEditingReport(null); setShowForm(true); }}
              className="inline-flex items-center gap-2 px-5 py-2 bg-orange-600 text-white rounded-none font-bold uppercase tracking-wider text-xs hover:bg-orange-700 transition-colors"
            >
              <Plus size={14} /> New Report
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => (
              <div key={report._id} className="bg-white rounded-none border border-gray-200 border-t-4 border-t-orange-500 p-5">
                <div className="flex items-start gap-3 mb-4">
                  <FileText className="text-orange-500 flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-gray-900 truncate">{report.title}</h3>
                      {!report.isPublished && (
                        <span className="px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider border bg-gray-50 text-gray-600 border-gray-200 flex-shrink-0">Draft</span>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">{report.reportType}</p>
                    {report.quarter && (
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{report.quarter}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5 mb-4">
                  <p className="text-xs text-gray-600">
                    <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Date:</span>{' '}
                    <span className="font-semibold">{new Date(report.reportDate).toLocaleDateString('en-IN')}</span>
                  </p>
                  <p className="text-xs text-gray-600">
                    <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Size:</span>{' '}
                    <span className="font-semibold">{report.fileSize}</span>
                  </p>
                  {report.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mt-2">{report.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(report)} className="flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-none transition-colors flex items-center justify-center gap-1.5">
                    <Edit size={13} /> Edit
                  </button>
                  <button onClick={() => handleDelete(report._id!)} className="flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-none transition-colors flex items-center justify-center gap-1.5">
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
