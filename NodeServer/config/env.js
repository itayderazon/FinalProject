module.exports = {
  PORT: process.env.PORT || 3001,
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // PostgreSQL Database Configuration (matching Docker setup)
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 5432,
  DB_NAME: process.env.DB_NAME || 'nutrition_app',
  DB_USER: process.env.DB_USER || 'nutrition_user',
  DB_PASSWORD: process.env.DB_PASSWORD || 'nutrition_password',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
}; 