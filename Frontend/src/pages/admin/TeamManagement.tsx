import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { Plus, Edit, Trash2, ArrowLeft, Save, Calendar, Download, X, Users } from 'lucide-react';

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

interface TeamManagementProps {
  isEmbedded?: boolean;
  onBack?: () => void;
}

export default function TeamManagement({ isEmbedded = false, onBack }: TeamManagementProps = {}) {
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
              <h1 className="text-sm font-black text-gray-900 uppercase tracking-wider">Team Management</h1>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Content Management → Team</p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); setEditingMember(null); setShowForm(true); }}
            className="px-5 py-2.5 bg-green-600 text-white rounded-none font-bold uppercase tracking-wider text-xs hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> Add Member
          </button>
        </div>

        {/* Filter & Export Row */}
        <div className="bg-white border border-gray-200 rounded-none p-4 mb-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Filter by Date:</span>
              <input type="date" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-green-500 bg-gray-50" />
              <span className="text-gray-300 text-xs">—</span>
              <input type="date" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-green-500 bg-gray-50" />
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
                {editingMember ? 'Edit Team Member' : 'New Team Member'}
              </h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1.5 text-gray-400 hover:text-gray-600 bg-gray-50 border border-gray-200 rounded-none">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Role</label>
                  <input type="text" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" required />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Department</label>
                  <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-green-500">
                    <option value="Leadership">Leadership</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Sales">Sales</option>
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Order</label>
                  <input type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })} className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">LinkedIn</label>
                  <input type="url" value={formData.linkedin} onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Image URL</label>
                <input type="url" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Bio</label>
                <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" rows={3} />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="rounded-none" />
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Active</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="px-6 py-2.5 bg-green-600 text-white rounded-none font-bold uppercase tracking-wider text-xs hover:bg-green-700 transition-colors flex items-center gap-2">
                  <Save size={16} /> Save
                </button>
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-none font-bold uppercase tracking-wider text-xs hover:bg-gray-200 border border-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Team Grid */}
        {members.length === 0 ? (
          <div className="bg-white rounded-none border border-gray-200 p-16 text-center">
            <div className="bg-gray-100 rounded-none p-5 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">No Team Members Found</h3>
            <p className="text-xs text-gray-500 mb-6">Add your first team member to get started</p>
            <button
              onClick={() => { resetForm(); setEditingMember(null); setShowForm(true); }}
              className="inline-flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-none font-bold uppercase tracking-wider text-xs hover:bg-green-700 transition-colors"
            >
              <Plus size={14} /> Add Member
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {members.map((member) => (
              <div key={member._id} className="bg-white rounded-none border border-gray-200 overflow-hidden">
                <img src={member.image} alt={member.name} className="w-full h-44 object-cover" />
                <div className="p-4">
                  <h3 className="text-sm font-bold text-gray-900">{member.name}</h3>
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">{member.role}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5 mb-3">{member.department}</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(member)} className="flex-1 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-none transition-colors flex items-center justify-center gap-1">
                      <Edit size={12} /> Edit
                    </button>
                    <button onClick={() => handleDelete(member._id!)} className="flex-1 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-none transition-colors flex items-center justify-center gap-1">
                      <Trash2 size={12} /> Delete
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
