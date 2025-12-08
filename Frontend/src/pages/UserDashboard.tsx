import { useEffect, useState, useContext, useMemo } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Package, FileText, Clock, CheckCircle, XCircle, AlertCircle, ThumbsUp, ThumbsDown, Shield, Download, Eye, Loader2, MapPin, Phone, User, Building2, X, Sparkles, TrendingUp, ShoppingBag, Star, Award, Gift, Zap, CreditCard, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import type { RazorpayOptions, RazorpayResponse } from '../types/razorpay';
import DateFilter from '../components/AdminDashboard/DateFilter';

const UserDashboard = () => {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error('AuthContext is unavailable. Ensure the component is wrapped in AuthProvider.');
  }
  const { user, loading: authLoading } = auth;
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'quotes' | 'warranties' | 'invoices'>('orders');
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [expandedQuotes, setExpandedQuotes] = useState<Set<string>>(new Set());
  const [quoteDateFrom, setQuoteDateFrom] = useState<string>('');
  const [quoteDateTo, setQuoteDateTo] = useState<string>('');
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    streetAddress: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });

  const fetchData = async () => {
    if (!user) return;
    try {
      const [ordersRes, quotesRes, warrantiesRes, invoicesRes] = await Promise.all([
        api.get('/api/orders/myorders'),
        api.get('/api/quotes'),
        api.get('/api/warranties/my-warranties'),
        api.get('/api/invoices/my-invoices')
      ]);

      setOrders(ordersRes.data);
      setQuotes(quotesRes.data);
      setWarranties(warrantiesRes.data);
      setInvoices(invoicesRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data", error);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      fetchData();
    }
  }, [authLoading, user, navigate]);

  const acceptQuote = async (quoteId: string) => {
    if (!confirm('Are you sure you want to accept this quote?')) return;

    setActionLoading(true);
    try {
      await api.put(`/api/quotes/${quoteId}/accept`, {});
      alert('Quote accepted! You can now proceed to checkout with this quote.');
      fetchData();
    } catch (error: unknown) {
      console.error('Error accepting quote', error);
      const axiosError = error as { response?: { data?: { message?: string }, status?: number } };
      console.log('Error details:', axiosError.response);
      alert(axiosError.response?.data?.message || 'Failed to accept quote');
    } finally {
      setActionLoading(false);
    }
  };

  const rejectQuote = async (quoteId: string) => {
    if (!confirm('Are you sure you want to reject this quote?')) return;

    setActionLoading(true);
    try {
      await api.put(`/api/quotes/${quoteId}/reject`, {});
      alert('Quote rejected.');
      fetchData();
    } catch (error: unknown) {
      console.error('Error rejecting quote', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      alert(axiosError.response?.data?.message || 'Failed to reject quote');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleQuoteExpand = (quoteId: string) => {
    setExpandedQuotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(quoteId)) {
        newSet.delete(quoteId);
      } else {
        newSet.add(quoteId);
      }
      return newSet;
    });
  };

  const filteredQuotes = useMemo(() => {
    if (!quoteDateFrom && !quoteDateTo) return quotes;
    const fromTime = quoteDateFrom ? new Date(quoteDateFrom).getTime() : Number.NEGATIVE_INFINITY;
    let toTime = Number.POSITIVE_INFINITY;

    if (quoteDateTo) {
      const toDate = new Date(quoteDateTo);
      toDate.setHours(23, 59, 59, 999);
      toTime = toDate.getTime();
    }

    return quotes.filter((q) => {
      const created = q.createdAt ? new Date(q.createdAt).getTime() : undefined;
      if (created === undefined) return true;
      return created >= fromTime && created <= toTime;
    });
  }, [quotes, quoteDateFrom, quoteDateTo]);


  const proceedToCheckout = async (quote: any) => {
    if (!user) {
      alert('Please login again to continue.');
      navigate('/login');
      return;
    }

    setActionLoading(true);
    try {
      // Filter out invalid products (e.g. deleted products)
      const validItems = quote.products.filter((item: any) => item.product && item.product._id);
      
      if (validItems.length === 0) {
        alert('Cannot proceed: All products in this quote are no longer available.');
        setActionLoading(false);
        return;
      }

      if (validItems.length < quote.products.length) {
        if (!confirm('Some products in this quote are no longer available. Do you want to proceed with the remaining items?')) {
          setActionLoading(false);
          return;
        }
      }

      const totalPrice = quote.adminResponse?.totalPrice || quote.quotedPrice || 0;

      // Open address modal instead of using prompt
      setSelectedQuote({ ...quote, products: validItems, totalPrice });
      setAddressForm({
        fullName: user?.name || '',
        phone: '',
        streetAddress: '',
        city: '',
        state: '',
        pincode: '',
        landmark: ''
      });
      setShowAddressModal(true);
      setActionLoading(false);
    } catch (error) {
      console.error('Error preparing checkout:', error);
      alert('Failed to prepare checkout. Please try again.');
      setActionLoading(false);
    }
  };

  const handleAddressSubmit = async () => {
    // Validate address
    if (!addressForm.fullName.trim() || !addressForm.phone.trim() || 
        !addressForm.streetAddress.trim() || !addressForm.city.trim() || 
        !addressForm.state.trim() || !addressForm.pincode.trim()) {
      alert('Please fill in all required address fields');
      return;
    }

    const shippingAddress = `${addressForm.fullName}, ${addressForm.phone}\n${addressForm.streetAddress}${addressForm.landmark ? ', ' + addressForm.landmark : ''}\n${addressForm.city}, ${addressForm.state} - ${addressForm.pincode}`;
    
    setActionLoading(true);
    try {
      const products = selectedQuote.products.map((item: { product: { _id: string }; quantity: number }) => ({
        product: item.product._id,
        quantity: item.quantity,
        price: selectedQuote.totalPrice / selectedQuote.products.reduce((sum: number, p: { quantity: number }) => sum + p.quantity, 0)
      }));

      const { data } = await api.post('/api/orders', {
        products,
        totalAmount: selectedQuote.totalPrice,
        quoteId: selectedQuote._id,
        shippingAddress
      });

      setShowAddressModal(false);

      // Razorpay Integration
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_Rnat5mGdrSJJX4";
      console.log('Using Razorpay Key:', razorpayKey);

      const options: RazorpayOptions = {
        key: razorpayKey,
        amount: data.razorpayOrder.amount,
        currency: data.razorpayOrder.currency,
        name: "Telogica",
        description: "Quote Order Payment",
        order_id: data.razorpayOrder.id,
        handler: async function (response: RazorpayResponse) {
          try {
            await api.post('/api/orders/verify', {
              orderId: data.order._id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            alert('Payment Successful!');
            fetchData();
          } catch {
            alert('Payment Verification Failed');
          } finally {
            setActionLoading(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: "#3399cc"
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response: { error: { description: string } }) {
        alert(response.error.description);
        setActionLoading(false);
      });
      rzp1.open();

    } catch (error: unknown) {
      console.error('Error creating order', error);
      const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
      if (axiosError.response?.status === 401) {
        alert('Session expired. Please login again.');
        return;
      }
      alert(axiosError.response?.data?.message || 'Failed to create order');
    } finally {
      setActionLoading(false);
    }
  };

  const downloadInvoice = async (invoiceId: string) => {
    try {
      const response = await api.get(`/api/invoices/${invoiceId}/download`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      console.error('Error downloading invoice', error);
      alert('Failed to download invoice');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'accepted':
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'responded': return 'text-blue-600 bg-blue-100';
      case 'cancelled':
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'accepted':
      case 'confirmed': return <CheckCircle size={16} />;
      case 'pending': return <Clock size={16} />;
      case 'responded': return <AlertCircle size={16} />;
      case 'cancelled':
      case 'rejected': return <XCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-gray-50">
      {/* Ultra Premium Header */}
      <div className="relative bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] text-white overflow-hidden pt-32 pb-24">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full bg-purple-600/15 blur-[140px] animate-pulse"></div>
          <div className="absolute top-[40%] right-[30%] w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[100px] animate-pulse"></div>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div>
              {/* Premium Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-700/50 text-indigo-200 text-sm font-bold mb-6 backdrop-blur-md shadow-2xl">
                <Sparkles size={16} className="text-indigo-300 animate-pulse" />
                <span>PREMIUM MEMBER</span>
                <Award size={14} className="text-yellow-400" />
              </div>

              {/* Welcome Message */}
              <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-purple-200 drop-shadow-2xl">
                Welcome back!
              </h1>
              <p className="text-2xl md:text-3xl text-gray-300 font-light">
                <span className="font-bold text-white">{user?.name}</span>
              </p>
              <p className="text-gray-400 mt-2 text-lg">{user?.email}</p>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/20 rounded-xl">
                    <Package size={20} className="text-blue-300" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">{orders.length}</p>
                    <p className="text-xs text-gray-300">Orders</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-500/20 rounded-xl">
                    <FileText size={20} className="text-purple-300" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">{quotes.length}</p>
                    <p className="text-xs text-gray-300">Quotes</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-500/20 rounded-xl">
                    <Shield size={20} className="text-green-300" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">{warranties.length}</p>
                    <p className="text-xs text-gray-300">Warranties</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-orange-500/20 rounded-xl">
                    <Download size={20} className="text-orange-300" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">{invoices.length}</p>
                    <p className="text-xs text-gray-300">Invoices</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20 pb-16">
        {/* Premium Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-gray-200 overflow-hidden mb-8">
          <div className="border-b-2 border-gray-100">
            <nav className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('orders')}
                className={`group relative py-6 px-8 text-center font-bold text-sm flex items-center gap-3 whitespace-nowrap transition-all duration-300 ${activeTab === 'orders'
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {activeTab === 'orders' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-full"></div>
                )}
                <div className={`p-2.5 rounded-xl transition-all duration-300 ${activeTab === 'orders' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'}`}>
                  <Package size={20} />
                </div>
                <div>
                  <span className="block">My Orders</span>
                  <span className="text-xs opacity-70">{orders.length} total</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('quotes')}
                className={`group relative py-6 px-8 text-center font-bold text-sm flex items-center gap-3 whitespace-nowrap transition-all duration-300 ${activeTab === 'quotes'
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {activeTab === 'quotes' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-full"></div>
                )}
                <div className={`p-2.5 rounded-xl transition-all duration-300 ${activeTab === 'quotes' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'}`}>
                  <FileText size={20} />
                </div>
                <div>
                  <span className="block">Quote Requests</span>
                  <span className="text-xs opacity-70">{quotes.length} total</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('warranties')}
                className={`group relative py-6 px-8 text-center font-bold text-sm flex items-center gap-3 whitespace-nowrap transition-all duration-300 ${activeTab === 'warranties'
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {activeTab === 'warranties' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-full"></div>
                )}
                <div className={`p-2.5 rounded-xl transition-all duration-300 ${activeTab === 'warranties' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'}`}>
                  <Shield size={20} />
                </div>
                <div>
                  <span className="block">Warranties</span>
                  <span className="text-xs opacity-70">{warranties.length} registered</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('invoices')}
                className={`group relative py-6 px-8 text-center font-bold text-sm flex items-center gap-3 whitespace-nowrap transition-all duration-300 ${activeTab === 'invoices'
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {activeTab === 'invoices' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-full"></div>
                )}
                <div className={`p-2.5 rounded-xl transition-all duration-300 ${activeTab === 'invoices' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'}`}>
                  <Download size={20} />
                </div>
                <div>
                  <span className="block">Invoices</span>
                  <span className="text-xs opacity-70">{invoices.length} available</span>
                </div>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'orders' && (
              <div>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No orders found.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map(order => (
                      <div key={order._id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Order ID</p>
                            <p className="font-medium text-gray-900">#{order._id.slice(-8).toUpperCase()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Date</p>
                            <p className="font-medium text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Total Amount</p>
                            <p className="font-medium text-gray-900">₹{order.totalAmount}</p>
                          </div>
                          {order.isQuoteBased && (
                            <div>
                              <p className="text-sm text-gray-500">Discount</p>
                              <p className="font-medium text-green-600">{order.discountApplied}%</p>
                            </div>
                          )}
                          <div>
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                              {getStatusIcon(order.orderStatus)}
                              {order.orderStatus}
                            </span>
                          </div>
                        </div>
                        <div className="p-6">
                          <ul className="divide-y divide-gray-200">
                            {order.products.map((p: any) => (
                              <li key={p._id} className="py-4 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div className="ml-4">
                                      <p className="text-sm font-medium text-gray-900">{p.product?.name || 'Product Unavailable'}</p>
                                      <p className="text-sm text-gray-500">Qty: {p.quantity}</p>
                                    </div>
                                  </div>
                                  <p className="text-sm font-medium text-gray-900">₹{p.price}</p>
                                </div>
                                {p.serialNumbers && p.serialNumbers.length > 0 && (
                                  <div className="ml-4 mt-2">
                                    <p className="text-xs text-gray-500 mb-1">Serial Numbers:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {p.serialNumbers.map((sn: string) => (
                                        <span key={sn} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                          {sn}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>

                          {/* Tracking Information Section */}
                          {(order.deliveryTrackingLink || order.trackingId) && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 bg-blue-100 rounded-lg">
                                    <Package className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                      <span>📦 Tracking Information</span>
                                    </h4>
                                    
                                    {order.trackingId && (
                                      <div className="mb-3">
                                        <p className="text-xs text-gray-600 mb-1">Tracking ID / Reference Number:</p>
                                        <div className="flex items-center gap-2">
                                          <code className="text-sm font-bold text-blue-700 bg-white px-3 py-1.5 rounded border border-blue-200">
                                            {order.trackingId}
                                          </code>
                                          <button
                                            onClick={() => {
                                              navigator.clipboard.writeText(order.trackingId);
                                              alert('Tracking ID copied to clipboard!');
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                                          >
                                            Copy
                                          </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Use this ID to track with the courier service</p>
                                      </div>
                                    )}
                                    
                                    {order.deliveryTrackingLink && (
                                      <div>
                                        <p className="text-xs text-gray-600 mb-2">Track Your Shipment:</p>
                                        <a
                                          href={order.deliveryTrackingLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                          </svg>
                                          Track Package
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'quotes' && (
              <div>
                {/* Date Filter */}
                <DateFilter
                  dateFrom={quoteDateFrom}
                  dateTo={quoteDateTo}
                  onDateFromChange={setQuoteDateFrom}
                  onDateToChange={setQuoteDateTo}
                  label="Filter Quotes by Date"
                  className="mb-6"
                />

                {/* Active Quotes Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Quotes</h3>
                  {filteredQuotes.filter(q => q.status !== 'completed').length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <FileText size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500 text-sm">No active quotes found.</p>
                    </div>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                      {filteredQuotes.filter(q => q.status !== 'completed').map(quote => {
                        const isExpanded = expandedQuotes.has(quote._id);
                        return (
                        <div key={quote._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
                          {/* Condensed Preview */}
                          <div className="p-6">
                            <div className="flex justify-between items-start mb-3">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                                {getStatusIcon(quote.status)}
                                {quote.status}
                              </span>
                              <span className="text-xs text-gray-500">{new Date(quote.createdAt).toLocaleDateString()}</span>
                            </div>

                            <div className="mb-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-900">
                                  {quote.products.length} Product{quote.products.length > 1 ? 's' : ''} Requested
                                </h4>
                                {quote.adminResponse && (
                                  <span className="text-lg font-bold text-indigo-900">₹{quote.adminResponse.totalPrice}</span>
                                )}
                              </div>
                              {!isExpanded && quote.products.length > 0 && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {quote.products[0].product?.name || 'Product Unavailable'}
                                  {quote.products.length > 1 && ` +${quote.products.length - 1} more`}
                                </p>
                              )}
                            </div>

                            {/* View Quote Toggle Button */}
                            <button
                              onClick={() => toggleQuoteExpand(quote._id)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium mb-3"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp size={16} />
                                  Hide Details
                                </>
                              ) : (
                                <>
                                  <ChevronDown size={16} />
                                  View Quote
                                </>
                              )}
                            </button>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="space-y-4 pt-4 border-t border-gray-200">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 mb-2">Products:</h4>
                                  <ul className="text-sm text-gray-600 space-y-2">
                                    {quote.products.map((p: any) => (
                                      <li key={p._id} className="flex justify-between items-start bg-gray-50 p-2 rounded">
                                        <span className="flex-1">{p.product?.name || 'Product Unavailable'}</span>
                                        <span className="text-gray-500 ml-2">Qty: {p.quantity}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {quote.message && (
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Your Message:</h4>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{quote.message}</p>
                                  </div>
                                )}

                                {quote.adminResponse && (
                                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                                    <h4 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                                      <Sparkles size={16} />
                                      Admin Response
                                    </h4>
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-sm text-indigo-700">Offered Price:</span>
                                      <span className="text-lg font-bold text-indigo-900">₹{quote.adminResponse.totalPrice}</span>
                                    </div>
                                    {quote.adminResponse.discountPercentage > 0 && (
                                      <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-indigo-700">Discount:</span>
                                        <span className="text-sm font-semibold text-green-600">{quote.adminResponse.discountPercentage}% OFF</span>
                                      </div>
                                    )}
                                    <p className="text-sm text-indigo-800 mt-2">{quote.adminResponse.message}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Action Buttons */}
                            {quote.status === 'responded' && (
                              <div className="flex gap-2 mt-4">
                                <button
                                  onClick={() => acceptQuote(quote._id)}
                                  disabled={actionLoading}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
                                >
                                  <ThumbsUp size={16} />
                                  Accept
                                </button>
                                <button
                                  onClick={() => rejectQuote(quote._id)}
                                  disabled={actionLoading}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
                                >
                                  <ThumbsDown size={16} />
                                  Reject
                                </button>
                              </div>
                            )}

                            {quote.status === 'accepted' && (
                              <>
                                {quote.orderId ? (
                                  <button
                                    onClick={() => setActiveTab('orders')}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                  >
                                    <CheckCircle size={16} />
                                    Order Created - View in Orders
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => proceedToCheckout(quote)}
                                    disabled={actionLoading}
                                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center"
                                  >
                                    {actionLoading ? (
                                      <>
                                        <Loader2 size={16} className="mr-2 animate-spin" />
                                        Processing...
                                      </>
                                    ) : (
                                      'Proceed to Checkout'
                                    )}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )})}
                    </div>
                  )}
                </div>

                {/* Quote History Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quote History</h3>
                  {filteredQuotes.filter(q => q.status === 'completed').length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <Clock size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500 text-sm">No completed quotes found.</p>
                    </div>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                      {filteredQuotes.filter(q => q.status === 'completed').map(quote => {
                        const isExpanded = expandedQuotes.has(quote._id);
                        return (
                        <div key={quote._id} className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 opacity-75 hover:opacity-100 transition-opacity">
                          <div className="p-6">
                            <div className="flex justify-between items-start mb-3">
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-green-800 bg-green-100">
                                <CheckCircle size={14} />
                                Completed
                              </span>
                              <span className="text-xs text-gray-500">{new Date(quote.createdAt).toLocaleDateString()}</span>
                            </div>

                            <div className="mb-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-900">
                                  {quote.products.length} Product{quote.products.length > 1 ? 's' : ''} Purchased
                                </h4>
                                {quote.adminResponse && (
                                  <span className="text-lg font-bold text-gray-900">₹{quote.adminResponse.totalPrice}</span>
                                )}
                              </div>
                              {!isExpanded && quote.products.length > 0 && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {quote.products[0].product?.name || 'Product Unavailable'}
                                  {quote.products.length > 1 && ` +${quote.products.length - 1} more`}
                                </p>
                              )}
                            </div>

                            {/* View Quote Toggle Button */}
                            <button
                              onClick={() => toggleQuoteExpand(quote._id)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp size={16} />
                                  Hide Details
                                </>
                              ) : (
                                <>
                                  <ChevronDown size={16} />
                                  View Quote
                                </>
                              )}
                            </button>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 mb-2">Products:</h4>
                                  <ul className="text-sm text-gray-600 space-y-2">
                                    {quote.products.map((p: any) => (
                                      <li key={p._id} className="flex justify-between items-start bg-white p-2 rounded">
                                        <span className="flex-1">{p.product?.name || 'Product Unavailable'}</span>
                                        <span className="text-gray-500 ml-2">Qty: {p.quantity}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {quote.adminResponse && (
                                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600">Final Price:</span>
                                      <span className="text-lg font-bold text-gray-900">₹{quote.adminResponse.totalPrice}</span>
                                    </div>
                                    {quote.adminResponse.discountPercentage > 0 && (
                                      <div className="flex justify-between items-center mt-2">
                                        <span className="text-sm text-gray-600">Discount Applied:</span>
                                        <span className="text-sm font-semibold text-green-600">{quote.adminResponse.discountPercentage}% OFF</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )})}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'warranties' && (
              <div>
                {warranties.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-4">No warranties registered.</p>
                    <button
                      onClick={() => navigate('/warranty-registration')}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Register Warranty
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="mb-4 flex justify-end">
                      <button
                        onClick={() => navigate('/warranty-registration')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                      >
                        Register New Warranty
                      </button>
                    </div>
                    <div className="space-y-4">
                      {warranties.map((warranty: any) => (
                        <div
                          key={warranty._id}
                          className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900">
                                {warranty.productName}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Registered: {new Date(warranty.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                warranty.status
                              )}`}
                            >
                              {getStatusIcon(warranty.status)}
                              {warranty.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-500">Serial Number</p>
                              <p className="font-medium text-gray-900">{warranty.serialNumber}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Model Number</p>
                              <p className="font-medium text-gray-900">{warranty.modelNumber}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Purchase Date</p>
                              <p className="font-medium text-gray-900">
                                {new Date(warranty.purchaseDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Purchase Type</p>
                              <p className="font-medium text-gray-900 capitalize">
                                {warranty.purchaseType}
                              </p>
                            </div>
                          </div>

                          {warranty.warrantyStartDate && warranty.warrantyEndDate && (
                            <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-xs text-green-700">Warranty Period</p>
                                  <p className="text-sm font-medium text-green-900">
                                    {new Date(warranty.warrantyStartDate).toLocaleDateString()} -{' '}
                                    {new Date(warranty.warrantyEndDate).toLocaleDateString()}
                                  </p>
                                </div>
                                <CheckCircle className="text-green-600" size={20} />
                              </div>
                            </div>
                          )}

                          <div className="flex gap-4 mt-2">
                            {warranty.invoiceUrl && (
                              <a
                                href={warranty.invoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1"
                              >
                                <Eye size={16} />
                                View Invoice
                              </a>
                            )}
                            {warranty.warrantyCertificateUrl && (
                              <a
                                href={warranty.warrantyCertificateUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1"
                              >
                                <Download size={16} />
                                Warranty Certificate
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'invoices' && (
              <div>
                {invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <Download size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No invoices found.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Invoice ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Order ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {invoices.map((invoice: any) => (
                            <tr key={invoice._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-mono text-gray-900">
                                #{invoice.invoiceNumber || invoice._id.slice(-8).toUpperCase()}
                              </td>
                              <td className="px-6 py-4 text-sm font-mono text-gray-900">
                                #{invoice.order?._id?.slice(-8).toUpperCase() || 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                ₹{invoice.totalAmount?.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {new Date(invoice.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${invoice.paymentStatus === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : invoice.paymentStatus === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-700'
                                  }`}>
                                  {invoice.paymentStatus?.toUpperCase() || 'PENDING'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                {invoice.invoiceUrl ? (
                                  <a
                                    href={invoice.invoiceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                  >
                                    <Download size={16} />
                                    Download
                                  </a>
                                ) : (
                                  <button
                                    onClick={() => downloadInvoice(invoice._id)}
                                    className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                  >
                                    <Download size={16} />
                                    Download
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <MapPin size={24} className="mr-2 text-indigo-600" />
                Enter Shipping Address
              </h2>
              <button
                onClick={() => {
                  setShowAddressModal(false);
                  setActionLoading(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Full Name and Phone */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="modal-fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    <User size={16} className="inline mr-1" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="modal-fullName"
                    required
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label htmlFor="modal-phone" className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone size={16} className="inline mr-1" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="modal-phone"
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              {/* Street Address */}
              <div>
                <label htmlFor="modal-streetAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  <Building2 size={16} className="inline mr-1" />
                  Street Address *
                </label>
                <input
                  type="text"
                  id="modal-streetAddress"
                  required
                  value={addressForm.streetAddress}
                  onChange={(e) => setAddressForm({ ...addressForm, streetAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="House No, Building Name, Street"
                />
              </div>

              {/* Landmark */}
              <div>
                <label htmlFor="modal-landmark" className="block text-sm font-medium text-gray-700 mb-1">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  id="modal-landmark"
                  value={addressForm.landmark}
                  onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Near Park, Behind Mall, etc."
                />
              </div>

              {/* City, State, Pincode */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="modal-city" className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    id="modal-city"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Mumbai"
                  />
                </div>
                <div>
                  <label htmlFor="modal-state" className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    id="modal-state"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Maharashtra"
                  />
                </div>
                <div>
                  <label htmlFor="modal-pincode" className="block text-sm font-medium text-gray-700 mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    id="modal-pincode"
                    required
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="400001"
                    maxLength={6}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddressSubmit}
                  disabled={actionLoading}
                  className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed font-medium flex items-center justify-center"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Proceed to Payment'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowAddressModal(false);
                    setActionLoading(false);
                  }}
                  disabled={actionLoading}
                  className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
