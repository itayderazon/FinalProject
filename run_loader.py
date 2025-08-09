#!/usr/bin/env python3
"""
Script to run the data loader to populate allergen IDs in the database
"""

import os
import sys
from pathlib import Path

# Add data-pipeline directory to path
current_dir = Path(__file__).parent
data_pipeline_dir = current_dir / "data-pipeline"
sys.path.insert(0, str(data_pipeline_dir))

from loader import DynamicDataLoader

def main():
    """Run the data loader"""
    print("🚀 Starting data loader to fix allergen IDs...")
    
    # Database configuration
    db_config = {
        'host': os.getenv('POSTGRES_HOST', 'localhost'),
        'port': os.getenv('POSTGRES_PORT', '5432'),
        'database': os.getenv('POSTGRES_DB', 'nutrition_app'),
        'user': os.getenv('POSTGRES_USER', 'nutrition_user'),
        'password': os.getenv('POSTGRES_PASSWORD', 'nutrition_password')
    }
    
    # Data directory - point to Final_Data
    data_directory = str(current_dir / "data" / "Final_Data")
    
    print(f"📁 Data directory: {data_directory}")
    print(f"🗄️ Database: {db_config['host']}:{db_config['port']}/{db_config['database']}")
    
    # Check if data directory exists
    if not Path(data_directory).exists():
        print(f"❌ Data directory not found: {data_directory}")
        print("Please make sure the data/Final_Data directory exists")
        return 1
    
    # Create and run loader
    loader = DynamicDataLoader(db_config)
    
    try:
        loader.load_all_data(data_directory)
        print("✅ Data loading completed successfully!")
        print("🧬 Allergen IDs should now be populated in the database")
        return 0
    except Exception as e:
        print(f"❌ Data loading failed: {e}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code) 