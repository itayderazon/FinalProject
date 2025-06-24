const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function runMigration() {
  try {
    console.log('🔧 Running database migration...');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'add_activity_level.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute the migration
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('📝 Added activity_level and dietary_goal columns to user_nutrition_profiles table');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('🔍 Full error:', error);
  } finally {
    // Close the connection
    await pool.end();
    process.exit(0);
  }
}

// Run the migration
runMigration(); 