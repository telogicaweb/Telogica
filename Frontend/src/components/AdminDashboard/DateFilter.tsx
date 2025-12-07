import React from 'react';
import { Calendar } from 'lucide-react';

interface DateFilterProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onPresetChange?: (preset: 'all' | 'today' | 'week' | 'month' | 'custom') => void;
  showPresets?: boolean;
  label?: string;
  className?: string;
}

const DateFilter: React.FC<DateFilterProps> = ({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onPresetChange,
  showPresets = true,
  label = 'Date Range',
  className = '',
}) => {
  const handlePresetChange = (preset: 'all' | 'today' | 'week' | 'month' | 'custom') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (preset) {
      case 'all':
        onDateFromChange('');
        onDateToChange('');
        break;
      case 'today':
        const todayStr = today.toISOString().split('T')[0];
        onDateFromChange(todayStr);
        onDateToChange(todayStr);
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        onDateFromChange(weekAgo.toISOString().split('T')[0]);
        onDateToChange(today.toISOString().split('T')[0]);
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        onDateFromChange(monthAgo.toISOString().split('T')[0]);
        onDateToChange(today.toISOString().split('T')[0]);
        break;
      case 'custom':
        // Let user set custom dates
        break;
    }
    
    if (onPresetChange) {
      onPresetChange(preset);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-5 h-5 text-gray-600" />
        <span className="text-sm font-semibold text-gray-700">{label}</span>
      </div>

      {showPresets && (
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => handlePresetChange('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              !dateFrom && !dateTo
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => handlePresetChange('today')}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
          >
            Today
          </button>
          <button
            onClick={() => handlePresetChange('week')}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
          >
            Last 7 Days
          </button>
          <button
            onClick={() => handlePresetChange('month')}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
          >
            Last 30 Days
          </button>
          <button
            onClick={() => handlePresetChange('custom')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              dateFrom || dateTo
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Custom
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            From Date
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            To Date
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {(dateFrom || dateTo) && (
        <div className="mt-3 text-xs text-gray-600">
          {dateFrom && dateTo ? (
            <span>Showing data from {dateFrom} to {dateTo}</span>
          ) : dateFrom ? (
            <span>Showing data from {dateFrom} onwards</span>
          ) : (
            <span>Showing data up to {dateTo}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default DateFilter;
