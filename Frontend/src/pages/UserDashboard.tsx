import { useEffect, useState, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Package, FileText, Clock, CheckCircle, XCircle, AlertCircle, ThumbsUp, ThumbsDown, Shield, Download, Eye } from 'lucide-react';

const UserDashboard = () => {
  const { user } = useContext(AuthContext)!;
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'quotes' | 'warranties' | 'invoices'>('orders');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
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
    if (user) fetchData();
  }, [user]);

  const acceptQuote = async (quoteId: string) => {
    if (!confirm('Are you sure you want to accept this quote?')) return;
    
    setLoading(true);
    try {
      await api.put(`/api/quotes/${quoteId}/accept`);
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
      await api.put(`/api/quotes/${quoteId}/reject`);
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
      const totalQty = quote.products.reduce((sum: number, p: any) => sum + p.quantity, 0);
      const totalPrice = quote.adminResponse?.totalPrice || quote.quotedPrice || 0;

      const products = quote.products.map((item: any) => ({
        product: item.product._id, // Changed from productId to product to match backend schema
        quantity: item.quantity,
        price: totalQty > 0 ? totalPrice / totalQty : 0
      }));

      const shippingAddress = prompt("Please enter your shipping address:", user.address || "");
      if (!shippingAddress) {
        setLoading(false);
        return;
      }

      const { data } = await api.post('/api/orders', {
        products,
        totalAmount: totalPrice,
        quoteId: quote._id,
        shippingAddress
      });

      // Razorpay Integration
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_Rnat5mGdrSJJX4",
        amount: data.razorpayOrder.amount,
        currency: data.razorpayOrder.currency,
        name: "Telogica",
        description: "Quote Order Payment",
        order_id: data.razorpayOrder.id,
        handler: async function (response: any) {
          try {
            await api.post('/api/orders/verify', {
              orderId: data.order._id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            alert('Payment Successful!');
            fetchData();
          } catch (error) {
            alert('Payment Verification Failed');
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

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.on('payment.failed', function (response: any){
        alert(response.error.description);
      });
      rzp1.open();

    } catch (error: any) {
      console.error('Error creating order', error);
      if (error.response?.status === 401) {
        alert('Session expired. Please login again.');
        return;
      }
      alert(error.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (invoiceId: string) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}/download`, {
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
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-500 mt-2">Welcome back, {user?.name}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package size={18} />
                Orders
              </button>
              <button
                onClick={() => setActiveTab('quotes')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'quotes'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText size={18} />
                Quotes
              </button>
              <button
                onClick={() => setActiveTab('warranties')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'warranties'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Shield size={18} />
                Warranties
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'invoices'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Download size={18} />
                Invoices
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
                              <li key={p._id} className="py-4 flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-900">{p.product.name}</p>
                                    <p className="text-sm text-gray-500">Qty: {p.quantity}</p>
                                  </div>
                                </div>
                                <p className="text-sm font-medium text-gray-900">₹{p.price}</p>
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
                              <span className="text-lg font-bold text-indigo-900">₹{quote.adminResponse.totalPrice}</span>
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

                        {quote.status === 'accepted' && (
                          <button
                            onClick={() => proceedToCheckout(quote)}
                            disabled={loading}
                            className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
                          >
                            Proceed to Checkout
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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

                          {warranty.invoiceUrl && (
                            <div className="flex gap-2">
                              <a
                                href={warranty.invoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1"
                              >
                                <Eye size={16} />
                                View Invoice
                              </a>
                            </div>
                          )}
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
                                #{invoice.orderId?._id?.slice(-8).toUpperCase() || 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                ₹{invoice.totalAmount?.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {new Date(invoice.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Paid
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
    </div>
  );
};

export default UserDashboard;
