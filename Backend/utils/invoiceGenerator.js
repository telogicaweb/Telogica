const PDFDocument = require('pdfkit');
const cloudinary = require('./cloudinary');

const generateAndUploadInvoice = async (order, invoiceNumber) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    
    // Create a stream to upload to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'invoices',
        public_id: `invoice_${invoiceNumber}_${Date.now()}`,
        resource_type: 'auto', // 'auto' usually handles PDF correctly as 'image' or 'raw' depending on config, but 'raw' is safer for non-image files. However, Cloudinary supports PDF as image type for transformations. Let's use 'auto'.
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

    // --- PDF Content Generation ---
    generateHeader(doc);
    generateCustomerInformation(doc, order, invoiceNumber);
    generateInvoiceTable(doc, order);
    generateFooter(doc);

    doc.end();
  });
};

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

function generateInvoiceTable(doc, order) {
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
    const positionY = position;
    const name = item.product.name || 'Product';
    const price = formatCurrency(item.price);
    const quantity = item.quantity;
    const lineTotal = formatCurrency(item.price * item.quantity);

    generateTableRow(
      doc,
      positionY,
      name,
      price,
      quantity,
      lineTotal
    );
    
    position += 20;
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
  if (order.discountApplied > 0) {
      const discountPosition = subtotalPosition + 20;
      generateTableRow(
        doc,
        discountPosition,
        '',
        '',
        'Discount',
        `${order.discountApplied}%`
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

function formatCurrency(cents) {
  return "INR " + (cents).toFixed(2);
}

function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return year + "/" + month + "/" + day;
}

module.exports = { generateAndUploadInvoice };
