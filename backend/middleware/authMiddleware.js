const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserSession = require('../models/UserSession');
const { AppError } = require('./errorMiddleware');

const protect = async (req, res, next) => {
  try {
    let token;
    
    // 1. Get token from cookies or authorization header
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // 2. Verification of token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      return next(new AppError('Token invalid or expired. Please login again.', 401));
    }

    // 3. Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // 4. Check if account is suspended or blocked
    if (currentUser.status === 'Suspended') {
      return next(new AppError('Your account has been suspended. Contact support for details.', 403));
    }
    if (currentUser.status === 'Blocked') {
      return next(new AppError('Your account has been blocked due to security violations.', 403));
    }

    // 5. Verify user session is active (for device management token revocation checks)
    const session = await UserSession.findOne({ userId: currentUser._id, active: true });
    if (!session && currentUser.role !== 'admin') {
      // Allow admins to login without session-matching limits if needed, but users need it
      // Let's make sure if session was revoked, they get logged out
      return next(new AppError('Session expired or revoked. Please login again.', 401));
    }

    // Grant access to protected route
    req.user = currentUser;
    req.session = session;
    next();
  } catch (error) {
    next(error);
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo
};
