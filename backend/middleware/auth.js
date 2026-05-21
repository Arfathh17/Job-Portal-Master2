/**
 * JWT Authentication Middleware
 * Verifies JWT tokens and attaches user info to the request
 */
const jwt = require('jsonwebtoken');
require('../config/firebaseAdmin');
const firebaseAdmin = require('firebase-admin');

const JWT_SECRET = process.env.JWT_SECRET || 'ai-job-portal-dev-secret-key-2024';

const roleAliases = {
  jobseeker: 'candidate',
  employer: 'recruiter',
};

const normalizeRole = role => roleAliases[role] || role;

/**
 * Middleware: Require authentication
 * Extracts and verifies the Bearer token from the Authorization header
 */
async function verifyFirebaseToken(token) {
  if (!firebaseAdmin.apps.length) return null;

  try {
    const decoded = await firebaseAdmin.auth().verifyIdToken(token);
    return {
      id: decoded.uid,
      uid: decoded.uid,
      email: decoded.email,
      role: normalizeRole(decoded.role || 'candidate'),
      authProvider: 'firebase',
    };
  } catch {
    return null;
  }
}

const verifyToken = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = header.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = { ...decoded, role: normalizeRole(decoded.role), authProvider: 'jwt' };
      return next();
    } catch {
      const firebaseUser = await verifyFirebaseToken(token);
      if (firebaseUser) {
        req.user = firebaseUser;
        return next();
      }

      return res.status(401).json({ error: 'Invalid or expired token.' });
    }
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();
  return verifyToken(req, res, next);
};

/**
 * Middleware: Require specific roles
 * Usage: authorizeRoles('recruiter', 'admin')
 */
const authorizeRoles = (...roles) => {
  const allowedRoles = roles.map(normalizeRole);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!allowedRoles.includes(normalizeRole(req.user.role))) {
      return res.status(403).json({ error: `Access denied. Required role: ${allowedRoles.join(' or ')}` });
    }
    next();
  };
};

module.exports = {
  auth: verifyToken,
  verifyToken,
  optionalAuth,
  authorizeRoles,
  requireRole: authorizeRoles,
  normalizeRole,
  JWT_SECRET,
};
