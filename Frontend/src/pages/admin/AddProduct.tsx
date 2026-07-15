import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Package,
  Sparkles,
  Tag,
  DollarSign,
  ImagePlus,
  Shield,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import api from '../../api';
import ProductSelector from '../../components/AdminDashboard/ProductSelector';
import CategoryInput from '../../components/AdminDashboard/CategoryInput';
import SubcategoryPicker from '../../components/AdminDashboard/SubcategoryPicker';
import ImageUploader from '../../components/AdminDashboard/ImageUploader';

const MAX_PRODUCT_IMAGES = 10;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const DEFAULT_WARRANTY_MONTHS = 12;

interface Product {
  _id: string;
  name: string;
  category: string;
  subcategory?: string;
}

interface ProductFormState {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  normalPrice: string;
  retailerPrice: string;
  warrantyPeriodMonths: number;
  extendedWarrantyAvailable: boolean;
  extendedWarrantyMonths: number;
  extendedWarrantyPrice: string;
  isRecommended: boolean;
  images: string[];
  recommendedProductIds: string[];
  brochureUrl: string;
  features: string;
  applications: string;
}

type StepKey = 'basics' | 'pricing' | 'images' | 'warranty';

const STEPS: { key: StepKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'basics', label: 'Basics', icon: Tag },
  { key: 'pricing', label: 'Pricing & Brochure', icon: DollarSign },
  { key: 'images', label: 'Images', icon: ImagePlus },
  { key: 'warranty', label: 'Warranty & Extras', icon: Shield },
];

const DEFAULT_CATEGORIES = ['Telecommunication', 'Defence', 'Railway', 'Industrial'];

export default function AddProduct() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [touchedSteps, setTouchedSteps] = useState<Record<StepKey, boolean>>({
    basics: false,
    pricing: false,
    images: false,
    warranty: false,
  });

  const [productForm, setProductForm] = useState<ProductFormState>({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    normalPrice: '',
    retailerPrice: '',
    warrantyPeriodMonths: DEFAULT_WARRANTY_MONTHS,
    extendedWarrantyAvailable: true,
    extendedWarrantyMonths: 24,
    extendedWarrantyPrice: '',
    isRecommended: false,
    images: [],
    recommendedProductIds: [],
    brochureUrl: '',
    features: '',
    applications: '',
  });

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user || JSON.parse(user).role !== 'admin') {
      navigate('/login');
      return;
    }
    loadProducts();
  }, [navigate]);

  const loadProducts = async () => {
    try {
      const response = await api.get('/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const isDefence = productForm.category.trim().toLowerCase() === 'defence';

  const allCategoryOptions = useMemo(() => {
    const fromProducts = products.map((p) => p.category).filter(Boolean);
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...fromProducts]));
  }, [products]);

  const defenceSubcategories = useMemo(() => {
    return products
      .filter((p) => p.category?.toLowerCase() === 'defence' && p.subcategory)
      .map((p) => p.subcategory as string);
  }, [products]);

  // ---------- Validation per step ----------
  const stepErrors: Record<StepKey, string[]> = useMemo(() => {
    const basics: string[] = [];
    if (!productForm.name.trim()) basics.push('Product name is required');
    if (!productForm.category.trim()) basics.push('Pick or create a category');
    if (!productForm.features.trim()) basics.push('Features are required (at least one line)');
    if (!productForm.applications.trim()) basics.push('Applications are required (at least one line)');

    const pricing: string[] = [];
    if (productForm.normalPrice && Number.isNaN(parseFloat(productForm.normalPrice))) {
      pricing.push('Normal price must be a number');
    }
    if (productForm.retailerPrice && Number.isNaN(parseFloat(productForm.retailerPrice))) {
      pricing.push('Retailer price must be a number');
    }
    if (
      productForm.normalPrice &&
      productForm.retailerPrice &&
      parseFloat(productForm.retailerPrice) > parseFloat(productForm.normalPrice)
    ) {
      pricing.push('Retailer price should not exceed the normal price');
    }

    const images: string[] = [];
    if (productForm.images.length === 0) {
      images.push('Add at least one product image');
    }

    const warranty: string[] = [];
    if (productForm.warrantyPeriodMonths < 0) {
      warranty.push('Warranty months cannot be negative');
    }
    if (productForm.extendedWarrantyAvailable) {
      if (productForm.extendedWarrantyMonths <= 0) {
        warranty.push('Extended warranty months must be greater than 0');
      }
      if (
        productForm.extendedWarrantyPrice &&
        Number.isNaN(parseFloat(productForm.extendedWarrantyPrice))
      ) {
        warranty.push('Extended warranty price must be a number');
      }
    }

    return { basics, pricing, images, warranty };
  }, [productForm]);

  const stepIsValid = (key: StepKey) => stepErrors[key].length === 0;
  const allValid = (Object.keys(stepErrors) as StepKey[]).every((k) => stepIsValid(k));
  const currentStep = STEPS[stepIdx];

  const markTouched = (key: StepKey) =>
    setTouchedSteps((prev) => (prev[key] ? prev : { ...prev, [key]: true }));

  const goNext = () => {
    markTouched(currentStep.key);
    if (!stepIsValid(currentStep.key)) return;
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1);
  };

  const goBack = () => {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  };

  const jumpTo = (idx: number) => {
    if (idx === stepIdx) return;
    // Allow jumping back freely; allow forward only if earlier steps valid.
    if (idx < stepIdx) {
      setStepIdx(idx);
      return;
    }
    for (let i = stepIdx; i < idx; i++) {
      markTouched(STEPS[i].key);
      if (!stepIsValid(STEPS[i].key)) return;
    }
    setStepIdx(idx);
  };

  const handleSubmit = async () => {
    (Object.keys(stepErrors) as StepKey[]).forEach(markTouched);
    if (!allValid || submitting) return;

    setSubmitting(true);
    try {
      const payload: any = {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        category: productForm.category.trim(),
        subcategory: isDefence && productForm.subcategory.trim() ? productForm.subcategory.trim() : '',
        images: productForm.images,
        isRecommended: productForm.isRecommended,
        warrantyPeriodMonths: productForm.warrantyPeriodMonths,
        extendedWarrantyAvailable: productForm.extendedWarrantyAvailable,
        recommendedProductIds: productForm.recommendedProductIds,
        features: productForm.features.split('\n').map(x => x.trim()).filter(Boolean),
        applications: productForm.applications.split('\n').map(x => x.trim()).filter(Boolean),
      };

      if (productForm.brochureUrl) payload.brochureUrl = productForm.brochureUrl;
      if (productForm.normalPrice) payload.price = parseFloat(productForm.normalPrice);
      if (productForm.retailerPrice) payload.retailerPrice = parseFloat(productForm.retailerPrice);
      if (productForm.extendedWarrantyAvailable) {
        payload.extendedWarrantyMonths = productForm.extendedWarrantyMonths;
        if (productForm.extendedWarrantyPrice) {
          payload.extendedWarrantyPrice = parseFloat(productForm.extendedWarrantyPrice);
        }
      }

      await api.post('/api/products', payload);
      navigate('/admin');
    } catch (error: any) {
      console.error('Error creating product:', error);
      alert(error.response?.data?.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const showErrors = (key: StepKey) => touchedSteps[key] && !stepIsValid(key);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-32">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to admin"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Add New Product</h1>
                <p className="text-xs text-gray-500">{currentStep.label} — step {stepIdx + 1} of {STEPS.length}</p>
              </div>
            </div>
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </div>

          {/* Step indicator */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto">
            {STEPS.map((s, i) => {
              const active = i === stepIdx;
              const done = i < stepIdx && stepIsValid(s.key);
              const Icon = s.icon;
              const hasErr = touchedSteps[s.key] && !stepIsValid(s.key);
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => jumpTo(i)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : done
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : hasErr
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    active ? 'bg-white text-indigo-600' : done ? 'bg-emerald-600 text-white' : hasErr ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {done ? <Check className="w-3 h-3" /> : i + 1}
                  </span>
                  <Icon className="w-3.5 h-3.5" />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 space-y-6">
          {/* STEP: BASICS */}
          {currentStep.key === 'basics' && (
            <div className="space-y-5">
              <SectionHeader icon={Tag} title="Tell us the basics" subtitle="Name, category, and a quick description." />

              <Field label="Product name" required>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  onBlur={() => markTouched('basics')}
                  placeholder="e.g. TWR-450 VHF Tower Repeater"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </Field>

              <Field label="Category" required>
                <CategoryInput
                  value={productForm.category}
                  onChange={(v) => {
                    setProductForm({ ...productForm, category: v, subcategory: v.toLowerCase() === 'defence' ? productForm.subcategory : '' });
                    markTouched('basics');
                  }}
                  categories={allCategoryOptions}
                />
              </Field>

              {isDefence && (
                <Field label="Defence sub-category" hint="Leave empty to keep it directly under Defence.">
                  <SubcategoryPicker
                    value={productForm.subcategory}
                    onChange={(v) => setProductForm({ ...productForm, subcategory: v })}
                    suggestions={defenceSubcategories}
                  />
                </Field>
              )}

              <Field label="Description" hint="Markdown not supported — keep it plain and clear.">
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={4}
                  placeholder="Highlight key use-cases, target customers, and notable specs."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </Field>

              <Field label="Key Features" required hint="Enter each feature on a new line.">
                <textarea
                  value={productForm.features}
                  onChange={(e) => setProductForm({ ...productForm, features: e.target.value })}
                  onBlur={() => markTouched('basics')}
                  rows={4}
                  placeholder="e.g. High gain dual-antenna design&#10;IP67 Weatherproof rating&#10;Low power consumption"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </Field>

              <Field label="Applications" required hint="Enter each application on a new line.">
                <textarea
                  value={productForm.applications}
                  onChange={(e) => setProductForm({ ...productForm, applications: e.target.value })}
                  onBlur={() => markTouched('basics')}
                  rows={4}
                  placeholder="e.g. Tactical communications&#10;Emergency responder systems&#10;Remote telemetry"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </Field>

              {showErrors('basics') && <ErrorList items={stepErrors.basics} />}
            </div>
          )}

          {/* STEP: PRICING */}
          {currentStep.key === 'pricing' && (
            <div className="space-y-5">
              <SectionHeader icon={DollarSign} title="Pricing & brochure" subtitle="Leave price empty if this product needs a quote." />

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Normal price (₹)" hint="Empty = customers must request a quote.">
                  <input
                    type="number"
                    value={productForm.normalPrice}
                    onChange={(e) => setProductForm({ ...productForm, normalPrice: e.target.value })}
                    onBlur={() => markTouched('pricing')}
                    placeholder="e.g. 24999"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </Field>
                <Field label="Retailer price (₹)" hint="Special pricing for verified retailers.">
                  <input
                    type="number"
                    value={productForm.retailerPrice}
                    onChange={(e) => setProductForm({ ...productForm, retailerPrice: e.target.value })}
                    onBlur={() => markTouched('pricing')}
                    placeholder="e.g. 21999"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </Field>
              </div>

              <Field label="Product brochure (PDF)" hint="Visible to buyers after purchase only.">
                <label className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center hover:border-indigo-400 transition-colors cursor-pointer block">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4" />
                    {productForm.brochureUrl ? 'Replace brochure PDF' : 'Click to upload PDF brochure'}
                  </div>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 10 * 1024 * 1024) {
                        alert('File size exceeds the 10MB limit.');
                        e.target.value = '';
                        return;
                      }
                      const formData = new FormData();
                      formData.append('brochure', file);
                      try {
                        const res = await api.post('/api/products/upload-brochure', formData, {
                          headers: { 'Content-Type': 'multipart/form-data' },
                        });
                        if (res.data?.url) {
                          setProductForm((prev) => ({ ...prev, brochureUrl: res.data.url }));
                        }
                      } catch (err) {
                        alert('Failed to upload brochure. Please try again.');
                      }
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
                {productForm.brochureUrl && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-emerald-800">
                      <CheckCircle2 className="w-4 h-4" /> Brochure attached
                    </div>
                    <button
                      type="button"
                      onClick={() => setProductForm((prev) => ({ ...prev, brochureUrl: '' }))}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </Field>

              {showErrors('pricing') && <ErrorList items={stepErrors.pricing} />}
            </div>
          )}

          {/* STEP: IMAGES */}
          {currentStep.key === 'images' && (
            <div className="space-y-5">
              <SectionHeader icon={ImagePlus} title="Product images" subtitle="First image becomes the cover. Drag to reorder." />
              <ImageUploader
                images={productForm.images}
                onChange={(imgs) => {
                  setProductForm({ ...productForm, images: imgs });
                  markTouched('images');
                }}
                maxImages={MAX_PRODUCT_IMAGES}
                maxBytes={MAX_IMAGE_BYTES}
              />
              {showErrors('images') && <ErrorList items={stepErrors.images} />}
            </div>
          )}

          {/* STEP: WARRANTY & EXTRAS */}
          {currentStep.key === 'warranty' && (
            <div className="space-y-5">
              <SectionHeader icon={Shield} title="Warranty & extras" subtitle="Cover period, optional extended warranty, and recommendations." />

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Standard warranty (months)" required>
                  <input
                    type="number"
                    min={0}
                    value={productForm.warrantyPeriodMonths}
                    onChange={(e) =>
                      setProductForm({ ...productForm, warrantyPeriodMonths: parseInt(e.target.value, 10) || 0 })
                    }
                    onBlur={() => markTouched('warranty')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </Field>
                <Field label="Extended warranty">
                  <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-indigo-400">
                    <input
                      type="checkbox"
                      checked={productForm.extendedWarrantyAvailable}
                      onChange={(e) =>
                        setProductForm({ ...productForm, extendedWarrantyAvailable: e.target.checked })
                      }
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Offer extended warranty</span>
                  </label>
                </Field>
              </div>

              {productForm.extendedWarrantyAvailable && (
                <div className="grid md:grid-cols-2 gap-4 p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl">
                  <Field label="Extended period (months)" required>
                    <input
                      type="number"
                      min={1}
                      value={productForm.extendedWarrantyMonths}
                      onChange={(e) =>
                        setProductForm({ ...productForm, extendedWarrantyMonths: parseInt(e.target.value, 10) || 0 })
                      }
                      onBlur={() => markTouched('warranty')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </Field>
                  <Field label="Extended price (₹)">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={productForm.extendedWarrantyPrice}
                      onChange={(e) =>
                        setProductForm({ ...productForm, extendedWarrantyPrice: e.target.value })
                      }
                      onBlur={() => markTouched('warranty')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </Field>
                </div>
              )}

              <Field label="Recommended products" hint="Shown alongside this product on the storefront.">
                <ProductSelector
                  products={products}
                  selectedIds={productForm.recommendedProductIds}
                  onChange={(ids) => setProductForm({ ...productForm, recommendedProductIds: ids })}
                />
              </Field>

              <label className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={productForm.isRecommended}
                  onChange={(e) => setProductForm({ ...productForm, isRecommended: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Feature on homepage</span>
              </label>

              {showErrors('warranty') && <ErrorList items={stepErrors.warranty} />}
            </div>
          )}
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goBack}
              disabled={stepIdx === 0 || submitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {stepIdx < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!allValid || submitting}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4" /> Create product
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Small helpers ----------

const SectionHeader: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
}> = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const Field: React.FC<{
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, required, hint, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-800 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
  </div>
);

const ErrorList: React.FC<{ items: string[] }> = ({ items }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
    <div className="flex items-center gap-2 text-sm font-semibold text-red-700 mb-1">
      <AlertCircle className="w-4 h-4" /> Please fix these to continue
    </div>
    <ul className="text-sm text-red-700 list-disc list-inside space-y-0.5">
      {items.map((m, i) => (
        <li key={i}>{m}</li>
      ))}
    </ul>
  </div>
);
