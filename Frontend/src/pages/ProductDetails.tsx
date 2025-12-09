import { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ShoppingCart, FileText, ZoomIn, X, Plus, Minus, Shield, Share2, Check, Copy, Facebook, Twitter, Linkedin, Mail } from 'lucide-react';

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
  taxPercentage?: number;
}

interface Product extends RecommendedProductSummary {
  description?: string;
  recommendedProductIds?: Array<string | RecommendedProductSummary>;
  maxDirectPurchaseQty?: number;
  warrantyPeriodMonths?: number;
  extendedWarrantyAvailable?: boolean;
  extendedWarrantyMonths?: number;
  extendedWarrantyPrice?: number;
}

const ProductDetails = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProductSummary[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [showWarrantyModal, setShowWarrantyModal] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState<'standard' | 'extended'>('standard');
  const [pendingRetailerPrice, setPendingRetailerPrice] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const { addToCart, addToQuote } = useContext(CartContext)!;
  const { user } = useContext(AuthContext)!;
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
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
        toast.error('Failed to load product details');
      }
    };

    fetchData();
    setQuantity(1);
    window.scrollTo(0, 0);
  }, [id]);

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  const displayedImages = product.images?.slice(0, 4) ?? [];
  const selectedImage = activeImage || displayedImages[0] || '';
  const isRetailer = user?.role === 'retailer';
  const hasRetailerPrice = isRetailer && product.retailerPrice;
  const isTelecom = product.isTelecom || product.category?.toLowerCase() === 'telecommunication';
  const maxDirectPurchase = product.maxDirectPurchaseQty ?? null;

  const handleAddToCart = (useRetailerPrice: boolean = false) => {
    if (isTelecom && !isRetailer && maxDirectPurchase !== null && quantity > maxDirectPurchase) {
      toast.warning(`Maximum ${maxDirectPurchase} units for direct purchase. For larger quantities, request a quote for bulk pricing.`);
      return;
    }

    if (!isRetailer && quantity >= 3) {
      toast.info('For orders of 3+ units, request a quote for volume pricing.');
      handleAddToQuote();
      return;
    }

    setPendingRetailerPrice(useRetailerPrice);
    setShowWarrantyModal(true);
  };

  const confirmAddToCart = () => {
    addToCart(product, quantity, pendingRetailerPrice);
    setShowWarrantyModal(false);
    toast.success(`Added to cart with ${selectedWarranty} warranty`);
  };

  const handleAddToQuote = () => {
    addToQuote(product, quantity);
    toast.success('Added to quote request');
  };

  const handleShare = async (platform: string) => {
    const productUrl = window.location.href;
    const shareText = `Check out ${product.name} - Telogica`;
    
    try {
      switch (platform) {
        case 'copy':
          await navigator.clipboard.writeText(productUrl);
          setCopySuccess(true);
          toast.success('Link copied');
          setTimeout(() => setCopySuccess(false), 2000);
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`, '_blank');
          break;
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
          break;
        case 'linkedin':
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(productUrl)}`, '_blank');
          break;
        case 'email':
          window.location.href = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(productUrl)}`;
          break;
      }
    } catch (error) {
      toast.error('Failed to share');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Product Section - 3/4 width */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Product Images */}
                <div className="p-4">
                  <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-100 bg-white shadow-sm group">
                    {selectedImage ? (
                      <>
                        <div 
                          className="w-full h-full cursor-zoom-in" 
                          onClick={() => setIsZoomOpen(true)}
                        >
                          <img
                            src={selectedImage}
                            alt={product.name}
                            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                          />
                          <button
                            onClick={() => setIsZoomOpen(true)}
                            className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:scale-105"
                            title="Zoom image"
                          >
                            <ZoomIn className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        No image available
                      </div>
                    )}
                  </div>
                  
                  {displayedImages.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {displayedImages.map((img, idx) => {
                        const isActive = activeImage ? activeImage === img : idx === 0;
                        return (
                          <button
                            key={`${img}-${idx}`}
                            onClick={() => setActiveImage(img)}
                            className={`h-20 rounded-lg border transition-all ${isActive ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-gray-300'}`}
                          >
                            <img
                              src={img}
                              alt={`Thumbnail ${idx + 1}`}
                              className="w-full h-full object-cover rounded"
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-6 border-l border-gray-100">
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 rounded-full uppercase tracking-wide">
                      {product.category}
                    </span>
                    <div className="flex items-start justify-between mt-2">
                      <h1 className="text-2xl font-bold text-gray-900 pr-4">{product.name}</h1>
                      <button
                        onClick={() => setShowShareModal(true)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
                        title="Share"
                      >
                        <Share2 className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2.5 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">Premium</span>
                      <span className="px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 rounded-full">Certified</span>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-6">{product.description}</p>

                  {/* Warranty Info */}
                  {(product.warrantyPeriodMonths || product.extendedWarrantyAvailable) && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                        <div>
                          <h3 className="text-sm font-semibold text-blue-900 mb-1">Warranty Options</h3>
                          <div className="space-y-1">
                            <p className="text-sm text-blue-800">
                              <span className="font-medium">Standard:</span> {product.warrantyPeriodMonths || 12} months (included)
                            </p>
                            {product.extendedWarrantyAvailable && (
                              <p className="text-sm text-blue-800">
                                <span className="font-medium">Extended:</span> {product.extendedWarrantyMonths || 24} months
                                {product.extendedWarrantyPrice && (
                                  <span className="font-semibold"> (+₹{product.extendedWarrantyPrice.toLocaleString()})</span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="mb-6">
                    {isRetailer ? (
                      hasRetailerPrice ? (
                        <div>
                          <p className="text-3xl font-bold text-green-700">₹{product.retailerPrice?.toLocaleString()}</p>
                          <p className="text-sm text-green-600">Retailer Price</p>
                          {product.price && (
                            <p className="text-sm text-gray-400 line-through">Standard: ₹{product.price.toLocaleString()}</p>
                          )}
                          <div className="mt-1 flex items-center gap-2">
                            <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800 rounded">
                              {product.taxPercentage || 18}% GST
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xl font-bold text-blue-600">Request Quote</p>
                      )
                    ) : (
                      isTelecom && product.price && !product.requiresQuote ? (
                        <div>
                          <p className="text-3xl font-bold text-gray-900">₹{product.price.toLocaleString()}</p>
                          <p className="text-sm text-green-600">Direct Purchase Available</p>
                          <div className="mt-1">
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                              {product.taxPercentage || 18}% GST applicable
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xl font-bold text-blue-600">Request Quote</p>
                          {!isTelecom && (
                            <p className="text-sm text-gray-600">Custom pricing available</p>
                          )}
                        </div>
                      )
                    )}
                  </div>

                  {/* Quantity & Actions */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                      <div className="flex items-center gap-3 w-fit">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-xl font-bold text-gray-900 w-12 text-center">{quantity}</span>
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      {isTelecom && !isRetailer && maxDirectPurchase !== null && (
                        <p className="mt-1 text-xs text-gray-500">
                          {quantity > maxDirectPurchase 
                            ? `Quote required for ${maxDirectPurchase + 1}+ units` 
                            : `Max ${maxDirectPurchase} for direct purchase`}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      {isRetailer && hasRetailerPrice ? (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAddToCart(true)}
                            className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <ShoppingCart className="w-5 h-5" />
                            Add to Cart
                          </button>
                          <button
                            onClick={handleAddToQuote}
                            className="flex-1 border border-indigo-600 text-indigo-600 py-3 rounded-lg font-medium hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                          >
                            <FileText className="w-5 h-5" />
                            Request Quote
                          </button>
                        </div>
                      ) : isTelecom && product.price && !product.requiresQuote ? (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAddToCart(false)}
                            disabled={maxDirectPurchase !== null && quantity > maxDirectPurchase}
                            className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                              maxDirectPurchase !== null && quantity > maxDirectPurchase
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                          >
                            <ShoppingCart className="w-5 h-5" />
                            Add to Cart
                          </button>
                          <button
                            onClick={handleAddToQuote}
                            className="flex-1 border border-indigo-600 text-indigo-600 py-3 rounded-lg font-medium hover:bg-indigo-50 flex items-center justify-center gap-2"
                          >
                            <FileText className="w-5 h-5" />
                            Get Quote
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleAddToQuote}
                          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <FileText className="w-5 h-5" />
                          Request Quote
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Products Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recommended Products</h3>
              <div className="space-y-4 max-h-[calc(100vh-150px)] overflow-y-auto pr-2">
                {recommendedProducts.map((recProduct) => {
                  const thumbnail = recProduct.images[0] || FALLBACK_PRODUCT_IMAGE;
                  const recIsTelecom = recProduct.isTelecom || recProduct.category?.toLowerCase() === 'telecommunication';
                  const canShowPrice = recIsTelecom && recProduct.price && !recProduct.requiresQuote;

                  return (
                    <Link 
                      to={`/product/${recProduct._id}`} 
                      key={recProduct._id}
                      className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden border border-gray-100"
                    >
                      <div className="h-32 overflow-hidden">
                        <img
                          src={thumbnail}
                          alt={recProduct.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium text-gray-800 text-sm line-clamp-2 h-10">{recProduct.name}</h4>
                        <div className="mt-2">
                          {canShowPrice ? (
                            <span className="text-sm font-bold text-gray-900">₹{recProduct.price!.toLocaleString()}</span>
                          ) : (
                            <span className="text-xs font-semibold text-blue-600">Quote Required</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
                {recommendedProducts.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No recommendations available</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Image Zoom Modal */}
        {isZoomOpen && selectedImage && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setIsZoomOpen(false)}
          >
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <img
              src={selectedImage}
              alt={product.name}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Warranty Modal */}
        {showWarrantyModal && (
          <div 
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowWarrantyModal(false)}
          >
            <div 
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-gray-900">Select Warranty</h3>
                </div>
                <button
                  onClick={() => setShowWarrantyModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-3 mb-6">
                <label className={`flex items-start p-4 border rounded-lg cursor-pointer ${
                  selectedWarranty === 'standard' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="warranty"
                    checked={selectedWarranty === 'standard'}
                    onChange={() => setSelectedWarranty('standard')}
                    className="mt-1"
                  />
                  <div className="ml-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900">Standard Warranty</span>
                      <span className="font-semibold text-green-600">Free</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {product.warrantyPeriodMonths || 12} months coverage
                    </p>
                  </div>
                </label>

                {product.extendedWarrantyAvailable && (
                  <label className={`flex items-start p-4 border rounded-lg cursor-pointer ${
                    selectedWarranty === 'extended' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="warranty"
                      checked={selectedWarranty === 'extended'}
                      onChange={() => setSelectedWarranty('extended')}
                      className="mt-1"
                    />
                    <div className="ml-3">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-900">Extended Warranty</span>
                        <span className="font-semibold text-indigo-600">
                          +₹{(product.extendedWarrantyPrice || 0).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {product.extendedWarrantyMonths || 24} months coverage
                      </p>
                    </div>
                  </label>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowWarrantyModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAddToCart}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div 
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowShareModal(false)}
          >
            <div 
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-gray-900">Share Product</h3>
                </div>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleShare('copy')}
                  className="w-full flex items-center gap-3 p-3 border rounded-lg hover:border-indigo-300 hover:bg-indigo-50"
                >
                  {copySuccess ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-600" />
                  )}
                  <span className="font-medium">
                    {copySuccess ? 'Copied to clipboard' : 'Copy link'}
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleShare('facebook')}
                    className="flex items-center gap-2 p-3 border rounded-lg hover:border-blue-600 hover:bg-blue-50"
                  >
                    <Facebook className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Facebook</span>
                  </button>

                  <button
                    onClick={() => handleShare('twitter')}
                    className="flex items-center gap-2 p-3 border rounded-lg hover:border-sky-500 hover:bg-sky-50"
                  >
                    <Twitter className="w-5 h-5 text-sky-500" />
                    <span className="font-medium">Twitter</span>
                  </button>

                  <button
                    onClick={() => handleShare('linkedin')}
                    className="flex items-center gap-2 p-3 border rounded-lg hover:border-blue-700 hover:bg-blue-50"
                  >
                    <Linkedin className="w-5 h-5 text-blue-700" />
                    <span className="font-medium">LinkedIn</span>
                  </button>

                  <button
                    onClick={() => handleShare('email')}
                    className="flex items-center gap-2 p-3 border rounded-lg hover:border-gray-600 hover:bg-gray-50"
                  >
                    <Mail className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">Email</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;