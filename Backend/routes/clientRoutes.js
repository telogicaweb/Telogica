const express = require('express');
const router = express.Router();
const {
  getClients,
  getAdminClients,
  createClient,
  updateClient,
  deleteClient,
  uploadClientLogo
} = require('../controllers/clientController');
const { protect, admin } = require('../middleware/authMiddleware');
const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// Public routes
router.get('/', getClients);

// Admin routes
router.get('/admin', protect, admin, getAdminClients);
router.post('/upload', protect, admin, upload.single('logo'), uploadClientLogo);
router.post('/', protect, admin, createClient);
router.put('/:id', protect, admin, updateClient);
router.delete('/:id', protect, admin, deleteClient);

module.exports = router;
