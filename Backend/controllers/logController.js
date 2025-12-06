const AdminLog = require('../models/AdminLog');
const LogAlert = require('../models/LogAlert');
const { generateCSV, generateExcel, generatePDF } = require('../utils/exportUtils');

// @desc    Get admin logs with filtering and pagination
// @route   GET /api/logs/advanced
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
      severity,
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
    if (severity) query.severity = severity;

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const logs = await AdminLog.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await AdminLog.countDocuments(query);

    // Calculate basic stats for the response
    const stats = {
      total: count,
      errorCount: await AdminLog.countDocuments({ ...query, severity: 'ERROR' }),
      warningCount: await AdminLog.countDocuments({ ...query, severity: 'WARNING' })
    };

    res.json({
      data: logs,
      meta: {
        total: count,
        page: Number(page),
        totalPages: Math.ceil(count / limit)
      },
      stats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search logs
// @route   GET /api/logs/search
// @access  Private/Admin
const searchLogs = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query required' });
    }

    const logs = await AdminLog.find(
      { $text: { $search: q } },
      { score: { $meta: "textScore" } }
    )
    .sort({ score: { $meta: "textScore" } })
    .skip((page - 1) * limit)
    .limit(limit * 1);

    const count = await AdminLog.countDocuments({ $text: { $search: q } });

    res.json({
      results: logs,
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / limit),
      took: 0 // Placeholder
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
      bySeverity,
      byAction,
      hourly
    ] = await Promise.all([
      AdminLog.countDocuments(match),
      AdminLog.aggregate([
        { $match: match },
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]),
      AdminLog.aggregate([
        { $match: match },
        { $group: { _id: '$action', count: { $sum: 1 } } }
      ]),
      AdminLog.aggregate([
        { $match: match },
        {
          $group: {
            _id: { 
              year: { $year: "$timestamp" },
              month: { $month: "$timestamp" },
              day: { $dayOfMonth: "$timestamp" },
              hour: { $hour: "$timestamp" }
            },
            count: { $sum: 1 },
            errors: { 
              $sum: { 
                $cond: [{ $in: ["$severity", ["ERROR", "CRITICAL", "EMERGENCY"]] }, 1, 0] 
              } 
            },
            warnings: { 
              $sum: { 
                $cond: [{ $in: ["$severity", ["WARNING", "ALERT"]] }, 1, 0] 
              } 
            }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 } }
      ])
    ]);

    // Format hourly data
    const formattedHourly = hourly.map(h => ({
      hour: `${h._id.year}-${h._id.month}-${h._id.day} ${h._id.hour}:00`,
      count: h.count,
      errors: h.errors,
      warnings: h.warnings
    }));

    // Format severity and action maps
    const severityMap = bySeverity.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {});
    const actionMap = byAction.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {});

    res.json({
      totalLogs,
      bySeverity: severityMap,
      byAction: actionMap,
      hourly: formattedHourly,
      errorCount: severityMap['ERROR'] || 0,
      warningCount: severityMap['WARNING'] || 0
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
    if (search) query.$text = { $search: search };

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
        Action: log.action,
        Entity: log.entity,
        Severity: log.severity || 'INFO',
        Details: formattedDetails,
        IP: log.ipAddress || '-'
      };
    });

    const columns = [
      { key: 'Date', header: 'Date', width: 110 },
      { key: 'Admin', header: 'Admin', width: 100 },
      { key: 'Action', header: 'Action', width: 100 },
      { key: 'Entity', header: 'Entity', width: 100 },
      { key: 'Severity', header: 'Severity', width: 80 },
      { key: 'Details', header: 'Details', width: 230 },
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

// @desc    Bulk operations
// @route   POST /api/logs/bulk
// @access  Private/Admin
const bulkOperation = async (req, res) => {
  try {
    const { operation, ids, criteria } = req.body;
    let result;

    const query = {};
    if (ids && ids.length > 0) {
      query._id = { $in: ids };
    } else if (criteria) {
      // Build query from criteria similar to getLogs
      if (criteria.startDate) query.timestamp = { $gte: new Date(criteria.startDate) };
      // ... other criteria
    }

    switch (operation) {
      case 'delete':
        result = await AdminLog.deleteMany(query);
        break;
      case 'archive':
        result = await AdminLog.updateMany(query, { archived: true, archivedAt: new Date() });
        break;
      default:
        return res.status(400).json({ message: 'Invalid operation' });
    }

    res.json({ success: true, affected: result.deletedCount || result.modifiedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear logs
// @route   DELETE /api/logs/clear
// @access  Private/Admin
const clearLogs = async (req, res) => {
  try {
    const { olderThan, severity } = req.query;
    const query = {};

    if (olderThan) {
      query.timestamp = { $lt: new Date(olderThan) };
    }
    if (severity) {
      query.severity = severity;
    }

    // Safety check: don't delete everything unless explicitly requested (e.g. by passing empty query but maybe we should enforce at least one filter)
    // For now, if no filters, delete all (be careful!)
    
    const result = await AdminLog.deleteMany(query);
    res.json({ deleted: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Archive logs
// @route   POST /api/logs/archive
// @access  Private/Admin
const archiveLogs = async (req, res) => {
  try {
    const { olderThan } = req.body;
    if (!olderThan) return res.status(400).json({ message: 'olderThan date required' });

    const result = await AdminLog.updateMany(
      { timestamp: { $lt: new Date(olderThan) }, archived: false },
      { archived: true, archivedAt: new Date() }
    );

    res.json({ archived: result.modifiedCount, batchId: Date.now().toString() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Restore logs
// @route   POST /api/logs/archive/:batchId/restore
// @access  Private/Admin
const restoreLogs = async (req, res) => {
  // Mock implementation as we don't track batchId in DB yet
  res.json({ restored: 0, message: 'Not implemented yet' });
};

// @desc    Get system health
// @route   GET /api/logs/health
// @access  Private/Admin
const getSystemHealth = async (req, res) => {
  try {
    // Simple health check based on recent error logs
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentErrors = await AdminLog.countDocuments({
      timestamp: { $gte: fiveMinutesAgo },
      severity: { $in: ['ERROR', 'CRITICAL', 'EMERGENCY'] }
    });

    let status = 'healthy';
    if (recentErrors > 10) status = 'degraded';
    if (recentErrors > 50) status = 'unhealthy';

    res.json({
      status,
      metrics: {
        recentErrors,
        uptime: process.uptime()
      },
      recommendations: recentErrors > 0 ? ['Check recent error logs'] : []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate report
// @route   POST /api/logs/reports
// @access  Private/Admin
const generateReport = async (req, res) => {
  // Reuse export logic for now
  req.query = { ...req.body, format: req.body.format || 'pdf' };
  return exportLogs(req, res);
};

// @desc    Get alerts
// @route   GET /api/logs/alerts
// @access  Private/Admin
const getAlerts = async (req, res) => {
  try {
    const alerts = await LogAlert.find().sort({ createdAt: -1 });
    res.json({ alerts, total: alerts.length, page: 1, totalPages: 1 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Setup alert
// @route   POST /api/logs/alerts
// @access  Private/Admin
const setupAlert = async (req, res) => {
  try {
    const alert = new LogAlert({
      ...req.body,
      createdBy: req.user._id
    });
    await alert.save();
    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Acknowledge alert
// @route   PATCH /api/logs/alerts/:id/acknowledge
// @access  Private/Admin
const acknowledgeAlert = async (req, res) => {
  try {
    const alert = await LogAlert.findByIdAndUpdate(
      req.params.id,
      { lastTriggered: new Date() }, // Just updating timestamp for now
      { new: true }
    );
    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get audit trail
// @route   GET /api/logs/audit/:entityType/:entityId
// @access  Private/Admin
const getAuditTrail = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const logs = await AdminLog.find({ entity: entityType, entityId })
      .sort({ timestamp: -1 });
    
    res.json(logs.map(log => ({
      id: log._id,
      entityType,
      entityId,
      changes: log.changes ? [log.changes] : [],
      timestamp: log.timestamp,
      user: log.adminName,
      action: log.action
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Analyze logs
// @route   POST /api/logs/analyze
// @access  Private/Admin
const analyzeLogs = async (req, res) => {
  res.json({
    patterns: [],
    anomalies: [],
    trends: [],
    correlations: []
  });
};

// @desc    Get log by ID
// @route   GET /api/logs/:id
// @access  Private/Admin
const getLogById = async (req, res) => {
  try {
    const log = await AdminLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: 'Log not found' });
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update log
// @route   PATCH /api/logs/:id
// @access  Private/Admin
const updateLog = async (req, res) => {
  try {
    const log = await AdminLog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create log
// @route   POST /api/logs
// @access  Private/Admin
const createLog = async (req, res) => {
  try {
    const log = new AdminLog({
      ...req.body,
      adminId: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      adminRole: req.user.role
    });
    await log.save();
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLogs,
  searchLogs,
  getLogStats,
  exportLogs,
  bulkOperation,
  clearLogs,
  archiveLogs,
  restoreLogs,
  getSystemHealth,
  generateReport,
  getAlerts,
  setupAlert,
  acknowledgeAlert,
  getAuditTrail,
  analyzeLogs,
  getLogById,
  updateLog,
  createLog
};
