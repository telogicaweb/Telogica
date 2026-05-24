import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { ArrowLeft, Save, RefreshCw, Calendar, Download, X, FileText } from 'lucide-react';

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

interface PageContentProps {
  isEmbedded?: boolean;
  onBack?: () => void;
}

export default function PageContent({ isEmbedded = false, onBack }: PageContentProps = {}) {
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
    <div className={isEmbedded ? "" : "min-h-screen bg-gray-50"}>
      <div className={isEmbedded ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
        {/* Header with Back Navigation */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => onBack ? onBack() : navigate('/admin')}
            className="p-2 bg-white border border-gray-200 rounded-none hover:bg-gray-50 transition-colors"
            title="Back to Admin Dashboard"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-sm font-black text-gray-900 uppercase tracking-wider">Page Content Editor</h1>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Content Management → Pages</p>
          </div>
        </div>

        {/* Filter & Export Row */}
        <div className="bg-white border border-gray-200 rounded-none p-4 mb-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Filter by Date:</span>
              <input type="date" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-50" />
              <span className="text-gray-300 text-xs">—</span>
              <input type="date" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-50" />
              {(exportStartDate || exportEndDate) && (
                <button onClick={() => { setExportStartDate(''); setExportEndDate(''); }} className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 hover:bg-red-100 rounded-none border border-red-200 transition-colors flex items-center gap-1">
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

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Section Selector */}
          <div className="bg-white rounded-none border border-gray-200 p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-4">Select Section</h2>
            <div className="space-y-1.5">
              {sections.map((section) => {
                const hasContent = contents.some(c => c.section === section.value);
                return (
                  <button
                    key={section.value}
                    onClick={() => handleSectionSelect(section.value)}
                    className={`w-full text-left px-4 py-3 rounded-none transition-colors text-xs font-semibold uppercase tracking-wider border ${
                      selectedSection === section.value
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{section.label}</span>
                      {hasContent && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-none font-bold ${
                          selectedSection === section.value
                            ? 'bg-white/20 text-white'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
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
          <div className="lg:col-span-2 bg-white rounded-none border border-gray-200 p-5">
            {selectedSection ? (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                    {sections.find(s => s.value === selectedSection)?.label}
                  </h2>
                  <button
                    onClick={loadContents}
                    className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 border border-gray-200 rounded-none transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Subtitle (Optional)</label>
                    <input
                      type="text"
                      value={formData.subtitle || ''}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Content</label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      rows={6}
                      required
                    />
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Additional Metadata</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Button Text</label>
                        <input
                          type="text"
                          value={formData.metadata?.buttonText || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            metadata: { ...formData.metadata, buttonText: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Button Link</label>
                        <input
                          type="text"
                          value={formData.metadata?.buttonLink || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            metadata: { ...formData.metadata, buttonLink: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Image URL</label>
                        <input
                          type="url"
                          value={formData.metadata?.imageUrl || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            metadata: { ...formData.metadata, imageUrl: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Video URL</label>
                        <input
                          type="url"
                          value={formData.metadata?.videoUrl || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            metadata: { ...formData.metadata, videoUrl: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-indigo-600 text-white rounded-none font-bold uppercase tracking-wider text-xs hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Save size={16} />
                    {loading ? 'Saving...' : 'Save Content'}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="bg-gray-100 rounded-none p-5 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Select a Section</h3>
                <p className="text-xs text-gray-500">Choose a section from the left panel to edit its content</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
