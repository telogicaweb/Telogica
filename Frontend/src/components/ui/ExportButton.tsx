import React, { useState } from 'react';
import { Download, FileText, Table, File } from 'lucide-react';
import { saveAs } from 'file-saver';

interface ExportButtonProps {
  endpoint: string;
  filename: string;
  filters?: Record<string, any>;
  label?: string;
  className?: string;
  showDropdown?: boolean;
}

/**
 * Reusable Export Button Component
 * Supports PDF, CSV, and Excel exports with optional dropdown
 */
const ExportButton: React.FC<ExportButtonProps> = ({
  endpoint,
  filename,
  filters = {},
  label = 'Export',
  className = '',
  showDropdown = true,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleExport = async (format: 'pdf' | 'csv' | 'excel') => {
    setIsLoading(true);
    setError(null);
    setShowMenu(false);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Build query string
      const queryParams = new URLSearchParams({
        format,
        ...filters,
      });

      const response = await fetch(`${API_URL}/api/export/${endpoint}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Export failed');
      }

      // Get the blob
      const blob = await response.blob();
      
      // Determine file extension
      const extension = format === 'excel' ? 'xlsx' : format;
      const fullFilename = `${filename}-${new Date().getTime()}.${extension}`;
      
      // Download file
      saveAs(blob, fullFilename);
      
    } catch (err: any) {
      console.error('Export error:', err);
      setError(err.message || 'Failed to export');
    } finally {
      setIsLoading(false);
    }
  };

  const exportFormats = [
    { format: 'pdf' as const, icon: FileText, label: 'Export as PDF', color: 'text-red-600' },
    { format: 'csv' as const, icon: Table, label: 'Export as CSV', color: 'text-green-600' },
    { format: 'excel' as const, icon: File, label: 'Export as Excel', color: 'text-blue-600' },
  ];

  if (!showDropdown) {
    // Simple button - exports as PDF by default
    return (
      <div className="relative">
        <button
          onClick={() => handleExport('pdf')}
          disabled={isLoading}
          className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>{label}</span>
            </>
          )}
        </button>
        {error && (
          <div className="absolute top-full mt-2 p-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg whitespace-nowrap z-10">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>{label}</span>
            <svg
              className={`w-4 h-4 transition-transform ${showMenu ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {showMenu && !isLoading && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          ></div>
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-20">
            {exportFormats.map(({ format, icon: Icon, label, color }) => (
              <button
                key={format}
                onClick={() => handleExport(format)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <Icon className={`w-5 h-5 ${color}`} />
                <span className="text-gray-700 font-medium">{label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {error && (
        <div className="absolute top-full mt-2 right-0 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg shadow-lg whitespace-nowrap z-10">
          {error}
        </div>
      )}
    </div>
  );
};

export default ExportButton;
