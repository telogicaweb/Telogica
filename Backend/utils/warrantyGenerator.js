const PDFDocument = require('pdfkit');
const cloudinary = require('./cloudinary');

// Telogica Official Company Details
const COMPANY_INFO = {
  name: 'Telogica',
  fullName: 'Telogica Technologies Pvt. Ltd.',
  address: 'Plot No. 42, Electronics City Phase 1',
  city: 'Bangalore, Karnataka - 560100',
  country: 'India',
  email: 'support@telogica.com',
  phone: '+91 80 4567 8900',
  website: 'www.telogica.com',
  warranty: 'warranty@telogica.com',
  // Logo URL - using a tech/telecom themed placeholder
  logoUrl: 'https://www.aishwaryatechtele.com/images/telogica_logo.png'
};

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
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Top decorative border
  doc
    .fillColor('#4F46E5')
    .rect(0, 0, 612, 12)
    .fill();

  doc
    .fillColor('#10B981')
    .rect(0, 12, 612, 4)
    .fill();

  // Company Header
  doc
    .fillColor('#1F2937')
    .fontSize(26)
    .font('Helvetica-Bold')
    .text(COMPANY_INFO.name, 50, 35, { align: 'center' })
    .fillColor('#6B7280')
    .fontSize(10)
    .font('Helvetica')
    .text(COMPANY_INFO.fullName, 50, 65, { align: 'center' })
    .text(COMPANY_INFO.address + ', ' + COMPANY_INFO.city, 50, 80, { align: 'center' })
    .fillColor('#4F46E5')
    .text(COMPANY_INFO.phone + ' | ' + COMPANY_INFO.email, 50, 95, { align: 'center' });

  // Decorative shield/badge\n  doc\n    .lineWidth(3)\n    .strokeColor('#10B981')\n    .circle(306, 150, 45)\n    .stroke();

  doc
    .fillColor('#10B981')
    .fontSize(32)
    .font('Helvetica-Bold')
    .text('✓', 50, 130, { align: 'center', width: 512 });

  // Certificate Title with elegant styling
  doc
    .fillColor('#1F2937')
    .fontSize(32)
    .font('Helvetica-Bold')
    .text('WARRANTY CERTIFICATE', 50, 210, { align: 'center' })
    .fillColor('#6B7280')
    .fontSize(11)
    .font('Helvetica')
    .text('This certifies that the product described below is covered under warranty', 50, 248, { align: 'center' });

  // Decorative line
  doc
    .strokeColor('#E5E7EB')
    .lineWidth(1)
    .moveTo(150, 270)
    .lineTo(462, 270)
    .stroke();

  // Product Information Box
  const productBoxTop = 290;
  doc
    .fillColor('#F3F4F6')
    .roundedRect(50, productBoxTop, 512, 140, 5)
    .fill();

  doc
    .fillColor('#4F46E5')
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('PRODUCT INFORMATION', 70, productBoxTop + 15);

  const infoLeft = 70;
  const valueLeft = 220;
  let infoY = productBoxTop + 45;

  doc
    .fillColor('#6B7280')
    .fontSize(10)
    .font('Helvetica')
    .text('Product Name:', infoLeft, infoY)
    .fillColor('#1F2937')
    .font('Helvetica-Bold')
    .text(warranty.productName, valueLeft, infoY, { width: 320 });

  infoY += 25;
  doc
    .fillColor('#6B7280')
    .font('Helvetica')
    .text('Model Number:', infoLeft, infoY)
    .fillColor('#1F2937')
    .font('Helvetica-Bold')
    .text(warranty.modelNumber, valueLeft, infoY);

  infoY += 25;
  doc
    .fillColor('#6B7280')
    .font('Helvetica')
    .text('Serial Number:', infoLeft, infoY)
    .fillColor('#4F46E5')
    .fontSize(11)
    .font('Helvetica-Bold')
    .text(warranty.serialNumber, valueLeft, infoY);

  infoY += 25;
  doc
    .fillColor('#6B7280')
    .fontSize(10)
    .font('Helvetica')
    .text('Warranty ID:', infoLeft, infoY)
    .fillColor('#374151')
    .font('Helvetica-Bold')
    .text('#' + warranty._id.toString().slice(-8).toUpperCase(), valueLeft, infoY);

  // Warranty Period Box
  const warrantyBoxTop = 450;
  doc
    .fillColor('#10B981')
    .rect(50, warrantyBoxTop, 250, 80)
    .fill();

  doc
    .fillColor('#FFFFFF')
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('WARRANTY PERIOD', 60, warrantyBoxTop + 12);

  doc
    .fontSize(9)
    .font('Helvetica')
    .text('Start Date', 60, warrantyBoxTop + 35)
    .fontSize(11)
    .font('Helvetica-Bold')
    .text(formatDate(warranty.warrantyStartDate), 60, warrantyBoxTop + 50);

  doc
    .fontSize(9)
    .font('Helvetica')
    .text('End Date', 170, warrantyBoxTop + 35)
    .fontSize(11)
    .font('Helvetica-Bold')
    .text(formatDate(warranty.warrantyEndDate), 170, warrantyBoxTop + 50);

  // Customer Information Box
  doc
    .fillColor('#4F46E5')
    .rect(312, warrantyBoxTop, 250, 80)
    .fill();

  doc
    .fillColor('#FFFFFF')
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('ISSUED TO', 322, warrantyBoxTop + 12);

  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .text(user.name, 322, warrantyBoxTop + 35, { width: 230 })
    .fontSize(9)
    .font('Helvetica')
    .text(user.email, 322, warrantyBoxTop + 52, { width: 230 });

  // Terms and Conditions
  const termsTop = 555;
  doc
    .fillColor('#1F2937')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('WARRANTY TERMS & CONDITIONS', 50, termsTop);

  doc
    .fillColor('#374151')
    .fontSize(8)
    .font('Helvetica')
    .text(
      '• This warranty covers defects in materials and workmanship under normal use during the warranty period.\n' +
      '• The warranty does not cover damage caused by accident, abuse, misuse, modification, or unauthorized repairs.\n' +
      '• Warranty service requires proof of purchase and this warranty certificate.\n' +
      '• For warranty claims, contact us at ' + COMPANY_INFO.warranty + ' or call ' + COMPANY_INFO.phone + '.\n' +
      '• This warranty is non-transferable and valid only for the original purchaser.',
      50, termsTop + 18,
      { width: 512, lineGap: 2 }
    );

  // Footer with signature area
  doc
    .strokeColor('#E5E7EB')
    .lineWidth(1)
    .moveTo(50, 690)
    .lineTo(250, 690)
    .stroke();

  doc
    .fillColor('#6B7280')
    .fontSize(8)
    .text('Authorized Signature', 50, 695, { width: 200, align: 'center' });

  // Company seal area (placeholder)
  doc
    .strokeColor('#4F46E5')
    .lineWidth(2)
    .circle(480, 685, 30)
    .stroke();

  doc
    .fillColor('#4F46E5')
    .fontSize(7)
    .font('Helvetica-Bold')
    .text('OFFICIAL\\nSEAL', 450, 680, { align: 'center', width: 60 });

  // Bottom brand bar
  doc
    .fillColor('#4F46E5')
    .rect(0, 760, 612, 20)
    .fill();

  doc
    .fillColor('#FFFFFF')
    .fontSize(8)
    .text('www.telogica.com | Quality Products, Trusted Service', 50, 768, { align: 'center', width: 512 });

  doc
    .fillColor('#10B981')
    .rect(0, 780, 612, 4)
    .fill();
}

module.exports = { generateAndUploadWarranty };
