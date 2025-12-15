import { useEffect, useState, useContext } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { Shield, Upload, CheckCircle, AlertCircle, Clock, Info, Calendar, FileText } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const WarrantyRegistration = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext) || {};
  const toast = useToast();
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    modelNumber: '',
    serialNumber: '',
    purchaseDate: '',
    purchaseType: 'telogica_online',
    invoice: ''
  });
  const [warranties, setWarranties] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [serialValid, setSerialValid] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'register' | 'history'>('register');
  const [existingWarrantyInfo, setExistingWarrantyInfo] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      // navigate('/login'); // Optional: redirect if not logged in
      // For now, just don't fetch warranties if not logged in
      return;
    }
    fetchWarranties();
    fetchProducts();
  }, [user]);

  const fetchWarranties = async () => {
    try {
      const res = await api.get('/api/warranties/my-warranties');
      if (Array.isArray(res.data)) {
        setWarranties(res.data);
      } else {
        setWarranties([]);
      }
    } catch (error) {
      console.error('Error fetching warranties:', error);
      setWarranties([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/api/products');
      setProducts(res.data.products || res.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const checkSerialNumber = async (serialNumber: string) => {
    if (!serialNumber || !formData.productId) return;

    try {
      const res = await api.get(`/api/warranties/check-serial?serialNumber=${serialNumber}&productId=${formData.productId}`);
      setSerialValid(res.data.valid && !res.data.alreadyRegistered);
      if (res.data.alreadyRegistered) {
        setExistingWarrantyInfo(res.data.warranty);
        toast.warning('This serial number is already registered for warranty. Check details below.');
      } else {
        setExistingWarrantyInfo(null);
      }
    } catch (error) {
      setSerialValid(false);
      setExistingWarrantyInfo(null);
    }
  };

  const handleSerialBlur = () => {
    if (formData.serialNumber && formData.productId) {
      checkSerialNumber(formData.serialNumber);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('invoice', file);

    try {
      setLoading(true);
      const res = await api.post('/api/warranties/upload-invoice', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setFormData(prev => ({ ...prev, invoice: res.data.url }));
      toast.success('Invoice uploaded successfully');
    } catch (error) {
      console.error('Error uploading invoice:', error);
      toast.error('Failed to upload invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.purchaseType !== 'telogica_online' && !formData.invoice) {
      toast.warning('Please upload an invoice for offline or retailer purchases.');
      return;
    }

    if (existingWarrantyInfo) {
      toast.error('Cannot register warranty. This serial number is already registered.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/warranties', formData);
      toast.success('Warranty registered successfully! You will receive an email notification once admin reviews it.');
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
      setExistingWarrantyInfo(null);
      fetchWarranties();
      setActiveTab('history');
    } catch (error: any) {
      console.error('Error registering warranty:', error);
      
      // Check if it's a duplicate warranty error with details
      if (error.response?.data?.alreadyExists) {
        const warrantyData = error.response.data.warranty;
        setExistingWarrantyInfo(warrantyData);
        toast.error(error.response.data.message);
        
        // Scroll to show the existing warranty info
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        toast.error(error.response?.data?.message || 'Failed to register warranty');
      }
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
    <div className="min-h-screen bg-gray-50 pt-24 md:pt-32 pb-8">
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
            {/* Existing Warranty Alert */}
            {existingWarrantyInfo && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-6 mb-6 rounded-r-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-6 w-6 text-amber-500 mt-0.5" />
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-bold text-amber-900 mb-2">Warranty Already Registered</h3>
                    <p className="text-sm text-amber-800 mb-4">
                      This product already has a warranty registration in our system.
                    </p>
                    
                    <div className="bg-white rounded-lg p-4 border border-amber-200">
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 font-medium">Product:</p>
                          <p className="text-gray-900">{existingWarrantyInfo.productName}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 font-medium">Serial Number:</p>
                          <p className="text-gray-900 font-mono">{existingWarrantyInfo.serialNumber}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 font-medium">Status:</p>
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            existingWarrantyInfo.status === 'approved' ? 'bg-green-100 text-green-800' :
                            existingWarrantyInfo.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {existingWarrantyInfo.status?.charAt(0).toUpperCase() + existingWarrantyInfo.status?.slice(1)}
                          </span>
                        </div>
                        <div>
                          <p className="text-gray-600 font-medium">Registered On:</p>
                          <p className="text-gray-900">{new Date(existingWarrantyInfo.registeredOn).toLocaleDateString()}</p>
                        </div>
                        
                        {existingWarrantyInfo.warrantyStartDate && existingWarrantyInfo.warrantyEndDate && (
                          <>
                            <div>
                              <p className="text-gray-600 font-medium flex items-center gap-1">
                                <Calendar size={14} />
                                Warranty Period:
                              </p>
                              <p className="text-gray-900">
                                {new Date(existingWarrantyInfo.warrantyStartDate).toLocaleDateString()} - {new Date(existingWarrantyInfo.warrantyEndDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 font-medium">Duration:</p>
                              <p className="text-gray-900">{existingWarrantyInfo.warrantyPeriodMonths} months</p>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {existingWarrantyInfo.status === 'approved' && (
                        <div className="mt-4 pt-4 border-t border-amber-200">
                          <div className="flex items-center gap-2 text-green-700">
                            <CheckCircle size={18} />
                            <p className="text-sm font-medium">
                              {new Date(existingWarrantyInfo.warrantyEndDate) > new Date() 
                                ? `Warranty active for ${Math.ceil((new Date(existingWarrantyInfo.warrantyEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} more days`
                                : 'Warranty period has expired'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => setActiveTab('history')}
                      className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
                    >
                      <FileText size={16} />
                      View Warranty History
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                    Product *
                  </label>
                  <select
                    required
                    value={formData.productId}
                    onChange={(e) => {
                      const selectedProduct = products.find(p => p._id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        productId: e.target.value,
                        productName: selectedProduct ? selectedProduct.name : ''
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
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
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      required={formData.purchaseType !== 'telogica_online' && !formData.invoice}
                      onChange={handleFileChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {formData.invoice && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle size={16} />
                        <span>Invoice uploaded successfully</span>
                        <a href={formData.invoice} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-2">View</a>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Supported formats: PDF, JPG, PNG (Max 5MB)
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
