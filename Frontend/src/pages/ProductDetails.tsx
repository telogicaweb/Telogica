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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const { addToCart, addToQuote } = useContext(CartContext)!;
  const { user } = useContext(AuthContext)!;
  const toast = useToast();

  // Apple-style cursor tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

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
        toast.warning(`You can buy maximum ${maxDirectPurchase} Telecommunication products directly. For ${maxDirectPurchase + 1} or more, please request a quote for bulk discount.`);
        return;
      }
    }

    // Enforce quote requirement for quantity >= 3 (non-retailers only)
    if (!isRetailer && quantity >= 3) {
      toast.info('For orders with quantity of 3 or more, please request a quote for better pricing.');
      handleAddToQuote();
      return;
    }

    // Store retailer price preference and show warranty modal
    setPendingRetailerPrice(useRetailerPrice);
    setShowWarrantyModal(true);
  };

  const confirmAddToCart = () => {
    addToCart(product, quantity, pendingRetailerPrice);
    setShowWarrantyModal(false);
    toast.success(`Added to Cart with ${selectedWarranty} warranty`);
  };

  const handleAddToQuote = () => {
    addToQuote(product, quantity);
    toast.success('Added to Quote List');
  };

  const handleShare = async (platform: string) => {
    const productUrl = window.location.href;
    const shareText = `Check out ${product?.name} on Telogica`;
    
    try {
      switch (platform) {
        case 'copy':
          await navigator.clipboard.writeText(productUrl);
          setCopySuccess(true);
          toast.success('Link copied to clipboard!');
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
      toast.error('Failed to share product');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 pt-24 pb-16 relative">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -top-10 -left-24 h-80 w-80 rounded-full bg-indigo-100 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-blue-100 blur-[120px]" />
        </div>
        <div className="relative flex flex-col lg:flex-row gap-6">
        {/* Main Product Details - Left Side */}
        <div className="lg:w-3/4">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/2 p-4">
                <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-white via-slate-50 to-indigo-50 shadow-[0_15px_60px_rgba(79,70,229,0.12)] border border-indigo-50/60 relative group aspect-square backdrop-blur-xl">
                  {selectedImage ? (
                    <>
                      {/* Floating badges */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 text-xs font-semibold text-indigo-700 shadow-sm backdrop-blur">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                          Signature Finish
                        </span>
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 text-[11px] font-medium text-white shadow-sm backdrop-blur">
                          Crafted by Telogica
                        </span>
                      </div>

                      <div
                        className="relative w-full h-full overflow-hidden cursor-zoom-in"
                        onMouseMove={handleMouseMove}
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                        onClick={() => setIsZoomOpen(true)}
                      >
                        {/* Spotlight effect */}
                        <div
                          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                          style={{
                            background: isHovering
                              ? `radial-gradient(circle 220px at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,255,255,0.45) 0%, transparent 70%)`
                              : 'none',
                          }}
                        />
                        
                        {/* Product image with Apple-style transform */}
                        <img
                          src={selectedImage}
                          alt={product.name}
                          className="w-full h-full object-contain transition-all duration-700 ease-out"
                          style={{
                            transform: isHovering
                              ? `scale(1.18) translate(${(mousePosition.x - 50) * 0.16}px, ${(mousePosition.y - 50) * 0.16}px)`
                              : 'scale(1)',
                            transformOrigin: 'center',
                          }}
                        />

                        {/* Bottom info ribbon */}
                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between px-4 py-2 rounded-xl bg-white/70 backdrop-blur-md shadow-md border border-white/60 text-[12px] font-medium text-slate-700">
                          <span>Ultrafine clarity</span>
                          <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                            Hover to explore
                          </span>
                        </div>

                        {/* Elegant border glow */}
                        <div
                          className={`absolute inset-0 rounded-2xl transition-all duration-500 pointer-events-none ${
                            isHovering ? 'ring-2 ring-indigo-400 ring-opacity-60 shadow-2xl shadow-indigo-200/80' : 'ring-1 ring-white/50'
                          }`}
                        />

                        {/* Zoom indicator */}
                        <button
                          onClick={() => setIsZoomOpen(true)}
                          className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm hover:bg-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                          title="Click to zoom"
                        >
                          <ZoomIn className="w-5 h-5 text-gray-700" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
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
              <div className="md:w-1/2 p-6">
                <div className="h-full rounded-2xl bg-white/90 border border-indigo-50 shadow-[0_12px_45px_rgba(15,23,42,0.08)] p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                        {product.category}
                      </div>
                      <h1 className="text-3xl leading-8 font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                        {product.name}
                      </h1>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="px-3 py-1 rounded-full bg-slate-100">Curated release</span>
                        <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700">Premium finish</span>
                        <span className="px-3 py-1 rounded-full bg-white border border-slate-100 shadow-sm">Assured support</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                      title="Share product"
                    >
                      <Share2 className="w-6 h-6 text-gray-600" />
                    </button>
                  </div>
                  <p className="mt-4 text-lg text-gray-600 leading-relaxed">
                    {product.description}
                  </p>

                {/* Warranty Information */}
                {(product.warrantyPeriodMonths || product.extendedWarrantyAvailable) && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-semibold text-blue-900">Warranty Options</h3>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-blue-800">
                            <span className="font-medium">Standard:</span> {product.warrantyPeriodMonths || 12} months (Free)
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
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {product.taxPercentage || 18}% GST
                          </span>
                          <span className="text-xs text-gray-500">+ Taxes</span>
                        </div>
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
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {product.taxPercentage || 18}% GST
                          </span>
                          <span className="text-xs text-gray-500">+ Taxes</span>
                        </div>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                          className="p-2 rounded-md border-2 border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus size={20} className="text-gray-600" />
                        </button>
                        <span className="text-2xl font-bold text-gray-900 w-16 text-center">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(quantity + 1)}
                          className="p-2 rounded-md border-2 border-gray-300 hover:bg-gray-100 transition-colors"
                        >
                          <Plus size={20} className="text-gray-600" />
                        </button>
                      </div>
                      {isTelecom && !isRetailer && maxDirectPurchase !== null && (
                        <p className="mt-2 text-xs text-gray-500">
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
                            toast.warning(`You can buy maximum ${maxDirectPurchase} Telecommunication products directly. For ${maxDirectPurchase + 1} or more, please request a quote for bulk discount.`);
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
      </div>

      {/* Recommended Products - Right Side */}
        <div className="lg:w-1/4">
          <div className="sticky top-24">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Recommended Products</h3>
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
                    </div>
                    <div className="p-3">
                      <h4 className="font-semibold text-gray-800 text-sm truncate">{recProduct.name}</h4>
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

        {/* Luxury assurance row */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white/80 border border-slate-100 shadow-md">
            <p className="text-sm uppercase tracking-[0.15em] text-slate-400 font-semibold">Finish</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">Precision engineered</h3>
            <p className="mt-2 text-sm text-slate-600">Tuned for clarity, efficiency, and timeless durability.</p>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-500 text-white shadow-lg">
            <p className="text-sm uppercase tracking-[0.15em] text-white/70 font-semibold">Care</p>
            <h3 className="mt-2 text-xl font-semibold">White-glove onboarding</h3>
            <p className="mt-2 text-sm text-indigo-50">Concierge support, proactive health checks, and priority replacements.</p>
          </div>
          <div className="p-5 rounded-2xl bg-white/80 border border-slate-100 shadow-md">
            <p className="text-sm uppercase tracking-[0.15em] text-slate-400 font-semibold">Continuity</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">Enterprise ready</h3>
            <p className="mt-2 text-sm text-slate-600">Secure provisioning, audit-friendly logs, and warranty-backed uptime.</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white/90 border border-indigo-50 shadow-md p-4 flex flex-wrap items-center gap-3 text-sm text-slate-700">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            24x7 Priority Support
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 font-semibold text-xs text-slate-700">Secure delivery, tamper-evident seal</span>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm font-semibold text-xs">Hassle-free replacements</span>
        </div>

      {/* Image Zoom Modal */}
      {isZoomOpen && selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsZoomOpen(false)}
        >
          <button
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
            title="Close"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={selectedImage}
            alt={product?.name}
            className="max-w-full max-h-full object-contain cursor-zoom-in"
            onClick={(e) => {
              e.stopPropagation();
              // Allow further zoom on click
            }}
          />
        </div>
      )}

      {/* Warranty Selection Modal */}
      {showWarrantyModal && product && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowWarrantyModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-indigo-600" />
                <h3 className="text-xl font-bold text-gray-900">Select Warranty</h3>
              </div>
              <button
                onClick={() => setShowWarrantyModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Choose your warranty option before adding to cart
            </p>

            <div className="space-y-3 mb-6">
              {/* Standard Warranty */}
              <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-indigo-300 ${
                selectedWarranty === 'standard' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'
              }`}>
                <input
                  type="radio"
                  name="warranty"
                  checked={selectedWarranty === 'standard'}
                  onChange={() => setSelectedWarranty('standard')}
                  className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">Standard Warranty</span>
                    <span className="text-sm font-bold text-green-600">Free</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {product.warrantyPeriodMonths || 12} months coverage
                  </p>
                </div>
              </label>

              {/* Extended Warranty */}
              {product.extendedWarrantyAvailable && (
                <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-indigo-300 ${
                  selectedWarranty === 'extended' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="warranty"
                    checked={selectedWarranty === 'extended'}
                    onChange={() => setSelectedWarranty('extended')}
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">Extended Warranty</span>
                      <span className="text-sm font-bold text-indigo-600">
                        +₹{(product.extendedWarrantyPrice || 0).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {product.extendedWarrantyMonths || 24} months coverage
                    </p>
                    <p className="text-xs text-indigo-600 mt-1 font-medium">
                      Better protection & peace of mind
                    </p>
                  </div>
                </label>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowWarrantyModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmAddToCart()}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Add to Cart
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
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Share2 className="w-6 h-6 text-indigo-600" />
                <h3 className="text-xl font-bold text-gray-900">Share Product</h3>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Share {product?.name} with others
            </p>

            {/* Share Options */}
            <div className="space-y-3">
              {/* Copy Link */}
              <button
                onClick={() => handleShare('copy')}
                className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all"
              >
                {copySuccess ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-600" />
                )}
                <div className="flex-1 text-left">
                  <span className="text-sm font-semibold text-gray-900">
                    {copySuccess ? 'Copied!' : 'Copy Link'}
                  </span>
                  <p className="text-xs text-gray-500">Share via clipboard</p>
                </div>
              </button>

              {/* Social Media Options */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleShare('facebook')}
                  className="flex items-center gap-2 p-3 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all"
                >
                  <Facebook className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">Facebook</span>
                </button>

                <button
                  onClick={() => handleShare('twitter')}
                  className="flex items-center gap-2 p-3 border-2 border-gray-200 rounded-lg hover:border-sky-500 hover:bg-sky-50 transition-all"
                >
                  <Twitter className="w-5 h-5 text-sky-500" />
                  <span className="text-sm font-medium text-gray-900">Twitter</span>
                </button>

                <button
                  onClick={() => handleShare('linkedin')}
                  className="flex items-center gap-2 p-3 border-2 border-gray-200 rounded-lg hover:border-blue-700 hover:bg-blue-50 transition-all"
                >
                  <Linkedin className="w-5 h-5 text-blue-700" />
                  <span className="text-sm font-medium text-gray-900">LinkedIn</span>
                </button>

                <button
                  onClick={() => handleShare('email')}
                  className="flex items-center gap-2 p-3 border-2 border-gray-200 rounded-lg hover:border-gray-600 hover:bg-gray-50 transition-all"
                >
                  <Mail className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Email</span>
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
