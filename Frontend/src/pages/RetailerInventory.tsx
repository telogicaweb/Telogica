import { useState, useContext, useEffect } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { Package, DollarSign, Upload, Info } from 'lucide-react';

const RetailerInventory = () => {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [sellFormData, setSellFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    sellingPrice: '',
    customerInvoice: '',
    soldDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (user?.role === 'retailer') {
      fetchInventory();
    }
  }, [user]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/retailer-inventory/my-inventory');
      setInventory(res.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const openSellModal = (item: any) => {
    setSelectedItem(item);
    setSellFormData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      sellingPrice: '',
      customerInvoice: '',
      soldDate: new Date().toISOString().split('T')[0]
    });
    setShowSellModal(true);
  };

  const handleSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sellFormData.customerInvoice) {
      alert('Please upload customer invoice.');
      return;
    }

    setLoading(true);
    try {
      await api.post(
        `/api/retailer-inventory/${selectedItem._id}/sell`,
        sellFormData
      );
      alert('Product marked as sold successfully! Warranty has been registered for the customer and both you and the customer will receive email notifications.');
      setShowSellModal(false);
      fetchInventory();
    } catch (error: any) {
      console.error('Error selling product:', error);
      alert(error.response?.data?.message || 'Failed to mark product as sold');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      case 'returned':
        return 'bg-yellow-100 text-yellow-800';
      case 'damaged':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (user?.role !== 'retailer') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">This page is only accessible to retailers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Package size={32} className="text-blue-600" />
            My Inventory
          </h1>
          <p className="text-gray-600 mt-2">Manage your product inventory</p>
        </div>

        {/* Info Box */}
        <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-indigo-800">Retailer Information</h3>
              <div className="mt-2 text-sm text-indigo-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>You see different pricing from regular users</li>
                  <li>All purchases must be made through quote requests</li>
                  <li>When you sell a product to a customer, warranty is automatically registered</li>
                  <li>Both you and your customer will receive email notifications</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {inventory.filter(item => item.status === 'in_stock').length}
                </p>
              </div>
              <Package className="text-green-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sold</p>
                <p className="text-2xl font-bold text-gray-900">
                  {inventory.filter(item => item.status === 'sold').length}
                </p>
              </div>
              <DollarSign className="text-blue-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{inventory.length}</p>
              </div>
              <Package className="text-gray-500" size={32} />
            </div>
          </div>
        </div>

        {/* Inventory List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading inventory...</p>
          </div>
        ) : inventory.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No items in inventory yet</p>
            <p className="text-sm text-gray-500 mt-2">Purchase products to see them here</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Serial Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchase Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchase Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventory.map((item) => (
                  <tr key={item._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.product?.images?.[0] && (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="h-10 w-10 rounded object-cover mr-3"
                          />
                        )}
                        <div className="text-sm font-medium text-gray-900">
                          {item.product?.name || 'Unknown Product'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.productUnit?.serialNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.purchaseDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{item.purchasePrice}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.status === 'in_stock' && (
                        <button
                          onClick={() => openSellModal(item)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Mark as Sold
                        </button>
                      )}
                      {item.status === 'sold' && item.soldTo && (
                        <div className="text-xs">
                          <p className="font-medium">{item.soldTo.name}</p>
                          <p className="text-gray-500">{item.soldTo.email}</p>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sell Modal */}
        {showSellModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Sell Product to Customer
              </h2>
              
              <form onSubmit={handleSellSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={sellFormData.customerName}
                      onChange={(e) => setSellFormData({ ...sellFormData, customerName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter customer name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={sellFormData.customerEmail}
                      onChange={(e) => setSellFormData({ ...sellFormData, customerEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="customer@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={sellFormData.customerPhone}
                      onChange={(e) => setSellFormData({ ...sellFormData, customerPhone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selling Price *
                    </label>
                    <input
                      type="number"
                      required
                      value={sellFormData.sellingPrice}
                      onChange={(e) => setSellFormData({ ...sellFormData, sellingPrice: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter price"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Address *
                    </label>
                    <textarea
                      required
                      value={sellFormData.customerAddress}
                      onChange={(e) => setSellFormData({ ...sellFormData, customerAddress: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Enter customer address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sale Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={sellFormData.soldDate}
                      onChange={(e) => setSellFormData({ ...sellFormData, soldDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Upload size={16} />
                      Customer Invoice URL *
                    </label>
                    <input
                      type="text"
                      required
                      value={sellFormData.customerInvoice}
                      onChange={(e) => setSellFormData({ ...sellFormData, customerInvoice: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter invoice URL"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowSellModal(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {loading ? 'Processing...' : 'Confirm Sale'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RetailerInventory;
