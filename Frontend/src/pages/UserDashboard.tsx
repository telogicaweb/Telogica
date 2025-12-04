import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Package, FileText, Clock, CheckCircle, XCircle, AlertCircle, ThumbsUp, ThumbsDown } from 'lucide-react';

const UserDashboard = () => {
  const { user } = useContext(AuthContext)!;
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'quotes'>('orders');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const ordersRes = await axios.get('http://localhost:5000/api/orders/myorders', {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setOrders(ordersRes.data);

      const quotesRes = await axios.get('http://localhost:5000/api/quotes', {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setQuotes(quotesRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data", error);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const acceptQuote = async (quoteId: string) => {
    if (!confirm('Are you sure you want to accept this quote?')) return;
    
    setLoading(true);
    try {
      await axios.put(`http://localhost:5000/api/quotes/${quoteId}/accept`, {}, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      alert('Quote accepted! You can now proceed to checkout with this quote.');
      fetchData();
    } catch (error: any) {
      console.error('Error accepting quote', error);
      alert(error.response?.data?.message || 'Failed to accept quote');
    } finally {
      setLoading(false);
    }
  };

  const rejectQuote = async (quoteId: string) => {
    if (!confirm('Are you sure you want to reject this quote?')) return;
    
    setLoading(true);
    try {
      await axios.put(`http://localhost:5000/api/quotes/${quoteId}/reject`, {}, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      alert('Quote rejected.');
      fetchData();
    } catch (error: any) {
      console.error('Error rejecting quote', error);
      alert(error.response?.data?.message || 'Failed to reject quote');
    } finally {
      setLoading(false);
    }
  };

  const proceedToCheckout = async (quote: any) => {
    setLoading(true);
    try {
      const { data } = await axios.post('http://localhost:5000/api/orders', {
        products: quote.products.map((item: any) => ({
          product: item.product._id,
          quantity: item.quantity,
          price: quote.adminResponse.totalPrice / quote.products.reduce((sum: number, p: any) => sum + p.quantity, 0)
        })),
        totalAmount: quote.adminResponse.totalPrice,
        shippingAddress: user?.address || 'Default Address',
        quoteId: quote._id
      }, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });

      alert('Order created with quote pricing! Proceed to payment.');
      // Here you would integrate Razorpay
      navigate('/user-dashboard');
      fetchData();
    } catch (error: any) {
      console.error('Error creating order', error);
      alert(error.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'accepted': return 'text-green-600 bg-green-100';
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
      case 'accepted': return <CheckCircle size={16} />;
      case 'pending': return <Clock size={16} />;
      case 'responded': return <AlertCircle size={16} />;
      case 'cancelled':
      case 'rejected': return <XCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-500 mt-2">Welcome back, {user?.name}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'orders'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package size={18} />
                Order History
              </button>
              <button
                onClick={() => setActiveTab('quotes')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'quotes'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText size={18} />
                My Quotes
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
                            <p className="font-medium text-gray-900">${order.totalAmount}</p>
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
                              <li key={p._id} className="py-4 flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-900">{p.product.name}</p>
                                    <p className="text-sm text-gray-500">Qty: {p.quantity}</p>
                                  </div>
                                </div>
                                <p className="text-sm font-medium text-gray-900">${p.price}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'quotes' && (
              <div>
                {quotes.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No quotes found.</p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {quotes.map(quote => (
                      <div key={quote._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                            {getStatusIcon(quote.status)}
                            {quote.status}
                          </span>
                          <span className="text-xs text-gray-500">{new Date(quote.createdAt).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Products:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {quote.products.map((p: any) => (
                              <li key={p._id} className="flex justify-between">
                                <span>{p.product.name}</span>
                                <span className="text-gray-500">Qty: {p.quantity}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {quote.message && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Your Message:</h4>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{quote.message}</p>
                          </div>
                        )}

                        {quote.adminResponse && (
                          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-4">
                            <h4 className="text-sm font-bold text-indigo-900 mb-2">Admin Response</h4>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-indigo-700">Offered Price:</span>
                              <span className="text-lg font-bold text-indigo-900">${quote.adminResponse.totalPrice}</span>
                            </div>
                            {quote.adminResponse.discountPercentage > 0 && (
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-indigo-700">Discount:</span>
                                <span className="text-sm font-semibold text-green-600">{quote.adminResponse.discountPercentage}% OFF</span>
                              </div>
                            )}
                            <p className="text-sm text-indigo-800">{quote.adminResponse.message}</p>
                          </div>
                        )}

                        {quote.status === 'responded' && (
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => acceptQuote(quote._id)}
                              disabled={loading}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
                            >
                              <ThumbsUp size={16} />
                              Accept
                            </button>
                            <button
                              onClick={() => rejectQuote(quote._id)}
                              disabled={loading}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
                            >
                              <ThumbsDown size={16} />
                              Reject
                            </button>
                          </div>
                        )}

                        {quote.status === 'accepted' && !quote.orderId && (
                          <button
                            onClick={() => proceedToCheckout(quote)}
                            disabled={loading}
                            className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
                          >
                            Proceed to Checkout
                          </button>
                        )}

                        {quote.orderId && (
                          <div className="mt-4 text-center text-sm text-green-600 font-medium">
                            ✓ Order placed successfully
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
