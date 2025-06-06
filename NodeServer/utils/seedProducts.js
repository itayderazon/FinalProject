const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
const ProductPrice = require('../models/ProductPrice');
const logger = require('./logger');

// Function to normalize allergen names
function normalizeAllergens(allergens) {
  if (!allergens || !Array.isArray(allergens)) return [];
  
  const allergenMap = {
    'milk': 'milk',
    'dairy': 'milk',
    'eggs': 'eggs',
    'egg': 'eggs',
    'fish': 'fish',
    'shellfish': 'shellfish',
    'tree nuts': 'tree_nuts',
    'nuts': 'tree_nuts',
    'peanuts': 'peanuts',
    'peanut': 'peanuts',
    'wheat': 'wheat',
    'gluten': 'wheat',
    'soy': 'soy',
    'soya': 'soy',
    'sesame': 'sesame'
  };
  
  return allergens.map(allergen => {
    const normalized = allergen.toLowerCase().trim();
    return allergenMap[normalized] || normalized;
  }).filter(allergen => allergen);
}

// Function to extract brand from product name (basic implementation)
function extractBrand(productName) {
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
function determineMenuEligibility(rawProduct) {
  // Basic criteria for menu eligibility:
  // 1. Must have valid name
  // 2. Must be in a food category (exclude pharmacy, baby products that aren't food)
  // 3. Must have at least some nutrition information
  // 4. Must have reasonable calorie values
  
  if (!rawProduct.name || rawProduct.name.trim() === '') return false;
  
  // Non-food categories that should not be included in menus
  const nonFoodCategories = ['פארם ותינוקות'];
  const nonFoodSubcategories = [
    'מוצרי פארם', 'דאודורנט', 'שמפו, מרכך וטיפוח הגוף', 
    'סבונים', 'חד-פעמי ומתכלה', 'עטיפות, שקיות ותבניות'
  ];
  
  // Check category
  if (rawProduct.category && nonFoodCategories.includes(rawProduct.category)) {
    return false;
  }
  
  // Check subcategory
  if (rawProduct.subcategory && nonFoodSubcategories.includes(rawProduct.subcategory)) {
    return false;
  }
  
  // Must have at least calories information to be useful for menu planning
  if (!rawProduct.calories || rawProduct.calories <= 0) {
    return false;
  }
  
  // Special case: baby food in פארם ותינוקות but with subcategory מזון לתינוקות should be excluded from general menus
  if (rawProduct.category === 'פארם ותינוקות' && rawProduct.subcategory === 'מזון לתינוקות') {
    return false;
  }
  
  return true;
}

async function seedFromNutritionData() {
  try {
    // Try to read from different possible nutrition data files
    const possiblePaths = [
      path.join(__dirname, '../../PythonServer/data/nutrition_data.json'),
      path.join(__dirname, '../../PythonServer/data/nutrition_data1.json'),
      path.join(__dirname, '../../PythonServer/data/nutrition_data2.json'),
      path.join(__dirname, '../../PythonServer/data/nutrition_data3.json')
    ];
    
    // Valid food categories we care about
    const validCategories = [
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
    ];
    
    let nutritionData = [];
    
    for (const dataPath of possiblePaths) {
      if (fs.existsSync(dataPath)) {
        try {
          const fileData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
          if (Array.isArray(fileData)) {
            nutritionData = nutritionData.concat(fileData);
            logger.info(`Loaded ${fileData.length} products from ${path.basename(dataPath)}`);
          }
        } catch (fileError) {
          logger.warn(`Error reading ${dataPath}:`, fileError.message);
        }
      }
    }
    
    if (nutritionData.length === 0) {
      logger.error('No nutrition data files found');
      return;
    }
    
    logger.info(`Total nutrition data loaded: ${nutritionData.length} products`);
    
    let createdProducts = 0;
    let updatedProducts = 0;
    let skippedProducts = 0;
    let skippedInvalidCategories = 0;
    
    for (const rawProduct of nutritionData) {
      try {
        // Skip products without required data
        if (!rawProduct.item_code || !rawProduct.name) {
          skippedProducts++;
          continue;
        }
        
        // Skip products with invalid/non-food categories
        if (rawProduct.category && !validCategories.includes(rawProduct.category)) {
          skippedInvalidCategories++;
          continue;
        }
        
        // Check if product already exists
        let product = await Product.findOne({ item_code: rawProduct.item_code });
        
        const productData = {
          item_code: rawProduct.item_code,
          name: rawProduct.name.trim(),
          category: rawProduct.category || 'שימורים בישול ואפיה', // Default category
          subcategory: rawProduct.subcategory || null,
          brand: extractBrand(rawProduct.name),
          nutritionInfo: {
            calories: rawProduct.calories || null,
            protein: rawProduct.protein || null,
            carbs: rawProduct.carbs || null,
            fat: rawProduct.fat || null,
            sodium: rawProduct.sodium || null,
            serving_size: 100 // Default to 100g
          },
          allergens: normalizeAllergens(rawProduct.allergens),
          canIncludeInMenu: determineMenuEligibility(rawProduct),
          lastUpdated: new Date()
        };
        
        if (!product) {
          // Create new product
          product = new Product(productData);
          await product.save();
          createdProducts++;
          
          if (createdProducts % 100 === 0) {
            logger.info(`