import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const products = [
  {
    id: 1,
    name: '5G Network Infrastructure',
    category: 'telecommunication',
    image: 'https://images.pexels.com/photos/4458420/pexels-photo-4458420.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'Next-generation telecommunications infrastructure',
  },
  {
    id: 2,
    name: 'Fiber Optic Solutions',
    category: 'telecommunication',
    image: 'https://images.pexels.com/photos/4508751/pexels-photo-4508751.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'High-speed fiber optic network systems',
  },
  {
    id: 3,
    name: 'Tactical Communication Systems',
    category: 'defence',
    image: 'https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'Secure military-grade communication',
  },
  {
    id: 4,
    name: 'Surveillance & Monitoring',
    category: 'defence',
    image: 'https://images.pexels.com/photos/430208/pexels-photo-430208.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'Advanced security and surveillance systems',
  },
  {
    id: 5,
    name: 'Railway Signaling Systems',
    category: 'railway',
    image: 'https://images.pexels.com/photos/1484800/pexels-photo-1484800.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'Modern railway signaling technology',
  },
  {
    id: 6,
    name: 'Train Control & Management',
    category: 'railway',
    image: 'https://images.pexels.com/photos/3779786/pexels-photo-3779786.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'Integrated train control systems',
  },
  {
    id: 7,
    name: 'Satellite Communication',
    category: 'telecommunication',
    image: 'https://images.pexels.com/photos/586056/pexels-photo-586056.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'Global satellite communication solutions',
  },
  {
    id: 8,
    name: 'Cybersecurity Solutions',
    category: 'defence',
    image: 'https://images.pexels.com/photos/5380664/pexels-photo-5380664.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'Enterprise-grade cybersecurity systems',
  },
];

type Category = 'all' | 'telecommunication' | 'defence' | 'railway';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<Category>('all');

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      // Normalize to lowercase to match category types
      let normalizedCategory = categoryParam.toLowerCase();

      // Handle spelling variations
      if (normalizedCategory === 'defense') {
        normalizedCategory = 'defence';
      }
      if (normalizedCategory === 'telecom') {
        normalizedCategory = 'telecommunication';
      }

      if (['telecommunication', 'defence', 'railway'].includes(normalizedCategory)) {
        setActiveCategory(normalizedCategory as Category);
      }
    }
  }, [searchParams]);

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory);

  const categories: { value: Category; label: string }[] = [
    { value: 'all', label: 'ALL' },
    { value: 'telecommunication', label: 'TELECOMMUNICATION' },
    { value: 'defence', label: 'DEFENCE' },
    { value: 'railway', label: 'RAILWAY' },
  ];

  return (
    <section id="products" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
          Our Products
        </h2>
        <p className="text-center text-gray-600 mb-12 text-lg">
          Innovative solutions across multiple industries
        </p>

        <div className="flex justify-center gap-4 mb-12 flex-wrap">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                if (category.value === 'all') {
                  newParams.delete('category');
                } else {
                  newParams.set('category', category.value);
                }
                setSearchParams(newParams);
              }}
              className={`px-8 py-3 rounded font-semibold transition-all ${activeCategory === category.value
                ? 'bg-gray-900 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow group"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h3>
                <p className="text-gray-600 mb-4">{product.description}</p>
                <button className="text-gray-900 font-semibold hover:underline">
                  Learn More →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
