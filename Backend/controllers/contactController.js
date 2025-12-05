const Contact = require('../models/Contact');
const { sendEmail } = require('../utils/mailer');

// @desc    Submit a contact form
// @route   POST /api/contact
// @access  Public
const submitContact = async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  try {
    const contact = await Contact.create({
      name,
      email,
      phone,
      subject,
      message
    });

    // Send email notification to admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@telogica.com';
    await sendEmail(
      adminEmail,
      `New Contact Form Submission: ${subject}`,
      `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`,
      'general',
      { entityType: 'contact', entityId: contact._id }
    );

    // Send acknowledgement to user
    await sendEmail(
      email,
      'We received your message - Telogica',
      `Dear ${name},\n\nThank you for contacting us. We have received your message regarding "${subject}" and will get back to you shortly.\n\nBest regards,\nTelogica Team`,
      'general',
      { entityType: 'contact', entityId: contact._id }
    );

    res.status(201).json({ message: 'Message sent successfully', contact });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all contact submissions
// @route   GET /api/contact
// @access  Private/Admin
const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({}).sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update contact status
// @route   PUT /api/contact/:id
// @access  Private/Admin
const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const contact = await Contact.findById(req.params.id);

    if (contact) {
      contact.status = status;
      if (status === 'replied') {
        contact.repliedAt = new Date();
      }
      const updatedContact = await contact.save();
      res.json(updatedContact);
    } else {
      res.status(404).json({ message: 'Contact submission not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete contact submission
// @route   DELETE /api/contact/:id
// @access  Private/Admin
const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (contact) {
      await contact.deleteOne();
      res.json({ message: 'Contact submission removed' });
    } else {
      res.status(404).json({ message: 'Contact submission not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { submitContact, getContacts, updateContactStatus, deleteContact };
