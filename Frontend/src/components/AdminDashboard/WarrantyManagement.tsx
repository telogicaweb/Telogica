import React from 'react';
import { Download, CheckCircle, X } from 'lucide-react';
import api from '../../api';
import { Warranty } from './types';

interface WarrantyManagementProps {
  warranties: Warranty[];
  onWarrantiesUpdated: () => void;
}

const WarrantyManagement: React.FC<WarrantyManagementProps> = ({
  warranties,
  onWarrantiesUpdated,
}) => {
  const handleWarrantyAction = async (warrantyId: string, action: string) => {
    try {
      await api.put(`/api/warranties/${warrantyId}`, { status: action });
      alert(`Warranty ${action} successfully`);
      onWarrantiesUpdated();
    } catch (error: any) {
      alert(
        error.response?.data?.message || `Failed to ${action} warranty`
      );
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Warranty Management</h2>

      <div className="space-y-4">
        {warranties.map((warranty) => (
          <div
            key={warranty._id}
            className="bg-white p-6 rounded-lg shadow border border-gray-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{warranty.productName}</h3>
                <p className="text-sm text-gray-600">
                  Customer: {warranty.userId?.name} ({warranty.userId?.email})
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Registered: {new Date(warranty.createdAt).toLocaleString()}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  warranty.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : warranty.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {warranty.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-600">Serial Number</p>
                <p className="font-medium">{warranty.serialNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Model Number</p>
                <p className="font-medium">{warranty.modelNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Purchase Date</p>
                <p className="font-medium">
                  {new Date(warranty.purchaseDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Purchase Type</p>
                <p className="font-medium capitalize">{warranty.purchaseType}</p>
              </div>
            </div>

            {warranty.invoiceUrl && (
              <div className="mb-4">
                <a
                  href={warranty.invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  View Invoice
                </a>
              </div>
            )}

            {warranty.status === 'pending' && (
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    handleWarrantyAction(warranty._id, 'approved')
                  }
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() =>
                    handleWarrantyAction(warranty._id, 'rejected')
                  }
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WarrantyManagement;
