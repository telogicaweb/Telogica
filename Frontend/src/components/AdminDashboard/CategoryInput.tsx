import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus } from 'lucide-react';

interface CategoryInputProps {
  value: string;
  onChange: (value: string) => void;
  categories: string[];
}

const CategoryInput: React.FC<CategoryInputProps> = ({ value, onChange, categories }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCategories = categories.filter(cat => 
    cat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (cat: string) => {
    onChange(cat);
    setSearchTerm(cat);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
          placeholder="Select or type category"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleSelect(cat)}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
              >
                {cat}
              </button>
            ))
          ) : (
            searchTerm && (
              <div className="px-4 py-2 text-sm text-gray-500 flex items-center gap-2">
                <Plus size={14} />
                <span>Create "{searchTerm}"</span>
              </div>
            )
          )}
          {!searchTerm && filteredCategories.length === 0 && (
             <div className="px-4 py-2 text-sm text-gray-500">No categories found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryInput;
