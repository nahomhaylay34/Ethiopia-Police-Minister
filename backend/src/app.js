const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/AppError');
const globalErrorHandler = require('./middleware/errorHandler');

const config = require('./config/config');

// Routes
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const caseRoutes = require('./routes/caseRoutes');
const evidenceRoutes = require('./routes/evidenceRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const healthRoutes = require('./routes/healthRoutes');
const publicRoutes = require('./routes/publicRoutes');

const app = express();

// Expose models to request handlers that dynamically need them
const models = require('./models');
const sequelize = require('./config/database');
app.set('models', models);

// Auto-sync database in serverless production
let isSynced = false;
app.use(async (req, res, next) => {
  if (!isSynced && process.env.POSTGRES_URL) {
    try {
      await sequelize.sync();
      isSynced = true;
      console.log('✅ Database synced automatically');
    } catch (err) {
      console.error('❌ Sync failed:', err);
    }
  }
  next();
});

// 1) GLOBAL MIDDLEWARES
// Set security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
}));

// Development logging
if (config.env === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
// const limiter = rateLimit({
//   max: config.rateLimit.maxRequests,
//   windowMs: config.rateLimit.windowMs,
//   message: 'Too many requests from this IP, please try again in 15 minutes!'
// });
// app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// CORS
// const allowedOrigins = config.cors.origin.split(',').map(origin => origin.trim());
app.use(cors({
  origin: true,
  credentials: true
}));

// 2) ROUTES
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/cases', caseRoutes);
app.use('/api/v1/evidence', evidenceRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/public', publicRoutes);

// Handle undefined routes
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// GLOBAL ERROR HANDLING MIDDLEWARE
app.use(globalErrorHandler);

module.exports = app;
