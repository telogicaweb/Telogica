import { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { CartContext } from '../context/CartContext';

interface Product {
  _id: string;
  name: string;
  description: string;
  price?: number;
  images: string[];
  category: string;
  isRecommended?: boolean;
}

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, addToQuote } = useContext(CartContext)!;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current product
        const { data: productData } = await api.get(`/api/products/${id}`);
        setProduct(productData);

        // Fetch all products for recommendations
        const { data: allProducts } = await api.get('/api/products');
        
        // Filter recommended products (excluding current one)
        const recommended = allProducts.filter((p: Product) => 
          p.isRecommended && p._id !== id
        ); // Show all recommended products
        
        setRecommendedProducts(recommended);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
    // Reset quantity when id changes
    setQuantity(1);
    // Scroll to top when product changes
    window.scrollTo(0, 0);
  }, [id]);

  if (!product) return <div className="pt-24 text-center">Loading...</div>;

  const handleAction = () => {
    const isTelecom = product.category.toLowerCase() === 'telecom';
    const requiresQuote = !isTelecom || quantity > 3 || !product.price;

    if (requiresQuote) {
      addToQuote(product, quantity);
      alert('Added to Quote List');
    } else {
      addToCart(product, quantity);
      alert('Added to Cart');
    }
  };

  return (
    <div className="container mx-auto p-4 pt-24">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Product Details - Left Side */}
        <div className="lg:w-3/4">
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
                  {product.category.toLowerCase() === 'telecom' && product.price ? (
                    <p className="text-3xl font-bold text-gray-900">₹{product.price.toLocaleString()}</p>
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
                    {(!product.price || product.category.toLowerCase() !== 'telecom' || quantity > 3) ? 'Add to Quote' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Products - Right Side */}
        <div className="lg:w-1/4">
          <div className="sticky top-24">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Recommended</h3>
            <div className="space-y-4 max-h-[calc(100vh-150px)] overflow-y-auto pr-2">
              {recommendedProducts.map((recProduct) => (
                <Link to={`/product/${recProduct._id}`} key={recProduct._id} className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden">
                  <div className="h-32 overflow-hidden">
                    <img 
                      src={recProduct.images[0]} 
                      alt={recProduct.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <h4 className="font-semibold text-gray-800 text-sm truncate">{recProduct.name}</h4>
                    <p className="text-xs text-gray-500 uppercase mt-1">{recProduct.category}</p>
                    <div className="mt-2">
                      {recProduct.category.toLowerCase() === 'telecom' && recProduct.price ? (
                        <span className="text-sm font-bold text-gray-900">₹{recProduct.price.toLocaleString()}</span>
                      ) : (
                        <span className="text-xs font-bold text-blue-600">Price on Request</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
              {recommendedProducts.length === 0 && (
                <p className="text-gray-500 text-sm">No recommendations available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
