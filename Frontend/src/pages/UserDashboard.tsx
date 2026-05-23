import { useEffect, useState, useContext, useMemo } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Package, FileText, Clock, CheckCircle, XCircle, AlertCircle, ThumbsUp, ThumbsDown, Shield, Download, Eye, Loader2, MapPin, Phone, User, Building2, X, Sparkles, Award, Calendar, ChevronDown, ChevronUp, ChevronRight, ShoppingCart, ExternalLink } from 'lucide-react';
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
      navigate('/login', { replace: true });
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
      navigate('/login', { replace: true });
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
          color: "#0d9488"
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
      case 'confirmed': return 'text-emerald-700 bg-emerald-50 border border-emerald-200';
      case 'pending': return 'text-amber-700 bg-amber-50 border border-amber-200';
      case 'responded': return 'text-blue-700 bg-blue-50 border border-blue-200';
      case 'cancelled':
      case 'rejected': return 'text-red-700 bg-red-50 border border-red-200';
      default: return 'text-gray-700 bg-gray-50 border border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'accepted':
      case 'confirmed': return <CheckCircle size={14} />;
      case 'pending': return <Clock size={14} />;
      case 'responded': return <AlertCircle size={14} />;
      case 'cancelled':
      case 'rejected': return <XCircle size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  const navItems = [
    { key: 'orders' as const, label: 'My Orders', icon: Package, count: orders.length },
    { key: 'quotes' as const, label: 'Quote Requests', icon: FileText, count: quotes.length },
    { key: 'warranties' as const, label: 'Warranties', icon: Shield, count: warranties.length },
    { key: 'invoices' as const, label: 'Invoices', icon: Download, count: invoices.length },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* ─── Compact Dark Header ─── */}
      <div className="bg-gray-900 pt-[68px] pb-3">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs mb-1">
            <Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 text-gray-600" />
            <span className="text-white font-medium">My Account</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">My Account</h1>
        </div>
      </div>

      {/* ─── Main Layout ─── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ─── Sidebar ─── */}
          <aside className="w-full lg:w-[280px] flex-shrink-0">
            {/* Account Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 mb-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 truncate">{user?.name}</h2>
                  <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold">
                  <Award size={12} />
                  {user?.role === 'retailer' ? 'Retailer' : user?.role === 'admin' ? 'Admin' : 'Member'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                  <Sparkles size={12} />
                  Active
                </span>
              </div>
            </div>

            {/* Navigation — Desktop */}
            <nav className="hidden lg:block bg-white rounded-2xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden mb-6">
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Dashboard</p>
              </div>
              {navItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-all duration-200 border-l-[3px] ${
                    activeTab === item.key
                      ? 'bg-teal-50/60 text-teal-700 border-l-teal-600'
                      : 'text-gray-600 hover:bg-gray-50 border-l-transparent hover:text-gray-900'
                  }`}
                >
                  <item.icon size={18} className={activeTab === item.key ? 'text-teal-600' : 'text-gray-400'} />
                  <span className="flex-1 text-left">{item.label}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    activeTab === item.key ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {item.count}
                  </span>
                </button>
              ))}
            </nav>

            {/* Quick Links */}
            <div className="hidden lg:block bg-white rounded-2xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Quick Links</p>
              </div>
              <Link
                to="/products"
                className="flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <ShoppingCart size={18} className="text-gray-400" />
                <span>Browse Products</span>
                <ChevronRight size={14} className="ml-auto text-gray-300" />
              </Link>
              <Link
                to="/warranty-registration"
                className="flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors border-t border-gray-50"
              >
                <Shield size={18} className="text-gray-400" />
                <span>Register Warranty</span>
                <ChevronRight size={14} className="ml-auto text-gray-300" />
              </Link>
            </div>
          </aside>

          {/* ─── Main Content Area ─── */}
          <main className="flex-1 min-w-0">

            {/* Mobile Navigation */}
            <div className="lg:hidden mb-6 overflow-x-auto">
              <div className="flex gap-2 min-w-max pb-2">
                {navItems.map(item => (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-none text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                      activeTab === item.key
                        ? 'bg-teal-600 text-white shadow-none'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon size={16} />
                    {item.label}
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                      activeTab === item.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-none border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 border-l-4 border-l-blue-500">
                <p className="text-xs font-medium text-gray-500 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
              <div className="bg-white rounded-none border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 border-l-4 border-l-purple-500">
                <p className="text-xs font-medium text-gray-500 mb-1">Quote Requests</p>
                <p className="text-2xl font-bold text-gray-900">{quotes.length}</p>
              </div>
              <div className="bg-white rounded-none border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 border-l-4 border-l-emerald-500">
                <p className="text-xs font-medium text-gray-500 mb-1">Warranties</p>
                <p className="text-2xl font-bold text-gray-900">{warranties.length}</p>
              </div>
              <div className="bg-white rounded-none border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 border-l-4 border-l-amber-500">
                <p className="text-xs font-medium text-gray-500 mb-1">Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
              </div>
            </div>

            {/* ════════════════════════════════════════════ */}
            {/* ORDERS TAB                                  */}
            {/* ════════════════════════════════════════════ */}
            {activeTab === 'orders' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">My Orders</h2>
                  <span className="text-sm text-gray-500">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
                </div>

                {orders.length === 0 ? (
                  <div className="bg-white rounded-none border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
                      <Package size={36} className="text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">When you place orders, they'll appear here so you can track and manage them.</p>
                    <Link
                      to="/products"
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-none hover:bg-teal-700 transition-colors shadow-none"
                    >
                      <ShoppingCart size={16} />
                      Browse Products
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {orders.map(order => (
                      <div key={order._id} className="bg-white rounded-none border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
                        {/* Order Header */}
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-6">
                              <div>
                                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Order ID</p>
                                <p className="text-sm font-bold text-gray-900 font-mono">#{order._id.slice(-8).toUpperCase()}</p>
                              </div>
                              <div>
                                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Placed on</p>
                                <p className="text-sm font-medium text-gray-700">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                              </div>
                              <div>
                                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Total</p>
                                <p className="text-sm font-bold text-gray-900">₹{order.totalAmount?.toLocaleString()}</p>
                              </div>
                              {order.isQuoteBased && (
                                <div>
                                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Discount</p>
                                  <p className="text-sm font-semibold text-emerald-600">{order.discountApplied}% OFF</p>
                                </div>
                              )}
                            </div>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-semibold ${getStatusColor(order.orderStatus)}`}>
                              {getStatusIcon(order.orderStatus)}
                              {order.orderStatus}
                            </span>
                          </div>
                        </div>

                        {/* Order Products */}
                        <div className="p-6">
                          <div className="space-y-4">
                            {order.products.map((p: any) => (
                              <div key={p._id} className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-none bg-gray-100 flex items-center justify-center flex-shrink-0">
                                      <Package size={18} className="text-gray-400" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">{p.product?.name || 'Product Unavailable'}</p>
                                      <p className="text-xs text-gray-500">Qty: {p.quantity} × ₹{p.price?.toLocaleString()}</p>
                                    </div>
                                  </div>
                                  <p className="text-sm font-bold text-gray-900">₹{(p.price * p.quantity)?.toLocaleString()}</p>
                                </div>

                                {/* Serial Numbers */}
                                {p.serialNumbers && p.serialNumbers.length > 0 && (
                                  <div className="ml-13 pl-13">
                                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Serial Numbers</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {p.serialNumbers.map((sn: string) => (
                                        <span key={sn} className="inline-flex items-center px-2.5 py-1 rounded-none text-xs font-mono font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                          {sn}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Brochure Download */}
                                {p.product?.brochureUrl && (
                                  <div className="ml-13">
                                    <button
                                      onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = p.product.brochureUrl;
                                        link.download = `${p.product.name.replace(/[^a-z0-9]/gi, '_')}_Brochure.pdf`;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      }}
                                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-none hover:bg-gray-200 transition-colors border border-gray-200"
                                    >
                                      <Download size={14} />
                                      Product Brochure
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Tracking Information */}
                          {(order.deliveryTrackingLink || order.trackingId) && (
                            <div className="mt-6 pt-5 border-t border-gray-100">
                              <div className="bg-blue-50 rounded-none p-5 border border-blue-200">
                                <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                  <Package size={16} className="text-blue-600" />
                                  Tracking Information
                                </h4>
                                
                                {order.trackingId && (
                                  <div className="mb-4">
                                    <p className="text-xs text-gray-600 mb-1.5">Tracking ID</p>
                                    <div className="flex items-center gap-3">
                                      <code className="text-sm font-bold text-blue-700 bg-white px-4 py-2 rounded-none border border-blue-200 font-mono">
                                        {order.trackingId}
                                      </code>
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(order.trackingId);
                                          alert('Tracking ID copied to clipboard!');
                                        }}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2"
                                      >
                                        Copy
                                      </button>
                                    </div>
                                  </div>
                                )}
                                
                                {order.deliveryTrackingLink && (
                                  <a
                                    href={order.deliveryTrackingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-none hover:bg-blue-700 transition-colors shadow-none"
                                  >
                                    <ExternalLink size={16} />
                                    Track Package
                                  </a>
                                )}
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

            {/* ════════════════════════════════════════════ */}
            {/* QUOTES TAB                                  */}
            {/* ════════════════════════════════════════════ */}
            {activeTab === 'quotes' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Quote Requests</h2>
                  <span className="text-sm text-gray-500">{quotes.length} total</span>
                </div>

                {/* Date Filter */}
                <DateFilter
                  dateFrom={quoteDateFrom}
                  dateTo={quoteDateTo}
                  onDateFromChange={setQuoteDateFrom}
                  onDateToChange={setQuoteDateTo}
                  label="Filter Quotes by Date"
                  className="mb-6 !rounded-none"
                />

                {/* Active Quotes */}
                <div className="mb-10">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                    Active Quotes
                  </h3>
                  {filteredQuotes.filter(q => q.status !== 'completed').length === 0 ? (
                    <div className="bg-white rounded-none border border-dashed border-gray-300 p-12 text-center">
                      <FileText size={36} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-sm text-gray-500">No active quotes found.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredQuotes.filter(q => q.status !== 'completed').map(quote => {
                        const isExpanded = expandedQuotes.has(quote._id);
                        return (
                        <div key={quote._id} className="bg-white rounded-none border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden hover:shadow-none transition-shadow">
                          <div className="p-6">
                            {/* Quote Summary Row */}
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                              <div className="flex items-center gap-4">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-semibold ${getStatusColor(quote.status)}`}>
                                  {getStatusIcon(quote.status)}
                                  {quote.status}
                                </span>
                                <span className="text-xs text-gray-400">{new Date(quote.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              </div>
                              {quote.adminResponse && (
                                <span className="text-lg font-bold text-gray-900">₹{quote.adminResponse.totalPrice?.toLocaleString()}</span>
                              )}
                            </div>

                            {/* Product Preview */}
                            <div className="mb-4">
                              <p className="text-sm font-semibold text-gray-900">
                                {quote.products.length} Product{quote.products.length > 1 ? 's' : ''} Requested
                              </p>
                              {!isExpanded && quote.products.length > 0 && (
                                <p className="text-sm text-gray-500 mt-0.5">
                                  {quote.products[0].product?.name || 'Product Unavailable'}
                                  {quote.products.length > 1 && ` +${quote.products.length - 1} more`}
                                </p>
                              )}
                            </div>

                            {/* Expand/Collapse */}
                            <button
                              onClick={() => toggleQuoteExpand(quote._id)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-none transition-colors text-sm font-medium border border-gray-200"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp size={16} />
                                  Hide Details
                                </>
                              ) : (
                                <>
                                  <ChevronDown size={16} />
                                  View Quote Details
                                </>
                              )}
                            </button>

                            {/* Expanded Content */}
                            {isExpanded && (
                              <div className="mt-5 pt-5 border-t border-gray-100 space-y-4">
                                <div>
                                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Products</p>
                                  <div className="space-y-2">
                                    {quote.products.map((p: any) => (
                                      <div key={p._id} className="flex justify-between items-center bg-gray-50 p-3 rounded-none">
                                        <span className="text-sm text-gray-700 font-medium">{p.product?.name || 'Product Unavailable'}</span>
                                        <span className="text-xs text-gray-500 font-semibold bg-white px-2 py-1 rounded border border-gray-200">Qty: {p.quantity}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {quote.message && (
                                  <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Your Message</p>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-none border border-gray-100 leading-relaxed">{quote.message}</p>
                                  </div>
                                )}

                                {quote.adminResponse && (
                                  <div className="bg-teal-50 p-5 rounded-none border border-teal-200">
                                    <h4 className="text-sm font-bold text-teal-800 mb-3 flex items-center gap-2">
                                      <Sparkles size={14} />
                                      Admin Response
                                    </h4>
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-sm text-teal-700">Offered Price</span>
                                      <span className="text-lg font-bold text-teal-900">₹{quote.adminResponse.totalPrice?.toLocaleString()}</span>
                                    </div>
                                    {quote.adminResponse.discountPercentage > 0 && (
                                      <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-teal-700">Discount</span>
                                        <span className="text-sm font-bold text-emerald-600">{quote.adminResponse.discountPercentage}% OFF</span>
                                      </div>
                                    )}
                                    {quote.adminResponse.message && (
                                      <p className="text-sm text-teal-800 mt-3 pt-3 border-t border-teal-200">{quote.adminResponse.message}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Action Buttons */}
                            {quote.status === 'responded' && (
                              <div className="flex gap-3 mt-5">
                                <button
                                  onClick={() => acceptQuote(quote._id)}
                                  disabled={actionLoading}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-none hover:bg-emerald-700 disabled:bg-gray-300 transition-colors text-sm font-semibold shadow-none"
                                >
                                  <ThumbsUp size={16} />
                                  Accept Quote
                                </button>
                                <button
                                  onClick={() => rejectQuote(quote._id)}
                                  disabled={actionLoading}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-red-600 border border-red-200 rounded-none hover:bg-red-50 disabled:bg-gray-100 transition-colors text-sm font-semibold"
                                >
                                  <ThumbsDown size={16} />
                                  Decline
                                </button>
                              </div>
                            )}

                            {quote.status === 'accepted' && (
                              <div className="mt-5">
                                {quote.orderId ? (
                                  <button
                                    onClick={() => setActiveTab('orders')}
                                    className="w-full px-4 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-none hover:bg-blue-100 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                                  >
                                    <CheckCircle size={16} />
                                    Order Created — View in Orders
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => proceedToCheckout(quote)}
                                    disabled={actionLoading}
                                    className="w-full px-4 py-2.5 bg-teal-600 text-white rounded-none hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-semibold flex items-center justify-center gap-2 shadow-none"
                                  >
                                    {actionLoading ? (
                                      <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Processing...
                                      </>
                                    ) : (
                                      <>
                                        <ShoppingCart size={16} />
                                        Proceed to Checkout
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )})}
                    </div>
                  )}
                </div>

                {/* Quote History */}
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    Quote History
                  </h3>
                  {filteredQuotes.filter(q => q.status === 'completed').length === 0 ? (
                    <div className="bg-white rounded-none border border-dashed border-gray-300 p-12 text-center">
                      <Clock size={36} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-sm text-gray-500">No completed quotes found.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredQuotes.filter(q => q.status === 'completed').map(quote => {
                        const isExpanded = expandedQuotes.has(quote._id);
                        return (
                        <div key={quote._id} className="bg-white rounded-none border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                          <div className="p-6">
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                              <div className="flex items-center gap-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
                                  <CheckCircle size={14} />
                                  Completed
                                </span>
                                <span className="text-xs text-gray-400">{new Date(quote.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              </div>
                              {quote.adminResponse && (
                                <span className="text-lg font-bold text-gray-900">₹{quote.adminResponse.totalPrice?.toLocaleString()}</span>
                              )}
                            </div>

                            <p className="text-sm font-semibold text-gray-700 mb-3">
                              {quote.products.length} Product{quote.products.length > 1 ? 's' : ''} Purchased
                              {!isExpanded && quote.products.length > 0 && (
                                <span className="text-gray-500 font-normal ml-2">
                                  — {quote.products[0].product?.name || 'Product Unavailable'}
                                  {quote.products.length > 1 && ` +${quote.products.length - 1} more`}
                                </span>
                              )}
                            </p>

                            <button
                              onClick={() => toggleQuoteExpand(quote._id)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-none transition-colors text-sm font-medium"
                            >
                              {isExpanded ? <><ChevronUp size={16} /> Hide</> : <><ChevronDown size={16} /> Details</>}
                            </button>

                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                                {quote.products.map((p: any) => (
                                  <div key={p._id} className="flex justify-between items-center bg-gray-50 p-3 rounded-none">
                                    <span className="text-sm text-gray-700">{p.product?.name || 'Product Unavailable'}</span>
                                    <span className="text-xs text-gray-500">Qty: {p.quantity}</span>
                                  </div>
                                ))}
                                {quote.adminResponse && (
                                  <div className="bg-gray-50 p-4 rounded-none border border-gray-200">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600">Final Price</span>
                                      <span className="text-base font-bold text-gray-900">₹{quote.adminResponse.totalPrice?.toLocaleString()}</span>
                                    </div>
                                    {quote.adminResponse.discountPercentage > 0 && (
                                      <div className="flex justify-between items-center mt-2">
                                        <span className="text-sm text-gray-600">Discount</span>
                                        <span className="text-sm font-bold text-emerald-600">{quote.adminResponse.discountPercentage}% OFF</span>
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

            {/* ════════════════════════════════════════════ */}
            {/* WARRANTIES TAB                              */}
            {/* ════════════════════════════════════════════ */}
            {activeTab === 'warranties' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">My Warranties</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {warranties.filter((w: any) => w.status === 'approved').length} active · {warranties.filter((w: any) => w.status === 'pending').length} pending
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/warranty-registration')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-none hover:bg-teal-700 transition-colors shadow-none"
                  >
                    <Shield size={16} />
                    Register New
                  </button>
                </div>

                {warranties.length === 0 ? (
                  <div className="bg-white rounded-none border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
                      <Shield size={36} className="text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No warranties registered</h3>
                    <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">Register your product warranties to track coverage and access certificates.</p>
                    <button
                      onClick={() => navigate('/warranty-registration')}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-none hover:bg-teal-700 transition-colors shadow-none"
                    >
                      <Shield size={16} />
                      Register Warranty
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* Active Warranties */}
                    {warranties.filter((w: any) => w.status === 'approved').length > 0 && (
                      <div className="mb-10">
                        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          Active Warranties
                        </h3>
                        <div className="grid md:grid-cols-2 gap-5">
                          {warranties
                            .filter((w: any) => w.status === 'approved')
                            .map((warranty: any) => {
                              const endDate = new Date(warranty.warrantyEndDate);
                              const startDate = new Date(warranty.warrantyStartDate);
                              const now = new Date();
                              const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                              const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                              const progressPct = Math.max(0, Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100));
                              const isExpired = daysRemaining < 0;
                              const isExpiringSoon = daysRemaining <= 30 && daysRemaining > 0;

                              return (
                                <div
                                  key={warranty._id}
                                  className="bg-white rounded-none border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden"
                                >
                                  <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Shield className="text-emerald-600 flex-shrink-0" size={20} />
                                          <h3 className="font-bold text-base text-gray-900 truncate">{warranty.productName}</h3>
                                        </div>
                                        <p className="text-xs text-gray-500 font-mono ml-7">S/N: {warranty.serialNumber}</p>
                                      </div>
                                      <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-none ${
                                        isExpired ? 'bg-red-100 text-red-700 border border-red-200' :
                                        isExpiringSoon ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                        'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                      }`}>
                                        {isExpired ? 'EXPIRED' : isExpiringSoon ? 'EXPIRING' : 'ACTIVE'}
                                      </span>
                                    </div>

                                    {/* Product Details */}
                                    <div className="grid grid-cols-2 gap-3 mb-5">
                                      <div className="bg-gray-50 rounded-none p-3">
                                        <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Model</p>
                                        <p className="text-sm font-semibold text-gray-900 mt-0.5">{warranty.modelNumber}</p>
                                      </div>
                                      <div className="bg-gray-50 rounded-none p-3">
                                        <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Purchased</p>
                                        <p className="text-sm font-semibold text-gray-900 mt-0.5">
                                          {new Date(warranty.purchaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Warranty Progress Bar */}
                                    <div className="mb-5">
                                      <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                          <Calendar size={12} />
                                          {warranty.warrantyPeriodMonths || 12} month warranty
                                        </p>
                                        <p className={`text-xs font-bold ${
                                          isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-emerald-600'
                                        }`}>
                                          {isExpired ? 'Expired' : `${daysRemaining} days left`}
                                        </p>
                                      </div>
                                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full transition-all duration-500 ${
                                            isExpired ? 'bg-red-500' : isExpiringSoon ? 'bg-amber-500' : 'bg-emerald-500'
                                          }`}
                                          style={{ width: `${isExpired ? 100 : progressPct}%` }}
                                        ></div>
                                      </div>
                                      <div className="flex justify-between mt-1.5">
                                        <span className="text-[10px] text-gray-400">{startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                                        <span className="text-[10px] text-gray-400">{endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                                      </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                      {warranty.warrantyCertificateUrl && (
                                        <a
                                          href={warranty.warrantyCertificateUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-center py-2.5 rounded-none text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                                        >
                                          <Download size={14} />
                                          Certificate
                                        </a>
                                      )}
                                      {warranty.invoice && (
                                        <a
                                          href={warranty.invoice}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-center py-2.5 rounded-none text-sm font-semibold flex items-center justify-center gap-2 transition-colors border border-gray-200"
                                        >
                                          <Eye size={14} />
                                          Invoice
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Pending/Other Warranties */}
                    {warranties.filter((w: any) => w.status !== 'approved').length > 0 && (
                      <div>
                        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                          Pending Registrations
                        </h3>
                        <div className="space-y-4">
                          {warranties
                            .filter((w: any) => w.status !== 'approved')
                            .map((warranty: any) => (
                              <div
                                key={warranty._id}
                                className="bg-white rounded-none border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6"
                              >
                                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                  <div>
                                    <h3 className="font-bold text-base text-gray-900">{warranty.productName}</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      Registered {new Date(warranty.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                  </div>
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-semibold ${getStatusColor(warranty.status)}`}>
                                    {getStatusIcon(warranty.status)}
                                    {warranty.status.charAt(0).toUpperCase() + warranty.status.slice(1)}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                  <div className="bg-gray-50 rounded-none p-3">
                                    <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Serial</p>
                                    <p className="text-sm font-semibold text-gray-900 mt-0.5 font-mono">{warranty.serialNumber}</p>
                                  </div>
                                  <div className="bg-gray-50 rounded-none p-3">
                                    <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Model</p>
                                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{warranty.modelNumber}</p>
                                  </div>
                                  <div className="bg-gray-50 rounded-none p-3">
                                    <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Purchased</p>
                                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{new Date(warranty.purchaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                  </div>
                                  <div className="bg-gray-50 rounded-none p-3">
                                    <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Type</p>
                                    <p className="text-sm font-semibold text-gray-900 mt-0.5 capitalize">{warranty.purchaseType.replace('_', ' ')}</p>
                                  </div>
                                </div>

                                {warranty.rejectionReason && (
                                  <div className="bg-red-50 border border-red-200 rounded-none p-4 mb-3">
                                    <p className="text-xs text-red-700 font-semibold mb-1">Rejection Reason</p>
                                    <p className="text-sm text-red-800">{warranty.rejectionReason}</p>
                                  </div>
                                )}

                                {warranty.invoice && (
                                  <a
                                    href={warranty.invoice}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-teal-600 hover:text-teal-800 text-sm font-medium transition-colors"
                                  >
                                    <Eye size={16} />
                                    View Invoice
                                  </a>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ════════════════════════════════════════════ */}
            {/* INVOICES TAB                                */}
            {/* ════════════════════════════════════════════ */}
            {activeTab === 'invoices' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Invoices</h2>
                  <span className="text-sm text-gray-500">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</span>
                </div>

                {invoices.length === 0 ? (
                  <div className="bg-white rounded-none border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
                      <Download size={36} className="text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No invoices yet</h3>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto">Invoices will appear here once your orders are processed.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-none border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
                    {/* Desktop Table Header */}
                    <div className="hidden md:grid grid-cols-6 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      <span>Invoice</span>
                      <span>Order</span>
                      <span>Amount</span>
                      <span>Date</span>
                      <span>Status</span>
                      <span>Actions</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {invoices.map((invoice: any) => (
                        <div key={invoice._id} className="px-6 py-4 hover:bg-gray-50/50 transition-colors">
                          {/* Desktop Row */}
                          <div className="hidden md:grid grid-cols-6 gap-4 items-center">
                            <span className="text-sm font-bold text-gray-900 font-mono">
                              #{invoice.invoiceNumber || invoice._id.slice(-8).toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-600 font-mono">
                              #{invoice.order?._id?.slice(-8).toUpperCase() || 'N/A'}
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                              ₹{invoice.totalAmount?.toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-600">
                              {new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span>
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-none text-xs font-semibold ${
                                invoice.paymentStatus === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : invoice.paymentStatus === 'pending'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                                {invoice.paymentStatus?.toUpperCase() || 'PENDING'}
                              </span>
                            </span>
                            <span>
                              {invoice.invoiceUrl ? (
                                <a
                                  href={invoice.invoiceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-teal-600 hover:text-teal-800 text-sm font-semibold transition-colors"
                                >
                                  <Download size={14} />
                                  Download
                                </a>
                              ) : (
                                <button
                                  onClick={() => downloadInvoice(invoice._id)}
                                  className="inline-flex items-center gap-1.5 text-teal-600 hover:text-teal-800 text-sm font-semibold transition-colors"
                                >
                                  <Download size={14} />
                                  Download
                                </button>
                              )}
                            </span>
                          </div>

                          {/* Mobile Card */}
                          <div className="md:hidden">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-bold text-gray-900 font-mono">
                                #{invoice.invoiceNumber || invoice._id.slice(-8).toUpperCase()}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-none text-xs font-semibold ${
                                invoice.paymentStatus === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : invoice.paymentStatus === 'pending'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                                {invoice.paymentStatus?.toUpperCase() || 'PENDING'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Amount</p>
                                <p className="text-sm font-bold text-gray-900">₹{invoice.totalAmount?.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Date</p>
                                <p className="text-sm text-gray-600">{new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                              </div>
                            </div>
                            {invoice.invoiceUrl ? (
                              <a
                                href={invoice.invoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-teal-600 hover:text-teal-800 text-sm font-semibold"
                              >
                                <Download size={14} />
                                Download Invoice
                              </a>
                            ) : (
                              <button
                                onClick={() => downloadInvoice(invoice._id)}
                                className="inline-flex items-center gap-1.5 text-teal-600 hover:text-teal-800 text-sm font-semibold"
                              >
                                <Download size={14} />
                                Download Invoice
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </main>
        </div>
      </div>

      {/* ─── Address Modal ─── */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-none shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-5 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MapPin size={20} className="text-teal-600" />
                Shipping Address
              </h2>
              <button
                onClick={() => {
                  setShowAddressModal(false);
                  setActionLoading(false);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-none hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Full Name and Phone */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="modal-fullName" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    <User size={14} className="inline mr-1 text-gray-400" />
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="modal-fullName"
                    required
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-none shadow-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm transition-colors"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label htmlFor="modal-phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    <Phone size={14} className="inline mr-1 text-gray-400" />
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="modal-phone"
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-none shadow-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm transition-colors"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              {/* Street Address */}
              <div>
                <label htmlFor="modal-streetAddress" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  <Building2 size={14} className="inline mr-1 text-gray-400" />
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="modal-streetAddress"
                  required
                  value={addressForm.streetAddress}
                  onChange={(e) => setAddressForm({ ...addressForm, streetAddress: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-none shadow-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm transition-colors"
                  placeholder="House No, Building Name, Street"
                />
              </div>

              {/* Landmark */}
              <div>
                <label htmlFor="modal-landmark" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Landmark <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  id="modal-landmark"
                  value={addressForm.landmark}
                  onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-none shadow-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm transition-colors"
                  placeholder="Near Park, Behind Mall, etc."
                />
              </div>

              {/* City, State, Pincode */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="modal-city" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="modal-city"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-none shadow-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm transition-colors"
                    placeholder="Mumbai"
                  />
                </div>
                <div>
                  <label htmlFor="modal-state" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="modal-state"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-none shadow-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm transition-colors"
                    placeholder="Maharashtra"
                  />
                </div>
                <div>
                  <label htmlFor="modal-pincode" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="modal-pincode"
                    required
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-none shadow-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm transition-colors"
                    placeholder="400001"
                    maxLength={6}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  onClick={handleAddressSubmit}
                  disabled={actionLoading}
                  className="flex-1 bg-teal-600 text-white px-6 py-3 rounded-none hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold flex items-center justify-center transition-colors shadow-none text-sm"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
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
                  className="px-6 py-3 border border-gray-300 rounded-none text-gray-700 hover:bg-gray-50 disabled:opacity-50 font-semibold transition-colors text-sm"
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
