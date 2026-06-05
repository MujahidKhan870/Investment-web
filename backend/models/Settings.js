const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    siteName: {
      type: String,
      default: 'Aura Capital'
    },
    defaultMinWithdrawal: {
      type: Number,
      default: 10
    },
    defaultMaxWithdrawal: {
      type: Number,
      default: 10000
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    contactEmail: {
      type: String,
      default: 'support@auracapital.com'
    },
    earningsCronSchedule: {
      type: String,
      default: '0 0 * * *' // Runs at midnight daily by default
    }
  },
  {
    timestamps: true
  }
);

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
