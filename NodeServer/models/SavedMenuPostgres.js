const pool = require('../config/database');
const logger = require('../utils/logger');

class SavedMenu {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.name = data.name;
    this.description = data.description;
    this.total_calories = data.total_calories;
    this.total_protein = data.total_protein;
    this.total_carbs = data.total_carbs;
    this.total_fat = data.total_fat;
    this.generation_parameters = data.generation_parameters;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.items = data.items || [];
  }

  // Get all saved menus for a user with their items
  static async getUserMenus(userId) {
    try {
      const query = `
        SELECT 
          m.id,
          m.name,
          m.description,
          m.total_calories,
          m.total_protein,
          m.total_carbs,
          m.total_fat,
          m.generation_parameters,
          m.created_at,
          m.updated_at,
          COALESCE(
            json_agg(
              json_build_object(
                'id', i.id,
                'name', COALESCE(p.name, i.custom_food_name),
                'portion_grams', i.quantity,
                'category', p.category_id,
                'subcategory', p.subcategory_id,
                'item_code', p.item_code,
                'nutrition', json_build_object(
                  'calories', i.calories,
                  'protein', i.protein,
                  'carbs', i.carbs,
                  'fat', i.fat
                )
              ) ORDER BY i.display_order
            ) FILTER (WHERE i.id IS NOT NULL), 
            '[]'::json
          ) as items
        FROM saved_generated_menus m
        LEFT JOIN saved_generated_menu_items i ON m.id = i.saved_menu_id
        LEFT JOIN products p ON i.product_id = p.id
        WHERE m.user_id = $1
        GROUP BY m.id, m.name, m.description, m.total_calories, m.total_protein, 
                 m.total_carbs, m.total_fat, m.generation_parameters, m.created_at, m.updated_at
        ORDER BY m.created_at DESC
      `;

      const result = await pool.query(query, [userId]);
      
      return result.rows.map(row => {
        row.items = row.items || [];
        return new SavedMenu(row);
      });
    } catch (error) {
      logger.error('Error getting user saved menus:', error);
      throw error;
    }
  }

  // Create a new saved menu with items
  static async create(userId, menuData) {
    const { name, description, total_nutrition, items, generation_parameters } = menuData;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Insert the main menu record
      const menuInsertQuery = `
        INSERT INTO saved_generated_menus 
        (user_id, name, description, total_calories, total_protein, total_carbs, total_fat, generation_parameters)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, created_at
      `;

      const menuResult = await client.query(menuInsertQuery, [
        userId,
        name,
        description || null,
        Math.round(total_nutrition.calories || 0),
        parseFloat(total_nutrition.protein || 0),
        parseFloat(total_nutrition.carbs || 0),
        parseFloat(total_nutrition.fat || 0),
        JSON.stringify(generation_parameters || {})
      ]);

      const menuId = menuResult.rows[0].id;
      const createdAt = menuResult.rows[0].created_at;

      // Insert menu items
      if (items && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          
          const itemInsertQuery = `
            INSERT INTO saved_generated_menu_items
            (saved_menu_id, product_id, custom_food_name, quantity, unit, calories, protein, carbs, fat, display_order)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `;

          await client.query(itemInsertQuery, [
            menuId,
            item.product_id || null,
            item.name || item.custom_food_name,
            parseFloat(item.portion_grams || item.quantity || 100),
            item.unit || 'grams',
            parseFloat(item.nutrition?.calories || 0),
            parseFloat(item.nutrition?.protein || 0),
            parseFloat(item.nutrition?.carbs || 0),
            parseFloat(item.nutrition?.fat || 0),
            i + 1 // display_order
          ]);
        }
      }

      await client.query('COMMIT');

      return {
        menuId,
        createdAt
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating saved menu:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Check if a menu exists and belongs to a user
  static async existsForUser(menuId, userId) {
    try {
      const query = `
        SELECT id FROM saved_generated_menus 
        WHERE id = $1 AND user_id = $2
      `;
      
      const result = await pool.query(query, [menuId, userId]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error checking if menu exists for user:', error);
      throw error;
    }
  }

  // Delete a saved menu by ID and user ID
  static async deleteByIdAndUser(menuId, userId) {
    try {
      const query = `
        DELETE FROM saved_generated_menus 
        WHERE id = $1 AND user_id = $2
      `;
      
      const result = await pool.query(query, [menuId, userId]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting saved menu:', error);
      throw error;
    }
  }

  // Convert to JSON format expected by frontend
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      date: this.created_at,
      total_nutrition: {
        calories: parseFloat(this.total_calories) || 0,
        protein: parseFloat(this.total_protein) || 0,
        carbs: parseFloat(this.total_carbs) || 0,
        fat: parseFloat(this.total_fat) || 0
      },
      items: this.items || [],
      generation_parameters: this.generation_parameters || {},
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = SavedMenu; 