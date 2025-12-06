import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import api from '../../api';
import UnitBatchEntry from './UnitBatchEntry';

interface ProductUnit {
  _id: string;
  serialNumber: string;
  modelNumber: string;
  status: string;
  warrantyPeriodMonths: number;
  soldTo?: string;
  currentOwner?: { name: string; email: string };
}

interface ProductUnitManagerProps {
  productId: string;
  productName: string;
  onClose: () => void;
}

const ProductUnitManager: React.FC<ProductUnitManagerProps> = ({ productId, productName, onClose }) => {
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ProductUnit>>({});

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/product-units/product/${productId}`);
      setUnits(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load units');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, [productId]);

  const handleAddUnits = async (newUnits: any[]) => {
    try {
      await api.post('/api/product-units/add', {
        productId,
        units: newUnits.map(u => ({
          ...u,
          warrantyPeriodMonths: u.warrantyPeriod,
          stockType: 'both'
        }))
      });
      alert('Units added successfully');
      setShowAddForm(false);
      fetchUnits();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add units');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this unit? This action cannot be undone.')) return;
    try {
      await api.delete(`/api/product-units/${id}`);
      setUnits(units.filter(u => u._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete unit');
    }
  };

  const startEdit = (unit: ProductUnit) => {
    setEditingId(unit._id);
    setEditForm({
      serialNumber: unit.serialNumber,
      modelNumber: unit.modelNumber,
      status: unit.status,
      warrantyPeriodMonths: unit.warrantyPeriodMonths
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await api.put(`/api/product-units/${editingId}`, editForm);
      setUnits(units.map(u => u._id === editingId ? { ...u, ...editForm } : u));
      setEditingId(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update unit');
    }
  };

  const filteredUnits = useMemo(() => {
    return units.filter(unit => {
      const matchesSearch = 
        unit.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.modelNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || unit.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [units, searchTerm, statusFilter]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Manage Units</h2>
            <p className="text-sm text-gray-500">Product: {productName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex gap-4 flex-1 w-full">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by Serial or Model Number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="relative w-48">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="sold">Sold</option>
                  <option value="reserved">Reserved</option>
                  <option value="defective">Defective</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                showAddForm 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {showAddForm ? <X size={18} /> : <Plus size={18} />}
              {showAddForm ? 'Cancel Adding' : 'Add Units'}
            </button>
          </div>

          {showAddForm && (
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-4">
              <h3 className="font-semibold text-blue-900 mb-4">Add New Batch</h3>
              <UnitBatchEntry
                defaultWarrantyMonths={12}
                onSave={handleAddUnits}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-32 text-red-600">
              <AlertCircle size={32} className="mb-2" />
              <p>{error}</p>
              <button onClick={fetchUnits} className="mt-2 text-blue-600 hover:underline flex items-center gap-1">
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          ) : filteredUnits.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium">No units found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warranty (Mo)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUnits.map((unit) => (
                    <tr key={unit._id} className="hover:bg-gray-50 transition-colors">
                      {editingId === unit._id ? (
                        <>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editForm.serialNumber}
                              onChange={(e) => setEditForm({ ...editForm, serialNumber: e.target.value })}
                              className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editForm.modelNumber}
                              onChange={(e) => setEditForm({ ...editForm, modelNumber: e.target.value })}
                              className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={editForm.status}
                              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                              className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="available">Available</option>
                              <option value="sold">Sold</option>
                              <option value="reserved">Reserved</option>
                              <option value="defective">Defective</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              value={editForm.warrantyPeriodMonths}
                              onChange={(e) => setEditForm({ ...editForm, warrantyPeriodMonths: parseInt(e.target.value) })}
                              className="w-20 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {unit.currentOwner?.name || '-'}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button onClick={saveEdit} className="text-green-600 hover:text-green-800 p-1">
                              <Check size={18} />
                            </button>
                            <button onClick={cancelEdit} className="text-red-600 hover:text-red-800 p-1">
                              <X size={18} />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{unit.serialNumber}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{unit.modelNumber}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${unit.status === 'available' ? 'bg-green-100 text-green-800' : 
                                unit.status === 'sold' ? 'bg-blue-100 text-blue-800' : 
                                unit.status === 'defective' ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'}`}>
                              {unit.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{unit.warrantyPeriodMonths}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {unit.currentOwner ? (
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900">{unit.currentOwner.name}</span>
                                <span className="text-xs">{unit.currentOwner.email}</span>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium space-x-3">
                            <button 
                              onClick={() => startEdit(unit)}
                              className="text-indigo-600 hover:text-indigo-900 transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(unit._id)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-between items-center text-sm text-gray-500">
          <span>Total Units: {filteredUnits.length}</span>
          <span>Showing {filteredUnits.length} of {units.length}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductUnitManager;
