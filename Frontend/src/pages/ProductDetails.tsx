import { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { ShoppingCart, FileText } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  description: string;
  price?: number;
  retailerPrice?: number;
  images: string[];
  category: string;
  isRecommended?: boolean;
  requiresQuote?: boolean;
}

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const { addToCart, addToQuote } = useContext(CartContext)!;
  const { user } = useContext(AuthContext)!;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current product
        const { data: productData } = await api.get(`/api/products/${id}`);
        setProduct(productData);
        setActiveImage(productData.images?.[0] ?? null);

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

  const displayedImages = product.images?.slice(0, 4) ?? [];
  const selectedImage = activeImage || displayedImages[0] || '';

  const isRetailer = user?.role === 'retailer';
  const hasRetailerPrice = isRetailer && product.retailerPrice;
  const isTelecom = product.category?.toLowerCase() === 'telecom';

  const handleAddToCart = (useRetailerPrice: boolean = false) => {
    addToCart(product, quantity, useRetailerPrice);
    alert('Added to Cart');
  };

  const handleAddToQuote = () => {
    addToQuote(product, quantity);
    alert('Added to Quote List');
  };

  const handleAction = () => {
    // For retailers with retailer price, add to cart with retailer price
    if (hasRetailerPrice) {
      handleAddToCart(true);
      return;
    }
    
    // For regular users
    const requiresQuote = !isTelecom || quantity > 3 || !product.price || product.requiresQuote;

    if (requiresQuote) {
      handleAddToQuote();
    } else {
      handleAddToCart(false);
    }
  };

  const getActionButtonText = () => {
    if (hasRetailerPrice) {
      return 'Add to Cart';
    }
    if (!product.price || !isTelecom || quantity > 3 || product.requiresQuote) {
      return 'Add to Quote';
    }
    return 'Add to Cart';
  };

  return (
    <div className="container mx-auto p-4 pt-24">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Product Details - Left Side */}
        <div className="lg:w-3/4">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/2 p-4">
                <div className="rounded-lg overflow-hidden bg-gray-100 shadow">
                  {selectedImage ? (
                    <img
                      src={selectedImage}
                      alt={product.name}
                      className="w-full h-96 object-contain"
                    />
                  ) : (
                    <div className="flex h-96 items-center justify-center text-gray-400">
                      <span>No image available</span>
                    </div>
                  )}
                </div>
                {displayedImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {displayedImages.map((img, idx) => {
                      const isActiveThumbnail = activeImage
                        ? activeImage === img
                        : displayedImages[0] === img;
                      return (
                        <button
                          key={`${img}-${idx}`}
                          type="button"
                          onClick={() => setActiveImage(img)}
                          className={`h-20 overflow-hidden rounded-lg border transition focus:outline-none ${isActiveThumbnail ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'}`}
                        >
                          <img
                            src={img}
                            alt={`${product.name} thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="md:w-1/2 p-8">
                <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">{product.category}</div>
                <h1 className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">{product.name}</h1>
                <p className="mt-4 text-lg text-gray-500">{product.description}</p>
                
                <div className="mt-6">
                  {isRetailer ? (
                    // Retailer pricing display
                    hasRetailerPrice ? (
                      <div>
                        <p className="text-3xl font-bold text-green-600">₹{product.retailerPrice?.toLocaleString()}</p>
                        <p className="text-sm text-green-600 mt-1">Special Retailer Price</p>
                        {product.price && (
                          <p className="text-sm text-gray-400 line-through">Regular: ₹{product.price.toLocaleString()}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-3xl font-bold text-blue-600">Request Quote for Pricing</p>
                    )
                  ) : (
                    // Regular user pricing display
                    isTelecom && product.price && !product.requiresQuote ? (
                      <p className="text-3xl font-bold text-gray-900">₹{product.price.toLocaleString()}</p>
                    ) : (
                      <p className="text-3xl font-bold text-blue-600">Price on Request</p>
                    )
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
                      onChange={(e) => {
                        const parsed = parseInt(e.target.value);
                        setQuantity(isNaN(parsed) || parsed < 1 ? 1 : parsed);
                      }} 
                      className="mt-1 block w-20 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <button 
                    onClick={handleAction} 
                    className="mt-6 w-full bg-indigo-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 md:w-auto gap-2"
                  >
                    {getActionButtonText() === 'Add to Cart' ? <ShoppingCart size={18} /> : <FileText size={18} />}
                    {getActionButtonText()}
                  </button>
                </div>

                {/* Additional options for retailers */}
                {isRetailer && hasRetailerPrice && (
                  <div className="mt-4">
                    <button 
                      onClick={handleAddToQuote} 
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <FileText size={14} />
                      Need bulk order? Request a quote instead
                    </button>
                  </div>
                )}
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
                      {isRetailer && recProduct.retailerPrice ? (
                        <span className="text-sm font-bold text-green-600">₹{recProduct.retailerPrice.toLocaleString()}</span>
                      ) : recProduct.category?.toLowerCase() === 'telecom' && recProduct.price ? (
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
