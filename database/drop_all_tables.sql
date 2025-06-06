#docker exec -i nutrition-postgres psql -U nutrition_user -d nutrition_app < drop_all_tables.sql

-- Drop views first
DROP VIEW IF EXISTS v_recent_loads CASCADE;
DROP VIEW IF EXISTS v_data_summary CASCADE;
DROP VIEW IF EXISTS v_products_complete CASCADE;

-- Drop nutrition tracking tables
DROP TABLE IF EXISTS nutrition_log_items CASCADE;
DROP TABLE IF EXISTS nutrition_log_meals CASCADE;
DROP TABLE IF EXISTS nutrition_logs CASCADE;

-- Drop user tables
DROP TABLE IF EXISTS user_nutrition_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop price and product tables
DROP TABLE IF EXISTS price_history CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Drop lookup tables
DROP TABLE IF EXISTS subcategories CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS supermarkets CASCADE;
DROP TABLE IF EXISTS allergens CASCADE;

-- Drop tracking tables
DROP TABLE IF EXISTS data_loads CASCADE;

-- Drop any remaining sequences
DROP SEQUENCE IF EXISTS allergens_id_seq CASCADE;
DROP SEQUENCE IF EXISTS categories_id_seq CASCADE;
DROP SEQUENCE IF EXISTS data_loads_id_seq CASCADE;
DROP SEQUENCE IF EXISTS nutrition_log_items_id_seq CASCADE;
DROP SEQUENCE IF EXISTS nutrition_log_meals_id_seq CASCADE;
DROP SEQUENCE IF EXISTS nutrition_logs_id_seq CASCADE;
DROP SEQUENCE IF EXISTS price_history_id_seq CASCADE;
DROP SEQUENCE IF EXISTS products_id_seq CASCADE;
DROP SEQUENCE IF EXISTS subcategories_id_seq CASCADE;
DROP SEQUENCE IF EXISTS supermarkets_id_seq CASCADE;
DROP SEQUENCE IF EXISTS users_id_seq CASCADE;

-- Drop any remaining functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS calculate_data_quality_score() CASCADE;
DROP FUNCTION IF EXISTS update_menu_eligibility() CASCADE;
DROP FUNCTION IF EXISTS update_category_counts() CASCADE;

-- Show remaining tables (should be empty)
SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;