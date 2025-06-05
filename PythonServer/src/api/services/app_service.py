import logging
import traceback
from config import get_config
from src.models.nutrition import NutritionInfo
from src.services.food_classifier import FoodClassifier
from src.services.portion_calculator import PortionCalculator
from src.services.meal_rules import MealRulesFactory
from src.algorithm.menu_generator import MenuGenerator
from data.sql_providers import SqlFoodProvider, SqlPriceComparison

logger = logging.getLogger(__name__)

class AppService:
    def __init__(self):
        self.menu_generator = None
        self.price_comparison = None
    
    def initialize(self):
        try:
            config = get_config('default')
            
            # Initialize providers
            food_provider = SqlFoodProvider()
            self.price_comparison = SqlPriceComparison()
            
            # Test connections
            stats = food_provider.get_provider_stats()
            logger.info(f"📊 Database: {stats['total_foods']} foods")
            
            # Initialize services
            food_classifier = FoodClassifier(config)
            portion_calculator = PortionCalculator(config)
            meal_rules_factory = MealRulesFactory()
            
            self.menu_generator = MenuGenerator(
                food_provider, food_classifier, portion_calculator, 
                meal_rules_factory, config
            )
            
            logger.info("✅ All services initialized")
            return True
            
        except Exception as e:
            logger.error(f"❌ Service initialization failed: {e}")
            logger.error(traceback.format_exc())
            return False

# Global service instance
app_service = AppService()