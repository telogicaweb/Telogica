const express = require('express');
const router = express.Router();
const { submitContact, getContacts, updateContactStatus, deleteContact, replyToContact } = require('../controllers/contactController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .post(submitContact)
  .get(protect, admin, getContacts);

router.route('/:id')
  .put(protect, admin, updateContactStatus)
  .delete(protect, admin, deleteContact);

router.post('/:id/reply', protect, admin, replyToContact);

module.exports = router;
