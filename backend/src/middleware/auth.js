import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    // Get token
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        error: 'User not found',
      });
    }

    // Check disabled
    if (user.disabled) {
      return res.status(403).json({
        error: 'Your account has been disabled',
      });
    }

    // Attach user
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    console.log('Auth middleware error:', error.message);

    return res.status(401).json({
      error: 'Please authenticate',
    });
  }
};



// Role Authorization Middleware
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    let userRole = req.user.role?.toLowerCase() || '';

    // Normalize roles
    if (
      userRole === 'jmanagement' ||
      userRole === 'j.management'
    ) {
      userRole = 'management';
    }

    const allowedRoles = roles.map((role) =>
      role.toLowerCase()
    );

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Not authorized to access this resource',
      });
    }

    next();
  };
};