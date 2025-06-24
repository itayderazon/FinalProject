-- Migration to fix calories columns from INTEGER to DECIMAL(8,2)
-- This fixes the issue where decimal calorie values cannot be inserted

-- nutrition_log_items table
ALTER TABLE nutrition_log_items 
ALTER COLUMN calories TYPE DECIMAL(8,2);

-- daily_menu_items table  
ALTER TABLE daily_menu_items
ALTER COLUMN calories TYPE DECIMAL(8,2);

-- saved_generated_menu_items table
ALTER TABLE saved_generated_menu_items
ALTER COLUMN calories TYPE DECIMAL(8,2);

-- For total_calories fields, we'll keep them as INTEGER since they represent rounded totals
-- But if you want them as DECIMAL too, uncomment these:

-- ALTER TABLE nutrition_logs 
-- ALTER COLUMN total_calories TYPE DECIMAL(8,2);

-- ALTER TABLE daily_menus
-- ALTER COLUMN total_calories TYPE DECIMAL(8,2);

-- ALTER TABLE saved_generated_menus
-- ALTER COLUMN total_calories TYPE DECIMAL(8,2);

-- ALTER TABLE daily_menu_meals
-- ALTER COLUMN target_calories TYPE DECIMAL(8,2); 