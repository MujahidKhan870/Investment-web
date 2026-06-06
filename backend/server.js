require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const { apiLimiter } = require('./middleware/rateLimiter');
const { initCron } = require('./services/cronService');
const logger = require('./utils/logger');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const walletRoutes = require('./routes/walletRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

/* ========================
   SECURITY & MIDDLEWARE
======================== */

app.use(helmet());

/* ✅ FIXED CORS (NO ENV ISSUE NOW) */
app.use(
  cors({
    origin: 'https://investment-web-five.vercel.app',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* LOGGING */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
}

/* RATE LIMIT */
app.use('/api', apiLimiter);

/* ========================
   ROUTES
======================== */

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

/* HEALTH CHECK */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'System is healthy',
    timestamp: new Date()
  });
});

/* ROOT ROUTE (FIX FOR "Cannot GET /") */
app.get('/', (req, res) => {
  res.send('Investment API Backend is running 🚀');
});

/* ERROR HANDLER */
app.use(errorHandler);

/* ========================
   START SERVER
======================== */

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const seed = require('./scripts/seed');
    seed.seedDatabase().catch(err => logger.error('Seed error:', err));

    initCron().catch(err => logger.error('Cron error:', err));

    app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();