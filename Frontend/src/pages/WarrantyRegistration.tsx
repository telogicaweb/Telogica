import { useEffect, useState, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Upload, CheckCircle, AlertCircle, Clock, Info } from 'lucide-react';

const WarrantyRegistration = () => {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    modelNumber: '',
    serialNumber: '',
    purchaseDate: '',
    purchaseType: 'telogica_online',
    invoice: ''
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [serialValid, setSerialValid] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'register' | 'history'>('register');

  useEffect(() => {
    fetchOrders();
    fetchWarranties();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/myorders');
      setOrders(res.data.filter((order: any) => order.paymentStatus === 'completed'));
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchWarranties = async () => {
    try {
      const res = await api.get('/warranties/my-warranties');
      setWarranties(res.data);
    } catch (error) {
      console.error('Error fetching warranties:', error);
    }
  };

  const checkSerialNumber = async (serialNumber: string) => {
    if (!serialNumber) return;

    try {
      const res = await api.get(`/warranties/check-serial?serialNumber=${serialNumber}`);
      setSerialValid(res.data.valid && !res.data.alreadyRegistered);
      if (res.data.alreadyRegistered) {
        alert('This serial number is already registered for warranty.');
      }
    } catch (error) {
      setSerialValid(false);
    }
  };

  const handleSerialBlur = () => {
    if (formData.serialNumber) {
      checkSerialNumber(formData.serialNumber);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.purchaseType !== 'telogica_online' && !formData.invoice) {
      alert('Please upload an invoice for offline or retailer purchases.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/warranties', formData);
      alert('Warranty registered successfully! You will receive an email notification once admin reviews it.');
      setFormData({
        productId: '',
        productName: '',
        modelNumber: '',
        serialNumber: '',
        purchaseDate: '',
        purchaseType: 'telogica_online',
        invoice: ''
      });
      setSerialValid(null);
      fetchWarranties();
      setActiveTab('history');
    } catch (error: any) {
      console.error('Error registering warranty:', error);
      alert(error.response?.data?.message || 'Failed to register warranty');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'rejected':
        return <AlertCircle className="text-red-500" size={20} />;
      default:
        return <Clock className="text-yellow-500" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield size={32} className="text-blue-600" />
            Warranty Registration
          </h1>
          <p className="text-gray-600 mt-2">Register your products for warranty coverage</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('register')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'register'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Register Warranty
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Warranty History ({warranties.length})
            </button>
          </nav>
        </div>

        {activeTab === 'register' ? (
          <div>
            {/* Info Box */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Warranty Registration Information</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Online purchases: Invoice upload is NOT required (we have your data)</li>
                      <li>Offline/Retailer purchases: Invoice upload is REQUIRED</li>
                      <li>Serial number will be validated against our records</li>
                      <li>You will receive email notifications about warranty status</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.modelNumber}
                    onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter model number"
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Serial Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    onBlur={handleSerialBlur}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter serial number"
                  />
                  {serialValid !== null && (
                    <div className="absolute right-3 top-9">
                      {serialValid ? (
                        <CheckCircle className="text-green-500" size={20} />
                      ) : (
                        <AlertCircle className="text-red-500" size={20} />
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Type *
                  </label>
                  <select
                    required
                    value={formData.purchaseType}
                    onChange={(e) => setFormData({ ...formData, purchaseType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="telogica_online">Telogica Online Store</option>
                    <option value="telogica_offline">Telogica Offline Store</option>
                    <option value="retailer">Retailer</option>
                  </select>
                </div>

                {formData.purchaseType !== 'telogica_online' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Upload size={16} />
                      Invoice Upload (Required) *
                    </label>
                    <input
                      type="text"
                      required={formData.purchaseType !== 'telogica_online'}
                      value={formData.invoice}
                      onChange={(e) => setFormData({ ...formData, invoice: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter invoice URL"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload invoice to cloud storage and paste URL here
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? 'Submitting...' : 'Register Warranty'}
                  <Shield size={16} />
                </button>
              </div>
            </form>
          </div>
          </div>
        ) : (
          <div className="space-y-4">
            {warranties.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Shield size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No warranty registrations yet</p>
                <button
                  onClick={() => setActiveTab('register')}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Register Your First Warranty
                </button>
              </div>
            ) : (
              warranties.map((warranty: any) => (
                <div key={warranty._id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{warranty.productName}</h3>
                      <p className="text-sm text-gray-600">S/N: {warranty.serialNumber}</p>
                      <p className="text-sm text-gray-600">Model: {warranty.modelNumber}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(warranty.status)}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(warranty.status)}`}>
                        {warranty.status.charAt(0).toUpperCase() + warranty.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Purchase Date:</p>
                      <p className="font-medium">{new Date(warranty.purchaseDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Purchase Type:</p>
                      <p className="font-medium capitalize">{warranty.purchaseType.replace('_', ' ')}</p>
                    </div>
                    {warranty.status === 'approved' && warranty.warrantyEndDate && (
                      <>
                        <div>
                          <p className="text-gray-600">Warranty Start:</p>
                          <p className="font-medium">{new Date(warranty.warrantyStartDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Warranty End:</p>
                          <p className="font-medium">{new Date(warranty.warrantyEndDate).toLocaleDateString()}</p>
                        </div>
                      </>
                    )}
                    {warranty.rejectionReason && (
                      <div className="md:col-span-2">
                        <p className="text-gray-600">Rejection Reason:</p>
                        <p className="font-medium text-red-600">{warranty.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WarrantyRegistration;
