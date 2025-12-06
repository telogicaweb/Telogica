import React, { useState } from 'react';
import { Plus, Trash2, Copy } from 'lucide-react';

interface UnitBatchEntryProps {
  onSave: (units: Array<{ serialNumber: string; modelNumber: string; warrantyPeriod: number }>) => void;
  defaultWarrantyMonths: number;
}

interface ModelGroup {
  id: string;
  modelNumber: string;
  warrantyPeriod: number;
  serialNumbers: string[]; // Array of serial number strings
}

const UnitBatchEntry: React.FC<UnitBatchEntryProps> = ({ onSave, defaultWarrantyMonths }) => {
  const [modelGroups, setModelGroups] = useState<ModelGroup[]>([
    { id: '1', modelNumber: '', warrantyPeriod: defaultWarrantyMonths, serialNumbers: [''] }
  ]);

  const addModelGroup = () => {
    setModelGroups([
      ...modelGroups,
      { 
        id: Date.now().toString(), 
        modelNumber: '', 
        warrantyPeriod: defaultWarrantyMonths, 
        serialNumbers: [''] 
      }
    ]);
  };

  const removeModelGroup = (id: string) => {
    setModelGroups(modelGroups.filter(g => g.id !== id));
  };

  const updateModelGroup = (id: string, field: keyof ModelGroup, value: any) => {
    setModelGroups(modelGroups.map(g => 
      g.id === id ? { ...g, [field]: value } : g
    ));
  };

  const addSerialNumber = (groupId: string) => {
    setModelGroups(modelGroups.map(g => 
      g.id === groupId ? { ...g, serialNumbers: [...g.serialNumbers, ''] } : g
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
        return { ...g, serialNumbers: g.serialNumbers.filter((_, i) => i !== index) };
      }
      return g;
    }));
  };

  const handleSave = () => {
    const flatUnits: Array<{ serialNumber: string; modelNumber: string; warrantyPeriod: number }> = [];
    
    modelGroups.forEach(group => {
      if (!group.modelNumber) return;
      
      group.serialNumbers.forEach(sn => {
        if (sn.trim()) {
          flatUnits.push({
            serialNumber: sn.trim(),
            modelNumber: group.modelNumber,
            warrantyPeriod: group.warrantyPeriod
          });
        }
      });
    });

    if (flatUnits.length > 0) {
      onSave(flatUnits);
    }
  };

  return (
    <div className="space-y-6">
      {modelGroups.map((group, groupIndex) => (
        <div key={group.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 mr-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model Number</label>
                <input
                  type="text"
                  value={group.modelNumber}
                  onChange={(e) => updateModelGroup(group.id, 'modelNumber', e.target.value)}
                  placeholder="e.g. TEL-101"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warranty (Months)</label>
                <input
                  type="number"
                  value={group.warrantyPeriod}
                  onChange={(e) => updateModelGroup(group.id, 'warrantyPeriod', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            {modelGroups.length > 1 && (
              <button
                onClick={() => removeModelGroup(group.id)}
                className="text-red-500 hover:text-red-700 p-1"
                title="Remove Model Group"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
              Serial Numbers ({group.serialNumbers.filter(s => s).length})
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {group.serialNumbers.map((sn, snIndex) => (
                <div key={snIndex} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={sn}
                    onChange={(e) => updateSerialNumber(group.id, snIndex, e.target.value)}
                    placeholder={`Serial #${snIndex + 1}`}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                  {group.serialNumbers.length > 1 && (
                    <button
                      onClick={() => removeSerialNumber(group.id, snIndex)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addSerialNumber(group.id)}
                className="flex items-center justify-center gap-1 px-3 py-1.5 text-sm border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                <Plus size={14} /> Add Serial
              </button>
            </div>
          </div>
        </div>
      ))}

      <div className="flex gap-3 pt-2">
        <button
          onClick={addModelGroup}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
        >
          <Copy size={16} /> Add Another Model
        </button>
        <button
          onClick={handleSave}
          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium shadow-sm"
        >
          Save All Units
        </button>
      </div>
    </div>
  );
};

export default UnitBatchEntry;
