const Warranty = require('../models/Warranty');
const ProductUnit = require('../models/ProductUnit');
const User = require('../models/User');
const Product = require('../models/Product');
const { sendEmail } = require('../utils/mailer');
const { getWarrantyRegistrationEmail } = require('../utils/emailTemplates');
const cloudinary = require('../utils/cloudinary');
const streamifier = require('streamifier');
const { generateAndUploadWarranty } = require('../utils/warrantyGenerator');

// Upload invoice
exports.uploadInvoice = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No invoice file provided' });
  }

  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'invoices',
          resource_type: 'auto', // Allow PDF etc.
        },
        (error, response) => {
          if (error) return reject(error);
          resolve(response);
        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    res.status(201).json({ url: result.secure_url, public_id: result.public_id });
  } catch (error) {
    console.error('Cloudinary upload failed', error);
    res.status(500).json({ message: 'Failed to upload invoice' });
  }
};

// Register warranty
exports.registerWarranty = async (req, res) => {
  try {
    const { 
      productId, 
      productName, 
      modelNumber, 
      serialNumber, 
      purchaseDate, 
      purchaseType, 
      invoice 
    } = req.body;

    // Validate invoice upload for offline/retailer purchases
    if ((purchaseType === 'telogica_offline' || purchaseType === 'retailer') && !invoice) {
      return res.status(400).json({ 
        message: 'Invoice upload is required for offline or retailer purchases' 
      });
    }

    // Find the product unit by serial number
    const productUnit = await ProductUnit.findOne({ 
      serialNumber,
      product: productId 
    });

    if (!productUnit) {
      return res.status(404).json({ 
        message: 'Product unit not found with this serial number' 
      });
    }

    // Check if warranty already exists for this serial number
    const existingWarranty = await Warranty.findOne({ serialNumber });
    if (existingWarranty) {
      return res.status(400).json({ 
        message: 'Warranty already registered for this serial number' 
      });
    }

    // Create warranty registration
    const warranty = await Warranty.create({
      user: req.user._id,
      product: productId,
      productUnit: productUnit._id,
      productName,
      modelNumber,
      serialNumber,
      purchaseDate,
      purchaseType,
      invoice,
      warrantyPeriodMonths: productUnit.warrantyPeriodMonths
    });

    await warranty.populate('product user');

    // Send email notification to user
    const warrantyEmailHtml = getWarrantyRegistrationEmail(
      req.user.name,
      productName,
      serialNumber,
      productUnit.warrantyPeriodMonths || 12
    );
    
    await sendEmail(
      req.user.email,
      'Warranty Registration Successful - Telogica',
      `Your warranty registration for ${productName} (Serial: ${serialNumber}) has been submitted successfully.`,
      'warranty_submitted',
      { entityType: 'warranty', entityId: warranty._id },
      warrantyEmailHtml
    );

    // Send email notification to admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@telogica.com';
    await sendEmail(
      adminEmail,
      'New Warranty Registration - Telogica',
      `New warranty registration from ${req.user.name} for ${productName} (Serial: ${serialNumber})`,
      'warranty_submitted',
      { entityType: 'warranty', entityId: warranty._id }
    );

    res.status(201).json({
      message: 'Warranty registered successfully',
      warranty
    });
  } catch (error) {
    console.error('Error registering warranty:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user's warranties
exports.getUserWarranties = async (req, res) => {
  try {
    const warranties = await Warranty.find({ user: req.user._id })
      .populate('product')
      .populate('productUnit')
      .sort({ createdAt: -1 });

    res.json(warranties);
  } catch (error) {
    console.error('Error fetching warranties:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all warranties (Admin)
exports.getAllWarranties = async (req, res) => {
  try {
    const { status, userId } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (userId) filter.user = userId;

    const warranties = await Warranty.find(filter)
      .populate('user', 'name email phone')
      .populate('product')
      .populate('productUnit')
      .populate('retailer', 'name email')
      .sort({ createdAt: -1 });

    res.json(warranties);
  } catch (error) {
    console.error('Error fetching warranties:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Approve warranty (Admin)
exports.approveWarranty = async (req, res) => {
  try {
    const { id } = req.params;
    const { warrantyStartDate, warrantyEndDate, adminNotes } = req.body;

    const warranty = await Warranty.findById(id).populate('user product');
    if (!warranty) {
      return res.status(404).json({ message: 'Warranty not found' });
    }

    // Calculate warranty dates if not provided
    let startDate = warrantyStartDate ? new Date(warrantyStartDate) : null;
    let endDate = warrantyEndDate ? new Date(warrantyEndDate) : null;

    // If start date not provided, default to purchase date + 3 days
    if (!startDate) {
      startDate = new Date(warranty.purchaseDate);
      startDate.setDate(startDate.getDate() + 3);
    }

    // If end date not provided, calculate from start date + warranty period
    if (!endDate) {
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + (warranty.warrantyPeriodMonths || 12));
    }

    warranty.status = 'approved';
    warranty.warrantyStartDate = startDate;
    warranty.warrantyEndDate = endDate;
    warranty.adminNotes = adminNotes;

    // Generate Warranty Certificate PDF
    try {
      const pdfUrl = await generateAndUploadWarranty(warranty, warranty.user);
      warranty.warrantyCertificateUrl = pdfUrl;
    } catch (pdfError) {
      console.error('Error generating warranty PDF during approval:', pdfError);
      // Continue even if PDF generation fails, but log it
    }

    await warranty.save();

    // Send approval email to user
    const certificateLink = warranty.warrantyCertificateUrl 
      ? `\n\nYou can download your warranty certificate here: ${warranty.warrantyCertificateUrl}` 
      : '';

    await sendEmail(
      warranty.user.email,
      'Warranty Approved',
      `Your warranty for ${warranty.productName} (Serial: ${warranty.serialNumber}) has been approved. Warranty valid until ${warranty.warrantyEndDate.toLocaleDateString()}.${certificateLink}`,
      'warranty_approved',
      { entityType: 'warranty', entityId: warranty._id }
    );

    res.json({
      message: 'Warranty approved successfully',
      warranty
    });
  } catch (error) {
    console.error('Error approving warranty:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reject warranty (Admin)
exports.rejectWarranty = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason, adminNotes } = req.body;

    const warranty = await Warranty.findById(id).populate('user product');
    if (!warranty) {
      return res.status(404).json({ message: 'Warranty not found' });
    }

    warranty.status = 'rejected';
    warranty.rejectionReason = rejectionReason;
    warranty.adminNotes = adminNotes;

    await warranty.save();

    // Send rejection email to user
    await sendEmail(
      warranty.user.email,
      'Warranty Registration Rejected',
      `Your warranty registration for ${warranty.productName} (Serial: ${warranty.serialNumber}) has been rejected. Reason: ${rejectionReason}`,
      'warranty_rejected',
      { entityType: 'warranty', entityId: warranty._id }
    );

    res.json({
      message: 'Warranty rejected',
      warranty
    });
  } catch (error) {
    console.error('Error rejecting warranty:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update warranty details (Admin)
exports.updateWarranty = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const warranty = await Warranty.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('user product productUnit');

    if (!warranty) {
      return res.status(404).json({ message: 'Warranty not found' });
    }

    res.json({
      message: 'Warranty updated successfully',
      warranty
    });
  } catch (error) {
    console.error('Error updating warranty:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Check serial number validity
exports.checkSerialNumber = async (req, res) => {
  try {
    const { serialNumber, productId } = req.query;

    const productUnit = await ProductUnit.findOne({ 
      serialNumber,
      product: productId 
    }).populate('product');

    if (!productUnit) {
      return res.status(404).json({ 
        valid: false,
        message: 'Serial number not found' 
      });
    }

    // Check if already registered
    const existingWarranty = await Warranty.findOne({ serialNumber });

    res.json({
      valid: true,
      productUnit,
      alreadyRegistered: !!existingWarranty,
      warranty: existingWarranty || null
    });
  } catch (error) {
    console.error('Error checking serial number:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Validate warranty for a product (Admin)
exports.validateWarranty = async (req, res) => {
  try {
    const { serialNumber, productId } = req.query;

    if (!serialNumber) {
      return res.status(400).json({ message: 'Serial number is required' });
    }

    // Find the product unit
    const productUnit = await ProductUnit.findOne({ 
      serialNumber,
      ...(productId && { product: productId })
    }).populate('product');

    if (!productUnit) {
      return res.status(404).json({ 
        isValid: false,
        status: 'not_found',
        message: 'Product with this serial number not found in our system'
      });
    }

    // Find warranty registration
    const warranty = await Warranty.findOne({ serialNumber })
      .populate('user product productUnit');

    if (!warranty) {
      return res.json({
        isValid: false,
        status: 'not_registered',
        message: 'No warranty registered for this product',
        productInfo: {
          name: productUnit.product?.name,
          serialNumber: productUnit.serialNumber,
          modelNumber: productUnit.modelNumber,
          manufacturingDate: productUnit.manufacturingDate
        }
      });
    }

    // Check if warranty is approved
    if (warranty.status !== 'approved') {
      return res.json({
        isValid: false,
        status: warranty.status,
        message: `Warranty is ${warranty.status}`,
        warranty: {
          id: warranty._id,
          productName: warranty.productName,
          serialNumber: warranty.serialNumber,
          modelNumber: warranty.modelNumber,
          purchaseDate: warranty.purchaseDate,
          status: warranty.status,
          registeredDate: warranty.createdAt,
          ...(warranty.status === 'rejected' && { rejectionReason: warranty.rejectionReason })
        }
      });
    }

    // Check if warranty has expired
    const today = new Date();
    const isExpired = warranty.warrantyEndDate && new Date(warranty.warrantyEndDate) < today;
    const isActive = warranty.warrantyStartDate && warranty.warrantyEndDate && 
                     new Date(warranty.warrantyStartDate) <= today && 
                     new Date(warranty.warrantyEndDate) >= today;

    const daysRemaining = warranty.warrantyEndDate 
      ? Math.ceil((new Date(warranty.warrantyEndDate) - today) / (1000 * 60 * 60 * 24))
      : 0;

    return res.json({
      isValid: isActive,
      status: isExpired ? 'expired' : isActive ? 'active' : 'pending_start',
      message: isExpired 
        ? 'Warranty has expired' 
        : isActive 
          ? `Warranty is active (${daysRemaining} days remaining)`
          : 'Warranty will start from the approved date',
      warranty: {
        id: warranty._id,
        productName: warranty.productName,
        serialNumber: warranty.serialNumber,
        modelNumber: warranty.modelNumber,
        purchaseDate: warranty.purchaseDate,
        purchaseType: warranty.purchaseType,
        warrantyStartDate: warranty.warrantyStartDate,
        warrantyEndDate: warranty.warrantyEndDate,
        warrantyPeriodMonths: warranty.warrantyPeriodMonths,
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        status: warranty.status,
        registeredDate: warranty.createdAt,
        approvedDate: warranty.updatedAt,
        certificateUrl: warranty.warrantyCertificateUrl,
        customerName: warranty.user?.name,
        customerEmail: warranty.user?.email
      },
      productInfo: {
        name: productUnit.product?.name,
        category: productUnit.product?.category,
        manufacturingDate: productUnit.manufacturingDate
      }
    });
  } catch (error) {
    console.error('Error validating warranty:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = exports;
