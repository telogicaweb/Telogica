import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Check, X, Grid, List, Star, Tag, Zap, ChevronDown, ChevronUp } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  category: string;
  price?: number;
  rating?: number;
  stock?: number;
  tags?: string[];
  imageUrl?: string;
  images?: string[];
}

interface ProductSelectorProps {
  products: Product[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  maxSelections?: number;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({
  products,
  selectedIds,
  onChange,
  maxSelections
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'rating'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Extract all tags from products
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    products.forEach(product => {
      product.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [products]);

  // Extract categories with counts
  const categories = useMemo(() => {
    const categoryMap = new Map<string, number>();
    products.forEach(product => {
      categoryMap.set(product.category, (categoryMap.get(product.category) || 0) + 1);
    });
    
    const allCount = products.length;
    const categoryList = Array.from(categoryMap.entries()).map(([name, count]) => ({
      name,
      count
    })).sort((a, b) => a.name.localeCompare(b.name));
    
    return [{ name: 'All', count: allCount }, ...categoryList];
  }, [products]);

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.every(tag => product.tags?.includes(tag));
      return matchesSearch && matchesCategory && matchesTags;
    });

    // Sort products
    filtered.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'price':
          aValue = a.price || 0;
          bValue = b.price || 0;
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, selectedTags, sortBy, sortOrder]);

  // Group products by category
  const productsByCategory = useMemo(() => {
    const grouped = new Map<string, Product[]>();
    filteredProducts.forEach(product => {
      if (!grouped.has(product.category)) {
        grouped.set(product.category, []);
      }
      grouped.get(product.category)?.push(product);
    });
    return grouped;
  }, [filteredProducts]);

  // Get selected products
  const selectedProducts = useMemo(() => {
    return products.filter(p => selectedIds.includes(p._id));
  }, [products, selectedIds]);

  const toggleProduct = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(pid => pid !== id));
    } else {
      if (maxSelections && selectedIds.length >= maxSelections) {
        return; // Don't allow more selections
      }
      onChange([...selectedIds, id]);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Quick select all in category
  const selectAllInCategory = (category: string) => {
    const categoryProducts = filteredProducts.filter(p => p.category === category);
    const categoryIds = categoryProducts.map(p => p._id);
    const newSelectedIds = [...new Set([...selectedIds, ...categoryIds])];
    
    if (maxSelections && newSelectedIds.length > maxSelections) {
      // Truncate to max selections
      onChange(newSelectedIds.slice(0, maxSelections));
    } else {
      onChange(newSelectedIds);
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedTags([]);
    setSortBy('name');
    setSortOrder('asc');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Select Products</h2>
            <p className="text-sm text-gray-600">Choose products to add to your collection</p>
          </div>
          {maxSelections && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-blue-200">
              <Zap className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">
                {selectedIds.length}/{maxSelections} selected
              </span>
            </div>
          )}
        </div>

        {/* Search and Quick Actions */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              className={`px-3 py-2.5 rounded-lg border transition-colors ${viewMode === 'list' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
              title={`Switch to ${viewMode === 'list' ? 'grid' : 'list'} view`}
            >
              {viewMode === 'list' ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Filters */}
        <div className="w-64 border-r border-gray-200 bg-gray-50 p-4 space-y-4">
          {/* Categories */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Filter className="w-4 h-4" />
                Categories
              </h3>
              <span className="text-xs text-gray-500">{categories.length - 1}</span>
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {categories.map(({ name, count }) => (
                <button
                  type="button"
                  key={name}
                  onClick={() => setSelectedCategory(name)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === name
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span>{name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    selectedCategory === name
                      ? 'bg-blue-200 text-blue-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  Tags
                </h3>
                {selectedTags.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTags([])}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-purple-100 text-purple-700 border border-purple-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sorting */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Sort By</h3>
            <div className="space-y-2">
              {['name', 'price', 'rating'].map((sortOption) => (
                <button
                  type="button"
                  key={sortOption}
                  onClick={() => {
                    if (sortBy === sortOption) {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy(sortOption as 'name' | 'price' | 'rating');
                      setSortOrder('asc');
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    sortBy === sortOption
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="capitalize">{sortOption}</span>
                  {sortBy === sortOption && (
                    <span className="text-blue-500">
                      {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Clear All Button */}
          {(searchTerm || selectedCategory !== 'All' || selectedTags.length > 0) && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="w-full mt-4 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear All Filters
            </button>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4">
          {/* Stats Bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredProducts.length}</span> of{' '}
              <span className="font-semibold">{products.length}</span> products
              {selectedTags.length > 0 && (
                <span className="ml-2">
                  with tags: <span className="font-medium text-purple-600">{selectedTags.join(', ')}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear Selection
                </button>
              )}
            </div>
          </div>

          {/* Products Grid/List */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Try adjusting your search or filter criteria to find what you're looking for.
              </p>
              {(searchTerm || selectedCategory !== 'All' || selectedTags.length > 0) && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            // Grid View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredProducts.map(product => {
                const isSelected = selectedIds.includes(product._id);
                const isDisabled = maxSelections && selectedIds.length >= maxSelections && !isSelected;

                return (
                  <div
                    key={product._id}
                    onClick={() => !isDisabled && toggleProduct(product._id)}
                    className={`relative rounded-xl border p-4 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                        : isDisabled
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <div className="relative">
                        {product.images?.[0] || product.imageUrl ? (
                          <img
                            src={product.images?.[0] || product.imageUrl}
                            alt={product.name}
                            className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">Image</span>
                          </div>
                        )}
                        {product.rating && (
                          <div className="absolute -bottom-1 -right-1 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-current" />
                            {product.rating.toFixed(1)}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                        <p className="text-sm text-gray-500 mb-1">{product.category}</p>
                        
                        {product.price && (
                          <div className="text-sm font-semibold text-blue-600">
                            ${product.price.toFixed(2)}
                          </div>
                        )}

                        {product.tags && product.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {product.tags.slice(0, 2).map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            {product.tags.length > 2 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                +{product.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // List View (by category)
            <div className="space-y-6">
              {Array.from(productsByCategory.entries()).map(([category, categoryProducts]) => (
                <div key={category}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleCategory(category)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {expandedCategories.has(category) ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                      <h3 className="text-lg font-semibold text-gray-800">{category}</h3>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                        {categoryProducts.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectAllInCategory(category)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Select All
                    </button>
                  </div>

                  {expandedCategories.has(category) && (
                    <div className="space-y-2 pl-7">
                      {categoryProducts.map(product => {
                        const isSelected = selectedIds.includes(product._id);
                        const isDisabled = maxSelections && selectedIds.length >= maxSelections && !isSelected;

                        return (
                          <div
                            key={product._id}
                            onClick={() => !isDisabled && toggleProduct(product._id)}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                              isSelected
                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                                : isDisabled
                                ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
                                : 'hover:bg-gray-50 border-gray-200 hover:border-blue-200'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-blue-500 border-blue-500'
                                : 'border-gray-300 bg-white'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>

                            {product.images?.[0] || product.imageUrl ? (
                              <img
                                src={product.images?.[0] || product.imageUrl}
                                alt={product.name}
                                className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">Img</span>
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                                {product.rating && (
                                  <div className="flex items-center gap-0.5 text-yellow-600 text-xs">
                                    <Star className="w-3 h-3 fill-current" />
                                    <span>{product.rating.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                {product.price && (
                                  <span className="font-semibold text-blue-600">
                                    ${product.price.toFixed(2)}
                                  </span>
                                )}
                                {product.stock !== undefined && (
                                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                                    product.stock > 10
                                      ? 'bg-green-100 text-green-800'
                                      : product.stock > 0
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                                  </span>
                                )}
                              </div>
                            </div>

                            {product.tags && product.tags.length > 0 && (
                              <div className="hidden md:flex flex-wrap gap-1">
                                {product.tags.slice(0, 2).map(tag => (
                                  <span
                                    key={tag}
                                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Products Sidebar */}
        {selectedProducts.length > 0 && (
          <div className="w-80 border-l border-gray-200 bg-gradient-to-b from-gray-50 to-white p-4">
            <div className="sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Selected Products</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                  {selectedIds.length} items
                </span>
              </div>

              <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                {selectedProducts.map(product => (
                  <div
                    key={product._id}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm"
                  >
                    {product.images?.[0] || product.imageUrl ? (
                      <img
                        src={product.images?.[0] || product.imageUrl}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">Img</span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">{product.name}</h4>
                      <p className="text-xs text-gray-500 truncate">{product.category}</p>
                      {product.price && (
                        <p className="text-sm font-semibold text-blue-600 mt-1">
                          ${product.price.toFixed(2)}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleProduct(product._id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => onChange([])}
                    className="w-full px-4 py-3 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Clear All Selections
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => alert(`Proceeding with ${selectedIds.length} selected products`)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
                  >
                    Continue with Selection
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductSelector;