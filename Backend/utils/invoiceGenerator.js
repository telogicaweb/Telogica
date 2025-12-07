const PDFDocument = require('pdfkit');
const cloudinary = require('./cloudinary');

// Telogica Official Company Details
const COMPANY_INFO = {
  name: 'Telogica',
  fullName: 'Telogica Technologies Pvt. Ltd.',
  address: 'Plot No. 42, Electronics City Phase 1',
  city: 'Bangalore, Karnataka - 560100',
  country: 'India',
  email: 'sales@telogica.com',
  phone: '+91 80 4567 8900',
  website: 'www.telogica.com',
  gst: 'GST: 29AABCT1332L1Z3',
  cin: 'CIN: U72200KA2015PTC081234',
  // Logo URL - using a tech/telecom themed placeholder
  logoUrl: 'https://via.placeholder.com/150x60/4F46E5/FFFFFF?text=TELOGICA'
};

const generateAndUploadInvoice = async (order, invoice) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'invoices',
        public_id: `invoice_${invoice.invoiceNumber || invoice._id}_${Date.now()}`,
        resource_type: 'auto',
        format: 'pdf'
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    doc.pipe(uploadStream);
    renderInvoice(doc, order, invoice);
    doc.end();
  });
};

const generateInvoicePdfBuffer = async (order, invoice) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on('data', (data) => buffers.push(data));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    renderInvoice(doc, order, invoice);
    doc.end();
  });
};

function renderInvoice(doc, order, invoice) {
  generateHeader(doc);
  generateCustomerInformation(doc, order, invoice.invoiceNumber);
  generateInvoiceTable(doc, order, invoice);
  generateFooter(doc);
}

function generateHeader(doc) {
  // Brand Color Bar at top
  doc
    .fillColor('#4F46E5')
    .rect(0, 0, 612, 8)
    .fill();

  // Company Logo and Name
  doc
    .fillColor('#1F2937')
    .fontSize(28)
    .font('Helvetica-Bold')
    .text(COMPANY_INFO.name, 50, 30)
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#6B7280')
    .text(COMPANY_INFO.fullName, 50, 62);

  // Company Details - Right Side
  doc
    .fontSize(9)
    .fillColor('#374151')
    .text(COMPANY_INFO.address, 350, 30, { align: 'right', width: 200 })
    .text(COMPANY_INFO.city, 350, 44, { align: 'right', width: 200 })
    .text(COMPANY_INFO.country, 350, 58, { align: 'right', width: 200 })
    .fillColor('#4F46E5')
    .text(COMPANY_INFO.phone, 350, 72, { align: 'right', width: 200 })
    .text(COMPANY_INFO.email, 350, 86, { align: 'right', width: 200 })
    .fillColor('#374151')
    .fontSize(8)
    .text(COMPANY_INFO.gst, 350, 100, { align: 'right', width: 200 });

  // Decorative line
  doc
    .strokeColor('#E5E7EB')
    .lineWidth(1)
    .moveTo(50, 120)
    .lineTo(550, 120)
    .stroke();
}

function generateCustomerInformation(doc, order, invoiceNumber) {
  // Invoice Title with Background
  doc
    .fillColor('#4F46E5')
    .fontSize(32)
    .font('Helvetica-Bold')
    .text('INVOICE', 50, 140);

  // Invoice Details Box
  const invoiceBoxTop = 140;
  doc
    .fillColor('#F9FAFB')
    .rect(340, invoiceBoxTop, 210, 70)
    .fill();

  doc
    .fillColor('#6B7280')
    .fontSize(9)
    .font('Helvetica')
    .text('Invoice Number', 350, invoiceBoxTop + 10)
    .fillColor('#1F2937')
    .fontSize(11)
    .font('Helvetica-Bold')
    .text(invoiceNumber, 350, invoiceBoxTop + 24)
    .fillColor('#6B7280')
    .fontSize(9)
    .font('Helvetica')
    .text('Invoice Date', 450, invoiceBoxTop + 10)
    .fillColor('#1F2937')
    .fontSize(10)
    .text(formatDateProfessional(new Date()), 450, invoiceBoxTop + 24)
    .fillColor('#6B7280')
    .fontSize(9)
    .text('Order ID', 350, invoiceBoxTop + 45)
    .fillColor('#1F2937')
    .fontSize(10)
    .text('#' + order._id.toString().slice(-8).toUpperCase(), 350, invoiceBoxTop + 58);

  // Bill To Section
  const billToTop = 230;
  doc
    .fillColor('#4F46E5')
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('BILL TO', 50, billToTop);

  doc
    .fillColor('#1F2937')
    .fontSize(12)
    .font('Helvetica-Bold')
    .text(order.user.name, 50, billToTop + 20)
    .fillColor('#374151')
    .fontSize(10)
    .font('Helvetica')
    .text(order.shippingAddress, 50, billToTop + 38, { width: 250, lineGap: 3 });

  // Decorative line
  doc
    .strokeColor('#E5E7EB')
    .lineWidth(1)
    .moveTo(50, billToTop + 90)
    .lineTo(550, billToTop + 90)
    .stroke();
}

function formatDateProfessional(date) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(date).toLocaleDateString('en-US', options);
}

function generateInvoiceTable(doc, order, invoice) {
  const invoiceTableTop = 350;

  // Table Header with background
  doc
    .fillColor('#4F46E5')
    .rect(50, invoiceTableTop, 500, 25)
    .fill();

  doc
    .fillColor('#FFFFFF')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Item Description', 60, invoiceTableTop + 8, { width: 200 })
    .text('Unit Price', 280, invoiceTableTop + 8, { width: 80, align: 'right' })
    .text('Qty', 370, invoiceTableTop + 8, { width: 50, align: 'center' })
    .text('Amount', 450, invoiceTableTop + 8, { width: 90, align: 'right' });

  doc.font('Helvetica');

  let position = invoiceTableTop + 35;
  let itemNumber = 1;

  order.products.forEach((item) => {
    const matchingInvoiceProduct = invoice?.products?.find(invItem => {
      const invoiceProductId = invItem.product?._id || invItem.product;
      const orderProductId = item.product?._id || item.product;
      return invoiceProductId && orderProductId && invoiceProductId.toString() === orderProductId.toString();
    });

    const name = item.product.name || 'Product';
    const price = formatCurrencyProfessional(item.price);
    const quantity = item.quantity;
    const lineTotal = formatCurrencyProfessional(item.price * item.quantity);

    // Alternate row background
    if (itemNumber % 2 === 0) {
      doc
        .fillColor('#F9FAFB')
        .rect(50, position - 5, 500, 25)
        .fill();
    }

    doc
      .fillColor('#374151')
      .fontSize(10)
      .text(name, 60, position, { width: 200 })
      .text(price, 280, position, { width: 80, align: 'right' })
      .text(quantity.toString(), 370, position, { width: 50, align: 'center' })
      .fillColor('#1F2937')
      .font('Helvetica-Bold')
      .text(lineTotal, 450, position, { width: 90, align: 'right' })
      .font('Helvetica');

    position += 20;

    if (matchingInvoiceProduct?.serialNumbers?.length) {
      doc
        .fontSize(8)
        .fillColor('#6B7280')
        .text(`S/N: ${matchingInvoiceProduct.serialNumbers.join(', ')}`, 60, position, {
          width: 480
        });
      position += 18;
    }

    itemNumber++;
  });

  // Bottom border of table
  doc
    .strokeColor('#E5E7EB')
    .lineWidth(1)
    .moveTo(50, position + 5)
    .lineTo(550, position + 5)
    .stroke();

  // Summary Box
  const summaryTop = position + 20;
  const summaryLeft = 350;

  doc
    .fillColor('#F9FAFB')
    .rect(summaryLeft, summaryTop, 200, 80)
    .fill();

  // Subtotal
  doc
    .fillColor('#6B7280')
    .fontSize(10)
    .font('Helvetica')
    .text('Subtotal:', summaryLeft + 10, summaryTop + 10)
    .fillColor('#374151')
    .text(formatCurrencyProfessional(order.totalAmount), summaryLeft + 10, summaryTop + 10, { align: 'right', width: 180 });

  // If there's a discount
  if ((invoice.discount || order.discountApplied) > 0) {
    doc
      .fillColor('#6B7280')
      .text('Discount:', summaryLeft + 10, summaryTop + 28)
      .fillColor('#10B981')
      .text(`-${invoice.discount || order.discountApplied}%`, summaryLeft + 10, summaryTop + 28, { align: 'right', width: 180 });
  }

  // Tax (if applicable)
  doc
    .fillColor('#6B7280')
    .fontSize(9)
    .text('Tax (included):', summaryLeft + 10, summaryTop + 46)
    .text('₹0.00', summaryLeft + 10, summaryTop + 46, { align: 'right', width: 180 });

  // Total with highlight
  doc
    .strokeColor('#4F46E5')
    .lineWidth(1)
    .moveTo(summaryLeft + 10, summaryTop + 60)
    .lineTo(summaryLeft + 190, summaryTop + 60)
    .stroke();

  doc
    .fillColor('#1F2937')
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('TOTAL:', summaryLeft + 10, summaryTop + 66)
    .fontSize(14)
    .fillColor('#4F46E5')
    .text(formatCurrencyProfessional(order.totalAmount), summaryLeft + 10, summaryTop + 64, { align: 'right', width: 180 });
}

function generateFooter(doc) {
  // Terms and Conditions Box
  doc
    .fillColor('#F3F4F6')
    .rect(50, 700, 500, 60)
    .fill();

  doc
    .fillColor('#6B7280')
    .fontSize(8)
    .font('Helvetica-Bold')
    .text('TERMS & CONDITIONS', 60, 710)
    .font('Helvetica')
    .fontSize(7)
    .text('Payment is due within 15 days from the date of invoice. Please make all checks payable to Telogica Technologies Pvt. Ltd.', 60, 722, { width: 480, lineGap: 1 })
    .text('For any queries, please contact us at ' + COMPANY_INFO.email + ' or call ' + COMPANY_INFO.phone, 60, 740, { width: 480 });

  // Footer brand bar
  doc
    .fillColor('#4F46E5')
    .rect(0, 770, 612, 25)
    .fill();

  doc
    .fillColor('#FFFFFF')
    .fontSize(9)
    .text('Thank you for your business!', 50, 780, { align: 'center', width: 512 })
    .fontSize(7)
    .text(COMPANY_INFO.website, 50, 792, { align: 'center', width: 512 });
}

function generateTableRow(doc, y, item, unitCost, quantity, lineTotal) {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(unitCost, 280, y, { width: 90, align: 'right' })
    .text(quantity, 370, y, { width: 90, align: 'right' })
    .text(lineTotal, 0, y, { align: 'right' });
}

function generateHr(doc, y) {
  doc
    .strokeColor('#aaaaaa')
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}

function formatCurrency(amount) {
  return "INR " + (amount).toFixed(2);
}

function formatCurrencyProfessional(amount) {
  return "\u20b9" + (amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return year + "/" + month + "/" + day;
}

const generateRetailerInvoice = async (saleData, retailer, product, productUnit) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });

    // Generate unique invoice number if not provided
    if (!saleData.invoiceNumber) {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      saleData.invoiceNumber = `INV-${dateStr}-${randomStr}`;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'invoices/retailer',
        public_id: `retailer_invoice_${productUnit.serialNumber}_${Date.now()}`,
        resource_type: 'auto',
        format: 'pdf'
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve({ url: result.secure_url, invoiceNumber: saleData.invoiceNumber });
        }
      }
    );

    doc.pipe(uploadStream);
    renderRetailerInvoice(doc, saleData, retailer, product, productUnit);
    doc.end();
  });
};

function renderRetailerInvoice(doc, saleData, retailer, product, productUnit) {
  // Header with Company Name
  doc
    .fillColor('#444444')
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('Telogica Limited', 50, 50)
    .fontSize(10)
    .font('Helvetica')
    .text('(Formerly Aishwarya Technologies and Telecom Limited)', 50, 75)
    .fontSize(10)
    .text('Authorized Retailer Sale', 200, 50, { align: 'right' })
    .moveDown();

  generateHr(doc, 95);

  const customerInformationTop = 120;

  // Seller (Retailer) Info
  doc
    .fontSize(10)
    .text('Sold By:', 50, customerInformationTop)
    .font('Helvetica-Bold')
    .text(retailer.name, 50, customerInformationTop + 15)
    .font('Helvetica')
    .text(retailer.email, 50, customerInformationTop + 30)
    .text(retailer.phone || '', 50, customerInformationTop + 45)
    .text(retailer.address || '', 50, customerInformationTop + 60, { width: 200 });

  // Buyer (Customer) Info
  doc
    .font('Helvetica')
    .text('Sold To:', 300, customerInformationTop)
    .font('Helvetica-Bold')
    .text(saleData.customerName, 300, customerInformationTop + 15)
    .font('Helvetica')
    .text(saleData.customerEmail, 300, customerInformationTop + 30)
    .text(saleData.customerPhone, 300, customerInformationTop + 45)
    .text(saleData.customerAddress, 300, customerInformationTop + 60, { width: 200 });

  // Invoice Details
  const invoiceDetailsTop = customerInformationTop + 100;
  doc
    .text('Invoice Number:', 50, invoiceDetailsTop)
    .font('Helvetica-Bold')
    .text(saleData.invoiceNumber, 150, invoiceDetailsTop)
    .font('Helvetica')
    .text('Date:', 50, invoiceDetailsTop + 15)
    .text(formatDate(new Date(saleData.soldDate || Date.now())), 150, invoiceDetailsTop + 15);

  generateHr(doc, invoiceDetailsTop + 40);

  // Product Table
  const tableTop = invoiceDetailsTop + 60;
  doc.font('Helvetica-Bold');
  generateTableRow(doc, tableTop, 'Product', 'Serial Number', 'Model', 'Price');
  generateHr(doc, tableTop + 20);
  doc.font('Helvetica');

  const itemPosition = tableTop + 30;
  generateTableRow(
    doc,
    itemPosition,
    product.name,
    productUnit.serialNumber,
    productUnit.modelNumber,
    formatCurrency(Number(saleData.sellingPrice))
  );

  generateHr(doc, itemPosition + 20);

  // Total
  const totalPosition = itemPosition + 40;
  doc.font('Helvetica-Bold');
  generateTableRow(
    doc,
    totalPosition,
    '',
    '',
    'Total',
    formatCurrency(Number(saleData.sellingPrice))
  );
  doc.font('Helvetica');

  // Footer
  doc
    .fontSize(10)
    .text(
      'Thank you for your purchase.',
      50,
      700,
      { align: 'center', width: 500 }
    );
}

const generateOrderInvoicePdfBuffer = async (order, productUnits) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on('data', (data) => buffers.push(data));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    renderOrderInvoice(doc, order, productUnits);
    doc.end();
  });
};

function renderOrderInvoice(doc, order, productUnits) {
  // Header
  doc
    .fillColor('#444444')
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('Telogica Limited', 50, 50)
    .fontSize(10)
    .font('Helvetica')
    .text('(Formerly Aishwarya Technologies and Telecom Limited)', 50, 75)
    .fontSize(10)
    .text('Tax Invoice', 200, 50, { align: 'right' })
    .moveDown();

  generateHr(doc, 95);

  const customerInformationTop = 120;

  // Seller Info (Telogica)
  doc
    .fontSize(10)
    .text('Sold By:', 50, customerInformationTop)
    .font('Helvetica-Bold')
    .text('Telogica Limited', 50, customerInformationTop + 15)
    .font('Helvetica')
    .text('123 Tech Street', 50, customerInformationTop + 30)
    .text('Bangalore, India', 50, customerInformationTop + 45);

  // Buyer Info (Retailer)
  doc
    .font('Helvetica')
    .text('Sold To:', 300, customerInformationTop)
    .font('Helvetica-Bold')
    .text(order.user.name, 300, customerInformationTop + 15)
    .font('Helvetica')
    .text(order.user.email, 300, customerInformationTop + 30)
    .text(order.shippingAddress, 300, customerInformationTop + 45, { width: 200 });

  // Invoice Details
  const invoiceDetailsTop = customerInformationTop + 100;
  doc
    .text('Invoice Number:', 50, invoiceDetailsTop)
    .font('Helvetica-Bold')
    .text(order.orderNumber || `ORD-${order._id.toString().slice(-6).toUpperCase()}`, 150, invoiceDetailsTop)
    .font('Helvetica')
    .text('Date:', 50, invoiceDetailsTop + 15)
    .text(formatDate(new Date(order.createdAt)), 150, invoiceDetailsTop + 15);

  generateHr(doc, invoiceDetailsTop + 40);

  // Product Table
  const tableTop = invoiceDetailsTop + 60;
  doc.font('Helvetica-Bold');

  // Custom Table Row for Order Invoice (more columns)
  const generateOrderTableRow = (y, item, model, serial, originalPrice, price, total) => {
    doc
      .fontSize(8)
      .text(item, 50, y, { width: 150 })
      .text(model, 200, y, { width: 80 })
      .text(serial, 280, y, { width: 80 })
      .text(originalPrice, 360, y, { width: 60, align: 'right' })
      .text(price, 430, y, { width: 60, align: 'right' })
      .text(total, 0, y, { align: 'right' });
  };

  generateOrderTableRow(tableTop, 'Product', 'Model', 'Serial', 'Orig. Price', 'Paid Price', 'Total');
  generateHr(doc, tableTop + 20);
  doc.font('Helvetica');

  let position = tableTop + 30;

  order.products.forEach((item) => {
    const itemUnits = productUnits.filter(u => u.product.toString() === item.product._id.toString());
    const serials = itemUnits.map(u => u.serialNumber).join(', ') || 'N/A';
    const models = [...new Set(itemUnits.map(u => u.modelNumber))].join(', ') || 'N/A';

    // Determine Original Price
    // If it's a quote, item.price is the quoted price. Original price might be on product.
    // If it's direct cart, item.price is the price.
    // We can show product.price or product.retailerPrice as original if available.
    const originalPriceVal = item.product.retailerPrice || item.product.price || 0;
    const originalPrice = formatCurrency(originalPriceVal);
    const paidPrice = formatCurrency(item.price);
    const lineTotal = formatCurrency(item.price * item.quantity);

    generateOrderTableRow(
      position,
      item.product.name,
      models,
      serials,
      originalPrice,
      paidPrice,
      lineTotal
    );

    position += 20;

    // Add extra space if serials wrap (simple approximation)
    if (serials.length > 20) position += 10;
  });

  generateHr(doc, position + 20);

  // Total
  const totalPosition = position + 40;
  doc.font('Helvetica-Bold');
  doc.fontSize(10);
  generateTableRow(
    doc,
    totalPosition,
    '',
    '',
    'Total',
    formatCurrency(order.totalAmount)
  );
  doc.font('Helvetica');

  // Footer
  doc
    .fontSize(10)
    .text(
      'Thank you for your business.',
      50,
      700,
      { align: 'center', width: 500 }
    );
}

const generateAndUploadDropshipInvoice = async (data) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'invoices',
        public_id: `dropship_invoice_${data.invoiceNumber || Date.now()}_${Date.now()}`,
        resource_type: 'auto',
        format: 'pdf'
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    doc.pipe(uploadStream);
    renderDropshipInvoice(doc, data);
    doc.end();
  });
};

const generateDropshipInvoicePdfBuffer = async (data) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on('data', (data) => buffers.push(data));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    renderDropshipInvoice(doc, data);
    doc.end();
  });
};

function renderDropshipInvoice(doc, { retailer, customerDetails, items, invoiceNumber, date }) {
  // Header with Company Name
  doc
    .fillColor('#444444')
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('TELOGICA LIMITED', 50, 50)
    .fontSize(10)
    .font('Helvetica')
    .text('(formerly Aishwarya Technologies & Limited)', 50, 75)
    .moveDown();

  generateHr(doc, 95);

  const customerInformationTop = 120;

  // Seller (Retailer) Info
  doc
    .fontSize(10)
    .fillColor('#000000')
    .text('Sold By:', 50, customerInformationTop)
    .font('Helvetica-Bold')
    .text(retailer.name, 50, customerInformationTop + 15)
    .font('Helvetica')
    .text(retailer.email, 50, customerInformationTop + 30)
    .text(retailer.phone || '', 50, customerInformationTop + 45);

  const shipToTop = 200;

  // Ship To (Customer)
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('SHIP TO:', 50, shipToTop)
    .font('Helvetica')
    .text(customerDetails.name, 50, shipToTop + 15)
    .text(customerDetails.email, 50, shipToTop + 30)
    .text(customerDetails.phone, 50, shipToTop + 45)
    .text(customerDetails.address, 50, shipToTop + 60, { width: 200 });

  // Invoice/Slip Details
  const invoiceDetailsTop = shipToTop;
  doc
    .font('Helvetica-Bold')
    .text('Invoice', 300, invoiceDetailsTop, { align: 'right' }) // Renamed from Delivery Note
    .font('Helvetica')
    .text(`Number: ${invoiceNumber}`, 300, invoiceDetailsTop + 15, { align: 'right' })
    .text(`Date: ${formatDate(new Date(date))}`, 300, invoiceDetailsTop + 30, { align: 'right' });

  generateHr(doc, shipToTop + 100);

  // Product Table (No Prices)
  const tableTop = shipToTop + 120;
  doc.font('Helvetica-Bold');

  // Custom headers for dropship (Product, Quantity)
  doc
    .text('Product', 50, tableTop)
    .text('Quantity', 400, tableTop, { align: 'right' });

  generateHr(doc, tableTop + 20);
  doc.font('Helvetica');

  let position = tableTop + 35;

  items.forEach((item) => {
    const name = item.product.name || 'Product';
    const quantity = item.quantity;

    doc
      .fontSize(10)
      .text(name, 50, position, { width: 300 })
      .text(quantity.toString(), 400, position, { align: 'right' });

    position += 20;
  });

  generateHr(doc, position + 10);

  // Footer
  doc
    .fontSize(10)
    .text(
      'Thank you for your order.',
      50,
      700,
      { align: 'center', width: 500 }
    );
}

module.exports = { generateAndUploadInvoice, generateInvoicePdfBuffer, generateRetailerInvoice, generateOrderInvoicePdfBuffer, generateDropshipInvoicePdfBuffer, generateAndUploadDropshipInvoice };
