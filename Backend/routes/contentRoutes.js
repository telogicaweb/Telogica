const express = require('express');
const router = express.Router();
const { 
  getAllContent, 
  getContentBySection, 
  createContent, 
  updateContent, 
  deleteContent 
} = require('../controllers/contentController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(getAllContent)
  .post(protect, admin, createContent);

router.route('/:id')
  .put(protect, admin, updateContent)
  .delete(protect, admin, deleteContent);

router.get('/section/:section', getContentBySection);

module.exports = router;
