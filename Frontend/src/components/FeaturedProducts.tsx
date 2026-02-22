import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, Sparkles, ArrowRight, Shield, Satellite, Train, 
  Star, Award, TrendingUp, Clock, CheckCircle, Globe, 
  Eye
} from 'lucide-react';
import api from '../api';

interface Product {
  _id: string;
  name: string;
  description: string;
  price?: number;
  images: string[];
  category: string;
  requiresQuote: boolean;
}

const categoryMeta: Record<string, { 
// ... existing interface ... 
  label: string; 
  color: string; 
  gradient: string;
  gradientLight: string;
  icon: JSX.Element;
  stats: string;
  description: string;
  features: string[];
  bgPattern: string;
}> = {
  defence: {
    label: 'Defence / Military',
    color: 'text-red-600',
    gradient: 'from-red-600 to-red-500',
    gradientLight: 'from-red-50 to-red-100',
    icon: <Shield className="w-6 h-6" />,
    stats: '24+ Products',
    description: 'Mission-critical testing equipment for defence applications with MIL-STD compliance',
    features: ['MIL-STD Certified', 'Rugged Design', 'Field Ready'],
    bgPattern: 'radial-gradient(circle at 10% 20%, rgba(220, 38, 38, 0.03) 0%, transparent 30%)',
  },
  telecommunication: {
    label: 'Telecommunication',
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-500',
    gradientLight: 'from-blue-50 to-blue-100',
    icon: <Satellite className="w-6 h-6" />,
    stats: '18+ Products',
    description: 'Advanced telecom network testing solutions for 5G, fiber optics, and wireless networks',
    features: ['5G Ready', 'Fiber Optic', 'Network Analysis'],
    bgPattern: 'radial-gradient(circle at 30% 40%, rgba(37, 99, 235, 0.03) 0%, transparent 40%)',
  },
  railway: {
    label: 'Railway',
    color: 'text-emerald-600',
    gradient: 'from-emerald-600 to-emerald-500',
    gradientLight: 'from-emerald-50 to-emerald-100',
    icon: <Train className="w-6 h-6" />,
    stats: '15+ Products',
    description: 'Railway signaling and infrastructure testing equipment for safe and reliable operations',
    features: ['Signaling Test', 'Track Analysis', 'Safety Certified'],
    bgPattern: 'radial-gradient(circle at 70% 60%, rgba(5, 150, 105, 0.03) 0%, transparent 40%)',
  },
};

const categoryOrder = ['defence', 'telecommunication', 'railway'];

export default function FeaturedProducts() {
  const [groupedProducts, setGroupedProducts] = useState<Record<string, Product[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeHover, setActiveHover] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get('/api/products');
        const inStock = data.filter((p: any) => p.stock > 0);
        const grouped: Record<string, Product[]> = {};

        inStock.forEach((p: Product) => {
          let cat = p.category?.toLowerCase() || 'other';
          
          // Normalize categories to match our keys
          if (cat.includes('defence') || cat.includes('defense') || cat.includes('military')) {
            cat = 'defence';
          } else if (cat.includes('telecom')) {
            cat = 'telecommunication';
          } else if (cat.includes('rail')) {
            cat = 'railway';
          }

          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(p);
        });

        setGroupedProducts(grouped);
      } catch (err) {
        console.error('Error fetching featured products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Intersection Observer for fade-in animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-10');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [groupedProducts]);

  if (loading) {
    return (
      <section className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="relative">
          {/* Animated background */}
          <div className="absolute inset-0 bg-primary-100 rounded-full blur-3xl opacity-20 animate-pulse" />
          
          <div className="relative text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-200 border-t-primary-600 mx-auto" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary-600 animate-pulse" />
              </div>
            </div>
            <p className="mt-6 text-gray-600 font-medium animate-pulse">Loading exceptional products...</p>
          </div>
        </div>
      </section>
    );
  }

  if (Object.keys(groupedProducts).length === 0) return null;

  return (
    <div className="bg-gray-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-100 rounded-full blur-3xl opacity-20" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-20" />
      </div>

      {categoryOrder.map((catKey, index) => (
        <CategorySection
          key={catKey}
          catKey={catKey}
          index={index}
          groupedProducts={groupedProducts}
          activeHover={activeHover}
          setActiveHover={setActiveHover}
          onRef={(el) => (sectionRefs.current[catKey] = el)}
        />
      ))}
    </div>
  );
}

function CategorySection({ 
  catKey, 
  index, 
  groupedProducts, 
  activeHover, 
  setActiveHover,
  onRef
}: {
  catKey: string;
  index: number;
  groupedProducts: Record<string, Product[]>;
  activeHover: string | null;
  setActiveHover: (key: string | null) => void;
  onRef: (el: HTMLElement | null) => void;
}) {
  const products = groupedProducts[catKey] || [];
  const meta = categoryMeta[catKey];
  const isEven = index % 2 === 0;
  const [visibleStartIndex, setVisibleStartIndex] = useState(0);

  // Auto-rotate products every 2 seconds
  useEffect(() => {
    if (products.length <= 4) return;
    
    const interval = setInterval(() => {
      setVisibleStartIndex((prev) => (prev + 4) % products.length);
    }, 2000); // Switch every 2 seconds

    return () => clearInterval(interval);
  }, [products.length]);

  if (products.length === 0) return null;

  // Get current batch of 4 products (handling wrap-around)
  const currentBatch = [];
  for (let i = 0; i < 4; i++) {
    if (products.length > 0) {
      currentBatch.push(products[(visibleStartIndex + i) % products.length]);
    }
  }

  return (
    <section
      ref={onRef}
      className={`relative py-24 overflow-hidden transition-all duration-1000 opacity-0 translate-y-10 ${
        isEven ? 'bg-white' : 'bg-gray-50'
      }`}
      style={{ backgroundImage: meta.bgPattern }}
      onMouseEnter={() => setActiveHover(catKey)}
      onMouseLeave={() => setActiveHover(null)}
    >
      {/* Animated gradient orbs */}
      <div className={`absolute inset-0 opacity-30 transition-opacity duration-700 ${
        activeHover === catKey ? 'opacity-50' : 'opacity-30'
      }`}>
        <div className={`absolute top-20 left-20 w-64 h-64 bg-gradient-to-r ${meta.gradient} rounded-full blur-3xl animate-pulse`} />
        <div className={`absolute bottom-20 right-20 w-64 h-64 bg-gradient-to-r ${meta.gradient} rounded-full blur-3xl animate-pulse delay-1000`} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className={`flex flex-col lg:flex-row gap-12 lg:gap-16 items-start ${
          isEven ? '' : 'lg:flex-row-reverse'
        }`}>
          
          {/* Left/Right Side: Enhanced Vertical Marquee */}
          <div className="lg:w-[38%] w-full relative">
            <div className="sticky top-24">
              {/* Decorative frame */}
              <div className="absolute -inset-4 bg-gradient-to-br from-gray-900/5 to-transparent rounded-[2.5rem] blur-2xl" />
              
              {/* Main marquee container */}
              <div className="relative h-[600px] rounded-3xl overflow-hidden shadow-2xl group">
                {/* Gradient overlays */}
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white via-white/80 to-transparent z-20 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent z-20 pointer-events-none" />
                
                {/* Left/right fade edges */}
                <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-white to-transparent z-20 pointer-events-none" />
                <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-white to-transparent z-20 pointer-events-none" />
                
                {/* Category badge - floating */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30">
                  <div className={`px-6 py-3 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 flex items-center gap-3`}>
                    <div className={`p-2 rounded-xl bg-gradient-to-r ${meta.gradient} text-white`}>
                      {meta.icon}
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-gray-500">Featured Collection</p>
                      <p className={`font-bold bg-gradient-to-r ${meta.gradient} bg-clip-text text-transparent`}>
                        {meta.label}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats badge */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
                  <div className="flex items-center gap-3 bg-black/80 backdrop-blur-md text-white px-5 py-2.5 rounded-full shadow-2xl border border-white/10">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium">{meta.stats}</span>
                    <div className="w-1 h-1 bg-white/30 rounded-full" />
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm">Premium</span>
                  </div>
                </div>

                {/* Vertical Marquee */}
                <VerticalMarquee products={products} categoryColor={meta.color} />
              </div>

              {/* Floating decorative elements */}
              <div className={`absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-r ${meta.gradient} rounded-full blur-2xl opacity-30 animate-pulse`} />
              <div className={`absolute -top-6 -left-6 w-24 h-24 bg-gradient-to-r ${meta.gradientLight} rounded-full blur-2xl opacity-30 animate-pulse delay-1000`} />
            </div>
          </div>

          {/* Right/Left Side: Enhanced Content & Product Grid */}
          <div className={`lg:w-[58%] w-full flex flex-col ${
            isEven ? 'pt-8' : 'pt-8'
          }`}>
            {/* Category header with animation */}
            <div className="mb-10 transform transition-all duration-700">
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-4 rounded-2xl bg-gradient-to-r ${meta.gradient} text-white shadow-xl`}>
                  {meta.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-semibold ${meta.color}`}>● Live</span>
                    <span className="text-gray-400 text-sm">|</span>
                    <span className="text-sm text-gray-500">Premium Selection</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold">
                    <span className={`bg-gradient-to-r ${meta.gradient} bg-clip-text text-transparent`}>
                      {meta.label.split('/')[0]}
                    </span>
                  </h2>
                </div>
              </div>
              
              <p className="text-lg text-gray-600 mb-8 max-w-2xl leading-relaxed">
                {meta.description}
              </p>

              {/* Feature chips */}
              <div className="flex flex-wrap gap-3 mb-8">
                {meta.features.map((feature, i) => (
                  <div
                    key={i}
                    className={`px-4 py-2 bg-gradient-to-r ${meta.gradientLight} rounded-full text-sm font-medium text-gray-700 border border-gray-200/50 flex items-center gap-2`}
                  >
                    <CheckCircle className={`w-4 h-4 ${meta.color}`} />
                    {feature}
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Link
                to={`/products?category=${catKey}`}
                className={`group inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r ${meta.gradient} text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300`}
              >
                <span>Explore Collection</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Product Highlights Grid - Enhanced Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
              {currentBatch.map((product, idx) => (
                <Link
                  to={`/products/${product._id}`}
                  key={product._id} // Using _id as key might cause react issues if duplicates are shown - unlikely with 4 slice but okay for carousel
                  className="group relative bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-2 overflow-hidden border border-gray-100 animate-fade-in"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  {/* Hover gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${meta.gradientLight} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  <div className="relative p-5">
                    <div className="flex items-start gap-4">
                      {/* Product image with badge */}
                      <div className="relative">
                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shadow-md group-hover:shadow-xl transition-all duration-500">
                          <img
                            src={product.images?.[0] || '/placeholder.jpg'}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        </div>
                        {/* Quick view button */}
                        <div className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                          <div className="p-2 bg-white rounded-full shadow-lg border border-gray-200">
                            <Eye className="w-3 h-3 text-gray-600" />
                          </div>
                        </div>
                      </div>

                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1 mb-1">
                          {product.name}
                        </h4>
                        
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                          {product.description}
                        </p>

                        <div className="flex items-center justify-between">
                          {product.price ? (
                            <div>
                              <span className="text-[10px] text-gray-400 block">Starting at</span>
                              <span className="text-sm font-bold text-gray-900">
                                ₹{product.price.toLocaleString('en-IN')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                              Request Quote
                            </span>
                          )}
                          
                          <div className={`p-1.5 rounded-full bg-gradient-to-r ${meta.gradientLight} group-hover:bg-gradient-to-r group-hover:${meta.gradient} transition-all duration-300`}>
                            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-6 mt-10 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary-600" />
                <span className="text-sm text-gray-600">Industry Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-600" />
                <span className="text-sm text-gray-600">24/7 Support</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary-600" />
                <span className="text-sm text-gray-600">Global Shipping</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Enhanced Vertical Marquee Component
function VerticalMarquee({ products, categoryColor }: { products: Product[]; categoryColor: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Create seamless loop with more items for smooth scrolling
  const scrollItems = products.length > 0 
    ? Array(3).fill(products).flat()
    : [];

  useEffect(() => {
    const container = containerRef.current;
    if (!container || scrollItems.length === 0) return;

    let animationId: number;
    let scrollPos = 0;
    const speed = 0.3; // Smooth, slow scroll

    const animate = () => {
      scrollPos += speed;
      
      // Reset when we've scrolled through one full set
      if (scrollPos >= (container.scrollHeight / 2)) {
        scrollPos = 0;
      }
      
      container.scrollTop = scrollPos;
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    // Pause on hover
    const handleMouseEnter = () => cancelAnimationFrame(animationId);
    const handleMouseLeave = () => {
      animationId = requestAnimationFrame(animate);
    };

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationId);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [scrollItems]);

  if (scrollItems.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto scrollbar-hide bg-gray-50"
      style={{ scrollBehavior: 'auto' }}
    >
      <div className="flex flex-col gap-3 p-4">
        {scrollItems.map((product, index) => (
          <div
            key={`${product._id}-${index}`}
            className="group relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 flex-shrink-0"
          >
            {/* Image container */}
            <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200">
              <img
                src={product.images?.[0] || '/placeholder.jpg'}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Content overlay */}
            <div className="absolute inset-x-0 bottom-0 p-4 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
              <p className="text-white text-sm font-semibold line-clamp-1 mb-1 drop-shadow-lg">
                {product.name}
              </p>
              <div className="flex items-center gap-2">
                {product.price ? (
                  <span className="text-xs text-white/90">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                ) : (
                  <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">
                    Quote
                  </span>
                )}
                <div className="flex-1" />
                <div className="p-1 bg-white/20 backdrop-blur-sm rounded-full">
                  <Eye className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>

            {/* Category indicator dot */}
            <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${categoryColor.replace('text-', 'bg-')} opacity-0 group-hover:opacity-100 transition-opacity`} />
          </div>
        ))}
      </div>
    </div>
  );
}