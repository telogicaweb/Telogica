const Contact = require('../models/Contact');
const { sendEmail } = require('../utils/mailer');
const { getContactAcknowledgmentEmail, getContactNotificationEmail } = require('../utils/emailTemplates');

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
    const adminNotificationHtml = getContactNotificationEmail(name, email, message);
    
    await sendEmail(
      adminEmail,
      `New Contact Form: ${subject} - Telogica`,
      `New message from ${name} (${email}): ${message}`,
      'general',
      { entityType: 'contact', entityId: contact._id },
      adminNotificationHtml
    );

    // Send acknowledgement to user
    const acknowledgmentHtml = getContactAcknowledgmentEmail(name);
    
    await sendEmail(
      email,
      'Thank You for Contacting Telogica',
      `Dear ${name}, Thank you for contacting us. We have received your message and will get back to you shortly.`,
      'general',
      { entityType: 'contact', entityId: contact._id },
      acknowledgmentHtml
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

const replyToContact = async (req, res) => {
  try {
    const { replySubject, replyMessage } = req.body;
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ message: 'Contact submission not found' });
    }

    if (!replyMessage) {
      return res.status(400).json({ message: 'Reply message is required' });
    }

    const subject = replySubject || `Re: ${contact.subject}`;
    await sendEmail(
      contact.email,
      subject,
      replyMessage,
      'general',
      { entityType: 'contact', entityId: contact._id }
    );

    contact.status = 'replied';
    contact.repliedAt = new Date();
    await contact.save();

    res.json({ message: 'Reply sent successfully', contact });
  } catch (error) {
    console.error('Failed to reply to contact:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { submitContact, getContacts, updateContactStatus, deleteContact, replyToContact };
