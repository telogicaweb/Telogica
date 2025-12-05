import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Eye,
  X,
  Sparkles,
  FileDown,
  Edit3,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Package,
  Layers,
  AlertCircle,
  CheckCircle,
  Star,
  Download,
  Calendar,
  Grid,
  List,
  Shield,
  DollarSign,
  ShoppingCart,
  TrendingUp
} from 'lucide-react';
import api from '../../api';
import { Product, ProductFormState } from './types';
import ProductEditor from './ProductEditor';

interface ProductManagementProps {
  products: Product[];
  onProductsUpdated: () => void;
}

const MAX_PRODUCT_IMAGES = 4;

const getFreshProductFormState = (): ProductFormState => ({
  name: '',
  description: '',
  category: '',
  normalPrice: '',
  retailerPrice: '',
  quantity: 1,
  warrantyPeriodMonths: 12,
  isRecommended: false,
  requiresQuote: false,
  manualImageUrl: '',
  images: [],
});

const ProductManagement: React.FC<ProductManagementProps> = ({
  products,
  onProductsUpdated,
}) => {
  // State management
  const [productSearch, setProductSearch] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState<ProductFormState>(getFreshProductFormState());
  const [productUnitsForm, setProductUnitsForm] = useState<
    Array<{ serialNumber: string; modelNumber: string; warrantyPeriodMonths?: number; manufacturingDate?: string; stockType?: 'online' | 'offline' | 'both' }>
  >([]);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [exporting, setExporting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  
  const [uploadingImages, setUploadingImages] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const resolveStock = (p: Product) => p.stockQuantity ?? p.stock ?? 0;
  const resolvePrice = (p: Product) => p.normalPrice ?? p.price ?? undefined;

  useEffect(() => {
    if (!editingProduct) return;
    const updated = products.find(p => p._id === editingProduct._id);
    if (updated && updated !== editingProduct) {
      setEditingProduct(updated);
    }
  }, [products, editingProduct]);
  // Extract unique categories
  const categories = useMemo(() => {
    const cats = products.map(p => p.category).filter(Boolean);
    return ['all', ...Array.from(new Set(cats))];
  }, [products]);

  // Enhanced filtering
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Search filter
    if (productSearch) {
      const searchTerm = productSearch.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        p.category.toLowerCase().includes(searchTerm) ||
        p.description?.toLowerCase().includes(searchTerm)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Stock filter
    if (stockFilter !== 'all') {
      switch(stockFilter) {
        case 'in-stock':
          filtered = filtered.filter(p => resolveStock(p) > 0);
          break;
        case 'low-stock':
          filtered = filtered.filter(p => resolveStock(p) > 0 && resolveStock(p) <= 5);
          break;
        case 'out-of-stock':
          filtered = filtered.filter(p => resolveStock(p) === 0);
          break;
        case 'quote-only':
          filtered = filtered.filter(p => p.requiresQuote);
          break;
        case 'recommended':
          filtered = filtered.filter(p => p.isRecommended);
          break;
      }
    }

    // Date range filter
    if (dateFrom || dateTo) {
      const fromTime = dateFrom ? new Date(dateFrom).getTime() : Number.NEGATIVE_INFINITY;
      const toTime = dateTo ? new Date(dateTo).getTime() + 86400000 : Number.POSITIVE_INFINITY; // Add day for inclusive
      filtered = filtered.filter(p => {
        const created = (p as any).createdAt ? new Date((p as any).createdAt).getTime() : Date.now();
        return created >= fromTime && created <= toTime;
      });
    }

    return filtered;
  }, [products, productSearch, selectedCategory, stockFilter, dateFrom, dateTo]);

  // Statistics
  const stats = useMemo(() => ({
    total: products.length,
    totalStock: products.reduce((acc, p) => acc + resolveStock(p), 0),
    lowStock: products.filter(p => resolveStock(p) > 0 && resolveStock(p) <= 5).length,
    outOfStock: products.filter(p => resolveStock(p) === 0).length,
    quoteOnly: products.filter(p => p.requiresQuote).length,
    recommended: products.filter(p => p.isRecommended).length,
    categories: categories.length - 1,
  }), [products, categories]);

  // Export functions
  const handleExportInventoryPDF = async () => {
    try {
      setExporting(true);
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default as any;

      const doc = new jsPDF();

      // Title with gradient-like styling
      doc.setFillColor(33, 150, 243);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('TELOGICA', 105, 20, { align: 'center' });
      
      doc.setFontSize(18);
      doc.text('INVENTORY REPORT', 105, 30, { align: 'center' });

      // Report details
      doc.setFillColor(245, 245, 245);
      doc.rect(10, 45, 190, 20, 'F');
      
      doc.setTextColor(33, 33, 33);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 55);
      doc.text(`Products: ${filteredProducts.length}`, 15, 62);
      
      if (dateFrom || dateTo) {
        doc.text(`Date Range: ${dateFrom || 'Start'} to ${dateTo || 'End'}`, 100, 55);
      }
      if (selectedCategory !== 'all') {
        doc.text(`Category: ${selectedCategory}`, 100, 62);
      }

      // Table
      const headers = [
        ['No.', 'Product Name', 'Category', 'Stock', 'Normal Price', 'Retailer Price', 'Status']
      ];
      
      const body = filteredProducts.map((p, i) => {
        const price = resolvePrice(p);
        return [
          i + 1,
          p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
          p.category,
          resolveStock(p),
          price ? `₹${price}` : 'Quote Only',
          p.retailerPrice ? `₹${p.retailerPrice}` : '-',
          p.requiresQuote ? 'Quote' : (p.isRecommended ? 'Featured' : 'Regular')
        ];
      });

      autoTable(doc, {
        startY: 70,
        head: headers,
        body: body,
        theme: 'striped',
        headStyles: {
          fillColor: [33, 150, 243],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 40 },
          2: { cellWidth: 25 },
          3: { cellWidth: 15 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 },
          6: { cellWidth: 25 }
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          overflow: 'linebreak'
        },
        didDrawPage: function (data: any) {
          // Footer
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(
            `Page ${data.pageNumber} of ${data.pageCount}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        }
      });

      // Summary section
      const finalY = (doc as any).lastAutoTable.finalY || 70;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SUMMARY', 15, finalY + 15);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Products: ${stats.total}`, 15, finalY + 25);
      doc.text(`Total Stock Value: ₹${filteredProducts.reduce((sum, p) => sum + ((resolvePrice(p) || 0) * resolveStock(p)), 0).toLocaleString()}`, 15, finalY + 32);
      doc.text(`Low Stock Items: ${stats.lowStock}`, 100, finalY + 25);
      doc.text(`Out of Stock: ${stats.outOfStock}`, 100, finalY + 32);

      doc.save(`Telogica-Inventory-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err: any) {
      alert(err?.message || 'Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Category', 'Description', 'Stock', 'Normal Price', 'Retailer Price', 'Requires Quote', 'Recommended', 'Created At'];
    const csvData = filteredProducts.map(p => [
      p.name,
      p.category,
      p.description || '',
      resolveStock(p),
      resolvePrice(p) ?? '',
      p.retailerPrice ?? '',
      p.requiresQuote ? 'Yes' : 'No',
      p.isRecommended ? 'Yes' : 'No',
      (p as any).createdAt || new Date().toISOString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `telogica-products-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Product operations
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!productForm.images.length) {
      alert('Please add at least one product image');
      return;
    }

    if (productForm.images.length > MAX_PRODUCT_IMAGES) {
      alert(`Maximum ${MAX_PRODUCT_IMAGES} images allowed`);
      return;
    }

    // Validate units if quantity provided
    if (productForm.quantity > 0) {
      if (productUnitsForm.length !== productForm.quantity) {
        alert(`Please generate ${productForm.quantity} unit rows and fill serial/model numbers for each`);
        return;
      }
      const serials = productUnitsForm.map(u => u.serialNumber.trim());
      const models = productUnitsForm.map(u => u.modelNumber.trim());
      if (serials.some(s => !s) || models.some(m => !m)) {
        alert('Each unit must have a serial number and model number');
        return;
      }
      const dup = serials.filter((s, i) => serials.indexOf(s) !== i);
      if (dup.length) {
        alert(`Duplicate serial numbers found: ${Array.from(new Set(dup)).join(', ')}`);
        return;
      }
    }

    try {
      setUploadingImages(true);
      
      // Upload images to server if they're base64 (from file upload)
      const uploadedImages = await Promise.all(
        productForm.images.map(async (img) => {
          if (img.startsWith('data:image')) {
            const formData = new FormData();
            const blob = await fetch(img).then(r => r.blob());
            formData.append('image', blob);
            const response = await api.post('/api/products/upload', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data.url;
          }
          return img;
        })
      );

      const productData = {
        name: productForm.name,
        description: productForm.description,
        category: productForm.category,
        price: productForm.normalPrice ? Number(productForm.normalPrice) : undefined,
        retailerPrice: productForm.retailerPrice ? Number(productForm.retailerPrice) : undefined,
        images: uploadedImages,
        stock: 0,
        offlineStock: 0,
        requiresQuote: productForm.requiresQuote || !productForm.normalPrice,
        warrantyPeriodMonths: productForm.warrantyPeriodMonths || 12,
        isRecommended: productForm.isRecommended || false,
      };

      const productResponse = await api.post('/api/products', productData);
      const createdProduct = productResponse.data;

      // Add product units using admin-provided data
      if (productForm.quantity > 0) {
        await api.post('/api/product-units/add', {
          productId: createdProduct._id,
          units: productUnitsForm.map(u => ({
            serialNumber: u.serialNumber.trim(),
            modelNumber: u.modelNumber.trim(),
            warrantyPeriodMonths: productForm.warrantyPeriodMonths || 12,
            manufacturingDate: u.manufacturingDate,
            stockType: u.stockType || 'both'
          }))
        });
      }

      // Reset and refresh
      setShowProductForm(false);
      setProductForm(getFreshProductFormState());
      onProductsUpdated();
      
      // Show success message
      alert(`Product "${productForm.name}" created successfully!`);
      
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create product');
    } finally {
      setUploadingImages(false);
    }
  };

  

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure? This will permanently delete the product.')) return;
    try {
      await api.delete(`/api/products/${productId}`);
      onProductsUpdated();
      alert('Product deleted successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete product');
    }
  };

  // Image handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const remainingSlots = MAX_PRODUCT_IMAGES - productForm.images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductForm(prev => ({
          ...prev,
          images: [...prev.images, reader.result as string]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  // View components
  const ProductGridItem = ({ product, onManage }: { product: Product; onManage: (product: Product) => void }) => {
    const thumbnail = product.images?.[0];
    const isExpanded = expandedProduct === product._id;
    const price = resolvePrice(product);
    
    return (
      <div className="group bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300 overflow-hidden">
        {/* Product Image */}
        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
          {thumbnail ? (
            <img 
              src={thumbnail} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
          )}
          
          {/* Status badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {product.requiresQuote && (
              <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full shadow-sm">
                Quote Only
              </span>
            )}
            {product.isRecommended && (
              <span className="px-2 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full shadow-sm flex items-center gap-1">
                <Star className="w-3 h-3" /> Featured
              </span>
            )}
            {(product.stockQuantity ?? 0) <= 5 && (product.stockQuantity ?? 0) > 0 && (
              <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded-full shadow-sm">
                Low Stock
              </span>
            )}
          </div>
          
          {/* Quick actions */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex gap-1">
              <button 
                onClick={() => setExpandedProduct(isExpanded ? null : product._id)}
                className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <button
                className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white"
                onClick={() => onManage(product)}
                title="Manage product"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {product.category}
              </span>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-1 mb-3">
            {price ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Normal Price</span>
                <span className="font-bold text-gray-900">₹{price.toLocaleString()}</span>
              </div>
            ) : (
              <div className="text-sm text-blue-600 font-medium">Quote Required</div>
            )}
            {product.retailerPrice && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Retailer Price</span>
                <span className="text-gray-700">₹{product.retailerPrice.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Stock & Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                resolveStock(product) > 10 ? 'bg-green-500' :
                resolveStock(product) > 0 ? 'bg-amber-500' :
                'bg-red-500'
              }`} />
              <span className={`text-sm font-medium ${
                resolveStock(product) > 10 ? 'text-green-700' :
                resolveStock(product) > 0 ? 'text-amber-700' :
                'text-red-700'
              }`}>
                {resolveStock(product)} in stock
              </span>
            </div>
            <button
              onClick={() => handleDeleteProduct(product._id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              {product.description && (
                <p className="text-sm text-gray-600">{product.description}</p>
              )}
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">12 months warranty</span>
              </div>
              <button
                onClick={() => {/* Load units */}}
                className="w-full py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
              >
                View Product Units
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
              <p className="text-gray-600">Manage your product catalog with precision and style</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : 'text-gray-500'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : 'text-gray-500'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Export Buttons */}
          <div className="relative group">
            <button
              onClick={handleExportInventoryPDF}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              Export
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <button
                onClick={handleExportCSV}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
              >
                <Download className="w-4 h-4 inline mr-2" /> Export as CSV
              </button>
              <button
                onClick={handleExportInventoryPDF}
                disabled={exporting}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg"
              >
                <FileDown className="w-4 h-4 inline mr-2" /> Export as PDF
              </button>
            </div>
          </div>

          {/* Add Product Button */}
          <button
            onClick={() => setShowProductForm(!showProductForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            {showProductForm ? 'Hide Form' : 'Add Product'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Total Products</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-blue-700">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>{stats.categories} categories</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Total Stock</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalStock.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <Layers className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            {(() => {
              const percent = Math.min(100, Math.max(0, (stats.totalStock / (stats.total * 100)) * 100));
              const widthClass = percent >= 75 ? 'w-3/4' : percent >= 50 ? 'w-1/2' : percent >= 25 ? 'w-1/4' : 'w-1/12';
              return (
                <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                  <div className={`h-full bg-green-500 rounded-full ${widthClass}`} />
                </div>
              );
            })()}
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-800">Low Stock</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.lowStock}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-amber-700">
            <span className="font-medium">{stats.outOfStock}</span> out of stock
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-100 border border-purple-200 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Special Products</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.quoteOnly + stats.recommended}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              {stats.quoteOnly} quote-only
            </span>
            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
              {stats.recommended} featured
            </span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products by name, category, or description..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {productSearch && (
                <button
                  onClick={() => setProductSearch('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.slice(1).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Stock</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
              <option value="quote-only">Quote Only</option>
              <option value="recommended">Recommended</option>
            </select>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Create New Product</h2>
                <p className="text-gray-600">Fill in the details to add a new product to your catalog</p>
              </div>
              <button
                onClick={() => {
                  setShowProductForm(false);
                  setProductForm(getFreshProductFormState());
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter product name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <input
                      type="text"
                      required
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter category"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the product..."
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Normal Price (₹)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={productForm.normalPrice}
                        onChange={(e) => setProductForm({ ...productForm, normalPrice: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Retailer Price (₹)
                    </label>
                    <div className="relative">
                      <ShoppingCart className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={productForm.retailerPrice}
                        onChange={(e) => setProductForm({ ...productForm, retailerPrice: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h3>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Images (Max {MAX_PRODUCT_IMAGES})
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">Drag & drop images here or click to browse</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 cursor-pointer"
                  >
                    Browse Files
                  </label>
                </div>
                
                {/* Image Previews */}
                {productForm.images.length > 0 && (
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-3">
                      {productForm.images.map((img, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={img}
                            alt={`Preview ${idx + 1}`}
                            className="w-24 h-24 rounded-lg object-cover shadow"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setProductForm(prev => ({
                                ...prev,
                                images: prev.images.filter((_, i) => i !== idx)
                              }));
                            }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {productForm.images.length} of {MAX_PRODUCT_IMAGES} images uploaded
                    </p>
                  </div>
                )}
              </div>

              {/* Settings */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Requires Quote</p>
                      <p className="text-sm text-gray-600">Enable for quote-only products</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productForm.requiresQuote}
                        onChange={(e) => setProductForm({ ...productForm, requiresQuote: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Featured Product</p>
                      <p className="text-sm text-gray-600">Mark as recommended product</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productForm.isRecommended}
                        onChange={(e) => setProductForm({ ...productForm, isRecommended: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowProductForm(false);
                    setProductForm(getFreshProductFormState());
                  }}
                  className="px-6 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingImages}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {uploadingImages ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Product
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Display */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Products ({filteredProducts.length})</h3>
            <p className="text-sm text-gray-600">Showing {viewMode === 'grid' ? 'grid' : 'list'} view</p>
          </div>
          <div className="text-sm text-gray-500">
            <Sparkles className="w-4 h-4 inline mr-1" />
            Click on products for more details
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <ProductGridItem key={product._id} product={product} onManage={setEditingProduct} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Pricing</th>
                    <th className="px6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map(product => {
                    const price = resolvePrice(product);
                    return (
                      <tr key={product._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <img
                                className="h-10 w-10 rounded-lg object-cover"
                                src={product.images?.[0]}
                                alt={product.name}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500 line-clamp-1">{product.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {price && (
                              <div className="text-sm font-semibold text-gray-900">₹{price.toLocaleString()}</div>
                            )}
                            {product.retailerPrice && (
                              <div className="text-xs text-gray-500">Retailer: ₹{product.retailerPrice.toLocaleString()}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              resolveStock(product) > 10 ? 'bg-green-500' :
                              resolveStock(product) > 0 ? 'bg-amber-500' :
                              'bg-red-500'
                            }`} />
                            <span className="text-sm text-gray-900">{resolveStock(product)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {product.requiresQuote && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                Quote Only
                              </span>
                            )}
                            {product.isRecommended && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                                <Star className="w-3 h-3 mr-1" /> Featured
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setExpandedProduct(expandedProduct === product._id ? null : product._id)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingProduct(product)}
                              className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product._id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-dashed border-gray-300">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
            <button
              onClick={() => {
                setProductSearch('');
                setSelectedCategory('all');
                setStockFilter('all');
                setDateFrom('');
                setDateTo('');
              }}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Clear all filters
            </button>
          </div>
        )}

      </div>

      {/* Units */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Units (Per-item serial/model)</h3>
        <div className="grid md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
            <input
              type="number"
              min={0}
              value={productForm.quantity}
              onChange={(e) => setProductForm({ ...productForm, quantity: Number(e.target.value) })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. 20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Warranty (months)</label>
            <input
              type="number"
              min={1}
              value={productForm.warrantyPeriodMonths}
              onChange={(e) => setProductForm({ ...productForm, warrantyPeriodMonths: Number(e.target.value) })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="12"
            />
          </div>
          <div>
            <button
              type="button"
              onClick={() => {
                const qty = productForm.quantity || 0;
                setProductUnitsForm(Array.from({ length: qty }, () => ({ serialNumber: '', modelNumber: '' })));
              }}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700"
            >
              Generate Unit Rows
            </button>
          </div>
        </div>

        {productUnitsForm.length > 0 && (
          <div className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-700">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Serial Number *</th>
                    <th className="px-3 py-2">Model Number *</th>
                    <th className="px-3 py-2">Manufacturing Date</th>
                    <th className="px-3 py-2">Stock Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {productUnitsForm.map((unit, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={unit.serialNumber}
                          onChange={(e) => {
                            const v = e.target.value;
                            setProductUnitsForm(prev => prev.map((u, i) => i === idx ? { ...u, serialNumber: v } : u));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Unique serial"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={unit.modelNumber}
                          onChange={(e) => {
                            const v = e.target.value;
                            setProductUnitsForm(prev => prev.map((u, i) => i === idx ? { ...u, modelNumber: v } : u));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Model number"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          value={unit.manufacturingDate || ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            setProductUnitsForm(prev => prev.map((u, i) => i === idx ? { ...u, manufacturingDate: v } : u));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={unit.stockType || 'both'}
                          onChange={(e) => {
                            const v = e.target.value as 'online' | 'offline' | 'both';
                            setProductUnitsForm(prev => prev.map((u, i) => i === idx ? { ...u, stockType: v } : u));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="online">online</option>
                          <option value="offline">offline</option>
                          <option value="both">both</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-2">Ensure serial numbers are unique—server will reject duplicates.</p>
          </div>
        )}
      </div>

      {editingProduct && (
        <ProductEditor
          product={editingProduct}
          products={products}
          onClose={() => setEditingProduct(null)}
          onUpdated={() => {
            onProductsUpdated();
          }}
        />
      )}
    </div>
  );
};

export default ProductManagement;