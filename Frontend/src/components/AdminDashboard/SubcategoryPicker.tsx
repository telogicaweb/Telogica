import React, { useMemo, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';

interface SubcategoryPickerProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  emptyHint?: string;
}

const SubcategoryPicker: React.FC<SubcategoryPickerProps> = ({
  value,
  onChange,
  suggestions,
  placeholder = 'e.g. Radios, Antennas',
  emptyHint = 'No sub-categories yet. Type one to create.',
}) => {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const uniqueSuggestions = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const s of suggestions) {
      const t = (s || '').trim();
      if (!t) continue;
      const key = t.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(t);
    }
    return out;
  }, [suggestions]);

  const normalizedValue = value.trim();
  const existsExact = uniqueSuggestions.some((c) => c.toLowerCase() === normalizedValue.toLowerCase());

  const commitDraft = () => {
    const next = draft.trim();
    if (!next) {
      setAdding(false);
      return;
    }
    onChange(next);
    setDraft('');
    setAdding(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange('')}
          className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
            !normalizedValue
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
          }`}
        >
          Main Defence
        </button>

        {uniqueSuggestions.map((sc) => {
          const selected = sc.toLowerCase() === normalizedValue.toLowerCase();
          return (
            <button
              type="button"
              key={sc}
              onClick={() => onChange(sc)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                selected
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:text-indigo-700'
              }`}
            >
              {selected && <Check className="w-3.5 h-3.5" />}
              {sc}
            </button>
          );
        })}

        {!existsExact && normalizedValue && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-medium">
            <Plus className="w-3.5 h-3.5" /> New: {normalizedValue}
            <button
              type="button"
              onClick={() => onChange('')}
              className="ml-1 hover:bg-emerald-100 rounded-full"
              title="Clear"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-gray-300 text-sm font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-700"
          >
            <Plus className="w-3.5 h-3.5" /> Add sub-category
          </button>
        ) : (
          <div className="flex items-center gap-1 bg-white border border-indigo-300 rounded-full pl-3 pr-1 py-0.5">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitDraft}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitDraft();
                } else if (e.key === 'Escape') {
                  setDraft('');
                  setAdding(false);
                }
              }}
              placeholder={placeholder}
              className="text-sm bg-transparent outline-none w-40"
            />
            <button
              type="button"
              onClick={commitDraft}
              className="bg-indigo-600 text-white rounded-full p-1 hover:bg-indigo-700"
              title="Add"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      {uniqueSuggestions.length === 0 && !normalizedValue && (
        <p className="text-xs text-gray-500">{emptyHint}</p>
      )}
    </div>
  );
};

export default SubcategoryPicker;
