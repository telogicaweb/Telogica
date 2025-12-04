import React, { useEffect, useState, useContext } from 'react';
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

  const respondToQuote = async (id: string) => {
    const price = prompt('Enter Price:');
    const message = prompt('Enter Message:');
    if (price && message) {
      await axios.put(`http://localhost:5000/api/quotes/${id}/respond`, { price, message }, {
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
                  <td className="p-2 border">{u.role}</td>
                  <td className="p-2 border">{u.isApproved ? 'Approved' : 'Pending'}</td>
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
      )}

      {activeTab === 'quotes' && (
        <div>
          <h2 className="text-xl font-bold mb-4">Quote Requests</h2>
          {quotes.map(q => (
            <div key={q._id} className="border p-4 mb-4 rounded">
              <p><strong>User:</strong> {q.user.name} ({q.user.email})</p>
              <p><strong>Status:</strong> {q.status}</p>
              <p><strong>Message:</strong> {q.message}</p>
              <div className="mt-2">
                <h4 className="font-bold">Products:</h4>
                {q.products.map((p: any) => (
                  <div key={p._id}>
                    {p.product.name} - Qty: {p.quantity}
                  </div>
                ))}
              </div>
              {q.status === 'pending' && (
                <button onClick={() => respondToQuote(q._id)} className="bg-blue-500 text-white px-4 py-2 rounded mt-2">Respond</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
