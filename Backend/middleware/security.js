const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const hpp = require('hpp');
const compression = require('compression');

/**
 * Security Middleware Configuration
 * Enterprise-grade security settings for production
 */

// ============================================
// Rate Limiting
// ============================================

/**
 * General API rate limiter
 * Prevents brute force attacks
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

/**
 * Auth route rate limiter
 * Stricter limits for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again after 15 minutes.',
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many login attempts. Please try again after 15 minutes.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

/**
 * Export rate limiter
 * Moderate limits for export operations
 */
const exportLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 exports per 5 minutes
  message: 'Too many export requests, please try again later.',
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many export requests. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

/**
 * Password reset rate limiter
 * Very strict limits for password operations
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset attempts per hour
  message: 'Too many password reset attempts, please try again after an hour.',
});

// ============================================
// Security Headers
// ============================================

/**
 * Helmet configuration for security headers
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow loading external resources
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

// ============================================
// Input Sanitization
// ============================================

/**
 * MongoDB injection prevention
 */
const sanitizeData = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Potential NoSQL injection attempt detected: ${key}`);
  },
});

/**
 * HTTP Parameter Pollution protection
 */
const preventHpp = hpp({
  whitelist: [
    'sort',
    'fields',
    'page',
    'limit',
    'category',
    'status',
    'role',
  ],
});

// ============================================
// Request Validation
// ============================================

/**
 * Validate request size
 */
const validateRequestSize = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    return res.status(413).json({
      message: 'Request entity too large. Maximum size is 10MB.',
    });
  }

  next();
};

/**
 * Validate Content-Type for POST/PUT requests
 */
const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    
    if (!contentType) {
      return res.status(400).json({
        message: 'Content-Type header is required.',
      });
    }

    const validTypes = [
      'application/json',
      'multipart/form-data',
      'application/x-www-form-urlencoded',
    ];

    const isValid = validTypes.some(type => contentType.includes(type));

    if (!isValid) {
      return res.status(415).json({
        message: 'Unsupported Media Type. Use application/json or multipart/form-data.',
      });
    }
  }

  next();
};

// ============================================
// Security Logging
// ============================================

/**
 * Log suspicious activities
 */
const securityLogger = (req, res, next) => {
  // Log suspicious patterns
  const suspiciousPatterns = [
    /(\.\.|\/etc\/|\/var\/|\/usr\/)/i, // Path traversal
    /(union|select|insert|update|delete|drop|create|alter|exec|script)/i, // SQL injection
    /(<script|javascript:|onerror=|onload=)/i, // XSS
  ];

  const checkString = `${req.url} ${JSON.stringify(req.body)} ${JSON.stringify(req.query)}`;

  suspiciousPatterns.forEach(pattern => {
    if (pattern.test(checkString)) {
      console.warn({
        timestamp: new Date().toISOString(),
        type: 'SUSPICIOUS_ACTIVITY',
        ip: req.ip,
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        pattern: pattern.toString(),
      });
    }
  });

  next();
};

// ============================================
// Request Timeout
// ============================================

/**
 * Set request timeout to prevent hanging requests
 */
const requestTimeout = (timeoutMs = 30000) => {
  return (req, res, next) => {
    req.setTimeout(timeoutMs, () => {
      res.status(408).json({
        message: 'Request timeout. Please try again.',
      });
    });
    next();
  };
};

/**
 * CORS Security
 * ============================================
 */

/**
 * Strict CORS configuration for production
 * IMPORTANT: Set ALLOWED_ORIGINS environment variable in production
 */
const strictCorsOptions = {
  origin: function (origin, callback) {
    // In production, ALLOWED_ORIGINS must be explicitly set
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOWED_ORIGINS) {
      console.error('SECURITY WARNING: ALLOWED_ORIGINS environment variable must be set in production!');
      return callback(new Error('CORS configuration error'));
    }

    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : [
          // Development defaults only
          'http://localhost:5173',
          'http://localhost:3000',
        ];

    // Allow requests with no origin (mobile apps, curl, postman) only in development
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        return callback(new Error('Origin header required in production'));
      }
      return callback(null, true);
    }

    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200,
};

// ============================================
// Apply All Security Middleware
// ============================================

/**
 * Apply all security middleware to Express app
 */
const applySecurityMiddleware = (app) => {
  // Security headers
  app.use(helmetConfig);

  // Request compression
  app.use(compression());

  // Input sanitization
  app.use(sanitizeData);
  app.use(preventHpp);

  // Request validation
  app.use(validateRequestSize);
  app.use(validateContentType);

  // Security logging
  app.use(securityLogger);

  // Request timeout
  app.use(requestTimeout(30000)); // 30 seconds

  // Trust proxy (for rate limiting behind reverse proxies)
  app.set('trust proxy', 1);

  console.log('✓ Security middleware applied');
};

module.exports = {
  // Rate limiters
  apiLimiter,
  authLimiter,
  exportLimiter,
  passwordResetLimiter,
  
  // Security middleware
  helmetConfig,
  sanitizeData,
  preventHpp,
  validateRequestSize,
  validateContentType,
  securityLogger,
  requestTimeout,
  
  // CORS
  strictCorsOptions,
  
  // Apply all
  applySecurityMiddleware,
};
