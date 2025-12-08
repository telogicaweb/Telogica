const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../utils/mailer');
const { logAdminAction } = require('../utils/logger');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Email template helpers
const getWelcomeEmail = (name) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">Welcome to Telogica!</h1>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Dear <strong>${name}</strong>,</p>
                  <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">Thank you for joining Telogica! We're thrilled to have you as part of our growing community.</p>
                  <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 25px;">Your account is now active and ready to use. Here's what you can do:</p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 25px;">
                    <tr>
                      <td style="padding: 15px; background-color: #f9fafb; border-left: 4px solid #4F46E5; margin-bottom: 10px;">
                        <p style="margin: 0; color: #1f2937; font-size: 14px;">🛍️ <strong>Browse Products</strong> - Explore our wide range of telecommunications equipment</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 15px; background-color: #f9fafb; border-left: 4px solid #4F46E5; margin-bottom: 10px;">
                        <p style="margin: 0; color: #1f2937; font-size: 14px;">🛒 <strong>Place Orders</strong> - Order products with secure payment options</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 15px; background-color: #f9fafb; border-left: 4px solid #4F46E5;">
                        <p style="margin: 0; color: #1f2937; font-size: 14px;">📋 <strong>Track Orders</strong> - Monitor your orders in real-time</p>
                      </td>
                    </tr>
                  </table>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display: inline-block; background-color: #4F46E5; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Get Started</a>
                  </div>
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 25px 0 0;">If you have any questions, feel free to reach out to our support team.</p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px;">Best regards,<br/><strong>The Telogica Team</strong></p>
                  <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0;">© ${new Date().getFullYear()} Telogica. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

const getRetailerWelcomeEmail = (name) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">Welcome to Telogica</h1>
                  <p style="color: #e0e7ff; margin: 10px 0 0; font-size: 18px; font-weight: 500;">Partner Network</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Dear <strong>${name}</strong>,</p>
                  <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">Thank you for applying to join our Retailer Partner Network! We're excited about the possibility of working together.</p>
                  
                  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 4px;">
                    <p style="color: #92400e; font-size: 15px; font-weight: 600; margin: 0 0 8px;">⏳ Application Under Review</p>
                    <p style="color: #78350f; font-size: 14px; line-height: 1.5; margin: 0;">Your retailer account is currently pending approval. Our team will review your application and get back to you within 24-48 hours.</p>
                  </div>

                  <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 25px 0 15px;">Once approved, you'll unlock exclusive benefits:</p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 25px;">
                    <tr>
                      <td style="padding: 12px 15px; background-color: #f0fdf4; border-left: 4px solid #10b981;">
                        <p style="margin: 0; color: #1f2937; font-size: 14px;">💰 <strong>Wholesale Pricing</strong> - Special rates for bulk purchases</p>
                      </td>
                    </tr>
                    <tr><td style="height: 8px;"></td></tr>
                    <tr>
                      <td style="padding: 12px 15px; background-color: #f0fdf4; border-left: 4px solid #10b981;">
                        <p style="margin: 0; color: #1f2937; font-size: 14px;">📦 <strong>Bulk Order Capabilities</strong> - Order large quantities with ease</p>
                      </td>
                    </tr>
                    <tr><td style="height: 8px;"></td></tr>
                    <tr>
                      <td style="padding: 12px 15px; background-color: #f0fdf4; border-left: 4px solid #10b981;">
                        <p style="margin: 0; color: #1f2937; font-size: 14px;">📊 <strong>Inventory Management</strong> - Track and manage your stock</p>
                      </td>
                    </tr>
                    <tr><td style="height: 8px;"></td></tr>
                    <tr>
                      <td style="padding: 12px 15px; background-color: #f0fdf4; border-left: 4px solid #10b981;">
                        <p style="margin: 0; color: #1f2937; font-size: 14px;">🎯 <strong>Dedicated Dashboard</strong> - Comprehensive business analytics</p>
                      </td>
                    </tr>
                  </table>
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 25px 0 0;">We'll notify you as soon as your account is approved. In the meantime, if you have any questions, please don't hesitate to contact us.</p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px;">Best regards,<br/><strong>The Telogica Partnership Team</strong></p>
                  <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0;">© ${new Date().getFullYear()} Telogica. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
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
      // Send welcome email to user
      try {
        const welcomeEmailHtml = role === 'retailer' 
          ? getRetailerWelcomeEmail(name)
          : getWelcomeEmail(name);
        
        await sendEmail(
          email,
          role === 'retailer' ? 'Welcome to Telogica Partner Network!' : 'Welcome to Telogica!',
          `Welcome ${name}! Thank you for registering with Telogica.`,
          'user_registration',
          { entityType: 'user', entityId: user._id },
          welcomeEmailHtml
        );
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError.message);
      }

      // Notify admin of new registration
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@telogica.com';
      try {
        await sendEmail(
          adminEmail,
          role === 'retailer' ? 'New Retailer Registration - Approval Required' : 'New User Registration',
          `New ${role || 'user'} registered: ${name} (${email})${role === 'retailer' ? ' - Needs approval before login.' : ''}`,
          'user_registration',
          { entityType: 'user', entityId: user._id }
        );
      } catch (emailError) {
        console.error('Failed to send admin notification email:', emailError.message);
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
    const users = await User.find({}).lean();
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

    // Log admin action for user creation
    await logAdminAction(req, 'CREATE', 'User', user._id, {
      userName: user.name,
      userEmail: user.email,
      userRole: user.role
    });

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

    const previousData = {
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved
    };

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (typeof isApproved === 'boolean') user.isApproved = isApproved;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    const updatedUser = await user.save();

    // Log admin action for user update
    await logAdminAction(req, 'UPDATE', 'User', updatedUser._id, {
      userName: updatedUser.name,
      userEmail: updatedUser.email,
      previousData,
      changes: req.body
    });

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

    // Log admin action for user deletion
    await logAdminAction(req, 'DELETE', 'User', user._id, {
      userName: user.name,
      userEmail: user.email,
      userRole: user.role
    });

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

      // Log admin action for retailer approval
      await logAdminAction(req, 'APPROVE', 'User', updatedUser._id, {
        userName: updatedUser.name,
        userEmail: updatedUser.email,
        userRole: updatedUser.role
      });

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

// @desc    Forgot password - send reset token
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No account found with that email address' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save hashed token and expiry to user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    // Send email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🔐 Password Reset Request</h1>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Hello <strong>${user.name}</strong>,</p>
                    <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 25px;">We received a request to reset the password for your Telogica account. Click the button below to create a new password:</p>
                    
                    <div style="text-align: center; margin: 35px 0;">
                      <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3);">Reset My Password</a>
                    </div>

                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 25px 0 15px;">Or copy and paste this link into your browser:</p>
                    <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb; word-break: break-all;">
                      <p style="color: #4F46E5; font-size: 13px; margin: 0; font-family: monospace;">${resetUrl}</p>
                    </div>

                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 4px;">
                      <p style="color: #92400e; font-size: 14px; font-weight: 600; margin: 0 0 8px;">⏰ Important Information</p>
                      <p style="color: #78350f; font-size: 13px; line-height: 1.5; margin: 0;">This password reset link will expire in <strong>1 hour</strong> for security reasons. If you need a new link, please submit another password reset request.</p>
                    </div>

                    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px;">
                      <p style="color: #065f46; font-size: 14px; font-weight: 600; margin: 0 0 8px;">🛡️ Security Notice</p>
                      <p style="color: #047857; font-size: 13px; line-height: 1.5; margin: 0;">If you didn't request this password reset, please ignore this email. Your password will remain unchanged and your account is secure.</p>
                    </div>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px;">Best regards,<br/><strong>The Telogica Security Team</strong></p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0;">© ${new Date().getFullYear()} Telogica. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await sendEmail(
      user.email,
      'Password Reset Request - Telogica',
      `Reset your password: ${resetUrl}`,
      'password_reset',
      { entityType: 'user', entityId: user._id },
      emailHtml
    );

    res.json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to send reset email' });
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  const { password } = req.body;
  const resetToken = req.params.token;

  try {
    // Hash the token from URL to compare with stored hashed token
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Find user with valid token and not expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Send confirmation email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">✅ Password Reset Successful</h1>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Hello <strong>${user.name}</strong>,</p>
                    <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 25px;">Your password has been successfully reset. You can now sign in to your Telogica account using your new password.</p>
                    
                    <div style="background-color: #f0fdf4; border: 2px solid #10B981; padding: 25px; margin: 30px 0; border-radius: 8px; text-align: center;">
                      <p style="color: #065f46; font-size: 18px; font-weight: 600; margin: 0 0 10px;">🎉 All Set!</p>
                      <p style="color: #047857; font-size: 14px; margin: 0;">Your account is secure and ready to use</p>
                    </div>

                    <div style="text-align: center; margin: 35px 0;">
                      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3);">Sign In Now</a>
                    </div>

                    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 30px 0; border-radius: 4px;">
                      <p style="color: #991b1b; font-size: 14px; font-weight: 600; margin: 0 0 8px;">⚠️ Didn't Make This Change?</p>
                      <p style="color: #b91c1c; font-size: 13px; line-height: 1.5; margin: 0 0 12px;">If you didn't reset your password, your account may be compromised. Please contact our support team immediately.</p>
                      <a href="mailto:support@telogica.com" style="color: #ef4444; font-size: 13px; font-weight: 600; text-decoration: underline;">Contact Support →</a>
                    </div>

                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 25px 0 0;">For your security, we recommend:</p>
                    <ul style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 10px 0; padding-left: 20px;">
                      <li style="margin: 8px 0;">Using a strong, unique password</li>
                      <li style="margin: 8px 0;">Enabling two-factor authentication if available</li>
                      <li style="margin: 8px 0;">Never sharing your password with anyone</li>
                    </ul>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px;">Best regards,<br/><strong>The Telogica Security Team</strong></p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0;">© ${new Date().getFullYear()} Telogica. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await sendEmail(
      user.email,
      'Password Reset Successful - Telogica',
      'Your password has been successfully reset.',
      'password_reset_success',
      { entityType: 'user', entityId: user._id },
      emailHtml
    );

    res.json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
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
  forgotPassword,
  resetPassword,
};
