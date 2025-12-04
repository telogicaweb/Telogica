import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user, loading } = useContext(AuthContext)!;
  const [users, setUsers] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('users');
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchUsers();
      fetchQuotes();
    }
  }, [user]);

  const fetchUsers = async () => {
    const { data } = await axios.get('http://localhost:5000/api/auth/users', {
      headers: { Authorization: `Bearer ${user?.token}` }
    });
    setUsers(data);
  };

  const fetchQuotes = async () => {
    const { data } = await axios.get('http://localhost:5000/api/quotes', {
      headers: { Authorization: `Bearer ${user?.token}` }
    });
    setQuotes(data);
  };

  const approveRetailer = async (id: string) => {
    await axios.put(`http://localhost:5000/api/auth/approve/${id}`, {}, {
      headers: { Authorization: `Bearer ${user?.token}` }
    });
    fetchUsers();
  };

  const respondToQuote = async (quote: any) => {
    // Calculate original total
    const originalTotal = quote.products.reduce((sum: number, p: any) => {
      return sum + (p.originalPrice || 0) * p.quantity;
    }, 0);

    const totalPriceInput = prompt(`Enter Total Discounted Price (Original: $${originalTotal}):`);
    const discountPercentageInput = prompt('Enter Discount Percentage (e.g., 10 for 10%):');
    const message = prompt('Enter Message:');
    
    if (totalPriceInput && discountPercentageInput && message) {
      const totalPrice = parseFloat(totalPriceInput);
      const discountPercentage = parseFloat(discountPercentageInput);
      
      await axios.put(`http://localhost:5000/api/quotes/${quote._id}/respond`, { 
        totalPrice, 
        discountPercentage,
        message 
      }, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      fetchQuotes();
    }
  };

  if (loading || !user || user.role !== 'admin') return <p>Loading...</p>;

  return (
    <div className="container mx-auto p-4 pt-24">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="flex gap-4 mb-6">
        <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded ${activeTab === 'users' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Users</button>
        <button onClick={() => setActiveTab('quotes')} className={`px-4 py-2 rounded ${activeTab === 'quotes' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Quotes</button>
      </div>

      {activeTab === 'users' && (
        <div>
          <h2 className="text-xl font-bold mb-4">Users & Retailers</h2>
          <div className="overflow-x-auto">
            <table className="w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Role</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td className="p-2 border">{u.name}</td>
                    <td className="p-2 border">{u.email}</td>
                    <td className="p-2 border">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'retailer' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-2 border">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        u.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {u.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="p-2 border">
                      {u.role === 'retailer' && !u.isApproved && (
                        <button onClick={() => approveRetailer(u._id)} className="bg-green-500 text-white px-2 py-1 rounded">Approve</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'quotes' && (
        <div>
          <h2 className="text-xl font-bold mb-4">Quote Requests</h2>
          <div className="space-y-4">
            {quotes.map(q => {
              const originalTotal = q.products.reduce((sum: number, p: any) => {
                return sum + (p.originalPrice || 0) * p.quantity;
              }, 0);

              return (
                <div key={q._id} className="border p-4 mb-4 rounded bg-white shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p><strong>User:</strong> {q.user.name} ({q.user.email})</p>
                      <p className="text-sm text-gray-600">
                        <strong>Role:</strong> 
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                          q.user.role === 'retailer' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {q.user.role}
                        </span>
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${
                      q.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      q.status === 'responded' ? 'bg-blue-100 text-blue-800' :
                      q.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {q.status}
                    </span>
                  </div>
                  
                  {q.message && <p className="mb-2"><strong>Message:</strong> {q.message}</p>}
                  
                  <div className="mt-2 mb-2">
                    <h4 className="font-bold">Products:</h4>
                    <ul className="ml-4">
                      {q.products.map((p: any) => (
                        <li key={p._id} className="flex justify-between">
                          <span>{p.product.name} - Qty: {p.quantity}</span>
                          <span className="text-gray-600">${p.originalPrice || 0} each</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 font-semibold">Original Total: ${originalTotal.toFixed(2)}</p>
                  </div>

                  {q.adminResponse && (
                    <div className="bg-blue-50 p-3 rounded mt-2">
                      <p className="font-semibold text-blue-900">Admin Response:</p>
                      <p>Offered Price: ${q.adminResponse.totalPrice}</p>
                      <p>Discount: {q.adminResponse.discountPercentage}%</p>
                      <p>Message: {q.adminResponse.message}</p>
                    </div>
                  )}

                  {q.status === 'pending' && (
                    <button 
                      onClick={() => respondToQuote(q)} 
                      className="bg-blue-500 text-white px-4 py-2 rounded mt-2 hover:bg-blue-600"
                    >
                      Respond to Quote
                    </button>
                  )}

                  {q.orderId && (
                    <div className="mt-2 text-green-600 font-semibold">
                      ✓ Converted to order
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
