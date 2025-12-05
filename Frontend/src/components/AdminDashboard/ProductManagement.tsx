import React, { useMemo, useState } from 'react';
import { Plus, Search, Trash2, Eye, X, Sparkles, FileDown } from 'lucide-react';
import api from '../../api';
import { Product, ProductFormState } from './types';

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
  const [productSearch, setProductSearch] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState<ProductFormState>(
    getFreshProductFormState()
  );
  const [productUnitsForm, setProductUnitsForm] = useState<
    Array<{ serialNumber: string; modelNumber: string; warrantyPeriod: number }>
  >([]);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [exporting, setExporting] = useState(false);

  const searchTerm = productSearch.trim().toLowerCase();
  const filteredProducts = useMemo(() => {
    const bySearch = products.filter((product) => {
      if (!searchTerm) return true;
      const combined = `${product.name} ${product.category}`.toLowerCase();
      return combined.includes(searchTerm);
    });

    // Date range filter against createdAt (fallback to always include if missing)
    if (!dateFrom && !dateTo) return bySearch;
    const fromTime = dateFrom ? new Date(dateFrom).getTime() : Number.NEGATIVE_INFINITY;
    const toTime = dateTo ? new Date(dateTo).getTime() : Number.POSITIVE_INFINITY;
    return bySearch.filter((p) => {
      const created = (p as any).createdAt ? new Date((p as any).createdAt).getTime() : undefined;
      if (created === undefined) return true; // when date missing, include
      return created >= fromTime && created <= toTime;
    });
  }, [products, searchTerm, dateFrom, dateTo]);

  const totalStock = products.reduce(
    (acc, product) => acc + (product.stockQuantity ?? 0) + (product.stock ?? 0),
    0
  );
  const lowStockCount = products.filter(
    (product) => (product.stockQuantity ?? 0) <= 5
  ).length;
  const quoteOnlyCount = products.filter(
    (product) => product.requiresQuote
  ).length;
  const recommendedCount = filteredProducts.filter(
    (product) => product.requiresQuote === false && (product.isRecommended ?? false)
  ).length;

  const handleExportInventoryPDF = async () => {
    try {
      setExporting(true);
      // Dynamically import to avoid hard dependency issues
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default as any;

      const doc = new jsPDF();

      // Title
      doc.setFontSize(16);
      doc.text('Telogica Inventory Report', 14, 18);
      doc.setFontSize(11);
      const subtitle = `Products: ${filteredProducts.length} | Generated: ${new Date().toLocaleString()}`;
      doc.text(subtitle, 14, 26);
      if (dateFrom || dateTo) {
        doc.text(`Date Filter: ${dateFrom || 'Any'} to ${dateTo || 'Any'}`, 14, 32);
      }

      // Table data
      const head = [['Name', 'Category', 'Stock', 'Normal Price', 'Retailer Price', 'Quote Required', 'Recommended']];
      const body = filteredProducts.map((p) => [
        p.name,
        p.category,
        String(p.stockQuantity ?? p.stock ?? 0),
        p.normalPrice ? `₹${p.normalPrice}` : '-',
        p.retailerPrice ? `₹${p.retailerPrice}` : '-',
        p.requiresQuote ? 'Yes' : 'No',
        (p.isRecommended ?? false) ? 'Yes' : 'No',
      ]);

      autoTable(doc, {
        startY: 38,
        head,
        body,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [33, 150, 243] },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 30 },
          2: { cellWidth: 18, halign: 'right' },
          3: { cellWidth: 28, halign: 'right' },
          4: { cellWidth: 30, halign: 'right' },
          5: { cellWidth: 25 },
          6: { cellWidth: 25 },
        },
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.text(`Page ${i} of ${pageCount}`, 200 - 14, 287, { align: 'right' });
      }

      doc.save(`inventory_${Date.now()}.pdf`);
    } catch (err: any) {
      alert(err?.message || 'Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.images.length) {
      alert('Please add at least one product image before saving.');
      return;
    }

    if (productForm.images.length > MAX_PRODUCT_IMAGES) {
      alert(`Only up to ${MAX_PRODUCT_IMAGES} images are allowed.`);
      return;
    }

    const allFilled = productUnitsForm.every(
      (unit) => unit.serialNumber && unit.modelNumber
    );
    if (!allFilled) {
      alert('Please fill all serial numbers and model numbers');
      return;
    }

    try {
      const productData = {
        name: productForm.name,
        description: productForm.description,
        category: productForm.category,
        price: productForm.normalPrice
          ? Number(productForm.normalPrice)
          : undefined,
        retailerPrice: productForm.retailerPrice
          ? Number(productForm.retailerPrice)
          : undefined,
        images: productForm.images,
        stock: 0,
        offlineStock: 0,
        requiresQuote: productForm.requiresQuote || !productForm.normalPrice,
        warrantyPeriodMonths: productForm.warrantyPeriodMonths || 12,
        isRecommended: productForm.isRecommended || false,
      };

      const productResponse = await api.post('/api/products', productData);
      const createdProduct = productResponse.data;

      await api.post('/api/product-units/add', {
        productId: createdProduct._id,
        units: productUnitsForm.map((unit) => ({
          serialNumber: unit.serialNumber,
          modelNumber: unit.modelNumber,
          warrantyPeriodMonths: unit.warrantyPeriod || 12,
          stockType: 'both',
        })),
      });

      alert('Product created successfully with all units');
      setShowProductForm(false);
      setProductForm(getFreshProductFormState());
      setProductUnitsForm([]);
      onProductsUpdated();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create product');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?'))
      return;
    try {
      await api.delete(`/api/products/${productId}`);
      alert('Product deleted successfully');
      onProductsUpdated();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const loadProductUnits = async (productId: string) => {
    try {
      const response = await api.get(`/api/product-units/product/${productId}`);
      console.log('Product Units:', response.data);
      alert(`Found ${response.data.length} units for this product`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to load product units');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Product Management</h2>
          <p className="text-sm text-gray-600 max-w-xl">
            Keep Telogica product listings crisp, visually consistent, and ready
            for every purchase channel. Upload images, manage stock, and keep
            quote-only gear in a single place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search by name or category"
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
          </div>
          {/* Date range filter */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="From Date"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="To Date"
          />
          {productSearch && (
            <button
              onClick={() => setProductSearch('')}
              className="text-sm px-3 py-2 border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100"
            >
              Clear
            </button>
          )}
          <button
            onClick={handleExportInventoryPDF}
            disabled={exporting}
            className="bg-white border border-gray-300 text-gray-800 px-4 py-2 rounded-full flex items-center gap-2 hover:bg-gray-50 disabled:opacity-50"
            title="Export filtered inventory as PDF"
          >
            <FileDown className="w-4 h-4" />
            {exporting ? 'Exporting…' : 'Export PDF'}
          </button>
          <button
            onClick={() => setShowProductForm(!showProductForm)}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:from-blue-600 hover:to-indigo-700"
          >
            <Plus className="w-4 h-4" />
            {showProductForm ? 'Hide Form' : 'Add Product'}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
          <p className="text-xs uppercase tracking-widest text-gray-500">
            Total Products
          </p>
          <p className="text-3xl font-bold text-gray-900">{products.length}</p>
          <p className="text-sm text-gray-500 mt-1">Live catalog size</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
          <p className="text-xs uppercase tracking-widest text-gray-500">
            Inventory stock
          </p>
          <p className="text-3xl font-bold text-gray-900">
            {totalStock.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1">Online + offline availability</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
          <p className="text-xs uppercase tracking-widest text-gray-500">
            Quote-only gear
          </p>
          <p className="text-3xl font-bold text-gray-900">{quoteOnlyCount}</p>
          <p className="text-sm text-gray-500 mt-1">Requires approval / quotes</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
          <p className="text-xs uppercase tracking-widest text-gray-500">
            Low stock alerts
          </p>
          <p className="text-3xl font-bold text-gray-900">{lowStockCount}</p>
          <p className="text-sm text-gray-500 mt-1">
            {recommendedCount} featured ready
          </p>
        </div>
      </div>

      {/* Product Form */}
      {showProductForm && (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold">Create New Product</h3>
              <p className="text-sm text-gray-500">
                Add up to {MAX_PRODUCT_IMAGES} images, serial numbers, and pricing.
              </p>
            </div>
            <Sparkles className="text-indigo-600" />
          </div>
          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  value={productForm.category}
                  onChange={(e) =>
                    setProductForm({ ...productForm, category: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter category"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Normal Price (₹)
                </label>
                <input
                  type="number"
                  value={productForm.normalPrice}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      normalPrice: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter price"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Retailer Price (₹)
                </label>
                <input
                  type="number"
                  value={productForm.retailerPrice}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      retailerPrice: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter price"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={productForm.description}
                onChange={(e) =>
                  setProductForm({ ...productForm, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter product description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Images *
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const files = e.target.files;
                  if (!files?.length) return;
                  const remainingSlots =
                    MAX_PRODUCT_IMAGES - productForm.images.length;
                  const filesToUpload = Array.from(files).slice(0, remainingSlots);
                  filesToUpload.forEach((file) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setProductForm((prev) => ({
                        ...prev,
                        images: [...prev.images, reader.result as string],
                      }));
                    };
                    reader.readAsDataURL(file);
                  });
                  e.target.value = '';
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                {productForm.images.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={img}
                      alt={`preview-${idx}`}
                      className="w-20 h-20 rounded object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setProductForm((prev) => ({
                          ...prev,
                          images: prev.images.filter((_, i) => i !== idx),
                        }));
                      }}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 -mt-2 -mr-2"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                Create Product
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProductForm(false);
                  setProductForm(getFreshProductFormState());
                  setProductUnitsForm([]);
                }}
                className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Normal Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Retailer Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const thumbnail = product.images?.[0] || product.imageUrl;
                return (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {thumbnail && (
                          <img
                            src={thumbnail}
                            alt={product.name}
                            className="w-12 h-12 rounded object-cover mr-3"
                          />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {product.name}
                          </div>
                          {product.requiresQuote && (
                            <span className="text-xs text-blue-600 font-medium">
                              Quote Required
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {product.normalPrice ? `₹${product.normalPrice}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {product.retailerPrice ? `₹${product.retailerPrice}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.stockQuantity > 10
                            ? 'bg-green-100 text-green-800'
                            : product.stockQuantity > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.stockQuantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadProductUnits(product._id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Units"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
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
    </div>
  );
};

export default ProductManagement;
