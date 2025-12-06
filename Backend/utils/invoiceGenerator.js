const PDFDocument = require('pdfkit');
const cloudinary = require('./cloudinary');

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
  doc
    .fillColor('#444444')
    .fontSize(20)
    .text('Telogica', 50, 57)
    .fontSize(10)
    .text('123 Tech Street', 200, 50, { align: 'right' })
    .text('Bangalore, India', 200, 65, { align: 'right' })
    .moveDown();
}

function generateCustomerInformation(doc, order, invoiceNumber) {
  doc
    .fillColor('#444444')
    .fontSize(20)
    .text('Invoice', 50, 160);

  generateHr(doc, 185);

  const customerInformationTop = 200;

  doc
    .fontSize(10)
    .text('Invoice Number:', 50, customerInformationTop)
    .font('Helvetica-Bold')
    .text(invoiceNumber, 150, customerInformationTop)
    .font('Helvetica')
    .text('Invoice Date:', 50, customerInformationTop + 15)
    .text(formatDate(new Date()), 150, customerInformationTop + 15)
    .text('Order ID:', 50, customerInformationTop + 30)
    .text(order._id.toString().toUpperCase(), 150, customerInformationTop + 30)

    .font('Helvetica-Bold')
    .text(order.user.name, 300, customerInformationTop)
    .font('Helvetica')
    .text(order.shippingAddress, 300, customerInformationTop + 15)
    .moveDown();

  generateHr(doc, 252);
}

function generateInvoiceTable(doc, order, invoice) {
  let i;
  const invoiceTableTop = 330;

  doc.font('Helvetica-Bold');
  generateTableRow(
    doc,
    invoiceTableTop,
    'Item',
    'Unit Cost',
    'Quantity',
    'Line Total'
  );
  generateHr(doc, invoiceTableTop + 20);
  doc.font('Helvetica');

  let position = invoiceTableTop + 30;

  order.products.forEach((item) => {
    const matchingInvoiceProduct = invoice?.products?.find(invItem => {
      const invoiceProductId = invItem.product?._id || invItem.product;
      const orderProductId = item.product?._id || item.product;
      return invoiceProductId && orderProductId && invoiceProductId.toString() === orderProductId.toString();
    });

    const name = item.product.name || 'Product';
    const price = formatCurrency(item.price);
    const quantity = item.quantity;
    const lineTotal = formatCurrency(item.price * item.quantity);

    generateTableRow(
      doc,
      position,
      name,
      price,
      quantity,
      lineTotal
    );

    if (matchingInvoiceProduct?.serialNumbers?.length) {
      doc.fontSize(8).fillColor('#555555');
      doc.text(`Serials: ${matchingInvoiceProduct.serialNumbers.join(', ')}`, 50, position + 12, {
        width: 500
      });
      doc.fillColor('#000000').fontSize(10);
      position += 28;
    } else {
      position += 20;
    }
  });

  generateHr(doc, position + 20);

  const subtotalPosition = position + 30;
  generateTableRow(
    doc,
    subtotalPosition,
    '',
    '',
    'Subtotal',
    formatCurrency(order.totalAmount) // Assuming totalAmount is subtotal for now
  );

  // If there's a discount
  if ((invoice.discount || order.discountApplied) > 0) {
    const discountPosition = subtotalPosition + 20;
    generateTableRow(
      doc,
      discountPosition,
      '',
      '',
      'Discount',
      `${invoice.discount || order.discountApplied}%`
    );
  }

  const totalPosition = subtotalPosition + 40;
  doc.font('Helvetica-Bold');
  generateTableRow(
    doc,
    totalPosition,
    '',
    '',
    'Total',
    formatCurrency(order.totalAmount)
  );
  doc.font('Helvetica');
}

function generateFooter(doc) {
  doc
    .fontSize(10)
    .text(
      'Payment is due within 15 days. Thank you for your business.',
      50,
      780,
      { align: 'center', width: 500 }
    );
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

module.exports = { generateAndUploadInvoice, generateInvoicePdfBuffer, generateRetailerInvoice };
