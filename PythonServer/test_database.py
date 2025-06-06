#!/usr/bin/env python3
# test_database.py - Simple script to test database connection

import os
import sys

# Add the project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_database_connection():
    """Test database connection and basic functionality"""
    print("🧪 Testing Database Connection...")
    
    try:
        # Import our database manager
        from data.database_manager import create_database_manager
        
        # Create and test connection
        print("1. Creating database manager...")
        db_manager = create_database_manager()
        
        print("2. Testing health check...")
        if db_manager.health_check():
            print("✅ Database health check passed")
        else:
            print("❌ Database health check failed")
            return False
        
        print("3. Testing basic query...")
        result = db_manager.execute_single("SELECT COUNT(*) as count FROM products")
        if result:
            print(f"✅ Found {result['count']} products in database")
        else:
            print("❌ No products found")
        
        print("4. Testing food provider...")
        from data.sql_providers import SqlFoodProvider
        food_provider = SqlFoodProvider(db_manager)
        
        stats = food_provider.get_provider_stats()
        print(f"✅ Food provider stats: {stats['total_foods']} foods, {stats['total_categories']} categories")
        
        if stats['total_foods'] == 0:
            print("⚠️ Warning: No foods available for menu generation")
        
        print("5. Testing price comparison...")
        from data.sql_providers import SqlPriceComparison
        price_comparison = SqlPriceComparison(db_manager)
        
        supermarkets = price_comparison.get_available_supermarkets()
        print(f"✅ Price comparison: {len(supermarkets)} supermarkets available")
        print(f"   Supermarkets: {', '.join(supermarkets)}")
        
        print("6. Cleaning up...")
        db_manager.close()
        
        print("\n🎉 All database tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_app_service():
    """Test the full app service initialization"""
    print("\n🧪 Testing App Service...")
    
    try:
        from src.api.services.app_service import app_service
        
        print("1. Initializing app service...")
        if app_service.initialize():
            print("✅ App service initialized successfully")
        else:
            print("❌ App service initialization failed")
            return False
        
        print("2. Testing health status...")
        health = app_service.get_health_status()
        print(f"   Database: {health['database']}")
        print(f"   Menu Generator: {health['menu_generator']}")
        print(f"   Price Comparison: {health['price_comparison']}")
        print(f"   Overall: {health['overall']}")
        
        if health['overall'] == 'healthy':
            print("✅ All services are healthy")
        else:
            print("⚠️ Some services are not healthy")
        
        print("3. Testing menu generation...")
        from src.models.nutrition import NutritionInfo
        
        target_nutrition = NutritionInfo(2000, 150, 250, 67)
        menus = app_service.menu_generator.generate_menu(target_nutrition, 'lunch', 5)
        
        if menus:
            print(f"✅ Generated {len(menus)} test menus")
            best_menu, score = menus[0]
            print(f"   Best menu: {len(best_menu.items)} items, score: {score:.3f}")
        else:
            print("❌ Failed to generate test menu")
        
        print("4. Shutting down...")
        app_service.shutdown()
        
        print("\n🎉 App service test completed!")
        return True
        
    except Exception as e:
        print(f"❌ App service test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("Database and Service Testing")
    print("=" * 50)
    
    # Test database connection first
    db_success = test_database_connection()
    
    if db_success:
        # Test full app service
        app_success = test_app_service()
        
        if app_success:
            print("\n🎉 All tests passed! Your application is ready to use.")
            sys.exit(0)
        else:
            print("\n❌ App service tests failed.")
            sys.exit(1)
    else:
        print("\n❌ Database tests failed. Check your database connection.")
        print("\nTroubleshooting:")
        print("1. Make sure PostgreSQL is running: docker-compose up -d")
        print("2. Check environment variables in .env file")
        print("3. Verify database is seeded: npm run seed")
        sys.exit(1)