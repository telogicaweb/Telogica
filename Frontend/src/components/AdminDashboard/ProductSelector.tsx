import React, { useState, useMemo } from 'react';
import { Search, Filter, Check } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  category: string;
  imageUrl?: string;
  images?: string[];
}

interface ProductSelectorProps {
  products: Product[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({ products, selectedIds, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const toggleProduct = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(pid => pid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      <div className="p-3 border-b border-gray-200 bg-gray-50 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400 w-4 h-4" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="max-h-60 overflow-y-auto p-2 space-y-1">
        {filteredProducts.length === 0 ? (
          <p className="text-center text-gray-500 py-4 text-sm">No products found</p>
        ) : (
          filteredProducts.map(product => {
            const isSelected = selectedIds.includes(product._id);
            return (
              <div
                key={product._id}
                onClick={() => toggleProduct(product._id)}
                className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                  isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                  isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
                {product.images?.[0] || product.imageUrl ? (
                  <img 
                    src={product.images?.[0] || product.imageUrl} 
                    alt={product.name} 
                    className="w-8 h-8 rounded object-cover bg-gray-100"
                  />
                ) : (
                  <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                    Img
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500 truncate">{product.category}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <div className="p-2 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
        <span className="text-xs text-gray-500">{selectedIds.length} selected</span>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs text-red-600 hover:text-red-800 font-medium"
          >
            Clear Selection
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductSelector;
