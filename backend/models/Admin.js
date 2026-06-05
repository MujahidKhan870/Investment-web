const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin must be linked to a User account'],
      unique: true
    },
    permissions: {
      type: [String],
      default: ['all']
    },
    department: {
      type: String,
      default: 'Management'
    }
  },
  {
    timestamps: true
  }
);

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
