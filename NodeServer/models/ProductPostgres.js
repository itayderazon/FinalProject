const pool = require('../config/database');

class Product {
  constructor(data) {
    this.id = data.id;
    this.item_code = data.item_code;
    this.name = data.name;
    this.name_en = data.name_en;
    this.description = data.description;
    this.brand = data.brand;
    this.category_id = data.category_id;
    this.subcategory_id = data.subcategory_id;
    this.size_amount = data.size_amount;
    this.size_unit = data.size_unit;
    this.nutrition = data.nutrition;
    this.allergen_ids = data.allergen_ids;
    this.images = data.images;
    this.tags = data.tags;
    this.can_include_in_menu = data.can_include_in_menu;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Find product by ID
  static async findById(id) {
    try {
      const result = await pool.query(`
        SELECT p.*, c.name_he as category_name, c.name_en as category_name_en,
               sc.name_he as subcategory_name, sc.name_en as subcategory_name_en
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
        WHERE p.id = $1 AND p.is_active = true
      `, [id]);
      
      return result.rows[0] ? new Product(result.rows[0]) : null;
    } catch (error) {
      console.error('Error finding product by ID:', error);
      throw error;
    }
  }

  // Find product by item code
  static async findByItemCode(itemCode) {
    try {
      const result = await pool.query(`
        SELECT p.*, c.name_he as category_name, c.name_en as category_name_en,
               sc.name_he as subcategory_name, sc.name_en as subcategory_name_en
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
        WHERE p.item_code = $1 AND p.is_active = true
      `, [itemCode]);
      
      return result.rows[0] ? new Product(result.rows[0]) : null;
    } catch (error) {
      console.error('Error finding product by item code:', error);
      throw error;
    }
  }

  // Find products by category
  static async findByCategory(categoryName, limit = 50, offset = 0) {
    try {
      const result = await pool.query(`
        SELECT p.*, c.name_he as category_name, c.name_en as category_name_en,
               sc.name_he as subcategory_name, sc.name_en as subcategory_name_en
        FROM products p
        JOIN categories c ON p.category_id = c.id
        LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
        WHERE c.name_he = $1 AND p.is_active = true
        ORDER BY p.name
        LIMIT $2 OFFSET $3
      `, [categoryName, limit, offset]);
      
      return result.rows.map(row => new Product(row));
    } catch (error) {
      console.error('Error finding products by category:', error);
      throw error;
    }
  }

  // Search products
  static async search(query, filters = {}) {
    try {
      let sql = `
        SELECT p.*, c.name_he as category_name, c.name_en as category_name_en,
               sc.name_he as subcategory_name, sc.name_en as subcategory_name_en,
               json_agg(
                 json_build_object(
                   'supermarket_id', s.id,
                   'supermarket_name', s.name,
                   'price', ph.price,
                   'currency', ph.currency,
                   'is_on_sale', ph.is_on_sale,
                   'sale_percentage', ph.sale_percentage,
                   'recorded_at', ph.recorded_at
                 ) ORDER BY ph.recorded_at DESC
               ) FILTER (WHERE ph.id IS NOT NULL) as prices,
               CASE 
                 WHEN COUNT(ph.id) > 0 THEN
                   json_build_object(
                     'minPrice', MIN(ph.price),
                     'maxPrice', MAX(ph.price),
                     'avgPrice', ROUND(AVG(ph.price)::numeric, 2),
                     'storeCount', COUNT(DISTINCT ph.supermarket_id)
                   )
                 ELSE NULL
               END as price_stats
        FROM products p
        JOIN categories c ON p.category_id = c.id
        LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
        LEFT JOIN price_history ph ON p.id = ph.product_id
        LEFT JOIN supermarkets s ON ph.supermarket_id = s.id
        WHERE p.is_active = true
      `;
      const params = [];

      // Text search
      if (query && query.trim()) {
        params.push(`%${query.trim()}%`);
        sql += ` AND p.name ILIKE $${params.length}`;
      }

      // Category filter
      if (filters.category_id) {
        params.push(filters.category_id);
        sql += ` AND p.category_id = $${params.length}`;
      } else if (filters.category) {
        params.push(filters.category);
        sql += ` AND c.name_he = $${params.length}`;
      }

      // Subcategory filter
      if (filters.subcategory_id) {
        params.push(filters.subcategory_id);
        sql += ` AND p.subcategory_id = $${params.length}`;
      }

      // Menu eligible filter
      if (filters.menu_eligible) {
        sql += ` AND p.can_include_in_menu = true`;
      }

      // Has nutrition data filter
      if (filters.has_nutrition) {
        sql += ` AND (p.nutrition->>'calories')::numeric > 0`;
      }

      // Allergen filter (exclude products with specified allergens)
      if (filters.exclude_allergens && Array.isArray(filters.exclude_allergens)) {
        for (const allergenId of filters.exclude_allergens) {
          params.push(allergenId);
          sql += ` AND NOT (p.allergen_ids @> ARRAY[$${params.length}])`;
        }
      }

      // Add GROUP BY clause
      sql += ` GROUP BY p.id, c.name_he, c.name_en, sc.name_he, sc.name_en`;

      // Sorting
      const sortBy = filters.sort_by || 'name';
      const sortOrder = filters.sort_order || 'ASC';
      sql += ` ORDER BY p.${sortBy} ${sortOrder}`;

      // Pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      params.push(limit, offset);
      sql += ` LIMIT $${params.length-1} OFFSET $${params.length}`;

      const result = await pool.query(sql, params);
      return result.rows.map(row => {
        const product = new Product(row);
        product.prices = row.prices || [];
        product.priceStats = row.price_stats;
        return product;
      });
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  // Get products with prices
  static async getProductsWithPrices(productIds) {
    try {
      const result = await pool.query(`
        SELECT 
          p.*,
          c.name_he as category_name,
          c.name_en as category_name_en,
          sc.name_he as subcategory_name,
          sc.name_en as subcategory_name_en,
          json_agg(
            json_build_object(
              'supermarket_id', s.id,
              'supermarket_name', s.name,
              'price', ph.price,
              'currency', ph.currency,
              'is_on_sale', ph.is_on_sale,
              'sale_percentage', ph.sale_percentage,
              'recorded_at', ph.recorded_at
            ) ORDER BY ph.recorded_at DESC
          ) FILTER (WHERE ph.id IS NOT NULL) as prices
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
        LEFT JOIN price_history ph ON p.id = ph.product_id
        LEFT JOIN supermarkets s ON ph.supermarket_id = s.id
        WHERE p.id = ANY($1) AND p.is_active = true
        GROUP BY p.id, c.name_he, c.name_en, sc.name_he, sc.name_en
        ORDER BY p.name
      `, [productIds]);
      
      return result.rows.map(row => {
        const product = new Product(row);
        product.prices = row.prices || [];
        return product;
      });
    } catch (error) {
      console.error('Error getting products with prices:', error);
      throw error;
    }
  }

  // Get latest prices for a product
  async getLatestPrices() {
    try {
      const result = await pool.query(`
        SELECT DISTINCT ON (ph.supermarket_id)
          s.name as supermarket_name,
          s.name_en as supermarket_name_en,
          ph.price,
          ph.currency,
          ph.is_on_sale,
          ph.sale_percentage,
          ph.recorded_at
        FROM price_history ph
        JOIN supermarkets s ON ph.supermarket_id = s.id
        WHERE ph.product_id = $1
        ORDER BY ph.supermarket_id, ph.recorded_at DESC
      `, [this.id]);
      
      return result.rows;
    } catch (error) {
      console.error('Error getting latest prices:', error);
      throw error;
    }
  }

  // Get menu eligible products
  static async getMenuEligible(limit = 100, offset = 0) {
    try {
      const result = await pool.query(`
        SELECT p.*, c.name_he as category_name, c.name_en as category_name_en,
               sc.name_he as subcategory_name, sc.name_en as subcategory_name_en
        FROM products p
        JOIN categories c ON p.category_id = c.id
        LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
        WHERE p.can_include_in_menu = true AND p.is_active = true
        ORDER BY p.name
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
      
      return result.rows.map(row => new Product(row));
    } catch (error) {
      console.error('Error getting menu eligible products:', error);
      throw error;
    }
  }

  // Get all categories
  static async getCategories() {
    try {
      const result = await pool.query(`
        SELECT c.*, COUNT(p.id) as product_count
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
        GROUP BY c.id
        ORDER BY c.name_he
      `);
      
      return result.rows;
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  }

  // Get subcategories by category
  static async getSubcategories(categoryId) {
    try {
      const result = await pool.query(`
        SELECT sc.*, COUNT(p.id) as product_count
        FROM subcategories sc
        LEFT JOIN products p ON sc.id = p.subcategory_id AND p.is_active = true
        WHERE sc.category_id = $1
        GROUP BY sc.id
        ORDER BY sc.name_he
      `, [categoryId]);
      
      return result.rows;
    } catch (error) {
      console.error('Error getting subcategories:', error);
      throw error;
    }
  }

  // Update product images
  async updateImages(images) {
    try {
      const result = await pool.query(`
        UPDATE products 
        SET images = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [JSON.stringify(images), this.id]);
      
      if (result.rows[0]) {
        this.images = result.rows[0].images;
        this.updated_at = result.rows[0].updated_at;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating product images:', error);
      throw error;
    }
  }

  // Count total products
  static async count(filters = {}) {
    try {
      let sql = `
        SELECT COUNT(*) 
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = true
      `;
      const params = [];

      if (filters.category_id) {
        params.push(filters.category_id);
        sql += ` AND p.category_id = $${params.length}`;
      } else if (filters.category) {
        params.push(filters.category);
        sql += ` AND c.name_he = $${params.length}`;
      }

      if (filters.menu_eligible) {
        sql += ` AND p.can_include_in_menu = true`;
      }

      const result = await pool.query(sql, params);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error counting products:', error);
      throw error;
    }
  }

  // Get nutrition summary
  getNutritionSummary() {
    if (!this.nutrition) return null;
    
    return {
      calories: this.nutrition.calories || 0,
      protein: this.nutrition.protein || 0,
      total_carbs: this.nutrition.total_carbs || 0,
      total_fat: this.nutrition.total_fat || 0,
      sodium: this.nutrition.sodium || 0
    };
  }

  // Check if product has complete nutrition data
  hasCompleteNutrition() {
    const nutrition = this.getNutritionSummary();
    return nutrition && nutrition.calories > 0;
  }

  // Get product display data
  toJSON() {
    return {
      id: this.id,
      item_code: this.item_code,
      name: this.name,
      description: this.description,
      brand: this.brand,
      category: {
        id: this.category_id,
        name: this.category_name,
        name_en: this.category_name_en
      },
      subcategory: this.subcategory_id ? {
        id: this.subcategory_id,
        name: this.subcategory_name,
        name_en: this.subcategory_name_en
      } : null,
      nutrition: this.getNutritionSummary(),
      allergen_ids: this.allergen_ids || [],
      images: this.images || {},
      tags: this.tags || [],
      can_include_in_menu: this.can_include_in_menu,
      prices: this.prices || [],
      priceStats: this.priceStats || null,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Product; 