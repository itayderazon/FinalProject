const { Pool } = require('pg');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// PostgreSQL connection configuration
const connectionConfig = {
  user: process.env.POSTGRES_USER || 'nutrition_user',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'nutrition_app',
  password: process.env.POSTGRES_PASSWORD || 'nutrition_password',
  port: process.env.POSTGRES_PORT || 5432,
  
  // Connection pool settings
  max: 20,                      // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,     // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000 // Increased to 10 seconds
};

console.log('🔧 Database connection config:', {
  user: connectionConfig.user,
  host: connectionConfig.host,
  database: connectionConfig.database,
  port: connectionConfig.port,
  // Don't log password for security
});

const pool = new Pool(connectionConfig);

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('💥 Unexpected error on idle PostgreSQL client', err);
  // Log error but don't exit process - let the application handle it gracefully
  // Only exit in production if it's a critical connection failure
  if (process.env.NODE_ENV === 'production' && err.code === 'ECONNREFUSED') {
    console.error('❌ Critical database connection failure in production');
    process.exit(1);
  }
});

// Test connection on startup
console.log('🔌 Testing PostgreSQL connection...');
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ PostgreSQL connection failed:', err.message);
    console.error('❌ Full error:', err);
  } else {
    console.log('✅ PostgreSQL connected successfully');
    console.log('📅 Database time:', res.rows[0].now);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔄 Closing PostgreSQL connection pool...');
  pool.end(() => {
    console.log('✅ PostgreSQL connection pool closed');
    process.exit(0);
  });
});

module.exports = pool;