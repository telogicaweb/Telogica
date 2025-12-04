import { useEffect, useState, useContext, useCallback } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { ShoppingCart, FileText, Eye, Package, Search, Filter } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  description: string;
  price?: number;
  retailerPrice?: number;
  images: string[];
  isRecommended: boolean;
  category: string;
  requiresQuote: boolean;
  warrantyPeriodMonths?: number;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuoteOnly, setShowQuoteOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const { addToCart, addToQuote } = useContext(CartContext)!;

  useEffect(() => {
    fetchProducts();
  }, []);

  const filterProducts = useCallback(() => {
    let filtered = products;

    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(p => p.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter quote-only products
    if (showQuoteOnly) {
      filtered = filtered.filter(p => p.requiresQuote || !p.price);
    }

    setFilteredProducts(filtered);
  }, [products, activeCategory, searchQuery, showQuoteOnly]);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/products');
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    alert('Added to Cart');
  };

  const handleAddToQuote = (product: Product) => {
    addToQuote(product, 1);
    alert('Added to Quote');
  };

  const categories = [
    { value: 'all', label: 'All Products' },
    { value: 'telecom', label: 'Telecom' },
    { value: 'defence', label: 'Defence' },
    { value: 'railway', label: 'Railway' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Our Products
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Browse our comprehensive range of innovative solutions across Telecom, Defence, and Railway industries
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-3 flex-wrap">
              <Filter className="text-gray-600 w-5 h-5" />
              <span className="text-sm font-medium text-gray-700">Categories:</span>
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setActiveCategory(category.value)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                      activeCategory === category.value
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quote Only Filter */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="quoteOnly"
                checked={showQuoteOnly}
                onChange={(e) => setShowQuoteOnly(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="quoteOnly" className="text-sm text-gray-700 cursor-pointer">
                Show only quote-required products
              </label>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredProducts.length}</span> of{' '}
              <span className="font-semibold text-gray-900">{products.length}</span> products
            </p>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-gray-500 mt-4">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-sm">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
                setShowQuoteOnly(false);
              }}
              className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <div 
                key={product._id} 
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col border border-gray-200"
              >
                {/* Product Image */}
                <div className="relative h-56 overflow-hidden bg-gray-100">
                  <img 
                    src={product.images[0] || 'https://via.placeholder.com/400x300?text=Telogica+Product'} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                  {(!product.price || product.requiresQuote) && (
                    <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Quote Only
                    </div>
                  )}
                  {product.isRecommended && (
                    <div className="absolute top-3 left-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Recommended
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-5 flex-grow flex flex-col">
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                      {product.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 flex-grow line-clamp-3">
                    {product.description}
                  </p>
                  
                  {/* Warranty Info */}
                  {product.warrantyPeriodMonths && (
                    <div className="mb-3 text-xs text-gray-500">
                      <span className="font-medium">Warranty:</span> {product.warrantyPeriodMonths} months
                    </div>
                  )}
                  
                  {/* Price */}
                  <div className="mb-4">
                    {product.price && !product.requiresQuote ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
                        <span className="text-sm text-gray-500">+ GST</span>
                      </div>
                    ) : (
                      <p className="text-lg font-semibold text-blue-600">Price on Request</p>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 mt-auto">
                    <Link 
                      to={`/product/${product._id}`} 
                      className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Link>
                    <div className="grid grid-cols-2 gap-2">
                      {product.price && !product.requiresQuote && (
                        <button 
                          onClick={() => handleAddToCart(product)} 
                          className="flex items-center justify-center gap-1 bg-green-50 text-green-700 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium border border-green-200"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Cart
                        </button>
                      )}
                      <button 
                        onClick={() => handleAddToQuote(product)} 
                        className={`flex items-center justify-center gap-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium border border-blue-200 ${(!product.price || product.requiresQuote) ? 'col-span-2' : ''}`}
                      >
                        <FileText className="w-4 h-4" />
                        Quote
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
