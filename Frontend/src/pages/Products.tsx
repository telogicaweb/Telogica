import { useEffect, useState, useContext } from 'react';
import api from '../api';
import { Link, useSearchParams } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { ShoppingCart, FileText, Eye, Package, Search, Download, ChevronRight, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const ProductSkeleton = () => (
  <div className="bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] animate-pulse">
    <div className="aspect-[4/3] bg-gradient-to-b from-gray-100 to-gray-50" />
    <div className="p-5 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-4/5" />
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-3/4" />
      <div className="pt-3 border-t border-gray-100 mt-3">
        <div className="h-5 bg-gray-200 rounded w-24 mb-3" />
        <div className="flex gap-2">
          <div className="h-10 bg-gray-200 rounded-lg flex-1" />
          <div className="h-10 bg-gray-100 rounded-lg flex-1" />
        </div>
      </div>
    </div>
  </div>
);

const Products = () => {
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ value: string; label: string; count: number }[]>([]);
  const [activeCategory, setActiveCategory] = useState(categoryFromUrl || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);

  const { addToCart, addToQuote } = useContext(CartContext)!;
  const { user } = useContext(AuthContext)!;

  useEffect(() => {
    if (categoryFromUrl) {
      setActiveCategory(categoryFromUrl);
    }
  }, [categoryFromUrl]);

  // Load categories and counts once on mount to populate the filters sidebar/pills
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/api/products');
        const uniqueCategories = Array.from(new Set(data.map((p: any) => p.category)))
          .filter(Boolean)
          .sort();
        
        const categoryMap = [
          { value: 'all', label: 'All Products', count: data.length },
          ...uniqueCategories.map((cat: any) => ({
            value: cat,
            label: cat.charAt(0).toUpperCase() + cat.slice(1),
            count: data.filter((p: any) => p.category?.toLowerCase() === cat.toLowerCase()).length
          }))
        ];
        setCategories(categoryMap);
      } catch (err) {
        console.error('Error fetching categories', err);
      }
    };
    fetchCategories();
  }, []);

  const fetchProducts = async (currentPage: number, isInitial: boolean = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params: any = {
        page: currentPage,
        limit: 12,
      };
      
      if (activeCategory !== 'all') {
        params.category = activeCategory;
      }
      
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const { data } = await api.get('/api/products', { params });
      
      if (isInitial) {
        setProducts(data.products || []);
      } else {
        setProducts((prev) => [...prev, ...(data.products || [])]);
      }
      setTotalProducts(data.totalProducts || 0);
      setHasMore(data.hasMore ?? false);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Trigger paginated load when filters or search change
  useEffect(() => {
    setPage(1);
    fetchProducts(1, true);
  }, [activeCategory, searchQuery]);

  // Scroll listener for infinite scroll pagination
  useEffect(() => {
    const handleScroll = () => {
      if (loading || loadingMore || !hasMore) return;

      const threshold = 300; // Load next page when within 300px from the bottom
      const totalHeight = document.documentElement.scrollHeight;
      const scrollPosition = window.innerHeight + window.scrollY;

      if (totalHeight - scrollPosition < threshold) {
        setPage((prevPage) => {
          const nextPage = prevPage + 1;
          fetchProducts(nextPage, false);
          return nextPage;
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, loadingMore, hasMore, activeCategory, searchQuery]);

  const handleAddToCart = (product: Product, useRetailerPrice?: boolean) => {
    if (user?.role !== 'retailer') {
    }
    addToCart(product, 1, useRetailerPrice);
    alert('Added to Cart');
  };

  const handleAddToQuote = (product: Product) => {
    addToQuote(product, 1);
    alert('Added to Quote');
  };

  const handleDownloadDatasheet = async (product: Product) => {
    if (!product.brochureUrl) {
      alert('Datasheet not available for this product');
      return;
    }
    
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      window.open(product.brochureUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    newWindow.document.write('<p style="font-family: sans-serif; text-align: center; margin-top: 50px; color: #4b5563;">Loading datasheet...</p>');
    
    try {
      const response = await fetch(product.brochureUrl);
      if (!response.ok) throw new Error('Failed to fetch file');
      const blob = await response.blob();
      const newBlob = new Blob([blob], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(newBlob);
      newWindow.location.href = blobUrl;
    } catch (error) {
      console.error('Failed to preview datasheet:', error);
      newWindow.close();
      window.open(product.brochureUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const isDefenceCategory = (cat?: string) => cat?.toLowerCase() === 'defence';

  const renderCard = (product: Product, index: number) => {
    const isDefence = isDefenceCategory(product.category);
    return (
      <motion.div
        key={product._id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: (index % 12) * 0.02 }}
        className="group bg-white rounded-2xl border border-gray-200/60 overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_32px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col"
      >
        {/* Image */}
        <Link to={`/product/${product._id}`} className="relative block aspect-[4/3] bg-gradient-to-b from-gray-50 to-white overflow-hidden">
          <img
            src={product.images[0] || 'https://via.placeholder.com/400x300?text=Telogica+Product'}
            alt={product.name}
            className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110 product-image-enhance"
          />
          {/* Category tag - flush with top-left corner of the card */}
          {(() => {
            const cat = product.category?.toLowerCase() || '';
            let bgClass = 'bg-gray-700 text-white';
            let label = product.category;
            
            if (cat.includes('telecom')) {
              bgClass = 'bg-[#2a3f8f] text-white'; // Logo Blue
              label = 'TELECOM';
            } else if (cat.includes('railway') || cat.includes('rail')) {
              bgClass = 'bg-[#ff5a00] text-white'; // Logo Orange
            } else if (cat.includes('defence') || cat.includes('defense')) {
              bgClass = 'bg-emerald-600 text-white'; // Green
            }
            
            return (
              <span className={`absolute top-0 left-0 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-br-lg shadow-sm ${bgClass}`}>
                {label}
              </span>
            );
          })()}
          {product.subcategory && (
            <span className="absolute top-2 right-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-indigo-600 text-white rounded">
              {product.subcategory}
            </span>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
        </Link>

        {/* Content */}
        <div className="p-5 flex-grow flex flex-col border-t border-gray-100">
          <Link to={`/product/${product._id}`}>
            <h3 className="text-[15px] font-semibold text-gray-900 line-clamp-2 leading-snug hover:text-indigo-600 transition-colors">
              {product.name}
            </h3>
          </Link>
          <p className="text-[13px] text-gray-500 mt-1.5 line-clamp-2 leading-relaxed flex-grow">
            {product.description}
          </p>

          {/* Price + Warranty */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                {isDefence ? null : user?.role === 'retailer' ? (
                  product.retailerPrice ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-gray-900">₹{product.retailerPrice.toLocaleString()}</span>
                      <span className="text-[11px] text-gray-400">+GST</span>
                    </div>
                  ) : (
                    <span className="text-sm font-semibold text-gray-700">Request Quote</span>
                  )
                ) : (
                  product.isTelecom && product.price && !product.requiresQuote ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
                      <span className="text-[11px] text-gray-400">+GST</span>
                    </div>
                  ) : (
                    <span className="text-sm font-semibold text-gray-700">Request Quote</span>
                  )
                )}
              </div>
              {product.warrantyPeriodMonths && (
                <span className="text-[11px] text-gray-400 font-medium">{product.warrantyPeriodMonths}mo warranty</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {isDefence ? (
                <>
                  <Link
                    to={`/product/${product._id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-gray-900 text-white py-2.5 text-[13px] font-semibold rounded-lg shadow-sm hover:bg-gray-800 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Details
                  </Link>
                  <button
                    onClick={() => handleDownloadDatasheet(product)}
                    disabled={!product.brochureUrl}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold rounded-lg shadow-sm transition-colors ${
                      product.brochureUrl
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Datasheet
                  </button>
                </>
              ) : (
                <>
                  {user?.role === 'retailer' ? (
                    product.retailerPrice ? (
                      <button
                        onClick={() => handleAddToCart(product, true)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-gray-900 text-white py-2.5 text-[13px] font-semibold rounded-lg shadow-sm hover:bg-gray-800 transition-colors"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Buy Now
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAddToQuote(product)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-[#2a3f8f] text-white py-2.5 text-[13px] font-semibold rounded-lg shadow-sm hover:bg-[#1e2e6b] transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Request Quote
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => handleAddToQuote(product)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-[#2a3f8f] text-white py-2.5 text-[13px] font-semibold rounded-lg shadow-sm hover:bg-[#1e2e6b] transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Request Quote
                    </button>
                  )}

                  <button
                    onClick={() => handleDownloadDatasheet(product)}
                    disabled={!product.brochureUrl}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold rounded-lg shadow-sm transition-colors ${
                      product.brochureUrl
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Datasheet
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Top bar — breadcrumb strip */}
      <div className="bg-gray-900 pt-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center gap-2 text-xs">
            <Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 text-gray-600" />
            <span className="text-white font-medium">Products</span>
          </div>
        </div>
      </div>

      {/* Sticky toolbar */}
      <div className="sticky top-20 z-30 bg-white border-b border-gray-200 py-3">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Search & Category tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 flex-grow">
              {/* Search */}
              <div className="relative w-full sm:w-56 shrink-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Separator */}
              <div className="hidden sm:block w-px h-5 bg-gray-200" />

              {/* Category tabs */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const isActive = activeCategory.toLowerCase() === category.value.toLowerCase();
                  return (
                    <button
                      key={category.value}
                      onClick={() => setActiveCategory(category.value)}
                      className={`relative px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors rounded-md ${
                        isActive
                          ? 'text-white bg-[#2a3f8f] shadow-sm'
                          : 'text-gray-600 hover:text-[#2a3f8f] hover:bg-blue-50/50 bg-gray-50/50'
                      }`}
                    >
                      {category.label}
                      <span className={`ml-1 text-[10px] tabular-nums ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                        {category.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Count */}
            <span className="text-xs text-gray-400 shrink-0 tabular-nums self-start md:self-auto">
              {totalProducts} result{totalProducts !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Product grid */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </motion.div>
          ) : products.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <Package className="w-12 h-12 text-gray-200 mb-4" />
              <h3 className="text-sm font-semibold text-gray-900 mb-1">No products found</h3>
              <p className="text-xs text-gray-500 mb-5 text-center max-w-xs">
                {searchQuery
                  ? `No results for "${searchQuery}".`
                  : 'No products match the selected filter.'}
              </p>
              <button
                onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-md text-xs font-medium hover:bg-gray-800 transition-colors"
              >
                Clear Filters
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ) : (
            <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {activeCategory.toLowerCase() === 'defence' ? (
                (() => {
                  const defenceProducts = products.filter(p => isDefenceCategory(p.category));
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
                    <div className="space-y-8">
                      {sortedKeys.map(key => (
                        <section key={key}>
                          <div className="flex items-center gap-3 mb-4">
                            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{key}</h2>
                            <span className="text-[10px] text-gray-400 tabular-nums">{groups.get(key)!.length}</span>
                            <div className="flex-grow h-px bg-gray-100" />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {groups.get(key)!.map((p, i) => renderCard(p, i))}
                          </div>
                        </section>
                      ))}
                    </div>
                  );
                })()
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((p, i) => renderCard(p, i))}
                </div>
              )}
              {loadingMore && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-gray-200 border-t-gray-900 rounded-full"></div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Products;
