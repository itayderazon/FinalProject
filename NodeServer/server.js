const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config/env');
require('dotenv').config();

// Import PostgreSQL connection pool
const pool = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/userPostgres');
const nutritionRoutes = require('./routes/nutrition');
const productRoutes = require('./routes/products');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
const PORT = config.PORT;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174',
    'http://127.0.0.1:5173',   // ← Add this
    'http://127.0.0.1:5174'    // ← Add this
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static('uploads'));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} - ${req.ip}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/products', productRoutes);

// Health check with database status
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const result = await pool.query('SELECT NOW() as time, COUNT(*) as products FROM products');
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'PostgreSQL connected',
      server_time: result.rows[0].time,
      total_products: result.rows[0].products
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      database: 'PostgreSQL connection failed',
      error: error.message
    });
  }
});

// Database stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM products WHERE is_active = true'),
      pool.query('SELECT COUNT(*) as menu_eligible FROM products WHERE can_include_in_menu = true'),
      pool.query('SELECT COUNT(*) as with_nutrition FROM products WHERE nutrition->\'calories\' IS NOT NULL'),
      pool.query('SELECT COUNT(*) as categories FROM categories'),
      pool.query('SELECT COUNT(*) as price_records FROM price_history'),
      pool.query('SELECT COUNT(DISTINCT supermarket_id) as supermarkets FROM price_history'),
      pool.query('SELECT COUNT(*) as users FROM users WHERE is_active = true'),
      pool.query('SELECT COUNT(*) as nutrition_logs FROM nutrition_logs')
    ]);

    res.json({
      success: true,
      stats: {
        total_products: parseInt(stats[0].rows[0].total),
        menu_eligible_products: parseInt(stats[1].rows[0].menu_eligible),
        products_with_nutrition: parseInt(stats[2].rows[0].with_nutrition),
        categories: parseInt(stats[3].rows[0].categories),
        price_records: parseInt(stats[4].rows[0].price_records),
        supermarkets: parseInt(stats[5].rows[0].supermarkets),
        active_users: parseInt(stats[6].rows[0].users),
        nutrition_logs: parseInt(stats[7].rows[0].nutrition_logs),
        database_type: 'PostgreSQL'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch database stats'
    });
  }
});

// Migration status endpoint (for development)
app.get('/api/migration-status', async (req, res) => {
  try {
    const checks = await Promise.all([
      pool.query('SELECT COUNT(*) FROM products'),
      pool.query('SELECT COUNT(*) FROM categories'),
      pool.query('SELECT COUNT(*) FROM price_history'),
      pool.query('SELECT COUNT(*) FROM subcategories'),
      pool.query('SELECT name_he, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON c.id = p.category_id GROUP BY c.id, c.name_he ORDER BY product_count DESC LIMIT 5')
    ]);

    res.json({
      success: true,
      migration_status: {
        products_loaded: parseInt(checks[0].rows[0].count),
        categories_loaded: parseInt(checks[1].rows[0].count),
        prices_loaded: parseInt(checks[2].rows[0].count),
        subcategories_loaded: parseInt(checks[3].rows[0].count),
        top_categories: checks[4].rows,
        database_ready: checks[0].rows[0].count > 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check migration status'
    });
  }
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server (no need for database connection function - pool handles it)
const startServer = async () => {
  try {
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`📈 Stats endpoint: http://localhost:${PORT}/api/stats`);
      logger.info(`🛒 Products API: http://localhost:${PORT}/api/products`);
      logger.info(`👥 Users API: http://localhost:${PORT}/api/users`);
      logger.info(`🔄 Migration status: http://localhost:${PORT}/api/migration-status`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();