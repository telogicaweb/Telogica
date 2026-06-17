import { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ShoppingCart, FileText, ZoomIn, X, Plus, Minus, Shield, Share2, Check, Copy, Facebook, Twitter, Linkedin, Mail, Download, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';

const FALLBACK_PRODUCT_IMAGE = 'https://via.placeholder.com/400x300?text=Telogica+Product';

interface RecommendedProductSummary {
  _id: string;
  name: string;
  category: string;
  subcategory?: string;
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
  brochureUrl?: string;
}

const renderDescription = (desc?: string) => {
  if (!desc) return null;
  const lines = desc.split('\n');
  return (
    <div className="text-[13px] text-gray-600 leading-relaxed mb-5 space-y-1.5 whitespace-pre-line">
      {lines.map((line, lineIdx) => {
        if (line.includes('•')) {
          const parts = line.split('•').map(p => p.trim());
          const firstPart = parts[0];
          const bulletItems = parts.slice(1);
          return (
            <div key={lineIdx} className="space-y-1">
              {firstPart && <p className="text-gray-800">{firstPart}</p>}
              <ul className="list-disc pl-5 space-y-1">
                {bulletItems.map((item, itemIdx) => (
                  item ? <li key={itemIdx} className="text-gray-600">{item}</li> : null
                ))}
              </ul>
            </div>
          );
        }
        return <p key={lineIdx}>{line}</p>;
      })}
    </div>
  );
};

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
  const [isPlaying, setIsPlaying] = useState(true);
  const thumbnailRef = useRef<HTMLDivElement>(null);
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
          subcategory: productData.subcategory,
          images: Array.isArray(productData.images) ? productData.images : [],
          price: productData.price,
          retailerPrice: productData.retailerPrice,
          isRecommended: productData.isRecommended,
          requiresQuote: productData.requiresQuote,
          description: productData.description,
          recommendedProductIds: productData.recommendedProductIds,
          isTelecom: productData.isTelecom,
          brochureUrl: productData.brochureUrl,
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

  const allImages = product?.images ?? [];
  const selectedImage = activeImage || allImages[0] || '';
  const activeIndex = allImages.indexOf(selectedImage);

  // Auto-play slideshow
  useEffect(() => {
    if (!isPlaying || allImages.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImage(prev => {
        const currentIdx = prev ? allImages.indexOf(prev) : 0;
        const nextIdx = (currentIdx + 1) % allImages.length;
        return allImages[nextIdx];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [isPlaying, allImages]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (isZoomOpen) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  }, [isZoomOpen]);

  useEffect(() => {
    if (thumbnailRef.current && activeIndex >= 0) {
      const btn = thumbnailRef.current.children[activeIndex] as HTMLElement;
      if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeIndex]);

  const goToPrev = useCallback(() => {
    const idx = activeIndex <= 0 ? allImages.length - 1 : activeIndex - 1;
    setActiveImage(allImages[idx]);
  }, [activeIndex, allImages]);

  const goToNext = useCallback(() => {
    const idx = (activeIndex + 1) % allImages.length;
    setActiveImage(allImages[idx]);
  }, [activeIndex, allImages]);

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-2 border-gray-200 border-t-gray-900 rounded-full mx-auto"></div>
          <p className="mt-3 text-sm text-gray-500">Loading product details...</p>
        </div>
      </div>
    );
  }

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

  const isDefence = product.category?.toLowerCase() === 'defence';

  const handleDownloadDatasheet = async () => {
    if (!product.brochureUrl) {
      toast.error('Datasheet not available for this product');
      return;
    }
    
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      window.open(product.brochureUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    newWindow.document.write('<p style="font-family: sans-serif; text-align: center; margin-top: 50px; color: #4b5563;">Loading datasheet...</p>');
    
    try {
      const response = await fetch(product.brochureUrl);
      if (!response.ok) throw new Error('Failed to fetch file');
      const blob = await response.blob();
      const newBlob = new Blob([blob], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(newBlob);
      newWindow.location.href = blobUrl;
    } catch (error) {
      console.error('Failed to preview datasheet:', error);
      newWindow.close();
      window.open(product.brochureUrl, '_blank', 'noopener,noreferrer');
    }
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
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Breadcrumb */}
      <div className="bg-gray-900 pt-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex items-center gap-2 text-xs">
            <Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link>
            <span className="text-gray-600">/</span>
            <Link to="/products" className="text-gray-400 hover:text-white transition-colors">Products</Link>
            <span className="text-gray-600">/</span>
            <span className="text-white font-medium truncate max-w-[300px]">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Product Section */}
          <div className="lg:col-span-9">
            <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Product Images */}
                <div className="md:w-[40%] shrink-0 p-5 bg-white">
                  <div className="relative aspect-[4/3] overflow-hidden border border-gray-100 bg-white group">
                    {selectedImage ? (
                      <>
                        <div 
                          className="w-full h-full cursor-zoom-in" 
                          onClick={() => setIsZoomOpen(true)}
                        >
                          <img
                            src={selectedImage}
                            alt={product.name}
                            className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105 product-image-enhance"
                          />
                          <button
                            onClick={(e) => { e.stopPropagation(); setIsZoomOpen(true); }}
                            className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Zoom image"
                          >
                            <ZoomIn className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>
                        {/* Nav arrows */}
                        {allImages.length > 1 && (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); goToPrev(); }} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
                              <ChevronLeft className="w-4 h-4 text-gray-700" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); goToNext(); }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
                              <ChevronRight className="w-4 h-4 text-gray-700" />
                            </button>
                          </>
                        )}
                        {/* Image counter */}
                        {allImages.length > 1 && (
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 backdrop-blur-sm">
                            {activeIndex + 1} / {allImages.length}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400 text-sm">
                        No image available
                      </div>
                    )}
                  </div>
                  
                  {/* Thumbnail strip + player controls */}
                  {allImages.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2">
                        {/* Play/Pause */}
                        {allImages.length > 1 && (
                          <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="shrink-0 p-1.5 border border-gray-200 hover:bg-gray-50 transition-colors"
                            title={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
                          >
                            {isPlaying ? <Pause className="w-3.5 h-3.5 text-gray-600" /> : <Play className="w-3.5 h-3.5 text-gray-600" />}
                          </button>
                        )}
                        {/* Scrollable thumbnails */}
                        <div ref={thumbnailRef} className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                          {allImages.map((img, idx) => {
                            const isActive = selectedImage === img;
                            return (
                              <button
                                key={`${img}-${idx}`}
                                onClick={() => setActiveImage(img)}
                                className={`shrink-0 h-14 w-14 border-2 transition-all overflow-hidden ${isActive ? 'border-gray-900' : 'border-gray-200 hover:border-gray-400'}`}
                              >
                                <img
                                  src={img}
                                  alt={`Thumbnail ${idx + 1}`}
                                  className="w-full h-full object-cover product-image-enhance"
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {/* Progress dots */}
                      {allImages.length > 1 && (
                        <div className="flex justify-center gap-1 mt-2">
                          {allImages.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setActiveImage(allImages[idx])}
                              className={`h-1 transition-all duration-300 ${idx === activeIndex ? 'w-4 bg-gray-900' : 'w-1 bg-gray-300 hover:bg-gray-400'}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 p-6 border-l border-gray-100 flex flex-col">
                  {/* Category badges */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gray-900 text-white">
                      {product.category}
                    </span>
                    {product.subcategory && (
                      <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white">
                        {product.subcategory}
                      </span>
                    )}
                  </div>

                  {/* Title + Share */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h1 className="text-xl font-bold text-gray-900 leading-tight">{product.name}</h1>
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="p-2 hover:bg-gray-100 transition-colors shrink-0"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600 uppercase tracking-wider">Premium</span>
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 uppercase tracking-wider">Certified</span>
                  </div>

                  <div className="flex-grow">
                    {/* Description */}
                    {renderDescription(product.description)}

                    {/* Warranty Info */}
                    {(product.warrantyPeriodMonths || product.extendedWarrantyAvailable) && (
                      <div className="mb-5 p-3.5 bg-blue-50/80 border border-blue-100">
                        <div className="flex items-start gap-2.5">
                          <Shield className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                          <div>
                            <h3 className="text-xs font-bold text-blue-900 mb-1 uppercase tracking-wide">Warranty</h3>
                            <div className="space-y-0.5">
                              <p className="text-xs text-blue-800">
                                <span className="font-semibold">Standard:</span> {product.warrantyPeriodMonths || 12} months (included)
                              </p>
                              {product.extendedWarrantyAvailable && (
                                <p className="text-xs text-blue-800">
                                  <span className="font-semibold">Extended:</span> {product.extendedWarrantyMonths || 24} months
                                  {product.extendedWarrantyPrice && (
                                    <span className="font-bold"> (+₹{product.extendedWarrantyPrice.toLocaleString()})</span>
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pricing */}
                    {!isDefence && (
                      <div className="mb-5 pb-5 border-b border-gray-100">
                      {isRetailer ? (
                        hasRetailerPrice ? (
                          <div>
                            <div className="flex items-baseline gap-2">
                              <p className="text-2xl font-bold text-gray-900">₹{product.retailerPrice?.toLocaleString()}</p>
                              <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5">Retailer Price</span>
                            </div>
                            {product.price && (
                              <p className="text-sm text-gray-400 line-through mt-0.5">₹{product.price.toLocaleString()}</p>
                            )}
                            <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600">
                              {product.taxPercentage || 18}% GST
                            </span>
                          </div>
                        ) : (
                          <p className="text-xl font-bold text-gray-900">Request Quote</p>
                        )
                      ) : (
                        isTelecom && product.price && !product.requiresQuote ? (
                          <div>
                            <p className="text-2xl font-bold text-gray-900">₹{product.price.toLocaleString()}</p>
                            <p className="text-xs text-green-600 font-medium mt-0.5">Direct Purchase Available</p>
                            <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600">
                              {product.taxPercentage || 18}% GST applicable
                            </span>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xl font-bold text-gray-900">Request Quote</p>
                            {!isTelecom && (
                              <p className="text-xs text-gray-500 mt-0.5">Custom pricing available</p>
                            )}
                          </div>
                        )
                      )}
                    </div>
                    )}
                  </div>

                  {/* Quantity & Actions */}
                  <div className="space-y-4">
                    {!isDefence && (
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Quantity</label>
                        <div className="flex items-center gap-0 w-fit border border-gray-200">
                          <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            disabled={quantity <= 1}
                            className="p-2.5 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed border-r border-gray-200 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-sm font-bold text-gray-900 w-12 text-center">{quantity}</span>
                          <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="p-2.5 hover:bg-gray-50 border-l border-gray-200 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {isTelecom && !isRetailer && maxDirectPurchase !== null && (
                          <p className="mt-1.5 text-[11px] text-gray-500">
                            {quantity > maxDirectPurchase 
                              ? `Quote required for ${maxDirectPurchase + 1}+ units` 
                              : `Max ${maxDirectPurchase} for direct purchase`}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {isDefence ? (
                        <button
                          onClick={handleDownloadDatasheet}
                          disabled={!product.brochureUrl}
                          className={`w-full py-3 font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                            product.brochureUrl
                              ? 'bg-gray-900 text-white hover:bg-gray-800'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                          title={product.brochureUrl ? 'Download product datasheet (PDF)' : 'Datasheet not uploaded yet'}
                        >
                          <Download className="w-4 h-4" />
                          {product.brochureUrl ? 'Download Datasheet' : 'Datasheet Unavailable'}
                        </button>
                      ) : isRetailer && hasRetailerPrice ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAddToCart(true)}
                              className="flex-1 bg-gray-900 text-white py-3 font-semibold text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                            >
                              <ShoppingCart className="w-4 h-4" />
                              Add to Cart
                            </button>
                            <button
                              onClick={handleAddToQuote}
                              className="flex-1 border-2 border-gray-900 text-gray-900 py-3 font-semibold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                            >
                              <FileText className="w-4 h-4" />
                              Request Quote
                            </button>
                          </div>
                          {product.brochureUrl && (
                            <button
                              onClick={handleDownloadDatasheet}
                              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 font-semibold text-sm flex items-center justify-center gap-2 transition-colors border border-gray-200"
                              title="Download Datasheet (PDF)"
                            >
                              <Download className="w-4 h-4" />
                              Download Datasheet
                            </button>
                          )}
                        </div>
                      ) : isTelecom && product.price && !product.requiresQuote ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAddToCart(false)}
                              disabled={maxDirectPurchase !== null && quantity > maxDirectPurchase}
                              className={`flex-1 py-3 font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                                maxDirectPurchase !== null && quantity > maxDirectPurchase
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'bg-gray-900 text-white hover:bg-gray-800'
                              }`}
                            >
                              <ShoppingCart className="w-4 h-4" />
                              Add to Cart
                            </button>
                            <button
                              onClick={handleAddToQuote}
                              className="flex-1 border-2 border-gray-900 text-gray-900 py-3 font-semibold text-sm hover:bg-gray-50 flex items-center justify-center gap-2"
                            >
                              <FileText className="w-4 h-4" />
                              Get Quote
                            </button>
                          </div>
                          {product.brochureUrl && (
                            <button
                              onClick={handleDownloadDatasheet}
                              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 font-semibold text-sm flex items-center justify-center gap-2 transition-colors border border-gray-200"
                              title="Download Datasheet (PDF)"
                            >
                              <Download className="w-4 h-4" />
                              Download Datasheet
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={handleAddToQuote}
                            className="w-full bg-gray-900 text-white py-3 font-semibold text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                          >
                            <FileText className="w-4 h-4" />
                            Request Quote
                          </button>
                          {product.brochureUrl && (
                            <button
                              onClick={handleDownloadDatasheet}
                              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 font-semibold text-sm flex items-center justify-center gap-2 transition-colors border border-gray-200"
                              title="Download Datasheet (PDF)"
                            >
                              <Download className="w-4 h-4" />
                              Download Datasheet
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Products Sidebar */}
          <div className="lg:col-span-3">
            <div className="sticky top-24">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Recommended</h3>
                <div className="flex-grow h-px bg-gray-200" />
              </div>
              <div className="space-y-3 max-h-[calc(100vh-150px)] overflow-y-auto">
                {recommendedProducts.map((recProduct) => {
                  const thumbnail = recProduct.images[0] || FALLBACK_PRODUCT_IMAGE;
                  const recIsTelecom = recProduct.isTelecom || recProduct.category?.toLowerCase() === 'telecommunication';
                  const canShowPrice = recIsTelecom && recProduct.price && !recProduct.requiresQuote;

                  return (
                    <Link 
                      to={`/product/${recProduct._id}`} 
                      key={recProduct._id}
                      className="group flex gap-3 bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all"
                    >
                      <div className="w-20 h-20 shrink-0 overflow-hidden bg-gray-50 border border-gray-100">
                        <img
                          src={thumbnail}
                          alt={recProduct.name}
                          className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300 product-image-enhance"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-[13px] line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">{recProduct.name}</h4>
                        <div className="mt-1.5">
                          {canShowPrice ? (
                            <span className="text-sm font-bold text-gray-900">₹{recProduct.price!.toLocaleString()}</span>
                          ) : (
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Quote Required</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
                {recommendedProducts.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-6">No recommendations available</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Image Zoom Modal */}
        {isZoomOpen && selectedImage && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 select-none"
            onClick={() => setIsZoomOpen(false)}
          >
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors z-10"
              title="Close modal"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            
            {/* Previous Image Button */}
            {allImages.length > 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); goToPrev(); }} 
                className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors hover:scale-105 active:scale-95"
                title="Previous image"
              >
                <ChevronLeft className="w-8 h-8 text-white" />
              </button>
            )}

            <img
              src={selectedImage}
              alt={product.name}
              className="max-w-full max-h-[85vh] object-contain transition-all duration-300 product-image-enhance"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Next Image Button */}
            {allImages.length > 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); goToNext(); }} 
                className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors hover:scale-105 active:scale-95"
                title="Next image"
              >
                <ChevronRight className="w-8 h-8 text-white" />
              </button>
            )}

            {/* Image index counter */}
            {allImages.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs font-semibold px-4 py-1.5 rounded-full backdrop-blur-sm shadow-md">
                {activeIndex + 1} / {allImages.length}
              </div>
            )}
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