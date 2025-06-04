-- ==========================================
-- Seed Data for Lookup Tables
-- ==========================================

-- Categories (from your current data)
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
('שימורים בישול ואפיה', 'canned_cooking_baking', true);

-- Subcategories (from your categories_extracted.json)
INSERT INTO subcategories (category_id, name_he, name_en) VALUES
-- אורגני ובריאות subcategories
((SELECT id FROM categories WHERE name_he = 'אורגני ובריאות'), 'אורגני וטבעוני', 'organic_vegan'),
((SELECT id FROM categories WHERE name_he = 'אורגני ובריאות'), 'ללא גלוטן', 'gluten_free'),
((SELECT id FROM categories WHERE name_he = 'אורגני ובריאות'), 'נטול ומופחת סוכר', 'sugar_free_reduced'),
((SELECT id FROM categories WHERE name_he = 'אורגני ובריאות'), 'מעדנים ללא לקטוז', 'lactose_free_desserts'),

-- בשר ודגים subcategories  
((SELECT id FROM categories WHERE name_he = 'בשר  ודגים'), 'בשר קפוא', 'frozen_meat'),
((SELECT id FROM categories WHERE name_he = 'בשר  ודגים'), 'בשרים על האש', 'grilled_meats'),
((SELECT id FROM categories WHERE name_he = 'בשר  ודגים'), 'נקניקיות ונקניקים', 'sausages_hotdogs'),
((SELECT id FROM categories WHERE name_he = 'בשר  ודגים'), 'תחליפי בשר קפואים', 'frozen_meat_substitutes'),

-- חטיפים ומתוקים subcategories
((SELECT id FROM categories WHERE name_he = 'חטיפים ומתוקים'), 'חטיפים מלוחים', 'salty_snacks'),
((SELECT id FROM categories WHERE name_he = 'חטיפים ומתוקים'), 'חטיפים מתוקים', 'sweet_snacks'),
((SELECT id FROM categories WHERE name_he = 'חטיפים ומתוקים'), 'ממתקים', 'candies'),
((SELECT id FROM categories WHERE name_he = 'חטיפים ומתוקים'), 'סוכריות ומסטיקים', 'candy_gum'),
((SELECT id FROM categories WHERE name_he = 'חטיפים ומתוקים'), 'עוגות ועוגיות', 'cakes_cookies'),
((SELECT id FROM categories WHERE name_he = 'חטיפים ומתוקים'), 'וופלים וביסקוויטים', 'waffles_biscuits'),
((SELECT id FROM categories WHERE name_he = 'חטיפים ומתוקים'), 'פיצוחים ופירות יבשים', 'nuts_dried_fruits'),

-- חלב ביצים וסלטים subcategories
((SELECT id FROM categories WHERE name_he = 'חלב ביצים וסלטים'), 'גבינות', 'cheeses'),
((SELECT id FROM categories WHERE name_he = 'חלב ביצים וסלטים'), 'חלב', 'milk'),
((SELECT id FROM categories WHERE name_he = 'חלב ביצים וסלטים'), 'חמאה מרגרינה שמנת', 'butter_margarine_cream'),
((SELECT id FROM categories WHERE name_he = 'חלב ביצים וסלטים'), 'יוגורט ומעדני חלב', 'yogurt_dairy_desserts'),
((SELECT id FROM categories WHERE name_he = 'חלב ביצים וסלטים'), 'סלטים', 'salads'),

-- לחם ומאפים טריים subcategories
((SELECT id FROM categories WHERE name_he = 'לחם ומאפים טריים'), 'לחם, פיתה, לחמניה', 'bread_pita_rolls'),

-- משקאות subcategories
((SELECT id FROM categories WHERE name_he = 'משקאות'), 'אלכוהול ואנרגיה', 'alcohol_energy'),
((SELECT id FROM categories WHERE name_he = 'משקאות'), 'משקאות במארזים', 'packaged_beverages'),
((SELECT id FROM categories WHERE name_he = 'משקאות'), 'משקאות חמים', 'hot_beverages'),
((SELECT id FROM categories WHERE name_he = 'משקאות'), 'משקאות קלים', 'soft_drinks'),

-- פארם ותינוקות subcategories
((SELECT id FROM categories WHERE name_he = 'פארם ותינוקות'), 'מזון לתינוקות', 'baby_food'),

-- קטניות ודגנים subcategories
((SELECT id FROM categories WHERE name_he = 'קטניות ודגנים'), 'אורז וקטניות', 'rice_legumes'),
((SELECT id FROM categories WHERE name_he = 'קטניות ודגנים'), 'דגנים וחטיפי אנרגיה', 'cereals_energy_bars'),
((SELECT id FROM categories WHERE name_he = 'קטניות ודגנים'), 'פסטה, פתיתים, קוסקוס', 'pasta_flakes_couscous'),

-- קפואים subcategories
((SELECT id FROM categories WHERE name_he = 'קפואים'), 'אוכל להכנה מהירה', 'ready_meals'),
((SELECT id FROM categories WHERE name_he = 'קפואים'), 'גלידות וארטיקים', 'ice_cream_popsicles'),
((SELECT id FROM categories WHERE name_he = 'קפואים'), 'ירקות, פירות וצ\'יפס קפואים', 'frozen_vegetables_fruits_chips'),
((SELECT id FROM categories WHERE name_he = 'קפואים'), 'עוף קפוא', 'frozen_chicken'),
((SELECT id FROM categories WHERE name_he = 'קפואים'), 'פיצות, מאפים ובצקים קפואים', 'frozen_pizza_pastries_dough'),
((SELECT id FROM categories WHERE name_he = 'קפואים'), 'מזון מצונן', 'chilled_food'),

-- שימורים בישול ואפיה subcategories
((SELECT id FROM categories WHERE name_he = 'שימורים בישול ואפיה'), 'דבש, ריבה וממרחים', 'honey_jam_spreads'),
((SELECT id FROM categories WHERE name_he = 'שימורים בישול ואפיה'), 'המטבח האסייאתי', 'asian_cuisine'),
((SELECT id FROM categories WHERE name_he = 'שימורים בישול ואפיה'), 'מוצרי אפיה', 'baking_products'),
((SELECT id FROM categories WHERE name_he = 'שימורים בישול ואפיה'), 'מרקים ותבשילים', 'soups_stews'),
((SELECT id FROM categories WHERE name_he = 'שימורים בישול ואפיה'), 'רטבים', 'sauces'),
((SELECT id FROM categories WHERE name_he = 'שימורים בישול ואפיה'), 'שמן, חומץ ומיץ לימון', 'oil_vinegar_lemon'),
((SELECT id FROM categories WHERE name_he = 'שימורים בישול ואפיה'), 'תבלינים', 'spices'),
((SELECT id FROM categories WHERE name_he = 'שימורים בישול ואפיה'), 'תרכיזים', 'concentrates'),
((SELECT id FROM categories WHERE name_he = 'שימורים בישול ואפיה'), 'קמח ופירורי לחם', 'flour_breadcrumbs');

-- Allergens
INSERT INTO allergens (name, description, icon) VALUES
('milk', 'Contains milk or dairy products', '🥛'),
('eggs', 'Contains eggs', '🥚'),
('fish', 'Contains fish', '🐟'),
('shellfish', 'Contains shellfish', '🦐'),
('tree_nuts', 'Contains tree nuts', '🌰'),
('peanuts', 'Contains peanuts', '🥜'),
('wheat', 'Contains wheat or gluten', '🌾'),
('soy', 'Contains soy', '🫘'),
('sesame', 'Contains sesame', '🌱'),
('gluten', 'Contains gluten', '🌾');

-- Supermarkets (based on your price data)
INSERT INTO supermarkets (name, name_en, website, is_active) VALUES
('שופרסל', 'Shufersal', 'https://www.shufersal.co.il', true),
('רמי לוי', 'Rami Levy', 'https://www.rami-levy.co.il', true),
('ויקטורי', 'Victory', 'https://www.victory.co.il', true),
('טיב טעם', 'Tiv Taam', 'https://www.tivtaam.co.il', true),
('קרפור', 'Carrefour', 'https://www.carrefour.co.il', true),
('יינות ביתן', 'Yeinot Bitan', 'https://www.yeinotbitan.co.il', true);

-- Activity Levels (for BMR/TDEE calculations)
INSERT INTO activity_levels (code, name, multiplier, description) VALUES
('sedentary', 'Sedentary (little/no exercise)', 1.2, 'Desk job, little to no exercise'),
('lightly_active', 'Lightly Active (light exercise 1-3 days/week)', 1.375, 'Light exercise or sports 1-3 days per week'),
('moderately_active', 'Moderately Active (moderate exercise 3-5 days/week)', 1.55, 'Moderate exercise or sports 3-5 days per week'),
('very_active', 'Very Active (hard exercise 6-7 days/week)', 1.725, 'Hard exercise or sports 6-7 days per week'),
('extremely_active', 'Extremely Active (very hard exercise, physical job)', 1.9, 'Very hard exercise or physical job, training twice a day');

-- Create views for easier data access
CREATE VIEW v_products_with_categories AS
SELECT 
    p.*,
    c.name_he as category_name_he,
    c.name_en as category_name_en,
    sc.name_he as subcategory_name_he,
    sc.name_en as subcategory_name_en
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN subcategories sc ON p.subcategory_id = sc.id;

CREATE VIEW v_current_prices AS
SELECT DISTINCT ON (product_id, supermarket_id)
    ph.*,
    p.name as product_name,
    p.item_code,
    s.name as supermarket_name
FROM price_history ph
JOIN products p ON ph.product_id = p.id
JOIN supermarkets s ON ph.supermarket_id = s.id
ORDER BY product_id, supermarket_id, recorded_at DESC;

CREATE VIEW v_user_profiles AS
SELECT 
    u.id,
    u.email,
    u.name,
    u.display_name,
    unp.*,
    al.name as activity_level_name,
    al.multiplier as activity_multiplier
FROM users u
LEFT JOIN user_nutrition_profiles unp ON u.id = unp.user_id
LEFT JOIN activity_levels al ON unp.activity_level_id = al.id; 