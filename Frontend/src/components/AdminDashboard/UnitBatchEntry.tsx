import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Save, 
  Download, 
  Check, 
  X, 
  Hash, 
  Package,
  Calendar,
  BarChart3,
  Filter,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Scan,
  QrCode,
  Clipboard,
  ClipboardCheck,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface UnitBatchEntryProps {
  onSave: (units: Array<{ serialNumber: string; modelNumber: string; warrantyPeriod: number }>) => void;
  defaultWarrantyMonths: number;
}

interface ModelGroup {
  id: string;
  modelNumber: string;
  warrantyPeriod: number;
  serialNumbers: string[];
  isExpanded: boolean;
}

const UnitBatchEntry: React.FC<UnitBatchEntryProps> = ({ onSave, defaultWarrantyMonths }) => {
  const [modelGroups, setModelGroups] = useState<ModelGroup[]>([
    { 
      id: '1', 
      modelNumber: '', 
      warrantyPeriod: defaultWarrantyMonths, 
      serialNumbers: [''],
      isExpanded: true
    }
  ]);
  
  const [clipboardCopied, setClipboardCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'detailed' | 'compact'>('detailed');
  const [showSummary, setShowSummary] = useState(true);

  // Statistics
  const totalUnits = modelGroups.reduce((total, group) => 
    total + group.serialNumbers.filter(sn => sn.trim()).length, 0
  );
  
  const uniqueModels = new Set(modelGroups.filter(g => g.modelNumber.trim()).map(g => g.modelNumber)).size;

  const addModelGroup = () => {
    const newId = Date.now().toString();
    setModelGroups([
      ...modelGroups.map(g => ({ ...g, isExpanded: false })),
      { 
        id: newId, 
        modelNumber: '', 
        warrantyPeriod: defaultWarrantyMonths, 
        serialNumbers: [''],
        isExpanded: true
      }
    ]);
  };

  const removeModelGroup = (id: string) => {
    if (modelGroups.length > 1) {
      setModelGroups(modelGroups.filter(g => g.id !== id));
    }
  };

  const updateModelGroup = (id: string, field: keyof ModelGroup, value: any) => {
    setModelGroups(modelGroups.map(g => 
      g.id === id ? { ...g, [field]: value } : g
    ));
  };

  const addSerialNumber = (groupId: string, value?: string) => {
    setModelGroups(modelGroups.map(g => 
      g.id === groupId 
        ? { ...g, serialNumbers: [...g.serialNumbers, value || ''] }
        : g
    ));
  };

  const updateSerialNumber = (groupId: string, index: number, value: string) => {
    setModelGroups(modelGroups.map(g => {
      if (g.id === groupId) {
        const newSerials = [...g.serialNumbers];
        newSerials[index] = value;
        return { ...g, serialNumbers: newSerials };
      }
      return g;
    }));
  };

  const removeSerialNumber = (groupId: string, index: number) => {
    setModelGroups(modelGroups.map(g => {
      if (g.id === groupId) {
        return { 
          ...g, 
          serialNumbers: g.serialNumbers.filter((_, i) => i !== index) 
        };
      }
      return g;
    }));
  };

  const toggleGroupExpansion = (groupId: string) => {
    setModelGroups(modelGroups.map(g => 
      g.id === groupId ? { ...g, isExpanded: !g.isExpanded } : g
    ));
  };

  const exportToCSV = () => {
    const units = modelGroups.flatMap(group => 
      group.serialNumbers
        .filter(sn => sn.trim())
        .map(sn => ({
          Model: group.modelNumber,
          'Serial Number': sn,
          Warranty: `${group.warrantyPeriod} months`
        }))
    );

    if (units.length === 0) {
      alert('No units to export');
      return;
    }

    const headers = Object.keys(units[0]);
    const csvContent = [
      headers.join(','),
      ...units.map(row => 
        headers.map(header => JSON.stringify(row[header as keyof typeof row])).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `units_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = () => {
    const text = modelGroups.map(group => 
      group.serialNumbers
        .filter(sn => sn.trim())
        .map(sn => `${group.modelNumber || 'UNKNOWN'}: ${sn}`)
        .join('\n')
    ).join('\n');
    
    navigator.clipboard.writeText(text).then(() => {
      setClipboardCopied(true);
      setTimeout(() => setClipboardCopied(false), 2000);
    });
  };

  const handleSave = () => {
    const flatUnits: Array<{ serialNumber: string; modelNumber: string; warrantyPeriod: number }> = [];
    
    modelGroups.forEach(group => {
      if (!group.modelNumber.trim()) return;
      
      group.serialNumbers.forEach(sn => {
        if (sn.trim()) {
          flatUnits.push({
            serialNumber: sn.trim(),
            modelNumber: group.modelNumber.trim(),
            warrantyPeriod: group.warrantyPeriod
          });
        }
      });
    });

    if (flatUnits.length === 0) {
      alert('Please add at least one unit with serial number and model');
      return;
    }

    onSave(flatUnits);
  };

  const duplicateGroup = (groupId: string) => {
    const groupToDuplicate = modelGroups.find(g => g.id === groupId);
    if (groupToDuplicate) {
      const newGroup: ModelGroup = {
        id: Date.now().toString() + Math.random(),
        modelNumber: `${groupToDuplicate.modelNumber} - Copy`,
        warrantyPeriod: groupToDuplicate.warrantyPeriod,
        serialNumbers: [...groupToDuplicate.serialNumbers],
        isExpanded: true
      };
      setModelGroups([...modelGroups, newGroup]);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 overflow-auto z-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Batch Unit Entry</h1>
                <p className="text-sm text-gray-600">Add multiple product units with model grouping</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                <Package className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <div className="text-xs text-blue-600 font-medium">Models</div>
                  <div className="text-lg font-bold text-blue-700">{uniqueModels}</div>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
                <Hash className="w-5 h-5 text-green-600" />
                <div className="text-left">
                  <div className="text-xs text-green-600 font-medium">Units</div>
                  <div className="text-lg font-bold text-green-700">{totalUnits}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32 space-y-6">
        {/* Quick Help */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-2">Quick Guide</h4>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-blue-800">
                <div>• Create groups for different models</div>
                <div>• Add serial numbers one by one</div>
                <div>• Set warranty per model group</div>
                <div>• Duplicate groups to save time</div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Model Button */}
        <div className="text-center">
          <button
            onClick={addModelGroup}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-bold text-lg transition-all shadow-lg hover:shadow-xl"
          >
            <Plus className="w-6 h-6" />
            Add New Model Group
          </button>
        </div>

        {/* Model Groups List */}
        <div className="space-y-5">
          {modelGroups.map((group, groupIndex) => (
            <div 
              key={group.id} 
              className={`bg-white rounded-2xl shadow-md border-2 transition-all ${
                group.isExpanded 
                  ? 'border-indigo-400 shadow-xl' 
                  : 'border-gray-200 hover:border-gray-300 shadow-sm'
              }`}
            >
              {/* Group Header */}
              <div 
                className={`px-6 py-5 cursor-pointer ${
                  group.isExpanded 
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-100' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => toggleGroupExpansion(group.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl transition-all ${
                    group.isExpanded 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-indigo-600 border-2 border-indigo-200'
                  }`}>
                    {group.isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-sm ${
                        group.isExpanded 
                          ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white' 
                          : 'bg-white text-indigo-600 border-2 border-indigo-200'
                      }`}>
                        <Package className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={group.modelNumber}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateModelGroup(group.id, 'modelNumber', e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Enter Model Number (e.g., ROUTER-5000)"
                          className={`text-xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 w-full placeholder:text-gray-400 ${
                            group.isExpanded ? 'text-indigo-900' : 'text-gray-900'
                          }`}
                        />
                        <div className="flex flex-wrap items-center gap-4 mt-1 text-sm">
                          <span className={`flex items-center gap-1.5 font-semibold ${
                            group.isExpanded ? 'text-indigo-700' : 'text-gray-600'
                          }`}>
                            <Hash className="w-4 h-4" />
                            {group.serialNumbers.filter(s => s.trim()).length} units
                          </span>
                          <span className={`flex items-center gap-1.5 font-semibold ${
                            group.isExpanded ? 'text-indigo-700' : 'text-gray-600'
                          }`}>
                            <Calendar className="w-4 h-4" />
                            {group.warrantyPeriod} months warranty
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => duplicateGroup(group.id)}
                      className="p-3 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      title="Duplicate model"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => removeModelGroup(group.id)}
                      className="p-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Remove model"
                      disabled={modelGroups.length <= 1}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {group.isExpanded && (
                <div className="p-6 space-y-6 bg-white">
                  {/* Model Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Model Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={group.modelNumber}
                        onChange={(e) => updateModelGroup(group.id, 'modelNumber', e.target.value)}
                        placeholder="e.g., ROUTER-5000, SWITCH-X200"
                        className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold text-lg"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Warranty Period <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={group.warrantyPeriod}
                          onChange={(e) => updateModelGroup(group.id, 'warrantyPeriod', parseInt(e.target.value) || 0)}
                          min="0"
                          max="120"
                          className="flex-1 px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold text-lg"
                        />
                        <span className="text-gray-700 font-semibold whitespace-nowrap">months</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Add Button */}
                  <div>
                    <button
                      onClick={() => addSerialNumber(group.id)}
                      className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 rounded-xl flex items-center justify-center gap-3 font-bold text-lg transition-all shadow-md hover:shadow-lg"
                    >
                      <Plus className="w-6 h-6" />
                      Add New Serial Number
                    </button>
                  </div>

                  {/* Serial Numbers Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Hash className="w-6 h-6 text-indigo-600" />
                        Serial Numbers
                        <span className="text-base font-normal text-gray-500">
                          ({group.serialNumbers.filter(s => s.trim()).length} entered)
                        </span>
                      </h4>
                      {group.serialNumbers.filter(s => s.trim()).length > 6 && (
                        <button
                          onClick={() => setViewMode(viewMode === 'detailed' ? 'compact' : 'detailed')}
                          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 font-semibold transition-colors"
                        >
                          {viewMode === 'detailed' ? (
                            <>
                              <EyeOff className="w-4 h-4" />
                              Compact
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              Detailed
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    
                    <div className={`grid gap-4 ${
                      viewMode === 'detailed' 
                        ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' 
                        : 'grid-cols-1'
                    }`}>
                      {group.serialNumbers.map((sn, snIndex) => (
                        <div 
                          key={snIndex} 
                          className="group flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
                        >
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-lg shadow-sm">
                            {snIndex + 1}
                          </div>
                          
                          <input
                            type="text"
                            value={sn}
                            onChange={(e) => updateSerialNumber(group.id, snIndex, e.target.value)}
                            placeholder={`Serial #${snIndex + 1}`}
                            className="flex-1 bg-transparent border-none focus:outline-none font-semibold text-gray-900 placeholder:text-gray-400 text-base"
                          />
                          
                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => navigator.clipboard.writeText(sn)}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Copy"
                            >
                              <Clipboard className="w-5 h-5" />
                            </button>
                            
                            <button
                              onClick={() => removeSerialNumber(group.id, snIndex)}
                              disabled={group.serialNumbers.length <= 1}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Remove"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      <button
                        onClick={() => addSerialNumber(group.id)}
                        className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-semibold"
                      >
                        <Plus className="w-6 h-6" />
                        <span>Add Another</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
          </div>
        ))}
        </div>

        {/* Summary Panel */}
        {showSummary && (
          <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 rounded-2xl border-2 border-emerald-300 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-green-600 text-white rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6" />
                </div>
                Batch Summary
              </h3>
              <button
                onClick={() => setShowSummary(false)}
                className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all"
                title="Hide summary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border-2 border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                <p className="text-sm font-bold text-gray-600 mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-500" />
                  Total Models
                </p>
                <p className="text-4xl font-black text-gray-900">{uniqueModels}</p>
              </div>
              
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-2xl border-2 border-indigo-200 shadow-md hover:shadow-lg transition-shadow">
                <p className="text-sm font-bold text-indigo-700 mb-2 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-indigo-600" />
                  Total Units
                </p>
                <p className="text-4xl font-black text-indigo-600">{totalUnits}</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-2xl border-2 border-green-200 shadow-md hover:shadow-lg transition-shadow">
                <p className="text-sm font-bold text-green-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                  Avg Warranty
                </p>
                <p className="text-4xl font-black text-green-600">
                  {modelGroups.length > 0 
                    ? Math.round(modelGroups.reduce((sum, g) => sum + g.warrantyPeriod, 0) / modelGroups.length)
                    : 0}
                </p>
                <p className="text-sm font-bold text-green-600 mt-1">months</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-2xl border-2 border-purple-200 shadow-md hover:shadow-lg transition-shadow">
                <p className="text-sm font-bold text-purple-700 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  Complete
                </p>
                <p className="text-4xl font-black text-purple-600">
                  {modelGroups.filter(g => g.modelNumber.trim() && g.serialNumbers.filter(s => s.trim()).length > 0).length}
                </p>
                <p className="text-sm font-bold text-purple-600 mt-1">ready</p>
              </div>
            </div>
          </div>
        )}

        {/* Sticky Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t-2 border-gray-300 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex flex-wrap gap-3 flex-1">
                <button
                  onClick={exportToCSV}
                  className="px-6 py-3.5 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 flex items-center gap-2 font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={totalUnits === 0}
                  title="Export all data to CSV"
                >
                  <Download className="w-5 h-5" />
                  Export CSV
                </button>
                
                <button
                  onClick={copyToClipboard}
                  className="px-6 py-3.5 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 flex items-center gap-2 font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={totalUnits === 0}
                  title="Copy all serial numbers to clipboard"
                >
                  {clipboardCopied ? (
                    <>
                      <ClipboardCheck className="w-5 h-5 text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-5 h-5" />
                      Copy All
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setShowSummary(!showSummary)}
                  className="px-6 py-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 text-indigo-700 rounded-xl hover:from-indigo-100 hover:to-purple-100 hover:border-indigo-300 flex items-center gap-2 font-bold transition-all shadow-md hover:shadow-lg"
                  title="Toggle summary panel"
                >
                  <BarChart3 className="w-5 h-5" />
                  {showSummary ? 'Hide' : 'Show'} Summary
                </button>
              </div>
              
              <button
                onClick={handleSave}
                className="w-full sm:w-auto px-12 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 flex items-center justify-center gap-3 font-black text-lg transition-all shadow-xl hover:shadow-2xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
                disabled={totalUnits === 0}
                title={`Save ${totalUnits} product units`}
              >
                <Save className="w-6 h-6" />
                Save All Units ({totalUnits})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnitBatchEntry;