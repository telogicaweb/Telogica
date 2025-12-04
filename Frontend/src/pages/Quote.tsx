import { useContext, useState, useEffect } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';

const Quote = () => {
  const { cart, quoteItems, removeFromQuote, clearQuote, clearCart } = useContext(CartContext)!;
  const { user } = useContext(AuthContext)!;
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Auto-populate quote items from cart if user has more than 3 items
  useEffect(() => {
    if (user?.role === 'user' && cart.length > 3 && quoteItems.length === 0) {
      // Items are already in cart, no need to duplicate them
      // The UI will show cart items if quote items are empty
    }
  }, [cart, user, quoteItems]);

  const handleSubmitQuote = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    const itemsToQuote = quoteItems.length > 0 ? quoteItems : cart;

    if (itemsToQuote.length === 0) {
      alert('No items to quote');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/quotes', {
        products: itemsToQuote.map(item => ({
          product: item.product._id,
          quantity: item.quantity
        })),
        message
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      alert('Quote Submitted Successfully! You will receive an email once admin responds.');
      clearQuote();
      clearCart();
      navigate('/user-dashboard');
    } catch (error) {
      console.error(error);
      alert('Failed to submit quote');
    }
  };

  const displayItems = quoteItems.length > 0 ? quoteItems : cart;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Request a Quote</h1>
        <p className="text-gray-600 mb-6">
          {user?.role === 'retailer' 
            ? 'As a retailer, you can request quotes for bulk orders with special discounts.'
            : 'Request a quote for bulk orders (more than 3 items) and get special pricing.'}
        </p>

        {displayItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-600 text-lg mb-4">Your quote list is empty.</p>
            <p className="text-gray-500 text-sm">Add items to your cart or quote list to get started.</p>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Items for Quote ({displayItems.length})</h2>
            </div>
            
            <ul className="divide-y divide-gray-200">
              {displayItems.map(item => (
                <li key={item.product._id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50">
                  <div className="flex items-center flex-1">
                    {item.product.images && item.product.images[0] && (
                      <img 
                        src={item.product.images[0]} 
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-md border border-gray-200"
                      />
                    )}
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{item.product.name}</h3>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      {item.product.price && (
                        <p className="text-sm text-gray-600">Regular Price: ${item.product.price} each</p>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFromQuote(item.product._id)} 
                    className="text-red-600 hover:text-red-800 font-medium flex items-center gap-1 ml-4"
                  >
                    <Trash2 size={16} />
                    <span>Remove</span>
                  </button>
                </li>
              ))}
            </ul>
            
            <div className="px-6 py-6 bg-gray-50 border-t border-gray-200">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Message or Requirements
              </label>
              <textarea 
                id="message"
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-3 border"
                rows={4}
                placeholder="Tell us about your requirements, expected delivery time, or any specific requests..."
              />
              
              <div className="mt-6 flex gap-4">
                <button 
                  onClick={handleSubmitQuote} 
                  className="flex-1 inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Submit Quote Request
                </button>
                <button 
                  onClick={() => navigate('/')} 
                  className="px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
              
              <p className="mt-4 text-sm text-gray-500 text-center">
                You will receive an email notification once the admin responds to your quote.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quote;
