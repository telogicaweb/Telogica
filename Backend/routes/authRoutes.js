const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, getUsers, approveRetailer } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.get('/users', protect, admin, getUsers);
router.put('/approve/:id', protect, admin, approveRetailer);

module.exports = router;
