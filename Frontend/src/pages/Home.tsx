import { useEffect, useState, useContext } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import Hero from '../components/Hero';
import { ShoppingCart, FileText, Eye, Package } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  description: string;
  price?: number;
  retailerPrice?: number;
  images: string[];
  isRecommended: boolean;
  category: string;
  requiresQuote?: boolean;
}

const Home = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [categories, setCategories] = useState([{ value: 'all', label: 'ALL' }]);
  const { addToCart, addToQuote } = useContext(CartContext)!;
  const { user } = useContext(AuthContext)!;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get('/api/products');
        setProducts(data);
        
        // Extract unique categories from products
        const allCategories = data.map((p: Product) => p.category).filter(Boolean);
        const uniqueCategories = Array.from(new Set(allCategories)) as string[];
        const categoryOptions = [
          { value: 'all', label: 'ALL' },
          ...uniqueCategories.map((cat: string) => ({
            value: cat.toLowerCase(),
            label: cat.toUpperCase()
          }))
        ];
        setCategories(categoryOptions);
      } catch (error) {
        console.error("Error fetching products", error);
      }
    };
    fetchProducts();
  }, []);

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    alert('Added to Cart');
  };

  const handleAddToQuote = (product: Product) => {
    addToQuote(product, 1);
    alert('Added to Quote');
  };

  const filteredProducts = activeCategory === 'all'
    ? products.filter(p => p.isRecommended)
    : products.filter(p => p.category.toLowerCase() === activeCategory && p.isRecommended);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Hero />
      {/* Products Section */}
      <section id="products" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our top picks for innovative solutions across Telecom, Defence, and Railway industries
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex justify-center gap-3 mb-12 flex-wrap">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setActiveCategory(category.value)}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all text-sm ${
                  activeCategory === category.value
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-indigo-300'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No featured products found in this category.</p>
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
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                      <span className="bg-white/90 text-gray-900 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide shadow">
                        {product.category}
                      </span>
                      {!product.price && (
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow">
                          Quote Only
                        </span>
                      )}
                    </div>
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
                    
                    {/* Price */}
                    <div className="mb-4">
                      {user?.role === 'retailer' ? (
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
                        // Regular user pricing - Only show price for Telecommunication products without quote requirement
                        (product.category?.toLowerCase() === 'telecommunication') && product.price && !product.requiresQuote ? (
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
                      <div className="grid grid-cols-2 gap-2">
                        {user?.role === 'retailer' ? (
                          // Retailers must request quote for all purchases
                          <button 
                            onClick={() => handleAddToQuote(product)} 
                            className="col-span-2 flex items-center justify-center gap-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium border border-blue-200"
                          >
                            <FileText className="w-4 h-4" />
                            Request Quote
                          </button>
                        ) : (
                          <>
                            {product.category.toLowerCase() === 'telecom' && product.price && !product.requiresQuote && (
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
                              className={`flex items-center justify-center gap-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium border border-blue-200 ${(product.category.toLowerCase() !== 'telecom' || !product.price || product.requiresQuote) ? 'col-span-2' : ''}`}
                            >
                              <FileText className="w-4 h-4" />
                              Quote
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* View All Products Button */}
          <div className="mt-16 text-center">
            <Link
              to="/products"
              className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              View All Products
              <span className="ml-2">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-indigo-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Need a Custom Solution?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Our team is ready to help you find the perfect products for your needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/quote"
              className="inline-flex items-center justify-center gap-2 bg-white text-indigo-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
            >
              <FileText className="w-5 h-5" />
              Request a Quote
            </Link>
            <a
              href="#products"
              className="inline-flex items-center justify-center gap-2 bg-indigo-700 text-white px-8 py-3 rounded-lg hover:bg-indigo-800 transition-colors font-semibold border-2 border-white"
            >
              <Package className="w-5 h-5" />
              Browse Products
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
