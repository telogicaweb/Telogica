const BlogPost = require('../models/BlogPost');

// @desc    Get all blog posts
// @route   GET /api/blog
// @access  Public
const getBlogPosts = async (req, res) => {
  try {
    const { category, featured } = req.query;
    const filter = { isPublished: true };
    if (category) filter.category = category;
    if (featured === 'true') filter.isFeatured = true;
    
    const posts = await BlogPost.find(filter).sort({ publishDate: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single blog post
// @route   GET /api/blog/:id
// @access  Public
const getBlogPostById = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (post) {
      res.json(post);
    } else {
      res.status(404).json({ message: 'Blog post not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create blog post
// @route   POST /api/blog
// @access  Private/Admin
const createBlogPost = async (req, res) => {
  try {
    const post = new BlogPost(req.body);
    const createdPost = await post.save();
    res.status(201).json(createdPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update blog post
// @route   PUT /api/blog/:id
// @access  Private/Admin
const updateBlogPost = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (post) {
      Object.assign(post, req.body);
      const updatedPost = await post.save();
      res.json(updatedPost);
    } else {
      res.status(404).json({ message: 'Blog post not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete blog post
// @route   DELETE /api/blog/:id
// @access  Private/Admin
const deleteBlogPost = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (post) {
      await post.deleteOne();
      res.json({ message: 'Blog post removed' });
    } else {
      res.status(404).json({ message: 'Blog post not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  getBlogPosts, 
  getBlogPostById, 
  createBlogPost, 
  updateBlogPost, 
  deleteBlogPost 
};
