const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const UserSession = require('../models/UserSession');
const VerificationToken = require('../models/VerificationToken');
const PasswordResetToken = require('../models/PasswordResetToken');
const ActivityLog = require('../models/ActivityLog');
const { AppError } = require('../middleware/errorMiddleware');
const logger = require('../utils/logger');

// Generate Access Token
const signAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m'
  });
};

// Generate Refresh Token
const signRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
};

// Set token cookies in response
const sendTokenResponse = async (user, statusCode, req, res) => {
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  // Set cookies
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production'
  };

  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    expires: new Date(Date.now() + 15 * 60 * 1000) // 15 mins
  });

  res.cookie('refreshToken', refreshToken, cookieOptions);

  // Create UserSession in DB
  const userAgent = req.headers['user-agent'] || 'Unknown';
  // simple browser/device parser
  let deviceType = 'Desktop';
  if (/mobile/i.test(userAgent)) deviceType = 'Mobile';
  if (/tablet/i.test(userAgent)) deviceType = 'Tablet';
  
  let browser = 'Unknown';
  if (/chrome|crios/i.test(userAgent)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(userAgent)) browser = 'Firefox';
  else if (/safari/i.test(userAgent)) browser = 'Safari';

  // Revoke previous sessions of same device type if you want, or just add new
  const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await UserSession.create({
    userId: user._id,
    refreshToken,
    deviceType,
    browser,
    ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
    expiresAt: sessionExpiry
  });

  // Log activity
  await ActivityLog.create({
    userId: user._id,
    action: 'LOGIN',
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent,
    details: `Log in successful on browser ${browser} (${deviceType})`
  });

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    accessToken,
    refreshToken,
    data: {
      user
    }
  });
};

// 1. User Registration
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return next(new AppError('Please provide name, email and password', 400));
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email already registered', 400));
    }

    // Force register as standard user role
    const newUser = await User.create({
      name,
      email,
      password,
      role: 'user',
      status: 'Pending Verification'
    });

    // Create corresponding wallet
    await Wallet.create({
      userId: newUser._id,
      balance: 0.0,
      totalEarnings: 0.0
    });

    // Create Verification Token
    const verifyTokenStr = crypto.randomBytes(32).toString('hex');
    const hashedVerifyToken = crypto.createHash('sha256').update(verifyTokenStr).digest('hex');

    await VerificationToken.create({
      userId: newUser._id,
      token: hashedVerifyToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours expiry
    });

    // Logging verification link (simulate Email sending in development)
    logger.info(`Simulated Verification Link for ${email}: http://localhost:5173/verify-email?token=${verifyTokenStr}`);

    res.status(201).json({
      status: 'success',
      message: 'Registration successful! Please verify your email.',
      data: {
        userId: newUser._id,
        email: newUser.email,
        simulatedToken: verifyTokenStr // provided for testing ease
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. User Login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    // Fetch user and include password and locked metadata
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new AppError('Incorrect email or password', 401));
    }

    // Check if locked out
    if (user.isLockedOut()) {
      const lockRemaining = Math.round((user.lockoutUntil - Date.now()) / 60000);
      return next(new AppError(`Your account is temporarily locked. Try again in ${lockRemaining} minute(s).`, 423));
    }

    // Check password
    const isCorrect = await user.comparePassword(password, user.password);
    if (!isCorrect) {
      // Increment failed attempts
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 mins lockout
        logger.warn(`Account locked out for user email: ${email} due to repeated failures.`);
      }
      await user.save({ validateBeforeSave: false });

      return next(new AppError('Incorrect email or password', 401));
    }

    // Reset failed attempts if successful
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    await user.save({ validateBeforeSave: false });

    // Generate cookies and session
    await sendTokenResponse(user, 200, req, res);
  } catch (error) {
    next(error);
  }
};

// 3. User Logout
const logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    
    if (token) {
      // Deactivate session in DB
      await UserSession.findOneAndUpdate({ refreshToken: token }, { active: false });
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    if (req.user) {
      await ActivityLog.create({
        userId: req.user._id,
        action: 'LOGOUT',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || 'Unknown',
        details: 'User logged out successfully'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// 4. Token Refresh
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;

    if (!token) {
      return next(new AppError('No refresh token provided', 401));
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return next(new AppError('Invalid or expired refresh token. Please login again.', 401));
    }

    // Find active session
    const session = await UserSession.findOne({ refreshToken: token, active: true });
    if (!session) {
      return next(new AppError('Session has been revoked or expired. Please login again.', 401));
    }

    // Verify user exists and check statuses
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('User no longer exists', 401));
    }

    if (user.status === 'Suspended' || user.status === 'Blocked') {
      return next(new AppError('Account is not active', 403));
    }

    // Generate new Access Token
    const accessToken = signAccessToken(user._id);

    // Set cookie
    res.cookie('accessToken', accessToken, {
      expires: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
      httpOnly: true,
      secure: req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production'
    });

    res.status(200).json({
      status: 'success',
      accessToken
    });
  } catch (error) {
    next(error);
  }
};

// 5. Verify Email
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return next(new AppError('Token is required', 400));
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find token in DB
    const verification = await VerificationToken.findOne({
      token: hashedToken,
      expiresAt: { $gt: Date.now() }
    });

    if (!verification) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    // Update User Status
    const user = await User.findById(verification.userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    user.status = 'Active';
    await user.save({ validateBeforeSave: false });

    // Remove token from database
    await VerificationToken.deleteOne({ _id: verification._id });

    // Log Activity
    await ActivityLog.create({
      userId: user._id,
      action: 'VERIFY_EMAIL',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || 'Unknown',
      details: 'Email verification completed successfully'
    });

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully! You can now log in.'
    });
  } catch (error) {
    next(error);
  }
};

// 6. Forgot Password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Please provide your email address', 400));
    }

    const user = await User.findOne({ email });
    if (!user) {
      // To prevent email enumeration, return success response even if email is incorrect
      return res.status(200).json({
        status: 'success',
        message: 'If the email exists, a password reset link has been generated.'
      });
    }

    // Delete existing reset tokens if any
    await PasswordResetToken.deleteOne({ userId: user._id });

    // Create reset token
    const resetTokenStr = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(resetTokenStr).digest('hex');

    await PasswordResetToken.create({
      userId: user._id,
      token: hashedResetToken,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry
    });

    // Logging reset link
    logger.info(`Simulated Password Reset Link for ${email}: http://localhost:5173/reset-password?token=${resetTokenStr}`);

    res.status(200).json({
      status: 'success',
      message: 'Password reset link generated successfully.',
      simulatedToken: resetTokenStr // provided for testing ease
    });
  } catch (error) {
    next(error);
  }
};

// 7. Reset Password
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return next(new AppError('Please provide token and new password', 400));
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find token
    const resetRecord = await PasswordResetToken.findOne({
      token: hashedToken,
      expiresAt: { $gt: Date.now() }
    });

    if (!resetRecord) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    // Find user and change password
    const user = await User.findById(resetRecord.userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    user.password = password;
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    await user.save();

    // Delete token
    await PasswordResetToken.deleteOne({ _id: resetRecord._id });

    // Revoke all existing sessions to enforce security
    await UserSession.updateMany({ userId: user._id }, { active: false });

    // Log Activity
    await ActivityLog.create({
      userId: user._id,
      action: 'RESET_PASSWORD',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || 'Unknown',
      details: 'Password reset completed successfully. Active sessions revoked.'
    });

    res.status(200).json({
      status: 'success',
      message: 'Password reset successful! You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

// 8. Session Management: Get Active Sessions
const getSessions = async (req, res, next) => {
  try {
    const sessions = await UserSession.find({ userId: req.user._id, active: true }).sort('-lastActivity');
    res.status(200).json({
      status: 'success',
      results: sessions.length,
      data: {
        sessions
      }
    });
  } catch (error) {
    next(error);
  }
};

// 9. Session Management: Revoke Session
const revokeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await UserSession.findOneAndUpdate(
      { _id: sessionId, userId: req.user._id },
      { active: false },
      { new: true }
    );

    if (!session) {
      return next(new AppError('Session not found or not owned by user', 404));
    }

    res.status(200).json({
      status: 'success',
      message: 'Session revoked successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getSessions,
  revokeSession
};
