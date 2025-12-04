import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
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

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, addToQuote } = useContext(CartContext)!;

  useEffect(() => {
    const fetchProduct = async () => {
      const { data } = await api.get(`/api/products/${id}`);
      setProduct(data);
    };
    fetchProduct();
  }, [id]);

  if (!product) return <div className="pt-24 text-center">Loading...</div>;

  const handleAction = () => {
    if (quantity > 3 || !product.price) {
      addToQuote(product, quantity);
      alert('Added to Quote List');
    } else {
      addToCart(product, quantity);
      alert('Added to Cart');
    }
  };

  return (
    <div className="container mx-auto p-4 pt-24">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2 p-4">
            {product.images.map((img, idx) => (
              <img key={idx} src={img} alt={product.name} className="w-full h-96 object-cover rounded-lg shadow-md mb-4" />
            ))}
          </div>
          <div className="md:w-1/2 p-8">
            <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">{product.category}</div>
            <h1 className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">{product.name}</h1>
            <p className="mt-4 text-lg text-gray-500">{product.description}</p>
            
            <div className="mt-6">
              {product.price ? (
                <p className="text-3xl font-bold text-gray-900">${product.price}</p>
              ) : (
                <p className="text-3xl font-bold text-blue-600">Price on Request</p>
              )}
            </div>
            
            <div className="mt-8 flex items-center gap-4">
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                <input 
                  id="quantity"
                  type="number" 
                  min="1" 
                  value={quantity} 
                  onChange={(e) => setQuantity(parseInt(e.target.value))} 
                  className="mt-1 block w-20 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <button 
                onClick={handleAction} 
                className="mt-6 w-full bg-indigo-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 md:w-auto"
              >
                {quantity > 3 || !product.price ? 'Add to Quote' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
