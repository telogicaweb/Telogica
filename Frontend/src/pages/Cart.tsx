import { useState, useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingBag, AlertCircle, Loader2, MapPin, Phone, User, Building2, CheckCircle } from 'lucide-react';
import type { RazorpayOptions, RazorpayResponse } from '../types/razorpay';

const Cart = () => {
  const { cart, removeFromCart, clearCart } = useContext(CartContext)!;
  const { user } = useContext(AuthContext)!;
  const toast = useToast();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [warrantyOptions, setWarrantyOptions] = useState<{ [key: string]: 'standard' | 'extended' }>({});

  // Address form fields
  const [addressForm, setAddressForm] = useState({
    fullName: user?.name || '',
    phone: '',
    streetAddress: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });

  // Dropship State
  const [isDropship, setIsDropship] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [customerInvoiceUrl, setCustomerInvoiceUrl] = useState('');
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

  // Calculate price based on whether retailer price should be used
  const getItemPrice = (item: typeof cart[0]) => {
    if (item.quotedProductId && item.quotedPrice) {
      return item.quotedPrice;
    }
    if (user?.role === 'retailer' && item.useRetailerPrice && item.product.retailerPrice) {
      return item.product.retailerPrice;
    }
    return item.product.price || 0;
  };

  // Get warranty price for an item
  const getWarrantyPrice = (item: typeof cart[0]) => {
    const warrantyOption = warrantyOptions[item.product._id] || 'standard';
    if (warrantyOption === 'extended' && item.product.extendedWarrantyAvailable) {
      return item.product.extendedWarrantyPrice || 0;
    }
    return 0;
  };

  // Calculate item total including warranty
  const getItemTotal = (item: typeof cart[0]) => {
    const basePrice = getItemPrice(item) * item.quantity;
    const warrantyPrice = getWarrantyPrice(item) * item.quantity;
    return basePrice + warrantyPrice;
  };

  const subtotal = cart.reduce((acc, item) => acc + getItemTotal(item), 0);
  const shipping = 0; // Free shipping for now
  const total = subtotal + shipping;

  // Check if user needs to request a quote (regular user with >3 items)
  const requiresQuote = user?.role === 'user' && cart.length > 3;

  // Validate address form
  const isAddressValid = () => {
    return (
      addressForm.fullName.trim() &&
      addressForm.phone.trim() &&
      addressForm.streetAddress.trim() &&
      addressForm.city.trim() &&
      addressForm.state.trim() &&
      addressForm.pincode.trim()
    );
  };

  // Format address for backend
  const formatAddress = () => {
    return `${addressForm.fullName}, ${addressForm.phone}\n${addressForm.streetAddress}${addressForm.landmark ? ', ' + addressForm.landmark : ''}\n${addressForm.city}, ${addressForm.state} - ${addressForm.pincode}`;
  };

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // If user is a regular user with more than 3 items, redirect to quote
    if (requiresQuote) {
      toast.warning('You have more than 3 items in your cart. Please request a quote for bulk orders.');
      navigate('/quote');
      return;
    }

    // Check for Telecommunication products exceeding quantity limits (non-retailers only)
    if (user.role !== 'retailer') {
      const telecomOverLimit = cart.find(item => {
        const isTelecom = item.product.isTelecom || item.product.category?.toLowerCase() === 'telecommunication';
        const maxDirectPurchase = item.product.maxDirectPurchaseQty ?? null;
        return isTelecom && maxDirectPurchase !== null && item.quantity > maxDirectPurchase;
      });

      if (telecomOverLimit) {
        const maxQty = telecomOverLimit.product.maxDirectPurchaseQty;
        toast.warning(`Telecommunication product "${telecomOverLimit.product.name}" quantity (${telecomOverLimit.quantity}) exceeds the maximum direct purchase limit of ${maxQty}. Please request a quote for bulk orders.`);
        return;
      }
    }

    if (!isDropship && !isAddressValid()) {
      toast.error('Please fill in all required address fields');
      return;
    }

    if (isDropship) {
      if (!customerDetails.name || !customerDetails.email || !customerDetails.phone || !customerDetails.address) {
        toast.error('Please fill in all customer details');
        return;
      }
      if (!customerInvoiceUrl) {
        toast.error('Please generate the customer invoice first');
        return;
      }
    }

    // Check if Razorpay is loaded
    if (typeof window.Razorpay === 'undefined') {
      toast.error('Payment gateway is not loaded. Please refresh the page and try again.');
      return;
    }

    setIsProcessing(true);

    try {
      const { data } = await api.post('/api/orders', {
        products: cart.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: getItemPrice(item),
          useRetailerPrice: item.useRetailerPrice,
          quotedProductId: item.quotedProductId,
          warrantyOption: warrantyOptions[item.product._id] || 'standard',
          warrantyPrice: getWarrantyPrice(item)
        })),
        totalAmount: total,
        shippingAddress: isDropship ? customerDetails.address : formatAddress(),
        isRetailerDirectPurchase: user?.role === 'retailer',
        isDropship,
        customerDetails: isDropship ? customerDetails : undefined,
        customerInvoiceUrl: isDropship ? customerInvoiceUrl : undefined
      });

      if (!data.razorpayOrder || !data.order) {
        throw new Error('Invalid order response from server');
      }

      // Razorpay Integration
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_Rnat5mGdrSJJX4";
      console.log('Using Razorpay Key:', razorpayKey);

      const options: RazorpayOptions = {
        key: razorpayKey,
        amount: data.razorpayOrder.amount,
        currency: data.razorpayOrder.currency,
        name: "Telogica",
        description: "Order Payment",
        order_id: data.razorpayOrder.id,
        handler: async function (response: RazorpayResponse) {
          try {
            await api.post('/api/orders/verify', {
              orderId: data.order._id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            toast.success('Payment completed successfully! Your order has been placed.');
            clearCart();
            // Redirect to appropriate dashboard based on user role
            navigate(user.role === 'retailer' ? '/retailer-dashboard' : '/user-dashboard');
          } catch (verifyError) {
            console.error('Payment verification error:', verifyError);
            toast.error('Payment verification failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#3399cc"
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response: { error: { description: string } }) {
        toast.error('Payment failed: ' + response.error.description);
        setIsProcessing(false);
      });
      rzp1.open();

    } catch (error: unknown) {
      console.error('Checkout error:', error);
      const axiosError = error as { response?: { data?: { requiresQuote?: boolean; message?: string } }; message?: string };
      if (axiosError.response?.data?.requiresQuote) {
        toast.warning(axiosError.response.data.message || 'This order requires a quote.');
        navigate('/quote');
      } else {
        const errorMessage = axiosError.response?.data?.message || axiosError.message || 'Unknown error occurred';
        toast.error('Checkout Failed: ' + errorMessage);
      }
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="bg-white p-6 rounded-full shadow-sm inline-block mb-4">
            <ShoppingBag size={48} className="text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {/* Warning for users with more than 3 items */}
        {requiresQuote && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  You have more than 3 items in your cart. As a regular user, you need to request a quote for bulk orders.
                  Click "Request Quote" below instead of checkout.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
          <div className="lg:col-span-7">
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {cart.map((item) => (
                  <li key={item.product._id} className="p-6 flex">
                    <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden relative">
                      <img
                        src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'}
                        alt={item.product.name}
                        className="w-full h-full object-center object-cover"
                      />
                      <span className="absolute top-1 right-1 bg-white/90 text-gray-900 px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide shadow">
                        {item.product.category}
                      </span>
                    </div>

                    <div className="ml-4 flex-1 flex flex-col">
                      <div>
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <h3>
                            <Link to={`/product/${item.product._id}`}>{item.product.name}</Link>
                          </h3>
                          <p className="ml-4">₹{getItemTotal(item).toFixed(2)}</p>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{item.product.category}</p>
                        {item.quotedProductId ? (
                          <p className="text-xs text-green-600 mt-1 font-semibold">Special Quoted Price Applied</p>
                        ) : item.useRetailerPrice && item.product.retailerPrice ? (
                          <p className="text-xs text-green-600 mt-1">Retailer Price Applied</p>
                        ) : null}

                        {/* Warranty Selection */}
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-medium text-gray-700">Warranty Option:</p>
                          <div className="flex flex-col gap-2">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`warranty-${item.product._id}`}
                                checked={(warrantyOptions[item.product._id] || 'standard') === 'standard'}
                                onChange={() => setWarrantyOptions(prev => ({ ...prev, [item.product._id]: 'standard' }))}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="text-sm text-gray-700">
                                Standard - {item.product.warrantyPeriodMonths || 12} months (Free)
                              </span>
                            </label>

                            {item.product.extendedWarrantyAvailable && (
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`warranty-${item.product._id}`}
                                  checked={warrantyOptions[item.product._id] === 'extended'}
                                  onChange={() => setWarrantyOptions(prev => ({ ...prev, [item.product._id]: 'extended' }))}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                />
                                <span className="text-sm text-gray-700">
                                  Extended - {item.product.extendedWarrantyMonths || 24} months (+₹{(item.product.extendedWarrantyPrice || 0).toFixed(2)})
                                </span>
                              </label>
                            )}
                          </div>
                          {warrantyOptions[item.product._id] === 'extended' && (
                            <p className="text-xs text-green-600 mt-1">
                              Extended warranty: +₹{((item.product.extendedWarrantyPrice || 0) * item.quantity).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 flex items-end justify-between text-sm">
                        <p className="text-gray-500">Qty {item.quantity}</p>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product._id, item.quotedProductId)}
                          className="font-medium text-red-600 hover:text-red-500 flex items-center gap-1"
                        >
                          <Trash2 size={16} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-5 mt-8 lg:mt-0">
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>

              <dl className="space-y-4">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-600">Items in cart</dt>
                  <dd className="text-sm font-medium text-gray-900">{cart.length}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-600">Subtotal</dt>
                  <dd className="text-sm font-medium text-gray-900">₹{subtotal.toFixed(2)}</dd>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <dt className="text-base font-medium text-gray-900">Order Total</dt>
                  <dd className="text-base font-medium text-gray-900">₹{total.toFixed(2)}</dd>
                </div>
              </dl>

              <div className="mt-6 space-y-4">
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                    <MapPin size={18} className="mr-2 text-indigo-600" />
                    Shipping Address
                  </h3>

                  {/* Dropship Toggle for Retailers */}
                  {user?.role === 'retailer' && (
                    <div className="mb-6 flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <div className="flex items-center">
                        <User className="text-blue-600 mr-2" size={20} />
                        <div>
                          <p className="font-medium text-gray-900">Ship to Customer (Dropship)</p>
                          <p className="text-xs text-gray-500">Send directly to your customer with a no-price invoice</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={isDropship}
                          onChange={(e) => {
                            setIsDropship(e.target.checked);
                            // Reset form if unchecking? Maybe keep it.
                          }}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  )}

                  {isDropship ? (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Customer Name *</label>
                          <input
                            type="text"
                            required
                            value={customerDetails.name}
                            onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            placeholder="Customer Name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Customer Email *</label>
                          <input
                            type="email"
                            required
                            value={customerDetails.email}
                            onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            placeholder="customer@example.com"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Customer Phone *</label>
                          <input
                            type="tel"
                            required
                            value={customerDetails.phone}
                            onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            placeholder="Phone Number"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Customer Address *</label>
                        <textarea
                          required
                          rows={3}
                          value={customerDetails.address}
                          onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="Full delivery address..."
                        />
                      </div>

                      {/* Invoice Generation */}
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Customer Invoice</p>
                            <p className="text-xs text-gray-500">Generate a delivery note (no prices shown)</p>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!customerDetails.name || !customerDetails.email || !customerDetails.address) {
                                toast.error('Please fill customer details first');
                                return;
                              }
                              setIsGeneratingInvoice(true);
                              try {
                                const response = await api.post('/api/orders/dropship-invoice', {
                                  customerDetails,
                                  items: cart.map(item => ({
                                    product: { name: item.product.name },
                                    quantity: item.quantity
                                  }))
                                }, { responseType: 'blob' });

                                // Create URL for the blob
                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                setCustomerInvoiceUrl(url); // Save URL for checkout

                                // Auto-download for user to verify
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `delivery-note.pdf`;
                                document.body.appendChild(link);
                                link.click();
                                link.remove();

                                toast.success('Invoice generated & downloaded!');
                              } catch (err) {
                                console.error(err);
                                toast.error('Failed to generate invoice');
                              } finally {
                                setIsGeneratingInvoice(false);
                              }
                            }}
                            disabled={isGeneratingInvoice}
                            className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md text-sm font-medium hover:bg-indigo-100 disabled:opacity-50"
                          >
                            {isGeneratingInvoice ? 'Generating...' : 'Generate Invoice'}
                          </button>
                        </div>
                        {customerInvoiceUrl && (
                          <div className="mt-2 text-xs text-green-600 flex items-center">
                            <CheckCircle size={14} className="mr-1" />
                            Invoice generated successfully
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Full Name and Phone */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label htmlFor="fullName" className="block text-xs font-medium text-gray-700 mb-1">
                            <User size={14} className="inline mr-1" />
                            Full Name *
                          </label>
                          <input
                            type="text"
                            id="fullName"
                            required
                            value={addressForm.fullName}
                            onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <label htmlFor="phone" className="block text-xs font-medium text-gray-700 mb-1">
                            <Phone size={14} className="inline mr-1" />
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            id="phone"
                            required
                            value={addressForm.phone}
                            onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            placeholder="+91 98765 43210"
                          />
                        </div>
                      </div>

                      {/* Street Address */}
                      <div>
                        <label htmlFor="streetAddress" className="block text-xs font-medium text-gray-700 mb-1">
                          <Building2 size={14} className="inline mr-1" />
                          Street Address *
                        </label>
                        <input
                          type="text"
                          id="streetAddress"
                          required
                          value={addressForm.streetAddress}
                          onChange={(e) => setAddressForm({ ...addressForm, streetAddress: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          placeholder="House No, Building Name, Street"
                        />
                      </div>

                      {/* Landmark */}
                      <div>
                        <label htmlFor="landmark" className="block text-xs font-medium text-gray-700 mb-1">
                          Landmark (Optional)
                        </label>
                        <input
                          type="text"
                          id="landmark"
                          value={addressForm.landmark}
                          onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          placeholder="Near Park, Behind Mall, etc."
                        />
                      </div>

                      {/* City, State, Pincode */}
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <div>
                          <label htmlFor="city" className="block text-xs font-medium text-gray-700 mb-1">
                            City *
                          </label>
                          <input
                            type="text"
                            id="city"
                            required
                            value={addressForm.city}
                            onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            placeholder="Mumbai"
                          />
                        </div>
                        <div>
                          <label htmlFor="state" className="block text-xs font-medium text-gray-700 mb-1">
                            State *
                          </label>
                          <input
                            type="text"
                            id="state"
                            required
                            value={addressForm.state}
                            onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            placeholder="Maharashtra"
                          />
                        </div>
                        <div>
                          <label htmlFor="pincode" className="block text-xs font-medium text-gray-700 mb-1">
                            Pincode *
                          </label>
                          <input
                            type="text"
                            id="pincode"
                            required
                            value={addressForm.pincode}
                            onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            placeholder="400001"
                            maxLength={6}
                          />
                        </div>
                      </div>
                    </div>
                  )}


                  {requiresQuote ? (
                    <>
                      <button
                        onClick={() => navigate('/quote')}
                        className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                      >
                        Request Quote
                        <ArrowRight size={18} className="ml-2" />
                      </button>
                      <p className="text-xs text-center text-gray-500">
                        Bulk orders require admin approval for discounted pricing
                      </p>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <button
                        onClick={handleCheckout}
                        disabled={isProcessing}
                        className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 size={18} className="mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Proceed to Checkout
                            <ArrowRight size={18} className="ml-2" />
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => navigate('/quote')}
                        className="w-full flex justify-center items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        Request a Quote
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 text-center text-sm text-gray-500">
                  <p>
                    or{' '}
                    <Link to="/" className="text-indigo-600 font-medium hover:text-indigo-500">
                      Continue Shopping
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
