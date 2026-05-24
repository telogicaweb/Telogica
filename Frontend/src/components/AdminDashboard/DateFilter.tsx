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
    <div className={`bg-white rounded-none shadow-none border border-gray-250 p-4 ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Side: Title and Presets */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-700" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider whitespace-nowrap">{label}</span>
          </div>

          {showPresets && (
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => handlePresetChange('all')}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none transition-all border ${
                  !dateFrom && !dateTo
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => handlePresetChange('today')}
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-all"
              >
                Today
              </button>
              <button
                onClick={() => handlePresetChange('week')}
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-all"
              >
                Last 7 Days
              </button>
              <button
                onClick={() => handlePresetChange('month')}
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-all"
              >
                Last 30 Days
              </button>
              <button
                onClick={() => handlePresetChange('custom')}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none transition-all border ${
                  dateFrom || dateTo
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                }`}
              >
                Custom
              </button>
            </div>
          )}
        </div>

        {/* Right Side: From & To Date Inputs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="px-2 py-1 bg-gray-50 border border-gray-300 rounded-none text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none w-[130px] font-semibold"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">To</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="px-2 py-1 bg-gray-50 border border-gray-300 rounded-none text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none w-[130px] font-semibold"
            />
          </div>
        </div>
      </div>

      {(dateFrom || dateTo) && (
        <div className="mt-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
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
