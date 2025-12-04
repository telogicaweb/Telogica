import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import Hero from '../components/Hero';
import Footer from '../components/Footer';

interface Product {
  _id: string;
  name: string;
  description: string;
  price?: number;
  images: string[];
  isRecommended: boolean;
  category: string;
}

const Home = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const { addToCart, addToQuote } = useContext(CartContext)!;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/products');
        setProducts(data);
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
    ? products
    : products.filter(p => p.category === activeCategory);

  const categories = [
    { value: 'all', label: 'ALL' },
    { value: 'telecom', label: 'TELECOM' },
    { value: 'defence', label: 'DEFENCE' },
    { value: 'railway', label: 'RAILWAY' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <Hero />
      
      <section id="products" className="py-20">
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
                onClick={() => setActiveCategory(category.value)}
                className={`px-8 py-3 rounded font-semibold transition-all ${
                  activeCategory === category.value
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.map(product => (
              <div key={product._id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow group flex flex-col">
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={product.images[0] || 'https://via.placeholder.com/300'} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                </div>
                <div className="p-6 flex-grow flex flex-col">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                  <p className="text-gray-600 mb-4 flex-grow">{product.description.substring(0, 100)}...</p>
                  
                  <div className="mt-auto">
                    {product.price ? (
                      <p className="text-lg font-bold mb-4 text-gray-900">${product.price}</p>
                    ) : (
                      <p className="text-lg font-bold mb-4 text-blue-600">Price on Request</p>
                    )}
                    
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        {product.price && (
                          <button 
                            onClick={() => handleAddToCart(product)} 
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            Add to Cart
                          </button>
                        )}
                        <button 
                          onClick={() => handleAddToQuote(product)} 
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Quote
                        </button>
                      </div>
                      <Link 
                        to={`/product/${product._id}`} 
                        className="block text-center bg-gray-100 text-gray-800 px-4 py-2 rounded hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Home;
