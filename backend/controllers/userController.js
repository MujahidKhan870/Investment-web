const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { AppError } = require('../middleware/errorMiddleware');

// Get current user profile
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update profile details
const updateMe = async (req, res, next) => {
  try {
    const { name, twoFactorEnabled } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { 
        ...(name && { name }), 
        ...(typeof twoFactorEnabled === 'boolean' && { twoFactorEnabled })
      },
      { new: true, runValidators: true }
    );

    await ActivityLog.create({
      userId: req.user.id,
      action: 'UPDATE_PROFILE',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || 'Unknown',
      details: 'User updated profile configuration'
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    next(error);
  }
};

// Change Password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(new AppError('Please provide current password and new password', 400));
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    
    // Verify current password
    if (!(await user.comparePassword(currentPassword, user.password))) {
      return next(new AppError('Current password is incorrect', 401));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: 'CHANGE_PASSWORD',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || 'Unknown',
      details: 'User password changed successfully'
    });

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get User Activity Logs
const getMyActivityLogs = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find({ userId: req.user.id }).sort('-createdAt').limit(50);
    res.status(200).json({
      status: 'success',
      results: logs.length,
      data: {
        logs
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMe,
  updateMe,
  changePassword,
  getMyActivityLogs
};
