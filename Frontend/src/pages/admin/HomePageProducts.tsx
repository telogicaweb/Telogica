import { useState, useEffect } from 'react';
import api from '../../api';
import { Search, Save, ArrowLeft, Check, AlertCircle, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Product {
  _id: string;
  name: string;
  category: string;
  isRecommended: boolean;
  images: string[];
  price?: number;
}

const HomePageProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProducts(filtered);
    setSelectedCount(products.filter(p => p.isRecommended).length);
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/api/products');
      setProducts(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const toggleProduct = (id: string) => {
    setProducts(products.map(p => 
      p._id === id ? { ...p, isRecommended: !p.isRecommended } : p
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // We need to update all changed products. 
      // For efficiency, we could track changes, but for simplicity/robustness with this API structure,
      // we might need to update them one by one or create a bulk update endpoint.
      // Assuming we don't have a bulk update endpoint for this specific flag, we'll iterate.
      // Ideally, the backend should have a bulk update. 
      // Let's try to use the existing update endpoint for each changed product.
      
      // Better approach: Send a list of IDs that SHOULD be recommended.
      // But we don't have that endpoint.
      // Let's just update the ones that changed? No, we don't track "changed" state easily here without extra state.
      // Let's just update ALL products that are currently recommended to be true, and others to false?
      // That's too many requests.
      
      // Let's assume we only update the ones where the state in DB differs from state in UI.
      // But we don't have the "original" state easily accessible unless we keep a copy.
      
      // Let's just implement a bulk update on the client side by iterating.
      // To avoid spamming, let's fetch the current state again or just trust the user knows what they are doing.
      
      // Actually, let's create a new endpoint in the backend for this? 
      // The user didn't ask for backend changes but "provide option... by admin".
      // I'll stick to frontend-only logic if possible, but a bulk update is cleaner.
      // I'll implement a loop for now, but filter for only necessary updates if I can.
      
      // Let's just loop through all displayed products and update them? No, that's bad.
      
      // Let's fetch the fresh data, compare, and update only differences.
      const { data: currentDbProducts } = await api.get('/api/products');
      
      const updates = products.filter(p => {
        const dbProduct = currentDbProducts.find((dbp: Product) => dbp._id === p._id);
        return dbProduct && dbProduct.isRecommended !== p.isRecommended;
      });

      await Promise.all(updates.map(p => 
        api.put(`/api/products/${p._id}`, { isRecommended: p.isRecommended })
      ));

      alert(`Successfully updated ${updates.length} products.`);
      fetchProducts(); // Refresh
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Home Page Products</h1>
              <p className="text-gray-600">Select products to display on the home page featured section.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
              <span className="text-gray-600 font-medium">Selected: </span>
              <span className="text-indigo-600 font-bold text-lg">{selectedCount}</span>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save size={20} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2">
               {/* Filter buttons could go here */}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    Select
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      Loading products...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No products found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr 
                      key={product._id} 
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${product.isRecommended ? 'bg-indigo-50/30' : ''}`}
                      onClick={() => toggleProduct(product._id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${
                          product.isRecommended 
                            ? 'bg-indigo-600 border-indigo-600 text-white' 
                            : 'border-gray-300 bg-white'
                        }`}>
                          {product.isRecommended && <Check size={14} />}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img
                              className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                              src={product.images[0] || 'https://via.placeholder.com/40'}
                              alt=""
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.price ? `₹${product.price.toLocaleString()}` : 'Quote Required'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.isRecommended ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Star size={12} className="fill-current" />
                            Featured
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Standard
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePageProducts;
