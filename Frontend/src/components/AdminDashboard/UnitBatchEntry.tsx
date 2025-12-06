import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Save, 
  Upload, 
  Download, 
  Check, 
  X, 
  Hash, 
  Package,
  Calendar,
  BarChart3,
  Filter,
  FileSpreadsheet,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Scan,
  QrCode,
  Clipboard,
  ClipboardCheck,
  AlertCircle
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
  
  const [bulkSerialInput, setBulkSerialInput] = useState<string>('');
  const [selectedGroupForBulk, setSelectedGroupForBulk] = useState<string>('');
  const [clipboardCopied, setClipboardCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'detailed' | 'compact'>('detailed');
  const [showSummary, setShowSummary] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setSelectedGroupForBulk(newId);
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

  const handleBulkSerialImport = () => {
    if (!selectedGroupForBulk || !bulkSerialInput.trim()) return;
    
    const serials = bulkSerialInput
      .split(/[\n,;]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    if (serials.length > 0) {
      const group = modelGroups.find(g => g.id === selectedGroupForBulk);
      if (group) {
        const existingSerials = new Set(group.serialNumbers.filter(s => s.trim()));
        const newSerials = serials.filter(s => !existingSerials.has(s));
        
        setModelGroups(modelGroups.map(g => 
          g.id === selectedGroupForBulk 
            ? { ...g, serialNumbers: [...g.serialNumbers, ...newSerials] }
            : g
        ));
        
        setBulkSerialInput('');
        alert(`Added ${newSerials.length} new serial numbers to ${group.modelNumber || 'selected model'}`);
      }
    }
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n').map(line => line.trim()).filter(line => line);
        
        if (lines.length === 0) {
          alert('File is empty');
          return;
        }

        // Try to parse CSV format (model,serial,warranty)
        const firstLine = lines[0];
        const parts = firstLine.split(',');
        
        if (parts.length >= 2) {
          const newGroups: ModelGroup[] = [];
          
          lines.forEach(line => {
            const [model = '', serial = '', warranty = ''] = line.split(',');
            const warrantyMonths = parseInt(warranty) || defaultWarrantyMonths;
            
            let group = newGroups.find(g => g.modelNumber === model);
            if (!group && model) {
              group = {
                id: Date.now().toString() + Math.random(),
                modelNumber: model,
                warrantyPeriod: warrantyMonths,
                serialNumbers: [],
                isExpanded: false
              };
              newGroups.push(group);
            }
            
            if (group && serial) {
              group.serialNumbers.push(serial);
            }
          });
          
          setModelGroups([...modelGroups, ...newGroups]);
          alert(`Imported ${lines.length} units from CSV`);
        } else {
          // Assume it's just serial numbers
          if (modelGroups.length > 0) {
            const lastGroup = modelGroups[modelGroups.length - 1];
            addSerialNumbersToGroup(lastGroup.id, lines);
          }
        }
      } catch (error) {
        alert('Error reading file. Please check the format.');
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addSerialNumbersToGroup = (groupId: string, serials: string[]) => {
    setModelGroups(modelGroups.map(g => {
      if (g.id === groupId) {
        const existing = new Set(g.serialNumbers);
        const newSerials = serials.filter(s => s && !existing.has(s));
        return { ...g, serialNumbers: [...g.serialNumbers, ...newSerials] };
      }
      return g;
    }));
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Batch Unit Entry</h2>
            <p className="text-gray-600 mt-1">Add multiple units efficiently with model grouping</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-gray-200">
              <Package className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">{uniqueModels} Models</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-gray-200">
              <Hash className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">{totalUnits} Units</span>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Bulk Add to Model
              </label>
              <select
                value={selectedGroupForBulk}
                onChange={(e) => setSelectedGroupForBulk(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Select Model</option>
                {modelGroups.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.modelNumber || 'New Model'} ({g.serialNumbers.length} units)
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Serial Numbers (comma/line separated)
              </label>
              <input
                type="text"
                value={bulkSerialInput}
                onChange={(e) => setBulkSerialInput(e.target.value)}
                placeholder="SN001, SN002, SN003"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                disabled={!selectedGroupForBulk}
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleBulkSerialImport}
                disabled={!selectedGroupForBulk || !bulkSerialInput.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Import
              </button>
            </div>
            
            <div className="flex items-end gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv,.txt"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Upload CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Model Groups */}
      <div className="space-y-4">
        {modelGroups.map((group, groupIndex) => (
          <div 
            key={group.id} 
            className={`bg-white rounded-xl border transition-all hover:shadow-md ${
              group.isExpanded ? 'border-blue-200 shadow-sm' : 'border-gray-200'
            }`}
          >
            {/* Group Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => toggleGroupExpansion(group.id)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {group.isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={group.modelNumber}
                          onChange={(e) => updateModelGroup(group.id, 'modelNumber', e.target.value)}
                          placeholder="Enter Model Number (e.g., TEL-101)"
                          className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-0 w-full placeholder:text-gray-400"
                        />
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Hash className="w-3.5 h-3.5" />
                            {group.serialNumbers.filter(s => s.trim()).length} units
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {group.warrantyPeriod} months warranty
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => duplicateGroup(group.id)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Duplicate Model"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => removeModelGroup(group.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove Model"
                    disabled={modelGroups.length <= 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {group.isExpanded && (
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Model Details
                    </label>
                    <input
                      type="text"
                      value={group.modelNumber}
                      onChange={(e) => updateModelGroup(group.id, 'modelNumber', e.target.value)}
                      placeholder="Model Number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Warranty Period
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={group.warrantyPeriod}
                        onChange={(e) => updateModelGroup(group.id, 'warrantyPeriod', parseInt(e.target.value) || 0)}
                        min="0"
                        max="120"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span className="text-gray-500 whitespace-nowrap">months</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quick Actions
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => addSerialNumber(group.id)}
                        className="flex-1 px-4 py-3 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Serial
                      </button>
                    </div>
                  </div>
                </div>

                {/* Serial Numbers Grid */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      Serial Numbers ({group.serialNumbers.filter(s => s.trim()).length})
                    </h4>
                    <div className="flex items-center gap-2">
                      {group.serialNumbers.filter(s => s.trim()).length > 5 && (
                        <button
                          onClick={() => setViewMode(viewMode === 'detailed' ? 'compact' : 'detailed')}
                          className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1"
                        >
                          {viewMode === 'detailed' ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              Compact
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              Detailed
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className={`grid gap-3 ${
                    viewMode === 'detailed' 
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                      : 'grid-cols-1'
                  }`}>
                    {group.serialNumbers.map((sn, snIndex) => (
                      <div 
                        key={snIndex} 
                        className="group flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                      >
                        <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-gray-600">{snIndex + 1}</span>
                        </div>
                        
                        <input
                          type="text"
                          value={sn}
                          onChange={(e) => updateSerialNumber(group.id, snIndex, e.target.value)}
                          placeholder={`Serial Number ${snIndex + 1}`}
                          className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-gray-400"
                        />
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigator.clipboard.writeText(sn)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Copy to clipboard"
                          >
                            <Clipboard className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => removeSerialNumber(group.id, snIndex)}
                            disabled={group.serialNumbers.length <= 1}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                            title="Remove serial"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <button
                      onClick={() => addSerialNumber(group.id)}
                      className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Add New Serial Number</span>
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
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-emerald-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Batch Summary
            </h3>
            <button
              onClick={() => setShowSummary(false)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Total Models</p>
              <p className="text-2xl font-bold text-gray-900">{uniqueModels}</p>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Total Units</p>
              <p className="text-2xl font-bold text-blue-600">{totalUnits}</p>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Avg Warranty</p>
              <p className="text-2xl font-bold text-green-600">
                {modelGroups.length > 0 
                  ? Math.round(modelGroups.reduce((sum, g) => sum + g.warrantyPeriod, 0) / modelGroups.length)
                  : 0} months
              </p>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Complete Models</p>
              <p className="text-2xl font-bold text-purple-600">
                {modelGroups.filter(g => g.modelNumber.trim() && g.serialNumbers.filter(s => s.trim()).length > 0).length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="sticky bottom-6 bg-white border border-gray-200 rounded-xl p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-3">
            <button
              onClick={addModelGroup}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 transition-all shadow-sm hover:shadow"
            >
              <Plus className="w-5 h-5" />
              Add New Model
            </button>
            
            <button
              onClick={exportToCSV}
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
              disabled={totalUnits === 0}
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
            
            <button
              onClick={copyToClipboard}
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
              disabled={totalUnits === 0}
            >
              {clipboardCopied ? (
                <>
                  <ClipboardCheck className="w-5 h-5 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Clipboard className="w-5 h-5" />
                  Copy All
                </>
              )}
            </button>
          </div>
          
          <div className="flex-1" />
          
          <button
            onClick={handleSave}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 flex items-center justify-center gap-2 font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            <Save className="w-5 h-5" />
            Save All Units ({totalUnits})
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnitBatchEntry;