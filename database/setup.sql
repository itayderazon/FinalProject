-- ==========================================
-- PostgreSQL Database Setup for Nutrition App
-- ==========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Full-text search
CREATE EXTENSION IF NOT EXISTS "btree_gin";      -- Better indexing

-- Create schemas for organization
CREATE SCHEMA IF NOT EXISTS nutrition;
CREATE SCHEMA IF NOT EXISTS commerce;
CREATE SCHEMA IF NOT EXISTS users;

-- Set search path
SET search_path TO public, nutrition, commerce, users;

-- ==========================================
-- LOOKUP TABLES
-- ==========================================

-- Categories (Hebrew + English mapping for current Final_Data structure)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name_he VARCHAR(100) NOT NULL UNIQUE,
    name_en VARCHAR(100) NOT NULL,
    description TEXT,
    is_food BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert categories based on Final_Data structure
INSERT INTO categories (name_he, name_en, is_food) VALUES
('אורגני ובריאות', 'organic_health', true),
('בשר  ודגים', 'meat_fish', true),
('חטיפים ומתוקים', 'snacks_sweets', true),
('חלב ביצים וסלטים', 'dairy_eggs_salads', true),
('לחם ומאפים טריים', 'fresh_bread_bakery', true),
('משקאות', 'beverages', true),
('פארם ותינוקות', 'pharmacy_baby', false),
('פירות וירקות', 'fruits_vegetables', true),
('קטניות ודגנים', 'legumes_grains', true),
('קפואים', 'frozen', true),
('שימורים בישול ואפיה', 'canned_cooking_baking', true),
('חד-פעמי ומתכלה', 'disposable_containers', false);

-- Subcategories
CREATE TABLE subcategories (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    name_he VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category_id, name_he)
);

-- Allergens (standardized from Final_Data allergen strings)
CREATE TABLE allergens (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    name_he VARCHAR(50),
    description TEXT,
    icon VARCHAR(20)
);

-- Insert common allergens from Final_Data
INSERT INTO allergens (name, name_he, description) VALUES
('milk', 'חלב', 'Dairy products'),
('eggs', 'ביצים', 'Egg products'),
('fish', 'דגים', 'Fish products'),
('shellfish', 'פירות ים', 'Shellfish'),
('tree_nuts', 'אגוזים', 'Tree nuts'),
('peanuts', 'בוטנים', 'Peanuts'),
('wheat', 'חיטה', 'Wheat/Gluten'),
('soy', 'סויה', 'Soy products'),
('sesame', 'שומשום', 'Sesame seeds'),
('gluten', 'גלוטן', 'Gluten-containing grains');

-- Supermarkets (based on combined_prices_all.json structure)
CREATE TABLE supermarkets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    name_en VARCHAR(100),
    website VARCHAR(255),
    logo_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert supermarkets from price data
INSERT INTO supermarkets (name, name_en) VALUES
('Shufersal', 'shufersal'),
('Rami Levy', 'rami_levy'),
('Victory', 'victory'),
('Tiv Taam', 'tiv_taam'),
('Carrefour', 'carrefour'),
('Yeinot Bitan', 'yeinot_bitan');

-- Activity Levels
CREATE TABLE activity_levels (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    multiplier DECIMAL(3,2) NOT NULL,
    description TEXT
);

INSERT INTO activity_levels (code, name, multiplier, description) VALUES
('sedentary', 'Sedentary', 1.20, 'Little or no exercise'),
('lightly_active', 'Lightly Active', 1.375, 'Light exercise 1-3 days/week'),
('moderately_active', 'Moderately Active', 1.55, 'Moderate exercise 3-5 days/week'),
('very_active', 'Very Active', 1.725, 'Hard exercise 6-7 days/week'),
('extremely_active', 'Extremely Active', 1.90, 'Very hard exercise, physical job');

-- ==========================================
-- USER MANAGEMENT
-- ==========================================

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(50) NOT NULL,
    profile_picture VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Nutrition Profiles
CREATE TABLE user_nutrition_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    height INTEGER CHECK (height > 100 AND height < 300),
    weight DECIMAL(5,2) CHECK (weight > 30 AND weight < 300),
    age INTEGER CHECK (age > 13 AND age < 120),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    activity_level_id INTEGER REFERENCES activity_levels(id),
    dietary_goal VARCHAR(20) CHECK (dietary_goal IN ('maintain', 'lose', 'gain')),
    daily_calorie_goal INTEGER CHECK (daily_calorie_goal > 0),
    macro_goals JSONB CHECK (
        (macro_goals->>'protein')::numeric >= 0 AND
        (macro_goals->>'carbs')::numeric >= 0 AND
        (macro_goals->>'fat')::numeric >= 0
    ),
    dietary_restrictions INTEGER[] DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- PRODUCT CATALOG (Enhanced for Final_Data + Future Images)
-- ==========================================

-- Products table (optimized for Final_Data structure + future image URLs)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    item_code VARCHAR(50) UNIQUE NOT NULL,
    name TEXT NOT NULL,
    name_en TEXT,
    description TEXT,
    brand VARCHAR(100),
    category_id INTEGER REFERENCES categories(id),
    subcategory_id INTEGER REFERENCES subcategories(id),
    
    -- Size information (if needed for future)
    size_amount DECIMAL(10,2),
    size_unit VARCHAR(20),
    
    -- Nutrition per 100g (matching Final_Data structure exactly)
    nutrition JSONB NOT NULL DEFAULT '{}' CHECK (
        (nutrition->>'calories') IS NULL OR (nutrition->>'calories')::numeric >= 0 AND
        (nutrition->>'protein') IS NULL OR (nutrition->>'protein')::numeric >= 0 AND
        (nutrition->>'total_carbs') IS NULL OR (nutrition->>'total_carbs')::numeric >= 0 AND
        (nutrition->>'total_fat') IS NULL OR (nutrition->>'total_fat')::numeric >= 0 AND
        (nutrition->>'sodium') IS NULL OR (nutrition->>'sodium')::numeric >= 0
    ),
    
    -- Allergens array (many-to-many relationship)
    allergen_ids INTEGER[] DEFAULT '{}',
    
    -- **FUTURE: Image URLs support**
    images JSONB DEFAULT '{}' CHECK (
        images IS NULL OR 
        jsonb_typeof(images) = 'object'
    ),
    -- Structure for images: {"thumbnail": "url", "main": "url", "gallery": ["url1", "url2"]}
    
    -- Tags for search and categorization
    tags TEXT[] DEFAULT '{}',
    
    -- Menu eligibility (computed based on nutrition completeness)
    can_include_in_menu BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- PRICING SYSTEM (Time Series for combined_prices_all.json)
-- ==========================================

-- Price history (optimized for time-series queries from price data)
CREATE TABLE price_history (
    id BIGSERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    supermarket_id INTEGER NOT NULL REFERENCES supermarkets(id),
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    original_price DECIMAL(10,2), -- For sales tracking
    currency VARCHAR(3) DEFAULT 'ILS',
    is_on_sale BOOLEAN DEFAULT FALSE,
    sale_percentage INTEGER CHECK (sale_percentage >= 0 AND sale_percentage <= 100),
    availability VARCHAR(20) DEFAULT 'unknown' CHECK (availability IN ('in_stock', 'out_of_stock', 'limited', 'unknown')),
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate price records for same product/store/time
    UNIQUE(product_id, supermarket_id, DATE(recorded_at))
);

-- ==========================================
-- NUTRITION TRACKING
-- ==========================================

-- Daily nutrition logs
CREATE TABLE nutrition_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    total_calories INTEGER DEFAULT 0 CHECK (total_calories >= 0),
    total_protein DECIMAL(6,2) DEFAULT 0 CHECK (total_protein >= 0),
    total_carbs DECIMAL(6,2) DEFAULT 0 CHECK (total_carbs >= 0),
    total_fat DECIMAL(6,2) DEFAULT 0 CHECK (total_fat >= 0),
    water_intake INTEGER DEFAULT 0 CHECK (water_intake >= 0), -- in ml
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, log_date)
);

-- Individual meal entries
CREATE TABLE nutrition_log_meals (
    id SERIAL PRIMARY KEY,
    nutrition_log_id INTEGER NOT NULL REFERENCES nutrition_logs(id) ON DELETE CASCADE,
    meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    meal_time TIMESTAMPTZ,
    notes TEXT
);

-- Individual food items in meals
CREATE TABLE nutrition_log_items (
    id SERIAL PRIMARY KEY,
    meal_id INTEGER NOT NULL REFERENCES nutrition_log_meals(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    custom_food_name VARCHAR(255), -- For foods not in product catalog
    quantity DECIMAL(8,2) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(20) DEFAULT 'grams',
    calories INTEGER NOT NULL CHECK (calories >= 0),
    protein DECIMAL(6,2) DEFAULT 0,
    carbs DECIMAL(6,2) DEFAULT 0,
    fat DECIMAL(6,2) DEFAULT 0
);

-- ==========================================
-- INDEXES (Optimized for Final_Data queries)
-- ==========================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- Product indexes (optimized for Final_Data structure)
CREATE INDEX idx_products_item_code ON products(item_code);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_subcategory ON products(subcategory_id);
CREATE INDEX idx_products_menu_eligible ON products(can_include_in_menu) WHERE can_include_in_menu = true;
CREATE INDEX idx_products_name_search ON products USING gin(to_tsvector('hebrew', coalesce(name, '')));
CREATE INDEX idx_products_nutrition_calories ON products USING gin((nutrition->'calories'));
CREATE INDEX idx_products_allergens ON products USING gin(allergen_ids);

-- Price history indexes (for efficient price comparisons)
CREATE INDEX idx_price_history_product_time ON price_history(product_id, recorded_at DESC);
CREATE INDEX idx_price_history_supermarket_time ON price_history(supermarket_id, recorded_at DESC);
CREATE INDEX idx_price_history_recorded_at ON price_history(recorded_at DESC);
CREATE INDEX idx_price_history_latest ON price_history(product_id, supermarket_id, recorded_at DESC);

-- Nutrition tracking indexes
CREATE INDEX idx_nutrition_logs_user_date ON nutrition_logs(user_id, log_date DESC);
CREATE INDEX idx_nutrition_log_meals_log_id ON nutrition_log_meals(nutrition_log_id);
CREATE INDEX idx_nutrition_log_items_meal_id ON nutrition_log_items(meal_id);
CREATE INDEX idx_nutrition_log_items_product ON nutrition_log_items(product_id);

-- ==========================================
-- TRIGGERS & FUNCTIONS
-- ==========================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_nutrition_profiles_updated_at BEFORE UPDATE ON user_nutrition_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_logs_updated_at BEFORE UPDATE ON nutrition_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically determine menu eligibility
CREATE OR REPLACE FUNCTION update_menu_eligibility()
RETURNS TRIGGER AS $$
BEGIN
    -- Product is menu eligible if:
    -- 1. It's in a food category (not pharmacy/baby)
    -- 2. Has calorie information
    -- 3. Is active
    NEW.can_include_in_menu = (
        NEW.is_active = true AND
        NEW.nutrition->>'calories' IS NOT NULL AND
        (NEW.nutrition->>'calories')::numeric > 0 AND
        EXISTS (
            SELECT 1 FROM categories c 
            WHERE c.id = NEW.category_id AND c.is_food = true
        )
    );
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_menu_eligibility BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_menu_eligibility(); 