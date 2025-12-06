import { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { ShoppingCart, FileText } from 'lucide-react';

const FALLBACK_PRODUCT_IMAGE = 'https://via.placeholder.com/400x300?text=Telogica+Product';

interface RecommendedProductSummary {
  _id: string;
  name: string;
  category: string;
  images: string[];
  price?: number;
  retailerPrice?: number;
  isRecommended?: boolean;
  requiresQuote?: boolean;
  isTelecom?: boolean;
}

interface Product extends RecommendedProductSummary {
  description?: string;
  recommendedProductIds?: Array<string | RecommendedProductSummary>;
  maxDirectPurchaseQty?: number;
}

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProductSummary[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const { addToCart, addToQuote } = useContext(CartContext)!;
  const { user } = useContext(AuthContext)!;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current product
        const { data: productData } = await api.get(`/api/products/${id}`);
        const normalizedProduct: Product = {
          _id: productData._id,
          name: productData.name,
          category: productData.category,
          images: Array.isArray(productData.images) ? productData.images : [],
          price: productData.price,
          retailerPrice: productData.retailerPrice,
          isRecommended: productData.isRecommended,
          requiresQuote: productData.requiresQuote,
          description: productData.description,
          recommendedProductIds: productData.recommendedProductIds,
          isTelecom: productData.isTelecom,
        };

        setProduct(normalizedProduct);
        setActiveImage(normalizedProduct.images[0] ?? null);

        let recommendations: RecommendedProductSummary[] = [];

        if (Array.isArray(productData.recommendedProductIds)) {
          const populated = productData.recommendedProductIds as Array<string | RecommendedProductSummary>;
          recommendations = populated
            .filter((item: string | RecommendedProductSummary): item is RecommendedProductSummary =>
              item !== null && typeof item === 'object' && '_id' in item
            )
            .filter((recommendation: RecommendedProductSummary) => recommendation._id !== normalizedProduct._id)
            .map((recommendation) => ({
              _id: recommendation._id,
              name: recommendation.name,
              category: recommendation.category,
              images: Array.isArray(recommendation.images) ? recommendation.images : [],
              price: recommendation.price,
              retailerPrice: recommendation.retailerPrice,
              isRecommended: recommendation.isRecommended,
              requiresQuote: recommendation.requiresQuote,
            }));
        }

        if (!recommendations.length) {
          const { data: allProducts } = await api.get('/api/products');
          recommendations = allProducts
            .filter((p: Product) => p.isRecommended && p._id !== normalizedProduct._id)
            .map((p: Product) => ({
              _id: p._id,
              name: p.name,
              category: p.category,
              images: Array.isArray(p.images) ? p.images : [],
              price: p.price,
              retailerPrice: p.retailerPrice,
              isRecommended: p.isRecommended,
              requiresQuote: p.requiresQuote,
            }));
        }

        const uniqueRecommendations = recommendations.filter(
          (rec, index, self) => self.findIndex(item => item._id === rec._id) === index
        );

        setRecommendedProducts(uniqueRecommendations);
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
  const isTelecom = product.isTelecom || product.category?.toLowerCase() === 'telecommunication';
  const maxDirectPurchase = product.maxDirectPurchaseQty ?? null;

  const handleAddToCart = (useRetailerPrice: boolean = false) => {
    // Check quantity limits for Telecommunication products (non-retailers)
    if (isTelecom && !isRetailer && maxDirectPurchase !== null) {
      if (quantity > maxDirectPurchase) {
        alert(`You can buy maximum ${maxDirectPurchase} Telecommunication products directly. For ${maxDirectPurchase + 1} or more, please request a quote for bulk discount.`);
        return;
      }
    }
    addToCart(product, quantity, useRetailerPrice);
    alert('Added to Cart');
  };

  const handleAddToQuote = () => {
    addToQuote(product, quantity);
    alert('Added to Quote List');
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
                    // Only show price for Telecommunication products without quote requirement
                    isTelecom && product.price && !product.requiresQuote ? (
                      <div>
                        <p className="text-3xl font-bold text-gray-900">₹{product.price.toLocaleString()}</p>
                        <p className="text-sm text-green-600 mt-1">Available for Direct Purchase</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-3xl font-bold text-blue-600">Request Quote</p>
                        {!isTelecom && (
                          <p className="text-sm text-gray-600 mt-1">Pricing available on quote request</p>
                        )}
                      </div>
                    )
                  )}
                </div>

                <div className="mt-8">
                  <div className="flex items-center gap-4">
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
                      {isTelecom && !isRetailer && maxDirectPurchase !== null && (
                        <p className="mt-1 text-xs text-gray-500">
                          {quantity > maxDirectPurchase 
                            ? `${maxDirectPurchase + 1}+ requires quote` 
                            : `Max ${maxDirectPurchase} for direct purchase`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action buttons based on product type and user role */}
                  {isRetailer && hasRetailerPrice ? (
                    // Retailer with special pricing
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => handleAddToCart(true)}
                        className="flex-1 bg-indigo-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 gap-2"
                      >
                        <ShoppingCart size={18} />
                        Add to Cart
                      </button>
                      <button
                        onClick={handleAddToQuote}
                        className="flex-1 bg-white border border-indigo-600 rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 gap-2"
                      >
                        <FileText size={18} />
                        Request Quote
                      </button>
                    </div>
                  ) : isTelecom && product.price && !product.requiresQuote ? (
                    // Telecommunication products - show both options
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => {
                          if (maxDirectPurchase !== null && quantity > maxDirectPurchase) {
                            alert(`You can buy maximum ${maxDirectPurchase} Telecommunication products directly. For ${maxDirectPurchase + 1} or more, please request a quote for bulk discount.`);
                            return;
                          }
                          handleAddToCart(false);
                        }}
                        disabled={maxDirectPurchase !== null && quantity > maxDirectPurchase}
                        className={`flex-1 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 gap-2 ${
                          maxDirectPurchase !== null && quantity > maxDirectPurchase
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        <ShoppingCart size={18} />
                        Buy Now
                      </button>
                      <button
                        onClick={handleAddToQuote}
                        className="flex-1 bg-white border border-indigo-600 rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 gap-2"
                      >
                        <FileText size={18} />
                        Request Quote
                      </button>
                    </div>
                  ) : (
                    // Non-Telecommunication products - quote only
                    <button
                      onClick={handleAddToQuote}
                      className="mt-6 w-full bg-indigo-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 gap-2"
                    >
                      <FileText size={18} />
                      Request Quote
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Products - Right Side */}
        <div className="lg:w-1/4">
          <div className="sticky top-24">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Suggested Products</h3>
            <div className="space-y-4 max-h-[calc(100vh-150px)] overflow-y-auto pr-2">
              {recommendedProducts.map((recProduct) => {
                const thumbnail = recProduct.images.length ? recProduct.images[0] : FALLBACK_PRODUCT_IMAGE;
                const recIsTelecom = recProduct.isTelecom || recProduct.category?.toLowerCase() === 'telecommunication';
                const canShowPrice = recIsTelecom && typeof recProduct.price === 'number' && !recProduct.requiresQuote;

                return (
                  <Link to={`/product/${recProduct._id}`} key={recProduct._id} className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden">
                    <div className="h-32 overflow-hidden relative">
                      <img
                        src={thumbnail}
                        alt={recProduct.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1 right-1 bg-white/90 text-gray-900 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide shadow">
                        {recProduct.category}
                      </span>
                    </div>
                    <div className="p-3">
                      <h4 className="font-semibold text-gray-800 text-sm truncate">{recProduct.name}</h4>
                      <p className="text-xs text-gray-500 uppercase mt-1">{recProduct.category}</p>
                      <div className="mt-2">
                        {canShowPrice ? (
                          <span className="text-sm font-bold text-gray-900">₹{recProduct.price!.toLocaleString()}</span>
                        ) : (
                          <span className="text-xs font-bold text-blue-600">Price on Request</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
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
