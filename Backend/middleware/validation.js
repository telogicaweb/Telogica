/**
 * Input Validation Middleware
 * Comprehensive validation rules for all API endpoints
 */

// ============================================
// Helper Functions
// ============================================

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Indian format)
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

/**
 * Sanitize string input
 * Removes potentially dangerous characters and patterns
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  let sanitized = str.trim();
  
  // Remove all script tags (including variations)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script\s*>/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript\s*:/gi, '');
  
  // Remove data: and vbscript: protocols
  sanitized = sanitized.replace(/data\s*:/gi, '');
  sanitized = sanitized.replace(/vbscript\s*:/gi, '');
  
  // Remove all on* event handlers (comprehensive)
  sanitized = sanitized.replace(/\s*on\w+\s*=/gi, '');
  
  // Remove potentially dangerous HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  return sanitized;
};

/**
 * Validate number range
 */
const isInRange = (value, min, max) => {
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
};

// ============================================
// Validation Rules
// ============================================

/**
 * User registration validation
 */
const validateUserRegistration = (req, res, next) => {
  const { name, email, password, role, phone } = req.body;
  const errors = [];

  // Name validation
  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  } else if (name.length > 100) {
    errors.push('Name must not exceed 100 characters');
  }

  // Email validation
  if (!email || !isValidEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  // Password validation
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  } else if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }

  // Role validation
  if (role && !['user', 'retailer', 'admin'].includes(role)) {
    errors.push('Invalid role. Must be user, retailer, or admin');
  }

  // Phone validation (optional)
  if (phone && !isValidPhone(phone)) {
    errors.push('Please provide a valid 10-digit Indian phone number');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  // Sanitize inputs
  req.body.name = sanitizeString(name);
  req.body.email = email.toLowerCase().trim();
  if (req.body.address) {
    req.body.address = sanitizeString(req.body.address);
  }

  next();
};

/**
 * Product creation validation
 */
const validateProduct = (req, res, next) => {
  const { name, description, price, category, stock, offlineStock } = req.body;
  const errors = [];

  // Name validation
  if (!name || name.trim().length < 3) {
    errors.push('Product name must be at least 3 characters long');
  } else if (name.length > 200) {
    errors.push('Product name must not exceed 200 characters');
  }

  // Description validation (optional)
  if (description && description.length > 2000) {
    errors.push('Description must not exceed 2000 characters');
  }

  // Price validation (optional, can be quote-based)
  if (price !== undefined && price !== null) {
    if (!isInRange(price, 0, 10000000)) {
      errors.push('Price must be between 0 and 10,000,000');
    }
  }

  // Category validation
  if (!category || category.trim().length < 2) {
    errors.push('Category is required and must be at least 2 characters');
  }

  // Stock validation
  if (stock !== undefined && !isInRange(stock, 0, 1000000)) {
    errors.push('Stock must be between 0 and 1,000,000');
  }

  if (offlineStock !== undefined && !isInRange(offlineStock, 0, 1000000)) {
    errors.push('Offline stock must be between 0 and 1,000,000');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  // Sanitize inputs
  req.body.name = sanitizeString(name);
  if (description) req.body.description = sanitizeString(description);
  if (category) req.body.category = sanitizeString(category);

  next();
};

/**
 * Order creation validation
 */
const validateOrder = (req, res, next) => {
  const { products, shippingAddress } = req.body;
  const errors = [];

  // Products validation
  if (!products || !Array.isArray(products) || products.length === 0) {
    errors.push('Order must contain at least one product');
  } else if (products.length > 100) {
    errors.push('Order cannot contain more than 100 products');
  } else {
    products.forEach((item, index) => {
      if (!item.product || !isValidObjectId(item.product)) {
        errors.push(`Invalid product ID at index ${index}`);
      }
      if (!item.quantity || !isInRange(item.quantity, 1, 1000)) {
        errors.push(`Product quantity at index ${index} must be between 1 and 1000`);
      }
    });
  }

  // Shipping address validation
  if (!shippingAddress || shippingAddress.trim().length < 10) {
    errors.push('Shipping address must be at least 10 characters long');
  } else if (shippingAddress.length > 500) {
    errors.push('Shipping address must not exceed 500 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  // Sanitize shipping address
  req.body.shippingAddress = sanitizeString(shippingAddress);

  next();
};

/**
 * Quote request validation
 */
const validateQuote = (req, res, next) => {
  const { products, message } = req.body;
  const errors = [];

  // Products validation
  if (!products || !Array.isArray(products) || products.length === 0) {
    errors.push('Quote must contain at least one product');
  } else if (products.length > 1000) {
    errors.push('Quote cannot contain more than 1000 products');
  } else {
    products.forEach((item, index) => {
      if (!item.product || !isValidObjectId(item.product)) {
        errors.push(`Invalid product ID at index ${index}`);
      }
      if (!item.quantity || !isInRange(item.quantity, 1, 100000)) {
        errors.push(`Product quantity at index ${index} must be between 1 and 100,000`);
      }
    });
  }

  // Message validation (optional)
  if (message && message.length > 1000) {
    errors.push('Message must not exceed 1000 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  // Sanitize message
  if (message) {
    req.body.message = sanitizeString(message);
  }

  next();
};

/**
 * Warranty registration validation
 */
const validateWarranty = (req, res, next) => {
  const {
    productName,
    serialNumber,
    modelNumber,
    purchaseDate,
    purchaseType,
  } = req.body;
  const errors = [];

  // Product name validation
  if (!productName || productName.trim().length < 2) {
    errors.push('Product name must be at least 2 characters long');
  }

  // Serial number validation
  if (!serialNumber || serialNumber.trim().length < 3) {
    errors.push('Serial number must be at least 3 characters long');
  } else if (serialNumber.length > 50) {
    errors.push('Serial number must not exceed 50 characters');
  }

  // Model number validation (optional)
  if (modelNumber && modelNumber.length > 50) {
    errors.push('Model number must not exceed 50 characters');
  }

  // Purchase date validation
  if (!purchaseDate) {
    errors.push('Purchase date is required');
  } else {
    const date = new Date(purchaseDate);
    const now = new Date();
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(now.getFullYear() - 5);

    if (isNaN(date.getTime())) {
      errors.push('Invalid purchase date format');
    } else if (date > now) {
      errors.push('Purchase date cannot be in the future');
    } else if (date < fiveYearsAgo) {
      errors.push('Purchase date cannot be more than 5 years ago');
    }
  }

  // Purchase type validation
  const validPurchaseTypes = ['telogica_online', 'telogica_offline', 'retailer'];
  if (!purchaseType || !validPurchaseTypes.includes(purchaseType)) {
    errors.push('Invalid purchase type');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  // Sanitize inputs
  req.body.productName = sanitizeString(productName);
  req.body.serialNumber = sanitizeString(serialNumber);
  if (modelNumber) req.body.modelNumber = sanitizeString(modelNumber);

  next();
};

/**
 * ObjectId parameter validation
 */
const validateObjectIdParam = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({
        message: `Invalid ${paramName}. Must be a valid ObjectId.`,
      });
    }
    
    next();
  };
};

/**
 * Pagination validation
 */
const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page) {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > 10000) {
      return res.status(400).json({
        message: 'Page must be a number between 1 and 10000',
      });
    }
    req.query.page = pageNum;
  }

  if (limit) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        message: 'Limit must be a number between 1 and 100',
      });
    }
    req.query.limit = limitNum;
  }

  next();
};

/**
 * Date range validation
 */
const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (startDate) {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ message: 'Invalid start date format' });
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid end date format' });
    }
  }

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return res.status(400).json({
        message: 'Start date must be before end date',
      });
    }
  }

  next();
};

module.exports = {
  // Helper functions
  isValidEmail,
  isValidPhone,
  isValidObjectId,
  sanitizeString,
  isInRange,
  
  // Validation middleware
  validateUserRegistration,
  validateProduct,
  validateOrder,
  validateQuote,
  validateWarranty,
  validateObjectIdParam,
  validatePagination,
  validateDateRange,
};
