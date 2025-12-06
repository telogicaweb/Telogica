const Warranty = require('../models/Warranty');
const ProductUnit = require('../models/ProductUnit');
const User = require('../models/User');
const Product = require('../models/Product');
const { sendEmail } = require('../utils/mailer');
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
    await sendEmail(
      req.user.email,
      'Warranty Registration Submitted',
      `Your warranty registration for ${productName} (Serial: ${serialNumber}) has been submitted successfully. We will review it shortly.`,
      'warranty_submitted',
      { entityType: 'warranty', entityId: warranty._id }
    );

    // Send email notification to admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@telogica.com';
    await sendEmail(
      adminEmail,
      'New Warranty Registration',
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
    const { status } = req.query;
    const filter = status ? { status } : {};

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

module.exports = exports;
