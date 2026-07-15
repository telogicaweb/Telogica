const mongoose = require('mongoose');
const Product = require('../models/Product');
const streamifier = require('streamifier');
const cloudinary = require('../utils/cloudinary');
const { logAdminAction } = require('../utils/logger');

const { Types } = mongoose;

const normalizeRecommendationIds = async (ids, currentProductId = null) => {
  if (!Array.isArray(ids)) {
    return [];
  }

  const rawIds = ids
    .map(id => {
      if (!id) return null;
      if (typeof id === 'object') {
        if (id._id) return id._id;
        if (id.id) return id.id;
      }
      return id;
    })
    .filter(Boolean)
    .map(id => id.toString());

  const uniqueIds = [...new Set(rawIds)].filter(id => Types.ObjectId.isValid(id));

  const filteredIds = currentProductId
    ? uniqueIds.filter(id => id !== currentProductId.toString())
    : uniqueIds;

  if (!filteredIds.length) {
    return [];
  }

  const existingIds = await Product.find({ _id: { $in: filteredIds } }).distinct('_id');
  const existingSet = new Set(existingIds.map(id => id.toString()));

  return filteredIds.filter(id => existingSet.has(id));
};

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query?.page);
    const hasPagination = !isNaN(page) && page > 0;
    const limit = parseInt(req.query?.limit) || 0;
    const { category, search } = req.query || {};

    const filter = {};

    if (category && category !== 'all') {
      filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    let totalProducts = 0;
    if (hasPagination) {
      totalProducts = await Product.countDocuments(filter);
    }

    const pageLimit = limit || 12;
    const skip = hasPagination ? (page - 1) * pageLimit : 0;

    // Use aggregation to strip large binary fields at the database level.
    // Some products store raw base64 images or PDF brochures directly in MongoDB,
    // making individual documents 2-10 MB — causing Atlas cursor batching to hang.
    const sortStage = search && search.trim()
      ? { $sort: { score: { $meta: 'textScore' } } }
      : { $sort: { createdAt: -1 } };

    const pipeline = [
      { $match: filter },
      sortStage,
      // Keep brochureUrl only if it is a real URL (does not start with 'data:')
      {
        $addFields: {
          brochureUrl: {
            $cond: {
              if: { $regexMatch: { input: { $ifNull: ['$brochureUrl', ''] }, regex: '^data:' } },
              then: null,
              else: '$brochureUrl'
            }
          }
        }
      },
      // Strip base64-encoded image blobs from the images array; keep only URLs
      {
        $addFields: {
          images: {
            $filter: {
              input: { $ifNull: ['$images', []] },
              cond: { $not: { $regexMatch: { input: '$$this', regex: '^data:' } } },
            },
          },
        },
      },
    ];

    if (search && search.trim()) {
      pipeline[0] = { $match: { ...filter, $text: { $search: search.trim() } } };
    }

    if (hasPagination) {
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: pageLimit });
    } else if (limit > 0) {
      pipeline.push({ $limit: limit });
    }

    const products = await Product.aggregate(pipeline);

    if (hasPagination) {
      const totalPages = Math.ceil(totalProducts / pageLimit);
      res.json({
        products,
        totalProducts,
        page,
        totalPages,
        hasMore: page < totalPages
      });
    } else {
      res.json(products);
    }
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('recommendedProductIds', 'name category images price retailerPrice requiresQuote isRecommended stock');

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
    subcategory,
    stock,
    offlineStock,
    isRecommended,
    specifications,
    warrantyPeriodMonths,
    requiresQuote,
    modelNumberPrefix,
    features,
    applications,
    technicalSpecs,
    recommendedProductIds,
    brochureUrl
  } = req.body;

  try {
    const sanitizedRecommendations = await normalizeRecommendationIds(recommendedProductIds);

    const product = new Product({
      name,
      description,
      images: [], // populated below
      price,
      retailerPrice,
      category,
      subcategory: subcategory ? subcategory.trim() : undefined,
      stock: stock || 0,
      offlineStock: offlineStock || 0,
      isRecommended,
      specifications,
      warrantyPeriodMonths: warrantyPeriodMonths || 12,
      requiresQuote: requiresQuote || !price, // Auto-set if price missing
      modelNumberPrefix,
      features,
      applications,
      technicalSpecs,
      recommendedProductIds: sanitizedRecommendations
    });

    // Handle base64 images upload to Cloudinary
    const uploadedImages = [];
    if (Array.isArray(images)) {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (img && img.startsWith('data:')) {
          try {
            const result = await cloudinary.uploader.upload(img, {
              folder: 'products',
              resource_type: 'image',
              public_id: `product_${product._id}_${i}_${Date.now()}`
            });
            uploadedImages.push(result.secure_url);
          } catch (uploadError) {
            console.error(`Failed to upload base64 image ${i} during create:`, uploadError);
            uploadedImages.push(img); // fallback to original
          }
        } else {
          uploadedImages.push(img);
        }
      }
    }
    product.images = uploadedImages;

    // Handle base64 brochure upload to Cloudinary
    if (brochureUrl && brochureUrl.startsWith('data:')) {
      try {
        const result = await cloudinary.uploader.upload(brochureUrl, {
          folder: 'product_brochures',
          resource_type: 'raw',
          format: 'pdf',
          public_id: `brochure_${product._id}_${Date.now()}`
        });
        product.brochureUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Failed to upload base64 brochure during create:', uploadError);
        product.brochureUrl = brochureUrl; // fallback
      }
    } else {
      product.brochureUrl = brochureUrl || undefined;
    }

    const createdProduct = await product.save();

    await logAdminAction(req, 'CREATE', 'Product', createdProduct._id, {
      name: createdProduct.name,
      category: createdProduct.category,
      price: createdProduct.price
    });

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
    subcategory,
    stock,
    offlineStock,
    isRecommended,
    specifications,
    warrantyPeriodMonths,
    requiresQuote,
    modelNumberPrefix,
    features,
    applications,
    technicalSpecs,
    recommendedProductIds,
    brochureUrl
  } = req.body;

  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      if (recommendedProductIds !== undefined) {
        const sanitizedRecommendations = await normalizeRecommendationIds(recommendedProductIds, product._id);
        product.recommendedProductIds = sanitizedRecommendations;
      }
      product.name = name || product.name;
      product.description = description || product.description;

      // Automatically handle base64 images upload during update
      if (images) {
        const uploadedImages = [];
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          if (img && img.startsWith('data:')) {
            try {
              const result = await cloudinary.uploader.upload(img, {
                folder: 'products',
                resource_type: 'image',
                public_id: `product_${product._id}_${i}_${Date.now()}`
              });
              uploadedImages.push(result.secure_url);
            } catch (uploadError) {
              console.error(`Failed to upload base64 image ${i} during update:`, uploadError);
              uploadedImages.push(img); // fallback
            }
          } else {
            uploadedImages.push(img);
          }
        }
        product.images = uploadedImages;
      } else {
        product.images = images || product.images;
      }

      product.price = price !== undefined ? price : product.price;
      product.retailerPrice = retailerPrice !== undefined ? retailerPrice : product.retailerPrice;
      product.category = category || product.category;
      if (subcategory !== undefined) {
        const trimmed = typeof subcategory === 'string' ? subcategory.trim() : '';
        product.subcategory = trimmed || undefined;
      }
      product.stock = stock !== undefined ? stock : product.stock;
      product.offlineStock = offlineStock !== undefined ? offlineStock : product.offlineStock;
      product.isRecommended = isRecommended !== undefined ? isRecommended : product.isRecommended;
      product.specifications = specifications || product.specifications;
      product.warrantyPeriodMonths = warrantyPeriodMonths || product.warrantyPeriodMonths;
      product.requiresQuote = requiresQuote !== undefined ? requiresQuote : (!product.price);
      product.modelNumberPrefix = modelNumberPrefix !== undefined ? modelNumberPrefix : product.modelNumberPrefix;
      product.features = features || product.features;
      product.applications = applications || product.applications;
      product.technicalSpecs = technicalSpecs || product.technicalSpecs;

      // Automatically handle base64 brochure upload during update
      if (brochureUrl !== undefined) {
        if (brochureUrl && brochureUrl.startsWith('data:')) {
          try {
            const result = await cloudinary.uploader.upload(brochureUrl, {
              folder: 'product_brochures',
              resource_type: 'raw',
              format: 'pdf',
              public_id: `brochure_${product._id}_${Date.now()}`
            });
            product.brochureUrl = result.secure_url;
          } catch (uploadError) {
            console.error('Failed to upload base64 brochure during update:', uploadError);
            product.brochureUrl = brochureUrl; // fallback
          }
        } else {
          product.brochureUrl = brochureUrl || undefined;
        }
      }

      const updatedProduct = await product.save();

      await logAdminAction(req, 'UPDATE', 'Product', updatedProduct._id, {
        name: updatedProduct.name,
        changes: req.body
      });

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
      const productData = {
        id: product._id,
        name: product.name,
        category: product.category
      };

      // Delete product first
      await product.deleteOne();

      // Log the deletion
      console.log('Logging product deletion:', {
        admin: req.user?.name,
        product: productData.name
      });

      await logAdminAction(req, 'DELETE', 'Product', productData.id, {
        name: productData.name,
        category: productData.category
      });

      console.log('Product deletion logged successfully');

      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error('Error in deleteProduct:', error);
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

    const sanitized = await normalizeRecommendationIds(recommendedProductIds, product._id);
    product.recommendedProductIds = sanitized;

    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadProductBrochure = async (req, res) => {
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ message: 'No PDF file provided' });
  }

  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'product_brochures',
          resource_type: 'raw',
          format: 'pdf',
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
    console.error('Cloudinary brochure upload failed', error);
    res.status(500).json({ message: 'Failed to upload brochure' });
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, uploadProductImage, uploadProductBrochure, updateRecommendations };
