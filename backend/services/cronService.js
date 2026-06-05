const cron = require('node-cron');
const { calculateDailyEarnings } = require('./calculationEngine');
const Settings = require('../models/Settings');
const logger = require('../utils/logger');

let cronJob;

const initCron = async () => {
  try {
    // 1. Fetch cron schedule from settings, or default to midnight
    let schedule = '0 0 * * *';
    const settings = await Settings.findOne();
    if (settings && settings.earningsCronSchedule) {
      schedule = settings.earningsCronSchedule;
    }

    logger.info(`Initializing Earnings Calculation Cron Job with schedule: [${schedule}]`);

    // 2. Schedule the cron job
    cronJob = cron.schedule(schedule, async () => {
      logger.info('Triggering scheduled daily earnings calculation...');
      try {
        await calculateDailyEarnings();
      } catch (error) {
        logger.error('Scheduled earnings cron job failed:', error.message);
      }
    });

    // Start the cron job
    cronJob.start();
  } catch (error) {
    logger.error('Failed to initialize cron service:', error.message);
  }
};

const updateCronSchedule = async (newSchedule) => {
  if (cronJob) {
    cronJob.stop();
    logger.info('Stopped old cron job schedule.');
  }

  cronJob = cron.schedule(newSchedule, async () => {
    logger.info('Triggering newly scheduled daily earnings calculation...');
    try {
      await calculateDailyEarnings();
    } catch (error) {
      logger.error('Scheduled earnings cron job failed:', error.message);
    }
  });

  cronJob.start();
  logger.info(`Successfully updated and started new cron schedule: [${newSchedule}]`);
};

module.exports = {
  initCron,
  updateCronSchedule
};
