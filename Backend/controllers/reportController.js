const Report = require('../models/Report');

// @desc    Get all reports
// @route   GET /api/reports
// @access  Public
const getReports = async (req, res) => {
  try {
    const { reportType } = req.query;
    const filter = { isActive: true };
    if (reportType) filter.reportType = reportType;
    
    const reports = await Report.find(filter).sort({ reportDate: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create report
// @route   POST /api/reports
// @access  Private/Admin
const createReport = async (req, res) => {
  try {
    const report = new Report(req.body);
    const createdReport = await report.save();
    res.status(201).json(createdReport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update report
// @route   PUT /api/reports/:id
// @access  Private/Admin
const updateReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (report) {
      Object.assign(report, req.body);
      const updatedReport = await report.save();
      res.json(updatedReport);
    } else {
      res.status(404).json({ message: 'Report not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private/Admin
const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (report) {
      await report.deleteOne();
      res.json({ message: 'Report removed' });
    } else {
      res.status(404).json({ message: 'Report not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getReports, createReport, updateReport, deleteReport };
