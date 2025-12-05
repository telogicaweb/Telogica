import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Save,
  Edit3,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Layers,
  Package,
  Shield,
  Tag,
  Calendar,
  ClipboardCheck
} from 'lucide-react';
import api from '../../api';
import { Product, ProductUnit } from './types';

interface ProductEditorProps {
  product: Product;
  products: Product[];
  onClose: () => void;
  onUpdated: () => void;
}

interface ProductDetailsForm {
  name: string;
  category: string;
  description: string;
  price: string;
  retailerPrice: string;
  requiresQuote: boolean;
  isRecommended: boolean;
  warrantyPeriodMonths: number;
  specifications: Record<string, string>;
  images: string[];
}

interface UnitDraft {
  serialNumber: string;
  modelNumber: string;
  manufacturingDate?: string;
  stockType: 'online' | 'offline' | 'both';
}

const ProductEditor: React.FC<ProductEditorProps> = ({ product, products, onClose, onUpdated }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'units' | 'recommendations'>('details');
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [unitsError, setUnitsError] = useState<string | null>(null);
  const [unitEditingId, setUnitEditingId] = useState<string | null>(null);
  const [unitEditForm, setUnitEditForm] = useState({
    serialNumber: '',
    modelNumber: '',
    stockType: 'both' as 'online' | 'offline' | 'both',
    status: 'available' as ProductUnit['status'],
    manufacturingDate: ''
  });
  const [unitSaving, setUnitSaving] = useState(false);
  const [unitDrafts, setUnitDrafts] = useState<UnitDraft[]>([]);
  const [unitDraftSaving, setUnitDraftSaving] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>(product.recommendedProductIds || []);
  const [recommendationSaving, setRecommendationSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [form, setForm] = useState<ProductDetailsForm>(() => ({
    name: product.name,
    category: product.category,
    description: product.description || '',
    price: product.price?.toString() || product.normalPrice?.toString() || '',
    retailerPrice: product.retailerPrice?.toString() || '',
    requiresQuote: product.requiresQuote,
    isRecommended: Boolean(product.isRecommended),
    warrantyPeriodMonths: product.warrantyPeriodMonths || 12,
    specifications: product.specifications || {},
    images: product.images ? [...product.images] : []
  }));

  useEffect(() => {
    setForm({
      name: product.name,
      category: product.category,
      description: product.description || '',
      price: product.price?.toString() || product.normalPrice?.toString() || '',
      retailerPrice: product.retailerPrice?.toString() || '',
      requiresQuote: product.requiresQuote,
      isRecommended: Boolean(product.isRecommended),
      warrantyPeriodMonths: product.warrantyPeriodMonths || 12,
      specifications: product.specifications || {},
      images: product.images ? [...product.images] : []
    });
    setRecommendations(product.recommendedProductIds || []);
  }, [product]);

  useEffect(() => {
    if (activeTab === 'units') {
      fetchUnits();
    }
  }, [activeTab, product._id]);

  const fetchUnits = async () => {
    setUnitsLoading(true);
    setUnitsError(null);
    try {
      const response = await api.get(`/api/product-units/product/${product._id}`);
      setUnits(response.data);
    } catch (error: any) {
      console.error('Error loading product units', error);
      setUnitsError(error.response?.data?.message || 'Failed to load product units');
    } finally {
      setUnitsLoading(false);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setDetailsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        category: form.category,
        description: form.description,
        images: form.images,
        requiresQuote: form.requiresQuote,
        isRecommended: form.isRecommended,
        warrantyPeriodMonths: form.warrantyPeriodMonths,
      };

      if (form.price !== '') {
        payload.price = Number(form.price);
      } else {
        payload.price = null;
      }
      if (form.retailerPrice !== '') {
        payload.retailerPrice = Number(form.retailerPrice);
      } else {
        payload.retailerPrice = null;
      }

      await api.put(`/api/products/${product._id}`, payload);
      onUpdated();
      alert('Product details updated successfully');
    } catch (error: any) {
      console.error('Error updating product', error);
      alert(error.response?.data?.message || 'Failed to update product');
    } finally {
      setDetailsSaving(false);
    }
  };

  const handleRemoveImage = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx)
    }));
  };

  const handleImageUpload: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const files = event.target.files;
    if (!files?.length) return;

    setUploadingImages(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const reader = await new Promise<string>((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = () => resolve(fr.result as string);
          fr.onerror = reject;
          fr.readAsDataURL(file);
        });

        if (reader.startsWith('data:image')) {
          const formData = new FormData();
          const blob = await fetch(reader).then((res) => res.blob());
          formData.append('image', blob, file.name);
          const uploadResponse = await api.post('/api/products/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          uploaded.push(uploadResponse.data.url);
        } else {
          uploaded.push(reader);
        }
      }

      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...uploaded]
      }));
    } catch (error: any) {
      console.error('Error uploading images', error);
      alert(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImages(false);
    }
  };

  const startEditUnit = (unit: ProductUnit) => {
    setUnitEditingId(unit._id);
    setUnitEditForm({
      serialNumber: unit.serialNumber,
      modelNumber: unit.modelNumber,
      stockType: unit.stockType,
      status: unit.status,
      manufacturingDate: unit.manufacturingDate ? unit.manufacturingDate.slice(0, 10) : ''
    });
  };

  const handleUpdateUnit = async () => {
    if (!unitEditingId) return;
    setUnitSaving(true);
    try {
      await api.put(`/api/product-units/${unitEditingId}`, {
        serialNumber: unitEditForm.serialNumber,
        modelNumber: unitEditForm.modelNumber,
        stockType: unitEditForm.stockType,
        status: unitEditForm.status,
        manufacturingDate: unitEditForm.manufacturingDate || null
      });
      setUnitEditingId(null);
      await fetchUnits();
      onUpdated();
      alert('Unit updated successfully');
    } catch (error: any) {
      console.error('Error updating unit', error);
      alert(error.response?.data?.message || 'Failed to update unit');
    } finally {
      setUnitSaving(false);
    }
  };

  const addDraftRow = () => {
    setUnitDrafts((prev) => ([...prev, { serialNumber: '', modelNumber: '', stockType: 'both' }]));
  };

  const updateDraftRow = (idx: number, updates: Partial<UnitDraft>) => {
    setUnitDrafts((prev) => prev.map((draft, i) => i === idx ? { ...draft, ...updates } : draft));
  };

  const removeDraftRow = (idx: number) => {
    setUnitDrafts((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveDraftUnits = async () => {
    if (!unitDrafts.length) return;

    const hasIncomplete = unitDrafts.some((draft) => !draft.serialNumber.trim() || !draft.modelNumber.trim());
    if (hasIncomplete) {
      alert('Each unit must include serial and model numbers');
      return;
    }

    setUnitDraftSaving(true);
    try {
      await api.post('/api/product-units/add', {
        productId: product._id,
        units: unitDrafts
      });
      setUnitDrafts([]);
      await fetchUnits();
      onUpdated();
      alert(`${unitDrafts.length} unit(s) added successfully`);
    } catch (error: any) {
      console.error('Error adding units', error);
      alert(error.response?.data?.message || 'Failed to add units');
    } finally {
      setUnitDraftSaving(false);
    }
  };

  const handleSaveRecommendations = async () => {
    setRecommendationSaving(true);
    try {
      await api.put(`/api/products/${product._id}/recommendations`, {
        recommendedProductIds: recommendations
      });
      onUpdated();
      alert('Recommendations updated successfully');
    } catch (error: any) {
      console.error('Error updating recommendations', error);
      alert(error.response?.data?.message || 'Failed to update recommendations');
    } finally {
      setRecommendationSaving(false);
    }
  };

  const toggleRecommendation = (id: string) => {
    setRecommendations((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const recommendedProducts = useMemo(() => products.filter((p) => p._id !== product._id), [products, product._id]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Manage {product.name}
            </h2>
            <p className="text-sm text-gray-500">Update product details, inventory units, and recommendations from a single place.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4 flex gap-2 border-b border-gray-200 bg-white">
          {[
            { id: 'details', label: 'Details', icon: Tag },
            { id: 'units', label: 'Units & Stock', icon: Layers },
            { id: 'recommendations', label: 'Recommendations', icon: ClipboardCheck }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === 'details' && (
            <form onSubmit={handleSaveDetails} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Product Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Category *</label>
                  <input
                    required
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Retailer Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.retailerPrice}
                    onChange={(e) => setForm((prev) => ({ ...prev, retailerPrice: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Requires Quote</p>
                    <p className="text-xs text-gray-500">Hide direct purchase pricing</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={form.requiresQuote}
                      onChange={(e) => setForm((prev) => ({ ...prev, requiresQuote: e.target.checked }))}
                    />
                    <span className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-5 after:w-5 after:rounded-full after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>
                <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Featured Product</p>
                    <p className="text-xs text-gray-500">Highlight in storefront</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={form.isRecommended}
                      onChange={(e) => setForm((prev) => ({ ...prev, isRecommended: e.target.checked }))}
                    />
                    <span className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-amber-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-5 after:w-5 after:rounded-full after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Warranty (months)</label>
                  <input
                    type="number"
                    min={1}
                    value={form.warrantyPeriodMonths}
                    onChange={(e) => setForm((prev) => ({ ...prev, warrantyPeriodMonths: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Images</label>
                <p className="text-xs text-gray-500 mb-2">Add or remove product images. First image is used as thumbnail.</p>
                <div className="flex flex-wrap gap-3">
                  {form.images.map((img, idx) => (
                    <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                      <img src={img} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute top-1 right-1 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-blue-400">
                    <Plus className="w-5 h-5" />
                    <span className="text-xs mt-1">Add</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={detailsSaving || uploadingImages}
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white flex items-center gap-2 disabled:opacity-60"
                >
                  {detailsSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Details
                </button>
              </div>
            </form>
          )}

          {activeTab === 'units' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-600" /> Product Units ({units.length})
                  </h3>
                  <p className="text-sm text-gray-500">Manage serialized inventory for this product. Stock auto-syncs with available units.</p>
                </div>
                <button onClick={fetchUnits} className="px-3 py-2 text-sm flex items-center gap-2 border border-gray-300 rounded-lg hover:bg-gray-100">
                  <RefreshCw className="w-4 h-4" /> Refresh
                </button>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white rounded-full shadow">
                    <Package className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Available Stock</p>
                    <p className="text-lg font-semibold text-gray-900">{product.stock ?? 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white rounded-full shadow">
                    <Shield className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Offline Stock</p>
                    <p className="text-lg font-semibold text-gray-900">{product.offlineStock ?? 0}</p>
                  </div>
                </div>
              </div>

              {unitsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              ) : unitsError ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {unitsError}
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3 text-left">Serial</th>
                        <th className="px-4 py-3 text-left">Model</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Stock Type</th>
                        <th className="px-4 py-3 text-left">Updated</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {units.map((unit) => {
                        const isEditing = unitEditingId === unit._id;
                        return (
                          <tr key={unit._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-mono text-sm">{isEditing ? (
                              <input
                                value={unitEditForm.serialNumber}
                                onChange={(e) => setUnitEditForm((prev) => ({ ...prev, serialNumber: e.target.value }))}
                                className="px-2 py-1 border border-gray-300 rounded"
                              />
                            ) : unit.serialNumber}</td>
                            <td className="px-4 py-3">{isEditing ? (
                              <input
                                value={unitEditForm.modelNumber}
                                onChange={(e) => setUnitEditForm((prev) => ({ ...prev, modelNumber: e.target.value }))}
                                className="px-2 py-1 border border-gray-300 rounded"
                              />
                            ) : unit.modelNumber}</td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <select
                                  value={unitEditForm.status}
                                  onChange={(e) => setUnitEditForm((prev) => ({ ...prev, status: e.target.value as ProductUnit['status'] }))}
                                  className="px-2 py-1 border border-gray-300 rounded"
                                >
                                  {['available', 'sold', 'reserved', 'defective', 'returned'].map((status) => (
                                    <option key={status} value={status}>{status}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${unit.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                                  {unit.status}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <select
                                  value={unitEditForm.stockType}
                                  onChange={(e) => setUnitEditForm((prev) => ({ ...prev, stockType: e.target.value as UnitDraft['stockType'] }))}
                                  className="px-2 py-1 border border-gray-300 rounded"
                                >
                                  <option value="online">online</option>
                                  <option value="offline">offline</option>
                                  <option value="both">both</option>
                                </select>
                              ) : (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{unit.stockType}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">{new Date(unit.updatedAt).toLocaleString()}</td>
                            <td className="px-4 py-3 text-right">
                              {isEditing ? (
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setUnitEditingId(null)}
                                    type="button"
                                    className="px-2 py-1 text-xs border border-gray-300 rounded"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleUpdateUnit}
                                    type="button"
                                    disabled={unitSaving}
                                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded flex items-center gap-1"
                                  >
                                    {unitSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                    Save
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => startEditUnit(unit)}
                                  type="button"
                                  className="px-3 py-1 text-xs flex items-center gap-1 text-blue-600 hover:bg-blue-50 rounded"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  Edit
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {units.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                            No units found. Add units below to populate stock.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="border border-dashed border-gray-300 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add New Units
                  </h4>
                  <button onClick={addDraftRow} type="button" className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Row
                  </button>
                </div>

                {unitDrafts.length === 0 ? (
                  <p className="text-sm text-gray-500">Generate new unit rows to register additional serialized inventory.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-gray-600 text-xs uppercase">
                          <th className="px-3 py-2 text-left">Serial Number *</th>
                          <th className="px-3 py-2 text-left">Model Number *</th>
                          <th className="px-3 py-2 text-left">Manufactured</th>
                          <th className="px-3 py-2 text-left">Stock Type</th>
                          <th className="px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {unitDrafts.map((draft, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2">
                              <input
                                value={draft.serialNumber}
                                onChange={(e) => updateDraftRow(idx, { serialNumber: e.target.value })}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                value={draft.modelNumber}
                                onChange={(e) => updateDraftRow(idx, { modelNumber: e.target.value })}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="date"
                                value={draft.manufacturingDate || ''}
                                onChange={(e) => updateDraftRow(idx, { manufacturingDate: e.target.value })}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <select
                                value={draft.stockType}
                                onChange={(e) => updateDraftRow(idx, { stockType: e.target.value as UnitDraft['stockType'] })}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                              >
                                <option value="online">online</option>
                                <option value="offline">offline</option>
                                <option value="both">both</option>
                              </select>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button onClick={() => removeDraftRow(idx)} type="button" className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex justify-end mt-3">
                  <button
                    type="button"
                    onClick={handleSaveDraftUnits}
                    disabled={unitDraftSaving || unitDrafts.length === 0}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-60"
                  >
                    {unitDraftSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Units
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Recommended Products</h3>
                  <p className="text-sm text-gray-500">Select products to surface alongside {product.name} on the storefront.</p>
                </div>
                <button
                  onClick={handleSaveRecommendations}
                  disabled={recommendationSaving}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg flex items-center gap-2 disabled:opacity-60"
                >
                  {recommendationSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[55vh] overflow-y-auto pr-1">
                {recommendedProducts.length === 0 ? (
                  <div className="col-span-full text-sm text-gray-500">No other products available to recommend.</div>
                ) : (
                  recommendedProducts.map((p) => {
                    const checked = recommendations.includes(p._id);
                    return (
                      <label
                        key={p._id}
                        className={`flex items-center gap-3 border rounded-xl p-3 cursor-pointer transition-colors ${checked ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:border-blue-300'}`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() => toggleRecommendation(p._id)}
                        />
                        <img src={p.images?.[0]} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.category}</p>
                        </div>
                        {checked && <CheckCircle className="w-4 h-4 text-amber-500" />}
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductEditor;
