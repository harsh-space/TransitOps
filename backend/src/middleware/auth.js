const jwt = require('jsonwebtoken');
const User = require('../models/user');

const JWT_SECRET = process.env.JWT_SECRET || 'transitops_jwt_secret_key_123456';

const PERMISSIONS = {
  FleetManager: {
    fleet: 'full',
    drivers: 'full',
    trips: 'none',
    fuelExpenses: 'none',
    analytics: 'full'
  },
  Dispatcher: {
    fleet: 'view',
    drivers: 'none',
    trips: 'full',
    fuelExpenses: 'none',
    analytics: 'none'
  },
  SafetyOfficer: {
    fleet: 'none',
    drivers: 'full',
    trips: 'view',
    fuelExpenses: 'none',
    analytics: 'none'
  },
  FinancialAnalyst: {
    fleet: 'view',
    drivers: 'none',
    trips: 'none',
    fuelExpenses: 'full',
    analytics: 'full'
  }
};

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User does not exist.' });
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(403).json({ success: false, error: 'Account is locked. Please try again later.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
  }
};

const authorize = (resource, action = 'view') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    const role = req.user.role;
    const permissions = PERMISSIONS[role];
    if (!permissions) {
      return res.status(403).json({ success: false, error: 'Role permissions not found.' });
    }

    const level = permissions[resource];
    if (level === 'full') {
      return next();
    }
    if (level === 'view' && action === 'view') {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: `Access denied. ${role} has '${level || 'none'}' permission on '${resource}' (required: '${action}').`
    });
  };
};

module.exports = {
  authenticate,
  authorize,
  PERMISSIONS,
  JWT_SECRET
};
