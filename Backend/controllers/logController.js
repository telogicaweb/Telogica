const AdminLog = require('../models/AdminLog');
const { generateCSV, generateExcel, generatePDF } = require('../utils/exportUtils');

// @desc    Get admin logs with filtering and pagination
// @route   GET /api/logs
// @access  Private/Admin
const getLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      startDate, 
      endDate, 
      adminId, 
      action, 
      entity,
      search,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Date filtering
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Other filters
    if (adminId) query.adminId = adminId;
    if (action) query.action = action;
    if (entity) query.entity = entity;

    // Text search on admin name or details
    if (search) {
      query.$or = [
        { adminName: { $regex: search, $options: 'i' } },
        { adminEmail: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const logs = await AdminLog.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('adminId', 'name email')
      .exec();

    const count = await AdminLog.countDocuments(query);

    res.json({
      logs: logs,
      total: count,
      currentPage: Number(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get log statistics
// @route   GET /api/logs/stats
// @access  Private/Admin
const getLogStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};
    
    if (startDate || endDate) {
      match.timestamp = {};
      if (startDate) match.timestamp.$gte = new Date(startDate);
      if (endDate) match.timestamp.$lte = new Date(endDate);
    }

    const [
      totalLogs,
      byAction,
      byEntity
    ] = await Promise.all([
      AdminLog.countDocuments(match),
      AdminLog.aggregate([
        { $match: match },
        { $group: { _id: '$action', count: { $sum: 1 } } }
      ]),
      AdminLog.aggregate([
        { $match: match },
        { $group: { _id: '$entity', count: { $sum: 1 } } }
      ])
    ]);

    // Format action and entity maps
    const actionMap = byAction.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {});
    const entityMap = byEntity.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {});

    res.json({
      totalLogs,
      byAction: actionMap,
      byEntity: entityMap
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export admin logs
// @route   GET /api/logs/export
// @access  Private/Admin
const exportLogs = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      adminId, 
      action, 
      entity,
      format = 'csv',
      search
    } = req.query;

    const query = {};

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    if (adminId) query.adminId = adminId;
    if (action) query.action = action;
    if (entity) query.entity = entity;
    
    if (search) {
      query.$or = [
        { adminName: { $regex: search, $options: 'i' } },
        { adminEmail: { $regex: search, $options: 'i' } }
      ];
    }

    const logs = await AdminLog.find(query).sort({ timestamp: -1 });

    const data = logs.map(log => {
      let formattedDetails = '-';
      if (log.details) {
        try {
          if (typeof log.details === 'string') {
            formattedDetails = log.details;
          } else {
            const parts = [];
            for (const [key, value] of Object.entries(log.details)) {
              if (key === 'password') continue;
              const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
              parts.push(`${key}: ${valStr}`);
            }
            formattedDetails = parts.join(', ');
          }
        } catch (e) {
          formattedDetails = String(log.details);
        }
      }

      return {
        Date: new Date(log.timestamp).toLocaleString(),
        Admin: log.adminName || 'System',
        Email: log.adminEmail || '-',
        Action: log.action,
        Entity: log.entity,
        Details: formattedDetails,
        IP: log.ipAddress || '-'
      };
    });

    const columns = [
      { key: 'Date', header: 'Date', width: 110 },
      { key: 'Admin', header: 'Admin', width: 100 },
      { key: 'Email', header: 'Email', width: 120 },
      { key: 'Action', header: 'Action', width: 80 },
      { key: 'Entity', header: 'Entity', width: 80 },
      { key: 'Details', header: 'Details', width: 200 },
      { key: 'IP', header: 'IP Address', width: 100 }
    ];

    const config = {
      title: 'Admin Activity Log',
      orientation: 'landscape',
      columns,
      metadata: {
        'Generated By': req.user.name,
        'Date Range': `${startDate || 'All'} to ${endDate || 'All'}`
      }
    };

    let buffer;
    let contentType;
    let filename;

    switch (format.toLowerCase()) {
      case 'pdf':
        buffer = await generatePDF(data, config);
        contentType = 'application/pdf';
        filename = 'admin_logs.pdf';
        break;
      case 'excel':
        buffer = await generateExcel(data, config);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = 'admin_logs.xlsx';
        break;
      case 'json':
        buffer = Buffer.from(JSON.stringify(data, null, 2));
        contentType = 'application/json';
        filename = 'admin_logs.json';
        break;
      case 'csv':
      default:
        buffer = await generateCSV(data, config);
        contentType = 'text/csv';
        filename = 'admin_logs.csv';
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(buffer);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Error generating export' });
  }
};

// @desc    Clear logs
// @route   DELETE /api/logs/clear
// @access  Private/Admin
const clearLogs = async (req, res) => {
  try {
    const { olderThan } = req.query;
    const query = {};

    if (olderThan) {
      query.timestamp = { $lt: new Date(olderThan) };
    }
    
    const result = await AdminLog.deleteMany(query);
    res.json({ deleted: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get log by ID
// @route   GET /api/logs/:id
// @access  Private/Admin
const getLogById = async (req, res) => {
  try {
    const log = await AdminLog.findById(req.params.id).populate('adminId', 'name email');
    if (!log) return res.status(404).json({ message: 'Log not found' });
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLogs,
  getLogStats,
  exportLogs,
  clearLogs,
  getLogById
};
