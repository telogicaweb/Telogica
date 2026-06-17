const Client = require('../models/Client');
const cloudinary = require('../utils/cloudinary');
const streamifier = require('streamifier');

// @desc    Get all active clients (public)
// @route   GET /api/clients
// @access  Public
const getClients = async (req, res) => {
  try {
    const clients = await Client.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all clients (admin)
// @route   GET /api/clients/admin
// @access  Private/Admin
const getAdminClients = async (req, res) => {
  try {
    const clients = await Client.find().sort({ displayOrder: 1, createdAt: 1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a client
// @route   POST /api/clients
// @access  Private/Admin
const createClient = async (req, res) => {
  const { name, logo, displayOrder, isActive } = req.body;
  try {
    const client = new Client({ name, logo, displayOrder, isActive });
    const createdClient = await client.save();
    res.status(201).json(createdClient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a client
// @route   PUT /api/clients/:id
// @access  Private/Admin
const updateClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (client) {
      Object.assign(client, req.body);
      const updatedClient = await client.save();
      res.json(updatedClient);
    } else {
      res.status(404).json({ message: 'Client not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a client
// @route   DELETE /api/clients/:id
// @access  Private/Admin
const deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (client) {
      // Option: delete from Cloudinary if needed
      await client.deleteOne();
      res.json({ message: 'Client removed' });
    } else {
      res.status(404).json({ message: 'Client not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload client logo to Cloudinary
// @route   POST /api/clients/upload
// @access  Private/Admin
const uploadClientLogo = async (req, res) => {
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ message: 'No image file provided' });
  }

  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'clients',
          resource_type: 'image',
        },
        (error, response) => {
          if (error) return reject(error);
          resolve(response);
        }
      );
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    res.status(201).json({ url: result.secure_url, public_id: result.public_id });
  } catch (error) {
    console.error('Cloudinary client logo upload failed:', error);
    res.status(500).json({ message: 'Failed to upload client logo' });
  }
};

module.exports = {
  getClients,
  getAdminClients,
  createClient,
  updateClient,
  deleteClient,
  uploadClientLogo
};
