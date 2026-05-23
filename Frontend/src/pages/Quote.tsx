import { useContext, useState, useEffect } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, AlertCircle, FileText, ShoppingCart, ChevronRight, Plus, Minus } from 'lucide-react';

const Quote = () => {
  const { cart, quoteItems, removeFromQuote, clearQuote, clearCart, updateQuoteItemQuantity } = useContext(CartContext)!;
  const { user } = useContext(AuthContext)!;
  const { success, error: toastError } = useToast();
  const [message, setMessage] = useState('');
  const [quoteType, setQuoteType] = useState<'standard' | 'bulk_order'>('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Auto-populate quote items from cart if user has more than 3 items
  useEffect(() => {
    if (user?.role === 'user' && cart.length > 3 && quoteItems.length === 0) {
      // Items are already in cart
    }
  }, [cart, user, quoteItems]);

  const handleSubmitQuote = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    const itemsToQuote = quoteItems.length > 0 ? quoteItems : cart;

    if (itemsToQuote.length === 0) {
      toastError('No items to quote');
      return;
    }

    // Validation Logic
    const telecomItems = itemsToQuote.filter(item => item.product.isTelecom || item.product.category === 'Telecom');
    const hasTelecom = telecomItems.length > 0;
    const totalTelecomQuantity = telecomItems.reduce((sum, item) => sum + item.quantity, 0);

    // Standard Quote Validation (Telecom specific)
    if (quoteType === 'standard' && hasTelecom) {
      if (totalTelecomQuantity < 3 && telecomItems.length < 3) {
        toastError(`For Telecom products, you need either a total quantity of 3+ or 3+ different items.`);
        return;
      }
    }

    // Bulk Order Validation
    if (quoteType === 'bulk_order') {
      const invalidBulkItems = itemsToQuote.filter(item => item.quantity < 3);
      if (invalidBulkItems.length > 0) {
        toastError('For Bulk Order Quotation, each product must have a minimum quantity of 3.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await api.post('/api/quotes', {
        products: itemsToQuote.map(item => ({
          product: item.product._id,
          quantity: item.quantity
        })),
        message,
        type: quoteType
      });

      success('Quote Submitted Successfully! You will receive an email once admin responds.');
      clearQuote();
      clearCart();
      navigate(user.role === 'retailer' ? '/retailer-dashboard' : '/user-dashboard');
    } catch (error: any) {
      console.error('Quote submission error:', error);
      toastError(error.response?.data?.message || 'Failed to submit quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayItems = quoteItems.length > 0 ? quoteItems : cart;

  // Validation Logic for UI
  const telecomItems = displayItems.filter(item => item.product.isTelecom || item.product.category === 'Telecom');
  const hasTelecom = telecomItems.length > 0;
  const totalTelecomQuantity = telecomItems.reduce((sum, item) => sum + item.quantity, 0);

  // Validation Checks
  const isStandardValid = !hasTelecom || (totalTelecomQuantity >= 3 || telecomItems.length >= 3);
  const isBulkValid = displayItems.every(item => item.quantity >= 3);

  const isMinimumMet = displayItems.length > 0 && (quoteType === 'standard' ? isStandardValid : isBulkValid);

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Combined Header (Breadcrumbs + Hero Banner) */}
      <section className="bg-slate-900 text-white pt-24 pb-6 border-b border-slate-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col">
          {/* Integrated Breadcrumbs */}
          <div className="flex items-center gap-2 text-[11px] mb-2">
            <Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 text-gray-600" />
            <span className="text-white font-medium">Request a Quote</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
            Request a Quote
          </h1>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quote Type Selection for Retailers */}
        {user?.role === 'retailer' && (
          <div className="bg-white p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] mb-8 border border-gray-100 animate-in fade-in duration-300">
            <h2 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-50">
              Quotation Method
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => setQuoteType('standard')}
                className={`p-5 rounded-lg border-2 cursor-pointer transition-all ${quoteType === 'standard' ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${quoteType === 'standard' ? 'border-indigo-650' : 'border-gray-400'}`}>
                    {quoteType === 'standard' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-650" />}
                  </div>
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Price Request</span>
                </div>
                <p className="text-[10px] text-gray-500 ml-5 leading-relaxed font-semibold">Request special pricing. Accepted items will be added to your Quoted Products catalog for future checkout (Min 3 qty or 3 items for Telecom products).</p>
              </div>

              <div
                onClick={() => setQuoteType('bulk_order')}
                className={`p-5 rounded-lg border-2 cursor-pointer transition-all ${quoteType === 'bulk_order' ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${quoteType === 'bulk_order' ? 'border-indigo-655' : 'border-gray-400'}`}>
                    {quoteType === 'bulk_order' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-655" />}
                  </div>
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Bulk Order</span>
                </div>
                <p className="text-[10px] text-gray-500 ml-5 leading-relaxed font-semibold">One-time bulk purchase order. Upon acceptance, you can proceed directly to complete the payment (Min 3 qty per product).</p>
              </div>
            </div>
            {quoteType === 'bulk_order' && !isBulkValid && displayItems.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded border border-red-205 flex items-center gap-2">
                <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                <span>For Bulk Orders, every product must have a quantity of at least 3.</span>
              </div>
            )}
          </div>
        )}

        {/* Minimum requirement notice */}
        <div className={`mb-8 border-l-4 p-4 rounded-r-lg shadow-sm border ${isMinimumMet ? 'bg-green-50 border-green-500 border-y border-r border-green-100' : 'bg-amber-50 border-amber-500 border-y border-r border-amber-100'}`}>
          <div className="flex gap-3 items-start">
            <div className="flex-shrink-0 mt-0.5">
              {isMinimumMet ? (
                <FileText className="h-5 w-5 text-green-600 animate-pulse" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600" />
              )}
            </div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${isMinimumMet ? 'text-green-800' : 'text-amber-800'}`}>
                {isMinimumMet ? 'Ready for submission' : 'Minimum constraints check'}
              </p>
              <p className={`text-xs mt-1 leading-relaxed ${isMinimumMet ? 'text-green-700' : 'text-amber-700'}`}>
                {isMinimumMet
                  ? `✓ You have ${displayItems.length} items (${hasTelecom ? `${totalTelecomQuantity} telecom quantity` : 'no telecom'}). Ready to submit quote request.`
                  : hasTelecom
                    ? `You have ${telecomItems.length} Telecom items with total quantity ${totalTelecomQuantity}. Need either 3+ total quantity OR 3+ different items.`
                    : `You have ${displayItems.length} items. Add items to request a quote.`}
              </p>
              {hasTelecom && (
                <p className="text-[10px] mt-1.5 text-gray-500 font-semibold uppercase tracking-wider">
                  * Telecom products require either total quantity of 3+ OR 3+ different items.
                </p>
              )}
            </div>
          </div>
        </div>

        {displayItems.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] rounded-xl animate-in fade-in duration-300">
            <ShoppingCart size={48} className="mx-auto text-gray-305 mb-4" />
            <p className="text-gray-900 font-extrabold text-sm uppercase tracking-wider mb-1">Your quote list is empty</p>
            <p className="text-gray-500 text-xs mb-6 font-medium">Add items to request a quote.</p>
            <button
              onClick={() => navigate('/products')}
              className="inline-flex items-center px-6 py-3 border border-transparent text-[10px] font-bold uppercase tracking-wider rounded text-white bg-gray-900 hover:bg-gray-800 shadow"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] border border-gray-100 rounded-xl overflow-hidden animate-in fade-in duration-300">
            <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-150 flex justify-between items-center">
              <h2 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">Items for Quote</h2>
              <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${isMinimumMet
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                {displayItems.length} items
              </span>
            </div>

            <ul className="divide-y divide-gray-100">
              {displayItems.map(item => (
                <li key={item.product._id} className="p-6 flex flex-col sm:flex-row justify-between sm:items-center hover:bg-gray-50/50 transition-colors gap-4">
                  <div className="flex items-center flex-1">
                    {item.product.images && item.product.images[0] && (
                      <div className="relative w-14 h-14 border border-gray-200/50 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute -top-1 -right-1 bg-white/90 text-gray-900 px-1 py-0.2 rounded text-[7px] font-extrabold uppercase tracking-wider shadow border border-gray-100">
                          {item.product.category}
                        </span>
                      </div>
                    )}
                    <div className="ml-4">
                      <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug line-clamp-1">{item.product.name}</h3>
                      <div className="flex items-center mt-2.5 gap-2 text-xs">
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wide">Quantity:</span>
                        <div className="flex items-center bg-gray-50 border border-gray-300 rounded p-0.5">
                          <button
                            onClick={() => updateQuoteItemQuantity(item.product._id, item.quantity - 1)}
                            className="p-1 rounded hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={10} />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-gray-900">{item.quantity}</span>
                          <button
                            onClick={() => updateQuoteItemQuantity(item.product._id, item.quantity + 1)}
                            className="p-1 rounded hover:bg-white transition-colors"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                      </div>
                      {item.product.price && (
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1.5">Regular Price: ₹{item.product.price} each</p>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeFromQuote(item.product._id)}
                    className="font-bold text-red-500 hover:text-red-650 flex items-center gap-1 text-[10px] uppercase tracking-wider bg-red-50 hover:bg-red-105 px-3 py-1.5 rounded transition-colors self-start sm:self-auto border border-red-100/35"
                  >
                    <Trash2 size={12} />
                    <span>Remove</span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="p-6 bg-gray-50/50 border-t border-gray-150">
              <label htmlFor="message" className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                Additional Message or Requirements *
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="shadow-inner border border-gray-250 rounded-lg block w-full text-xs font-semibold text-gray-700 bg-white p-3.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-semibold"
                rows={4}
                placeholder="Tell us about your requirements, expected delivery time, budget constraints, or any specific requests..."
                required
              />

              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleSubmitQuote}
                  disabled={!isMinimumMet || isSubmitting}
                  className={`flex-grow inline-flex justify-center items-center gap-2 py-3.5 px-6 rounded-lg text-xs font-bold uppercase tracking-wider text-white shadow transition-all ${isMinimumMet && !isSubmitting
                    ? 'bg-gray-900 hover:bg-gray-800 cursor-pointer transform hover:scale-[1.01]'
                    : 'bg-gray-400 cursor-not-allowed opacity-50'
                    }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting quote...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Submit Quote Request
                    </>
                  )}
                </button>
                <button
                  onClick={() => navigate('/products')}
                  className="px-6 py-3.5 border border-gray-250 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-750 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Continue Shopping
                </button>
              </div>

              <div className="mt-4 space-y-1 text-center font-bold text-[9px] text-gray-400 uppercase tracking-wider">
                <p>✓ You will receive an email notification once the admin responds to your quote.</p>
                <p>✓ Admin will provide custom pricing and discount details.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quote;
