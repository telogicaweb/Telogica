import { useEffect, useState, useContext } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import Hero, { industries } from '../components/Hero';
import { ShoppingCart, FileText, Eye, Package, ArrowRight } from 'lucide-react';

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
  const [heroIndustry, setHeroIndustry] = useState('defence');
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

  // Get products for the current hero industry
  const heroProducts = products.filter(p => 
    p.category.toLowerCase() === heroIndustry.toLowerCase() ||
    (heroIndustry === 'telecom' && p.category.toLowerCase() === 'telecommunication') ||
    (heroIndustry === 'defence' && p.category.toLowerCase() === 'defence')
  ).slice(0, 6);

  // Get current industry info
  const currentIndustry = industries.find(i => i.id === heroIndustry) || industries[0];

  // Industry filter buttons
  const industryButtons = [
    { id: 'defence', name: 'Defence/Military' },
    { id: 'telecom', name: 'Telecommunication' },
    { id: 'railway', name: 'Railway' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <Hero onIndustryChange={setHeroIndustry} />
      
      {/* Industry Products Showcase - Synced with Hero */}
      <section className="py-20 bg-white relative overflow-hidden">
        {/* Decorative diagonal stripe */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, transparent 45%, #1e3a8a 45%, #1e3a8a 55%, transparent 55%)',
          }}
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0a1628] mb-4">
              Explore Our Products
            </h2>
            <p className="text-lg text-gray-600 max-w-4xl">
              Discover Telogica’s range of test and measuring equipment built for Defence, Telecommunication, and Railway applications. 
              Browse featured products below and switch categories to view what’s available for each sector.
            </p>
          </div>

          {/* Industry Filter Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {industryButtons.map((industry) => (
              <button
                key={industry.id}
                onClick={() => setHeroIndustry(industry.id)}
                className={`px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-300 ${
                  heroIndustry === industry.id
                    ? 'bg-[#1e3a8a] text-white shadow-lg shadow-blue-200'
                    : 'bg-gray-100 text-[#0a1628] hover:bg-gray-200 border border-gray-300'
                }`}
              >
                {industry.name}
              </button>
            ))}
          </div>

          {/* Dynamic Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {heroProducts.length > 0 ? (
              heroProducts.map((product, index) => (
                <Link 
                  key={product._id}
                  to={`/product/${product._id}`}
                  className="group relative overflow-hidden rounded-lg bg-white shadow-lg hover:shadow-xl transition-all duration-500"
                >
                  {/* Image Container with Blue Overlay */}
                  <div className="relative h-72 overflow-hidden">
                    {/* Diagonal Blue Accent */}
                    <div 
                      className="absolute inset-0 z-10 opacity-60"
                      style={{
                        background: 'linear-gradient(135deg, transparent 30%, rgba(30, 58, 138, 0.8) 30%, rgba(30, 58, 138, 0.8) 70%, transparent 70%)',
                      }}
                    />
                    
                    {/* Product Image */}
                    <img 
                      src={product.images[0] || '/hero-slide-1.jpg'} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    
                    {/* Blue Bottom Section */}
                    <div className="absolute bottom-0 left-0 right-0 bg-[#1e3a8a] py-4 px-6 z-20">
                      <h3 className="text-white text-xl font-bold text-center">
                        {product.name}
                      </h3>
                    </div>
                  </div>
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-[#0a1628]/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-6 z-30">
                    <h3 className="text-white text-xl font-bold mb-3 text-center">{product.name}</h3>
                    <p className="text-white/80 text-sm text-center mb-4 line-clamp-3">{product.description}</p>
                    <span className="flex items-center gap-2 text-amber-500 font-semibold">
                      View Details <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              // Placeholder cards when no products
              [1, 2, 3, 4, 5, 6].map((i) => (
                <div 
                  key={i}
                  className="relative overflow-hidden rounded-lg bg-gray-100 h-72 flex items-center justify-center"
                >
                  <div className="text-center p-6">
                    <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Products coming soon</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* View More Link */}
          <div className="mt-10 text-center">
            <Link 
              to={currentIndustry.link}
              className="inline-flex items-center gap-2 text-[#1e3a8a] font-semibold text-lg hover:text-amber-500 transition-colors"
            >
              View all {currentIndustry.name} products
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
