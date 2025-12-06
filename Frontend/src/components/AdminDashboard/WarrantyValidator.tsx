import { useState } from 'react';
import { Search, CheckCircle, XCircle, AlertCircle, Clock, FileText } from 'lucide-react';
import api from '../../api';

interface WarrantyValidationResult {
  isValid: boolean;
  status: string;
  message: string;
  warranty?: {
    id: string;
    productName: string;
    serialNumber: string;
    modelNumber: string;
    purchaseDate: string;
    purchaseType: string;
    warrantyStartDate?: string;
    warrantyEndDate?: string;
    warrantyPeriodMonths?: number;
    daysRemaining?: number;
    status: string;
    registeredDate: string;
    approvedDate?: string;
    certificateUrl?: string;
    customerName?: string;
    customerEmail?: string;
    rejectionReason?: string;
  };
  productInfo?: {
    name: string;
    category: string;
    manufacturingDate?: string;
  };
}

const WarrantyValidator = () => {
  const [serialNumber, setSerialNumber] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<WarrantyValidationResult | null>(null);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serialNumber.trim()) {
      return;
    }

    setIsChecking(true);
    setResult(null);

    try {
      const { data } = await api.get(`/api/warranties/validate?serialNumber=${encodeURIComponent(serialNumber)}`);
      setResult(data);
    } catch (error: any) {
      setResult({
        isValid: false,
        status: 'error',
        message: error.response?.data?.message || 'Failed to validate warranty'
      });
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = () => {
    if (!result) return null;

    switch (result.status) {
      case 'active':
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case 'expired':
        return <XCircle className="w-12 h-12 text-red-500" />;
      case 'pending':
      case 'pending_start':
        return <Clock className="w-12 h-12 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-12 h-12 text-red-500" />;
      case 'not_registered':
        return <AlertCircle className="w-12 h-12 text-orange-500" />;
      case 'not_found':
        return <XCircle className="w-12 h-12 text-gray-500" />;
      default:
        return <AlertCircle className="w-12 h-12 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    if (!result) return '';

    switch (result.status) {
      case 'active':
        return 'border-green-200 bg-green-50';
      case 'expired':
        return 'border-red-200 bg-red-50';
      case 'pending':
      case 'pending_start':
        return 'border-yellow-200 bg-yellow-50';
      case 'rejected':
        return 'border-red-200 bg-red-50';
      case 'not_registered':
        return 'border-orange-200 bg-orange-50';
      case 'not_found':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Search className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-900">Warranty Validation Tool</h3>
      </div>
      
      <form onSubmit={handleValidate} className="mb-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            placeholder="Enter product serial number..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isChecking}
          />
          <button
            type="submit"
            disabled={isChecking || !serialNumber.trim()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            {isChecking ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Checking...
              </>
            ) : (
              <>
                <Search size={18} />
                Validate
              </>
            )}
          </button>
        </div>
      </form>

      {result && (
        <div className={`border-2 rounded-lg p-6 ${getStatusColor()}`}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {getStatusIcon()}
            </div>
            
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {result.message}
              </h4>

              {result.productInfo && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Product Information:</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Product:</span>{' '}
                      <span className="font-medium">{result.productInfo.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Category:</span>{' '}
                      <span className="font-medium">{result.productInfo.category}</span>
                    </div>
                    {result.productInfo.manufacturingDate && (
                      <div>
                        <span className="text-gray-600">Manufacturing Date:</span>{' '}
                        <span className="font-medium">
                          {new Date(result.productInfo.manufacturingDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {result.warranty && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Warranty Details:</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Serial Number:</span>{' '}
                      <span className="font-medium">{result.warranty.serialNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Model Number:</span>{' '}
                      <span className="font-medium">{result.warranty.modelNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Purchase Date:</span>{' '}
                      <span className="font-medium">
                        {new Date(result.warranty.purchaseDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Purchase Type:</span>{' '}
                      <span className="font-medium capitalize">
                        {result.warranty.purchaseType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {result.warranty.warrantyPeriodMonths && (
                      <div>
                        <span className="text-gray-600">Warranty Period:</span>{' '}
                        <span className="font-medium">{result.warranty.warrantyPeriodMonths} months</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Status:</span>{' '}
                      <span className={`font-medium capitalize ${
                        result.warranty.status === 'approved' ? 'text-green-700' :
                        result.warranty.status === 'pending' ? 'text-yellow-700' :
                        'text-red-700'
                      }`}>
                        {result.warranty.status}
                      </span>
                    </div>
                  </div>

                  {result.warranty.warrantyStartDate && result.warranty.warrantyEndDate && (
                    <div className="bg-white bg-opacity-50 p-3 rounded border border-gray-200">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Start Date:</span>{' '}
                          <span className="font-medium">
                            {new Date(result.warranty.warrantyStartDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">End Date:</span>{' '}
                          <span className="font-medium">
                            {new Date(result.warranty.warrantyEndDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {result.warranty.daysRemaining !== undefined && result.warranty.daysRemaining > 0 && (
                        <p className="mt-2 text-sm font-medium text-green-700">
                          {result.warranty.daysRemaining} days remaining
                        </p>
                      )}
                    </div>
                  )}

                  {result.warranty.customerName && (
                    <div className="bg-white bg-opacity-50 p-3 rounded border border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-1">Customer Information:</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Name:</span>{' '}
                          <span className="font-medium">{result.warranty.customerName}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Email:</span>{' '}
                          <span className="font-medium">{result.warranty.customerEmail}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {result.warranty.rejectionReason && (
                    <div className="bg-red-100 p-3 rounded border border-red-200">
                      <p className="text-sm font-medium text-red-700 mb-1">Rejection Reason:</p>
                      <p className="text-sm text-red-600">{result.warranty.rejectionReason}</p>
                    </div>
                  )}

                  {result.warranty.certificateUrl && (
                    <div className="mt-3">
                      <a
                        href={result.warranty.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                      >
                        <FileText size={16} />
                        View Warranty Certificate
                      </a>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mt-3">
                    Registered: {new Date(result.warranty.registeredDate).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarrantyValidator;
