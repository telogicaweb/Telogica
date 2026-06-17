import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { Plus, Edit, Trash2, ArrowLeft, Save, X, Building2, Upload } from 'lucide-react';

interface Client {
  _id?: string;
  name: string;
  logo: string;
  displayOrder: number;
  isActive: boolean;
}

interface ClientManagementProps {
  isEmbedded?: boolean;
  onBack?: () => void;
}

export default function ClientManagement({ isEmbedded = false, onBack }: ClientManagementProps = {}) {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<Client>({
    name: '',
    logo: '',
    displayOrder: 0,
    isActive: true
  });

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user || JSON.parse(user).role !== 'admin') {
      navigate('/login');
      return;
    }
    loadClients();
  }, [navigate]);

  const loadClients = async () => {
    try {
      const response = await api.get('/api/clients/admin');
      setClients(response.data);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds the 10MB limit.');
        e.target.value = '';
        setLogoFile(null);
        return;
      }
      setLogoFile(file);
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) {
      alert('Please select a logo file first');
      return;
    }

    try {
      setUploadingLogo(true);
      const data = new FormData();
      data.append('logo', logoFile);

      const response = await api.post('/api/clients/upload', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.url) {
        setFormData((prev) => ({ ...prev, logo: response.data.url }));
        setLogoFile(null);
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo. Please try again.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.logo) {
      alert('Please upload a client logo first');
      return;
    }
    try {
      if (editingClient?._id) {
        await api.put(`/api/clients/${editingClient._id}`, formData);
      } else {
        await api.post('/api/clients', formData);
      }
      setShowForm(false);
      setEditingClient(null);
      resetForm();
      loadClients();
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Failed to save client information');
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData(client);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    try {
      await api.delete(`/api/clients/${id}`);
      loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Failed to delete client');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      logo: '',
      displayOrder: 0,
      isActive: true
    });
    setLogoFile(null);
  };

  return (
    <div className={isEmbedded ? "" : "min-h-screen bg-gray-50"}>
      <div className={isEmbedded ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
        {/* Header Navigation */}
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
              <h1 className="text-sm font-black text-gray-900 uppercase tracking-wider">Client Management</h1>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Content Management → Clients</p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); setEditingClient(null); setShowForm(true); }}
            className="px-5 py-2.5 bg-green-600 text-white rounded-none font-bold uppercase tracking-wider text-xs hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> Add Client
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-none border border-gray-200 p-6 mb-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                {editingClient ? 'Edit Client' : 'New Client'}
              </h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1.5 text-gray-400 hover:text-gray-600 bg-gray-50 border border-gray-200 rounded-none">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Client Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Display Order / Priority</label>
                  <input type="number" value={formData.displayOrder} onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })} className="w-full px-4 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" />
                </div>
              </div>

              {/* Logo Upload Section */}
              <div className="border border-gray-200 p-4 bg-gray-50 space-y-3">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Client Logo *</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoSelect}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-none file:border file:border-gray-250
                      file:text-sm file:font-semibold
                      file:bg-white file:text-gray-700
                      hover:file:bg-gray-50 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={handleUploadLogo}
                    disabled={!logoFile || uploadingLogo}
                    className="px-4 py-2 bg-blue-600 text-white rounded-none font-bold uppercase tracking-wider text-xs hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
                  >
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    <Upload size={14} />
                  </button>
                </div>
                {logoFile && (
                  <p className="text-xs text-gray-500">
                    Selected: {logoFile.name} ({(logoFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                {formData.logo && (
                  <div className="mt-2 flex items-center gap-4">
                    <img src={formData.logo} alt="Client Logo Preview" className="h-16 w-auto object-contain border border-gray-200 bg-white p-2" />
                    <span className="text-xs text-green-600 font-semibold">Logo uploaded successfully</span>
                  </div>
                )}
                <p className="text-[10px] text-gray-400">Accepted formats: JPG, PNG, WEBP, SVG. Max size: 10MB</p>
              </div>

              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="rounded-none" />
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Active</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="px-6 py-2.5 bg-green-600 text-white rounded-none font-bold uppercase tracking-wider text-xs hover:bg-green-700 transition-colors flex items-center gap-2">
                  <Save size={16} /> Save Client
                </button>
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-none font-bold uppercase tracking-wider text-xs hover:bg-gray-200 border border-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Clients Grid */}
        {clients.length === 0 ? (
          <div className="bg-white rounded-none border border-gray-200 p-16 text-center">
            <div className="bg-gray-100 rounded-none p-5 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">No Clients Found</h3>
            <p className="text-xs text-gray-500 mb-6">Add your first client to showcase them on the website</p>
            <button
              onClick={() => { resetForm(); setEditingClient(null); setShowForm(true); }}
              className="inline-flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-none font-bold uppercase tracking-wider text-xs hover:bg-green-700 transition-colors"
            >
              <Plus size={14} /> Add Client
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {clients.map((client) => (
              <div key={client._id} className="bg-white rounded-none border border-gray-200 overflow-hidden flex flex-col justify-between">
                <div className="p-4 bg-gray-50 flex items-center justify-center border-b border-gray-100 h-28">
                  <img src={client.logo} alt={client.name} className="max-h-20 max-w-full object-contain" />
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 line-clamp-1">{client.name}</h3>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                      Order: {client.displayOrder} • {client.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(client)} className="flex-grow px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-none transition-colors flex items-center justify-center gap-1">
                      <Edit size={12} /> Edit
                    </button>
                    <button onClick={() => handleDelete(client._id!)} className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-none transition-colors flex items-center justify-center">
                      <Trash2 size={12} />
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
