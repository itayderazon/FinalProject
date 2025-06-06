# src/api/services/app_service.py - Fixed with proper database management

import sys
import os

# Add the PythonServer root directory to the path
pythonserver_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
if pythonserver_root not in sys.path:
    sys.path.insert(0, pythonserver_root)

from config import get_config
from src.models.nutrition import NutritionInfo
from src.services.food_classifier import FoodClassifier
from src.services.portion_calculator import PortionCalculator
from src.services.meal_rules import MealRulesFactory
from src.algorithm.menu_generator import MenuGenerator

# Import the new database manager
from data.database_manager import create_database_manager
from data.sql_providers import SqlFoodProvider, SqlPriceComparison

class AppService:
    def __init__(self):
        self.menu_generator = None
        self.price_comparison = None
        self.db_manager = None
    
    def initialize(self):
        try:
            config = get_config('default')
            
            # Initialize database manager with retry logic
            print("🔄 Connecting to database...")
            self.db_manager = create_database_manager()
            
            # Test database health
            if not self.db_manager.health_check():
                print("❌ Database health check failed")
                return False
            
            # Initialize providers with database manager
            food_provider = SqlFoodProvider(self.db_manager)
            self.price_comparison = SqlPriceComparison(self.db_manager)
            
            # Test providers
            stats = food_provider.get_provider_stats()
            print(f"📊 Database: {stats['total_foods']} foods, {stats['total_categories']} categories")
            
            if stats['total_foods'] == 0:
                print("⚠️ Warning: No foods found in database")
            
            # Initialize services
            food_classifier = FoodClassifier(config)
            portion_calculator = PortionCalculator(config)
            meal_rules_factory = MealRulesFactory()
            
            self.menu_generator = MenuGenerator(
                food_provider, food_classifier, portion_calculator, 
                meal_rules_factory, config
            )
            
            print("✅ All services initialized successfully")
            return True
            
        except Exception as e:
            print(f"❌ Service initialization failed: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def get_health_status(self):
        """Get detailed health status of all services"""
        status = {
            'database': 'unhealthy',
            'menu_generator': 'unhealthy',
            'price_comparison': 'unhealthy',
            'overall': 'unhealthy'
        }
        
        try:
            # Check database
            if self.db_manager and self.db_manager.health_check():
                status['database'] = 'healthy'
            
            # Check menu generator
            if self.menu_generator:
                try:
                    # Quick test - get provider stats
                    stats = self.menu_generator.food_provider.get_provider_stats()
                    if stats['total_foods'] > 0:
                        status['menu_generator'] = 'healthy'
                except:
                    pass
            
            # Check price comparison
            if self.price_comparison:
                try:
                    supermarkets = self.price_comparison.get_available_supermarkets()
                    if len(supermarkets) > 0:
                        status['price_comparison'] = 'healthy'
                except:
                    pass
            
            # Overall status
            healthy_services = sum(1 for s in status.values() if s == 'healthy')
            if healthy_services >= 3:  # database + menu_generator + price_comparison
                status['overall'] = 'healthy'
            elif healthy_services >= 1:
                status['overall'] = 'degraded'
            
        except Exception as e:
            print(f"Error checking health status: {e}")
        
        return status
    
    def shutdown(self):
        """Clean shutdown of all services"""
        try:
            if self.db_manager:
                self.db_manager.close()
            print("✅ Services shut down cleanly")
        except Exception as e:
            print(f"Error during shutdown: {e}")

# Global service instance
app_service = AppService()