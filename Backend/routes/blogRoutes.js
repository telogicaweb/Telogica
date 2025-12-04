const express = require('express');
const router = express.Router();
const { 
  getBlogPosts, 
  getBlogPostById, 
  createBlogPost, 
  updateBlogPost, 
  deleteBlogPost 
} = require('../controllers/blogController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(getBlogPosts)
  .post(protect, admin, createBlogPost);

router.route('/:id')
  .get(getBlogPostById)
  .put(protect, admin, updateBlogPost)
  .delete(protect, admin, deleteBlogPost);

module.exports = router;
