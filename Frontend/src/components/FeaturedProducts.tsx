import { useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle,
  Satellite,
  Shield,
  Train,
} from 'lucide-react';
import api from '../api';
import { CartContext } from '../context/CartContext';

interface Product {
  _id: string;
  name: string;
  description: string;
  price?: number;
  images: string[];
  category: string;
}

const categoryMeta: Record<
  string,
  {
    label: string;
    color: string;
    gradient: string;
    gradientLight: string;
    icon: JSX.Element;
    description: string;
    details: string[];
    features: string[];
    bgPattern: string;
  }
> = {
  defence: {
    label: 'Defense',
    color: 'text-red-600',
    gradient: 'from-red-600 to-red-500',
    gradientLight: 'from-red-50 to-red-100',
    icon: <Shield className="w-6 h-6" />,
    description:
      'Telogica Ltd has over 22 years of track record in bringing cutting-edge electronic RF components, sub-systems, and technologies to India since 1995.',
    details: [
      'Telogica provides state-of-the-art product technologies with globally approved partner companies.',
      'Associated with reputed companies from the US, UK, France, Germany, and Israel, Telogica supports Ministry of Defense and public sectors with standards-focused product range.',
    ],
    features: ['Ministry of Defense Focus', 'Global Partnerships', 'Standards Support'],
    bgPattern:
      'radial-gradient(circle at 10% 20%, rgba(220, 38, 38, 0.03) 0%, transparent 30%)',
  },
  telecommunication: {
    label: 'Telecommunication',
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-500',
    gradientLight: 'from-blue-50 to-blue-100',
    icon: <Satellite className="w-6 h-6" />,
    description:
      'The telecommunication value chain is rapidly evolving with convergence across information, delivery, and digital infrastructure.',
    details: [
      'Telogica manufactures and supplies test equipment across COPPER, OPTICAL, DIGITAL, and RF domains, including in-house developed instruments.',
      'Qualified applications engineers guide customers in selecting suitable measuring instruments for real-time use and complete one-roof solutions.',
    ],
    features: ['Copper/Optical/Digital/RF', 'In-house Test Equipment', 'Application Engineering Support'],
    bgPattern:
      'radial-gradient(circle at 30% 40%, rgba(37, 99, 235, 0.03) 0%, transparent 40%)',
  },
  railway: {
    label: 'Manufacturing',
    color: 'text-emerald-600',
    gradient: 'from-emerald-600 to-emerald-500',
    gradientLight: 'from-emerald-50 to-emerald-100',
    icon: <Train className="w-6 h-6" />,
    description:
      'Telogica Ltd provides nationwide services to business, industry, and government with innovative technology solutions for telecom and manufacturing needs.',
    details: [
      'With 20+ microprocessor-based products and TEC (DOT) approvals, Telogica has delivered instruments such as OTDR, Power Meter, Laser Source, Variable Attenuator, Talkset, Fiber Identifiers, Cable Fault Locators, 2Mbps Testers, and RF Power Meters.',
      'Telogica also delivers standard and custom DC-DC converters to DRDO labs, including single and multi-output variants with MIL-STD aligned capability.',
    ],
    features: ['TEC (DOT) Approved', 'DRDO Supply Experience', 'MIL-STD Capable'],
    bgPattern:
      'radial-gradient(circle at 70% 60%, rgba(5, 150, 105, 0.03) 0%, transparent 40%)',
  },
};

const categoryOrder = ['defence', 'telecommunication', 'railway'];

interface FeaturedProductsProps {
  focusCategory?: string | null;
  scrollTrigger?: number;
  isVisible?: boolean;
}

const normalizeCategory = (category: string) => {
  const value = category.toLowerCase();
  if (value === 'defense') return 'defence';
  if (value === 'telecom') return 'telecommunication';
  return value;
};

export default function FeaturedProducts({
  focusCategory = null,
  scrollTrigger = 0,
  isVisible = true,
}: FeaturedProductsProps) {
  const [groupedProducts, setGroupedProducts] = useState<Record<string, Product[]>>({});
  const [loading, setLoading] = useState(true);
  const [hasFetchError, setHasFetchError] = useState(false);
  const [activeHover, setActiveHover] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const normalizedFocusCategory = focusCategory ? normalizeCategory(focusCategory) : null;
  const selectedCategory =
    normalizedFocusCategory && categoryOrder.includes(normalizedFocusCategory)
      ? normalizedFocusCategory
      : null;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get('/api/products');
        const sourceProducts = Array.isArray(data) ? data : [];
        const grouped: Record<string, Product[]> = {};

        sourceProducts.forEach((p: Product) => {
          let cat = p.category?.toLowerCase() || 'other';

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
        setHasFetchError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (!selectedCategory || !scrollTrigger) return;

    const section = sectionRefs.current[selectedCategory];
    if (!section) return;

    requestAnimationFrame(() => {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [selectedCategory, scrollTrigger, groupedProducts]);

  if (!isVisible) return null;

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-600">Loading products...</p>
        </div>
      </section>
    );
  }

  if (!selectedCategory) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-600">
            Select an industry from hero to view category products.
          </p>
        </div>
      </section>
    );
  }

  if (hasFetchError) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-600">
            Products are not available right now. Please try again in a moment.
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="bg-gray-50 relative overflow-hidden">
      <CategorySection
        catKey={selectedCategory}
        index={0}
        groupedProducts={groupedProducts}
        activeHover={activeHover}
        setActiveHover={setActiveHover}
        onRef={(el) => (sectionRefs.current[selectedCategory] = el)}
      />
    </div>
  );
}

function CategorySection({
  catKey,
  index,
  groupedProducts,
  activeHover,
  setActiveHover,
  onRef,
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

  return (
    <section
      id={`home-category-${catKey}`}
      ref={onRef}
      className={`relative py-24 overflow-hidden transition-all duration-700 ${
        isEven ? 'bg-white' : 'bg-gray-50'
      }`}
      onMouseEnter={() => setActiveHover(catKey)}
      onMouseLeave={() => setActiveHover(null)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className={`flex flex-col lg:flex-row gap-12 lg:gap-16 items-start ${isEven ? '' : 'lg:flex-row-reverse'}`}>
          <div className="lg:w-[38%] w-full relative">
            <div className="sticky top-24">
              <div className="relative h-[600px] rounded-3xl overflow-hidden shadow-2xl group">
                <VerticalMarquee
                  products={products}
                  showPricingActions={catKey === 'telecommunication'}
                />
              </div>
            </div>
          </div>

          <div className="lg:w-[58%] w-full flex flex-col pt-8">
            <div className="mb-10 transform transition-all duration-700">
              <div className="flex items-center gap-4 mb-6">
                <div>
                  <h2 className="text-4xl md:text-5xl font-bold">
                    <span className="text-gray-900">
                      {meta.label.split('/')[0]}
                    </span>
                  </h2>
                </div>
              </div>

              <p className="text-lg text-gray-600 mb-4 max-w-2xl leading-relaxed">{meta.description}</p>
              <div className="space-y-3 mb-8 max-w-3xl">
                {meta.details.map((line, i) => (
                  <p key={i} className="text-sm text-gray-600 leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>
              <p className="text-sm text-gray-500 mb-8">
                Showing all {meta.label} products on the left panel ({products.length} items).
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                {meta.features.map((feature, i) => (
                  <div
                    key={i}
                    className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700 border border-gray-200 flex items-center gap-2"
                  >
                    <CheckCircle className={`w-4 h-4 ${meta.color}`} />
                    {feature}
                  </div>
                ))}
              </div>

              <Link
                to={`/products?category=${catKey}`}
                className="group inline-flex items-center gap-3 px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                <span>Explore Collection</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function VerticalMarquee({
  products,
  showPricingActions,
}: {
  products: Product[];
  showPricingActions: boolean;
}) {
  const { addToCart } = useContext(CartContext)!;
  const scrollItems = products.length > 0 ? [...products, ...products] : [];

  if (scrollItems.length === 0) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center text-gray-500">
          <p className="font-medium">No products in this category yet</p>
          <p className="text-sm mt-2">Please check again soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="marquee-container h-full overflow-hidden bg-gray-50">
      <div
        className="marquee-track flex flex-col gap-3 p-4 will-change-transform"
        style={{ ['--marquee-duration' as string]: `${Math.max(18, products.length * 4)}s` }}
      >
        {scrollItems.map((product, index) => (
          <div
            key={`${product._id}-${index}`}
            className="group relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 flex-shrink-0 bg-white"
          >
            <Link to={`/product/${product._id}`} className="block">
              <div className="aspect-[4/3] bg-gray-100">
                <img
                  src={product.images?.[0] || '/placeholder.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            </Link>
            <div className="p-3 border-t border-gray-100">
              <Link to={`/product/${product._id}`} className="text-sm font-semibold text-gray-900 hover:underline line-clamp-1 block">
                {product.name}
              </Link>
              {showPricingActions && (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-600">
                    {product.price ? `Rs ${product.price.toLocaleString('en-IN')}` : 'Quote'}
                  </span>
                  <button
                    type="button"
                    onClick={() => addToCart(product, 1)}
                    className="text-xs px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100 text-gray-800"
                  >
                    Add to Cart
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes marqueeY {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(0, -50%, 0); }
        }
        .marquee-track {
          animation: marqueeY var(--marquee-duration) linear infinite;
        }
        .marquee-container:hover .marquee-track {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
