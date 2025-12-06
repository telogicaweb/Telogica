const PDFDocument = require('pdfkit');
const cloudinary = require('./cloudinary');

const generateAndUploadWarranty = async (warranty, user) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'warranties',
        public_id: `warranty_${warranty.serialNumber}_${Date.now()}`,
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
    renderWarranty(doc, warranty, user);
    doc.end();
  });
};

function renderWarranty(doc, warranty, user) {
  // Header
  doc
    .fillColor('#444444')
    .fontSize(20)
    .text('Telogica', 50, 57)
    .fontSize(10)
    .text('Warranty Certificate', 200, 65, { align: 'right' })
    .moveDown();

  // Title
  doc
    .fillColor('#000000')
    .fontSize(25)
    .text('Certificate of Warranty', 50, 130, { align: 'center' })
    .moveDown();

  // Product Details
  doc
    .fontSize(14)
    .text(`Product: ${warranty.productName}`, 50, 200)
    .text(`Model Number: ${warranty.modelNumber}`, 50, 225)
    .text(`Serial Number: ${warranty.serialNumber}`, 50, 250)
    .moveDown();

  // Warranty Period
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  doc
    .fontSize(12)
    .text('Warranty Period:', 50, 300)
    .text(`Start Date: ${formatDate(warranty.warrantyStartDate)}`, 70, 320)
    .text(`End Date: ${formatDate(warranty.warrantyEndDate)}`, 70, 340)
    .moveDown();

  // Customer Details
  doc
    .text('Issued To:', 50, 380)
    .text(`Name: ${user.name}`, 70, 400)
    .text(`Email: ${user.email}`, 70, 420)
    .moveDown();

  // Terms
  doc
    .fontSize(10)
    .text('Terms and Conditions:', 50, 480)
    .text(
      'This warranty covers defects in materials and workmanship under normal use for the period specified above. ' +
      'It does not cover damage caused by accident, abuse, misuse, or modification of the product. ' +
      'Proof of purchase is required for warranty service.',
      { width: 500, align: 'justify' }
    );

  // Footer
  doc
    .fontSize(10)
    .text(
      'Telogica Inc.',
      50,
      700,
      { align: 'center', width: 500 }
    );
}

module.exports = { generateAndUploadWarranty };
