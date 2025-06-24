#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');

class JSONToPostgresSeeder {
  constructor() {
    // PostgreSQL connection
    this.pgPool = new Pool({
      user: process.env.POSTGRES_USER || 'nutrition_user',
      host: process.env.POSTGRES_HOST || 'localhost',
      database: process.env.POSTGRES_DB || 'nutrition_app',
      password: process.env.POSTGRES_PASSWORD || 'nutrition_password',
      port: process.env.POSTGRES_PORT || 5432,
    });

    this.stats = {
      productsProcessed: 0,
      pricesProcessed: 0,
      subcategoriesCreated: 0,
      errors: []
    };

    // Allergen mapping from Final_Data format
    this.allergenMapping = {
      'milk': 'milk',
      'eggs': 'eggs', 
      'fish': 'fish',
      'shellfish': 'shellfish',
      'tree_nuts': 'tree_nuts',
      'peanuts': 'peanuts',
      'wheat': 'wheat',
      'soy': 'soy',
      'sesame': 'sesame',
      'gluten': 'gluten'
    };

    // JSON file paths
    this.nutritionDataPath = path.join(__dirname, '../data/Final_Data/nutrition_data.json');
    this.categoriesDataPath = path.join(__dirname, '../data/Final_Data/categories_extracted.json');
    this.pricesDataPath = path.join(__dirname, '../data/src/clean_combined_prices.json');
  }

  async connectPostgreSQL() {
    try {
      await this.pgPool.query('SELECT NOW()');
      console.log('✅ Connected to PostgreSQL');
    } catch (error) {
      console.error('❌ PostgreSQL connection failed:', error);
      throw error;
    }
  }

  async clearExistingData() {
    console.log('\n🧹 Clearing existing data...');
    
    try {
      // Clear in order of dependencies
      await this.pgPool.query('DELETE FROM price_history');
      await this.pgPool.query('DELETE FROM nutrition_log_items');
      await this.pgPool.query('DELETE FROM nutrition_log_meals');
      await this.pgPool.query('DELETE FROM nutrition_logs');
      await this.pgPool.query('DELETE FROM products');
      await this.pgPool.query('DELETE FROM subcategories WHERE id > 0'); // Keep seeded data but allow recreating
      
      console.log('✅ Cleared existing product and price data');
    } catch (error) {
      console.error('❌ Failed to clear data:', error);
      throw error;
    }
  }

  async findCategoryId(categoryNameHe) {
    try {
      const result = await this.pgPool.query(
        'SELECT id FROM categories WHERE name_he = $1',
        [categoryNameHe]
      );
      return result.rows[0]?.id || null;
    } catch (error) {
      console.error(`Error finding category ${categoryNameHe}:`, error);
      return null;
    }
  }

  async findSubcategoryId(subcategoryNameHe, categoryId) {
    if (!subcategoryNameHe || !categoryId) return null;
    
    try {
      const result = await this.pgPool.query(
        'SELECT id FROM subcategories WHERE name_he = $1 AND category_id = $2',
        [subcategoryNameHe, categoryId]
      );
      return result.rows[0]?.id || null;
    } catch (error) {
      console.error(`Error finding subcategory ${subcategoryNameHe}:`, error);
      return null;
    }
  }

  async createSubcategoryIfNotExists(subcategoryNameHe, categoryId) {
    if (!subcategoryNameHe || !categoryId) return null;

    try {
      // First try to find existing
      let subcategoryId = await this.findSubcategoryId(subcategoryNameHe, categoryId);
      
      if (!subcategoryId) {
        // Create new subcategory
        const nameEn = this.translateSubcategoryToEnglish(subcategoryNameHe);
        const result = await this.pgPool.query(`
          INSERT INTO subcategories (category_id, name_he, name_en)
          VALUES ($1, $2, $3)
          RETURNING id
        `, [categoryId, subcategoryNameHe, nameEn]);
        
        subcategoryId = result.rows[0].id;
        this.stats.subcategoriesCreated++;
        console.log(`Created subcategory: ${subcategoryNameHe} -> ${nameEn}`);
      }
      
      return subcategoryId;
    } catch (error) {
      console.error(`Error creating subcategory ${subcategoryNameHe}:`, error);
      return null;
    }
  }

  translateSubcategoryToEnglish(hebrewName) {
    const translations = {
      'רטבים': 'sauces',
      'תחליפי בשר קפואים': 'frozen_meat_substitutes',
      'דגנים וחטיפי אנרגיה': 'cereals_energy_bars',
      'המטבח האסייאתי': 'asian_cuisine',
      'מוצרי אפיה': 'baking_products',
      'אוכל להכנה מהירה': 'ready_to_cook',
      'אורגני וטבעוני': 'organic_vegan',
      'אורז וקטניות': 'rice_legumes',
      'אלכוהול ואנרגיה': 'alcohol_energy',
      'בשר קפוא': 'frozen_meat',
      'בשרים על האש': 'grilled_meat',
      'גבינות': 'cheeses',
      'גלידות וארטיקים': 'ice_cream_popsicles',
      'דבש, ריבה וממרחים': 'honey_jam_spreads',
      'וופלים וביסקוויטים': 'waffles_biscuits',
      'חטיפים מלוחים': 'salty_snacks',
      'חטיפים מתוקים': 'sweet_snacks',
      'חלב': 'milk',
      'חמאה מרגרינה שמנת': 'butter_margarine_cream',
      'יוגורט ומעדני חלב': 'yogurt_dairy_desserts',
      'ירקות, פירות וצ\'יפס קפואים': 'frozen_vegetables_fruits_chips',
      'לחם, פיתה, לחמניה': 'bread_pita_rolls',
      'ללא גלוטן': 'gluten_free',
      'מזון לתינוקות': 'baby_food',
      'מזון מצונן': 'chilled_food',
      'ממתקים': 'sweets',
      'מעדנים ללא לקטוז': 'lactose_free_desserts',
      'מרקים ותבשילים': 'soups_stews',
      'משקאות במארזים': 'beverage_packs',
      'משקאות חמים': 'hot_beverages',
      'משקאות קלים': 'soft_drinks',
      'נטול ומופחת סוכר': 'sugar_free_reduced',
      'נקניקיות ונקניקים': 'sausages',
      'סוכריות ומסטיקים': 'candies_gum',
      'סלטים': 'salads',
      'עוגות ועוגיות': 'cakes_cookies',
      'עוף קפוא': 'frozen_chicken',
      'פיצוחים ופירות יבשים': 'nuts_dried_fruits',
      'פיצות, מאפים ובצקים קפואים': 'frozen_pizza_pastries',
      'פריכיות וקרקרים': 'crackers',
      'עטיפות, שקיות ותבניות': 'wraps_bags_containers'
    };
    
    return translations[hebrewName] || hebrewName.toLowerCase().replace(/\s+/g, '_');
  }

  mapAllergens(allergenNames) {
    if (!Array.isArray(allergenNames)) return [];
    
    return allergenNames
      .map(allergen => this.allergenMapping[allergen])
      .filter(Boolean);
  }

  async loadProductsFromJSON() {
    console.log('\n📦 Loading Products from Final_Data JSON...');
    
    try {
      // Check if file exists
      try {
        await fs.access(this.nutritionDataPath);
      } catch {
        console.error(`❌ File not found: ${this.nutritionDataPath}`);
        return;
      }

      const nutritionData = JSON.parse(await fs.readFile(this.nutritionDataPath, 'utf8'));
      console.log(`Found ${nutritionData.length} products in Final_Data`);

      let processed = 0;
      const batchSize = 100;

      for (let i = 0; i < nutritionData.length; i += batchSize) {
        const batch = nutritionData.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (item) => {
          try {
            // Skip items without required data
            if (!item.item_code || !item.name || item.name.trim() === '') {
              return;
            }

            // Find category and subcategory IDs
            const categoryId = await this.findCategoryId(item.category);
            if (!categoryId) {
              console.warn(`Category not found: ${item.category} for product ${item.item_code}`);
              return;
            }

            // Create subcategory if it doesn't exist
            const subcategoryId = await this.createSubcategoryIfNotExists(item.subcategory, categoryId);

            // Map allergens to IDs
            const allergenNames = this.mapAllergens(item.allergens || []);
            const allergenIds = [];
            
            for (const allergenName of allergenNames) {
              const result = await this.pgPool.query(
                'SELECT id FROM allergens WHERE name = $1',
                [allergenName]
              );
              if (result.rows[0]) {
                allergenIds.push(result.rows[0].id);
              }
            }

            // Prepare nutrition data exactly as in Final_Data structure
            const nutrition = {
              calories: item.calories,
              protein: item.protein,
              carbs: item.carbs,
              fat: item.fat,
              sodium: item.sodium
            };

            // Prepare images structure for future use (empty for now)
            const images = {
              thumbnail: null,
              main: null,
              gallery: []
            };

            // Insert product
            await this.pgPool.query(`
              INSERT INTO products (
                item_code, name, category_id, subcategory_id, nutrition, 
                allergen_ids, images, is_active, created_at
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
              ON CONFLICT (item_code) DO UPDATE SET
                name = EXCLUDED.name,
                category_id = EXCLUDED.category_id,
                subcategory_id = EXCLUDED.subcategory_id,
                nutrition = EXCLUDED.nutrition,
                allergen_ids = EXCLUDED.allergen_ids,
                images = EXCLUDED.images,
                updated_at = NOW()
            `, [
              item.item_code,
              item.name.trim(),
              categoryId,
              subcategoryId,
              JSON.stringify(nutrition),
              allergenIds,
              JSON.stringify(images),
              true
            ]);

            processed++;
            
          } catch (error) {
            console.error(`Error loading product ${item.item_code}:`, error);
            this.stats.errors.push(`Product ${item.item_code}: ${error.message}`);
          }
        }));

        console.log(`Processed ${Math.min(i + batchSize, nutritionData.length)} / ${nutritionData.length} products`);
      }

      this.stats.productsProcessed = processed;
      console.log(`✅ Loaded ${processed} products from Final_Data`);
      
    } catch (error) {
      console.error('❌ Product loading failed:', error);
      throw error;
    }
  }

  async loadPriceHistoryFromJSON() {
    console.log('\n💰 Loading Price History from JSON...');
    
    try {
      // Check if price file exists
      try {
        await fs.access(this.pricesDataPath);
      } catch {
        console.log('⚠️ Price data file not found, skipping price loading');
        return;
      }

      const priceData = JSON.parse(await fs.readFile(this.pricesDataPath, 'utf8'));
      console.log(`Found ${priceData.length} price records to process`);

      // Store field mapping from clean combined_prices.json structure
      const storeFieldMapping = {
        'shufersal price': 'Shufersal',
        'rami levi price': 'Rami Levy', 
        'victory price': 'Victory',
        'tivtaam price': 'Tiv Taam',
        'carrefour price': 'Carrefour',
        'yeinotbitan price': 'Yeinot Bitan'
      };

      let processed = 0;
      let skippedNoProduct = 0;
      const batchSize = 1000; // Larger batch for price data

      for (let i = 0; i < priceData.length; i += batchSize) {
        const batch = priceData.slice(i, i + batchSize);
        
        for (const item of batch) {
          try {
            if (!item.ItemCode) continue;

            // Find product by item code
            const productResult = await this.pgPool.query(
              'SELECT id FROM products WHERE item_code = $1',
              [item.ItemCode]
            );

            if (!productResult.rows[0]) {
              // Product not found, skip
              skippedNoProduct++;
              continue;
            }

            const productId = productResult.rows[0].id;

            // Process each store's price
            for (const [priceField, storeName] of Object.entries(storeFieldMapping)) {
              const price = item[priceField];
              
              // Check if price is valid (not null, undefined, and greater than 0)
              if (price && !isNaN(price) && price > 0) {
                // Find supermarket ID
                const storeResult = await this.pgPool.query(
                  'SELECT id FROM supermarkets WHERE name = $1',
                  [storeName]
                );

                if (storeResult.rows[0]) {
                  const supermarketId = storeResult.rows[0].id;

                  // Insert price record
                  await this.pgPool.query(
                    `INSERT INTO price_history (product_id, supermarket_id, price, recorded_at)
                     VALUES ($1, $2, $3, NOW())`,
                    [productId, supermarketId, price]
                  );

                  processed++;
                }
              }
            }
            
          } catch (error) {
            console.error(`Error loading prices for ${item.ItemCode}:`, error);
            this.stats.errors.push(`Price for ${item.ItemCode}: ${error.message}`);
          }
        }

        if ((i + batchSize) % 5000 === 0 || i + batchSize >= priceData.length) {
          console.log(`Processed ${Math.min(i + batchSize, priceData.length)} / ${priceData.length} price records`);
        }
      }

      this.stats.pricesProcessed = processed;
      console.log(`✅ Loaded ${processed} price records`);
      console.log(`⚠️ Skipped ${skippedNoProduct} items (product not found in nutrition data)`);
      
    } catch (error) {
      console.error('❌ Price loading failed:', error);
      throw error;
    }
  }

  async validateData() {
    console.log('\n🔍 Validating Loaded Data...');
    
    try {
      // Count records in PostgreSQL
      const results = await Promise.all([
        this.pgPool.query('SELECT COUNT(*) FROM products'),
        this.pgPool.query('SELECT COUNT(*) FROM categories'),
        this.pgPool.query('SELECT COUNT(*) FROM subcategories'),
        this.pgPool.query('SELECT COUNT(*) FROM price_history'),
        this.pgPool.query('SELECT COUNT(*) FROM products WHERE can_include_in_menu = true'),
        this.pgPool.query(`SELECT COUNT(*) FROM products WHERE nutrition->>'calories' IS NOT NULL`),
        this.pgPool.query(`
          SELECT c.name_he, COUNT(p.id) as product_count
          FROM categories c
          LEFT JOIN products p ON c.id = p.category_id
          GROUP BY c.id, c.name_he
          ORDER BY product_count DESC
        `),
      ]);

      const [products, categories, subcategories, prices, menuEligible, withNutrition, categoryBreakdown] = results;

      console.log('\n📊 Data Loading Results:');
      console.log(`Products: ${products.rows[0].count}`);
      console.log(`Categories: ${categories.rows[0].count}`);
      console.log(`Subcategories: ${subcategories.rows[0].count}`);
      console.log(`Price Records: ${prices.rows[0].count}`);
      console.log('');
      console.log('📈 Data Quality:');
      console.log(`Products with nutrition data: ${withNutrition.rows[0].count}/${products.rows[0].count} (${Math.round((withNutrition.rows[0].count/products.rows[0].count)*100)}%)`);
      console.log(`Menu eligible products: ${menuEligible.rows[0].count}/${products.rows[0].count} (${Math.round((menuEligible.rows[0].count/products.rows[0].count)*100)}%)`);
      
      console.log('\n📂 Products by Category:');
      categoryBreakdown.rows.forEach(row => {
        console.log(`  ${row.name_he}: ${row.product_count} products`);
      });
      
    } catch (error) {
      console.error('❌ Validation failed:', error);
      throw error;
    }
  }

  // Main seeding function
  async seed() {
    console.log('🚀 Starting JSON to PostgreSQL Data Loading...\n');
    
    try {
      // Connect to PostgreSQL
      await this.connectPostgreSQL();

      // Clear existing data
      await this.clearExistingData();

      // Load data from JSON files
      await this.loadProductsFromJSON();
      await this.loadPriceHistoryFromJSON();
      
      // Validate results
      await this.validateData();

      console.log('\n📈 Loading Statistics:');
      console.log(`Products processed: ${this.stats.productsProcessed}`);
      console.log(`Subcategories created: ${this.stats.subcategoriesCreated}`);
      console.log(`Prices processed: ${this.stats.pricesProcessed}`);
      console.log(`Errors: ${this.stats.errors.length}`);

      if (this.stats.errors.length > 0) {
        console.log('\n❌ Errors encountered:');
        this.stats.errors.slice(0, 10).forEach(error => console.log(`  - ${error}`));
        if (this.stats.errors.length > 10) {
          console.log(`  ... and ${this.stats.errors.length - 10} more errors`);
        }
      }

      console.log('\n✅ Data loading completed successfully!');
      console.log('\n🎯 Next Steps:');
      console.log('1. Test your Node.js application with PostgreSQL');
      console.log('2. Update your application routes and models');
      console.log('3. Add image URLs to products when ready');
      console.log('4. Set up regular price updates');
      
    } catch (error) {
      console.error('\n❌ Data loading failed:', error);
      process.exit(1);
    } finally {
      // Close PostgreSQL connection
      await this.pgPool.end();
    }
  }
}

// Run seeder if called directly
if (require.main === module) {
  const seeder = new JSONToPostgresSeeder();
  seeder.seed().catch(console.error);
}

module.exports = JSONToPostgresSeeder; 