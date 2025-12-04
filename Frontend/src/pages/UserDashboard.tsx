import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Package, FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const UserDashboard = () => {
  const { user } = useContext(AuthContext)!;
  const [orders, setOrders] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'quotes'>('orders');

  useEffect(() => {
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
    if (user) fetchData();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <CheckCircle size={16} />;
      case 'pending': return <Clock size={16} />;
      case 'cancelled': return <XCircle size={16} />;
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
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Request Message:</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{quote.message}</p>
                        </div>

                        {quote.adminResponse && (
                          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                            <h4 className="text-sm font-bold text-indigo-900 mb-2">Admin Response</h4>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-indigo-700">Offered Price:</span>
                              <span className="text-lg font-bold text-indigo-900">${quote.adminResponse.price}</span>
                            </div>
                            <p className="text-sm text-indigo-800">{quote.adminResponse.message}</p>
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
