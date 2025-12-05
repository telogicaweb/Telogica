const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct, uploadProductImage, updateRecommendations } = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.route('/')
  .get(getProducts)
  .post(protect, admin, createProduct);

router.route('/upload').post(protect, admin, upload.single('image'), uploadProductImage);

router.route('/:id')
  .get(getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

router.route('/:id/recommendations')
  .put(protect, admin, updateRecommendations);

module.exports = router;
