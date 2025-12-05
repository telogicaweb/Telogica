const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { Parser } = require('json2csv');

/**
 * Universal Export Utilities for Enterprise E-Commerce Platform
 * Supports PDF, CSV, and Excel exports for all admin modules
 * Using ExcelJS (secure alternative to xlsx)
 */

// ============================================
// PDF Export Utilities
// ============================================

/**
 * Generate PDF from data array with custom formatting
 * @param {Array} data - Array of objects to export
 * @param {Object} config - Configuration object
 * @param {String} config.title - Document title
 * @param {Array} config.columns - Column definitions [{key, header, width}]
 * @param {Object} config.metadata - Additional metadata
 * @returns {Buffer} PDF buffer
 */
const generatePDF = (data, config) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4',
        layout: config.orientation || 'portrait'
      });
      
      const buffers = [];
      
      doc.on('data', (data) => buffers.push(data));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(20)
        .fillColor('#2563eb')
        .text(config.title || 'Export Report', { align: 'center' })
        .moveDown(0.5);

      // Metadata
      if (config.metadata) {
        doc.fontSize(10).fillColor('#666666');
        Object.entries(config.metadata).forEach(([key, value]) => {
          doc.text(`${key}: ${value}`);
        });
        doc.moveDown();
      }

      // Draw line
      doc.strokeColor('#cccccc').lineWidth(1)
        .moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      // Table Header
      const tableTop = doc.y;
      let currentX = 50;
      
      doc.fontSize(10).fillColor('#000000').font('Helvetica-Bold');
      config.columns.forEach((col) => {
        doc.text(col.header, currentX, tableTop, { 
          width: col.width || 100, 
          align: col.align || 'left' 
        });
        currentX += col.width || 100;
      });
      
      doc.moveDown();
      doc.strokeColor('#cccccc').lineWidth(1)
        .moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);

      // Table Rows
      doc.font('Helvetica').fontSize(9);
      data.forEach((row, index) => {
        // Check if we need a new page
        if (doc.y > 700) {
          doc.addPage();
          doc.y = 50;
        }

        const rowY = doc.y;
        currentX = 50;
        
        config.columns.forEach((col) => {
          const value = getNestedValue(row, col.key);
          const displayValue = col.formatter ? col.formatter(value, row) : String(value || '-');
          
          doc.text(displayValue, currentX, rowY, { 
            width: col.width || 100, 
            align: col.align || 'left',
            height: 20,
            ellipsis: true
          });
          currentX += col.width || 100;
        });
        
        doc.moveDown(0.8);
        
        // Light separator line every 5 rows
        if ((index + 1) % 5 === 0) {
          doc.strokeColor('#eeeeee').lineWidth(0.5)
            .moveTo(50, doc.y).lineTo(545, doc.y).stroke();
          doc.moveDown(0.3);
        }
      });

      // Footer
      const pageCount = doc.bufferedPageRange();
      for (let i = 0; i < pageCount.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#999999');
        doc.text(
          `Page ${i + 1} of ${pageCount.count} | Generated on ${new Date().toLocaleString()}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// ============================================
// CSV Export Utilities
// ============================================

/**
 * Generate CSV from data array
 * @param {Array} data - Array of objects to export
 * @param {Object} config - Configuration object
 * @param {Array} config.fields - Field definitions [{label, value}]
 * @returns {String} CSV string
 */
const generateCSV = (data, config) => {
  try {
    const fields = config.fields || Object.keys(data[0] || {}).map(key => ({
      label: key.charAt(0).toUpperCase() + key.slice(1),
      value: key
    }));

    const parser = new Parser({ 
      fields,
      header: true,
      delimiter: ',',
      quote: '"'
    });
    
    return parser.parse(data);
  } catch (error) {
    throw new Error(`CSV generation failed: ${error.message}`);
  }
};

// ============================================
// Excel Export Utilities
// ============================================

/**
 * Generate Excel file from data array
 * @param {Array} data - Array of objects to export
 * @param {Object} config - Configuration object
 * @param {String} config.sheetName - Sheet name
 * @param {Array} config.columns - Column definitions
 * @returns {Buffer} Excel buffer
 */
const generateExcel = async (data, config) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(config.sheetName || 'Sheet1');
    
    // Define columns
    if (config.columns) {
      worksheet.columns = config.columns.map(col => ({
        header: col.header,
        key: col.key,
        width: col.width ? Math.floor(col.width / 8) : 15,
      }));
      
      // Add data with formatting
      data.forEach(row => {
        const rowData = {};
        config.columns.forEach(col => {
          const value = getNestedValue(row, col.key);
          rowData[col.key] = col.formatter ? col.formatter(value, row) : value;
        });
        worksheet.addRow(rowData);
      });
      
      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    } else {
      // Auto-generate columns from first data item
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        worksheet.columns = headers.map(header => ({
          header: header.charAt(0).toUpperCase() + header.slice(1),
          key: header,
          width: 15,
        }));
        data.forEach(row => worksheet.addRow(row));
        worksheet.getRow(1).font = { bold: true };
      }
    }
    
    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  } catch (error) {
    throw new Error(`Excel generation failed: ${error.message}`);
  }
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get nested object value using dot notation
 * @param {Object} obj - Object to search
 * @param {String} path - Dot-notated path (e.g., 'user.name')
 * @returns {*} Value at path
 */
const getNestedValue = (obj, path) => {
  if (!path) return obj;
  return path.split('.').reduce((acc, part) => {
    if (acc && typeof acc === 'object') {
      return acc[part];
    }
    return undefined;
  }, obj);
};

/**
 * Format date for display
 * @param {Date|String} date - Date to format
 * @returns {String} Formatted date
 */
const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format currency for display
 * @param {Number} amount - Amount to format
 * @returns {String} Formatted currency
 */
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '-';
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Truncate text to specified length
 * @param {String} text - Text to truncate
 * @param {Number} maxLength - Maximum length
 * @returns {String} Truncated text
 */
const truncateText = (text, maxLength = 50) => {
  if (!text) return '-';
  const str = String(text);
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
};

/**
 * Format status with emoji/symbol
 * @param {String} status - Status value
 * @returns {String} Formatted status
 */
const formatStatus = (status) => {
  if (!status) return '-';
  const statusMap = {
    'pending': '⏳ Pending',
    'approved': '✅ Approved',
    'rejected': '❌ Rejected',
    'completed': '✅ Completed',
    'processing': '⏳ Processing',
    'shipped': '🚚 Shipped',
    'delivered': '📦 Delivered',
    'cancelled': '❌ Cancelled',
    'failed': '❌ Failed',
    'active': '✅ Active',
    'inactive': '⏸️ Inactive'
  };
  return statusMap[status.toLowerCase()] || status;
};

// ============================================
// Pre-configured Export Templates
// ============================================

/**
 * Product export configuration
 */
const PRODUCT_EXPORT_CONFIG = {
  title: 'Product Catalog Export',
  columns: [
    { key: 'name', header: 'Product Name', width: 120, align: 'left' },
    { key: 'category', header: 'Category', width: 80 },
    { key: 'price', header: 'Price', width: 70, align: 'right', formatter: formatCurrency },
    { key: 'retailerPrice', header: 'Retailer Price', width: 80, align: 'right', formatter: formatCurrency },
    { key: 'stock', header: 'Online Stock', width: 60, align: 'center' },
    { key: 'offlineStock', header: 'Offline Stock', width: 70, align: 'center' },
    { key: 'isRecommended', header: 'Featured', width: 60, formatter: (v) => v ? 'Yes' : 'No' }
  ],
  csvFields: [
    { label: 'Product Name', value: 'name' },
    { label: 'Category', value: 'category' },
    { label: 'Price', value: 'price' },
    { label: 'Retailer Price', value: 'retailerPrice' },
    { label: 'Online Stock', value: 'stock' },
    { label: 'Offline Stock', value: 'offlineStock' },
    { label: 'Featured', value: 'isRecommended' },
    { label: 'Description', value: 'description' }
  ]
};

/**
 * Order export configuration
 */
const ORDER_EXPORT_CONFIG = {
  title: 'Orders Export',
  columns: [
    { key: '_id', header: 'Order ID', width: 100, formatter: (v) => String(v).slice(-8).toUpperCase() },
    { key: 'user.name', header: 'Customer', width: 100 },
    { key: 'totalAmount', header: 'Amount', width: 80, align: 'right', formatter: formatCurrency },
    { key: 'paymentStatus', header: 'Payment', width: 80, formatter: formatStatus },
    { key: 'orderStatus', header: 'Status', width: 80, formatter: formatStatus },
    { key: 'createdAt', header: 'Date', width: 90, formatter: formatDate }
  ],
  csvFields: [
    { label: 'Order ID', value: '_id' },
    { label: 'Customer Name', value: 'user.name' },
    { label: 'Customer Email', value: 'user.email' },
    { label: 'Total Amount', value: 'totalAmount' },
    { label: 'Payment Status', value: 'paymentStatus' },
    { label: 'Order Status', value: 'orderStatus' },
    { label: 'Order Date', value: (row) => formatDate(row.createdAt) }
  ]
};

/**
 * User export configuration
 */
const USER_EXPORT_CONFIG = {
  title: 'Users Export',
  columns: [
    { key: 'name', header: 'Name', width: 120 },
    { key: 'email', header: 'Email', width: 150 },
    { key: 'role', header: 'Role', width: 70 },
    { key: 'isApproved', header: 'Approved', width: 70, formatter: (v) => v ? 'Yes' : 'No' },
    { key: 'createdAt', header: 'Registered', width: 90, formatter: formatDate }
  ],
  csvFields: [
    { label: 'Name', value: 'name' },
    { label: 'Email', value: 'email' },
    { label: 'Phone', value: 'phone' },
    { label: 'Role', value: 'role' },
    { label: 'Approved', value: 'isApproved' },
    { label: 'Address', value: 'address' },
    { label: 'Registration Date', value: (row) => formatDate(row.createdAt) }
  ]
};

/**
 * Warranty export configuration
 */
const WARRANTY_EXPORT_CONFIG = {
  title: 'Warranty Registrations Export',
  columns: [
    { key: 'productName', header: 'Product', width: 120, formatter: (v) => truncateText(v, 30) },
    { key: 'serialNumber', header: 'Serial No', width: 100 },
    { key: 'user.name', header: 'Customer', width: 100 },
    { key: 'status', header: 'Status', width: 80, formatter: formatStatus },
    { key: 'purchaseDate', header: 'Purchase Date', width: 90, formatter: formatDate },
    { key: 'warrantyEndDate', header: 'Expiry', width: 90, formatter: formatDate }
  ],
  csvFields: [
    { label: 'Product Name', value: 'productName' },
    { label: 'Serial Number', value: 'serialNumber' },
    { label: 'Model Number', value: 'modelNumber' },
    { label: 'Customer Name', value: 'user.name' },
    { label: 'Customer Email', value: 'user.email' },
    { label: 'Status', value: 'status' },
    { label: 'Purchase Date', value: (row) => formatDate(row.purchaseDate) },
    { label: 'Warranty Start', value: (row) => formatDate(row.warrantyStartDate) },
    { label: 'Warranty End', value: (row) => formatDate(row.warrantyEndDate) }
  ]
};

/**
 * Quote export configuration
 */
const QUOTE_EXPORT_CONFIG = {
  title: 'Quote Requests Export',
  columns: [
    { key: 'user.name', header: 'Customer', width: 100 },
    { key: 'user.role', header: 'Type', width: 60 },
    { key: 'products.length', header: 'Items', width: 50, align: 'center' },
    { key: 'adminResponse.totalPrice', header: 'Quoted Price', width: 90, align: 'right', formatter: formatCurrency },
    { key: 'status', header: 'Status', width: 80, formatter: formatStatus },
    { key: 'createdAt', header: 'Date', width: 90, formatter: formatDate }
  ],
  csvFields: [
    { label: 'Customer Name', value: 'user.name' },
    { label: 'Customer Email', value: 'user.email' },
    { label: 'Customer Type', value: 'user.role' },
    { label: 'Number of Items', value: 'products.length' },
    { label: 'Quoted Price', value: 'adminResponse.totalPrice' },
    { label: 'Discount %', value: 'adminResponse.discountPercentage' },
    { label: 'Status', value: 'status' },
    { label: 'Request Date', value: (row) => formatDate(row.createdAt) }
  ]
};

/**
 * Invoice export configuration
 */
const INVOICE_EXPORT_CONFIG = {
  title: 'Invoices Export',
  columns: [
    { key: 'invoiceNumber', header: 'Invoice No', width: 110 },
    { key: 'user.name', header: 'Customer', width: 100 },
    { key: 'totalAmount', header: 'Amount', width: 80, align: 'right', formatter: formatCurrency },
    { key: 'paymentStatus', header: 'Status', width: 80, formatter: formatStatus },
    { key: 'invoiceDate', header: 'Date', width: 90, formatter: formatDate }
  ],
  csvFields: [
    { label: 'Invoice Number', value: 'invoiceNumber' },
    { label: 'Customer Name', value: 'user.name' },
    { label: 'Customer Email', value: 'user.email' },
    { label: 'Subtotal', value: 'subtotal' },
    { label: 'Discount', value: 'discount' },
    { label: 'Tax', value: 'tax' },
    { label: 'Total Amount', value: 'totalAmount' },
    { label: 'Payment Status', value: 'paymentStatus' },
    { label: 'Invoice Date', value: (row) => formatDate(row.invoiceDate) }
  ]
};

module.exports = {
  // Main export functions
  generatePDF,
  generateCSV,
  generateExcel,
  
  // Helper functions
  formatDate,
  formatCurrency,
  truncateText,
  formatStatus,
  getNestedValue,
  
  // Pre-configured templates
  PRODUCT_EXPORT_CONFIG,
  ORDER_EXPORT_CONFIG,
  USER_EXPORT_CONFIG,
  WARRANTY_EXPORT_CONFIG,
  QUOTE_EXPORT_CONFIG,
  INVOICE_EXPORT_CONFIG
};
