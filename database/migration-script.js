#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');
const mongoose = require('mongoose');

// Import your existing MongoDB models
const Product = require('../NodeServer/models/Product');
const ProductPrice = require('../NodeServer/models/ProductPrice');
const User = require('../NodeServer/models/User');
const NutritionLog = require('../NodeServer/models/NutritionLog');

class DatabaseMigration {
  constructor() {
    // PostgreSQL connection
    this.pgPool = new Pool({
      user: process.env.POSTGRES_USER || 'nutrition_user',
      host: process.env.POSTGRES_HOST || 'localhost',
      database: process.env.POSTGRES_DB || 'nutrition_app',
      password: process.env.POSTGRES_PASSWORD || 'nutrition_password',
      port: process.env.POSTGRES_PORT || 5432,
    });

    // MongoDB connection
    this.mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/nutrition-app';
    
    this.stats = {
      usersProcessed: 0,
      productsProcessed: 0,
      pricesProcessed: 0,
      nutritionLogsProcessed: 0,
      categoriesProcessed: 0,
      subcategoriesProcessed: 0,
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

    // Final_Data paths
    this.nutritionDataPath = path.join(__dirname, '../data/Final_Data/nutrition_data.json');
    this.categoriesDataPath = path.join(__dirname, '../data/Final_Data/categories_extracted.json');
    this.pricesDataPath = path.join(__dirname, '../data/src/combined_prices_all.json');
  }

  async connectMongoDB() {
    try {
      await mongoose.connect(this.mongoUri);
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
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
        this.stats.subcategoriesProcessed++;
        console.log(`Created subcategory: ${subcategoryNameHe} -> ${nameEn}`);
      }
      
      return subcategoryId;
    } catch (error) {
      console.error(`Error creating subcategory ${subcategoryNameHe}:`, error);
      return null;
    }
  }

  translateSubcategoryToEnglish(hebrewName) {
    // Basic translation mapping - you can expand this
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

  // Step 1: Migrate Users (if any exist in MongoDB)
  async migrateUsers() {
    console.log('\n📄 Migrating Users...');
    
    try {
      const users = await User.find({});
      console.log(`Found ${users.length} users to migrate`);

      for (const user of users) {
        try {
          // Insert user
          const userResult = await this.pgPool.query(`
            INSERT INTO users (email, password_hash, name, display_name, profile_picture, role, is_active, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (email) DO UPDATE SET 
              name = EXCLUDED.name,
              display_name = EXCLUDED.display_name,
              updated_at = NOW()
            RETURNING id
          `, [
            user.email,
            user.password,
            user.name,
            user.displayname,
            user.profilePicture,
            user.role,
            user.isActive,
            user.createdAt || new Date()
          ]);

          const userId = userResult.rows[0].id;

          // Insert nutrition profile if exists
          if (user.nutritionProfile) {
            const profile = user.nutritionProfile;
            
            // Find activity level ID
            let activityLevelId = null;
            if (profile.activityLevel) {
              const activityResult = await this.pgPool.query(
                'SELECT id FROM activity_levels WHERE code = $1',
                [profile.activityLevel]
              );
              activityLevelId = activityResult.rows[0]?.id;
            }

            await this.pgPool.query(`
              INSERT INTO user_nutrition_profiles (
                user_id, height, weight, age, gender, activity_level_id, 
                dietary_goal, daily_calorie_goal, macro_goals
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              ON CONFLICT (user_id) DO UPDATE SET
                height = EXCLUDED.height,
                weight = EXCLUDED.weight,
                age = EXCLUDED.age,
                gender = EXCLUDED.gender,
                activity_level_id = EXCLUDED.activity_level_id,
                dietary_goal = EXCLUDED.dietary_goal,
                daily_calorie_goal = EXCLUDED.daily_calorie_goal,
                macro_goals = EXCLUDED.macro_goals,
                updated_at = NOW()
            `, [
              userId,
              profile.height,
              profile.weight,
              profile.age,
              profile.gender,
              activityLevelId,
              profile.dietaryGoal,
              profile.dailyCalorieGoal,
              JSON.stringify(profile.macroGoals || {})
            ]);
          }

          this.stats.usersProcessed++;
          
        } catch (error) {
          console.error(`Error migrating user ${user.email}:`, error);
          this.stats.errors.push(`User ${user.email}: ${error.message}`);
        }
      }

      console.log(`✅ Migrated ${this.stats.usersProcessed} users`);
      
    } catch (error) {
      console.error('❌ User migration failed:', error);
      throw error;
    }
  }

  // Step 2: Migrate Products from Final_Data
  async migrateProductsFromFinalData() {
    console.log('\n📦 Migrating Products from Final_Data...');
    
    try {
      // Read nutrition data from Final_Data
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
              total_carbs: item.total_carbs,
              total_fat: item.total_fat,
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
            console.error(`Error migrating product ${item.item_code}:`, error);
            this.stats.errors.push(`Product ${item.item_code}: ${error.message}`);
          }
        }));

        console.log(`Processed ${Math.min(i + batchSize, nutritionData.length)} / ${nutritionData.length} products`);
      }

      this.stats.productsProcessed = processed;
      console.log(`✅ Migrated ${processed} products from Final_Data`);
      
    } catch (error) {
      console.error('❌ Product migration failed:', error);
      throw error;
    }
  }

  // Step 3: Migrate Price History from combined_prices_all.json
  async migratePriceHistory() {
    console.log('\n💰 Migrating Price History...');
    
    try {
      // Check if price file exists
      try {
        await fs.access(this.pricesDataPath);
      } catch {
        console.log('⚠️ Price data file not found, skipping price migration');
        return;
      }

      const priceData = JSON.parse(await fs.readFile(this.pricesDataPath, 'utf8'));
      console.log(`Found ${priceData.length} price records to process`);

      // Store field mapping from combined_prices_all.json structure
      const storeFieldMapping = {
        'shufersal price': 'Shufersal',
        'rami levi price': 'Rami Levy', 
        'victory price': 'Victory',
        'tiv taam price': 'Tiv Taam',
        'carrefour price': 'Carrefour',
        'yeinot bitan price': 'Yeinot Bitan'
      };

      let processed = 0;

      for (const item of priceData) {
        try {
          if (!item.ItemCode) continue;

          // Find product by item code
          const productResult = await this.pgPool.query(
            'SELECT id FROM products WHERE item_code = $1',
            [item.ItemCode]
          );

          if (!productResult.rows[0]) {
            // Product not found, skip
            continue;
          }

          const productId = productResult.rows[0].id;

          // Process each store's price
          for (const [priceField, storeName] of Object.entries(storeFieldMapping)) {
            const price = item[priceField];
            
            if (price && price > 0) {
              // Find supermarket ID
              const storeResult = await this.pgPool.query(
                'SELECT id FROM supermarkets WHERE name = $1',
                [storeName]
              );

              if (storeResult.rows[0]) {
                const supermarketId = storeResult.rows[0].id;

                // Insert price record
                await this.pgPool.query(`
                  INSERT INTO price_history (
                    product_id, supermarket_id, price, currency, recorded_at
                  )
                  VALUES ($1, $2, $3, $4, NOW())
                  ON CONFLICT (product_id, supermarket_id, DATE(NOW())) 
                  DO UPDATE SET price = EXCLUDED.price
                `, [productId, supermarketId, price, 'ILS']);

                processed++;
              }
            }
          }
          
        } catch (error) {
          console.error(`Error migrating prices for ${item.ItemCode}:`, error);
          this.stats.errors.push(`Price for ${item.ItemCode}: ${error.message}`);
        }
      }

      this.stats.pricesProcessed = processed;
      console.log(`✅ Migrated ${processed} price records`);
      
    } catch (error) {
      console.error('❌ Price migration failed:', error);
      throw error;
    }
  }

  // Step 4: Migrate Nutrition Logs (if any exist in MongoDB)
  async migrateNutritionLogs() {
    console.log('\n📊 Migrating Nutrition Logs...');
    
    try {
      const nutritionLogs = await NutritionLog.find({});
      console.log(`Found ${nutritionLogs.length} nutrition logs to migrate`);

      for (const log of nutritionLogs) {
        try {
          // Find user in PostgreSQL
          const userResult = await this.pgPool.query(
            'SELECT id FROM users WHERE id = $1',
            [log.userId]
          );

          if (!userResult.rows[0]) {
            console.warn(`User ${log.userId} not found for nutrition log`);
            continue;
          }

          const userId = userResult.rows[0].id;

          // Calculate daily totals
          let totalCalories = 0;
          let totalProtein = 0;
          let totalCarbs = 0;
          let totalFat = 0;

          log.meals.forEach(meal => {
            meal.foods.forEach(food => {
              totalCalories += food.calories || 0;
              totalProtein += food.macros?.protein || 0;
              totalCarbs += food.macros?.carbs || 0;
              totalFat += food.macros?.fat || 0;
            });
          });

          // Insert nutrition log
          const logResult = await this.pgPool.query(`
            INSERT INTO nutrition_logs (
              user_id, log_date, total_calories, total_protein, 
              total_carbs, total_fat, water_intake
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (user_id, log_date) DO UPDATE SET
              total_calories = EXCLUDED.total_calories,
              total_protein = EXCLUDED.total_protein,
              total_carbs = EXCLUDED.total_carbs,
              total_fat = EXCLUDED.total_fat,
              water_intake = EXCLUDED.water_intake,
              updated_at = NOW()
            RETURNING id
          `, [
            userId,
            log.date,
            Math.round(totalCalories),
            Math.round(totalProtein * 100) / 100,
            Math.round(totalCarbs * 100) / 100,
            Math.round(totalFat * 100) / 100,
            log.waterIntake || 0
          ]);

          const nutritionLogId = logResult.rows[0].id;

          // Insert meals and their foods
          for (const meal of log.meals) {
            const mealResult = await this.pgPool.query(`
              INSERT INTO nutrition_log_meals (nutrition_log_id, meal_type)
              VALUES ($1, $2)
              RETURNING id
            `, [nutritionLogId, meal.type]);

            const mealId = mealResult.rows[0].id;

            // Insert food items
            for (const food of meal.foods) {
              await this.pgPool.query(`
                INSERT INTO nutrition_log_items (
                  meal_id, custom_food_name, quantity, unit, calories, protein, carbs, fat
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              `, [
                mealId,
                food.name,
                food.quantity || 100,
                food.unit || 'grams',
                Math.round(food.calories || 0),
                Math.round((food.macros?.protein || 0) * 100) / 100,
                Math.round((food.macros?.carbs || 0) * 100) / 100,
                Math.round((food.macros?.fat || 0) * 100) / 100
              ]);
            }
          }

          this.stats.nutritionLogsProcessed++;
          
        } catch (error) {
          console.error(`Error migrating nutrition log ${log._id}:`, error);
          this.stats.errors.push(`Nutrition log ${log._id}: ${error.message}`);
        }
      }

      console.log(`✅ Migrated ${this.stats.nutritionLogsProcessed} nutrition logs`);
      
    } catch (error) {
      console.error('❌ Nutrition log migration failed:', error);
      throw error;
    }
  }

  // Step 5: Validate Migration
  async validateMigration() {
    console.log('\n🔍 Validating Migration...');
    
    try {
      // Count records in PostgreSQL
      const results = await Promise.all([
        this.pgPool.query('SELECT COUNT(*) FROM users'),
        this.pgPool.query('SELECT COUNT(*) FROM products'),
        this.pgPool.query('SELECT COUNT(*) FROM categories'),
        this.pgPool.query('SELECT COUNT(*) FROM subcategories'),
        this.pgPool.query('SELECT COUNT(*) FROM price_history'),
        this.pgPool.query('SELECT COUNT(*) FROM nutrition_logs'),
        this.pgPool.query('SELECT COUNT(*) FROM products WHERE can_include_in_menu = true'),
        this.pgPool.query(`SELECT COUNT(*) FROM products WHERE nutrition->>'calories' IS NOT NULL`),
      ]);

      const [users, products, categories, subcategories, prices, nutritionLogs, menuEligible, withNutrition] = 
        results.map(r => parseInt(r.rows[0].count));

      console.log('\n📊 Final Migration Results:');
      console.log(`Users: ${users}`);
      console.log(`Products: ${products}`);
      console.log(`Categories: ${categories}`);
      console.log(`Subcategories: ${subcategories}`);
      console.log(`Price Records: ${prices}`);
      console.log(`Nutrition Logs: ${nutritionLogs}`);
      console.log('');
      console.log('📈 Data Quality:');
      console.log(`Products with nutrition data: ${withNutrition}/${products} (${Math.round((withNutrition/products)*100)}%)`);
      console.log(`Menu eligible products: ${menuEligible}/${products} (${Math.round((menuEligible/products)*100)}%)`);
      
    } catch (error) {
      console.error('❌ Validation failed:', error);
      throw error;
    }
  }

  // Main migration function
  async migrate() {
    console.log('🚀 Starting Database Migration from Final_Data...\n');
    
    try {
      // Connect to databases
      await this.connectMongoDB();
      await this.connectPostgreSQL();

      // Run migration steps
      await this.migrateUsers();
      await this.migrateProductsFromFinalData();
      await this.migratePriceHistory();
      await this.migrateNutritionLogs();
      
      // Validate results
      await this.validateMigration();

      console.log('\n📈 Migration Statistics:');
      console.log(`Users processed: ${this.stats.usersProcessed}`);
      console.log(`Products processed: ${this.stats.productsProcessed}`);
      console.log(`Subcategories created: ${this.stats.subcategoriesProcessed}`);
      console.log(`Prices processed: ${this.stats.pricesProcessed}`);
      console.log(`Nutrition logs processed: ${this.stats.nutritionLogsProcessed}`);
      console.log(`Errors: ${this.stats.errors.length}`);

      if (this.stats.errors.length > 0) {
        console.log('\n❌ Errors encountered:');
        this.stats.errors.slice(0, 10).forEach(error => console.log(`  - ${error}`));
        if (this.stats.errors.length > 10) {
          console.log(`  ... and ${this.stats.errors.length - 10} more errors`);
        }
      }

      console.log('\n✅ Migration completed successfully!');
      console.log('\n🎯 Next Steps:');
      console.log('1. Update your Node.js application to use PostgreSQL');
      console.log('2. Test the new database with your application');
      console.log('3. Add image URLs to products when ready');
      console.log('4. Set up regular price updates from supermarket APIs');
      
    } catch (error) {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    } finally {
      // Close connections
      await mongoose.disconnect();
      await this.pgPool.end();
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const migration = new DatabaseMigration();
  migration.migrate().catch(console.error);
}

module.exports = DatabaseMigration; 