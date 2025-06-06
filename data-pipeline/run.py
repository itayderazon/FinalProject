#!/usr/bin/env python3
"""
==========================================
FILE LOCATION: data-pipeline/run.py
ACTION: CREATE NEW FILE

Simple CLI interface for running the data pipeline
Usage: python run.py --load-all
==========================================
"""

import argparse
import os
import sys
from pathlib import Path
import logging

# Add the data-pipeline directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from loader import DynamicDataLoader

def setup_logging(verbose=False):
    """Setup logging configuration"""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler('data_pipeline.log')
        ]
    )

def get_db_config():
    """Get database configuration from environment"""
    return {
        'host': os.getenv('POSTGRES_HOST', 'localhost'),
        'port': int(os.getenv('POSTGRES_PORT', '5432')),
        'database': os.getenv('POSTGRES_DB', 'nutrition_app'),
        'user': os.getenv('POSTGRES_USER', 'nutrition_user'),
        'password': os.getenv('POSTGRES_PASSWORD', 'nutrition_password')
    }

def find_data_directory():
    """Auto-discover data directory"""
    possible_paths = [
        os.getenv('DATA_DIRECTORY'),
        '../data',
        './data',
        '../../data',
        '../data/Final_Data',
    ]
    
    for path in possible_paths:
        if path and Path(path).exists():
            return str(Path(path).resolve())
    
    raise FileNotFoundError(
        "Could not find data directory. Please set DATA_DIRECTORY environment variable "
        "or ensure data directory exists at ../data"
    )

def main():
    parser = argparse.ArgumentParser(
        description='Dynamic JSON Data Pipeline for Nutrition Database',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run.py --load-all                    # Load all JSON data
  python run.py --data-dir /path/to/data     # Specify data directory
  python run.py --load-all --verbose         # Verbose output
  
Environment Variables:
  POSTGRES_HOST      Database host (default: localhost)
  POSTGRES_PORT      Database port (default: 5432)
  POSTGRES_DB        Database name (default: nutrition_app)
  POSTGRES_USER      Database user (default: nutrition_user)
  POSTGRES_PASSWORD  Database password (default: nutrition_password)
  DATA_DIRECTORY     Path to JSON data files (default: ../data)
        """
    )
    
    parser.add_argument(
        '--load-all',
        action='store_true',
        help='Load all data from JSON files'
    )
    
    parser.add_argument(
        '--data-dir',
        type=str,
        help='Path to directory containing JSON data files'
    )
    
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Enable verbose logging'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be done without making changes'
    )
    
    args = parser.parse_args()
    
    # Setup logging
    setup_logging(args.verbose)
    logger = logging.getLogger(__name__)
    
    # Validate arguments
    if not args.load_all:
        parser.print_help()
        print("\n❌ Error: Please specify --load-all")
        sys.exit(1)
    
    try:
        # Get configuration
        db_config = get_db_config()
        data_directory = args.data_dir or find_data_directory()
        
        logger.info("🚀 Starting Dynamic Data Pipeline")
        logger.info(f"📁 Data directory: {data_directory}")
        logger.info(f"🗄️ Database: {db_config['host']}:{db_config['port']}/{db_config['database']}")
        
        if args.dry_run:
            logger.info("🔍 DRY RUN MODE - No changes will be made")
            # TODO: Add dry-run functionality
            return
        
        # Create and run loader
        loader = DynamicDataLoader(db_config)
        loader.load_all_data(data_directory)
        
        logger.info("✅ Data pipeline completed successfully!")
        
    except FileNotFoundError as e:
        logger.error(f"❌ File not found: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Pipeline failed: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()