const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, getUsers, approveRetailer, adminCreateUser, updateUser, deleteUser } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.get('/users', protect, admin, getUsers);
router.post('/users', protect, admin, adminCreateUser);
router.put('/users/:id', protect, admin, updateUser);
router.delete('/users/:id', protect, admin, deleteUser);
router.put('/approve/:id', protect, admin, approveRetailer);

module.exports = router;
