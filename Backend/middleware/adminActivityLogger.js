const { logAdminAction } = require('../utils/logger');

const adminActivityLogger = (req, res, next) => {
  // Only log for authenticated admins
  if (!req.user || req.user.role !== 'admin') {
    return next();
  }

  // Capture original end function to intercept response
  const originalEnd = res.end;
  const chunks = [];

  // Intercept response body (optional, but useful for "pin to pin" details)
  // We need to be careful not to break streams
  
  res.on('finish', () => {
    // Only log significant actions (mutations) or specific sensitive GETs
    // Exclude login as it is handled explicitly in authController
    if ((req.method !== 'GET' || req.path.includes('/export') || req.path.includes('/report')) && !req.originalUrl.includes('/login')) {
      let action = 'UNKNOWN';
      if (req.method === 'POST') action = 'CREATE';
      else if (req.method === 'PUT' || req.method === 'PATCH') action = 'UPDATE';
      else if (req.method === 'DELETE') action = 'DELETE';
      else action = req.method; // Fallback

      // Append context if needed, e.g. "CREATE (Export)"
      if (req.path.includes('/export')) action = 'EXPORT';
      
      // Determine entity from path
      // e.g., /api/products -> Product
      let entity = 'Unknown';
      const pathParts = req.baseUrl.split('/');
      if (pathParts.length > 2) {
        entity = pathParts[2].charAt(0).toUpperCase() + pathParts[2].slice(1);
      }

      // Extract ID if present in params
      const entityId = req.params.id || req.body.id || req.body._id || null;

      // Details: Request Body (sanitized)
      const details = {
        query: req.query,
        body: { ...req.body },
        statusCode: res.statusCode,
        statusMessage: res.statusMessage
      };

      // Sanitize sensitive fields
      if (details.body.password) details.body.password = '***';
      if (details.body.token) details.body.token = '***';

      logAdminAction(req, req.method, entity, entityId, details).catch(err => {
        console.error('Error logging admin activity:', err);
      });
    }
  });

  next();
};

module.exports = adminActivityLogger;
