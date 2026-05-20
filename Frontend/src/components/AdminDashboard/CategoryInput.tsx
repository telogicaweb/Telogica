import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Plus, Search, Tag, X } from 'lucide-react';

interface CategoryInputProps {
  value: string;
  onChange: (value: string) => void;
  categories: string[];
  recentCategories?: string[];
  allowCreate?: boolean;
}

const CategoryInput: React.FC<CategoryInputProps> = ({
  value,
  onChange,
  categories,
  recentCategories = [],
  allowCreate = true,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSearch(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allCategories = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const c of [...recentCategories, ...categories]) {
      const trimmed = c?.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(trimmed);
    }
    return result;
  }, [categories, recentCategories]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return allCategories;
    return allCategories.filter((c) => c.toLowerCase().includes(searchTerm.trim().toLowerCase()));
  }, [allCategories, searchTerm]);

  const normalizedValue = value.trim();
  const existsExact = allCategories.some((c) => c.toLowerCase() === normalizedValue.toLowerCase());
  const searchHasExact =
    searchTerm.trim().length > 0 &&
    allCategories.some((c) => c.toLowerCase() === searchTerm.trim().toLowerCase());

  const selectCategory = (cat: string) => {
    onChange(cat);
    setSearchTerm('');
    setShowSearch(false);
  };

  const createFromSearch = () => {
    const next = searchTerm.trim();
    if (!next) return;
    onChange(next);
    setSearchTerm('');
    setShowSearch(false);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length === 1) {
        selectCategory(filtered[0]);
      } else if (allowCreate && searchTerm.trim() && !searchHasExact) {
        createFromSearch();
      } else if (filtered.length > 0) {
        selectCategory(filtered[0]);
      }
    } else if (e.key === 'Escape') {
      setShowSearch(false);
      setSearchTerm('');
    }
  };

  return (
    <div ref={wrapperRef} className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {allCategories.map((cat) => {
          const selected = cat.toLowerCase() === normalizedValue.toLowerCase();
          return (
            <button
              type="button"
              key={cat}
              onClick={() => selectCategory(cat)}
              className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                selected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:text-indigo-700'
              }`}
            >
              {selected ? <Check className="w-3.5 h-3.5" /> : <Tag className="w-3.5 h-3.5" />}
              {cat}
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

        <button
          type="button"
          onClick={() => {
            setShowSearch((s) => !s);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-gray-300 text-sm font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-700"
        >
          <Plus className="w-3.5 h-3.5" /> {allowCreate ? 'Add / search' : 'Search'}
        </button>
      </div>

      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={allowCreate ? 'Search or type to create new…' : 'Search…'}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {(filtered.length > 0 || (allowCreate && searchTerm.trim() && !searchHasExact)) && (
            <div className="mt-1 max-h-52 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm">
              {filtered.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => selectCategory(cat)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-gray-400" /> {cat}
                  </span>
                  {cat.toLowerCase() === normalizedValue.toLowerCase() && (
                    <Check className="w-4 h-4 text-indigo-600" />
                  )}
                </button>
              ))}
              {allowCreate && searchTerm.trim() && !searchHasExact && (
                <button
                  type="button"
                  onClick={createFromSearch}
                  className="w-full text-left px-3 py-2 text-sm text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 border-t border-emerald-100 flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" /> Create "{searchTerm.trim()}"
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryInput;
