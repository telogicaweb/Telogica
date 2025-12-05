import { useState, useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingBag, AlertCircle, Loader2 } from 'lucide-react';
import type { RazorpayOptions, RazorpayResponse } from '../types/razorpay';

const Cart = () => {
  const { cart, removeFromCart, clearCart } = useContext(CartContext)!;
  const { user } = useContext(AuthContext)!;
  const navigate = useNavigate();
  const [shippingAddress, setShippingAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate price based on whether retailer price should be used
  const getItemPrice = (item: typeof cart[0]) => {
    if (user?.role === 'retailer' && item.useRetailerPrice && item.product.retailerPrice) {
      return item.product.retailerPrice;
    }
    return item.product.price || 0;
  };

  const subtotal = cart.reduce((acc, item) => acc + getItemPrice(item) * item.quantity, 0);
  const shipping = 0; // Free shipping for now
  const total = subtotal + shipping;

  // Check if user needs to request a quote (regular user with >3 items)
  const requiresQuote = user?.role === 'user' && cart.length > 3;

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // If user is a regular user with more than 3 items, redirect to quote
    if (requiresQuote) {
      alert('You have more than 3 items in your cart. Please request a quote for bulk orders.');
      navigate('/quote');
      return;
    }

    if (!shippingAddress.trim()) {
      alert('Please enter a shipping address');
      return;
    }

    // Check if Razorpay is loaded
    if (typeof window.Razorpay === 'undefined') {
      alert('Payment gateway is not loaded. Please refresh the page and try again.');
      return;
    }

    setIsProcessing(true);

    try {
      const { data } = await api.post('/api/orders', {
        products: cart.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: getItemPrice(item),
          useRetailerPrice: item.useRetailerPrice
        })),
        totalAmount: total,
        shippingAddress,
        isRetailerDirectPurchase: user.role === 'retailer'
      });

      // Razorpay Integration
      const options: RazorpayOptions = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_Rnat5mGdrSJJX4",
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
            alert('Payment Successful!');
            clearCart();
            navigate('/user-dashboard');
          } catch {
            alert('Payment Verification Failed');
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
      rzp1.on('payment.failed', function (response: { error: { description: string } }){
        alert(response.error.description);
        setIsProcessing(false);
      });
      rzp1.open();

    } catch (error: unknown) {
      console.error(error);
      const axiosError = error as { response?: { data?: { requiresQuote?: boolean; message?: string } }; message?: string };
      if (axiosError.response?.data?.requiresQuote) {
        alert(axiosError.response.data.message);
        navigate('/quote');
      } else {
        alert('Checkout Failed: ' + (axiosError.response?.data?.message || axiosError.message));
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
                    <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden">
                      <img
                        src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'}
                        alt={item.product.name}
                        className="w-full h-full object-center object-cover"
                      />
                    </div>

                    <div className="ml-4 flex-1 flex flex-col">
                      <div>
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <h3>
                            <Link to={`/product/${item.product._id}`}>{item.product.name}</Link>
                          </h3>
                          <p className="ml-4">₹{getItemPrice(item) * item.quantity}</p>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{item.product.category}</p>
                        {item.useRetailerPrice && item.product.retailerPrice && (
                          <p className="text-xs text-green-600 mt-1">Retailer Price Applied</p>
                        )}
                      </div>
                      <div className="flex-1 flex items-end justify-between text-sm">
                        <p className="text-gray-500">Qty {item.quantity}</p>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product._id)}
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

              <div className="mt-6 space-y-3">
                <div className="mb-4">
                  <label htmlFor="shippingAddress" className="block text-sm font-medium text-gray-700 mb-1">
                    Shipping Address
                  </label>
                  <textarea
                    id="shippingAddress"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter your full shipping address"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                  />
                </div>

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
  );
};

export default Cart;
