import { useEffect, useState, useContext, useCallback } from 'react';
import api from '../api';
import { Link, useSearchParams } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { ShoppingCart, FileText, Eye, Package, Search, Filter, Download } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  description: string;
  price?: number;
  retailerPrice?: number;
  images: string[];
  isRecommended: boolean;
  category: string;
  subcategory?: string;
  requiresQuote: boolean;
  warrantyPeriodMonths?: number;
  isTelecom?: boolean;
  brochureUrl?: string;
}

const Products = () => {
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState(categoryFromUrl || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToCart, addToQuote } = useContext(CartContext)!;
  const { user } = useContext(AuthContext)!;

  // Update category when URL changes
  useEffect(() => {
    console.log('Category from URL:', categoryFromUrl);
    console.log('Current activeCategory:', activeCategory);
    if (categoryFromUrl) {
      setActiveCategory(categoryFromUrl);
    }
  }, [categoryFromUrl]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const filterProducts = useCallback(() => {
    let filtered = products;

    // Filter by category (case-insensitive)
    if (activeCategory !== 'all') {
      filtered = filtered.filter(p =>
        p.category?.toLowerCase() === activeCategory.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [products, activeCategory, searchQuery]);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Only fetch products with stock > 0 for regular users
      const { data } = await api.get('/api/products');
      // Additional frontend filter to ensure no out-of-stock products are shown
      const inStockProducts = data.filter((p: Product) => (p as any).stock > 0);
      setProducts(inStockProducts);
    } catch (error) {
      console.error("Error fetching products", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product, useRetailerPrice?: boolean) => {
    // Check if adding this would make total items >= 3 (for non-retailers)
    if (user?.role !== 'retailer') {
      // This check will be done in Cart page when user tries to checkout
    }
    addToCart(product, 1, useRetailerPrice);
    alert('Added to Cart');
  };

  const handleAddToQuote = (product: Product) => {
    addToQuote(product, 1);
    alert('Added to Quote');
  };

  const handleDownloadDatasheet = (product: Product) => {
    if (!product.brochureUrl) {
      alert('Datasheet not available for this product');
      return;
    }
    const link = document.createElement('a');
    link.href = product.brochureUrl;
    link.download = `${product.name}-datasheet.pdf`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isDefenceCategory = (cat?: string) => cat?.toLowerCase() === 'defence';

  // Generate dynamic categories from products
  const categories = [
    { value: 'all', label: 'All Products' },
    ...Array.from(new Set(products.map(p => p.category)))
      .filter(Boolean)
      .sort()
      .map(category => ({
        value: category,
        label: category.charAt(0).toUpperCase() + category.slice(1)
      }))
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
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
                    className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${activeCategory.toLowerCase() === category.value.toLowerCase()
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
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
              }}
              className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          (() => {
            const renderCard = (product: Product) => {
              const isDefence = isDefenceCategory(product.category);
              return (
                <div
                  key={product._id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col border border-gray-200"
                >
                  {/* Product Image */}
                  <div className="relative h-56 overflow-hidden bg-gray-100">
                    <img
                      src={product.images[0] || '/placeholder.jpg'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="p-5 flex-grow flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    {product.subcategory && (
                      <span className="self-start mb-2 px-2 py-0.5 text-[10px] font-semibold text-purple-700 bg-purple-50 rounded-full uppercase tracking-wide">
                        {product.subcategory}
                      </span>
                    )}
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
                      {isDefence ? (
                        <p className="text-lg font-semibold text-indigo-600">Datasheet Available</p>
                      ) : user?.role === 'retailer' ? (
                        // Retailer-specific pricing
                        product.retailerPrice ? (
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold text-gray-900">₹{product.retailerPrice.toLocaleString()}</span>
                              <span className="text-sm text-gray-500">+ GST</span>
                            </div>
                            <p className="text-xs text-indigo-600 mt-1">Retailer Price</p>
                          </div>
                        ) : (
                          <p className="text-lg font-semibold text-blue-600">Request Quote</p>
                        )
                      ) : (
                        // Regular user pricing - Only show price for Telecom products without quote requirement
                        product.isTelecom && product.price && !product.requiresQuote ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
                            <span className="text-sm text-gray-500">+ GST</span>
                          </div>
                        ) : (
                          <p className="text-lg font-semibold text-blue-600">Request Quote</p>
                        )
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
                      {isDefence ? (
                        <button
                          onClick={() => handleDownloadDatasheet(product)}
                          disabled={!product.brochureUrl}
                          className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            product.brochureUrl
                              ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200'
                              : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          }`}
                          title={product.brochureUrl ? 'Download datasheet (PDF)' : 'Datasheet not uploaded yet'}
                        >
                          <Download className="w-4 h-4" />
                          {product.brochureUrl ? 'Download Datasheet' : 'Datasheet Unavailable'}
                        </button>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {user?.role === 'retailer' ? (
                            product.retailerPrice ? (
                              <>
                                <button
                                  onClick={() => handleAddToCart(product, true)}
                                  className="flex items-center justify-center gap-1 bg-green-50 text-green-700 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium border border-green-200"
                                >
                                  <ShoppingCart className="w-4 h-4" />
                                  Buy Now
                                </button>
                                <button
                                  onClick={() => handleAddToQuote(product)}
                                  className="flex items-center justify-center gap-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium border border-blue-200"
                                >
                                  <FileText className="w-4 h-4" />
                                  Bulk Quote
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleAddToQuote(product)}
                                className="col-span-2 flex items-center justify-center gap-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium border border-blue-200"
                              >
                                <FileText className="w-4 h-4" />
                                Request Quote
                              </button>
                            )
                          ) : (
                            <>
                              {product.isTelecom && (
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
                                className={`flex items-center justify-center gap-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium border border-blue-200 ${!product.isTelecom ? 'col-span-2' : ''}`}
                              >
                                <FileText className="w-4 h-4" />
                                Quote
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            };

            // Group Defence products by subcategory when viewing Defence
            if (activeCategory.toLowerCase() === 'defence') {
              const defenceProducts = filteredProducts.filter(p => isDefenceCategory(p.category));
              const groups = new Map<string, Product[]>();
              defenceProducts.forEach(p => {
                const key = (p.subcategory && p.subcategory.trim()) || 'General';
                if (!groups.has(key)) groups.set(key, []);
                groups.get(key)!.push(p);
              });
              const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
                if (a === 'General') return 1;
                if (b === 'General') return -1;
                return a.localeCompare(b);
              });

              return (
                <div className="space-y-10">
                  {sortedKeys.map(key => (
                    <section key={key}>
                      <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-xl font-bold text-gray-900">{key}</h2>
                        <span className="text-sm text-gray-500">({groups.get(key)!.length})</span>
                        <div className="flex-grow h-px bg-gray-200" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {groups.get(key)!.map(renderCard)}
                      </div>
                    </section>
                  ))}
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(renderCard)}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
};

export default Products;
