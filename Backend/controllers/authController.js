const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/mailer');
const { logAdminAction } = require('../utils/logger');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, role, phone, address } = req.body;

  try {
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

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
      try {
        await sendEmail(
          adminEmail,
          'New User Registration',
          `New user registered: ${name} (${email}) - Role: ${role || 'user'}`,
          'user_registration',
          { entityType: 'user', entityId: user._id }
        );
      } catch (emailError) {
        console.error('Failed to send admin notification email:', emailError.message);
        // Don't fail registration if email fails
      }

      // Notify admin if retailer registers
      if (role === 'retailer') {
        try {
          await sendEmail(
            adminEmail,
            'New Retailer Registration - Approval Required',
            `Retailer ${name} (${email}) has registered and needs approval before they can login.`,
            'user_registration',
            { entityType: 'user', entityId: user._id }
          );
        } catch (emailError) {
          console.error('Failed to send retailer notification email:', emailError.message);
          // Don't fail registration if email fails
        }
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
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message || 'Registration failed' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      if (!user.isApproved) {
        return res.status(403).json({ message: 'Account not approved yet. Please wait for admin approval.' });
      }

      // Log admin login
      if (user.role === 'admin') {
        req.user = user; // Set user for logger
        await logAdminAction(req, 'LOGIN', 'Auth', user._id, { email: user.email });
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
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Login failed' });
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

const adminCreateUser = async (req, res) => {
  const { name, email, password, role = 'user', phone, address, isApproved } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: 'A user with this email already exists' });
  }

  try {
    const user = new User({
      name,
      email,
      password,
      role,
      phone,
      address,
      isApproved: typeof isApproved === 'boolean' ? isApproved : role !== 'retailer',
    });
    await user.save();

    res.status(201).json(user);
  } catch (error) {
    console.error('Admin create user error:', error);
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  const { name, email, role, phone, address, isApproved } = req.body;

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email && email !== user.email) {
      const emailTaken = await User.findOne({ email });
      if (emailTaken) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (typeof isApproved === 'boolean') user.isApproved = isApproved;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  getUsers,
  approveRetailer,
  adminCreateUser,
  updateUser,
  deleteUser,
};
