import { useEffect, useState, useContext } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Upload, CheckCircle, AlertCircle, Clock, Info, Calendar, FileText, ChevronRight, ExternalLink } from 'lucide-react';
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
    window.scrollTo(0, 0);
  }, []);

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
        return <CheckCircle className="text-green-500" size={16} />;
      case 'rejected':
        return <AlertCircle className="text-red-500" size={16} />;
      default:
        return <Clock className="text-yellow-500" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'rejected':
        return 'bg-red-50 border-red-200 text-red-700';
      default:
        return 'bg-yellow-50 border-yellow-250 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* ─── Compact Dark Header ─── */}
      <div className="bg-gray-900 pt-[68px] pb-3">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs mb-1">
            <Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 text-gray-600" />
            <Link to="/user-dashboard" className="text-gray-400 hover:text-white transition-colors">My Account</Link>
            <ChevronRight className="w-3 h-3 text-gray-600" />
            <span className="text-white font-medium">Register Warranty</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Warranty Registration</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('register')}
              className={`py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors ${
                activeTab === 'register'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Register Warranty
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors ${
                activeTab === 'history'
                  ? 'border-teal-600 text-teal-600'
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
              <div className="bg-amber-50/50 border border-amber-250 p-6 mb-6 rounded-none animate-in fade-in duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-none bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                    <AlertCircle size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-amber-900 mb-1">Warranty Already Registered</h3>
                    <p className="text-xs text-amber-800 mb-4 leading-relaxed font-semibold uppercase tracking-wider">
                      This product already has a warranty registration in our system.
                    </p>
                    
                    <div className="bg-white rounded-none p-4 border border-amber-100 shadow-[0_1px_2px_rgba(245,158,11,0.05)]">
                      <div className="grid md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-gray-500 font-semibold uppercase tracking-wider text-[9px]">Product</p>
                          <p className="text-gray-900 font-medium mt-0.5">{existingWarrantyInfo.productName}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-semibold uppercase tracking-wider text-[9px]">Serial Number</p>
                          <p className="text-gray-950 font-mono font-bold mt-0.5">{existingWarrantyInfo.serialNumber}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-semibold uppercase tracking-wider text-[9px]">Status</p>
                          <span className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            existingWarrantyInfo.status === 'approved' ? 'bg-green-50 border-green-200 text-green-700' :
                            existingWarrantyInfo.status === 'rejected' ? 'bg-red-50 border-red-200 text-red-700' :
                            'bg-yellow-50 border-yellow-250 text-yellow-800'
                          }`}>
                            {existingWarrantyInfo.status?.charAt(0).toUpperCase() + existingWarrantyInfo.status?.slice(1)}
                          </span>
                        </div>
                        <div>
                          <p className="text-gray-500 font-semibold uppercase tracking-wider text-[9px]">Registered On</p>
                          <p className="text-gray-900 font-medium mt-0.5">{new Date(existingWarrantyInfo.registeredOn).toLocaleDateString()}</p>
                        </div>
                        
                        {existingWarrantyInfo.warrantyStartDate && existingWarrantyInfo.warrantyEndDate && (
                          <>
                            <div>
                              <p className="text-gray-500 font-semibold uppercase tracking-wider text-[9px] flex items-center gap-1">
                                <Calendar size={12} className="text-gray-400" />
                                Warranty Period
                              </p>
                              <p className="text-gray-900 font-medium mt-0.5">
                                {new Date(existingWarrantyInfo.warrantyStartDate).toLocaleDateString()} - {new Date(existingWarrantyInfo.warrantyEndDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 font-semibold uppercase tracking-wider text-[9px]">Duration</p>
                              <p className="text-gray-900 font-medium mt-0.5">{existingWarrantyInfo.warrantyPeriodMonths} months</p>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {existingWarrantyInfo.status === 'approved' && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-1.5 text-green-700">
                            <CheckCircle size={15} />
                            <p className="text-xs font-semibold">
                              {new Date(existingWarrantyInfo.warrantyEndDate) > new Date() 
                                ? `Active for ${Math.ceil((new Date(existingWarrantyInfo.warrantyEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} more days`
                                : 'Warranty period has expired'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setActiveTab('history')}
                      className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-none transition flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider shadow-none"
                    >
                      <FileText size={14} />
                      View Warranty History
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-teal-50/30 border border-teal-100 rounded-none p-5 mb-6 animate-in fade-in duration-300">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-none bg-teal-100 flex items-center justify-center text-teal-700 flex-shrink-0">
                  <Info className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-teal-900 uppercase tracking-wider">Registration Guidelines</h3>
                  <div className="mt-2 text-xs text-teal-850 leading-relaxed font-semibold">
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 list-none">
                      <li className="flex items-start gap-2">
                        <span className="text-teal-600 font-bold mt-0.5">✓</span>
                        <span>Online purchases: Invoice upload is <span className="underline font-bold">NOT</span> required.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-teal-600 font-bold mt-0.5">✓</span>
                        <span>Offline/Retailer purchases: Invoice upload is <span className="underline font-bold">REQUIRED</span>.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-teal-600 font-bold mt-0.5">✓</span>
                        <span>Serial numbers are automatically validated.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-teal-600 font-bold mt-0.5">✓</span>
                        <span>You will receive email notifications about warranty status.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-none border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
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
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-xs font-semibold text-gray-800 transition"
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
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Model Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.modelNumber}
                      onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-xs font-semibold text-gray-800 placeholder-gray-400 transition"
                      placeholder="Enter model number"
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Serial Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                      onBlur={handleSerialBlur}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-xs font-semibold text-gray-800 placeholder-gray-400 transition pr-10"
                      placeholder="Enter serial number"
                    />
                    {serialValid !== null && (
                      <div className="absolute right-3.5 top-[38px]">
                        {serialValid ? (
                          <CheckCircle className="text-green-500" size={16} />
                        ) : (
                          <AlertCircle className="text-red-500" size={16} />
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Purchase Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-xs font-semibold text-gray-800 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Purchase Type *
                    </label>
                    <select
                      required
                      value={formData.purchaseType}
                      onChange={(e) => setFormData({ ...formData, purchaseType: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-xs font-semibold text-gray-800 transition"
                    >
                      <option value="telogica_online">Telogica Online Store</option>
                      <option value="telogica_offline">Telogica Offline Store</option>
                      <option value="retailer">Retailer</option>
                    </select>
                  </div>

                  {formData.purchaseType !== 'telogica_online' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Upload size={14} className="text-gray-400" />
                        Invoice Upload (Required) *
                      </label>
                      
                      {!formData.invoice ? (
                        <div className="relative border-2 border-dashed border-gray-200 hover:border-teal-500 rounded-none p-5 text-center cursor-pointer transition group bg-gray-50/50 hover:bg-teal-50/10">
                          <input
                            type="file"
                            id="invoice-upload"
                            accept=".pdf,.jpg,.jpeg,.png"
                            required={formData.purchaseType !== 'telogica_online' && !formData.invoice}
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <label htmlFor="invoice-upload" className="cursor-pointer block">
                            <Upload className="mx-auto h-7 w-7 text-gray-400 group-hover:text-teal-600 transition mb-2" />
                            <span className="block text-xs font-bold text-gray-700">Click to upload invoice document</span>
                            <span className="block text-[10px] text-gray-400 mt-1">PDF, JPG, PNG up to 5MB</span>
                          </label>
                        </div>
                      ) : (
                        <div className="border border-green-200 bg-green-50/20 rounded-none p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-none bg-green-100 flex items-center justify-center text-green-600">
                              <FileText size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-800 truncate">Invoice Document Uploaded</p>
                              <a 
                                href={formData.invoice} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-[10px] text-teal-600 hover:underline font-semibold flex items-center gap-1 mt-0.5"
                              >
                                View Uploaded Document <ExternalLink size={10} />
                              </a>
                            </div>
                          </div>
                          <label htmlFor="invoice-upload" className="px-3 py-1.5 bg-white border border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-600 rounded-none hover:bg-gray-50 cursor-pointer transition">
                            Change File
                            <input
                              type="file"
                              id="invoice-upload"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => navigate('/user-dashboard')}
                    className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-none hover:bg-gray-50 text-xs font-bold uppercase tracking-wider transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-teal-600 text-white rounded-none hover:bg-teal-700 active:bg-teal-800 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition shadow-none"
                  >
                    {loading ? 'Submitting...' : 'Register Warranty'}
                    <Shield size={14} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {warranties.length === 0 ? (
              <div className="bg-white rounded-none border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-12 text-center max-w-lg mx-auto my-4 animate-in fade-in duration-300">
                <div className="w-16 h-16 bg-gray-50 rounded-none flex items-center justify-center mx-auto text-gray-400 mb-4 border border-gray-100">
                  <Shield size={32} />
                </div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">No warranties registered</h3>
                <p className="text-xs text-gray-500 font-semibold mb-6">You haven't submitted any product warranty registrations yet.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-none font-bold uppercase tracking-wider text-[10px] transition shadow-none"
                >
                  Register Your First Warranty
                </button>
              </div>
            ) : (
              warranties.map((warranty: any) => (
                <div key={warranty._id} className="bg-white rounded-none border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 mb-4 hover:border-gray-300 transition-colors animate-in fade-in duration-300">
                  <div className="flex justify-between items-start gap-4 mb-4 pb-4 border-b border-gray-100">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{warranty.productName}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                        <span>Model: <span className="text-gray-700 font-bold">{warranty.modelNumber}</span></span>
                        <span>S/N: <span className="text-gray-700 font-mono font-bold">{warranty.serialNumber}</span></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {getStatusIcon(warranty.status)}
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(warranty.status)}`}>
                        {warranty.status.charAt(0).toUpperCase() + warranty.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <p className="text-gray-400 font-semibold uppercase tracking-wider text-[9px]">Purchase Date</p>
                      <p className="font-bold text-gray-800 mt-0.5">{new Date(warranty.purchaseDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-semibold uppercase tracking-wider text-[9px]">Purchase Type</p>
                      <p className="font-bold text-gray-800 mt-0.5 capitalize">{warranty.purchaseType.replace('_', ' ')}</p>
                    </div>
                    {warranty.status === 'approved' && warranty.warrantyEndDate && (
                      <>
                        <div>
                          <p className="text-gray-400 font-semibold uppercase tracking-wider text-[9px]">Warranty Start</p>
                          <p className="font-bold text-gray-800 mt-0.5">{new Date(warranty.warrantyStartDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-semibold uppercase tracking-wider text-[9px]">Warranty End</p>
                          <p className="font-bold mt-0.5 text-teal-700">{new Date(warranty.warrantyEndDate).toLocaleDateString()}</p>
                        </div>
                      </>
                    )}
                    {warranty.rejectionReason && (
                      <div className="col-span-2 md:col-span-4 mt-2 p-3 bg-red-50/50 border border-red-100 rounded-none">
                        <p className="text-red-500 font-bold uppercase tracking-wider text-[9px]">Rejection Reason</p>
                        <p className="font-semibold text-red-700 text-xs mt-0.5">{warranty.rejectionReason}</p>
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

