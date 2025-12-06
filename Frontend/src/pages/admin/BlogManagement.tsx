import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { Plus, Edit, Trash2, ArrowLeft, Save, Download, Calendar } from 'lucide-react';

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

export default function BlogManagement() {
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin')}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Blog Management</h1>
          </div>
          <button
            onClick={() => {
              resetForm();
              setEditingPost(null);
              setShowForm(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            New Post
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
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

        {showForm ? (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">{editingPost ? 'Edit Post' : 'New Post'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Excerpt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  required
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
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Telecom">Telecom</option>
                    <option value="Defence">Defence</option>
                    <option value="Railway">Railway</option>
                    <option value="Technology">Technology</option>
                    <option value="Innovation">Innovation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Read Time</label>
                  <input
                    type="text"
                    value={formData.readTime}
                    onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="5 min read"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Published</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Featured</span>
                </label>
              </div>
              <div className="flex gap-4">
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
                  <Save size={20} /> Save
                </button>
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : null}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div key={post._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <img src={post.image} alt={post.title} className="w-full h-48 object-cover" />
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{post.category}</span>
                  {post.isFeatured && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Featured</span>}
                  {!post.isPublished && <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Draft</span>}
                </div>
                <h3 className="font-bold text-lg mb-2">{post.title}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(post)} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2">
                    <Edit size={16} /> Edit
                  </button>
                  <button onClick={() => handleDelete(post._id!)} className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 flex items-center justify-center gap-2">
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
