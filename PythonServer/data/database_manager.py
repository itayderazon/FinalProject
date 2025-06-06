# src/data/database_manager.py - Simple database manager without pools

import psycopg2
import psycopg2.extras
import os
import time

class DatabaseManager:
    """Simple database connection manager"""
    
    def __init__(self):
        self.max_retries = 3
        self.retry_delay = 1.0
        self.is_connected = False
        
        # Database configuration from environment
        self.host = os.getenv('POSTGRES_HOST', 'localhost')
        self.database = os.getenv('POSTGRES_DB', 'nutrition_app')
        self.user = os.getenv('POSTGRES_USER', 'nutrition_user')
        self.password = os.getenv('POSTGRES_PASSWORD', 'nutrition_password')
        self.port = int(os.getenv('POSTGRES_PORT', '5432'))
        
        # Connection string
        self.connection_string = f"host={self.host} port={self.port} dbname={self.database} user={self.user} password={self.password}"
    
    def connect(self):
        """Test database connection with retry logic"""
        for attempt in range(self.max_retries):
            try:
                print(f"Database connection attempt {attempt + 1}/{self.max_retries}")
                
                # Test connection
                conn = psycopg2.connect(self.connection_string)
                cursor = conn.cursor()
                cursor.execute('SELECT 1')
                cursor.fetchone()
                cursor.close()
                conn.close()
                
                self.is_connected = True
                print("✅ Database connected successfully")
                return True
                
            except Exception as e:
                print(f"Database connection failed (attempt {attempt + 1}): {e}")
                if attempt == self.max_retries - 1:
                    print("❌ Database connection failed after all retries")
                    return False
                
                # Wait before retry
                sleep_time = self.retry_delay * (2 ** attempt)
                print(f"Retrying in {sleep_time} seconds...")
                time.sleep(sleep_time)
        
        return False
    
    def get_connection(self):
        """Get a new database connection"""
        return psycopg2.connect(self.connection_string)
    
    def execute_query(self, query, params=None):
        """Execute query with error handling"""
        if not self.is_connected:
            if not self.connect():
                raise Exception("Cannot execute query: database not connected")
        
        conn = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cursor.execute(query, params)
            
            # Check if it's a SELECT query
            if cursor.description:
                results = cursor.fetchall()
                cursor.close()
                conn.close()
                return results
            else:
                # INSERT/UPDATE/DELETE
                conn.commit()
                cursor.close()
                conn.close()
                return []
        
        except Exception as e:
            print(f"Query execution failed: {e}")
            if conn:
                try:
                    conn.rollback()
                    conn.close()
                except:
                    pass
            raise
    
    def execute_single(self, query, params=None):
        """Execute query and return single result"""
        results = self.execute_query(query, params)
        if results:
            return results[0]
        return None
    
    def health_check(self):
        """Check if database is healthy"""
        try:
            result = self.execute_single("SELECT NOW() as current_time")
            return result is not None
        except:
            return False
    
    def close(self):
        """Close connections (no-op for simple manager)"""
        self.is_connected = False
        print("Database connection manager closed")

# Simple factory function
def create_database_manager():
    """Create and connect database manager"""
    db_manager = DatabaseManager()
    if not db_manager.connect():
        raise Exception("Failed to connect to database")
    return db_manager