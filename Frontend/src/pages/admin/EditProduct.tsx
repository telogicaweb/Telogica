import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, Package, Save } from 'lucide-react';
import api from '../../api';
import ProductSelector from '../../components/AdminDashboard/ProductSelector';
import CategoryInput from '../../components/AdminDashboard/CategoryInput';
import SubcategoryPicker from '../../components/AdminDashboard/SubcategoryPicker';
import ImageUploader from '../../components/AdminDashboard/ImageUploader';
import { compressImage } from '../../utils/compressImage';

const MAX_PRODUCT_IMAGES = 10;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const DEFAULT_WARRANTY_MONTHS = 12;

interface Product {
  _id: string;
  name: string;
  category: string;
  subcategory?: string;
  description: string;
  normalPrice?: number;
  retailerPrice?: number;
  images?: string[];
  warrantyPeriodMonths?: number;
  extendedWarrantyAvailable?: boolean;
  extendedWarrantyMonths?: number;
  extendedWarrantyPrice?: number;
  isRecommended?: boolean;
  recommendedProductIds?: Array<string | { _id: string }>;
  brochureUrl?: string;
}

interface ProductFormState {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  normalPrice: string;
  retailerPrice: string;
  warrantyPeriodMonths: number;
  extendedWarrantyAvailable: boolean;
  extendedWarrantyMonths: number;
  extendedWarrantyPrice: string;
  isRecommended: boolean;
  images: string[];
  recommendedProductIds: string[];
  brochureUrl: string;
}

export default function EditProduct() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [productForm, setProductForm] = useState<ProductFormState>({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    normalPrice: '',
    retailerPrice: '',
    warrantyPeriodMonths: DEFAULT_WARRANTY_MONTHS,
    extendedWarrantyAvailable: true,
    extendedWarrantyMonths: 24,
    extendedWarrantyPrice: '',
    isRecommended: false,
    images: [],
    recommendedProductIds: [],
    brochureUrl: '',
  });

  const uniqueCategories = ['Telecommunication', 'Defence', 'Railway', 'Industrial'];

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user || JSON.parse(user).role !== 'admin') {
      navigate('/login');
      return;
    }
    loadProduct();
    loadProducts();
  }, [navigate, id]);

  const loadProduct = async () => {
    try {
      const response = await api.get(`/api/products/${id}`);
      const product = response.data;
      
      setProductForm({
        name: product.name,
        description: product.description,
        category: product.category,
        subcategory: product.subcategory || '',
        normalPrice: product.normalPrice?.toString() || '',
        retailerPrice: product.retailerPrice?.toString() || '',
        warrantyPeriodMonths: product.warrantyPeriodMonths || DEFAULT_WARRANTY_MONTHS,
        extendedWarrantyAvailable: product.extendedWarrantyAvailable !== false,
        extendedWarrantyMonths: product.extendedWarrantyMonths || 24,
        extendedWarrantyPrice: product.extendedWarrantyPrice?.toString() || '',
        isRecommended: product.isRecommended || false,
        images: product.images || [],
        recommendedProductIds: Array.isArray(product.recommendedProductIds)
          ? product.recommendedProductIds
            .map((id: any) => (typeof id === 'string' ? id : id?._id))
            .filter((id: any): id is string => Boolean(id))
          : [],
        brochureUrl: product.brochureUrl || '',
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading product:', error);
      alert('Failed to load product');
      navigate('/admin');
    }
  };

  const loadProducts = async () => {
    try {
      const response = await api.get('/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return;

    if (productForm.images.length === 0) {
      alert('Please upload at least one product image');
      return;
    }

    setSubmitting(true);
    try {
      let images = productForm.images;
      if (images.some((i) => i.startsWith('data:image'))) {
        const migrated: string[] = [];
        for (const img of images) {
          if (!img.startsWith('data:image')) {
            migrated.push(img);
            continue;
          }
          const blob = await fetch(img).then((r) => r.blob());
          let upload: File | Blob = blob;
          if (blob.size > MAX_IMAGE_BYTES) {
            upload = await compressImage(new File([blob], 'legacy.jpg', { type: blob.type }), { maxBytes: MAX_IMAGE_BYTES });
          }
          const formData = new FormData();
          formData.append('image', upload, 'legacy.jpg');
          const res = await api.post('/api/products/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          if (res.data?.url) migrated.push(res.data.url);
        }
        images = migrated;
        setProductForm((prev) => ({ ...prev, images: migrated }));
      }

      const isDefence = productForm.category.trim().toLowerCase() === 'defence';
      const payload: any = {
        name: productForm.name,
        description: productForm.description,
        category: productForm.category,
        subcategory: isDefence && productForm.subcategory.trim() ? productForm.subcategory.trim() : '',
        images,
        isRecommended: productForm.isRecommended,
        warrantyPeriodMonths: productForm.warrantyPeriodMonths,
        extendedWarrantyAvailable: productForm.extendedWarrantyAvailable,
        recommendedProductIds: productForm.recommendedProductIds,
      };

      if (productForm.brochureUrl) payload.brochureUrl = productForm.brochureUrl;

      if (productForm.normalPrice) payload.price = parseFloat(productForm.normalPrice);
      if (productForm.retailerPrice) payload.retailerPrice = parseFloat(productForm.retailerPrice);
      if (productForm.extendedWarrantyAvailable) {
        payload.extendedWarrantyMonths = productForm.extendedWarrantyMonths;
        if (productForm.extendedWarrantyPrice) {
          payload.extendedWarrantyPrice = parseFloat(productForm.extendedWarrantyPrice);
        }
      }

      await api.put(`/api/products/${id}`, payload);
      alert('Product updated successfully!');
      navigate('/admin');
    } catch (error: any) {
      console.error('Error updating product:', error);
      alert(error.response?.data?.message || 'Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
                <p className="text-sm text-gray-600">Update product details in your catalog</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-indigo-600">
              <Package className="w-5 h-5" />
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
          <form onSubmit={handleUpdateProduct} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                Basic Information
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <CategoryInput
                    value={productForm.category}
                    onChange={(value) => setProductForm({ ...productForm, category: value })}
                    categories={uniqueCategories}
                  />
                </div>
              </div>
              {productForm.category.trim().toLowerCase() === 'defence' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sub-category <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <SubcategoryPicker
                    value={productForm.subcategory}
                    onChange={(v) => setProductForm({ ...productForm, subcategory: v })}
                    suggestions={products
                      .filter((p) => p.category?.toLowerCase() === 'defence' && p.subcategory)
                      .map((p) => p.subcategory as string)}
                  />
                </div>
              )}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter detailed product description"
                />
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                Pricing
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Normal Price (₹)</label>
                  <input
                    type="number"
                    value={productForm.normalPrice}
                    onChange={(e) => setProductForm({ ...productForm, normalPrice: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter price for regular customers"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty if quote is required</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Retailer Price (₹)</label>
                  <input
                    type="number"
                    value={productForm.retailerPrice}
                    onChange={(e) => setProductForm({ ...productForm, retailerPrice: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter special price for retailers"
                  />
                </div>
              </div>
            </div>

            {/* Product Brochure */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm font-bold">3</span>
                Product Brochure (PDF)
              </h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
                <label className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Click to upload PDF brochure</span>
                    <span className="text-xs text-gray-500">or drag and drop</span>
                  </div>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setProductForm((prev) => ({
                          ...prev,
                          brochureUrl: reader.result as string
                        }));
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">Upload product brochure (PDF only). Will be visible to buyers in their dashboard after purchase.</p>
              
              {productForm.brochureUrl && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-green-800">Brochure uploaded successfully</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProductForm((prev) => ({ ...prev, brochureUrl: '' }))}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Product Images */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm font-bold">4</span>
                Product Images <span className="text-red-500">*</span>
              </h2>
              <ImageUploader
                images={productForm.images}
                onChange={(imgs) => setProductForm({ ...productForm, images: imgs })}
                maxImages={MAX_PRODUCT_IMAGES}
                maxBytes={MAX_IMAGE_BYTES}
              />
            </div>

            {/* Warranty Configuration */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm font-bold">5</span>
                Warranty Options
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Standard Warranty (months) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.warrantyPeriodMonths}
                    onChange={(e) => setProductForm({ ...productForm, warrantyPeriodMonths: parseInt(e.target.value) || 12 })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="12"
                  />
                  <p className="text-xs text-gray-500 mt-1">Free warranty period (default: 12 months)</p>
                </div>
                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={productForm.extendedWarrantyAvailable}
                      onChange={(e) => setProductForm({ ...productForm, extendedWarrantyAvailable: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Offer Extended Warranty</span>
                  </label>
                </div>
              </div>

              {productForm.extendedWarrantyAvailable && (
                <div className="grid md:grid-cols-2 gap-4 mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Extended Warranty (months) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.extendedWarrantyMonths}
                      onChange={(e) => setProductForm({ ...productForm, extendedWarrantyMonths: parseInt(e.target.value) || 24 })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="24"
                    />
                    <p className="text-xs text-gray-500 mt-1">Extended warranty period (default: 24 months)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Extended Warranty Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={productForm.extendedWarrantyPrice}
                      onChange={(e) => setProductForm({ ...productForm, extendedWarrantyPrice: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter additional price"
                    />
                    <p className="text-xs text-gray-500 mt-1">Additional cost for extended warranty</p>
                  </div>
                </div>
              )}
            </div>

            {/* Recommended Products */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm font-bold">6</span>
                Additional Options
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recommended Products
                  </label>
                  <ProductSelector
                    products={products.filter(p => p._id !== id)}
                    selectedIds={productForm.recommendedProductIds}
                    onChange={(ids) => setProductForm({ ...productForm, recommendedProductIds: ids })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Select products to recommend alongside this one</p>
                </div>

                <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <input
                    type="checkbox"
                    id="isRecommended"
                    checked={productForm.isRecommended}
                    onChange={(e) => setProductForm({ ...productForm, isRecommended: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="isRecommended" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Mark as Recommended Product (Featured on homepage)
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Update Product
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin')}
                disabled={submitting}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
