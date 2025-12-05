const Product = require('../models/Product');
const streamifier = require('streamifier');
const cloudinary = require('../utils/cloudinary');

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  const { 
    name, 
    description, 
    images, 
    price, 
    retailerPrice,
    category, 
    stock, 
    offlineStock,
    isRecommended,
    specifications,
    warrantyPeriodMonths,
    requiresQuote
  } = req.body;

  try {
    const product = new Product({
      name,
      description,
      images,
      price,
      retailerPrice,
      category,
      stock: stock || 0,
      offlineStock: offlineStock || 0,
      isRecommended,
      specifications,
      warrantyPeriodMonths: warrantyPeriodMonths || 12,
      requiresQuote: requiresQuote || !price // Auto-set if price missing
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  const { 
    name, 
    description, 
    images, 
    price, 
    retailerPrice,
    category, 
    stock, 
    offlineStock,
    isRecommended,
    specifications,
    warrantyPeriodMonths,
    requiresQuote
  } = req.body;

  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name || product.name;
      product.description = description || product.description;
      product.images = images || product.images;
      product.price = price !== undefined ? price : product.price;
      product.retailerPrice = retailerPrice !== undefined ? retailerPrice : product.retailerPrice;
      product.category = category || product.category;
      product.stock = stock !== undefined ? stock : product.stock;
      product.offlineStock = offlineStock !== undefined ? offlineStock : product.offlineStock;
      product.isRecommended = isRecommended !== undefined ? isRecommended : product.isRecommended;
      product.specifications = specifications || product.specifications;
      product.warrantyPeriodMonths = warrantyPeriodMonths || product.warrantyPeriodMonths;
      product.requiresQuote = requiresQuote !== undefined ? requiresQuote : (!product.price);

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await product.deleteOne();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadProductImage = async (req, res) => {
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ message: 'No image file provided' });
  }

  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'products',
          resource_type: 'image',
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
    res.status(500).json({ message: 'Failed to upload image' });
  }
};

// @desc    Update recommended products for a product
// @route   PUT /api/products/:id/recommendations
// @access  Private/Admin
const updateRecommendations = async (req, res) => {
  const { recommendedProductIds } = req.body;
  if (!Array.isArray(recommendedProductIds)) {
    return res.status(400).json({ message: 'recommendedProductIds must be an array' });
  }

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Filter out self references and ensure ObjectId format
    const sanitized = recommendedProductIds
      .filter(id => String(id) !== String(req.params.id));
    product.recommendedProductIds = sanitized;

    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, uploadProductImage, updateRecommendations };
