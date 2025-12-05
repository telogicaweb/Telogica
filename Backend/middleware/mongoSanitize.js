/**
 * Express 5 Compatible MongoDB Sanitization Middleware
 * 
 * This middleware sanitizes request data to prevent MongoDB operator injection.
 * Compatible with Express 5.x where req.query is a getter-only property.
 */

/**
 * Check if a value has prohibited characters for MongoDB injection
 * @param {string} key - The key to check
 * @returns {boolean} - True if the key contains prohibited characters
 */
function hasProhibited(key) {
  return typeof key === 'string' && key.indexOf('$') !== -1;
}

/**
 * Recursively sanitize an object by removing keys that start with '$' or contain '.'
 * @param {any} payload - The payload to sanitize
 * @param {object} options - Sanitization options
 * @returns {object} - Object with target and isSanitized flag
 */
function sanitize(payload, options = {}) {
  const replaceWith = options.replaceWith || '_';
  let isSanitized = false;

  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload)) {
      // Sanitize each item in array
      return {
        target: payload.map(item => {
          const result = sanitize(item, options);
          if (result.isSanitized) isSanitized = true;
          return result.target;
        }),
        isSanitized
      };
    } else {
      // Sanitize object
      const sanitized = {};
      for (const key in payload) {
        // Use Object.prototype.hasOwnProperty for objects created with Object.create(null)
        if (Object.prototype.hasOwnProperty.call(payload, key)) {
          let sanitizedKey = key;
          
          // Check if key contains prohibited characters
          if (hasProhibited(key) || key.indexOf('.') !== -1) {
            sanitizedKey = key.replace(/\$/g, replaceWith).replace(/\./g, replaceWith);
            isSanitized = true;
          }

          // Recursively sanitize nested objects
          const result = sanitize(payload[key], options);
          if (result.isSanitized) isSanitized = true;
          sanitized[sanitizedKey] = result.target;
        }
      }
      return { target: sanitized, isSanitized };
    }
  }

  return { target: payload, isSanitized };
}

/**
 * Create middleware function for Express
 * @param {object} options - Configuration options
 * @param {string} options.replaceWith - Character to replace prohibited characters with
 * @param {function} options.onSanitize - Callback when sanitization occurs
 * @returns {function} Express middleware function
 */
function mongoSanitize(options = {}) {
  const hasOnSanitize = typeof options.onSanitize === 'function';
  
  return function (req, res, next) {
    // Sanitize body
    if (req.body) {
      const { target, isSanitized } = sanitize(req.body, options);
      req.body = target;
      if (isSanitized && hasOnSanitize) {
        options.onSanitize({ req, key: 'body' });
      }
    }

    // Sanitize params
    if (req.params) {
      const { target, isSanitized } = sanitize(req.params, options);
      req.params = target;
      if (isSanitized && hasOnSanitize) {
        options.onSanitize({ req, key: 'params' });
      }
    }

    // Sanitize headers
    if (req.headers) {
      const { target, isSanitized } = sanitize(req.headers, options);
      req.headers = target;
      if (isSanitized && hasOnSanitize) {
        options.onSanitize({ req, key: 'headers' });
      }
    }

    // Special handling for req.query in Express 5
    // We need to work around the read-only getter
    if (req.query) {
      const { target, isSanitized } = sanitize(req.query, options);
      
      // In Express 5, req.query is a getter, so we need to use Object.defineProperty
      if (isSanitized) {
        try {
          // Delete the getter first
          delete req.query;
          // Set the sanitized value
          req.query = target;
          
          if (hasOnSanitize) {
            options.onSanitize({ req, key: 'query' });
          }
        } catch (err) {
          // If we can't delete/reassign, define a new property
          Object.defineProperty(req, 'query', {
            value: target,
            writable: true,
            enumerable: true,
            configurable: true
          });
          
          if (hasOnSanitize) {
            options.onSanitize({ req, key: 'query' });
          }
        }
      }
    }

    next();
  };
}

module.exports = mongoSanitize;
