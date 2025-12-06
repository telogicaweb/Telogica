import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { ArrowLeft, Save, RefreshCw, Calendar, Download } from 'lucide-react';

interface Content {
  _id?: string;
  section: string;
  title: string;
  subtitle?: string;
  content: string;
  metadata?: {
    buttonText?: string;
    buttonLink?: string;
    imageUrl?: string;
    videoUrl?: string;
  };
}

const sections = [
  { value: 'hero_home', label: 'Home - Hero Section' },
  { value: 'about_story', label: 'About - Our Story' },
  { value: 'about_mission', label: 'About - Mission' },
  { value: 'about_vision', label: 'About - Vision' },
  { value: 'about_values', label: 'About - Values' },
  { value: 'investors_hero', label: 'Investors - Hero' },
  { value: 'investors_overview', label: 'Investors - Overview' },
  { value: 'contact_info', label: 'Contact - Information' },
  { value: 'footer_about', label: 'Footer - About Us' }
];

export default function PageContent() {
  const navigate = useNavigate();
  const [contents, setContents] = useState<Content[]>([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [formData, setFormData] = useState<Content>({
    section: '',
    title: '',
    subtitle: '',
    content: '',
    metadata: {}
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user || JSON.parse(user).role !== 'admin') {
      navigate('/login');
      return;
    }
    loadContents();
  }, [navigate]);

  const loadContents = async () => {
    try {
      const response = await api.get('/api/content');
      setContents(response.data);
    } catch (error) {
      console.error('Error loading content:', error);
    }
  };

  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    const queryParams = new URLSearchParams({
      format,
      ...(exportStartDate && { startDate: exportStartDate }),
      ...(exportEndDate && { endDate: exportEndDate }),
    });
    window.open(`${api.defaults.baseURL}/api/export/content?${queryParams.toString()}`, '_blank');
  };

  const handleSectionSelect = (section: string) => {
    setSelectedSection(section);
    const existing = contents.find(c => c.section === section);
    if (existing) {
      setFormData(existing);
    } else {
      setFormData({
        section,
        title: '',
        subtitle: '',
        content: '',
        metadata: {}
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const existing = contents.find(c => c.section === formData.section);
      if (existing?._id) {
        await api.put(`/api/content/${existing._id}`, formData);
      } else {
        await api.post('/api/content', formData);
      }
      alert('Content saved successfully!');
      loadContents();
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Failed to save content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pt-20 md:pt-24 pb-8 md:pb-16">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <button onClick={() => navigate('/admin')} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} className="md:w-6 md:h-6" />
          </button>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Page Content Editor</h1>
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
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Section Selector */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Select Section</h2>
            <div className="space-y-2">
              {sections.map((section) => {
                const hasContent = contents.some(c => c.section === section.value);
                return (
                  <button
                    key={section.value}
                    onClick={() => handleSectionSelect(section.value)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      selectedSection === section.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{section.label}</span>
                      {hasContent && (
                        <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                          ✓
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Editor */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            {selectedSection ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">
                    {sections.find(s => s.value === selectedSection)?.label}
                  </h2>
                  <button
                    onClick={loadContents}
                    className="text-gray-600 hover:text-gray-900"
                    title="Refresh"
                  >
                    <RefreshCw size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle (Optional)</label>
                    <input
                      type="text"
                      value={formData.subtitle || ''}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={6}
                      required
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-medium text-gray-900 mb-3">Additional Metadata</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
                        <input
                          type="text"
                          value={formData.metadata?.buttonText || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            metadata: { ...formData.metadata, buttonText: e.target.value }
                          })}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Button Link</label>
                        <input
                          type="text"
                          value={formData.metadata?.buttonLink || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            metadata: { ...formData.metadata, buttonLink: e.target.value }
                          })}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                        <input
                          type="url"
                          value={formData.metadata?.imageUrl || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            metadata: { ...formData.metadata, imageUrl: e.target.value }
                          })}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Video URL</label>
                        <input
                          type="url"
                          value={formData.metadata?.videoUrl || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            metadata: { ...formData.metadata, videoUrl: e.target.value }
                          })}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:bg-gray-400"
                  >
                    <Save size={20} />
                    {loading ? 'Saving...' : 'Save Content'}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <p>Select a section from the left to edit its content</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
