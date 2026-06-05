const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Wallet = require('../models/Wallet');
const InvestmentPlan = require('../models/InvestmentPlan');
const Settings = require('../models/Settings');
const logger = require('../utils/logger');

const seedDatabase = async () => {
  try {
    logger.info('Running database verification and seeding check...');

    // 1. Seed default Investment Plans
    logger.info('Resetting and seeding default plans in Indian Rupees (₹)...');
    await InvestmentPlan.deleteMany({});
    
    const defaultPlans = [
      {
        name: 'Basic Plan',
        minAmount: 1000,
        maxAmount: 50000,
        dailyProfitPercentage: 1.5,
        durationDays: 30,
        description: 'Starter plan with consistent daily returns. Great for exploring the platform mechanics in Indian Rupees (₹).'
      },
      {
        name: 'Silver Plan',
        minAmount: 50000,
        maxAmount: 250000,
        dailyProfitPercentage: 2.0,
        durationDays: 60,
        description: 'Standard plan for medium investment sizes offering elevated interest rates in Indian Rupees (₹).'
      },
      {
        name: 'Gold Plan',
        minAmount: 250000,
        maxAmount: 1000000,
        dailyProfitPercentage: 2.5,
        durationDays: 90,
        description: 'High-yield tier designed for experienced portfolio holders desiring medium-term strategies in Indian Rupees (₹).'
      },
      {
        name: 'Platinum Plan',
        minAmount: 1000000,
        maxAmount: 10000000,
        dailyProfitPercentage: 3.0,
        durationDays: 180,
        description: 'Premium VIP tier offering maximum returns and long-term asset growth in Indian Rupees (₹).'
      }
    ];
    await InvestmentPlan.insertMany(defaultPlans);
    logger.info('Successfully seeded default investment plans in Rupees.');

    // 2. Seed Settings
    logger.info('Resetting and seeding default configurations in Indian Rupees (₹)...');
    await Settings.deleteMany({});
    await Settings.create({
      siteName: 'Aura Capital',
      defaultMinWithdrawal: 500,
      defaultMaxWithdrawal: 1000000,
      maintenanceMode: false,
      contactEmail: 'support@auracapital.com',
      earningsCronSchedule: '0 0 * * *'
    });
    logger.info('Successfully seeded platform settings.');

    // 3. Seed Default Admin User if none exists
    const adminUserCount = await User.countDocuments({ role: 'admin' });
    if (adminUserCount === 0) {
      logger.info('No administrator user found. Creating default admin account...');

      const adminName = process.env.DEFAULT_ADMIN_NAME || 'Platform Admin';
      const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@investmentplatform.com';
      const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'AdminSecurePassword123!';

      // Create Admin User account (status active immediately)
      const adminUser = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        status: 'Active'
      });

      // Create Admin Wallet
      await Wallet.create({
        userId: adminUser._id,
        balance: 100000000.0, // Pre-funded admin wallet reserves (₹10 Crore)
        totalEarnings: 0.0
      });

      // Create Admin Specific Profile metadata
      await Admin.create({
        userId: adminUser._id,
        permissions: ['all'],
        department: 'Executive Board'
      });

      logger.info(`Successfully created default Admin Account:`);
      logger.info(`Email: ${adminEmail}`);
      logger.info(`Password: ${adminPassword}`);
    } else {
      logger.info('Administrator user already exists. Seeding skipped.');
    }

    logger.info('Database seeding checks completed successfully.');
  } catch (error) {
    logger.error('Error occurred during database seeding:', error.message);
  }
};

// Allow standalone execution of script
if (require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
  const connectDB = require('../config/db');

  const runStandalone = async () => {
    await connectDB();
    await seedDatabase();
    mongoose.connection.close();
    logger.info('Database seeding connection closed.');
  };

  runStandalone();
}

module.exports = {
  seedDatabase
};
