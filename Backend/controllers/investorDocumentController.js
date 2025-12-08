const InvestorDocument = require('../models/InvestorDocument');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/fileUpload');

// @desc    Upload document file to Cloudinary
// @route   POST /api/investor-documents/upload
// @access  Private/Admin
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, 'investor-documents');

    // Get file size in MB
    const fileSizeInMB = (req.file.size / (1024 * 1024)).toFixed(2);
    
    // Determine file type from mimetype
    let fileType = 'PDF';
    if (req.file.mimetype.includes('excel') || req.file.mimetype.includes('spreadsheet')) {
      fileType = 'Excel';
    } else if (req.file.mimetype.includes('word') || req.file.mimetype.includes('document')) {
      fileType = 'Word';
    } else if (req.file.mimetype.includes('powerpoint') || req.file.mimetype.includes('presentation')) {
      fileType = 'PowerPoint';
    }

    res.status(200).json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      fileSize: `${fileSizeInMB} MB`,
      fileType: fileType,
      originalName: req.file.originalname,
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
};

// @desc    Get all investor documents (public)
// @route   GET /api/investor-documents
// @access  Public
const getInvestorDocuments = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };

    if (category && category !== 'all') {
      filter.category = category;
    }

    const documents = await InvestorDocument.find(filter)
      .sort({ category: 1, displayOrder: 1, publishDate: -1 })
      .lean();

    // Group documents by category
    const groupedDocuments = documents.reduce((acc, doc) => {
      if (!acc[doc.category]) {
        acc[doc.category] = [];
      }
      acc[doc.category].push(doc);
      return acc;
    }, {});

    res.json(groupedDocuments);
  } catch (error) {
    console.error('Error fetching investor documents:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all investor documents for admin (including inactive)
// @route   GET /api/investor-documents/admin
// @access  Private/Admin
const getAdminInvestorDocuments = async (req, res) => {
  try {
    const documents = await InvestorDocument.find()
      .sort({ category: 1, displayOrder: 1, publishDate: -1 })
      .lean();

    res.json(documents);
  } catch (error) {
    console.error('Error fetching admin investor documents:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get unique categories
// @route   GET /api/investor-documents/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await InvestorDocument.distinct('category', { isActive: true });
    res.json(categories.sort());
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create investor document
// @route   POST /api/investor-documents
// @access  Private/Admin
const createInvestorDocument = async (req, res) => {
  try {
    const document = await InvestorDocument.create(req.body);
    res.status(201).json(document);
  } catch (error) {
    console.error('Error creating investor document:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update investor document
// @route   PUT /api/investor-documents/:id
// @access  Private/Admin
const updateInvestorDocument = async (req, res) => {
  try {
    const document = await InvestorDocument.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    console.error('Error updating investor document:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete investor document
// @route   DELETE /api/investor-documents/:id
// @access  Private/Admin
const deleteInvestorDocument = async (req, res) => {
  try {
    const document = await InvestorDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Extract public_id from Cloudinary URL if it exists
    if (document.documentUrl && document.documentUrl.includes('cloudinary')) {
      try {
        const urlParts = document.documentUrl.split('/');
        const filename = urlParts[urlParts.length - 1];
        const publicId = `investor-documents/${filename.split('.')[0]}`;
        await deleteFromCloudinary(publicId);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
        // Continue with database deletion even if Cloudinary deletion fails
      }
    }

    await InvestorDocument.findByIdAndDelete(req.params.id);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting investor document:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadDocument,
  getInvestorDocuments,
  getAdminInvestorDocuments,
  getCategories,
  createInvestorDocument,
  updateInvestorDocument,
  deleteInvestorDocument,
};
