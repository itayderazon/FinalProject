-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Full-text search
CREATE EXTENSION IF NOT EXISTS "btree_gin";      -- Better indexing

-- ==========================================
-- DYNAMIC LOOKUP TABLES
-- Will be populated from JSON files
-- ==========================================

-- Categories (discovered from nutrition_data.json)
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name_he VARCHAR(100) NOT NULL UNIQUE,
    name_en VARCHAR(100),
    is_food BOOLEAN DEFAULT TRUE,
    product_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subcategories (discovered from nutrition_data.json)
CREATE TABLE IF NOT EXISTS subcategories (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    name_he VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    product_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category_id, name_he)
);

-- Supermarkets (discovered from price field names)
CREATE TABLE IF NOT EXISTS supermarkets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    price_field_name VARCHAR(100) UNIQUE,    -- "shufersal price", "rami levi price"
    api_identifier VARCHAR(50),              -- "shufersal", "rami_levy"
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allergens (discovered from nutrition_data.json allergens arrays)
CREATE TABLE IF NOT EXISTS allergens (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    name_he VARCHAR(50),
    product_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- MAIN PRODUCT TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    item_code VARCHAR(50) UNIQUE NOT NULL,
    name TEXT NOT NULL,
    
    -- Category relationships (auto-assigned)
    category_id INTEGER REFERENCES categories(id),
    subcategory_id INTEGER REFERENCES subcategories(id),
    
    -- Nutrition data (flexible JSONB)
    nutrition JSONB DEFAULT '{}',
    
    -- Allergen relationships
    allergen_ids INTEGER[] DEFAULT '{}',
    
    -- Status and quality
    can_include_in_menu BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    data_quality_score DECIMAL(3,2) DEFAULT 0.0,
    
    -- Tracking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- PRICE HISTORY
-- ==========================================

CREATE TABLE IF NOT EXISTS price_history (
    id BIGSERIAL PRIMARY KEY,
    item_code VARCHAR(50) NOT NULL,              -- Store original ItemCode from price data
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,  -- Link to nutrition product if exists
    supermarket_id INTEGER NOT NULL REFERENCES supermarkets(id),
    
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    currency VARCHAR(3) DEFAULT 'ILS',
    
    -- Source tracking
    source_file VARCHAR(255),
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    record_date DATE DEFAULT CURRENT_DATE
);

-- Create unique index for preventing duplicates per day using item_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_price_history_unique_daily 
ON price_history(item_code, supermarket_id, record_date);

-- ==========================================
-- USER TABLES (Keep minimal for your app)
-- ==========================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(50) NOT NULL,
    profile_picture VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_nutrition_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    height INTEGER,
    weight DECIMAL(5,2),
    age INTEGER,
    gender VARCHAR(10),
    activity_level VARCHAR(20),
    dietary_goal VARCHAR(20),
    daily_calorie_goal INTEGER,
    macro_goals JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nutrition_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    total_calories INTEGER DEFAULT 0,
    total_protein DECIMAL(6,2) DEFAULT 0,
    total_carbs DECIMAL(6,2) DEFAULT 0,
    total_fat DECIMAL(6,2) DEFAULT 0,
    water_intake INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, log_date)
);

CREATE TABLE IF NOT EXISTS nutrition_log_meals (
    id SERIAL PRIMARY KEY,
    nutrition_log_id INTEGER NOT NULL REFERENCES nutrition_logs(id) ON DELETE CASCADE,
    meal_type VARCHAR(20) NOT NULL,
    meal_time TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS nutrition_log_items (
    id SERIAL PRIMARY KEY,
    meal_id INTEGER NOT NULL REFERENCES nutrition_log_meals(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    custom_food_name VARCHAR(255),
    quantity DECIMAL(8,2) NOT NULL,
    unit VARCHAR(20) DEFAULT 'grams',
    calories DECIMAL(8,2) NOT NULL,
    protein DECIMAL(6,2) DEFAULT 0,
    carbs DECIMAL(6,2) DEFAULT 0,
    fat DECIMAL(6,2) DEFAULT 0
);

-- ==========================================
-- DAILY MENU PLANNING TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS daily_menus (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    menu_date DATE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    total_calories INTEGER DEFAULT 0,
    total_protein DECIMAL(6,2) DEFAULT 0,
    total_carbs DECIMAL(6,2) DEFAULT 0,
    total_fat DECIMAL(6,2) DEFAULT 0,
    is_template BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, menu_date, name)
);

CREATE TABLE IF NOT EXISTS daily_menu_meals (
    id SERIAL PRIMARY KEY,
    daily_menu_id INTEGER NOT NULL REFERENCES daily_menus(id) ON DELETE CASCADE,
    meal_type VARCHAR(20) NOT NULL, -- 'breakfast', 'lunch', 'dinner', 'snack'
    meal_order INTEGER DEFAULT 1, -- for multiple snacks
    name VARCHAR(255),
    description TEXT,
    target_calories INTEGER DEFAULT 0,
    target_protein DECIMAL(6,2) DEFAULT 0,
    target_carbs DECIMAL(6,2) DEFAULT 0,
    target_fat DECIMAL(6,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_menu_items (
    id SERIAL PRIMARY KEY,
    daily_menu_meal_id INTEGER NOT NULL REFERENCES daily_menu_meals(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    custom_food_name VARCHAR(255),
    quantity DECIMAL(8,2) NOT NULL,
    unit VARCHAR(20) DEFAULT 'grams',
    calories DECIMAL(8,2) NOT NULL,
    protein DECIMAL(6,2) DEFAULT 0,
    carbs DECIMAL(6,2) DEFAULT 0,
    fat DECIMAL(6,2) DEFAULT 0,
    source_type VARCHAR(20) DEFAULT 'manual', -- 'generated', 'manual', 'imported'
    source_menu_id INTEGER, -- reference to saved generated menu if applicable
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- SAVED GENERATED MENUS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS saved_generated_menus (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    generation_parameters JSONB DEFAULT '{}', -- stores original generation params
    total_calories INTEGER DEFAULT 0,
    total_protein DECIMAL(6,2) DEFAULT 0,
    total_carbs DECIMAL(6,2) DEFAULT 0,
    total_fat DECIMAL(6,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_generated_menu_items (
    id SERIAL PRIMARY KEY,
    saved_menu_id INTEGER NOT NULL REFERENCES saved_generated_menus(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    custom_food_name VARCHAR(255),
    quantity DECIMAL(8,2) NOT NULL,
    unit VARCHAR(20) DEFAULT 'grams',
    calories DECIMAL(8,2) NOT NULL,
    protein DECIMAL(6,2) DEFAULT 0,
    carbs DECIMAL(6,2) DEFAULT 0,
    fat DECIMAL(6,2) DEFAULT 0,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- PROCESSING TRACKING
-- ==========================================

CREATE TABLE IF NOT EXISTS data_loads (
    id SERIAL PRIMARY KEY,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,           -- 'nutrition', 'prices', 'categories'
    status VARCHAR(20) NOT NULL,              -- 'running', 'completed', 'failed'
    
    -- Statistics
    total_records INTEGER DEFAULT 0,
    processed_records INTEGER DEFAULT 0,
    inserted_records INTEGER DEFAULT 0,
    updated_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    
    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    
    -- Results
    error_message TEXT,
    summary JSONB DEFAULT '{}'
);

-- ==========================================
-- SMART INDEXES
-- ==========================================

-- Product indexes
CREATE INDEX IF NOT EXISTS idx_products_item_code ON products(item_code);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_menu_eligible ON products(can_include_in_menu) WHERE can_include_in_menu = true;

-- JSONB nutrition index
CREATE INDEX IF NOT EXISTS idx_products_nutrition_gin ON products USING GIN(nutrition);

-- Price indexes
CREATE INDEX IF NOT EXISTS idx_price_history_item_code ON price_history(item_code);
CREATE INDEX IF NOT EXISTS idx_price_history_product_time ON price_history(product_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_supermarket_time ON price_history(supermarket_id, recorded_at DESC);

-- Text search (remove hebrew config, use simple)
CREATE INDEX IF NOT EXISTS idx_products_name_search ON products USING GIN(to_tsvector('simple', coalesce(name, '')));

-- Category indexes
CREATE INDEX IF NOT EXISTS idx_categories_name_he ON categories(name_he);
CREATE INDEX IF NOT EXISTS idx_subcategories_name_he ON subcategories(name_he);

-- For nutrition logs
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date ON nutrition_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_nutrition_log_meals_log_id ON nutrition_log_meals(nutrition_log_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_log_items_meal_id ON nutrition_log_items(meal_id);

-- For daily menus
CREATE INDEX IF NOT EXISTS idx_daily_menus_user_date ON daily_menus(user_id, menu_date);
CREATE INDEX IF NOT EXISTS idx_daily_menus_user_templates ON daily_menus(user_id, is_template) WHERE is_template = true;
CREATE INDEX IF NOT EXISTS idx_daily_menu_meals_menu_id ON daily_menu_meals(daily_menu_id);
CREATE INDEX IF NOT EXISTS idx_daily_menu_meals_type ON daily_menu_meals(meal_type);
CREATE INDEX IF NOT EXISTS idx_daily_menu_items_meal_id ON daily_menu_items(daily_menu_meal_id);
CREATE INDEX IF NOT EXISTS idx_daily_menu_items_source ON daily_menu_items(source_type, source_menu_id);

-- For saved generated menus
CREATE INDEX IF NOT EXISTS idx_saved_generated_menus_user ON saved_generated_menus(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_generated_menu_items_menu_id ON saved_generated_menu_items(saved_menu_id);

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Calculate data quality score based on available data
CREATE OR REPLACE FUNCTION calculate_data_quality_score()
RETURNS TRIGGER AS $$
DECLARE
    score DECIMAL(3,2) := 0.0;
BEGIN
    -- Basic fields (40%)
    IF NEW.item_code IS NOT NULL AND NEW.name IS NOT NULL THEN
        score := score + 0.4;
    END IF;
    
    -- Category information (20%)
    IF NEW.category_id IS NOT NULL THEN
        score := score + 0.2;
    END IF;
    
    -- Nutrition data (40%)
    IF NEW.nutrition->>'calories' IS NOT NULL THEN
        score := score + 0.2;
        
        -- Complete nutrition gets extra points
        IF NEW.nutrition->>'protein' IS NOT NULL AND 
           NEW.nutrition->>'carbs' IS NOT NULL AND 
           NEW.nutrition->>'fat' IS NOT NULL THEN
            score := score + 0.2;
        END IF;
    END IF;
    
    NEW.data_quality_score := score;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-determine menu eligibility
CREATE OR REPLACE FUNCTION update_menu_eligibility()
RETURNS TRIGGER AS $$
BEGIN
    NEW.can_include_in_menu = (
        NEW.is_active = true AND
        NEW.nutrition->>'calories' IS NOT NULL AND
        (NEW.nutrition->>'calories')::numeric > 0
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update category product counts
CREATE OR REPLACE FUNCTION update_category_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update category count
    IF NEW.category_id IS NOT NULL THEN
        UPDATE categories 
        SET product_count = (
            SELECT COUNT(*) FROM products 
            WHERE category_id = NEW.category_id AND is_active = true
        )
        WHERE id = NEW.category_id;
    END IF;
    
    -- Update subcategory count
    IF NEW.subcategory_id IS NOT NULL THEN
        UPDATE subcategories 
        SET product_count = (
            SELECT COUNT(*) FROM products 
            WHERE subcategory_id = NEW.subcategory_id AND is_active = true
        )
        WHERE id = NEW.subcategory_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- TRIGGERS
-- ==========================================

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subcategories_updated_at ON subcategories;
CREATE TRIGGER update_subcategories_updated_at 
    BEFORE UPDATE ON subcategories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_supermarkets_updated_at ON supermarkets;
CREATE TRIGGER update_supermarkets_updated_at 
    BEFORE UPDATE ON supermarkets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS calculate_products_quality_score ON products;
CREATE TRIGGER calculate_products_quality_score 
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION calculate_data_quality_score();

DROP TRIGGER IF EXISTS update_products_menu_eligibility ON products;
CREATE TRIGGER update_products_menu_eligibility 
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_menu_eligibility();

DROP TRIGGER IF EXISTS update_products_category_counts ON products;
CREATE TRIGGER update_products_category_counts 
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION update_category_counts();

-- ==========================================
-- USEFUL VIEWS
-- ==========================================

-- Complete product information
CREATE OR REPLACE VIEW v_products_complete AS
SELECT 
    p.*,
    c.name_he as category_name,
    sc.name_he as subcategory_name,
    
    -- Latest prices
    (SELECT json_agg(
        json_build_object(
            'supermarket', s.name,
            'price', ph.price,
            'recorded_at', ph.recorded_at
        ) ORDER BY ph.recorded_at DESC
    )
    FROM price_history ph
    JOIN supermarkets s ON ph.supermarket_id = s.id
    WHERE ph.product_id = p.id
    AND ph.recorded_at > NOW() - INTERVAL '30 days'
    ) as recent_prices
    
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
WHERE p.is_active = true;

-- Data summary dashboard
CREATE OR REPLACE VIEW v_data_summary AS
SELECT 
    (SELECT COUNT(*) FROM products WHERE is_active = true) as total_products,
    (SELECT COUNT(*) FROM categories) as total_categories,
    (SELECT COUNT(*) FROM subcategories) as total_subcategories,
    (SELECT COUNT(*) FROM supermarkets WHERE is_active = true) as total_supermarkets,
    (SELECT COUNT(*) FROM allergens) as total_allergens,
    (SELECT COUNT(*) FROM products WHERE can_include_in_menu = true) as menu_eligible_products,
    (SELECT AVG(data_quality_score) FROM products WHERE is_active = true) as avg_data_quality;

-- Recent data loads
CREATE OR REPLACE VIEW v_recent_loads AS
SELECT 
    file_path,
    file_type,
    status,
    processed_records,
    failed_records,
    duration_seconds,
    completed_at
FROM data_loads
ORDER BY started_at DESC
LIMIT 10;