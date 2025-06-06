const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
const ProductPrice = require('../models/ProductPrice');
const logger = require('./logger');

class FinalDataSeeder {
  constructor(config = {}) {
    this.config = {
      nutritionDataPath: config.nutritionDataPath || path.join(__dirname, '../../data/Final_Data/nutrition_data.json'),
      priceDataPath: config.priceDataPath || path.join(__dirname, '../../data/src/combined_prices_all.json'),
      clearExistingData: config.clearExistingData || false,
      batchSize: config.batchSize || 100,
      defaultCurrency: config.defaultCurrency || 'ILS',
      validCategories: config.validCategories || [
        'אורגני ובריאות',
        'בשר  ודגים', 
        'חטיפים ומתוקים',
        'חלב ביצים וסלטים',
        'לחם ומאפים טריים',
        'משקאות',
        'פארם ותינוקות',
        'פירות וירקות',
        'קטניות ודגנים',
        'קפואים',
        'שימורים בישול ואפיה'
      ],
      storeFieldMapping: config.storeFieldMapping || {
        'shufersal price': 'Shufersal',
        'rami levi price': 'Rami Levy',
        'victory price': 'Victory',
        'tivtaam price': 'Tiv Taam',
        'carrefour price': 'Carrefour',
        'yeinotbitan price': 'Yeinot Bitan'
      }
    };
    
    this.stats = {
      productsCreated: 0,
      productsUpdated: 0,
      productsSkipped: 0,
      pricesAdded: 0,
      pricesSkipped: 0,
      nutritionDataProcessed: 0,
      menuEligibleProducts: 0,
      storesPricesProcessed: {},
      errors: []
    };
  }

  // Normalize allergen names
  normalizeAllergens(allergens) {
    if (!allergens || !Array.isArray(allergens)) return [];
    
    const allergenMap = {
      'milk': 'milk',
      'dairy': 'milk',
      'חלב': 'milk',
      'eggs': 'eggs',
      'egg': 'eggs',
      'ביצים': 'eggs',
      'fish': 'fish',
      'דגים': 'fish',
      'shellfish': 'shellfish',
      'tree nuts': 'tree_nuts',
      'nuts': 'tree_nuts',
      'אגוזים': 'tree_nuts',
      'peanuts': 'peanuts',
      'peanut': 'peanuts',
      'בוטנים': 'peanuts',
      'wheat': 'wheat',
      'gluten': 'wheat',
      'חיטה': 'wheat',
      'גלוטן': 'wheat',
      'soy': 'soy',
      'soya': 'soy',
      'סויה': 'soy',
      'sesame': 'sesame',
      'שומשום': 'sesame'
    };
    
    return allergens.map(allergen => {
      const normalized = allergen.toLowerCase().trim();
      return allergenMap[normalized] || normalized;
    }).filter(allergen => allergen && this.isValidAllergen(allergen));
  }

  // Check if allergen is valid according to our schema
  isValidAllergen(allergen) {
    const validAllergens = ['milk', 'eggs', 'fish', 'shellfish', 'tree_nuts', 'peanuts', 'wheat', 'soy', 'sesame'];
    return validAllergens.includes(allergen);
  }

  // Extract brand from product name
  extractBrand(productName) {
    if (!productName) return 'כללי';
    
    const words = productName.split(/\s+/);
    if (words.length === 0) return 'כללי';
    
    // Common brand patterns to extract first word as brand
    const brandIndicators = ['פולי', 'עלית', 'מרק', 'טמפו', 'דנונה', 'יוגי'];
    
    for (const indicator of brandIndicators) {
      if (words[0].includes(indicator)) {
        return words[0];
      }
    }
    
    return 'כללי';
  }

  // Determine if a product should be eligible for menu planning
  determineMenuEligibility(item) {
    // Basic criteria for menu eligibility:
    // 1. Must have valid name
    // 2. Must be in a food category (exclude pharmacy, baby products that aren't food)
    // 3. Must have at least some nutrition information
    // 4. Must have reasonable calorie values
    
    if (!item.name || item.name.trim() === '') return false;
    
    // Non-food categories that should not be included in menus
    const nonFoodCategories = ['פארם ותינוקות'];
    const nonFoodSubcategories = [
      'מוצרי פארם', 'דאודורנט', 'שמפו, מרכך וטיפוח הגוף', 
      'סבונים', 'חד-פעמי ומתכלה', 'עטיפות, שקיות ותבניות'
    ];
    
    // Check category
    if (item.category && nonFoodCategories.includes(item.category)) {
      return false;
    }
    
    // Check subcategory
    if (item.subcategory && nonFoodSubcategories.includes(item.subcategory)) {
      return false;
    }
    
    // Must have at least calories information to be useful for menu planning
    const calories = this.parseNutritionValue(item.calories);
    if (!calories || calories <= 0) {
      return false;
    }
    
    // Special case: baby food in פארם ותינוקות but with subcategory מזון לתינוקות should be excluded from general menus
    if (item.category === 'פארם ותינוקות' && item.subcategory === 'מזון לתינוקות') {
      return false;
    }
    
    return true;
  }

  // Load nutrition data
  async loadNutritionData() {
    try {
      logger.info(`Loading nutrition data from: ${path.basename(this.config.nutritionDataPath)}`);
      
      if (!fs.existsSync(this.config.nutritionDataPath)) {
        logger.warn('Nutrition data file not found');
        return [];
      }

      const fileContent = fs.readFileSync(this.config.nutritionDataPath, 'utf8');
      const data = JSON.parse(fileContent);
      
      if (!Array.isArray(data)) {
        throw new Error('Nutrition data must be an array');
      }

      logger.info(`Loaded ${data.length} nutrition records`);
      return data;

    } catch (error) {
      logger.error('Error loading nutrition data:', error.message);
      this.stats.errors.push(`Nutrition data error: ${error.message}`);
      return [];
    }
  }

  // Load price data
  async loadPriceData() {
    try {
      logger.info(`Loading price data from: ${path.basename(this.config.priceDataPath)}`);
      
      if (!fs.existsSync(this.config.priceDataPath)) {
        logger.warn('Price data file not found');
        return [];
      }

      // Read file as text first to handle NaN values
      let fileContent = fs.readFileSync(this.config.priceDataPath, 'utf8');
      
      // Replace NaN values with "NaN" strings to make valid JSON
      fileContent = fileContent.replace(/:\s*NaN\s*,/g, ': "NaN",');
      fileContent = fileContent.replace(/:\s*NaN\s*}/g, ': "NaN"}');
      
      const data = JSON.parse(fileContent);
      
      if (!Array.isArray(data)) {
        throw new Error('Price data must be an array');
      }

      logger.info(`Loaded ${data.length} price records`);
      return data;

    } catch (error) {
      logger.error('Error loading price data:', error.message);
      this.stats.errors.push(`Price data error: ${error.message}`);
      return [];
    }
  }

  // Process and save products with nutrition data
  async processNutritionData(nutritionData) {
    logger.info('Processing nutrition data...');
    
    for (let i = 0; i < nutritionData.length; i += this.config.batchSize) {
      const batch = nutritionData.slice(i, i + this.config.batchSize);
      
      for (const item of batch) {
        try {
          // Skip items without required data
          if (!item.item_code || !item.name || item.name.trim() === '') {
            this.stats.productsSkipped++;
            continue;
          }

          // Skip products with invalid categories
          if (item.category && !this.config.validCategories.includes(item.category)) {
            this.stats.productsSkipped++;
            continue;
          }

          // Check if product already exists
          let product = await Product.findOne({ item_code: item.item_code });

          const productData = {
            item_code: item.item_code,
            name: item.name.trim(),
            category: item.category || 'שימורים בישול ואפיה',
            subcategory: item.subcategory || null,
            brand: this.extractBrand(item.name),
            nutritionInfo: {
              calories: this.parseNutritionValue(item.calories),
              protein: this.parseNutritionValue(item.protein),
              carbs: this.parseNutritionValue(item.carbs),
              fat: this.parseNutritionValue(item.fat),
              sodium: this.parseNutritionValue(item.sodium),
              serving_size: 100 // Default to 100g
            },
            allergens: this.normalizeAllergens(item.allergens),
            canIncludeInMenu: this.determineMenuEligibility(item),
            isActive: true,
            lastUpdated: new Date()
          };

          if (!product) {
            product = new Product(productData);
            await product.save();
            this.stats.productsCreated++;
          } else {
            Object.assign(product, productData);
            await product.save();
            this.stats.productsUpdated++;
          }

          // Track menu eligible products
          if (productData.canIncludeInMenu) {
            this.stats.menuEligibleProducts++;
          }

          this.stats.nutritionDataProcessed++;

          if (this.stats.nutritionDataProcessed % 100 === 0) {
            logger.info(`Processed ${this.stats.nutritionDataProcessed} nutrition records...`);
          }

        } catch (error) {
          logger.error(`Error processing nutrition item ${item.item_code}:`, error.message);
          this.stats.productsSkipped++;
          this.stats.errors.push(`Nutrition processing error: ${error.message}`);
        }
      }
    }
  }

  // Process and save price data
  async processPriceData(priceData) {
    logger.info('Processing price data...');
    logger.info(`Total price records to process: ${priceData.length}`);
    
    // Initialize store stats
    Object.values(this.config.storeFieldMapping).forEach(storeName => {
      this.stats.storesPricesProcessed[storeName] = 0;
    });
    
    // Process in smaller batches for better performance
    const effectiveBatchSize = Math.min(this.config.batchSize, 50); // Limit batch size for price processing
    
    for (let i = 0; i < priceData.length; i += effectiveBatchSize) {
      const batch = priceData.slice(i, i + effectiveBatchSize);
      logger.info(`Processing price batch ${Math.floor(i/effectiveBatchSize) + 1}/${Math.ceil(priceData.length/effectiveBatchSize)} (${i + 1}-${Math.min(i + effectiveBatchSize, priceData.length)} of ${priceData.length})`);
      
      // Get all item codes in this batch
      const itemCodes = batch.map(item => item.ItemCode).filter(code => code);
      
      // Bulk fetch existing products for this batch
      const existingProducts = await Product.find({ 
        item_code: { $in: itemCodes } 
      });
      const productMap = new Map(existingProducts.map(p => [p.item_code, p]));
      
      // Process each item in the batch
      for (const item of batch) {
        try {
          // Skip items without item code
          if (!item.ItemCode) {
            this.stats.pricesSkipped++;
            continue;
          }

          // Get or create product
          let product = productMap.get(item.ItemCode);
          
          // If product doesn't exist, create a basic one
          if (!product) {
            const productData = {
              item_code: item.ItemCode,
              name: item.name || 'Unknown Product',
              category: 'שימורים בישול ואפיה', // Default category
              brand: item.name ? this.extractBrand(item.name) : 'כללי',
              isActive: true,
              lastUpdated: new Date()
            };

            product = new Product(productData);
            await product.save();
            productMap.set(item.ItemCode, product); // Add to cache
            this.stats.productsCreated++;
          }

          // Bulk fetch existing prices for this product
          const existingPrices = await ProductPrice.find({
            product: product._id
          });
          const priceMap = new Map(existingPrices.map(p => [p.supermarket, p]));

          // Process prices for each store
          for (const [priceField, storeName] of Object.entries(this.config.storeFieldMapping)) {
            const price = item[priceField];
            
            // Skip if price is not available (NaN, null, undefined, or 0)
            if (!price || price === 'NaN' || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
              continue;
            }

            const priceData = {
              product: product._id,
              supermarket: storeName,
              price: parseFloat(price),
              currency: this.config.defaultCurrency,
              isOnSale: false,
              lastChecked: new Date()
            };

            const existingPrice = priceMap.get(storeName);
            
            if (!existingPrice) {
              const productPrice = new ProductPrice(priceData);
              await productPrice.save();
              this.stats.pricesAdded++;
              this.stats.storesPricesProcessed[storeName]++;
            } else {
              Object.assign(existingPrice, priceData);
              await existingPrice.save();
              this.stats.storesPricesProcessed[storeName]++;
            }
          }

        } catch (error) {
          logger.error(`Error processing price item ${item.ItemCode}:`, error.message);
          this.stats.pricesSkipped++;
          this.stats.errors.push(`Price processing error: ${error.message}`);
        }
      }
      
      // Log progress every batch
      logger.info(`Batch completed. Progress: ${Math.min(i + effectiveBatchSize, priceData.length)}/${priceData.length} (${Math.round((Math.min(i + effectiveBatchSize, priceData.length) / priceData.length) * 100)}%)`);
    }
  }

  // Parse nutrition values, handling null/undefined values
  parseNutritionValue(value) {
    if (value === null || value === undefined || value === '' || value === 'NaN') {
      return null;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }

  // Clear existing data if requested
  async clearExistingData() {
    if (this.config.clearExistingData) {
      logger.info('Clearing existing data...');
      await Product.deleteMany({});
      await ProductPrice.deleteMany({});
      logger.info('Existing data cleared');
    }
  }

  // Main seeding method
  async seedDatabase() {
    try {
      logger.info('Starting final data seeding...');
      
      // Clear existing data if requested
      await this.clearExistingData();

      // Load and process nutrition data
      const nutritionData = await this.loadNutritionData();
      if (nutritionData.length > 0) {
        await this.processNutritionData(nutritionData);
      }

      // Load and process price data
      const priceData = await this.loadPriceData();
      if (priceData.length > 0) {
        await this.processPriceData(priceData);
      }

      // Print final statistics
      await this.printStatistics();

      logger.info('Final data seeding completed successfully!');

    } catch (error) {
      logger.error('Final data seeding failed:', error);
      throw error;
    }
  }

  // Print detailed statistics
  async printStatistics() {
    const totalProducts = await Product.countDocuments();
    const totalPrices = await ProductPrice.countDocuments();
    const categories = await Product.distinct('category');
    const stores = await ProductPrice.distinct('supermarket');

    logger.info('\n=== FINAL DATA SEEDING STATISTICS ===');
    logger.info(`Products Created: ${this.stats.productsCreated}`);
    logger.info(`Products Updated: ${this.stats.productsUpdated}`);
    logger.info(`Products Skipped: ${this.stats.productsSkipped}`);
    logger.info(`Prices Added: ${this.stats.pricesAdded}`);
    logger.info(`Prices Skipped: ${this.stats.pricesSkipped}`);
    logger.info(`Nutrition Records Processed: ${this.stats.nutritionDataProcessed}`);
    
    logger.info(`\nDatabase Totals:`);
    logger.info(`Total Products: ${totalProducts}`);
    logger.info(`Total Price Entries: ${totalPrices}`);
    logger.info(`Categories: ${categories.length}`);
    logger.info(`Stores: ${stores.length}`);

    // Store breakdown
    logger.info('\nPrices by Store:');
    for (const [storeName, count] of Object.entries(this.stats.storesPricesProcessed)) {
      if (count > 0) {
        logger.info(`  ${storeName}: ${count} price entries`);
      }
    }

    // Category breakdown
    logger.info('\nCategory Breakdown:');
    for (const category of categories) {
      const count = await Product.countDocuments({ category });
      logger.info(`  ${category}: ${count} products`);
    }

    if (this.stats.errors.length > 0) {
      logger.info(`\nErrors encountered: ${this.stats.errors.length}`);
      this.stats.errors.slice(0, 10).forEach((error, index) => {
        logger.error(`  ${index + 1}. ${error}`);
      });
      if (this.stats.errors.length > 10) {
        logger.info(`  ... and ${this.stats.errors.length - 10} more errors`);
      }
    }
  }
}

module.exports = FinalDataSeeder; 