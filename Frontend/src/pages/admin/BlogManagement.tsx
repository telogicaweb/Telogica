import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { Plus, Edit, Trash2, ArrowLeft, Save, Download, Calendar, X, Newspaper } from 'lucide-react';

interface BlogPost {
  _id?: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  image: string;
  readTime: string;
  tags: string[];
  isPublished: boolean;
  isFeatured: boolean;
}

interface BlogManagementProps {
  isEmbedded?: boolean;
  onBack?: () => void;
}

export default function BlogManagement({ isEmbedded = false, onBack }: BlogManagementProps = {}) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState<BlogPost>({
    title: '',
    excerpt: '',
    content: '',
    author: '',
    category: 'Telecom',
    image: '',
    readTime: '5 min read',
    tags: [],
    isPublished: true,
    isFeatured: false
  });

  // Export filters
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user || JSON.parse(user).role !== 'admin') {
      navigate('/login');
      return;
    }
    loadPosts();
  }, [navigate]);

  const loadPosts = async () => {
    try {
      const response = await api.get('/api/blog');
      setPosts(response.data);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const handleExport = async (format: 'pdf' | 'csv' | 'excel') => {
    try {
      let url = `/api/export/blogs?format=${format}`;
      if (exportStartDate) url += `&startDate=${exportStartDate}`;
      if (exportEndDate) url += `&endDate=${exportEndDate}`;

      const response = await api.get(url, {
        responseType: 'blob'
      });

      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `blogs_export_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      console.error('Export failed:', error);
      alert('Failed to export data: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPost?._id) {
        await api.put(`/api/blog/${editingPost._id}`, formData);
      } else {
        await api.post('/api/blog', formData);
      }
      setShowForm(false);
      setEditingPost(null);
      resetForm();
      loadPosts();
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Failed to save blog post');
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData(post);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    try {
      await api.delete(`/api/blog/${id}`);
      loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      author: '',
      category: 'Telecom',
      image: '',
      readTime: '5 min read',
      tags: [],
      isPublished: true,
      isFeatured: false
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
              <h1 className="text-sm font-black text-gray-900 uppercase tracking-wider">Blog Management</h1>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Content Management → Blogs</p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); setEditingPost(null); setShowForm(true); }}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-none font-bold uppercase tracking-wider text-xs hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> New Post
          </button>
        </div>

        {/* Filter & Export Row */}
        <div className="bg-white border border-gray-200 rounded-none p-4 mb-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Filter by Date:</span>
              <input type="date" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50" />
              <span className="text-gray-300 text-xs">—</span>
              <input type="date" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50" />
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

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-none border border-gray-200 p-6 mb-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                {editingPost ? 'Edit Post' : 'New Post'}
              </h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1.5 text-gray-400 hover:text-gray-600 bg-gray-50 border border-gray-200 rounded-none">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Title</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Author</label>
                  <input type="text" value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" required />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Excerpt</label>
                <textarea value={formData.excerpt} onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" rows={2} required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Content</label>
                <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" rows={6} required />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="Telecom">Telecom</option>
                    <option value="Defence">Defence</option>
                    <option value="Railway">Railway</option>
                    <option value="Technology">Technology</option>
                    <option value="Innovation">Innovation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Read Time</label>
                  <input type="text" value={formData.readTime} onChange={(e) => setFormData({ ...formData, readTime: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="5 min read" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Image URL</label>
                  <input type="url" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" required />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.isPublished} onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })} className="rounded-none" />
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Published</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })} className="rounded-none" />
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Featured</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-none font-bold uppercase tracking-wider text-xs hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <Save size={16} /> Save
                </button>
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-none font-bold uppercase tracking-wider text-xs hover:bg-gray-200 border border-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Blog Posts Grid */}
        {posts.length === 0 ? (
          <div className="bg-white rounded-none border border-gray-200 p-16 text-center">
            <div className="bg-gray-100 rounded-none p-5 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Newspaper className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">No Blog Posts Found</h3>
            <p className="text-xs text-gray-500 mb-6">Create your first blog post to get started</p>
            <button
              onClick={() => { resetForm(); setEditingPost(null); setShowForm(true); }}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-none font-bold uppercase tracking-wider text-xs hover:bg-blue-700 transition-colors"
            >
              <Plus size={14} /> New Post
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => (
              <div key={post._id} className="bg-white rounded-none border border-gray-200 overflow-hidden">
                <img src={post.image} alt={post.title} className="w-full h-44 object-cover" />
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider border bg-blue-50 text-blue-700 border-blue-200">{post.category}</span>
                    {post.isFeatured && <span className="px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider border bg-purple-50 text-purple-700 border-purple-200">Featured</span>}
                    {!post.isPublished && <span className="px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider border bg-gray-50 text-gray-600 border-gray-200">Draft</span>}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1.5">{post.title}</h3>
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">{post.excerpt}</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(post)} className="flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-none transition-colors flex items-center justify-center gap-1.5">
                      <Edit size={13} /> Edit
                    </button>
                    <button onClick={() => handleDelete(post._id!)} className="flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-none transition-colors flex items-center justify-center gap-1.5">
                      <Trash2 size={13} /> Delete
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
