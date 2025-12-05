import React, { useState } from 'react';
import { CheckSquare, Square, ChevronDown } from 'lucide-react';

interface BulkAction {
  label: string;
  value: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger' | 'success';
  confirmMessage?: string;
}

interface BulkActionsProps {
  selectedIds: string[];
  totalItems: number;
  actions: BulkAction[];
  onAction: (action: string, selectedIds: string[]) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  className?: string;
}

/**
 * Reusable Bulk Actions Component
 * Provides checkbox selection and bulk action dropdown
 */
const BulkActions: React.FC<BulkActionsProps> = ({
  selectedIds,
  totalItems,
  actions,
  onAction,
  onSelectAll,
  onDeselectAll,
  className = '',
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null);

  const isAllSelected = selectedIds.length === totalItems && totalItems > 0;
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected || isSomeSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  };

  const handleAction = (action: BulkAction) => {
    if (action.confirmMessage) {
      setPendingAction(action);
    } else {
      executeAction(action);
    }
    setShowMenu(false);
  };

  const executeAction = (action: BulkAction) => {
    onAction(action.value, selectedIds);
    setPendingAction(null);
  };

  const getVariantClasses = (variant?: string) => {
    switch (variant) {
      case 'danger':
        return 'text-red-600 hover:bg-red-50';
      case 'success':
        return 'text-green-600 hover:bg-green-50';
      default:
        return 'text-gray-700 hover:bg-gray-50';
    }
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Select All Checkbox */}
      <div className="flex items-center">
        <button
          onClick={handleToggleSelectAll}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title={isAllSelected ? 'Deselect all' : 'Select all'}
        >
          {isAllSelected ? (
            <CheckSquare className="w-5 h-5 text-blue-600" />
          ) : isSomeSelected ? (
            <div className="w-5 h-5 border-2 border-blue-600 rounded flex items-center justify-center">
              <div className="w-2.5 h-0.5 bg-blue-600"></div>
            </div>
          ) : (
            <Square className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {selectedIds.length > 0 && (
          <span className="ml-2 text-sm text-gray-700 font-medium">
            {selectedIds.length} selected
          </span>
        )}
      </div>

      {/* Bulk Actions Dropdown */}
      {selectedIds.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-medium">Bulk Actions</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              ></div>

              {/* Dropdown Menu */}
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-20">
                {actions.map((action) => (
                  <button
                    key={action.value}
                    onClick={() => handleAction(action)}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${getVariantClasses(
                      action.variant
                    )}`}
                  >
                    {action.icon && <span className="flex-shrink-0">{action.icon}</span>}
                    <span className="font-medium">{action.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {pendingAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Confirm Action
              </h3>
              <p className="text-gray-600 mb-6">
                {pendingAction.confirmMessage}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPendingAction(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => executeAction(pendingAction)}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium text-white ${
                    pendingAction.variant === 'danger'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkActions;
