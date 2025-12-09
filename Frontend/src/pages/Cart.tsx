import { useState, useContext, useEffect } from 'react';
import { CartContext, type CartItem } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingBag, AlertCircle, Loader2, MapPin, Phone, User, Building2, CheckCircle, Plus, Minus, FileText, Mail } from 'lucide-react';
import type { RazorpayOptions, RazorpayResponse } from '../types/razorpay';

const Cart = () => {
  const { cart, removeFromCart, clearCart, updateQuantity } = useContext(CartContext)!;
  const { user } = useContext(AuthContext)!;
  const toast = useToast();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
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

  // Fetch location details based on pincode
  const fetchLocationByPincode = async (pincode: string) => {
    if (pincode.length !== 6) return;
    
    setPincodeLoading(true);
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      
      if (data && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const postOffice = data[0].PostOffice[0];
        setAddressForm(prev => ({
          ...prev,
          city: postOffice.District || prev.city,
          state: postOffice.State || prev.state
        }));
        toast.success('Location detected from pincode!');
      } else {
        toast.error('Invalid pincode. Please enter manually.');
      }
    } catch (error) {
      console.error('Error fetching pincode data:', error);
      toast.error('Could not fetch location. Please enter manually.');
    } finally {
      setPincodeLoading(false);
    }
  };

  // Handle pincode change
  const handlePincodeChange = (value: string) => {
    // Only allow numbers and limit to 6 digits
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setAddressForm({ ...addressForm, pincode: numericValue });
    
    // Auto-fetch when 6 digits are entered
    if (numericValue.length === 6) {
      fetchLocationByPincode(numericValue);
    }
  };

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
  const getItemPrice = (item: CartItem) => {
    if (item.quotedProductId && item.quotedPrice) {
      return item.quotedPrice;
    }
    if (user?.role === 'retailer' && item.useRetailerPrice && item.product.retailerPrice) {
      return item.product.retailerPrice;
    }
    return item.product.price || 0;
  };

  // Get warranty price for an item
  const getWarrantyPrice = (item: CartItem) => {
    const warrantyOption = warrantyOptions[item.product._id] || 'standard';
    if (warrantyOption === 'extended' && item.product.extendedWarrantyAvailable) {
      return item.product.extendedWarrantyPrice || 0;
    }
    return 0;
  };

  // Calculate item total including warranty
  const getItemTotal = (item: CartItem) => {
    const basePrice = getItemPrice(item) * item.quantity;
    const warrantyPrice = getWarrantyPrice(item) * item.quantity;
    return basePrice + warrantyPrice;
  };

  // Calculate tax for an item
  const getItemTax = (item: CartItem) => {
    const itemTotal = getItemTotal(item);
    const taxPercentage = item.product.taxPercentage || 18;
    return (itemTotal * taxPercentage) / 100;
  };

  const subtotal = cart.reduce((acc, item) => acc + getItemTotal(item), 0);
  const totalTax = cart.reduce((acc, item) => acc + getItemTax(item), 0);
  const shipping = 0; // Free shipping for now
  const total = subtotal + totalTax + shipping;
  
  // Calculate total items count (sum of all quantities)
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

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
                        <div className="mt-2 flex items-center gap-4 text-xs">
                          <span className="text-gray-600">
                            Price: ₹{getItemPrice(item).toFixed(2)} x {item.quantity}
                          </span>
                          <span className="text-indigo-600 font-medium">
                            Tax: {item.product.taxPercentage || 18}% GST
                          </span>
                        </div>

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
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product._id, item.quantity - 1, item.quotedProductId)}
                            disabled={item.quantity <= 1}
                            className="p-1 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus size={16} className="text-gray-600" />
                          </button>
                          <span className="text-gray-700 font-medium w-8 text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product._id, item.quantity + 1, item.quotedProductId)}
                            className="p-1 rounded-md border border-gray-300 hover:bg-gray-100"
                          >
                            <Plus size={16} className="text-gray-600" />
                          </button>
                        </div>

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
            <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden">
              {/* Order Summary Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Order Summary
                </h2>
              </div>

              {/* Summary Details */}
              <div className="p-6">
                <dl className="space-y-3">
                  {/* Items Count */}
                  <div className="flex items-center justify-between py-2">
                    <dt className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <ShoppingBag size={16} className="text-gray-400" />
                      Items in cart
                    </dt>
                    <dd className="text-sm font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-full">
                      {totalItemsCount}
                    </dd>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100"></div>

                  {/* Subtotal */}
                  <div className="flex items-center justify-between py-2">
                    <dt className="text-sm font-medium text-gray-600">Subtotal (Before Tax)</dt>
                    <dd className="text-base font-semibold text-gray-900">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
                  </div>

                  {/* Tax */}
                  <div className="flex items-center justify-between py-2 bg-green-50 -mx-6 px-6 rounded">
                    <dt className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <span>Total Tax (GST)</span>
                      <span className="text-xs text-gray-500">(18%)</span>
                    </dt>
                    <dd className="text-base font-semibold text-green-600">₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
                  </div>

                  {/* Shipping */}
                  <div className="flex items-center justify-between py-2">
                    <dt className="text-sm font-medium text-gray-600">Shipping</dt>
                    <dd className="text-base font-semibold text-green-600 flex items-center gap-1">
                      <CheckCircle size={16} />
                      FREE
                    </dd>
                  </div>

                  {/* Divider */}
                  <div className="border-t-2 border-gray-200 my-2"></div>

                  {/* Total */}
                  <div className="flex items-center justify-between py-3 bg-gradient-to-r from-indigo-50 to-blue-50 -mx-6 px-6 rounded-lg">
                    <dt className="text-lg font-bold text-gray-900">Order Total</dt>
                    <dd className="text-2xl font-bold text-indigo-600">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
                  </div>
                </dl>

                {/* Savings Badge (if applicable) */}
                {shipping === 0 && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                    <CheckCircle className="text-green-600 flex-shrink-0" size={18} />
                    <p className="text-xs text-green-700 font-medium">
                      You're saving on shipping! Free delivery on all orders.
                    </p>
                  </div>
                )}
              </div>

              {/* Address Section */}
              <div className="px-6 pb-6 space-y-5">
                <div className="border-t-2 border-gray-100 pt-6">
                  <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2 bg-gray-50 -mx-6 px-6 py-3 rounded-t-lg">
                    <MapPin size={20} className="text-indigo-600" />
                    Shipping Address
                  </h3>

                  {/* Dropship Toggle for Retailers */}
                  {user?.role === 'retailer' && (
                    <div className="mb-6 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                          <User className="text-white" size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">Ship to Customer (Dropship)</p>
                          <p className="text-xs text-gray-600 mt-0.5">Send directly to your customer with a no-price invoice</p>
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
                        <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                      </label>
                    </div>
                  )}

                  {isDropship ? (
                    <div className="space-y-4 animate-fadeIn bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <User size={14} className="text-indigo-600" />
                            Customer Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={customerDetails.name}
                            onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="Customer Name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <Mail size={14} className="text-indigo-600" />
                            Customer Email *
                          </label>
                          <input
                            type="email"
                            required
                            value={customerDetails.email}
                            onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })}
                            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="customer@example.com"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <Phone size={14} className="text-indigo-600" />
                            Customer Phone *
                          </label>
                          <input
                            type="tel"
                            required
                            value={customerDetails.phone}
                            onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="Phone Number"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                          <MapPin size={14} className="text-indigo-600" />
                          Customer Address *
                        </label>
                        <textarea
                          required
                          rows={3}
                          value={customerDetails.address}
                          onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                          placeholder="Full delivery address..."
                        />
                      </div>

                      {/* Invoice Generation */}
                      <div className="pt-4 border-t-2 border-gray-200">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900 mb-1">Customer Invoice</p>
                            <p className="text-xs text-gray-600">Generate a delivery note (no prices shown)</p>
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
                            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg text-sm font-semibold hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"
                          >
                            {isGeneratingInvoice ? (
                              <>
                                <Loader2 size={16} className="animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <FileText size={16} />
                                Generate
                              </>
                            )}
                          </button>
                        </div>
                        {customerInvoiceUrl && (
                          <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                            <p className="text-xs text-green-700 font-medium">Invoice generated successfully</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      {/* Full Name and Phone */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <User size={14} className="text-indigo-600" />
                            Full Name *
                          </label>
                          <input
                            type="text"
                            id="fullName"
                            required
                            value={addressForm.fullName}
                            onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all"
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <Phone size={14} className="text-indigo-600" />
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            id="phone"
                            required
                            value={addressForm.phone}
                            onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all"
                            placeholder="+91 98765 43210"
                          />
                        </div>
                      </div>

                      {/* Street Address */}
                      <div>
                        <label htmlFor="streetAddress" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                          <Building2 size={14} className="text-indigo-600" />
                          Street Address *
                        </label>
                        <input
                          type="text"
                          id="streetAddress"
                          required
                          value={addressForm.streetAddress}
                          onChange={(e) => setAddressForm({ ...addressForm, streetAddress: e.target.value })}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all"
                          placeholder="House No, Building Name, Street"
                        />
                      </div>

                      {/* Landmark */}
                      <div>
                        <label htmlFor="landmark" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                          <MapPin size={14} className="text-gray-400" />
                          Landmark <span className="text-xs font-normal text-gray-500">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          id="landmark"
                          value={addressForm.landmark}
                          onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all"
                          placeholder="Near Park, Behind Mall, etc."
                        />
                      </div>

                      {/* Pincode First, then City & State */}
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label htmlFor="pincode" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <MapPin size={14} className="text-indigo-600" />
                            Pincode *
                            {pincodeLoading && (
                              <span className="text-xs text-indigo-600 flex items-center gap-1">
                                <Loader2 size={12} className="animate-spin" />
                                Detecting location...
                              </span>
                            )}
                          </label>
                          <input
                            type="text"
                            id="pincode"
                            required
                            value={addressForm.pincode}
                            onChange={(e) => handlePincodeChange(e.target.value)}
                            className="w-full px-4 py-2.5 border-2 border-indigo-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all"
                            placeholder="Enter 6-digit pincode"
                            maxLength={6}
                            disabled={pincodeLoading}
                          />
                          <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                            <CheckCircle size={12} />
                            City & State will be auto-detected
                          </p>
                        </div>
                      </div>

                      {/* City & State */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                            City * {addressForm.city && <span className="text-xs text-green-600">(Auto-filled)</span>}
                          </label>
                          <input
                            type="text"
                            id="city"
                            required
                            value={addressForm.city}
                            onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                            className={`w-full px-4 py-2.5 border-2 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all ${
                              addressForm.city ? 'border-green-300 bg-green-50' : 'border-gray-300'
                            }`}
                            placeholder="City will auto-fill"
                          />
                        </div>
                        <div>
                          <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-2">
                            State * {addressForm.state && <span className="text-xs text-green-600">(Auto-filled)</span>}
                          </label>
                          <input
                            type="text"
                            id="state"
                            required
                            value={addressForm.state}
                            onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                            className={`w-full px-4 py-2.5 border-2 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all ${
                              addressForm.state ? 'border-green-300 bg-green-50' : 'border-gray-300'
                            }`}
                            placeholder="State will auto-fill"
                          />
                        </div>
                      </div>
                    </div>
                  )}


                  {/* Action Buttons */}
                  <div className="pt-6 border-t-2 border-gray-100">
                    {requiresQuote ? (
                      <div className="space-y-3">
                        <button
                          onClick={() => navigate('/quote')}
                          className="w-full flex justify-center items-center px-6 py-3.5 border-2 border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02]"
                        >
                          Request Quote
                          <ArrowRight size={20} className="ml-2" />
                        </button>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                          <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                          <p className="text-xs text-blue-700 font-medium">
                            Bulk orders require admin approval for discounted pricing
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <button
                          onClick={handleCheckout}
                          disabled={isProcessing}
                          className="w-full flex justify-center items-center px-6 py-3.5 border-2 border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 transition-all disabled:from-indigo-400 disabled:to-blue-400 disabled:cursor-not-allowed transform hover:scale-[1.02] disabled:transform-none"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 size={20} className="mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              Proceed to Checkout
                              <ArrowRight size={20} className="ml-2" />
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => navigate('/quote')}
                          className="w-full flex justify-center items-center px-6 py-3 border-2 border-gray-300 rounded-xl shadow-sm text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all"
                        >
                          <FileText size={18} className="mr-2" />
                          Request a Quote
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Continue Shopping Link */}
                <div className="px-6 pb-6 text-center">
                  <p className="text-sm text-gray-500">
                    or{' '}
                    <Link to="/products" className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline transition-all">
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
