import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { Plus, Edit, Trash2, ArrowLeft, Save, Calendar, Download } from 'lucide-react';

interface TeamMember {
  _id?: string;
  name: string;
  role: string;
  department: string;
  image: string;
  bio: string;
  email: string;
  linkedin: string;
  order: number;
  isActive: boolean;
}

export default function TeamManagement() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [formData, setFormData] = useState<TeamMember>({
    name: '',
    role: '',
    department: 'Leadership',
    image: '',
    bio: '',
    email: '',
    linkedin: '',
    order: 0,
    isActive: true
  });

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user || JSON.parse(user).role !== 'admin') {
      navigate('/login');
      return;
    }
    loadMembers();
  }, [navigate]);

  const loadMembers = async () => {
    try {
      const response = await api.get('/api/team');
      setMembers(response.data);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    const queryParams = new URLSearchParams({
      format,
      ...(exportStartDate && { startDate: exportStartDate }),
      ...(exportEndDate && { endDate: exportEndDate }),
    });
    window.open(`${api.defaults.baseURL}/api/export/team?${queryParams.toString()}`, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMember?._id) {
        await api.put(`/api/team/${editingMember._id}`, formData);
      } else {
        await api.post('/api/team', formData);
      }
      setShowForm(false);
      setEditingMember(null);
      resetForm();
      loadMembers();
    } catch (error) {
      console.error('Error saving team member:', error);
      alert('Failed to save team member');
    }
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData(member);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team member?')) return;
    try {
      await api.delete(`/api/team/${id}`);
      loadMembers();
    } catch (error) {
      console.error('Error deleting team member:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      department: 'Leadership',
      image: '',
      bio: '',
      email: '',
      linkedin: '',
      order: 0,
      isActive: true
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
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Team Management</h1>
          </div>
          <button
            onClick={() => { resetForm(); setEditingMember(null); setShowForm(true); }}
            className="bg-green-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm md:text-base w-full sm:w-auto justify-center"
          >
            <Plus size={18} className="md:w-5 md:h-5" /> Add Member
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
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
            <h2 className="text-xl font-bold mb-4">{editingMember ? 'Edit Team Member' : 'New Team Member'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="Leadership">Leadership</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Sales">Sales</option>
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                  <input
                    type="url"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <div className="flex gap-4">
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
                  <Save size={20} /> Save
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
          {members.map((member) => (
            <div key={member._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <img src={member.image} alt={member.name} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="font-bold text-lg">{member.name}</h3>
                <p className="text-sm text-gray-600">{member.role}</p>
                <p className="text-xs text-gray-500 mb-4">{member.department}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(member)} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-1">
                    <Edit size={14} /> Edit
                  </button>
                  <button onClick={() => handleDelete(member._id!)} className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 flex items-center justify-center gap-1">
                    <Trash2 size={14} /> Delete
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
