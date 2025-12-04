import React, { useContext, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Quote = () => {
  const { quoteItems, removeFromQuote, clearQuote } = useContext(CartContext)!;
  const { user } = useContext(AuthContext)!;
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmitQuote = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/quotes', {
        products: quoteItems.map(item => ({
          product: item.product._id,
          quantity: item.quantity
        })),
        message
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      alert('Quote Submitted Successfully!');
      clearQuote();
      navigate('/user-dashboard');
    } catch (error) {
      console.error(error);
      alert('Failed to submit quote');
    }
  };

  return (
    <div className="container mx-auto p-4 pt-24">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Request a Quote</h1>
      {quoteItems.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">Your quote list is empty.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200">
            {quoteItems.map(item => (
              <li key={item.product._id} className="px-4 py-4 sm:px-6 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{item.product.name}</h3>
                    <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                  </div>
                </div>
                <button 
                  onClick={() => removeFromQuote(item.product._id)} 
                  className="text-red-600 hover:text-red-900 font-medium"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="px-4 py-5 sm:p-6 bg-gray-50">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Additional Message</label>
            <textarea 
              id="message"
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
              rows={4}
              placeholder="Any specific requirements or questions?"
            />
            <div className="mt-4">
              <button 
                onClick={handleSubmitQuote} 
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Submit Quote Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quote;
