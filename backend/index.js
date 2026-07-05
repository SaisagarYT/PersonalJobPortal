import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import supabase from './config/supabase.js';
import './config/infisical.js'; // Initialize Infisical
import opportunityRoute from './routes/opportunity.route.js';
import wishlistRoute from './routes/wishlist.routes.js';
import scraperRoute from './routes/scraper.route.js';
import authRoute from './routes/auth.route.js';
import userRoute from './routes/user.route.js';
import applicationRoute from './routes/application.route.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/security.js';
import logger from './config/logger.js';
import corsOptions from './config/cors.js';
import helmetConfig from './config/helmet.js';
import { startScheduler, getStatus as getSchedulerStatus } from './schedulers/scrape.scheduler.js';

dotenv.config();

const app = express();

// ======================
// Security Middleware
// ======================

// Helmet - Security headers
app.use(helmet(helmetConfig));

// CORS - Cross-Origin Resource Sharing
app.use(cors(corsOptions));

// Request logging (Morgan)
app.use(logger);

// Rate limiting (applied globally)
app.use(apiLimiter);

// Body parsers
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy (if behind nginx/load balancer)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ======================
// Health Check Routes
// ======================

app.get('/', async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Personal Job Portal API',
    version: '1.0.0',
    status: 'healthy',
  });
});

app.get('/health', async (req, res) => {
  try {
    const { error } = await supabase.from('opportunities').select('id').limit(1);
    const dbStatus = error ? 'unhealthy' : 'healthy';
    const scheduler = getSchedulerStatus();

    return res.status(error ? 503 : 200).json({
      success: !error,
      status: error ? 'degraded' : 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        api: 'healthy',
      },
      scheduler: {
        lastRunAt: scheduler.lastRunAt,
        lastRunStatus: scheduler.lastRunStatus,
        lastSaved: scheduler.lastSaved,
        isRunning: scheduler.isRunning,
        totalRuns: scheduler.totalRuns,
      },
    });
  } catch (err) {
    return res.status(503).json({
      success: false,
      status: 'unhealthy',
      message: err.message,
    });
  }
});

// Test Supabase connection (for debugging)
app.get('/supabase', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('sample').select();
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
});

// ======================
// API Routes
// ======================

// Public routes first — no auth required
app.use('/api/v1', authRoute);
app.use('/api/v1', opportunityRoute);
app.use('/api/v1', scraperRoute);

// Protected routes — userRoute uses router.use(requireAuth) internally
app.use('/api/v1', userRoute);
app.use('/api/v1', applicationRoute);
app.use('/api/v1', wishlistRoute);

// ======================
// Error Handlers
// ======================

// 404 handler for undefined routes (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ======================
// Start Server
// ======================

const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log('='.repeat(50));
  console.log('🚀 Personal Job Portal API Server');
  console.log('='.repeat(50));
  console.log(`📍 Port: ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Security: Enabled (Helmet, CORS, Rate Limiting)`);
  console.log(
    `📝 Logging: ${process.env.NODE_ENV === 'production' ? 'Production' : 'Development'} mode`
  );
  console.log(`⏰ Started: ${new Date().toLocaleString()}`);
  console.log('='.repeat(50));

  // Start background scrape scheduler
  startScheduler();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

export default app;
