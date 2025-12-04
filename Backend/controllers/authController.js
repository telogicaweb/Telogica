const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/mailer');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, role, phone, address } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      address
    });

    if (user) {
      // Notify admin of new registration
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@telogica.com';
      await sendEmail(
        adminEmail,
        'New User Registration',
        `New user registered: ${name} (${email}) - Role: ${role || 'user'}`,
        'user_registration',
        { entityType: 'user', entityId: user._id }
      );

      // Notify admin if retailer registers
      if (role === 'retailer') {
        await sendEmail(
          adminEmail,
          'New Retailer Registration - Approval Required',
          `Retailer ${name} (${email}) has registered and needs approval before they can login.`,
          'user_registration',
          { entityType: 'user', entityId: user._id }
        );
      }

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      if (!user.isApproved) {
        return res.status(403).json({ message: 'Account not approved yet' });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Approve retailer
// @route   PUT /api/auth/approve/:id
// @access  Private/Admin
const approveRetailer = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.isApproved = true;
      const updatedUser = await user.save();
      
      await sendEmail(
        user.email,
        'Retailer Account Approved - Telogica',
        `Dear ${user.name},\n\nYour retailer account has been approved! You can now login to your account and start placing orders.\n\nThank you for partnering with Telogica.`,
        'retailer_approval',
        { entityType: 'user', entityId: user._id }
      );

      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, getUserProfile, getUsers, approveRetailer };
