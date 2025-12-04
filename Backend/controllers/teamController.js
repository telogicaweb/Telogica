const TeamMember = require('../models/TeamMember');

// @desc    Get all team members
// @route   GET /api/team
// @access  Public
const getTeamMembers = async (req, res) => {
  try {
    const { department } = req.query;
    const filter = { isActive: true };
    if (department) filter.department = department;
    
    const members = await TeamMember.find(filter).sort({ order: 1 });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create team member
// @route   POST /api/team
// @access  Private/Admin
const createTeamMember = async (req, res) => {
  try {
    const member = new TeamMember(req.body);
    const createdMember = await member.save();
    res.status(201).json(createdMember);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update team member
// @route   PUT /api/team/:id
// @access  Private/Admin
const updateTeamMember = async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (member) {
      Object.assign(member, req.body);
      const updatedMember = await member.save();
      res.json(updatedMember);
    } else {
      res.status(404).json({ message: 'Team member not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete team member
// @route   DELETE /api/team/:id
// @access  Private/Admin
const deleteTeamMember = async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (member) {
      await member.deleteOne();
      res.json({ message: 'Team member removed' });
    } else {
      res.status(404).json({ message: 'Team member not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  getTeamMembers, 
  createTeamMember, 
  updateTeamMember, 
  deleteTeamMember 
};
