-- Migration to add activity_level and dietary_goal columns to user_nutrition_profiles table
-- Run this script to fix the missing columns

ALTER TABLE user_nutrition_profiles 
ADD COLUMN IF NOT EXISTS activity_level VARCHAR(20),
ADD COLUMN IF NOT EXISTS dietary_goal VARCHAR(20);

-- Update any existing records with default values if needed
UPDATE user_nutrition_profiles 
SET activity_level = 'moderately_active' 
WHERE activity_level IS NULL;

UPDATE user_nutrition_profiles 
SET dietary_goal = 'maintain' 
WHERE dietary_goal IS NULL; 