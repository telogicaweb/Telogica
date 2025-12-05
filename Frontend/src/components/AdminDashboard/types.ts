// Shared interfaces and types for Admin Dashboard components

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isApproved: boolean;
  createdAt: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  price?: number;
  normalPrice?: number;
  retailerPrice?: number;
  stock: number;
  stockQuantity: number;
  offlineStock?: number;
  imageUrl?: string;
  images?: string[];
  requiresQuote: boolean;
  isRecommended?: boolean;
  warrantyPeriodMonths?: number;
  extendedWarrantyAvailable?: boolean;
  extendedWarrantyMonths?: number;
  extendedWarrantyPrice?: number;
  specifications?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
  // Optional list of recommended product ids (related products selected by admin)
  recommendedProductIds?: string[];
}

export interface ProductFormState {
  name: string;
  description: string;
  category: string;
  normalPrice: string;
  retailerPrice: string;
  quantity: number;
  warrantyPeriodMonths: number;
  isRecommended: boolean;
  requiresQuote: boolean;
  manualImageUrl: string;
  images: string[];
  recommendedProductIds: string[];
}

export interface ProductUnit {
  _id: string;
  product: { _id: string; name: string } | string;
  serialNumber: string;
  modelNumber: string;
  warrantyPeriodMonths: number;
  manufacturingDate?: string;
  status: 'available' | 'sold' | 'reserved' | 'defective' | 'returned';
  stockType: 'online' | 'offline' | 'both';
  currentOwner?: { _id: string; name: string; email?: string } | string;
  retailer?: { _id: string; name: string; email?: string } | string;
  order?: { _id: string; orderNumber?: string } | string;
  soldDate?: string;
  retailerPurchaseDate?: string;
  finalCustomerSaleDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  _id: string;
  userId?: { _id: string; name: string; email: string };
  user?: { _id: string; name: string; email: string };
  products: Array<{
    productId?: { _id: string; name: string };
    product?: { _id: string; name: string };
    quantity: number;
  }>;
  message?: string;
  status?: string;
  adminResponse?: any;
  quotedPrice?: number;
  createdAt?: string;
}

export interface Order {
  _id: string;
  orderNumber?: string;
  userId: { _id: string; name: string; email: string };
  products: Array<{
    productId: { _id: string; name: string };
    quantity: number;
    price: number;
    serialNumbers?: string[];
  }>;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
}

export interface Warranty {
  _id: string;
  userId: { _id: string; name: string; email: string };
  productName: string;
  modelNumber: string;
  serialNumber: string;
  purchaseDate: string;
  purchaseType: string;
  invoiceUrl?: string;
  status: string;
  createdAt: string;
}

export interface EmailLog {
  _id: string;
  recipient: string;
  subject: string;
  emailType: string;
  sentAt: string;
  status: string;
}

export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  createdAt: string;
}

export interface Analytics {
  sales: {
    total: number;
    direct: number;
    quote: number;
    byUserType: {
      user: number;
      retailer: number;
    };
  };
  orders: {
    total: number;
    direct: number;
    quote: number;
    byUserType: {
      user: number;
      retailer: number;
    };
  };
  quotes: {
    total: number;
    pending: number;
    responded: number;
    accepted: number;
    rejected: number;
    conversionRate: string | number;
  };
  users: {
    total: number;
    retailers: number;
    pendingRetailers: number;
  };
  inventory: {
    total: number;
    online: number;
    offline: number;
  };
  warranties: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}
