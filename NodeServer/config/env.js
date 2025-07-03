module.exports = {
  // Server Configuration
  PORT: process.env.PORT || 3000, // Fixed to match Docker configuration
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // PostgreSQL Database Configuration (matching Docker setup)
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 5432,
  DB_NAME: process.env.DB_NAME || 'nutrition_app',
  DB_USER: process.env.DB_USER || 'nutrition_user',
  DB_PASSWORD: process.env.DB_PASSWORD || 'nutrition_password',
  
  // Python Server Configuration
  PYTHON_SERVER_URL: process.env.PYTHON_SERVER_URL || 'http://localhost:8000',
  PYTHON_TIMEOUT: parseInt(process.env.PYTHON_TIMEOUT) || 30000,
  PYTHON_RETRIES: parseInt(process.env.PYTHON_RETRIES) || 3,
  
  // CORS Configuration
  CORS_ORIGINS: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [
    'http://localhost:80',      
    'http://127.0.0.1:80',     
    'http://localhost',         
  ],
  
  // Supabase Configuration
  SUPABASE_URL: 'https://srlgswdirjnssdqkvjpq.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNybGdzd2Rpcmpuc3NkcWt2anBxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc4MzMwMSwiZXhwIjoyMDY2MzU5MzAxfQ.8MsSg7dDWodxT-SH-uLXv4eO-2cAsqhz7lxsLYx3qQg',
  SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET || 'productimages'
};